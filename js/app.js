/**
 * app.js — MonkaCraft Shared Layout & Effects
 *
 * Injects header (sticky nav), footer (social + stats + creeper),
 * mouse torch/glow cursor, and page-load animations.
 * Relies on ContentStore from content.js being loaded first.
 */
(function () {
  'use strict';

  /* ----------------------------------------------------------
     A) HELPER: getBasePath()
     Returns '' when at root, '../' when inside pages/ subdir.
     ---------------------------------------------------------- */
  function getBasePath() {
    var path = window.location.pathname.replace(/\\/g, '/');
    if (path.indexOf('/pages/') !== -1) {
      return '../';
    }
    return '';
  }

  /* ----------------------------------------------------------
     B) Active page detection
     Returns a key like 'home', 'streams', etc.
     ---------------------------------------------------------- */
  function getActivePage() {
    var path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    if (path.indexOf('streams') !== -1) return 'streams';
    if (path.indexOf('videos') !== -1) return 'videos';
    if (path.indexOf('gallery') !== -1) return 'gallery';
    if (path.indexOf('blog') !== -1) return 'blog';
    if (path.indexOf('admin') !== -1) return 'admin';
    return 'home';
  }

  /* ----------------------------------------------------------
     C) injectHeader()
     Builds and inserts the sticky top navbar with logo,
     nav links, hamburger, and live badge.
     ---------------------------------------------------------- */
  function injectHeader() {
    var header = document.getElementById('header');
    if (!header) return;

    var base = getBasePath();
    var active = getActivePage();
    var isLive = false;
    try {
      isLive = window.ContentStore && window.ContentStore.isLive();
    } catch (e) {
      isLive = false;
    }

    var navLinks = [
      { key: 'home',    href: base + 'index.html',          icon: '\uD83C\uDFE0', label: 'Home' },
      { key: 'streams', href: base + 'pages/streams.html',  icon: '\uD83C\uDFAC', label: 'Streams' },
      { key: 'videos',  href: base + 'pages/videos.html',   icon: '\uD83D\uDCF9', label: 'Videos' },
      { key: 'gallery', href: base + 'pages/gallery.html',  icon: '\uD83D\uDDBC\uFE0F', label: 'Gallery' },
      { key: 'blog',    href: base + 'pages/blog.html',     icon: '\uD83D\uDCDD', label: 'Blog' }
    ];

    // Fix hrefs for pages/ subdir — nav links should not double up paths
    if (base === '../') {
      navLinks[0].href = '../index.html';
      navLinks[1].href = 'streams.html';
      navLinks[2].href = 'videos.html';
      navLinks[3].href = 'gallery.html';
      navLinks[4].href = 'blog.html';
    }

    var liveBadgeClass = isLive ? 'live-badge' : 'live-badge hidden';

    // Build desktop links HTML
    var desktopLinksHTML = '';
    for (var i = 0; i < navLinks.length; i++) {
      var link = navLinks[i];
      var activeClass = (link.key === active) ? ' active' : '';
      var badge = '';
      if (link.key === 'streams') {
        badge = ' <span class="' + liveBadgeClass + '">LIVE</span>';
      }
      desktopLinksHTML +=
        '<a href="' + link.href + '" class="nav-link' + activeClass + '">' +
        '<span class="nav-icon">' + link.icon + '</span> ' + link.label + badge +
        '</a>';
    }

    // Build mobile links HTML
    var mobileLinksHTML = '';
    for (var j = 0; j < navLinks.length; j++) {
      var mLink = navLinks[j];
      var mActiveClass = (mLink.key === active) ? ' active' : '';
      var mBadge = '';
      if (mLink.key === 'streams') {
        mBadge = ' <span class="' + liveBadgeClass + '">LIVE</span>';
      }
      mobileLinksHTML +=
        '<a href="' + mLink.href + '" class="nav-link' + mActiveClass + '">' +
        '<span class="nav-icon">' + mLink.icon + '</span> ' + mLink.label + mBadge +
        '</a>';
    }

    header.innerHTML =
      '<nav class="navbar" role="navigation" aria-label="Main navigation">' +
        '<div class="container">' +
          '<a href="' + navLinks[0].href + '" class="nav-logo" aria-label="MonkaCraft Home">' +
            '<img src="' + base + 'assets/logo.svg" alt="MonkaCraft Logo">' +
          '</a>' +
          '<div class="nav-links">' + desktopLinksHTML + '</div>' +
          '<button class="hamburger" aria-label="Toggle menu" aria-expanded="false">' +
            '<span class="bar"></span>' +
            '<span class="bar"></span>' +
            '<span class="bar"></span>' +
          '</button>' +
        '</div>' +
      '</nav>' +
      '<div class="nav-mobile" id="nav-mobile">' + mobileLinksHTML + '</div>';

    // Hamburger toggle
    var hamburger = header.querySelector('.hamburger');
    var mobileNav = document.getElementById('nav-mobile');

    if (hamburger && mobileNav) {
      hamburger.addEventListener('click', function () {
        var isOpen = mobileNav.classList.toggle('open');
        hamburger.classList.toggle('active', isOpen);
        hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });

      // Close mobile nav when a link is clicked
      var mobileLinks = mobileNav.querySelectorAll('.nav-link');
      for (var k = 0; k < mobileLinks.length; k++) {
        mobileLinks[k].addEventListener('click', function () {
          mobileNav.classList.remove('open');
          hamburger.classList.remove('active');
          hamburger.setAttribute('aria-expanded', 'false');
        });
      }
    }
  }

  /* ----------------------------------------------------------
     D) injectFooter()
     Social links, credits, pixel creeper, and content stats.
     ---------------------------------------------------------- */
  function injectFooter() {
    var footer = document.getElementById('footer');
    if (!footer) return;

    // Get stats from ContentStore
    var stats = { videos: 0, screenshots: 0, posts: 0, streams: 0 };
    try {
      if (window.ContentStore && typeof window.ContentStore.getStats === 'function') {
        stats = window.ContentStore.getStats();
      }
    } catch (e) {
      // Use defaults
    }

    // Pixel Creeper face: 8x8 grid
    // G = green (.px), D = dark (.px-dark), E = empty (.px-empty)
    var creeperRows = [
      'GGGGGGGG',
      'GDDEEDDG',
      'GDDEEDDG',
      'GGGDDGGG',
      'GGDDDDGG',
      'GGDDDDGG',
      'GGDGGDGG',
      'GGGGGGGG'
    ];

    var creeperHTML = '<div class="pixel-creeper" title="Creeper? Aww man...">';
    for (var r = 0; r < creeperRows.length; r++) {
      for (var c = 0; c < creeperRows[r].length; c++) {
        var ch = creeperRows[r][c];
        if (ch === 'G') {
          creeperHTML += '<div class="px"></div>';
        } else if (ch === 'D') {
          creeperHTML += '<div class="px-dark"></div>';
        } else {
          creeperHTML += '<div class="px-empty"></div>';
        }
      }
    }
    creeperHTML += '</div>';

    footer.className = 'site-footer';
    footer.innerHTML =
      '<div class="container">' +
        '<div class="footer-content">' +
          '<div class="footer-social">' +
            '<a href="#" target="_blank" rel="noopener noreferrer" aria-label="YouTube">' +
              '\uD83D\uDCFA' +
            '</a>' +
            '<a href="#" target="_blank" rel="noopener noreferrer" aria-label="Twitch">' +
              '\uD83D\uDFE3' +
            '</a>' +
          '</div>' +
          '<p class="footer-credits">Built with \u2764\uFE0F by MonkaS</p>' +
          '<div class="footer-stats">' +
            '\uD83D\uDCF9 <span>' + stats.videos + '</span> Videos | ' +
            '\uD83D\uDDBC\uFE0F <span>' + stats.screenshots + '</span> Screenshots | ' +
            '\uD83D\uDCDD <span>' + stats.posts + '</span> Posts' +
          '</div>' +
          creeperHTML +
        '</div>' +
      '</div>';
  }

  /* ----------------------------------------------------------
     E) Cursor Glow / Torch Effect (desktop only)
     ---------------------------------------------------------- */
  function initCursorGlow() {
    // Only activate on devices with a fine pointer (desktop)
    if (!window.matchMedia('(hover: hover)').matches) return;

    var glow = document.querySelector('.cursor-glow');
    if (!glow) return;

    // Show glow when mouse enters the page
    document.addEventListener('mouseenter', function () {
      glow.classList.add('active');
    });

    // Hide glow when mouse leaves
    document.addEventListener('mouseleave', function () {
      glow.classList.remove('active');
    });

    // Track mouse movement with requestAnimationFrame for performance
    var mouseX = 0;
    var mouseY = 0;
    var rafPending = false;

    function updateGlow() {
      glow.style.left = mouseX + 'px';
      glow.style.top = mouseY + 'px';
      rafPending = false;
    }

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(updateGlow);
      }
    });
  }

  /* ----------------------------------------------------------
     F) Page Load Animations
     Uses IntersectionObserver to stagger fade-in of .animate-in elements.
     Falls back to a simple timeout for older browsers.
     ---------------------------------------------------------- */
  function initAnimations() {
    var elements = document.querySelectorAll('.animate-in');
    if (elements.length === 0) return;

    // Prefer IntersectionObserver
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            // Add a small stagger based on element index
            var delay = Array.prototype.indexOf.call(elements, entry.target) * 100;
            setTimeout(function () {
              entry.target.classList.add('visible');
            }, delay);
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -30px 0px'
      });

      for (var i = 0; i < elements.length; i++) {
        observer.observe(elements[i]);
      }
    } else {
      // Fallback: stagger with timeouts
      for (var j = 0; j < elements.length; j++) {
        (function (el, idx) {
          setTimeout(function () {
            el.classList.add('visible');
          }, idx * 120 + 200);
        })(elements[j], j);
      }
    }
  }

  /* ----------------------------------------------------------
     G) Smooth Scroll for Anchor Links
     ---------------------------------------------------------- */
  function initSmoothScroll() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;
      var hash = link.getAttribute('href');
      if (hash.length <= 1) return;
      var target = document.querySelector(hash);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  /* ----------------------------------------------------------
     H) Initialization — DOMContentLoaded
     Waits for ContentStore to initialize, then injects layout
     and dispatches 'contentReady' event for page-specific JS.
     ---------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    // Ensure ContentStore exists before calling init
    if (window.ContentStore && typeof window.ContentStore.init === 'function') {
      window.ContentStore.init().then(function () {
        injectHeader();
        injectFooter();
        initCursorGlow();
        initAnimations();
        initSmoothScroll();

        // Dispatch custom event so page-specific JS knows data is ready
        window.dispatchEvent(new Event('contentReady'));
      }).catch(function (err) {
        console.warn('ContentStore init failed, injecting layout anyway:', err);
        injectHeader();
        injectFooter();
        initCursorGlow();
        initAnimations();
        initSmoothScroll();
        window.dispatchEvent(new Event('contentReady'));
      });
    } else {
      // ContentStore not available — still inject layout
      console.warn('ContentStore not found. Injecting layout without data.');
      injectHeader();
      injectFooter();
      initCursorGlow();
      initAnimations();
      initSmoothScroll();
      window.dispatchEvent(new Event('contentReady'));
    }
  });

  /* ----------------------------------------------------------
     Expose getBasePath globally for page-specific scripts
     ---------------------------------------------------------- */
  window.MonkaCraft = window.MonkaCraft || {};
  window.MonkaCraft.getBasePath = getBasePath;

})();
