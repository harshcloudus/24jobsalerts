let rewardAdInProgress = false;

function isAutoAdShowing(): boolean {
  // Google adds #google_vignette to the URL when a vignette (full-screen) auto ad is active
  return typeof window !== "undefined" && window.location.hash === "#google_vignette";
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
    name: "game_start",
    beforeReward(showAdFn: (delay: number) => void) {
      console.log("Before reward callback, showing ad immediately.");
      showAdFn(0);
    },
    adDismissed() {
      console.log("Ad dismissed, showing alert and not navigating.");
      rewardAdInProgress = false;
      alert("⚠️ Please watch the full ad to play this game.");
    },
    adViewed() {
      console.log("Ad viewed, proceeding to navigate.");
    },
    adBreakDone(info: { breakStatus?: string }) {
      rewardAdInProgress = false;
      console.log("Ad break done with info:", info);
      if (info && info.breakStatus === "viewed") {
        console.log("Ad viewed, proceeding to navigate.");
        window.location.href = process.env.NEXT_PUBLIC_BASE_PATH + targetUrl;
      } else if (info && info.breakStatus === "dismissed") {
        console.log("Ad dismissed, showing alert and not navigating.");
        alert("⚠️ Please watch the full ad to play this game.");
      } else {
        console.log("Ad break done without clear status, proceeding to navigate.");
        window.location.href = process.env.NEXT_PUBLIC_BASE_PATH + targetUrl;
      }
    },
  });
}
