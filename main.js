(function () {
  "use strict";

  var STORAGE_KEY = "lhh-portfolio-theme";
  var root = document.documentElement;
  var header = document.getElementById("top");
  var themeToggleBtn = document.getElementById("theme-toggle");
  var menuToggleBtn = document.getElementById("menu-toggle");
  var primaryNav = document.getElementById("primary-nav");
  var timelineEl = document.getElementById("experience-timeline");

  var prefersReducedMotion = false;
  if (typeof window.matchMedia === "function") {
    var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotion = motionQuery.matches;
    if (typeof motionQuery.addEventListener === "function") {
      motionQuery.addEventListener("change", function (e) {
        prefersReducedMotion = e.matches;
      });
    }
  }

  /* ========================================================================
     1. Theme Management (Dark default, persisted in localStorage)
     ======================================================================== */

  function getStoredTheme() {
    try {
      var saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark") {
        return saved;
      }
    } catch (_err) {
      /* Ignore storage access restrictions on file:// or private mode */
    }
    return "dark";
  }

  function saveTheme(theme) {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch (_err) {
      /* Ignore storage write errors */
    }
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (themeToggleBtn) {
      var nextTheme = theme === "dark" ? "light" : "dark";
      themeToggleBtn.setAttribute(
        "aria-label",
        "Switch to " + nextTheme + " theme"
      );
    }
  }

  applyTheme(getStoredTheme());

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", function () {
      var current =
        root.getAttribute("data-theme") === "light" ? "light" : "dark";
      var next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      saveTheme(next);
    });
  }

  /* ========================================================================
     2. Mobile Navigation Menu
     ======================================================================== */

  function setMenuState(isOpen) {
    if (!menuToggleBtn || !primaryNav) {
      return;
    }
    menuToggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    menuToggleBtn.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu"
    );
    if (isOpen) {
      primaryNav.classList.add("is-open");
    } else {
      primaryNav.classList.remove("is-open");
    }
  }

  if (menuToggleBtn && primaryNav) {
    menuToggleBtn.addEventListener("click", function () {
      var isExpanded = menuToggleBtn.getAttribute("aria-expanded") === "true";
      setMenuState(!isExpanded);
    });

    document.addEventListener("keydown", function (event) {
      if (
        event.key === "Escape" &&
        menuToggleBtn.getAttribute("aria-expanded") === "true"
      ) {
        setMenuState(false);
        menuToggleBtn.focus();
      }
    });

    document.addEventListener("click", function (event) {
      var isExpanded = menuToggleBtn.getAttribute("aria-expanded") === "true";
      if (!isExpanded) {
        return;
      }
      var target = event.target;
      if (
        target instanceof Node &&
        !primaryNav.contains(target) &&
        !menuToggleBtn.contains(target)
      ) {
        setMenuState(false);
      }
    });
  }

  /* ========================================================================
     3. Smooth Anchor Navigation
     ======================================================================== */

  var anchorLinks = document.querySelectorAll('a[href^="#"]');
  anchorLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {
      var href = link.getAttribute("href");
      if (!href || href === "#") {
        event.preventDefault();
        return;
      }

      var targetId = href.slice(1);
      var targetElement = document.getElementById(targetId);
      if (!targetElement) {
        return;
      }

      event.preventDefault();
      setMenuState(false);

      targetElement.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start"
      });

      if (window.history && typeof window.history.pushState === "function") {
        try {
          window.history.pushState(null, "", href);
        } catch (_err) {
          /* Ignore pushState restrictions on file:// origins */
        }
      }
    });
  });

  /* ========================================================================
     4. Scroll Progress Bar, Sticky Glass Header & Timeline Progress
     ======================================================================== */

  var navLinks = document.querySelectorAll(".nav-link[href^='#']");
  var trackedSections = [];
  navLinks.forEach(function (link) {
    var id = (link.getAttribute("href") || "").slice(1);
    var sec = id ? document.getElementById(id) : null;
    if (sec) {
      trackedSections.push({ id: id, el: sec, link: link });
    }
  });

  var scrollTicking = false;

  function updateScrollTelemetry() {
    scrollTicking = false;
    var scrollY = window.scrollY || window.pageYOffset || 0;
    var docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    var progress = docHeight > 0 ? Math.min(1, Math.max(0, scrollY / docHeight)) : 0;

    root.style.setProperty("--scroll-progress", progress.toFixed(4));

    if (header) {
      if (scrollY > 20) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
    }

    if (timelineEl) {
      var rect = timelineEl.getBoundingClientRect();
      var viewH = window.innerHeight || 1;
      var start = viewH * 0.78;
      var end = viewH * 0.25;
      var raw = (start - rect.top) / (rect.height + (start - end));
      var clamped = Math.min(1, Math.max(0.08, raw));
      timelineEl.style.setProperty("--timeline-progress", clamped.toFixed(4));
    }

    if (trackedSections.length > 0) {
      var activeId = "";
      var triggerLine = (window.innerHeight || 800) * 0.32;
      for (var i = 0; i < trackedSections.length; i++) {
        var sRect = trackedSections[i].el.getBoundingClientRect();
        if (sRect.top <= triggerLine) {
          activeId = trackedSections[i].id;
        }
      }
      for (var j = 0; j < trackedSections.length; j++) {
        if (trackedSections[j].id === activeId) {
          trackedSections[j].link.classList.add("is-active");
        } else {
          trackedSections[j].link.classList.remove("is-active");
        }
      }
    }
  }

  function requestScrollUpdate() {
    if (!scrollTicking) {
      scrollTicking = true;
      window.requestAnimationFrame(updateScrollTelemetry);
    }
  }

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate, { passive: true });
  updateScrollTelemetry();

  /* ========================================================================
     5. Metrics Count-Up Animation (Preserves HTML Numbers When JS Off / Reduced Motion)
     ======================================================================== */

  var metricValues = document.querySelectorAll(".metric-value[data-count-target]");

  function formatMetricNumber(value, decimals, useComma) {
    var fixed = value.toFixed(decimals);
    if (!useComma) {
      return fixed;
    }
    var parts = fixed.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }

  function animateMetric(el) {
    var finalText = el.getAttribute("data-final-text") || el.textContent.trim();
    var target = parseFloat(el.getAttribute("data-count-target") || "0");
    var prefix = el.getAttribute("data-count-prefix") || "";
    var suffix = el.getAttribute("data-count-suffix") || "";
    var decimals = parseInt(el.getAttribute("data-count-decimals") || "0", 10);
    var useComma = el.getAttribute("data-count-comma") === "true";

    if (isNaN(target) || prefersReducedMotion) {
      el.textContent = finalText;
      return;
    }

    var duration = 1100;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) {
        startTime = timestamp;
      }
      var elapsed = timestamp - startTime;
      var t = Math.min(1, elapsed / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      var current = target * eased;

      if (t < 1) {
        el.textContent =
          prefix + formatMetricNumber(current, decimals, useComma) + suffix;
        window.requestAnimationFrame(step);
      } else {
        el.textContent = finalText;
      }
    }

    window.requestAnimationFrame(step);
  }

  if (
    !prefersReducedMotion &&
    "IntersectionObserver" in window &&
    metricValues.length > 0
  ) {
    metricValues.forEach(function (el) {
      el.setAttribute("data-final-text", el.textContent.trim());
    });

    var metricsObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateMetric(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        threshold: 0.35
      }
    );

    metricValues.forEach(function (el) {
      metricsObserver.observe(el);
    });
  }

  /* ========================================================================
     6. Spotlight Project Cards (Cursor-Following Radial Glow)
     ======================================================================== */

  var spotlightCards = document.querySelectorAll(".spotlight-card");
  spotlightCards.forEach(function (card) {
    card.addEventListener("pointermove", function (event) {
      var rect = card.getBoundingClientRect();
      var x = event.clientX - rect.left;
      var y = event.clientY - rect.top;
      card.style.setProperty("--mx", x.toFixed(1) + "px");
      card.style.setProperty("--my", y.toFixed(1) + "px");
    });
  });

  /* ========================================================================
     7. Magnetic Primary & Action Buttons
     ======================================================================== */

  var magneticButtons = document.querySelectorAll(".magnetic-btn");
  magneticButtons.forEach(function (btn) {
    btn.addEventListener("pointermove", function (event) {
      if (prefersReducedMotion || event.pointerType === "touch") {
        return;
      }
      var rect = btn.getBoundingClientRect();
      var centerX = rect.left + rect.width / 2;
      var centerY = rect.top + rect.height / 2;
      var deltaX = (event.clientX - centerX) * 0.22;
      var deltaY = (event.clientY - centerY) * 0.28;
      var maxOffset = 7;
      var clampedX = Math.max(-maxOffset, Math.min(maxOffset, deltaX));
      var clampedY = Math.max(-maxOffset, Math.min(maxOffset, deltaY));
      btn.style.setProperty("--tx", clampedX.toFixed(2) + "px");
      btn.style.setProperty("--ty", clampedY.toFixed(2) + "px");
    });

    function resetMagnetic() {
      btn.style.setProperty("--tx", "0px");
      btn.style.setProperty("--ty", "0px");
    }

    btn.addEventListener("pointerleave", resetMagnetic);
    btn.addEventListener("blur", resetMagnetic);
  });

  /* ========================================================================
     8. Copy Email Button (Clipboard API with Text Selection Fallback)
     ======================================================================== */

  var copyEmailBtn = document.getElementById("copy-email-btn");
  var copyEmailLabel = document.getElementById("copy-email-label");
  var contactEmailText = document.getElementById("contact-email-text");
  var copyResetTimer = null;

  function selectEmailFallback() {
    if (!contactEmailText || typeof window.getSelection !== "function") {
      return;
    }
    try {
      var selection = window.getSelection();
      var range = document.createRange();
      range.selectNodeContents(contactEmailText);
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } catch (_err) {
      /* Ignore selection errors */
    }
  }

  function showCopiedFeedback() {
    if (!copyEmailLabel) {
      return;
    }
    copyEmailLabel.textContent = "Copied";
    if (copyResetTimer) {
      window.clearTimeout(copyResetTimer);
    }
    copyResetTimer = window.setTimeout(function () {
      copyEmailLabel.textContent = "Copy email";
      copyResetTimer = null;
    }, 1500);
  }

  if (copyEmailBtn) {
    copyEmailBtn.addEventListener("click", function () {
      var email =
        copyEmailBtn.getAttribute("data-email") ||
        "13charlottekatakuri@gmail.com";

      if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        navigator.clipboard
          .writeText(email)
          .then(function () {
            showCopiedFeedback();
          })
          .catch(function () {
            selectEmailFallback();
            showCopiedFeedback();
          });
      } else {
        selectEmailFallback();
        showCopiedFeedback();
      }
    });
  }
})();
