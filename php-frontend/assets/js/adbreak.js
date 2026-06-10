/**
 * adbreak.js — navigateWithAdBreak() port (frontend lib/adBreak.ts).
 * Mirrors the Next.js behavior exactly:
 *   1. If a Google auto-ad vignette is already showing (#google_vignette),
 *      navigate directly without triggering another ad.
 *   2. Ignore duplicate clicks while a reward ad is in progress.
 *   3. Show a reward ad; when it is viewed or dismissed, navigate.
 *   4. If the reward ad did not show, fall back to a vignette interstitial
 *      ("start" placement), then navigate.
 * Core monetization (doc §5.3), NOT a bug. If AdSense adBreak is unavailable
 * it falls back to a plain navigation so links never break.
 *
 * NOTE (parity gap): the interstitial itself is rendered by Google's AdSense
 * adBreak JS. It cannot be reproduced in PHP — it is identical to the Next
 * limitation. Without the AdSense script loaded, this degrades to direct nav.
 */
(function () {
  "use strict";

  var AD_NAMES = ["game_start", "game_stop", "game_restart", "next_game"];
  var randomAdName = function () {
    return AD_NAMES[Math.floor(Math.random() * AD_NAMES.length)];
  };

  var rewardAdInProgress = false;

  // Google adds #google_vignette to the URL when a vignette (full-screen)
  // auto ad is active
  var isAutoAdShowing = function () {
    return window.location.hash === "#google_vignette";
  };

  window.navigateWithAdBreak = function (href) {
    if (!href) return;
    var go = function () { window.location.href = href; };

    // Auto ad is already visible — skip reward ad and navigate directly
    if (isAutoAdShowing()) {
      go();
      return;
    }

    // Reward ad already in progress — ignore duplicate click
    if (rewardAdInProgress) {
      rewardAdInProgress = false; // reset flag in case it was left stuck
      return;
    }

    if (typeof window.adBreak !== "function") {
      go();
      return;
    }

    rewardAdInProgress = true;
    try {
      window.adBreak({
        type: "reward",
        name: randomAdName(),
        beforeReward: function (showAdFn) { showAdFn(0); },
        adDismissed: function () { rewardAdInProgress = false; },
        adViewed: function () {},
        adBreakDone: function (info) {
          rewardAdInProgress = false;
          var status = info && info.breakStatus;
          if (status === "viewed" || status === "dismissed") {
            go();
          } else {
            // Reward ad not shown — try vignette interstitial instead
            if (typeof window.adBreak === "function") {
              window.adBreak({
                type: "start",
                name: randomAdName(),
                adBreakDone: function () { go(); },
              });
            } else {
              go();
            }
          }
        },
      });
    } catch (e) {
      rewardAdInProgress = false;
      go();
    }
  };
})();
