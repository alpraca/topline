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
    document.querySelectorAll('[data-svc-row], [data-work-slide], [data-idx-card], [data-bp-card], [data-brand-row]')
      .forEach(function (el) { io.observe(el); });
  }
  initTouchInView();

  /* ---------- Hero ember field ----------
     Soft burgundy glows drifting slowly, plus a few thin hairlines. Canvas
     rather than DOM nodes so it stays cheap. Responsive in three senses:
     the count and size scale with the viewport, it rebuilds on resize, and
     the field drifts gently toward the pointer. Static under Reduce Motion. */
  function initEmbers() {
    var host = document.querySelector('[data-embers]');
    if (!host) return;
    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'width:100%;height:100%;display:block';
    host.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var w = 0, h = 0, dots = [], lines = [], raf = null;
    var pointer = { x: 0, y: 0, cx: 0, cy: 0 };   // target and eased current

    var GLOW = '178, 51, 71';                      // --c-accent

    function build() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = host.offsetWidth; h = host.offsetHeight;
      if (!w || !h) return;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // scale the field with the viewport rather than a fixed count
      var area = w * h;
      var count = Math.round(Math.min(46, Math.max(12, area / 26000)));
      var unit = Math.sqrt(area) / 34;             // radius scales with the box

      dots = [];
      for (var i = 0; i < count; i++) {
        var depth = 0.35 + Math.random() * 0.65;   // also drives parallax
        dots.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: unit * (1.4 + Math.random() * 3.4),
          a: 0.14 + Math.random() * 0.20,   // peak 0.34; text stays >9:1
          depth: depth,
          vx: (Math.random() - 0.5) * 16,          // px per second
          vy: -9 - Math.random() * 21,
          pulse: Math.random() * Math.PI * 2
        });
      }
      lines = [];
      for (var k = 0; k < 5; k++) {
        lines.push({ y: Math.random() * h, v: 6 + Math.random() * 14, a: 0.07 + Math.random() * 0.07 });
      }
    }

    var last = 0;
    function frame(now) {
      // seconds since the previous frame, clamped so a background tab that
      // wakes up does not teleport the whole field
      var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
      last = now;

      pointer.cx += (pointer.x - pointer.cx) * 0.03;
      pointer.cy += (pointer.y - pointer.cy) * 0.03;
      ctx.clearRect(0, 0, w, h);

      lines.forEach(function (l) {
        l.y += l.v * dt;
        if (l.y > h) l.y = -2;
        ctx.strokeStyle = 'rgba(' + GLOW + ', ' + l.a + ')';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, l.y); ctx.lineTo(w, l.y); ctx.stroke();
      });

      dots.forEach(function (d) {
        d.x += d.vx * dt; d.y += d.vy * dt;
        d.pulse += dt * 0.6;
        var r = d.r * (1 + Math.sin(d.pulse) * 0.12);   // a slow breath
        if (d.y + d.r < 0) { d.y = h + d.r; d.x = Math.random() * w; }
        if (d.x + d.r < 0) d.x = w + d.r;
        if (d.x - d.r > w) d.x = -d.r;
        var px = d.x + pointer.cx * d.depth;
        var py = d.y + pointer.cy * d.depth;
        var g = ctx.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0, 'rgba(' + GLOW + ', ' + d.a + ')');
        g.addColorStop(1, 'rgba(' + GLOW + ', 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
      });

      raf = requestAnimationFrame(frame);
    }

    build();
    if (!w || !h) return;
    if (reduced) { frame(); cancelAnimationFrame(raf); return; }   // one static paint
    frame();

    if (finePointer) {
      window.addEventListener('mousemove', function (e) {
        // a gentle lean, at most ~26px, away from centre
        pointer.x = (e.clientX / window.innerWidth - 0.5) * -52;
        pointer.y = (e.clientY / window.innerHeight - 0.5) * -52;
      }, { passive: true });
    }
    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(build, 200);
    });
  }
  initEmbers();

  /* ---------- Selected-work carousel ---------- */
  function initWork() {
    var vp = document.querySelector('[data-work-viewport]');
    if (!vp) return;
    var down = false, startX = 0, startScroll = 0, moved = 0;
    vp.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') return;
      e.preventDefault();
      down = true; moved = 0;
      startX = e.clientX; startScroll = vp.scrollLeft;
      vp.classList.add('is-dragging');
    });
    vp.addEventListener('dragstart', function (e) { e.preventDefault(); });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > moved) moved = Math.abs(dx);
      vp.scrollLeft = startScroll - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return;
      down = false;
      vp.classList.remove('is-dragging');
    });
    vp.addEventListener('click', function (e) {
      if (moved > 8) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    var next = document.querySelector('[data-work-next]');
    if (next) {
      next.addEventListener('click', function () {
        var slide = vp.querySelector('.work__slide');
        var step = slide ? slide.getBoundingClientRect().width + 14 : vp.clientWidth * 0.8;
        vp.scrollBy({ left: step, behavior: 'smooth' });
      });
      var sync = function () {
        next.disabled = vp.scrollLeft >= vp.scrollWidth - vp.clientWidth - 4;
      };
      vp.addEventListener('scroll', sync, { passive: true });
      window.addEventListener('resize', sync);
      sync();
    }
  }
  initWork();


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
    initLightbox();
    return;
  }

  initDeferredImages();
  initLightbox();

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
      lerp: 0.1,
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
    var heroTl = gsap.timeline()
      .fromTo(heroImg, { scale: 1.05 }, { scale: 1, duration: 0.8, ease: 'power2.out' });
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
     clearProps hands transform back to CSS once the reveal has landed. While
     GSAP owns an element it also pins translate/rotate/scale to `none` inline,
     which would otherwise block the CSS hover lift on cards. */
  var revealClear = 'transform,translate,rotate,scale';

  document.querySelectorAll('[data-reveal-group]').forEach(function (group) {
    var items = group.querySelectorAll('[data-reveal]');
    if (!items.length) return;
    gsap.from(items, {
      y: rY, autoAlpha: 0, duration: rDur, ease: 'power3.out', stagger: 0.06,
      clearProps: revealClear,
      // phones are short, so a heading could sit blank at the bottom edge for
      // a while at 80% - fire it closer to the moment it appears
      scrollTrigger: { trigger: group, start: isMobile ? 'top 92%' : 'top 80%', once: true }
    });
  });

  var loose = Array.prototype.filter.call(
    document.querySelectorAll('[data-reveal]'),
    function (el) { return !el.closest('[data-reveal-group]'); }
  );
  if (loose.length) {
    var lY = isMobile ? 14 : 24;
    /* Hide these up front rather than letting the batch do it on enter.
       ScrollTrigger.batch only builds its tween in onEnter, which fires once
       the element is already a little way into the viewport - so it was
       painted in place for a frame or two, then snapped down and animated
       back up. Setting the start state now means it is never seen in place. */
    gsap.set(loose, { y: lY, autoAlpha: 0 });
    ScrollTrigger.batch(loose, {
      start: 'top 92%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          y: 0, autoAlpha: 1, duration: isMobile ? 0.4 : 0.45,
          ease: 'power3.out', stagger: 0.06,
          clearProps: revealClear
        });
      }
    });
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

  /* ---------- Custom cursor ---------- */
  if (finePointer) {
    var cursor = document.querySelector('.cursor');
    var xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' });
    var yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' });
    gsap.set(cursor, { xPercent: 0, yPercent: 0, autoAlpha: 0 });

    window.addEventListener('mousemove', function (e) {
      cursor.classList.add('is-live');
      gsap.to(cursor, { autoAlpha: 1, duration: 0.2 });
      xTo(e.clientX);
      yTo(e.clientY);
    });
    document.documentElement.addEventListener('mouseleave', function () {
      gsap.to(cursor, { autoAlpha: 0, duration: 0.2 });
    });

    var label = cursor.querySelector('.cursor__label');
    document.querySelectorAll('[data-cursor]').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        label.textContent = el.getAttribute('data-cursor') || 'View';
        cursor.classList.add('is-label');
      });
      el.addEventListener('mouseleave', function () {
        cursor.classList.remove('is-label');
      });
    });
  }

  /* ---------- Magnetic buttons ---------- */
  if (finePointer) {
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      var strength = 0.32;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var relX = e.clientX - (r.left + r.width / 2);
        var relY = e.clientY - (r.top + r.height / 2);
        gsap.to(el, { x: relX * strength, y: relY * strength, duration: 0.4, ease: 'power3.out' });
      });
      el.addEventListener('mouseleave', function () {
        gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }

  /* ============================================================
     Shared component initialisers
     ============================================================ */

  function initLightbox() {
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-full]'));
    if (!items.length) return;
    var box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Image viewer');
    box.innerHTML =
      '<button class="lightbox__btn lightbox__close" aria-label="Close">×</button>' +
      '<button class="lightbox__btn lightbox__prev" aria-label="Previous">←</button>' +
      '<img alt="">' +
      '<button class="lightbox__btn lightbox__next" aria-label="Next">→</button>' +
      '<span class="lightbox__count"></span>';
    document.body.appendChild(box);
    var img = box.querySelector('img');
    var countEl = box.querySelector('.lightbox__count');
    var idx = 0;

    function show(i) {
      idx = (i + items.length) % items.length;
      img.src = items[idx].getAttribute('data-full');
      var thumb = items[idx].querySelector('img');
      img.alt = thumb ? thumb.alt : '';
      countEl.textContent = (idx + 1) + ' / ' + items.length;
    }
    function open(i) {
      show(i);
      box.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      box.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    items.forEach(function (el, i) {
      el.addEventListener('click', function () { open(i); });
    });
    box.querySelector('.lightbox__close').addEventListener('click', close);
    box.querySelector('.lightbox__prev').addEventListener('click', function () { show(idx - 1); });
    box.querySelector('.lightbox__next').addEventListener('click', function () { show(idx + 1); });
    box.addEventListener('click', function (e) { if (e.target === box || e.target === img) close(); });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  function initNavSolid() {
    var nav = document.querySelector('[data-nav]');
    var hero = document.querySelector('.hero, .bp-hero');
    if (!nav || !hero) return;
    var update = function () {
      nav.classList.toggle('is-solid', window.scrollY > hero.offsetHeight * 0.55);
    };
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
