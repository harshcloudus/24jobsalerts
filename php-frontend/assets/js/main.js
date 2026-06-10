/**
 * main.js — card click navigation through adBreak, newsletter AJAX, back-to-top.
 * Mirrors JobCard whole-card click + BackToTopButton.
 */
(function () {
  "use strict";

  // Whole-card click -> navigateWithAdBreak (monetized full-page nav, doc §5.3).
  document.addEventListener("click", function (ev) {
    if (ev.target.closest("[data-save-job]")) return;           // save btn handled in bookmarks.js
    var anchor = ev.target.closest("a");
    var card = ev.target.closest("[data-job-card]");
    if (!card) return;

    var href = card.getAttribute("data-href");
    if (!href) return;

    // If a real <a> inside the card was clicked, still route through adBreak.
    if (anchor && anchor.getAttribute("href")) {
      href = anchor.getAttribute("href");
    }
    ev.preventDefault();
    if (typeof window.navigateWithAdBreak === "function") {
      window.navigateWithAdBreak(href);
    } else {
      window.location.href = href;
    }
  });

  // Tile / combo-link click -> navigateWithAdBreak. Mirrors Next pages that
  // wrap navigation in adBreak: homepage tiles (page.tsx handleJobType /
  // handleQualification), /qualifications/ + /job-types/ index tiles, and
  // qualification-detail "Browse by sector" combo links.
  document.addEventListener("click", function (ev) {
    var link = ev.target.closest("[data-ad-nav]");
    if (!link) return;
    var href = link.getAttribute("href");
    if (!href) return;
    ev.preventDefault();
    if (typeof window.navigateWithAdBreak === "function") {
      window.navigateWithAdBreak(href);
    } else {
      window.location.href = href;
    }
  });

  // Newsletter AJAX (progressive enhancement; plain POST still works).
  // Replicates Next: button "…" while loading; inline status message with
  // success / exists / error styling.
  document.querySelectorAll("[data-newsletter-form]").forEach(function (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var input = form.querySelector('input[name="email"]');
      var btn = form.querySelector("button");
      var email = input ? input.value.trim() : "";
      if (!email) {
        setStatus(form, "Please enter your email.", "error");
        return;
      }
      var btnText = btn ? btn.textContent : "";
      if (btn) { btn.disabled = true; btn.textContent = "…"; }

      var body = new URLSearchParams();
      body.set("email", email);

      fetch(form.getAttribute("action"), {
        method: "POST",
        headers: { "X-Requested-With": "XMLHttpRequest", "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      })
        .then(function (r) { return r.json().then(function (d) { return { status: r.status, data: d }; }); })
        .then(function (res) {
          var d = res.data || {};
          if (res.status === 200 && d.ok) {
            if (d.created) { setStatus(form, "Subscribed — check your inbox.", "success"); if (input) input.value = ""; }
            else { setStatus(form, "You're already subscribed.", "exists"); }
          } else if (res.status === 400) {
            setStatus(form, "Subscription failed. Please try again.", "error");
          } else {
            setStatus(form, "Subscription failed. Please try again.", "error");
          }
        })
        .catch(function () { setStatus(form, "Network error. Please try again.", "error"); })
        .finally(function () { if (btn) { btn.disabled = false; btn.textContent = btnText; } });
    });
  });

  function setStatus(form, msg, kind) {
    // footer uses [data-newsletter-msg]; page newsletter-form uses .ja-note
    var box = form.parentElement.querySelector("[data-newsletter-msg]");
    if (box) {
      box.className = "mt-3 rounded-md px-3 py-2 text-xs font-medium " +
        (kind === "success" ? "bg-emerald-500/15 text-emerald-300"
          : kind === "exists" ? "bg-white/5 text-white/70"
          : "bg-red-500/15 text-red-300");
      box.textContent = msg;
      box.removeAttribute("hidden");
      return;
    }
    var note = form.parentElement.querySelector(".ja-note") || document.createElement("div");
    note.className = "ja-note " + (kind === "error" ? "is-err" : "is-ok");
    note.textContent = msg;
    if (!note.parentElement) form.parentElement.insertBefore(note, form);
  }

  // Mobile nav toggle (replicates Header.tsx isOpen state).
  var navToggle = document.querySelector("[data-nav-toggle]");
  var mobileMenu = document.querySelector("[data-mobile-menu]");
  var navIcon = document.querySelector("[data-nav-icon]");
  if (navToggle && mobileMenu) {
    var open = false;
    navToggle.addEventListener("click", function () {
      open = !open;
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (navIcon) navIcon.textContent = open ? "close" : "menu";
      if (open) {
        mobileMenu.style.maxHeight = "420px";
        mobileMenu.style.opacity = "1";
      } else {
        mobileMenu.style.maxHeight = "0";
        mobileMenu.style.opacity = "0";
      }
    });
  }

  // On-scroll nav drop shadow (Header.tsx scrolled state, scrollY > 8).
  var siteNav = document.querySelector("[data-site-nav]");
  if (siteNav) {
    var onScroll = function () {
      siteNav.style.boxShadow = window.scrollY > 8 ? "0 1px 12px rgba(0,30,43,0.06)" : "";
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // Back to top.
  var btt = document.querySelector("[data-back-to-top]");
  if (btt) {
    window.addEventListener("scroll", function () {
      btt.classList.toggle("is-visible", window.scrollY > 600);
    });
    btt.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  }
})();
