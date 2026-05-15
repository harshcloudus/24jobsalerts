export type AdType = "rewarded" | "interstitial";
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

const REWARDED_TIMEOUT_MS = 8_000;
const INTERSTITIAL_SAFETY_TIMEOUT_MS = 12_000;
const IS_DEV = process.env.NODE_ENV === "development";

function dbg(...args: unknown[]) {
  if (IS_DEV) console.log("[AdManager]", ...args);
}

declare global {
  interface Window {
    adBreak?: (config: Record<string, unknown>) => void;
    adsbygoogle?: unknown[];
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
      try { l(event); } catch { /* listener errors must not break ad flow */ }
    });
  }

  /**
   * Main entry point.
   * Flow: Rewarded Ad → (if unavailable) Interstitial Ad → resolve.
   * Guards against rapid double-clicks via isInProgress.
   */
  async showAdGate(): Promise<AdResult> {
    if (this._inProgress) {
      dbg("Ad already in progress — ignoring duplicate call");
      return { shown: false, rewarded: false, adType: null, error: "in_progress" };
    }

    this._inProgress = true;
    dbg("Ad gate flow started");

    try {
      const rewarded = await this._tryRewardedAd();
      if (rewarded.shown) {
        dbg("Rewarded ad completed — proceeding to content");
        return rewarded;
      }

      dbg("Rewarded ad unavailable → falling back to interstitial");
      return await this._showInterstitialAd();
    } finally {
      this._inProgress = false;
      dbg("Ad gate flow complete");
    }
  }

  private _tryRewardedAd(): Promise<AdResult> {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || typeof window.adBreak !== "function") {
        dbg("adBreak API not available — skipping rewarded ad");
        resolve({ shown: false, rewarded: false, adType: null, error: "api_unavailable" });
        return;
      }

      let settled = false;
      const settle = (result: AdResult) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(result);
        }
      };

      // Hard timeout — prevents blocking navigation if adBreak never fires
      const timer = setTimeout(() => {
        dbg("Rewarded ad timed out after", REWARDED_TIMEOUT_MS, "ms");
        this.emit("timeout", "rewarded");
        settle({ shown: false, rewarded: false, adType: "rewarded", error: "timeout" });
      }, REWARDED_TIMEOUT_MS);

      try {
        this.emit("loaded", "rewarded");

        window.adBreak!({
          type: "reward",
          name: "job-details-reward",
          beforeReward: (showAdFn: () => void) => {
            dbg("Rewarded: beforeReward — showing ad");
            clearTimeout(timer);
            this.emit("opened", "rewarded");
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
            dbg("Rewarded: afterAd");
            settle({ shown: true, rewarded: true, adType: "rewarded" });
          },
        });
      } catch (err) {
        dbg("Rewarded ad threw:", err);
        this.emit("error", "rewarded");
        settle({ shown: false, rewarded: false, adType: "rewarded", error: String(err) });
      }
    });
  }

  private _showInterstitialAd(): Promise<AdResult> {
    return new Promise((resolve) => {
      // Prefer native adBreak interstitial (Ad Placement API)
      if (typeof window !== "undefined" && typeof window.adBreak === "function") {
        let settled = false;
        const settle = (result: AdResult) => {
          if (!settled) {
            settled = true;
            clearTimeout(safetyTimer);
            resolve(result);
          }
        };

        // adBreakDone may never fire in some environments/ad-blockers
        const safetyTimer = setTimeout(() => {
          dbg("Interstitial: safety timeout — proceeding");
          this.emit("closed", "interstitial");
          settle({ shown: true, rewarded: false, adType: "interstitial" });
        }, INTERSTITIAL_SAFETY_TIMEOUT_MS);

        try {
          this.emit("loaded", "interstitial");
          window.adBreak!({
            type: "next",
            name: "job-details-interstitial",
            adBreakDone: (info: { breakStatus: string }) => {
              dbg("Interstitial adBreakDone:", info.breakStatus);
              this.emit("closed", "interstitial");
              settle({ shown: true, rewarded: false, adType: "interstitial" });
            },
          });
        } catch (err) {
          dbg("Interstitial adBreak threw:", err);
          this.emit("error", "interstitial");
          settle({ shown: false, rewarded: false, adType: "interstitial", error: String(err) });
        }

        return;
      }

      // Fallback: custom modal overlay (dispatched to AdGateModal component in layout)
      dbg("adBreak not available — using custom interstitial modal");
      this.emit("loaded", "interstitial");
      this.emit("opened", "interstitial");

      window.dispatchEvent(
        new CustomEvent<{ onClose: () => void }>("adgate:show-interstitial", {
          detail: {
            onClose: () => {
              this.emit("closed", "interstitial");
              resolve({ shown: true, rewarded: false, adType: "interstitial" });
            },
          },
        })
      );
    });
  }
}

export const adManager = AdManager.getInstance();
