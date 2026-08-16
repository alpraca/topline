/* ============================================================
   SCROLL DECOR - optional add-on
   ------------------------------------------------------------
   1. Oversized watermark text behind a section, drifting slightly
      against the scroll.
   2. A mark whose rotation is read from scrollY every frame, so it
      turns forward on the way down and backward on the way up.

   TO REMOVE: delete the two tags in index.html that load
   css/scroll-decor.css and js/scroll-decor.js. Everything here is
   built at runtime; no markup on disk is touched.

   Emptying either list below disables that one effect on its own.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- WHAT GETS A WATERMARK -------------------------
     Every word here already appears on the site, so nothing new is
     being claimed about the business.
       ink: true  - section sits on the bone-white ground
       mid: true  - centre it vertically instead of behind the heading

     .cta is deliberately absent: its logo mosaic and dark veil are both
     positioned children, so a watermark behind them is invisible, and
     that section is already carrying the burgundy and the logo field. */
  var GHOSTS = [
    { sel: '.gal',   text: 'Work' },
    { sel: '.svc',   text: 'Services' },
    { sel: '.stats', text: 'Recognition', ink: true, mid: true }
  ];

  /* ---------- WHAT SPINS ------------------------------------
     factor = degrees per pixel scrolled. Larger spins faster. */
  var SPINNERS = [
    { sel: '.seal svg', factor: 0.15 }
  ];

  var DRIFT = 0.08;          // watermark px moved per px scrolled
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');

  var ghosts = [];
  var spinners = [];

  function buildGhosts() {
    GHOSTS.forEach(function (cfg) {
      var host = document.querySelector(cfg.sel);
      if (!host || host.querySelector(':scope > .ghost')) return;
      host.classList.add('gd-host');

      var wrap = document.createElement('div');
      wrap.className = 'ghost' + (cfg.ink ? ' ghost--ink' : '') + (cfg.mid ? ' ghost--mid' : '');
      /* decorative only - it must never be announced or land in the
         copy buffer alongside the real text */
      wrap.setAttribute('aria-hidden', 'true');

      var t = document.createElement('span');
      t.className = 'ghost__t';
      t.textContent = cfg.text;
      wrap.appendChild(t);

      host.insertBefore(wrap, host.firstChild);
      ghosts.push({ host: host, text: t });
    });
  }

  function findSpinners() {
    SPINNERS.forEach(function (cfg) {
      var el = document.querySelector(cfg.sel);
      if (!el) return;
      el.classList.add('gd-spin');
      spinners.push({ el: el, factor: cfg.factor });
    });
  }

  var queued = false;
  function frame() {
    queued = false;
    var y = window.scrollY || window.pageYOffset || 0;

    /* `translate` and `rotate` are used rather than `transform` so that
       nothing here can fight a transform another layer already owns on the
       same node - the fault that once made elements appear to move twice. */
    for (var i = 0; i < ghosts.length; i++) {
      var g = ghosts[i];
      var r = g.host.getBoundingClientRect();
      if (r.bottom < -200 || r.top > window.innerHeight + 200) continue;  // off screen
      // drift measured from the section's own passage, not absolute scroll,
      // so each watermark moves through the same range wherever it sits
      g.text.style.translate = ((window.innerHeight - r.top) * DRIFT).toFixed(1) + 'px';
    }

    for (var k = 0; k < spinners.length; k++) {
      spinners[k].el.style.rotate = (y * spinners[k].factor).toFixed(2) + 'deg';
    }
  }

  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(frame);
  }

  function start() {
    buildGhosts();
    findSpinners();
    if (!ghosts.length && !spinners.length) return;
    if (mq.matches) { frame(); return; }        // place once, then hold still
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    frame();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
  // the seal's <svg> is in the markup from the start, but re-checking after
  // load costs nothing and covers anything added late
  window.addEventListener('load', function () { setTimeout(onScroll, 60); });
})();
