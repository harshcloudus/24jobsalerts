/**
 * bookmarks.js — saved_job_ids COOKIE bookmark toggle.
 * Byte-compatible with the Next.js frontend (doc §5.3): cookie name
 * `saved_job_ids`, value = JSON array of integer ids, path=/, 30-day max-age.
 * Both frontends can share the cookie on the same domain.
 *
 * Dispatches a `saved-jobs-changed` window event so the header badge updates
 * (mirrors savedJobsBroadcast.ts).
 */
(function () {
  "use strict";

  var COOKIE = "saved_job_ids";
  var MAX_AGE = 60 * 60 * 24 * 30; // 30 days

  function read() {
    var m = document.cookie.match(/(?:^|;\s*)saved_job_ids=([^;]*)/);
    if (!m) return [];
    try {
      var arr = JSON.parse(decodeURIComponent(m[1]));
      return Array.isArray(arr) ? arr.map(Number).filter(function (n) { return !isNaN(n); }) : [];
    } catch (e) {
      return [];
    }
  }

  function write(ids) {
    var uniq = Array.from(new Set(ids));
    var val = encodeURIComponent(JSON.stringify(uniq));
    document.cookie = COOKIE + "=" + val + ";path=/;max-age=" + MAX_AGE + ";SameSite=Lax";
    broadcast(uniq.length);
  }

  function broadcast(count) {
    window.dispatchEvent(new CustomEvent("saved-jobs-changed", { detail: { count: count } }));
  }

  function toggle(id) {
    id = Number(id);
    var ids = read();
    var i = ids.indexOf(id);
    if (i === -1) { ids.push(id); } else { ids.splice(i, 1); }
    write(ids);
    return ids.indexOf(id) !== -1;
  }

  function refreshButtons() {
    var ids = read();
    document.querySelectorAll("[data-save-job]").forEach(function (btn) {
      var saved = ids.indexOf(Number(btn.getAttribute("data-save-job"))) !== -1;
      btn.classList.toggle("is-saved", saved);
      var icon = btn.querySelector(".material-symbols-rounded");
      if (icon) icon.textContent = saved ? "bookmark" : "bookmark_border";
      var label = btn.querySelector("[data-save-label]");
      if (label) label.textContent = saved ? "Saved" : "Save job";
    });
  }

  function updateBadge(count) {
    var badge = document.querySelector("[data-saved-badge]");
    if (!badge) return;
    badge.textContent = count;
    if (count > 0) { badge.removeAttribute("hidden"); } else { badge.setAttribute("hidden", ""); }
  }

  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest("[data-save-job]");
    if (!btn) return;
    ev.preventDefault();
    ev.stopPropagation();
    var saved = toggle(btn.getAttribute("data-save-job"));
    btn.classList.toggle("is-saved", saved);
    var icon = btn.querySelector(".material-symbols-rounded");
    if (icon) icon.textContent = saved ? "bookmark" : "bookmark_border";
    var label = btn.querySelector("[data-save-label]");
    if (label) label.textContent = saved ? "Saved" : "Save job";

    // On the bookmarks page, removing a job drops its card.
    if (!saved && document.querySelector("[data-bookmarks-root]")) {
      var card = btn.closest("[data-job-card]");
      if (card) card.remove();
    }
  });

  window.addEventListener("saved-jobs-changed", function (e) {
    updateBadge(e.detail ? e.detail.count : read().length);
  });

  document.addEventListener("DOMContentLoaded", function () {
    refreshButtons();
    updateBadge(read().length);
  });
})();
