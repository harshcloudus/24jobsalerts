/**
 * jobs-app.js — client-side job listing renderer. Replicates the Next.js CSR
 * pages (all-jobs / latest-jobs / search / qualifications[slug] / job-types[slug]
 * / bookmarks): fetch via the same-origin proxy, show skeleton cards while
 * loading, render JobCard markup byte-identical to JobCard.tsx, paginate with
 * the circle prev/next control, smooth-scroll on page change.
 *
 * A page opts in by setting window.JA_LISTING = {...} before this script runs;
 * see the *.php files for the per-page config.
 */
(function () {
  "use strict";

  var BASE = window.JA_BASE_PATH || "";
  var PROXY = BASE + "/api-proxy.php";
  var COOKIE = "saved_job_ids";

  // ---- saved ids cookie (shared format with bookmarks.js) ----
  function readSaved() {
    var m = document.cookie.match(/(?:^|;\s*)saved_job_ids=([^;]*)/);
    if (!m) return [];
    try {
      var a = JSON.parse(decodeURIComponent(m[1]));
      return Array.isArray(a) ? a.map(Number).filter(function (n) { return !isNaN(n); }) : [];
    } catch (e) { return []; }
  }
  function writeSaved(ids) {
    var uniq = Array.from(new Set(ids));
    document.cookie = COOKIE + "=" + encodeURIComponent(JSON.stringify(uniq)) + ";path=/;max-age=" + 60 * 60 * 24 * 30 + ";SameSite=Lax";
    window.dispatchEvent(new CustomEvent("saved-jobs-changed", { detail: { count: uniq.length } }));
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function api(path, params) {
    var q = new URLSearchParams();
    q.set("path", path);
    Object.keys(params || {}).forEach(function (k) {
      if (params[k] !== undefined && params[k] !== null && params[k] !== "") q.set(k, params[k]);
    });
    return fetch(PROXY + "?" + q.toString()).then(function (r) {
      if (!r.ok) throw new Error("api " + r.status);
      return r.json();
    });
  }

  // ---- JobCard.tsx ports ----
  function buildSlug(title, id) {
    var base = (title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return "/jobs/" + (base || "job") + "-" + id;
  }
  function employerShort(title) {
    var clean = (title || "").trim();
    var first = clean.split(/[\s\-–]/)[0] || "";
    if (/^[A-Z]{2,5}$/.test(first)) return first.slice(0, 3);
    var words = clean.split(/\s+/).filter(Boolean);
    return words.slice(0, 2).map(function (w) { return (w[0] || "").toUpperCase(); }).join("") || "J";
  }
  function relativeDate(dateStr) {
    if (!dateStr) return "";
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    var diff = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (diff < 0) return "";
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return diff + "d ago";
    if (diff < 30) return Math.floor(diff / 7) + "w ago";
    return dateStr;
  }

  // exact JobCard.tsx markup
  function jobCardHTML(job, opts) {
    opts = opts || {};
    var showBookmark = !!opts.showBookmark;
    var savedIds = opts.savedIds || [];
    var title = job.title || "Untitled role";
    var shortTitle = title.length > 140 ? title.slice(0, 137) + "…" : title;
    var shortname = employerShort(title);
    var jobType = job.job_type || "";
    var qual = job.qualification || "";
    var salary = job.salary || "";
    var lastDate = job.last_date || "";
    var postedDate = job.posted_date ? relativeDate(job.posted_date) : "";
    var href = BASE + buildSlug(title, job.id);
    var isSaved = savedIds.indexOf(job.id) !== -1;

    var h = '<article class="job-card" role="button" tabindex="0" data-job-card data-href="' + esc(href) + '" style="-webkit-tap-highlight-color:transparent;">';
    h += '<div class="job-card-header">';
    h += '<div class="job-employer-mark" aria-hidden="true">' + esc(shortname) + "</div>";
    if (showBookmark) {
      h += '<button class="job-bookmark-btn' + (isSaved ? " saved" : "") + '" type="button" data-save-job="' + job.id + '" aria-label="' + (isSaved ? "Remove bookmark" : "Save job") + '">';
      h += '<span class="material-symbols-rounded" style="font-size:18px;font-variation-settings:' + (isSaved ? "'FILL' 1" : "'FILL' 0") + ';">bookmark</span></button>';
    }
    h += "</div>";
    h += '<h3 class="job-card-title">' + esc(shortTitle) + "</h3>";
    h += '<div class="job-meta-row">';
    if (salary) h += '<span class="job-meta-item"><span class="material-symbols-rounded">payments</span><span>' + esc(salary) + "</span></span>";
    else if (jobType) h += '<span class="job-meta-item"><span class="material-symbols-rounded">work</span><span>' + esc(jobType) + "</span></span>";
    if (postedDate) h += '<span class="job-meta-item"><span class="material-symbols-rounded">schedule</span><span>Posted ' + esc(postedDate) + "</span></span>";
    else if (qual) h += '<span class="job-meta-item"><span class="material-symbols-rounded">school</span><span>' + esc(qual) + "</span></span>";
    h += "</div>";
    h += '<div class="job-card-tags">';
    if (jobType) h += '<span class="job-tag">' + esc(jobType) + "</span>";
    if (qual) h += '<span class="job-tag">' + esc(qual) + "</span>";
    h += "</div>";
    h += '<div class="job-card-footer">';
    if (lastDate) h += '<span class="job-deadline"><span class="material-symbols-rounded">calendar_today</span>Apply by ' + esc(lastDate) + "</span>";
    else h += "<span></span>";
    h += '<a href="' + esc(href) + '" class="job-card-apply" data-card-link>Read more <span class="material-symbols-rounded">arrow_forward</span></a>';
    h += "</div></article>";
    return h;
  }

  // skeleton card (matches Next: card-base p-5 space-y-3 + skeleton bars)
  function skeletonHTML(n, iconSize) {
    var icon = iconSize || "h-11 w-11";
    var s = "";
    for (var i = 0; i < n; i++) {
      s += '<div class="card-base p-5 space-y-3">' +
        '<div class="skeleton ' + icon + ' rounded-lg"></div>' +
        '<div class="skeleton h-4 w-3/4 rounded"></div>' +
        '<div class="skeleton h-3 w-1/2 rounded"></div>' +
        '<div class="skeleton h-3 w-2/3 rounded"></div></div>';
    }
    return s;
  }

  // circle pagination (Next markup)
  function paginationHTML(page, totalPages) {
    if (totalPages <= 1) return "";
    var prevDis = page <= 1, nextDis = page >= totalPages;
    function btn(dir, disabled, icon) {
      var cls = "w-10 h-10 rounded-full border border-hairline-strong text-ink hover:bg-surface transition-colors flex items-center justify-center shrink-0" + (disabled ? " opacity-30 cursor-not-allowed" : "");
      return '<button type="button" data-page-' + dir + (disabled ? " disabled" : "") + ' class="' + cls + '" aria-label="' + (dir === "prev" ? "Previous" : "Next") + ' page"><span class="material-symbols-rounded" style="font-size:20px;">' + icon + "</span></button>";
    }
    return '<div class="pagination-row mt-10 sm:mt-12 flex justify-center items-center gap-2 sm:gap-3 flex-wrap">' +
      btn("prev", prevDis, "chevron_left") +
      '<span class="px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium text-text-body bg-surface border border-hairline whitespace-nowrap">Page ' + page + " of " + totalPages + "</span>" +
      btn("next", nextDis, "chevron_right") + "</div>";
  }

  function emptyHTML(title, sub) {
    return '<div class="col-span-full card-base text-center py-16 text-text-muted">' +
      '<div class="w-12 h-12 rounded-full bg-surface mx-auto mb-3 flex items-center justify-center">' +
      '<span class="material-symbols-rounded text-text-muted" style="font-size:22px;">search_off</span></div>' +
      '<p class="font-medium text-ink mb-1">' + esc(title) + "</p>" +
      '<p class="text-sm">' + esc(sub) + "</p></div>";
  }

  // ---- main controller ----
  function JobsApp(cfg) {
    this.cfg = cfg;
    this.grid = document.querySelector(cfg.gridSelector);
    this.pager = document.querySelector(cfg.pagerSelector);
    this.subEl = cfg.subSelector ? document.querySelector(cfg.subSelector) : null;
    this.headEl = cfg.headSelector ? document.querySelector(cfg.headSelector) : null;
    var qp = parseInt(new URLSearchParams(window.location.search).get("page"), 10);
    this.page = qp && qp > 0 ? qp : 1;
    this.savedIds = readSaved();
    this.bind();
    this.load(this.page, false);
  }
  JobsApp.prototype.bind = function () {
    var self = this;
    document.addEventListener("click", function (ev) {
      var save = ev.target.closest("[data-save-job]");
      if (save && self.grid && self.grid.contains(save)) {
        ev.preventDefault(); ev.stopPropagation();
        var id = Number(save.getAttribute("data-save-job"));
        var i = self.savedIds.indexOf(id);
        if (i === -1) self.savedIds.push(id); else self.savedIds.splice(i, 1);
        writeSaved(self.savedIds);
        self.render();
        return;
      }
      var prev = ev.target.closest("[data-page-prev]");
      var next = ev.target.closest("[data-page-next]");
      if (prev && !prev.disabled) { self.go(self.page - 1); }
      if (next && !next.disabled) { self.go(self.page + 1); }
    });
  };
  JobsApp.prototype.go = function (p) {
    if (p < 1 || p > this.totalPages) return;
    var u = new URL(window.location.href);
    if (p > 1) u.searchParams.set("page", p); else u.searchParams.delete("page");
    window.location.href = u.href;
  };
  JobsApp.prototype.load = function (page, isPageChange) {
    var self = this;
    this.page = page;
    this.loading = true;
    if (this.subEl && this.cfg.subLoading) this.subEl.textContent = this.cfg.subLoading;
    if (this.grid) this.grid.innerHTML = skeletonHTML(6, this.cfg.skeletonIcon);
    if (this.pager) this.pager.innerHTML = "";

    var params = Object.assign({ page: page, page_size: this.cfg.pageSize }, this.cfg.params || {});
    api("/api/jobs", params).then(function (data) {
      self.loading = false;
      self.jobs = data.items || [];
      self.total = data.total || 0;
      self.totalPages = Math.max(1, Math.ceil(self.total / self.cfg.pageSize));
      self.render();
    }).catch(function () {
      self.loading = false;
      self.jobs = []; self.total = 0; self.totalPages = 1;
      self.render();
    });
  };
  JobsApp.prototype.render = function () {
    var self = this;
    if (this.subEl && this.cfg.subDone) this.subEl.textContent = this.cfg.subDone(this.total);
    if (this.headEl && this.cfg.headDone) this.headEl.textContent = this.cfg.headDone(this.total);
    if (this.grid) {
      if (!this.jobs || this.jobs.length === 0) {
        this.grid.innerHTML = emptyHTML(this.cfg.emptyTitle || "No jobs found", this.cfg.emptySub || "Try a different keyword or clear the filter.");
      } else {
        this.grid.innerHTML = this.jobs.map(function (j) {
          return jobCardHTML(j, { showBookmark: self.cfg.showBookmark, savedIds: self.savedIds });
        }).join("");
      }
    }
    if (this.pager) this.pager.innerHTML = paginationHTML(this.page, this.totalPages);
  };

  // ---- bookmarks page loader (fetch each saved id) ----
  function loadBookmarks(cfg) {
    var grid = document.querySelector(cfg.gridSelector);
    var sub = document.querySelector(cfg.subSelector);
    var ids = readSaved();
    if (sub) sub.textContent = "Loading saved jobs…";
    if (grid) grid.innerHTML = skeletonHTML(3, "h-11 w-11");

    if (ids.length === 0) {
      if (sub) sub.textContent = "No jobs saved yet.";
      if (grid) grid.innerHTML = cfg.emptyHTML;
      return;
    }
    Promise.all(ids.map(function (id) {
      return api("/api/jobs/" + id, {}).catch(function () { return null; });
    })).then(function (list) {
      var jobs = list.filter(Boolean);
      if (sub) sub.textContent = jobs.length === 0 ? "No jobs saved yet." : (jobs.length + " job" + (jobs.length === 1 ? "" : "s") + " bookmarked in this browser.");
      if (grid) {
        grid.innerHTML = jobs.length === 0 ? cfg.emptyHTML
          : '<div class="job-grid">' + jobs.map(function (j) { return jobCardHTML(j, { showBookmark: false }); }).join("") + "</div>";
      }
    });
  }

  window.JobsApp = JobsApp;
  window.JA_loadBookmarks = loadBookmarks;
  window.JA_jobCardHTML = jobCardHTML;
  window.JA_skeletonHTML = skeletonHTML;
  window.JA_relativeDate = relativeDate;
  window.JA_api = api;

  // auto-init from page config
  document.addEventListener("DOMContentLoaded", function () {
    if (window.JA_LISTING) new JobsApp(window.JA_LISTING);
    if (window.JA_BOOKMARKS) loadBookmarks(window.JA_BOOKMARKS);
  });
})();
