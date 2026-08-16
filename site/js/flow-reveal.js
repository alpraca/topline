/* ============================================================
   FLOW REVEAL - optional add-on
   ------------------------------------------------------------
   Splits a block into its VISUAL lines (the ones the browser
   actually wrapped, not just <br> positions), wraps each line in
   a clipping box, and wipes them in from alternating sides as
   they scroll into view.

   TO REMOVE: delete the two tags in index.html that load
   css/flow-reveal.css and js/flow-reveal.js. This file changes
   no markup on disk and nothing else references it, so the site
   returns to exactly what it was.

   Vanilla, no dependencies. GSAP's SplitText is the nicer tool
   for this but it is a paid Club GreenSock plugin and is not
   vendored here, so the line measuring is done by hand.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- WHAT IT RUNS ON --------------------------------
     Add or remove selectors here. Alternatively put data-flow on
     any element and it will be picked up without touching this
     list. Headings are deliberately absent: main.js already
     splits .hero__title, .section__title and .cta__title into
     masked lines, and two splitters on one node destroy each
     other's wrappers. */
  var TARGETS = [
    '.pull__quote p',
    '.pull__quote cite',
    '.work__intro p',
    '.who__text > p:not(.eyebrow)'
  ];

  var STAGGER = 90;                 // ms between lines of the same block
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');

  var io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        if (e.target.__frHost) e.target.__frHost.__frShown = true;
        io.unobserve(e.target);      // once only - never replays on scroll back
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
  }

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function collect() {
    var out = [];
    TARGETS.concat(['[data-flow]']).forEach(function (sel) {
      var found;
      try { found = document.querySelectorAll(sel); } catch (e) { return; }
      Array.prototype.forEach.call(found, function (el) {
        if (out.indexOf(el) < 0) out.push(el);
      });
    });
    return out.filter(usable);
  }

  function usable(el) {
    // never touch a heading the main motion layer already owns
    if (el.querySelector('.hl') || el.closest('.hl')) return false;
    var t = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (!t || t === '-') return false;          // i18n has not filled it in yet
    /* Only plain text, optionally with <br>. Inline markup cannot survive
       being regrouped into different lines, so those blocks are left alone
       rather than silently stripped. */
    for (var i = 0; i < el.children.length; i++) {
      var c = el.children[i];
      if (c.tagName !== 'BR' && c.className.indexOf('fr-') !== 0) return false;
    }
    return true;
  }

  /* Take an element over from the reveal system in main.js, which would
     otherwise fade and lift the whole block while this fades its lines -
     two animations on one node, visibly doubled. */
  function release(el) {
    el.removeAttribute('data-reveal');
    if (window.gsap) {
      gsap.killTweensOf(el);                    // drops just this target
      gsap.set(el, { clearProps: 'all' });      // undo any hidden start state
    }
  }

  function split(el) {
    if (el.__frSrc == null) el.__frSrc = el.innerHTML;

    // words as inline spans, so the browser tells us where it wrapped
    var probe = document.createElement('div');
    probe.innerHTML = el.__frSrc.replace(/<br\s*\/?>/gi, '  ');
    var words = (probe.textContent || '').replace(/\s+/g, ' ').trim().split(' ');
    if (!words.length) return false;

    el.innerHTML = words.map(function (w) {
      return w === '' ? '<br>' : '<span class="fr-w">' + esc(w) + '</span>';
    }).join(' ');

    // group words by the line box they landed on
    var lines = [], cur = null, lastTop = null;
    Array.prototype.forEach.call(el.querySelectorAll('.fr-w'), function (n) {
      var top = n.offsetTop;
      if (lastTop === null || Math.abs(top - lastTop) > 1) {
        cur = [];
        lines.push(cur);
        lastTop = top;
      }
      cur.push(n.textContent);
    });
    if (!lines.length) return false;

    var instant = el.__frShown ? ' fr-instant' : '';
    el.innerHTML = lines.map(function (w, i) {
      /* Every line but the last keeps a trailing space. Without it the
         element's textContent reads "projektojë,realizojë" - the words at
         the line break run together - and i18n, which decides whether to
         rewrite a node by comparing rendered text against the dictionary,
         would see a mismatch on every pass and replace innerHTML, wiping
         these wrappers out. The space collapses visually at a line end. */
      var tail = i < lines.length - 1 ? ' ' : '';
      return '<span class="fr-line' + instant + (el.__frShown ? ' is-in' : '') + '">' +
             '<span class="fr-line__in" style="transition-delay:' + (i * STAGGER) + 'ms">' +
             esc(w.join(' ')) + tail + '</span></span>';
    }).join('');
    return true;
  }

  function mount(el) {
    release(el);
    if (!split(el)) return;
    var lines = el.querySelectorAll('.fr-line');
    Array.prototype.forEach.call(lines, function (l) {
      l.__frHost = el;
      if (mq.matches || !io) { l.classList.add('is-in'); return; }
      if (l.classList.contains('is-in')) return;   // restored after a resize
      io.observe(l);
    });
    if (el.__frShown) {
      // drop the no-transition flag once the restored state has painted
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          Array.prototype.forEach.call(lines, function (l) {
            l.classList.remove('fr-instant');
          });
        });
      });
    }
  }

  function run() { collect().forEach(mount); }

  /* i18n runs after this and rewrites innerHTML on a language change, which
     both destroys these wrappers and invalidates the cached source, so the
     cache is dropped and the block is split again from the new text. */
  window.addEventListener('topline:i18n', function () {
    collect().forEach(function (el) { el.__frSrc = null; });
    setTimeout(run, 0);
  });

  // line breaks move when the column width changes
  var t = null;
  window.addEventListener('resize', function () {
    clearTimeout(t);
    t = setTimeout(function () {
      collect().forEach(function (el) { el.__frSrc = el.__frSrc; });
      run();
    }, 200);
  });

  if (mq.addEventListener) mq.addEventListener('change', run);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
  /* i18n and the font loader both settle after DOMContentLoaded; a second
     pass catches blocks that were still showing their "-" placeholder, and
     re-measures now the real face is in use. */
  window.addEventListener('load', function () { setTimeout(run, 60); });
})();
