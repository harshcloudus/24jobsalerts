/**
 * adbreak.js — navigateWithAdBreak() port (frontend lib/adBreak.ts).
 * Shows an AdSense reward/vignette interstitial, then hard-navigates.
 * Core monetization (doc §5.3), NOT a bug. If AdSense adBreak is unavailable
 * it falls back to a plain navigation so links never break.
 *
 * NOTE (parity gap): the interstitial itself is rendered by Google's AdSense
 * adBreak JS. It cannot be reproduced in PHP — it is identical to the Next
 * limitation. Without the AdSense script loaded, this degrades to direct nav.
 */
(function () {
  "use strict";

  window.navigateWithAdBreak = function (href) {
    if (!href) return;
    var go = function () { window.location.href = href; };

    try {
      if (typeof window.adBreak === "function") {
        var done = false;
        var finish = function () { if (!done) { done = true; go(); } };
        // safety timeout so navigation always happens
        var t = setTimeout(finish, 2500);
        window.adBreak({
          type: "next",
          name: "nav-interstitial",
          beforeAd: function () {},
          afterAd: function () {},
          adBreakDone: function () { clearTimeout(t); finish(); },
        });
        return;
      }
    } catch (e) {
      /* fall through to direct nav */
    }
    go();
  };
})();
