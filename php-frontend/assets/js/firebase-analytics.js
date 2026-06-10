/**
 * firebase-analytics.js — Firebase ANALYTICS ONLY (doc §5.3 / §11).
 * No auth, no firestore. Inits via the Firebase CDN, guarded by isSupported().
 * Config is injected into window.JA_FIREBASE_CONFIG by the page (see main.js
 * bootstrap below is not needed — config comes from a global written in head).
 *
 * The config is rendered by config.php constants into a global so no build step
 * is required. If keys are empty (unset env), init is skipped silently.
 */
(function () {
  "use strict";

  var cfg = window.JA_FIREBASE_CONFIG;
  if (!cfg || !cfg.apiKey || !cfg.measurementId) return; // analytics not configured

  var APP = "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
  var ANALYTICS = "https://www.gstatic.com/firebasejs/12.13.0/firebase-analytics.js";

  import(APP)
    .then(function (appMod) {
      return import(ANALYTICS).then(function (anMod) {
        return anMod.isSupported().then(function (ok) {
          if (!ok) return;
          var app = appMod.initializeApp(cfg);
          anMod.getAnalytics(app);
        });
      });
    })
    .catch(function () {
      /* analytics best-effort; never block the page */
    });
})();
