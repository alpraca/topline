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
    document.querySelectorAll('[data-svc-row], [data-work-slide], [data-idx-card], [data-bp-card], [data-brand-row], .gallery__item')
      .forEach(function (el) { io.observe(el); });
  }
  initTouchInView();

  /* ---------- Page load ----------
     The whole page fades up from black. Pure opacity, so it costs nothing
     and is safe to keep under Reduce Motion. */
  requestAnimationFrame(function () { document.documentElement.classList.add('is-ready'); });


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
    // ambient: 1.0 -> 1.06 over 20s, alternating, forever
    gsap.to(heroImg, { scale: 1.06, duration: 20, ease: 'none', yoyo: true, repeat: -1 });
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

  /* ---------- Custom cursor (desktop only) ---------- */
  if (finePointer && !reduced) {
    var cursor = document.querySelector('.cursor');
    var cx = 0, cy = 0, tx = 0, ty = 0;
    window.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      cursor.classList.add('is-live');
    }, { passive: true });
    gsap.ticker.add(function () {
      cx += (tx - cx) * 0.15;              // lerp, per the brief
      cy += (ty - cy) * 0.15;
      cursor.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
    });
    document.querySelectorAll('a, button, .work__slide, .index__item, .gallery__item, [data-cursor]')
      .forEach(function (el) {
        el.addEventListener('mouseenter', function () { cursor.classList.add('is-label'); });
        el.addEventListener('mouseleave', function () { cursor.classList.remove('is-label'); });
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
