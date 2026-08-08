/* ============================================================
   Brands page — hero build-in, counters, view toggle,
   row reveals and cursor-following logo preview.
   Runs alongside main.js (which owns Lenis, cursor, magnetic).
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var isMobile = window.matchMedia('(max-width: 820px)').matches;
  var hasGsap = typeof window.gsap !== 'undefined';

  var list = document.querySelector('[data-bp-list]');
  var grid = document.querySelector('[data-bp-grid]');
  var pill = document.querySelector('.bp-views__pill');
  var viewBtns = Array.prototype.slice.call(document.querySelectorAll('.bp-view'));

  /* ---------- View toggle (works with or without GSAP) ---------- */
  function placePill(btn, animate) {
    if (!pill || !btn) return;
    var props = { left: btn.offsetLeft + 'px', width: btn.offsetWidth + 'px' };
    if (hasGsap && animate && !reduced) {
      gsap.to(pill, { left: props.left, width: props.width, duration: 0.45, ease: 'power3.inOut' });
    } else {
      pill.style.left = props.left;
      pill.style.width = props.width;
    }
  }

  function setView(name, animate) {
    viewBtns.forEach(function (b) {
      var on = b.getAttribute('data-view') === name;
      b.classList.toggle('is-active', on);
      if (on) placePill(b, animate);
    });
    var showing = name === 'grid' ? grid : list;
    var hiding = name === 'grid' ? list : grid;
    if (!showing || !hiding) return;

    if (hasGsap && animate && !reduced) {
      gsap.to(hiding, {
        autoAlpha: 0, y: -10, duration: 0.22, ease: 'power2.in',
        onComplete: function () {
          hiding.hidden = true;
          gsap.set(hiding, { clearProps: 'all' });
          showing.hidden = false;
          var kids = showing.children;
          gsap.fromTo(showing, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 });
          gsap.fromTo(kids,
            { y: 18, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.5, ease: 'power3.out', stagger: 0.02, clearProps: 'transform' });
        }
      });
    } else {
      hiding.hidden = true;
      showing.hidden = false;
    }
  }

  viewBtns.forEach(function (b) {
    b.addEventListener('click', function () { setView(b.getAttribute('data-view'), true); });
  });
  // initial pill position (after fonts settle so widths are final)
  placePill(document.querySelector('.bp-view.is-active'), false);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      placePill(document.querySelector('.bp-view.is-active'), false);
    });
  }
  window.addEventListener('resize', function () {
    placePill(document.querySelector('.bp-view.is-active'), false);
  });

  /* ---------- Static fallbacks ---------- */
  if (!hasGsap || reduced) {
    document.querySelectorAll('[data-bp-count]').forEach(function (el) {
      el.textContent = el.getAttribute('data-bp-count');
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Hero build-in ---------- */
  var hY = isMobile ? 0.6 : 1;
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('.bp-hero__eyebrow', { y: 20 * hY, autoAlpha: 0, duration: 0.7 }, 0.15)
    .from('.bp-w > span', { yPercent: 108, duration: 1, ease: 'power4.out', stagger: 0.1 }, 0.25)
    .from('.bp-hero__lede', { y: 26 * hY, autoAlpha: 0, duration: 0.7 }, 0.6)
    .from('.bp-stat', { y: 24 * hY, autoAlpha: 0, duration: 0.6, stagger: 0.1 }, 0.75)
    .from('.bp-hero__scroll', { autoAlpha: 0, duration: 0.6 }, 1.1);

  /* ---------- Counters ---------- */
  document.querySelectorAll('[data-bp-count]').forEach(function (el) {
    var target = parseInt(el.getAttribute('data-bp-count'), 10);
    var state = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 92%', once: true,
      onEnter: function () {
        gsap.to(state, {
          v: target, duration: 1.7, ease: 'power2.out',
          onUpdate: function () { el.textContent = Math.round(state.v); }
        });
      }
    });
  });

  /* ---------- List rows reveal ---------- */
  if (list) {
    ScrollTrigger.batch(list.children, {
      start: 'top 92%', once: true,
      onEnter: function (batch) {
        gsap.from(batch, {
          y: isMobile ? 14 : 26, autoAlpha: 0,
          duration: isMobile ? 0.5 : 0.7, ease: 'power3.out', stagger: 0.045
        });
      }
    });
  }

  /* ---------- Cursor-following logo preview ---------- */
  var preview = document.querySelector('[data-bp-preview]');
  if (preview && finePointer && !isMobile) {
    var pimg = preview.querySelector('img');
    var xTo = gsap.quickTo(preview, 'x', { duration: 0.5, ease: 'power3.out' });
    var yTo = gsap.quickTo(preview, 'y', { duration: 0.5, ease: 'power3.out' });
    var active = false;

    document.querySelectorAll('[data-brand-row]').forEach(function (row) {
      var logo = row.getAttribute('data-logo');
      row.addEventListener('mouseenter', function () {
        if (!logo) return;               // Ademi has no logo file — skip preview
        pimg.src = 'assets/brands/' + logo;
        pimg.alt = row.getAttribute('data-name') || '';
        active = true;
        gsap.to(preview, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'power3.out' });
      });
      row.addEventListener('mouseleave', function () {
        active = false;
        gsap.to(preview, { autoAlpha: 0, scale: 0.9, duration: 0.28, ease: 'power2.in' });
      });
    });

    window.addEventListener('mousemove', function (e) {
      if (!active) return;
      xTo(e.clientX);
      yTo(e.clientY);
    });
  }
})();
