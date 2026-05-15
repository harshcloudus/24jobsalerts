/**
 * AdManager — singleton service for the job-card ad gate.
 *
 * Flow per official Google Ad Placement API docs:
 *   https://developers.google.com/ad-placement/apis
 *
 *   1. Google Rewarded Ad  (type: "reward")
 *      beforeReward → showAdFn() → adViewed / adDismissed → afterAd → adBreakDone
 *
 *   2. Google Interstitial Ad  (type: "next")
 *      beforeAd → ad shows → afterAd → adBreakDone
 *
 *   3. Custom AdSense modal  (fallback when Google has no fill)
 *
 * adBreakDone ALWAYS fires and is the single resolution point.
 * breakStatus: "viewed" | "dismissed" | "noAdPreloaded"
 */

export type AdType = "rewarded" | "interstitial" | "custom";
export type AdStatus =
  | "loaded"
  | "opened"
  | "reward_earned"
  | "closed"
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
  breakStatus?: string;
  error?: string;
}

type AdEventListener = (event: AdEvent) => void;

/** Safety timeout — fires if adBreakDone never fires (e.g. aggressive ad-blocker) */
const SAFETY_TIMEOUT_MS = 10_000;

const IS_DEV = process.env.NODE_ENV === "development";

function dbg(...args: unknown[]) {
  if (IS_DEV) console.log("[AdManager]", ...args);
}

declare global {
  interface Window {
    adBreak?: (config: Record<string, unknown>) => void;
    adConfig?: (config: Record<string, unknown>) => void;
    adsbygoogle?: unknown[];
    /**
     * Set to true inside adConfig onReady callback.
     * Only fires when adsbygoogle.js has replaced the bootstrap placeholder
     * with the real Ad Placement API (requires H5 Games Ads enabled in AdSense,
     * or data-adbreak-test="on" during development).
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
   * True only when adsbygoogle.js has loaded AND the Ad Placement API is ready.
   * False when H5 Games Ads is not enabled (falls through to custom modal instantly).
   */
  private _isApiReady(): boolean {
    return (
      typeof window !== "undefined" &&
      typeof window.adBreak === "function" &&
      window.__adBreakReady === true
    );
  }

  /**
   * Main entry — call on every job card click.
   * Resolves only after ad is fully closed or skipped.
   */
  async showAdGate(): Promise<AdResult> {
    if (this._inProgress) {
      dbg("In progress — ignoring duplicate call");
      return { shown: false, rewarded: false, adType: null, error: "in_progress" };
    }

    this._inProgress = true;
    dbg("Ad gate started | API ready:", this._isApiReady());

    try {
      // ── 1. Google Rewarded Ad ────────────────────────────────────────────
      const rewarded = await this._tryRewarded();
      if (rewarded.shown) return rewarded;

      // ── 2. Google Interstitial Ad ────────────────────────────────────────
      const interstitial = await this._tryInterstitial();
      if (interstitial.shown) return interstitial;

      // ── 3. Custom AdSense modal (always works) ───────────────────────────
      dbg("Google ads unavailable → custom modal");
      return await this._showCustomModal();
    } finally {
      this._inProgress = false;
      dbg("Ad gate complete");
    }
  }

  // ── Rewarded ─────────────────────────────────────────────────────────────

  private _tryRewarded(): Promise<AdResult> {
    return new Promise((resolve) => {
      if (!this._isApiReady()) {
        dbg("Rewarded: API not ready — skip");
        resolve({ shown: false, rewarded: false, adType: null, error: "api_not_ready" });
        return;
      }

      let settled = false;
      const settle = (result: AdResult) => {
        if (!settled) { settled = true; clearTimeout(safety); resolve(result); }
      };

      // adBreakDone may not fire if a heavy ad-blocker kills the request mid-flight
      const safety = setTimeout(() => {
        dbg("Rewarded: safety timeout");
        this.emit("timeout", "rewarded");
        settle({ shown: false, rewarded: false, adType: "rewarded", error: "timeout" });
      }, SAFETY_TIMEOUT_MS);

      this.emit("loaded", "rewarded");
      dbg("Rewarded: calling adBreak");

      try {
        window.adBreak!({
          type: "reward",
          name: "job-details-reward",

          // Ad is available — show it immediately (user opted in by clicking the card)
          beforeReward: (showAdFn: () => void) => {
            dbg("Rewarded: beforeReward — ad available, showing");
            this.emit("opened", "rewarded");
            showAdFn(); // MUST call this to display the ad (per Google docs)
          },

          // User watched the full ad
          adViewed: () => {
            dbg("Rewarded: adViewed — reward earned");
            this.emit("reward_earned", "rewarded");
          },

          // User closed the ad before it finished
          adDismissed: () => {
            dbg("Rewarded: adDismissed");
            this.emit("closed", "rewarded");
          },

          // Fires after adViewed OR adDismissed (resume any paused UI here)
          afterAd: () => {
            dbg("Rewarded: afterAd");
          },

          // Always fires last — single resolution point per Google docs
          adBreakDone: (info: { breakStatus: string }) => {
            dbg("Rewarded adBreakDone:", info.breakStatus);
            switch (info.breakStatus) {
              case "viewed":
                // Full ad watched — gate passed, reward earned
                settle({ shown: true, rewarded: true, adType: "rewarded", breakStatus: "viewed" });
                break;
              case "dismissed":
                // Ad shown but closed early — gate still passed (per requirement)
                this.emit("closed", "rewarded");
                settle({ shown: true, rewarded: false, adType: "rewarded", breakStatus: "dismissed" });
                break;
              default:
                // "noAdPreloaded" or any other — no ad was shown → try interstitial
                dbg("Rewarded: no fill →", info.breakStatus);
                settle({ shown: false, rewarded: false, adType: "rewarded", error: info.breakStatus });
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

  // ── Interstitial ─────────────────────────────────────────────────────────

  private _tryInterstitial(): Promise<AdResult> {
    return new Promise((resolve) => {
      if (!this._isApiReady()) {
        dbg("Interstitial: API not ready — skip");
        resolve({ shown: false, rewarded: false, adType: null, error: "api_not_ready" });
        return;
      }

      let settled = false;
      const settle = (result: AdResult) => {
        if (!settled) { settled = true; clearTimeout(safety); resolve(result); }
      };

      const safety = setTimeout(() => {
        dbg("Interstitial: safety timeout");
        this.emit("closed", "interstitial");
        settle({ shown: true, rewarded: false, adType: "interstitial", error: "timeout" });
      }, SAFETY_TIMEOUT_MS);

      this.emit("loaded", "interstitial");
      dbg("Interstitial: calling adBreak");

      try {
        window.adBreak!({
          type: "next",
          name: "job-details-interstitial",

          beforeAd: () => {
            dbg("Interstitial: beforeAd");
            this.emit("opened", "interstitial");
          },

          afterAd: () => {
            dbg("Interstitial: afterAd");
          },

          // Always fires last — single resolution point
          adBreakDone: (info: { breakStatus: string }) => {
            dbg("Interstitial adBreakDone:", info.breakStatus);
            this.emit("closed", "interstitial");
            if (info.breakStatus === "noAdPreloaded") {
              // No ad from Google → fall through to custom modal
              settle({ shown: false, rewarded: false, adType: "interstitial", error: "noAdPreloaded" });
            } else {
              // "viewed" or "dismissed" — ad was shown
              settle({ shown: true, rewarded: false, adType: "interstitial", breakStatus: info.breakStatus });
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

  // ── Custom AdSense modal (fallback) ───────────────────────────────────────

  private _showCustomModal(): Promise<AdResult> {
    return new Promise((resolve) => {
      dbg("Custom modal: dispatching event");
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
