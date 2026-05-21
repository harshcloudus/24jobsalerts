const AD_NAMES = [
  "game_start",
  "game_stop",
  "game_restart",
  "next_game",
] as const;
const randomAdName = () =>
  AD_NAMES[Math.floor(Math.random() * AD_NAMES.length)];

let rewardAdInProgress = false;

function isAutoAdShowing(): boolean {
  // Google adds #google_vignette to the URL when a vignette (full-screen) auto ad is active
  return (
    typeof window !== "undefined" && window.location.hash === "#google_vignette"
  );
}

export function navigateWithAdBreak(targetUrl: string, fallback: () => void) {
  console.log("Navigating with ad break to", targetUrl);
  if (typeof window === "undefined") {
    fallback();
    return;
  }

  // Auto ad is already visible — skip reward ad and navigate directly
  console.log("Checking for auto ads...", isAutoAdShowing());
  if (isAutoAdShowing()) {
    fallback();
    return;
  }

  // Reward ad already in progress — ignore duplicate click
  console.log("Checking for rewardAdInProgress...", rewardAdInProgress);
  if (rewardAdInProgress) {
    rewardAdInProgress = false; // reset flag in case it was left stuck
    return;
  }

  const win = window as unknown as { adBreak?: (o: object) => void };
  if (typeof win.adBreak !== "function") {
    console.warn("adBreak API not available, navigating without ad...");
    fallback();
    return;
  }

  rewardAdInProgress = true;
  console.log("Triggering reward ad break for navigation to", targetUrl);
  win.adBreak({
    type: "reward",
    name: randomAdName(),
    beforeReward(showAdFn: (delay: number) => void) {
      console.log("Before reward callback, showing ad immediately.");
      showAdFn(0);
    },
    adDismissed() {
      console.log("Ad dismissed, showing alert and not navigating.");
      rewardAdInProgress = false;
    },
    adViewed() {
      console.log("Ad viewed, proceeding to navigate.");
    },
    adBreakDone(info: { breakStatus?: string }) {
      rewardAdInProgress = false;
      console.log("Ad break done with info:", info);
      const status = info?.breakStatus;
      if (status === "viewed" || status === "dismissed") {
        console.log("Reward ad shown, proceeding to navigate.");
        window.location.href = process.env.NEXT_PUBLIC_BASE_PATH + targetUrl;
      } else {
        // Reward ad not shown — try vignette interstitial instead
        console.log("Reward ad not shown, trying vignette ad...");
        if (typeof win.adBreak === "function") {
          win.adBreak({
            type: "next",
            name: randomAdName(),
            adBreakDone() {
              console.log("Vignette ad break done, navigating.");
              window.location.href =
                process.env.NEXT_PUBLIC_BASE_PATH + targetUrl;
            },
          });
        } else {
          window.location.href = process.env.NEXT_PUBLIC_BASE_PATH + targetUrl;
        }
      }
    },
  });
}
