/* ============================================================
   TOPLINE - motion system
   Lenis smooth scroll · GSAP + ScrollTrigger · custom cursor
   ============================================================ */
(function () {
  'use strict';

  /* Browsers restore the previous scroll position on reload, which dropped
     visitors mid-page (and fought the load animations). Always start at the
     top unless the URL actually points at a section. */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!window.location.hash) {
    var userMoved = false;
    ['wheel', 'touchstart', 'keydown'].forEach(function (evt) {
      window.addEventListener(evt, function () { userMoved = true; }, { passive: true, once: true });
    });
    var toTop = function () {
      if (userMoved || window.location.hash) return;
      window.scrollTo(0, 0);
      if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true });
    };
    toTop();
    // iOS Safari restores the position asynchronously (and again from the
    // bfcache), so hold the top for a beat unless the visitor scrolls first.
    window.addEventListener('load', toTop);
    window.addEventListener('pageshow', toTop);
    var t0 = Date.now();
    (function clamp() {
      toTop();
      if (!userMoved && Date.now() - t0 < 900) requestAnimationFrame(clamp);
    })();
  }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var isMobile = window.matchMedia('(max-width: 820px)').matches;
  var hasGsap = typeof window.gsap !== 'undefined';

  // Shorter travel + snappier timing on small screens
  var rY = isMobile ? 14 : 24;    // reveal translate distance
  var rDur = isMobile ? 0.4 : 0.45;   // brief: 300-500ms

  /* Deferred images (card hover layers): fetch only when the card is
     within 200px of the viewport, drop the bytes from initial load. */
  function initDeferredImages() {
    var imgs = document.querySelectorAll('img[data-src]');
    if (!imgs.length) return;
    var load = function (img) {
      if (img.getAttribute('data-srcset')) img.srcset = img.getAttribute('data-srcset');
      img.src = img.getAttribute('data-src');
      img.removeAttribute('data-src');
      img.removeAttribute('data-srcset');
    };
    if (!('IntersectionObserver' in window)) {
      imgs.forEach(load);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          load(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '200px 0px' });
    imgs.forEach(function (img) { io.observe(img); });
  }

  /* ---------- Mobile menu (plain CSS transitions, no GSAP dependency) ---------- */
  function initMenu() {
    var menu = document.querySelector('[data-menu]');
    var openBtn = document.querySelector('[data-menu-open]');
    var closeBtn = document.querySelector('[data-menu-close]');
    if (!menu || !openBtn) return;

    function open() {
      menu.hidden = false;
      // next frame so the transition has a start state to animate from
      requestAnimationFrame(function () {
        menu.classList.add('is-open');
        document.body.classList.add('menu-open');
      });
      openBtn.setAttribute('aria-expanded', 'true');
    }
    function close() {
      menu.classList.remove('is-open');
      document.body.classList.remove('menu-open');
      openBtn.setAttribute('aria-expanded', 'false');
      setTimeout(function () { menu.hidden = true; }, 350);
    }

    openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    // any link inside closes the panel (same-page anchors need it visibly gone)
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', close);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) close();
    });
  }
  initMenu();

  /* ---------- FAQ accordion (works with or without GSAP) ---------- */
  function initFaq() {
    var items = document.querySelectorAll('[data-faq-item]');
    if (!items.length) return;
    items.forEach(function (item) {
      var btn = item.querySelector('[data-faq-q]');
      var panel = item.querySelector('[data-faq-a]');
      if (!btn || !panel) return;
      btn.addEventListener('click', function () {
        var open = item.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (typeof window.gsap === 'undefined') {
          panel.style.height = open ? 'auto' : '0px';
          return;
        }
        gsap.to(panel, {
          height: open ? 'auto' : 0,
          duration: 0.5,
          ease: 'power3.inOut',
          onComplete: function () { if (window.ScrollTrigger) ScrollTrigger.refresh(); }
        });
      });
    });
  }
  initFaq();

  /* ---------- Touch: colour arrives on scroll, no tap needed ----------
     Deliberately OUTSIDE the reduced-motion early return: phones with
     "Reduce Motion" on would otherwise never colour anything, and this
     is a colour change, not movement. */
  function initTouchInView() {
    if (finePointer || !('IntersectionObserver' in window)) return;
    // One-way: once an element has been seen it stays lit. Toggling it back
    // off made cards flick between states while scrolling.
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-inview');
        io.unobserve(e.target);
      });
    }, { threshold: 0.25, rootMargin: '0px 0px -10% 0px' });
    document.querySelectorAll('[data-gal-item], [data-idx-card], [data-bp-card], [data-brand-row]')
      .forEach(function (el) { io.observe(el); });
  }
  initTouchInView();

  /* ---------- Services list on touch ----------
     The rows are deliberately NOT in the sweep above. That one is one-way -
     once seen, stays lit - which is right for cards but wrong here: it put a
     photograph behind all four services at once and left them there, instead
     of the one-at-a-time reveal a pointer gets on hover. On touch the list
     lights whichever row is nearest the middle of the screen, and only that
     one, so the photograph travels down the list as you scroll. */
  function initSvcTouch() {
    if (finePointer) return;
    var rows = Array.prototype.slice.call(document.querySelectorAll('[data-svc-row]'));
    if (!rows.length) return;
    var queued = null;
    var update = function () {
      queued = null;
      var mid = window.innerHeight / 2, best = null, bestD = Infinity;
      rows.forEach(function (r) {
        var q = r.getBoundingClientRect();
        if (q.bottom < 0 || q.top > window.innerHeight) return;   // off screen
        var d = Math.abs(q.top + q.height / 2 - mid);
        if (d < bestD) { bestD = d; best = r; }
      });
      rows.forEach(function (r) { r.classList.toggle('is-inview', r === best); });
    };
    var onScroll = function () {
      if (!queued) queued = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }
  initSvcTouch();

  /* ---------- Page load ----------
     The whole page fades up from black. Pure opacity, so it costs nothing
     and is safe to keep under Reduce Motion. */
  requestAnimationFrame(function () { document.documentElement.classList.add('is-ready'); });




  /* ---------- Static fallbacks (no GSAP or reduced motion) ---------- */
  function initCountersInstant() {
    document.querySelectorAll('[data-counter]').forEach(function (el) {
      el.textContent = el.getAttribute('data-counter');
    });
  }

  /* Only a missing GSAP disables the motion layer. "Reduce Motion" no longer
     switches everything off - it only suppresses the heavy, continuously
     moving effects (parallax, Ken Burns, the mosaic scatter) further down. */
  if (!hasGsap) {
    initCountersInstant();
    initDeferredImages();
    initSlider(null);
    initNavSolid();
      return;
  }

  initDeferredImages();

  gsap.registerPlugin(ScrollTrigger);
  // ScrollTrigger also remembers the scroll position across reloads - clear it,
  // otherwise a refresh drops you back mid-page instead of at the top.
  if (!window.location.hash) ScrollTrigger.clearScrollMemory('manual');

  /* Lazy images have no intrinsic size until they decode, so triggers created
     before that can land past the end of the document and never fire. Refresh
     once everything has settled. */
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });

  /* ---------- Lenis smooth scroll ---------- */
  var lenis = null;
  if (typeof window.Lenis !== 'undefined') {
    /* No "prevent" for the work carousel. Lenis's prevent skips every wheel
       and touch event inside the node, vertical included, so scrolling over
       the carousel fell through to instant native scrolling while Lenis held
       its own position - the page stuck, then snapped. Measured: 2 hard steps
       inside the carousel vs 29 eased steps elsewhere. Lenis only consumes
       vertical delta, so the carousel's horizontal scrolling is unaffected. */
    lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
      // NOTE: no "prevent" for the carousel. Lenis's prevent ignores every
      // wheel and touch event inside the node, vertical ones included, so
      // scrolling over the carousel fell back to instant native scrolling
      // while Lenis held its own position - it stuck, then snapped. Lenis
      // only consumes vertical delta, so horizontal scrolling of the
      // carousel passes through on its own.
      // (the work carousel is gone; nothing to exempt from Lenis)
    });
    window.__lenis = lenis;   // so the load-time top clamp can reach it
    if (!window.location.hash) lenis.scrollTo(0, { immediate: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  // Anchor links scroll through Lenis for consistent easing
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -84, duration: 1.4 });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  initNavSolid();

  /* ---------- Hero load-in (home page only) ----------
     Text build-in lives in CSS (starts at first paint, no JS dependency).
     GSAP handles only the image: settle from 1.05, then slow Ken Burns. */
  var heroImg = document.querySelector('[data-hero-img]');
  if (heroImg) {
    // brief 5j: the settle is a reveal transform, so it goes too - Reduce
    // Motion gets the photograph already at rest, and only opacity fades.
    var heroTl = gsap.timeline();
    if (!reduced) {
      heroTl.fromTo(heroImg, { scale: 1.05 }, { scale: 1, duration: 0.8, ease: 'power2.out' });
    }
    // continuous Ken Burns is the one thing Reduce Motion really should stop
    if (!reduced) {
      heroTl.to(heroImg, { scale: 1.08, duration: 18, ease: 'none', yoyo: true, repeat: -1 }, 1.5);
    }

    // Parallax inside the hero slab. The image is overscanned to 118% height,
    // so drifting it +-7% can never expose an edge.
    if (!isMobile && !reduced) {
      gsap.fromTo(heroImg, { yPercent: -6 }, {
        yPercent: 6,
        ease: 'none',
        scrollTrigger: { trigger: '[data-hero-media]', start: 'top bottom', end: 'bottom top', scrub: 0.5 }
      });
    }
  }

  /* ---------- Section reveals ----------
     Content fades in and rises 30px, 900ms, 90ms between siblings, once
     only. Under Reduce Motion the rise is dropped and the fade stays. */
  var revealClear = 'transform,translate,rotate,scale';
  var RISE = 30;   // reveals rise everywhere; see the reduced-motion note in CSS

  document.querySelectorAll('[data-reveal-group]').forEach(function (group) {
    var items = group.querySelectorAll('[data-reveal]');
    if (!items.length) return;
    gsap.from(items, {
      y: RISE, autoAlpha: 0, duration: 0.9, ease: 'power2.out', stagger: 0.09,
      clearProps: revealClear,
      scrollTrigger: { trigger: group, start: 'top 88%', once: true }
    });
  });

  var loose = Array.prototype.filter.call(
    document.querySelectorAll('[data-reveal]'),
    function (el) { return !el.closest('[data-reveal-group]'); }
  );
  if (loose.length) {
    gsap.set(loose, { y: RISE, autoAlpha: 0 });
    ScrollTrigger.batch(loose, {
      start: 'top 92%', once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          y: 0, autoAlpha: 1, duration: 0.9, ease: 'power2.out',
          stagger: 0.09, clearProps: revealClear
        });
      }
    });
  }

  /* ---------- Display headings: each line masks upward ----------
     The single most premium moment on the page. Rebuilt whenever i18n
     swaps a heading's innerHTML, which would otherwise destroy the
     wrappers this depends on. */
  /* Uses ScrollTrigger.batch, the same mechanism the body reveals use here
     and the only one that has proved reliable in this file. The hidden state
     is applied by JS, never by CSS, so if any of this fails the headings are
     simply visible rather than stuck off-screen. */
  function buildLineReveal() {
    var titles = [];
    document.querySelectorAll('.hero__title, .section__title, .cta__title').forEach(function (title) {
      if (!title.querySelector('.hl')) {
        title.innerHTML = title.innerHTML.split(/<br\s*\/?>/i).map(function (line) {
          return '<span class="hl"><span>' + line + '</span></span>';
        }).join('');
      }
      titles.push(title);
    });
    if (!titles.length) return;

    var reveal = function (title) {
      gsap.to(title.querySelectorAll('.hl > span'), {
        yPercent: 0, duration: 1, ease: 'power3.out', stagger: 0.12
      });
    };

    titles.forEach(function (title) {
      var lines = title.querySelectorAll('.hl > span');
      var r = title.getBoundingClientRect();
      gsap.set(lines, { yPercent: 105 });
      if (r.top < window.innerHeight && r.bottom > 0) {
        reveal(title);                       // on screen right now: play it
      } else if (r.bottom <= 0) {
        gsap.set(lines, { yPercent: 0 });     // already scrolled past
      }
    });

    var pending = titles.filter(function (t) {
      var r = t.getBoundingClientRect();
      return r.top >= window.innerHeight;
    });
    if (pending.length) {
      ScrollTrigger.batch(pending, {
        start: 'top 92%', once: true,
        onEnter: function (batch) { batch.forEach(reveal); }
      });
    }
  }
  buildLineReveal();
  window.addEventListener('topline:i18n', function () {
    requestAnimationFrame(buildLineReveal);
  });

  /* ---------- Images settle into place ----------
     1.12 -> 1.0 over 1400ms while fading in. Runs on every device. */
  {
    gsap.utils.toArray('.work__media img, .who__media img, .cta__collage img, .pull__portrait img')
      .forEach(function (img) {
        gsap.from(img, {
          scale: 1.12, autoAlpha: 0, duration: 1.4, ease: 'power2.out',
          clearProps: 'transform,translate,rotate,scale',
          scrollTrigger: { trigger: img, start: 'top 92%', once: true }
        });
      });
  }

  /* ---------- Hero: parallax at 0.3x, plus a slow ken burns ---------- */
  var heroMedia = document.querySelector('[data-hero-media]');
  var heroImg = document.querySelector('[data-hero-img]');
  if (heroMedia && heroImg) {
    if (!isMobile && !reduced) {
      gsap.to(heroMedia, {
        yPercent: 30, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
      });
    }
    /* The ken burns lives in the hero load-in block above, which already
       owns `scale` on this element. A second scale tween here fought it
       every frame - two tweens, one property, visibly stepping. */
  }

  /* ---------- CTA logo mosaic: tiles fly in and settle ---------- */
  (function initCtaMosaic() {
    var mosaic = document.querySelector('[data-cta-mosaic]');
    if (!mosaic) return;
    var tiles = gsap.utils.toArray('[data-cta-tile]');
    if (!tiles.length) return;
    if (reduced) { gsap.set(mosaic, { autoAlpha: 1 }); return; }
    // deterministic scatter so it varies per tile but is stable across loads
    var rnd = function (i, seed) { var x = Math.sin((i + 1) * seed) * 10000; return x - Math.floor(x); };
    ScrollTrigger.create({
      trigger: '.cta', start: 'top 85%', once: true,
      onEnter: function () {
        gsap.set(mosaic, { autoAlpha: 1 });
        gsap.from(tiles, {
          x: function (i) { return (rnd(i, 12.9898) - 0.5) * (isMobile ? 200 : 420); },
          y: function (i) { return (rnd(i, 78.233) - 0.5) * (isMobile ? 180 : 380); },
          rotation: function (i) { return (rnd(i, 43.7712) - 0.5) * 50; },
          scale: function (i) { return 0.5 + rnd(i, 93.9898) * 0.45; },
          autoAlpha: 0,
          duration: 1.4,
          ease: 'expo.out',
          stagger: { each: 0.016, from: 'random' },
          clearProps: 'transform,translate,rotate,scale'
        });
      }
    });
  })();

  /* ---------- Process: numerals count in and the rule draws itself ---------- */
  (function initProcess() {
    var steps = gsap.utils.toArray('.step');
    if (!steps.length) return;
    steps.forEach(function (step, i) {
      ScrollTrigger.create({
        trigger: step, start: 'top 88%', once: true,
        onEnter: function () {
          step.classList.add('is-drawn');
          var num = step.querySelector('.step__num');
          if (!num || reduced) return;
          gsap.from(num, { yPercent: 40, autoAlpha: 0, duration: 0.5, ease: 'power3.out',
                           clearProps: 'transform,translate,rotate,scale' });
        }
      });
    });
  })();



  /* ============================================================
     Interaction layer
     ============================================================ */

  /* Pointer position is written by one listener and read by everything else
     on the GSAP ticker - nothing heavy is ever bound to mousemove. */
  var ptr = { x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0, down: false };
  if (finePointer) {
    window.addEventListener('pointermove', function (e) {
      ptr.x = e.clientX; ptr.y = e.clientY;
    }, { passive: true });
    window.addEventListener('pointerdown', function () { ptr.down = true; }, { passive: true });
    window.addEventListener('pointerup', function () { ptr.down = false; }, { passive: true });
    gsap.ticker.add(function () {
      ptr.vx = ptr.x - ptr.px; ptr.vy = ptr.y - ptr.py;
      ptr.px = ptr.x; ptr.py = ptr.y;
    });
  }
  window.__ptr = ptr;

  /* ---------- Preloader ----------
     Counts to 100 as images decode, then the two halves split apart.
     Once per session, and skipped entirely under Reduce Motion. */
  (function initPre() {
    var pre = document.querySelector('[data-pre]');
    if (!pre) return;
    var seen = false;
    try { seen = sessionStorage.getItem('tl-pre') === '1'; } catch (e) {}
    if (seen || reduced) { pre.classList.add('is-gone'); return; }
    try { sessionStorage.setItem('tl-pre', '1'); } catch (e) {}

    var countEl = pre.querySelector('[data-pre-count]');
    var bar = pre.querySelector('[data-pre-bar]');
    var halves = pre.querySelectorAll('[data-pre-half]');
    var imgs = Array.prototype.slice.call(document.images);
    var total = Math.max(imgs.length, 1), done = 0, shown = 0;

    var tick = function () {
      var target = Math.round((done / total) * 100);
      shown += (target - shown) * 0.18;
      if (target >= 100 && 100 - shown < 1.2) shown = 100;   // settle, do not crawl
      var n = Math.min(100, Math.round(shown));
      countEl.textContent = ('00' + n).slice(-3);
      bar.style.transform = 'scaleX(' + (n / 100) + ')';
      if (n >= 100) { gsap.ticker.remove(tick); finish(); }
    };
    var finish = function () {
      pre.classList.add('is-done');
      gsap.to(halves[0], { yPercent: -100, duration: 0.9, ease: 'power3.inOut' });
      gsap.to(halves[1], { yPercent: 100, duration: 0.9, ease: 'power3.inOut',
        onComplete: function () { pre.classList.add('is-gone'); } });
      gsap.to(pre.querySelector('.pre__inner'), { autoAlpha: 0, duration: 0.3 });
    };
    imgs.forEach(function (im) {
      if (im.complete) { done++; return; }
      im.addEventListener('load', function () { done++; }, { once: true });
      im.addEventListener('error', function () { done++; }, { once: true });
    });
    // never hold the page hostage to a slow asset
    setTimeout(function () { done = total; }, 3000);
    // hard failsafe: whatever happens, the panel is gone by 6s
    setTimeout(function () {
      gsap.ticker.remove(tick);
      pre.classList.add("is-gone");
    }, 6000);
    gsap.ticker.add(tick);
  })();

  /* ---------- Page transition wipe ---------- */
  (function initWipe() {
    var wipe = document.querySelector('[data-wipe]');
    if (!wipe || reduced) return;
    document.querySelectorAll('a[href$=".html"]').forEach(function (a) {
      if (a.target === '_blank' || a.hasAttribute('data-no-wipe')) return;
      a.addEventListener('click', function (e) {
        var url = a.getAttribute('href');
        if (!url || url.indexOf('#') === 0) return;
        e.preventDefault();
        /* Same-document View Transitions cannot cover a full navigation, so
           the platform API is used to animate the outgoing page and the
           GSAP panel is the fallback where it is missing. Either way the
           navigation itself is what completes the change. */
        if (document.startViewTransition) {
          document.startViewTransition(function () {
            document.documentElement.classList.add('is-leaving');
          }).finished.then(function () { window.location.href = url; });
          setTimeout(function () { window.location.href = url; }, 700);
          return;
        }
        gsap.timeline({ onComplete: function () { window.location.href = url; } })
          .to(wipe, { yPercent: 0, duration: 0.35, ease: 'power3.in' })
          .to('main', { autoAlpha: 0, duration: 0.2 }, 0.1);
      });
    });
    // arriving: lift the panel away upward
    gsap.set(wipe, { yPercent: 100 });
  })();

  /* ---------- Magnetic controls ---------- */
  (function initMagnetic() {
    if (!finePointer || reduced) return;
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-mag]'));
    if (!items.length) return;
    var RADIUS = 60, PULL = 8;
    items.forEach(function (el) { el.__x = 0; el.__y = 0; });
    gsap.ticker.add(function () {
      items.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var dx = ptr.x - cx, dy = ptr.y - cy;
        var dist = Math.hypot(dx, dy);
        var reach = Math.max(r.width, r.height) / 2 + RADIUS;
        var tx = 0, ty = 0;
        if (dist < reach) {
          var f = 1 - dist / reach;
          tx = (dx / reach) * PULL * f * 2;
          ty = (dy / reach) * PULL * f * 2;
          tx = Math.max(-PULL, Math.min(PULL, tx));
          ty = Math.max(-PULL, Math.min(PULL, ty));
        }
        el.__x += (tx - el.__x) * 0.12;
        el.__y += (ty - el.__y) * 0.12;
        el.style.transform = 'translate3d(' + el.__x.toFixed(2) + 'px,' + el.__y.toFixed(2) + 'px,0)';
        var inner = el.querySelector('.mag__in');
        if (inner) inner.style.transform =
          'translate3d(' + (el.__x / 2).toFixed(2) + 'px,' + (el.__y / 2).toFixed(2) + 'px,0)';
      });
    });
  })();


  /* ---------- Services imagery ----------
     There used to be a second layer here: a JS-built .svc__backdrop spanning
     the whole section, which painted the hovered row's photograph across
     every row at once. That is the "all the backgrounds turn on, not just
     that part" fault. Each row already carries its own .svc__ghost, scoped
     to that row's box, which is the behaviour we want - so the section-wide
     layer is gone rather than restyled. It also duplicated every image
     download for no benefit. */

  /* ---------- Character scramble ---------- */
  var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/*';
  function scramble(el, text, ms) {
    if (reduced) { el.textContent = text; return; }
    var start = performance.now();
    var dur = ms || 250;
    var run = function (now) {
      var p = Math.min(1, (now - start) / dur);
      var keep = Math.floor(text.length * p);
      var out = text.slice(0, keep);
      for (var i = keep; i < text.length; i++) {
        out += text[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(run);
      else el.textContent = text;
    };
    requestAnimationFrame(run);
  }
  window.__scramble = scramble;


  /* ---------- Force-load horizontally scrolled imagery ----------
     Native lazy-loading only reacts to vertical proximity. Anything that
     arrives by horizontal scroll or CSS transform - the work carousel and
     the logo marquee - never satisfies it, so those images stayed
     unfetched and the strip rendered blank. When the container comes into
     view, drop the lazy hint so the whole row loads. */
  (function initHorizontalLoad() {
    var groups = document.querySelectorAll('[data-eager-row]');
    if (!groups.length) return;
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('[data-eager-row] img[loading="lazy"]')
        .forEach(function (im) { im.loading = 'eager'; });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        e.target.querySelectorAll('img[loading="lazy"]').forEach(function (im) {
          im.loading = 'eager';
          if (!im.complete) { var s = im.getAttribute('src'); if (s) im.src = s; }
        });
      });
    }, { rootMargin: '200px 0px' });
    groups.forEach(function (g) { io.observe(g); });
  })();

  /* ---------- Hairlines draw in ---------- */
  (function initRules() {
    var els = document.querySelectorAll('.rule-in');
    if (!els.length || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.2 });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ============================================================
     Gallery layer: view toggle, index preview, viewer, wayfinding
     ============================================================ */

  /* ---------- Gallery / Index toggle ---------- */
  (function initViews() {
    var btns = document.querySelectorAll('.views [data-view]');
    if (!btns.length) return;
    var panels = document.querySelectorAll('[data-panel]');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var want = btn.getAttribute('data-view');
        btns.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        panels.forEach(function (p) {
          var on = p.getAttribute('data-panel') === want;
          if (on) {
            p.hidden = false;
            gsap.fromTo(p, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: 'power2.out' });
          } else {
            gsap.to(p, { autoAlpha: 0, duration: 0.4, ease: 'power2.in',
              onComplete: function () { p.hidden = true; gsap.set(p, { clearProps: 'all' }); } });
          }
        });
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      });
    });
  })();

  /* ---------- Index: cursor-following preview + spotlight ---------- */
  (function initIndex() {
    var list = document.querySelector('[data-index-list]');
    var preview = document.querySelector('[data-preview]');
    if (!list || !preview || !finePointer) return;
    var img = preview.querySelector('img');
    var tx = 0, ty = 0, cx = 0, cy = 0, on = false;

    list.querySelectorAll('[data-index-row]').forEach(function (row) {
      var titleEl = row.querySelector('.index-row__title');
      var titleText = titleEl ? titleEl.textContent : '';
      row.addEventListener('mouseenter', function () {
        img.src = row.getAttribute('data-img');
        list.classList.add('is-hovering');
        list.querySelectorAll('.is-active').forEach(function (r) { r.classList.remove('is-active'); });
        row.classList.add('is-active');
        preview.classList.add('is-on');
        on = true;
        if (titleEl) {
          titleText = titleEl.getAttribute('data-text') || titleEl.textContent;
          titleEl.setAttribute('data-text', titleText);
          scramble(titleEl, titleText, 250);
        }
      });
      row.addEventListener('mouseleave', function () {
        row.classList.remove('is-active');
      });
    });
    list.addEventListener('mouseleave', function () {
      list.classList.remove('is-hovering');
      preview.classList.remove('is-on');
      on = false;
    });
    window.addEventListener('mousemove', function (e) {
      tx = e.clientX + 28;
      ty = e.clientY - 40;
    }, { passive: true });
    var skew = 0;
    gsap.ticker.add(function () {
      if (!on) return;
      cx += (tx - cx) * 0.1;                 // brief: ~0.1 lerp
      cy += (ty - cy) * 0.1;
      // the preview trails the pointer with weight, capped at 8deg
      var target = Math.max(-8, Math.min(8, (window.__ptr ? window.__ptr.vx : 0) * 0.35));
      skew += (target - skew) * 0.12;
      preview.style.transform =
        'translate3d(' + cx + 'px,' + cy + 'px,0) skewX(' + skew.toFixed(2) + 'deg)';
    });
  })();

  /* ---------- Viewer ---------- */


  /* ---------- Walkthrough pacing (brief 8c) ----------
     Photographic sections scale very slightly as they pass through the
     centre of the viewport, so the page responds to the visitor's movement
     rather than just switching on. Written to a custom property, never to
     `transform`, so this can never fight a GSAP-owned transform - the bug
     that made things appear to move twice. */
  (function initWalkthrough() {
    var wraps = Array.prototype.slice.call(document.querySelectorAll('[data-scroll-scale]'));
    if (!wraps.length || reduced) return;

    wraps.forEach(function (wrap) {
      ScrollTrigger.create({
        trigger: wrap,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: function (self) {
          /* 0 at the edges of the pass, 1 when the section is centred */
          var centred = 1 - Math.abs(self.progress - 0.5) * 2;
          wrap.style.setProperty('--ss', (1 + centred * 0.04).toFixed(4));
        }
      });
    });
  })();

  /* ---------- Mouse parallax behind wall text (brief 8d) ----------
     The photograph drifts a few pixels against the pointer. Heavily
     damped, and only where type sits over an image. */
  (function initMousePar() {
    var wraps = Array.prototype.slice.call(document.querySelectorAll('[data-mouse-par]'));
    if (!wraps.length || reduced || !finePointer) return;

    wraps.forEach(function (wrap) {
      var img = wrap.querySelector('img');
      if (!img) return;
      var tx = 0, ty = 0, cx = 0, cy = 0, active = false;

      wrap.addEventListener('pointermove', function (e) {
        var r = wrap.getBoundingClientRect();
        // -1..1 across the figure, inverted so the image leans away
        tx = -(((e.clientX - r.left) / r.width) * 2 - 1) * 6;
        ty = -(((e.clientY - r.top) / r.height) * 2 - 1) * 6;
        active = true;
      });
      wrap.addEventListener('pointerleave', function () { tx = 0; ty = 0; });

      gsap.ticker.add(function () {
        if (!active && Math.abs(cx - tx) < 0.01 && Math.abs(cy - ty) < 0.01) return;
        cx += (tx - cx) * 0.06;                     // heavy damping
        cy += (ty - cy) * 0.06;
        img.style.translate = cx.toFixed(2) + 'px ' + cy.toFixed(2) + 'px';
      });
    });
  })();

  /* ---------- Gallery: filter + entrance ----------
     Filtering is a real FLIP: measure every surviving item, change what is
     hidden, measure again, invert the delta onto each item and play it out.
     That way the grid re-flows as a movement instead of a jump. */
  (function initGallery() {
    var grid = document.querySelector('[data-gal-grid]');
    if (!grid) return;
    var items = Array.prototype.slice.call(grid.querySelectorAll('[data-gal-item]'));
    var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-gal-filter]'));
    if (!items.length) return;

    /* the loose settling entrance. The hidden state is written by JS, never
       by CSS, so if any of this fails the photographs are simply visible. */
    if (!reduced) {
      gsap.set(items, { y: 24, autoAlpha: 0, scale: 0.98 });
      var play = function (batch) {
        gsap.to(batch, {
          y: 0, autoAlpha: 1, scale: 1,
          duration: 0.7, ease: 'power2.out',
          stagger: { each: 0.075, from: 'random' },   // loose, not row-by-row
          overwrite: true
        });
      };
      // anything already on screen at load plays at once
      var inView = items.filter(function (el) {
        var r = el.getBoundingClientRect();
        return r.top < window.innerHeight && r.bottom > 0;
      });
      if (inView.length) play(inView);
      ScrollTrigger.batch(items.filter(function (el) { return inView.indexOf(el) < 0; }), {
        start: 'top 92%', once: true, onEnter: play
      });
    }

    var current = 'all';
    function apply(cat) {
      if (cat === current) return;
      current = cat;

      // FIRST: where is everything now
      var first = {};
      items.forEach(function (el, i) {
        if (el.hidden) return;
        var r = el.getBoundingClientRect();
        first[i] = { x: r.left, y: r.top };
      });

      var leaving = items.filter(function (el) {
        return !el.hidden && cat !== 'all' && el.getAttribute('data-cat') !== cat;
      });

      var commit = function () {
        items.forEach(function (el) {
          el.hidden = !(cat === 'all' || el.getAttribute('data-cat') === cat);
          el.classList.remove('is-leaving');
        });

        // LAST + INVERT + PLAY
        var entering = [];
        items.forEach(function (el, i) {
          if (el.hidden) return;
          var r = el.getBoundingClientRect();
          if (first[i]) {
            var dx = first[i].x - r.left, dy = first[i].y - r.top;
            if (reduced) return;
            if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
              gsap.fromTo(el, { x: dx, y: dy },
                { x: 0, y: 0, duration: 0.4, ease: 'power2.out', overwrite: true });
            }
          } else {
            entering.push(el);
          }
        });
        if (entering.length) {
          if (reduced) gsap.set(entering, { clearProps: 'all', autoAlpha: 1 });
          else gsap.fromTo(entering,
            { y: 20, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.4, ease: 'power2.out',
              stagger: 0.06, overwrite: true });
        }
        ScrollTrigger.refresh();
      };

      if (leaving.length && !reduced) {
        leaving.forEach(function (el) { el.classList.add('is-leaving'); });
        setTimeout(commit, 300);                  // 300ms fade + scale to 0.96
      } else {
        commit();
      }
    }

    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        var cat = b.getAttribute('data-gal-filter');
        buttons.forEach(function (o) {
          var on = o === b;
          o.classList.toggle('is-active', on);
          o.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        apply(cat);
      });
    });
  })();

  (function initViewer() {
    var lb = document.querySelector('[data-lb]');
    if (!lb) return;
    var figs = Array.prototype.slice.call(document.querySelectorAll('[data-gal-item]'));
    if (!figs.length) return;

    var lbImg = lb.querySelector('[data-lb-img]');
    var lbTitle = lb.querySelector('[data-lb-title]');
    var lbMeta = lb.querySelector('[data-lb-meta]');
    var lbLink = lb.querySelector('[data-lb-link]');
    var lbCount = lb.querySelector('[data-lb-count]');
    var idx = 0, lastFocus = null;
    /* A drag ends with a click whose target has been retargeted to the stage
       by pointer capture, which the backdrop rule below would read as a click
       on the darkness. Swiping would change the photograph and then close the
       viewer on top of it. */
    var swallowClick = false;

    var items = figs.map(function (fig) {
      return {
        el: fig,
        img: fig.querySelector('img'),
        href: fig.getAttribute('href'),
        /* title and meta are read live rather than cached: i18n resolves
           after this runs, and a snapshot here captured the "-" placeholders */
        titleEl: fig.querySelector('.wall__title'),
        metaEl: fig.querySelector('.wall__meta')
      };
    });

    /* prev/next walk only what the active filter is showing, so the counter
       and the arrows agree with what is actually on screen */
    function live() {
      var l = items.filter(function (it) { return !it.el.hidden; });
      return l.length ? l : items;
    }
    function step(dir) {
      var l = live();
      var here = l.indexOf(items[idx]);
      if (here < 0) here = 0;
      var next = (here + dir + l.length) % l.length;
      show(items.indexOf(l[next]));
    }

    /* strips of the outgoing frame are pushed sideways by a noise offset as
       it fades, so the change reads as a displacement rather than a plain
       crossfade. 2D canvas, ~60 strips, one draw call each. */
    var dis = document.createElement('canvas');
    dis.className = 'lb__dissolve';
    dis.setAttribute('aria-hidden', 'true');
    lb.querySelector('.lb__stage').appendChild(dis);
    var dctx = dis.getContext('2d');

    function dissolveFrom(fromImg) {
      if (reduced || !fromImg || !fromImg.naturalWidth) return;
      var r = fromImg.getBoundingClientRect();
      var host = dis.parentElement.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var scale = Math.min(1, 900 / Math.max(r.width, r.height));
      dis.width = Math.round(r.width * scale);
      dis.height = Math.round(r.height * scale);
      dis.style.width = r.width + 'px';
      dis.style.height = r.height + 'px';
      dis.style.left = (r.left - host.left) + 'px';
      dis.style.top = (r.top - host.top) + 'px';

      var STRIPS = 60;
      var seed = [];
      for (var k = 0; k < STRIPS; k++) seed.push(Math.random() * 2 - 1);
      var src = fromImg.cloneNode();
      var t0 = performance.now();
      dis.classList.add('is-on');

      (function step(now) {
        var p = Math.min(1, (now - t0) / 500);          // 500ms, per the brief
        var e = 1 - Math.pow(1 - p, 3);
        dctx.clearRect(0, 0, dis.width, dis.height);
        dctx.globalAlpha = 1 - e;
        var hgt = dis.height / STRIPS;
        for (var k = 0; k < STRIPS; k++) {
          var off = seed[k] * e * dis.width * 0.18;
          dctx.drawImage(src,
            0, (k / STRIPS) * src.naturalHeight, src.naturalWidth, src.naturalHeight / STRIPS,
            off, k * hgt, dis.width, hgt + 1);
        }
        if (p < 1) requestAnimationFrame(step);
        else { dis.classList.remove('is-on'); dctx.clearRect(0, 0, dis.width, dis.height); }
      })(performance.now());
    }

    function show(i, instant) {
      idx = (i + items.length) % items.length;
      var it = items[idx];
      if (!instant && lbImg.naturalWidth) dissolveFrom(lbImg);
      lbImg.classList.remove('is-shown');
      var swap = function () {
        lbImg.src = it.img.getAttribute('src');
        var ss = it.img.getAttribute('srcset');
        if (ss) lbImg.srcset = ss;
        lbImg.alt = it.img.getAttribute('alt') || '';
        if (lbTitle) lbTitle.textContent = it.titleEl ? it.titleEl.textContent : '';
        if (lbMeta) lbMeta.textContent = it.metaEl ? it.metaEl.textContent : '';
        if (lbLink && it.href) lbLink.setAttribute('href', it.href);
        var l = live(), pos = l.indexOf(it);
        lbCount.textContent = ('0' + ((pos < 0 ? idx : pos) + 1)).slice(-2) +
          ' / ' + ('0' + l.length).slice(-2);
        requestAnimationFrame(function () { lbImg.classList.add('is-shown'); });
      };
      if (instant || reduced) swap(); else setTimeout(swap, 260);   // 500ms crossfade
    }

    /* FLIP: measure where the thumbnail is (First), let the viewer lay the
       image out at full size (Last), invert the difference onto it, then
       play to identity. Skipped under Reduce Motion, which gets a fade. */
    function flipFrom(fig) {
      if (reduced || !fig) return;
      var thumb = fig.querySelector('img');
      if (!thumb) return;
      var first = thumb.getBoundingClientRect();
      requestAnimationFrame(function () {
        var last = lbImg.getBoundingClientRect();
        if (!last.width || !last.height) return;
        var sx = first.width / last.width;
        var sy = first.height / last.height;
        var dx = (first.left + first.width / 2) - (last.left + last.width / 2);
        var dy = (first.top + first.height / 2) - (last.top + last.height / 2);
        gsap.fromTo(lbImg,
          { x: dx, y: dy, scaleX: sx, scaleY: sy },
          { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.6, ease: 'power3.inOut',
            clearProps: 'transform,translate,rotate,scale' });
      });
    }

    function open(i, fig) {
      lastFocus = document.activeElement;
      lb.hidden = false;
      document.body.classList.add('lb-open');
      show(i, true);
      requestAnimationFrame(function () {
        lb.classList.add('is-open');
        flipFrom(fig);
        /* The dialog is visibility:hidden until the is-open style resolves,
           and focus() on a hidden element is silently dropped - so don't
           trust a single frame. Try, then check, then try again once the
           open transition has finished. */
        var target = lb.querySelector('[data-lb-close]');
        var take = function () {
          if (!lb.contains(document.activeElement)) target.focus();
        };
        requestAnimationFrame(take);
        setTimeout(take, 120);
        setTimeout(take, 450);
      });
    }
    function close() {
      lb.classList.remove('is-open');
      document.body.classList.remove('lb-open');
      setTimeout(function () { lb.hidden = true; }, 400);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    /* the items stay real links, so they work without JS and announce
       correctly; JS intercepts to open the viewer instead of navigating,
       and the viewer's own link carries the visitor on to the page */
    figs.forEach(function (fig, i) {
      fig.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        open(i, fig);
      });
    });

    /* drag or swipe sideways to change plate, with a momentum threshold */
    (function dragToChange() {
      var stage = lb.querySelector('.lb__stage');
      var sx = 0, st = 0, dragging = false;
      stage.addEventListener('pointerdown', function (e) {
        /* The close and prev/next buttons live inside the stage. Capturing
           the pointer here retargets every following pointer event to the
           stage, so the buttons never received a click at all - the whole
           control set was dead to the mouse while the keyboard still worked.
           Anything interactive keeps its own pointer. */
        if (e.target.closest('button, a')) return;
        dragging = true; sx = e.clientX; st = performance.now();
        stage.setPointerCapture && stage.setPointerCapture(e.pointerId);
      });
      stage.addEventListener('pointerup', function (e) {
        if (!dragging) return;
        dragging = false;
        var dx = e.clientX - sx;
        var dt = Math.max(1, performance.now() - st);
        var momentum = Math.abs(dx) / dt;                 // px per ms
        swallowClick = Math.abs(dx) > 8;                  // it was a drag, not a tap
        if (Math.abs(dx) > 70 || momentum > 0.45) step(dx < 0 ? 1 : -1);
      });
      stage.addEventListener('pointercancel', function () { dragging = false; });
      // belt and braces: Firefox ignores -webkit-user-drag
      stage.addEventListener('dragstart', function (e) { e.preventDefault(); });
    })();

    lb.querySelector('[data-lb-close]').addEventListener('click', close);
    lb.querySelector('[data-lb-prev]').addEventListener('click', function () { step(-1); });
    lb.querySelector('[data-lb-next]').addEventListener('click', function () { step(1); });
    /* Clicking the surrounding darkness closes. The stage fills that area,
       so testing for the dialog alone never matched - accept the stage too,
       but never the photograph or a control. */
    lb.addEventListener('click', function (e) {
      if (swallowClick) { swallowClick = false; return; }
      if (e.target.closest('button, a, img')) return;
      if (e.target === lb || e.target.classList.contains('lb__stage')) close();
    });

    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'Tab') {
        // focus stays inside the dialog
        var f = lb.querySelectorAll('button, a[href]');
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  })();

  /* ---------- Plates reveal, label 200ms behind its work ---------- */
  (function initPlates() {
    var plates = gsap.utils.toArray('[data-plate]');
    if (!plates.length) return;
    plates.forEach(function (plate) {
      var figs = plate.querySelectorAll('[data-plate-fig]');
      var label = plate.querySelector('[data-plate-label]');
      gsap.set(figs, { y: reduced ? 0 : 40, autoAlpha: 0 });
      if (label) gsap.set(label, { autoAlpha: 0 });
      ScrollTrigger.create({
        trigger: plate, start: 'top 88%', once: true,
        onEnter: function () {
          gsap.to(figs, { y: 0, autoAlpha: 1, duration: 0.9, ease: 'power2.out', stagger: 0.09,
            clearProps: 'transform,translate,rotate,scale' });
          if (label) gsap.to(label, { autoAlpha: 1, duration: 0.7, delay: 0.2, ease: 'power2.out' });
        }
      });
    });
  })();



  /* ---------- Drag floor ----------
     The field is laid out across a tile larger than the viewport and each
     item is wrapped independently, so dragging never reaches an edge.
     Momentum decays after release. Touch devices get the CSS grid instead
     and this never runs. */
  (function initFloor() {
    var floor = document.querySelector('[data-floor]');
    if (!floor) return;
    var field = floor.querySelector('[data-floor-field]');
    var items = Array.prototype.slice.call(floor.querySelectorAll('[data-floor-item]'));
    if (!items.length) return;
    if (!finePointer || reduced) return;              // CSS grid fallback stands

    var TW = 0, TH = 0, ox = 0, oy = 0, vx = 0, vy = 0;
    var dragging = false, lastX = 0, lastY = 0, moved = 0;

    function layout() {
      TW = Math.max(window.innerWidth * 1.9, 1600);
      TH = Math.max(window.innerHeight * 1.7, 1100);
      items.forEach(function (el) {
        el.__bx = parseFloat(el.getAttribute('data-x')) * TW;
        el.__by = parseFloat(el.getAttribute('data-y')) * TH;
      });
    }
    layout();
    window.addEventListener('resize', layout);

    floor.addEventListener('pointerdown', function (e) {
      dragging = true; moved = 0;
      lastX = e.clientX; lastY = e.clientY;
      floor.classList.add('is-dragging');
      floor.setPointerCapture && floor.setPointerCapture(e.pointerId);
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      ox += dx; oy += dy;
      vx = dx; vy = dy;
      moved += Math.hypot(dx, dy);
    }, { passive: true });
    window.addEventListener('pointerup', function () {
      if (!dragging) return;
      dragging = false;
      floor.classList.remove('is-dragging');
    });
    // a drag must not also follow the link
    floor.addEventListener('click', function (e) {
      if (moved > 8) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    var cxv = window.innerWidth / 2, cyv = window.innerHeight / 2;
    gsap.ticker.add(function () {
      if (!dragging) { ox += vx; oy += vy; vx *= 0.94; vy *= 0.94; }   // momentum
      var w = window.innerWidth, h = window.innerHeight;
      items.forEach(function (el) {
        // wrap each item into the visible band independently
        var x = ((el.__bx + ox) % TW + TW) % TW - (TW - w) / 2;
        var y = ((el.__by + oy) % TH + TH) % TH - (TH - h) / 2;
        var d = Math.hypot(x + el.offsetWidth / 2 - cxv, y + el.offsetHeight / 2 - cyv);
        var near = Math.max(0, 1 - d / (Math.max(w, h) * 0.7));
        var sc = 1 + near * 0.12;                    // grows toward the centre
        el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + sc.toFixed(3) + ')';
      });
    });
  })();

  /* ---------- Horizontal room ----------
     Pinned on pointer devices and translated sideways by vertical scroll.
     On touch the track is a native horizontal scroller with snap points,
     so nothing is pinned and the page never fights the finger. */
  (function initRoom() {
    var room = document.querySelector('[data-room]');
    if (!room) return;
    var track = room.querySelector('[data-room-track]');
    var items = track.querySelectorAll('[data-room-item]');
    var countEl = room.querySelector('[data-room-count]');
    var rail = room.querySelector('[data-room-rail]');
    if (!items.length) return;
    var total = ('0' + items.length).slice(-2);

    var setReadout = function (p) {
      var n = Math.min(items.length, Math.max(1, Math.round(p * (items.length - 1)) + 1));
      var next = ('0' + n).slice(-2) + ' / ' + total;
      if (countEl && countEl.textContent !== next) countEl.textContent = next;
      if (rail) rail.style.transform = 'scaleX(' + p.toFixed(3) + ')';
    };

    if (isMobile || !finePointer || reduced) {
      // native scroller: drive the readout from its own scrollLeft
      if (track.scrollWidth > track.clientWidth) {
        track.addEventListener('scroll', function () {
          var max = track.scrollWidth - track.clientWidth;
          setReadout(max > 0 ? track.scrollLeft / max : 0);
        }, { passive: true });
      }
      setReadout(0);
      return;
    }

    var distance = function () { return Math.max(0, track.scrollWidth - window.innerWidth + 120); };
    gsap.to(track, {
      x: function () { return -distance(); },
      ease: 'none',
      scrollTrigger: {
        trigger: room,
        start: 'top top',
        end: function () { return '+=' + distance(); },
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: function (self) { setReadout(self.progress); }
      }
    });
    setReadout(0);
  })();

  /* ---------- Wayfinding readout ---------- */
  (function initReadout() {
    var el = document.querySelector('[data-readout]');
    if (!el) return;
    var sections = Array.prototype.slice.call(document.querySelectorAll('main > section[id]'));
    if (!sections.length) return;
    /* read the label when the section arrives, not at init - i18n applies
       after this runs, so caching here captured the raw HTML fallback.
       The number comes off the section's own eyebrow so the readout and the
       eyebrow can never disagree; counting sections here instead produced
       "06 - Recognition" under an eyebrow reading "05 - Recognition".
       A section with no eyebrow announces nothing. */
    var labelFor = function (sec) {
      var eb = sec.querySelector('.eyebrow');
      if (!eb) return null;
      var num = eb.querySelector('.eyebrow__n');
      var lab = eb.querySelector('[data-i18n]');
      var text = (lab ? lab.textContent : eb.textContent)
        .replace(/^\d+\s*[—-]\s*/, '').replace(/^\(\s*|\s*\)$/g, '').trim();
      if (!text) return null;
      var n = num ? (num.textContent.match(/\d+/) || [''])[0] : '';
      return n ? n + ' — ' + text : text;
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var next = labelFor(e.target);
        if (next === null) { el.classList.add('is-off'); return; }
        el.classList.remove('is-off');
        if (next !== el.textContent) scramble(el, next, 250);
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    sections.forEach(function (sec) { io.observe(sec); });
  })();

  /* ---------- Scroll progress hairline ---------- */
  (function initProgress() {
    var bar = document.querySelector('[data-progress]');
    if (!bar) return;
    var update = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleY(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  })();

  /* ---------- Counters ---------- */
  document.querySelectorAll('[data-counter]').forEach(function (el) {
    var target = parseInt(el.getAttribute('data-counter'), 10);
    var state = { val: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: function () {
        gsap.to(state, {
          val: target,
          duration: 0.85,
          ease: 'power2.out',
          onUpdate: function () { el.textContent = Math.round(state.val); }
        });
      }
    });
  });

  /* ---------- Studio portrait parallax - desktop only ---------- */
  if (!isMobile && !reduced) {
    document.querySelectorAll('[data-parallax]').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -14 }, {
        yPercent: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: img.closest('[data-parallax-wrap]'),
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.5
        }
      });
    });
  }

  /* ---------- Closing CTA line reveal ---------- */
  var ctaLines = document.querySelectorAll('.cta__line');
  if (ctaLines.length) {
    ctaLines.forEach(function (line) {
      var inner = document.createElement('span');
      inner.style.display = 'inline-block';
      while (line.firstChild) inner.appendChild(line.firstChild);
      line.appendChild(inner);
    });
    gsap.from('.cta__line > span', {
      yPercent: 110,
      duration: 1.1,
      ease: 'power4.out',
      stagger: 0.14,
      scrollTrigger: { trigger: '.cta', start: 'top 72%', once: true }
    });
  }

  /* ---------- Testimonial slider ---------- */
  initSlider(gsap);

  /* ---------- Custom cursor (desktop only) ---------- */
  if (finePointer && !reduced) {
    var cursor = document.querySelector('.cursor');
    var label = cursor.querySelector('.cursor__label');
    var cx = 0, cy = 0;
    gsap.ticker.add(function () {
      cx += (ptr.x - cx) * 0.15;
      cy += (ptr.y - cy) * 0.15;
      cursor.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      cursor.classList.toggle('is-down', ptr.down);
    });
    window.addEventListener('pointermove', function () { cursor.classList.add('is-live'); }, { passive: true, once: true });

    var state = function (sel, cls, text) {
      document.querySelectorAll(sel).forEach(function (el) {
        el.addEventListener('mouseenter', function () {
          cursor.classList.add(cls);
          if (text) label.textContent = text;
        });
        el.addEventListener('mouseleave', function () { cursor.classList.remove(cls); });
      });
    };
    state('[data-gal-item], .index__item', 'is-view', 'View');
    state('a, button, [data-cursor]', 'is-label', null);

    /* brief 8d: over a large photographic section the cursor only suggests
       carrying on once the visitor has actually stopped - 1.5s after the
       last scroll, and never while they are over something clickable. */
    (function pauseHint() {
      var rooms = document.querySelectorAll('[data-photo-room]');
      if (!rooms.length) return;
      var over = false, timer = null;
      var clear = function () {
        cursor.classList.remove('is-scroll');
        if (timer) clearTimeout(timer);
        timer = over ? setTimeout(function () {
          if (over && !cursor.classList.contains('is-label') &&
              !cursor.classList.contains('is-view')) {
            label.textContent = 'Scroll';
            cursor.classList.add('is-scroll');
          }
        }, 1500) : null;
      };
      rooms.forEach(function (r) {
        r.addEventListener('mouseenter', function () { over = true; clear(); });
        r.addEventListener('mouseleave', function () { over = false; clear(); });
      });
      window.addEventListener('scroll', clear, { passive: true });
    })();
  }

  /* ============================================================
     Shared component initialisers
     ============================================================ */


  function initNavSolid() {
    var nav = document.querySelector('[data-nav]');
    if (!nav) return;
    var update = function () { nav.classList.toggle('is-solid', window.scrollY > 80); };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }


  function initSlider(gsapRef) {
    var root = document.querySelector('[data-slider]');
    if (!root) return;
    var track = root.querySelector('[data-slider-track]');
    var slides = track.children;
    var total = slides.length;
    var dotsWrap = root.querySelector('[data-slider-dots]');
    var currentEl = root.querySelector('[data-slider-current]');
    var index = 0;
    var timer = null;

    // Build dots
    var dots = [];
    for (var i = 0; i < total; i++) {
      var d = document.createElement('button');
      d.className = 'slider__dot';
      d.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      (function (n) {
        d.addEventListener('click', function () { goTo(n, true); });
      })(i);
      dotsWrap.appendChild(d);
      dots.push(d);
    }

    function render() {
      dots.forEach(function (d, n) {
        d.classList.remove('is-active');
        if (n === index) {
          void d.offsetWidth; // restart the fill transition
          d.classList.add('is-active');
        }
      });
      currentEl.textContent = ('0' + (index + 1)).slice(-2);
    }

    function goTo(i, userInitiated) {
      index = (i + total) % total;
      if (gsapRef) {
        gsapRef.to(track, { xPercent: -100 * index, duration: 0.8, ease: 'power2.inOut' });
      } else {
        track.style.transform = 'translateX(' + (-100 * index) + '%)';
      }
      render();
      if (userInitiated) restartAutoplay();
    }

    function restartAutoplay() {
      if (reduced) return;
      clearInterval(timer);
      timer = setInterval(function () { goTo(index + 1, false); }, 6000);
    }

    // Drag to navigate
    var dragStartX = null;
    root.addEventListener('pointerdown', function (e) {
      dragStartX = e.clientX;
      root.classList.add('is-dragging');
      clearInterval(timer);
    });
    window.addEventListener('pointerup', function (e) {
      if (dragStartX === null) return;
      var delta = e.clientX - dragStartX;
      dragStartX = null;
      root.classList.remove('is-dragging');
      if (Math.abs(delta) > 50) goTo(index + (delta < 0 ? 1 : -1), true);
      else restartAutoplay();
    });

    render();
    restartAutoplay();
  }
})();
