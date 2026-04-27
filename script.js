/* ============================================================
   WebWhisper · script.js
   Hamburger Menu · Algorithm Selector · Header Scroll
   ============================================================ */

(function () {
  'use strict';

  /* ─── DOM References ─── */
  const hamburger = document.getElementById('hamburger');
  const navMenu   = document.getElementById('nav-menu');
  const siteHeader = document.getElementById('site-header');
  const navLinks   = document.querySelectorAll('.nav-link');
  const algoTabs   = document.querySelectorAll('.algo-tab');
  const feedPanels = document.querySelectorAll('.feed-panel');

  /* ──────────────────────────────────────────
     1. Hamburger Menu Toggle
  ────────────────────────────────────────── */
  function openMenu() {
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    navMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    navMenu.classList.remove('open');
    document.body.style.overflow = '';
  }

  function toggleMenu() {
    const isOpen = hamburger.classList.contains('open');
    isOpen ? closeMenu() : openMenu();
  }

  hamburger.addEventListener('click', toggleMenu);

  /* Close menu when a nav link is clicked (mobile) */
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      closeMenu();
    });
  });

  /* Close menu on Escape key */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeMenu(); }
  });

  /* Close menu when clicking outside the nav on mobile */
  document.addEventListener('click', function (e) {
    if (
      navMenu.classList.contains('open') &&
      !navMenu.contains(e.target) &&
      !hamburger.contains(e.target)
    ) {
      closeMenu();
    }
  });

  /* ──────────────────────────────────────────
     2. Header — scroll shadow
  ────────────────────────────────────────── */
  function handleScroll() {
    if (window.scrollY > 8) {
      siteHeader.classList.add('scrolled');
    } else {
      siteHeader.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); /* run once on load */

  /* ──────────────────────────────────────────
     3. Active Nav Link on Scroll (Intersection Observer)
  ────────────────────────────────────────── */
  var sections = document.querySelectorAll('section[id]');

  var observerOptions = {
    rootMargin: '-50% 0px -50% 0px',
    threshold: 0
  };

  var sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var id = entry.target.id;
        navLinks.forEach(function (link) {
          link.classList.toggle('active', link.dataset.section === id);
        });
      }
    });
  }, observerOptions);

  sections.forEach(function (section) {
    sectionObserver.observe(section);
  });

  /* ──────────────────────────────────────────
     4. Algorithm Selector Tabs
  ────────────────────────────────────────── */
  function activateTab(selectedTab) {
    var targetMode = selectedTab.dataset.mode;
    var targetPanelId = 'panel-' + targetMode;

    /* Update tab states */
    algoTabs.forEach(function (tab) {
      var isSelected = tab === selectedTab;
      tab.classList.toggle('active', isSelected);
      tab.setAttribute('aria-selected', String(isSelected));
    });

    /* Update panel visibility */
    feedPanels.forEach(function (panel) {
      var isTarget = panel.id === targetPanelId;
      if (isTarget) {
        panel.removeAttribute('hidden');
        panel.classList.add('active');
      } else {
        panel.setAttribute('hidden', '');
        panel.classList.remove('active');
      }
    });
  }

  algoTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      activateTab(tab);
    });

    /* Keyboard navigation: left/right arrows */
    tab.addEventListener('keydown', function (e) {
      var tabs = Array.from(algoTabs);
      var currentIndex = tabs.indexOf(tab);

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        var nextIndex = (currentIndex + 1) % tabs.length;
        tabs[nextIndex].focus();
        activateTab(tabs[nextIndex]);
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        var prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        tabs[prevIndex].focus();
        activateTab(tabs[prevIndex]);
      }
    });
  });

  /* ──────────────────────────────────────────
     5. CTA Button — smooth scroll polyfill for
        browsers that don't support smooth scroll
  ────────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href').slice(1);
      if (!targetId) { return; }
      var target = document.getElementById(targetId);
      if (!target) { return; }

      /* Let CSS smooth-scroll handle it if supported */
      if (CSS.supports('scroll-behavior', 'smooth')) { return; }

      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

})();
