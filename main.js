(function () {
  "use strict";

  var STORAGE_KEY = "lhh-portfolio-theme";
  var root = document.documentElement;
  var themeToggleBtn = document.getElementById("theme-toggle");
  var menuToggleBtn = document.getElementById("menu-toggle");
  var primaryNav = document.getElementById("primary-nav");

  /* ========================================================================
     1. Theme Management (Dark default, persisted in localStorage inside try/catch)
     ======================================================================== */

  function getStoredTheme() {
    try {
      var saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark") {
        return saved;
      }
    } catch (_err) {
      /* Ignore storage access errors (e.g. file:// restrictions or private mode) */
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
      var current = root.getAttribute("data-theme") === "light" ? "light" : "dark";
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
     3. Smooth Anchor Navigation & Placeholder Link Guard
     ======================================================================== */

  var prefersReducedMotion = false;
  if (typeof window.matchMedia === "function") {
    prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  }

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
          /* Ignore pushState restrictions on some file:// origins */
        }
      }
    });
  });

  /* ========================================================================
     4. Subtle Reveal-on-Scroll via IntersectionObserver Only
     ======================================================================== */

  var revealElements = document.querySelectorAll(".reveal");

  if (
    !prefersReducedMotion &&
    "IntersectionObserver" in window &&
    revealElements.length > 0
  ) {
    root.classList.add("js-enabled");

    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.1
      }
    );

    revealElements.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealElements.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }
})();
