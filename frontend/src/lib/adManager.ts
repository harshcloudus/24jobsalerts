export type AdType = "rewarded" | "interstitial" | "custom";
export type AdStatus =
  | "loaded"
  | "failed"
  | "opened"
  | "closed"
  | "reward_earned"
  | "timeout"
  | "error";

export interface AdEvent {
  type: AdStatus;
  adType: AdType;
  timestamp: number;
}

export interface AdResult {
  shown: boolean;
  rewarded: boolean;
  adType: AdType | null;
  error?: string;
}

type AdEventListener = (event: AdEvent) => void;

// Timeout for rewarded ad to call beforeReward — if it never fires, no fill
const REWARDED_TIMEOUT_MS = 6_000;
// Safety net in case adBreakDone never fires (e.g. ad-blocker mid-session)
const INTERSTITIAL_SAFETY_MS = 12_000;

const IS_DEV = process.env.NODE_ENV === "development";

function dbg(...args: unknown[]) {
  if (IS_DEV) console.log("[AdManager]", ...args);
}

// breakStatus values that mean "no ad was served"
const NO_FILL_STATUSES = new Set([
  "noAdPreloaded",
  "frequencyCapped",
  "notReady",
  "error",
  "ignored",
  "timeout",
]);

declare global {
  interface Window {
    adBreak?: (config: Record<string, unknown>) => void;
    adConfig?: (config: Record<string, unknown>) => void;
    adsbygoogle?: unknown[];
    /**
     * Set to true by the adConfig onReady callback only when adsbygoogle.js
     * has replaced the bootstrap placeholder with the real Ad Placement API.
     * When H5 Games Ads is NOT enabled this stays undefined/false and we skip
     * directly to the custom modal fallback.
     */
    __adBreakReady?: boolean;
  }
}

class AdManager {
  private static _instance: AdManager;
  private _inProgress = false;
  private _listeners: Set<AdEventListener> = new Set();

  private constructor() {}

  static getInstance(): AdManager {
    if (!AdManager._instance) AdManager._instance = new AdManager();
    return AdManager._instance;
  }

  get isInProgress(): boolean {
    return this._inProgress;
  }

  /** Subscribe to ad lifecycle events. Returns an unsubscribe function. */
  on(listener: AdEventListener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  private emit(type: AdStatus, adType: AdType): void {
    const event: AdEvent = { type, adType, timestamp: Date.now() };
    dbg("emit", event);
    this._listeners.forEach((l) => {
      try { l(event); } catch { /* never let listener errors break ad flow */ }
    });
  }

  /**
   * Returns true only when adsbygoogle.js has loaded AND Google has replaced
   * our bootstrap placeholder with the real Ad Placement API implementation.
   * This is false when H5 Games Ads is not enabled on the AdSense account.
   */
  private _isApiReady(): boolean {
    return (
      typeof window !== "undefined" &&
      typeof window.adBreak === "function" &&
      window.__adBreakReady === true
    );
  }

  /**
   * Main entry point — call on every job card click.
   *
   * Flow:
   *   1. Google Rewarded Ad (requires H5 Games Ads enabled in AdSense)
   *   2. Google Interstitial Ad (requires H5 Games Ads enabled in AdSense)
   *   3. Custom AdSense display modal (always works as final fallback)
   */
  async showAdGate(): Promise<AdResult> {
    if (this._inProgress) {
      dbg("Ad already in progress — ignoring duplicate call");
      return { shown: false, rewarded: false, adType: null, error: "in_progress" };
    }

    this._inProgress = true;
    dbg("Ad gate flow started, API ready:", this._isApiReady());

    try {
      // ── Step 1: Google Rewarded ───────────────────────────────────────
      const rewarded = await this._tryRewardedAd();
      if (rewarded.shown) {
        dbg("Rewarded ad completed — navigate");
        return rewarded;
      }

      // ── Step 2: Google Interstitial ───────────────────────────────────
      const interstitial = await this._tryGoogleInterstitial();
      if (interstitial.shown) {
        dbg("Google interstitial completed — navigate");
        return interstitial;
      }

      // ── Step 3: Custom AdSense modal fallback ─────────────────────────
      dbg("Google ads unavailable — showing custom modal");
      return await this._showCustomModal();
    } finally {
      this._inProgress = false;
      dbg("Ad gate flow complete");
    }
  }

  // ── Rewarded Ad ─────────────────────────────────────────────────────────

  private _tryRewardedAd(): Promise<AdResult> {
    return new Promise((resolve) => {
      if (!this._isApiReady()) {
        dbg("API not ready — skipping rewarded ad");
        resolve({ shown: false, rewarded: false, adType: null, error: "api_not_ready" });
        return;
      }

      let adWasShown = false; // true only when beforeReward fires (real fill)
      let settled = false;
      const settle = (result: AdResult) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(result);
        }
      };

      // If beforeReward never fires the slot had no fill
      const timer = setTimeout(() => {
        dbg("Rewarded: timeout — no fill");
        this.emit("timeout", "rewarded");
        settle({ shown: false, rewarded: false, adType: "rewarded", error: "no_fill" });
      }, REWARDED_TIMEOUT_MS);

      try {
        this.emit("loaded", "rewarded");

        window.adBreak!({
          type: "reward",
          name: "job-details-reward",
          beforeReward: (showAdFn: () => void) => {
            // An ad is available — show it
            adWasShown = true;
            clearTimeout(timer);
            this.emit("opened", "rewarded");
            dbg("Rewarded: beforeReward — ad available, showing");
            showAdFn();
          },
          adViewed: () => {
            dbg("Rewarded: adViewed — reward earned");
            this.emit("reward_earned", "rewarded");
          },
          adDismissed: () => {
            dbg("Rewarded: dismissed without watching");
            this.emit("closed", "rewarded");
          },
          afterAd: () => {
            dbg("Rewarded: afterAd, adWasShown =", adWasShown);
            this.emit("closed", "rewarded");
            if (adWasShown) {
              // Ad was shown (viewed or dismissed) — gate passed
              settle({ shown: true, rewarded: true, adType: "rewarded" });
            } else {
              // afterAd fired without beforeReward = no fill
              settle({ shown: false, rewarded: false, adType: "rewarded", error: "no_fill" });
            }
          },
        });
      } catch (err) {
        dbg("Rewarded: threw —", err);
        this.emit("error", "rewarded");
        settle({ shown: false, rewarded: false, adType: "rewarded", error: String(err) });
      }
    });
  }

  // ── Google Interstitial ──────────────────────────────────────────────────

  private _tryGoogleInterstitial(): Promise<AdResult> {
    return new Promise((resolve) => {
      if (!this._isApiReady()) {
        dbg("API not ready — skipping Google interstitial");
        resolve({ shown: false, rewarded: false, adType: null, error: "api_not_ready" });
        return;
      }

      let settled = false;
      const settle = (result: AdResult) => {
        if (!settled) {
          settled = true;
          clearTimeout(safetyTimer);
          resolve(result);
        }
      };

      // Safety net — adBreakDone may never fire if an ad-blocker kills mid-flight
      const safetyTimer = setTimeout(() => {
        dbg("Interstitial: safety timeout");
        this.emit("closed", "interstitial");
        settle({ shown: true, rewarded: false, adType: "interstitial" });
      }, INTERSTITIAL_SAFETY_MS);

      try {
        this.emit("loaded", "interstitial");

        window.adBreak!({
          type: "next",
          name: "job-details-interstitial",
          adBreakDone: (info: { breakStatus: string }) => {
            dbg("Interstitial adBreakDone:", info.breakStatus);
            this.emit("closed", "interstitial");

            if (NO_FILL_STATUSES.has(info.breakStatus)) {
              // Google had no ad to serve → fall through to custom modal
              dbg("Interstitial no fill:", info.breakStatus);
              settle({ shown: false, rewarded: false, adType: "interstitial", error: info.breakStatus });
            } else {
              // Ad was shown (viewed or dismissed)
              settle({ shown: true, rewarded: false, adType: "interstitial" });
            }
          },
        });
      } catch (err) {
        dbg("Interstitial: threw —", err);
        this.emit("error", "interstitial");
        settle({ shown: false, rewarded: false, adType: "interstitial", error: String(err) });
      }
    });
  }

  // ── Custom AdSense Display Modal (always-available fallback) ─────────────

  private _showCustomModal(): Promise<AdResult> {
    return new Promise((resolve) => {
      dbg("Custom modal: showing");
      this.emit("loaded", "custom");
      this.emit("opened", "custom");

      window.dispatchEvent(
        new CustomEvent<{ onClose: () => void }>("adgate:show-interstitial", {
          detail: {
            onClose: () => {
              this.emit("closed", "custom");
              resolve({ shown: true, rewarded: false, adType: "custom" });
            },
          },
        })
      );
    });
  }
}

export const adManager = AdManager.getInstance();
