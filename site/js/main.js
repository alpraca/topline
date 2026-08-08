/* ============================================================
   TOPLINE - motion system
   Lenis smooth scroll · GSAP + ScrollTrigger · custom cursor
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var isMobile = window.matchMedia('(max-width: 820px)').matches;
  var hasGsap = typeof window.gsap !== 'undefined';

  // Shorter travel + snappier timing on small screens
  var rY = isMobile ? 16 : 40;    // reveal translate distance
  var rDur = isMobile ? 0.65 : 0.9;

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

  /* ---------- Touch: colour arrives on scroll, no tap needed ----------
     Deliberately OUTSIDE the reduced-motion early return: phones with
     "Reduce Motion" on would otherwise never colour anything, and this
     is a colour change, not movement. */
  function initTouchInView() {
    if (finePointer || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        e.target.classList.toggle('is-inview', e.isIntersecting);
      });
    }, { threshold: 0.35, rootMargin: '-8% 0px -8% 0px' });
    document.querySelectorAll('[data-card], [data-idx-card], [data-bp-card], [data-brand-row], .brands__item')
      .forEach(function (el) { io.observe(el); });
  }
  initTouchInView();

  /* ---------- Static fallbacks (no GSAP or reduced motion) ---------- */
  function initCountersInstant() {
    document.querySelectorAll('[data-counter]').forEach(function (el) {
      el.textContent = el.getAttribute('data-counter');
    });
  }

  /* Italic Fraunces: below-the-fold only, so load it after the page settles
     (keeps 80KB out of the critical window; roman is synthesized until then) */
  if ('FontFace' in window) {
    window.addEventListener('load', function () {
      var italic = new FontFace('Fraunces', "url('assets/fonts/fraunces-italic-var.woff2') format('woff2')", {
        style: 'italic', weight: '300 700', display: 'swap'
      });
      italic.load().then(function (f) { document.fonts.add(f); }).catch(function () {});
    });
  }

  if (!hasGsap || reduced) {
    initCountersInstant();
    initDeferredImages();
    initTabs(null);
    initSlider(null);
    initNavSolid();
    initLightbox();
    return;
  }

  initDeferredImages();
  initLightbox();

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Lenis smooth scroll ---------- */
  var lenis = null;
  if (typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
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
    gsap.timeline()
      .fromTo(heroImg, { scale: 1.05 }, { scale: 1, duration: 0.8, ease: 'power2.out' })
      .to(heroImg, { scale: 1.08, duration: 18, ease: 'none', yoyo: true, repeat: -1 }, 1.5);

    // Hero background parallax (media drifts slower than scroll) - desktop only.
    // scrub is smoothed (0.5s catch-up) so the layer always settles back to its
    // resting position even after fast scroll flicks - no stuck offset at top.
    if (!isMobile) {
      gsap.to('[data-hero-media]', {
        yPercent: 14,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.5 }
      });
    }
  }

  /* ---------- Section reveals ---------- */
  document.querySelectorAll('[data-reveal-group]').forEach(function (group) {
    var items = group.querySelectorAll('[data-reveal]');
    if (!items.length) return;
    gsap.from(items, {
      y: rY, autoAlpha: 0, duration: rDur, ease: 'power3.out', stagger: isMobile ? 0.07 : 0.1,
      scrollTrigger: { trigger: group, start: 'top 80%', once: true }
    });
  });

  var loose = Array.prototype.filter.call(
    document.querySelectorAll('[data-reveal]'),
    function (el) { return !el.closest('[data-reveal-group]'); }
  );
  ScrollTrigger.batch(loose, {
    start: 'top 85%',
    once: true,
    onEnter: function (batch) {
      gsap.from(batch, {
        y: isMobile ? 18 : 50, autoAlpha: 0, duration: isMobile ? 0.7 : 1,
        ease: 'power3.out', stagger: isMobile ? 0.07 : 0.1
      });
    }
  });

  /* ---------- Counters ---------- */
  document.querySelectorAll('[data-counter]').forEach(function (el) {
    var target = parseInt(el.getAttribute('data-counter'), 10);
    var state = { val: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 60%',
      once: true,
      onEnter: function () {
        gsap.to(state, {
          val: target,
          duration: 1.8,
          ease: 'power2.out',
          onUpdate: function () { el.textContent = Math.round(state.val); }
        });
      }
    });
  });

  /* ---------- Studio portrait parallax - desktop only ---------- */
  if (!isMobile) {
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

  /* ---------- Tabs + slider (animated paths) ---------- */
  initTabs(gsap);
  initSlider(gsap);

  /* ---------- Custom cursor ---------- */
  if (finePointer) {
    var cursor = document.querySelector('.cursor');
    var xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' });
    var yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' });
    gsap.set(cursor, { xPercent: 0, yPercent: 0, autoAlpha: 0 });

    window.addEventListener('mousemove', function (e) {
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

  function initTabs(gsapRef) {
    var root = document.querySelector('[data-tabs]');
    if (!root) return;
    var tabs = Array.prototype.slice.call(root.querySelectorAll('.tabs__tab'));
    var panels = Array.prototype.slice.call(root.querySelectorAll('.tabs__panel'));
    var indicator = root.querySelector('[data-tabs-indicator]');
    var current = 0;
    var animating = false;

    function placeIndicator(i, animate) {
      var t = tabs[i];
      var props = { left: t.offsetLeft, width: t.offsetWidth };
      if (gsapRef && animate) {
        gsapRef.to(indicator, Object.assign({ duration: 0.5, ease: 'power3.inOut' }, props));
      } else {
        indicator.style.left = props.left + 'px';
        indicator.style.width = props.width + 'px';
      }
    }

    function activate(i) {
      if (i === current || animating) return;
      var prevPanel = panels[current];
      var nextPanel = panels[i];
      tabs[current].classList.remove('is-active');
      tabs[current].setAttribute('aria-selected', 'false');
      tabs[i].classList.add('is-active');
      tabs[i].setAttribute('aria-selected', 'true');
      placeIndicator(i, true);

      if (gsapRef) {
        animating = true;
        gsapRef.to(prevPanel, {
          autoAlpha: 0, y: -12, duration: 0.25, ease: 'power2.in',
          onComplete: function () {
            prevPanel.hidden = true;
            prevPanel.classList.remove('is-active');
            gsapRef.set(prevPanel, { clearProps: 'all' });
            nextPanel.hidden = false;
            nextPanel.classList.add('is-active');
            gsapRef.fromTo(nextPanel,
              { autoAlpha: 0, y: 18 },
              { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out',
                onComplete: function () { animating = false; } });
          }
        });
      } else {
        prevPanel.hidden = true;
        prevPanel.classList.remove('is-active');
        nextPanel.hidden = false;
        nextPanel.classList.add('is-active');
      }
      current = i;
    }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { activate(i); });
    });

    // Position indicator once fonts have settled, and keep it in place on resize
    placeIndicator(0, false);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { placeIndicator(current, false); });
    }
    window.addEventListener('resize', function () { placeIndicator(current, false); });
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
