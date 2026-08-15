/* ============================================================
   TOPLINE - WebGL plate layer

   One canvas draws every visible plate as a textured quad positioned to
   match its DOM rect, so scroll velocity, cursor ripple and inner parallax
   are handled uniformly in one draw loop.

   Written against raw WebGL rather than pulling in a library: OGL ships
   ES-modules only and this site has no bundler, and Three's UMD build is
   ~600KB, which the performance budget will not carry. This is ~5KB and
   has no dependencies.

   The layer refuses to start on touch, under Reduce Motion, or without a
   WebGL context, and the DOM images stay in place as the fallback.
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduced || !finePointer) return;

  var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-gl]'));
  if (!nodes.length) return;

  var canvas = document.createElement('canvas');
  canvas.className = 'gl';
  canvas.setAttribute('aria-hidden', 'true');
  var gl = canvas.getContext('webgl', { alpha: true, antialias: false,
    premultipliedAlpha: false, preserveDrawingBuffer: true });
  if (!gl) return;                                   // no context: DOM images stand
  document.body.appendChild(canvas);
  document.documentElement.classList.add('has-gl');

  var VERT = [
    'attribute vec2 a_pos;',
    'uniform vec4 u_rect;',            // x, y, w, h in pixels, top-left origin
    'uniform vec2 u_res;',
    'uniform float u_vel;',            // scroll velocity, normalised
    'uniform float u_reveal;',
    'varying vec2 v_uv;',
    'void main() {',
    '  v_uv = a_pos;',
    '  vec2 p = a_pos;',
    // gentle vertical bow + skew, proportional to velocity and capped
    '  float bow = sin(p.x * 3.14159) * u_vel * 0.06;',
    '  float skew = u_vel * 0.07;',
    '  p.y += bow;',
    '  p.x += (p.y - 0.5) * skew;',
    '  vec2 px = u_rect.xy + p * u_rect.zw;',
    '  vec2 clip = vec2(px.x / u_res.x * 2.0 - 1.0, 1.0 - px.y / u_res.y * 2.0);',
    '  gl_Position = vec4(clip, 0.0, 1.0);',
    '}'
  ].join('\n');

  var FRAG = [
    'precision mediump float;',
    'uniform sampler2D u_tex;',
    'uniform vec2 u_mouse;',           // 0..1 within the plate
    'uniform float u_hover;',
    'uniform float u_reveal;',
    'uniform float u_parallax;',
    'uniform vec2 u_cover;',           // aspect correction
    'varying vec2 v_uv;',
    'float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'float noise(vec2 p) {',
    '  vec2 i = floor(p), f = fract(p);',
    '  vec2 u = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),',
    '             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);',
    '}',
    'void main() {',
    '  vec2 uv = v_uv;',
    // the photo drifts inside its frame as the frame scrolls
    '  uv.y += u_parallax;',
    // soft ripple centred on the cursor, an inch of water deep
    '  float d = distance(uv, u_mouse);',
    '  float ring = smoothstep(0.45, 0.0, d);',
    '  float n = noise(uv * 6.0 + u_hover * 2.0);',
    '  uv += (n - 0.5) * 0.03 * ring * u_hover;',
    // cover-fit
    '  vec2 c = (uv - 0.5) * u_cover + 0.5;',
    '  if (c.x < 0.0 || c.x > 1.0 || c.y < 0.0 || c.y > 1.0) { gl_FragColor = vec4(0.078, 0.078, 0.078, 1.0); return; }',
    '  vec3 col = texture2D(u_tex, c).rgb;',
    // the same treatment the CSS applies, so GL and DOM match exactly
    '  float g = dot(col, vec3(0.2126, 0.7152, 0.0722));',
    '  g = (g - 0.5) * 1.08 + 0.5;',
    '  g *= 0.92;',
    '  vec3 outc = vec3(g);',
    // radial vignette
    '  float vig = smoothstep(0.85, 0.35, distance(v_uv, vec2(0.5)));',
    '  outc *= mix(0.55, 1.0, vig);',
    // mask wipe from the bottom edge
    '  float wipe = step(1.0 - u_reveal, v_uv.y);',
    '  gl_FragColor = vec4(outc, wipe);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn('gl:', gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }
  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  var prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0, 1,0, 0,1, 0,1, 1,0, 1,1]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  var U = {};
  ['u_rect','u_res','u_vel','u_reveal','u_tex','u_mouse','u_hover','u_parallax','u_cover']
    .forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  /* ---- plates ---------------------------------------------------- */
  var plates = nodes.map(function (el) {
    return { el: el, img: el.querySelector('img'), tex: null, ready: false,
             hover: 0, hoverT: 0, mx: 0.5, my: 0.5, reveal: 0, live: false };
  });

  function makeTexture(p) {
    if (p.tex || !p.img || !p.img.complete || !p.img.naturalWidth) return;
    var t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, p.img);
    p.tex = t; p.ready = true;
    p.aspect = p.img.naturalWidth / p.img.naturalHeight;
  }
  function dropTexture(p) {
    if (!p.tex) return;
    gl.deleteTexture(p.tex);
    p.tex = null; p.ready = false;
    p.el.classList.remove('gl-on');
  }

  /* only build a texture when the plate is near the viewport, and release it
     again once it is well away - the brief's disposal requirement */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var p = plates.filter(function (x) { return x.el === e.target; })[0];
      if (!p) return;
      p.live = e.isIntersecting;
      if (p.live) makeTexture(p); else dropTexture(p);
    });
  }, { rootMargin: '60% 0px 60% 0px' });
  plates.forEach(function (p) {
    io.observe(p.el);
    p.el.addEventListener('pointerenter', function () { p.hoverT = 1; });
    p.el.addEventListener('pointerleave', function () { p.hoverT = 0; });
    p.el.addEventListener('pointermove', function (e) {
      var r = p.el.getBoundingClientRect();
      p.mx = (e.clientX - r.left) / r.width;
      p.my = 1 - (e.clientY - r.top) / r.height;
    }, { passive: true });
  });

  /* ---- loop ------------------------------------------------------ */
  var dpr = Math.min(window.devicePixelRatio || 1, 2);   // capped, per the brief
  var drew = 0;
  window.__glDrew = function () { return drew; };
  var W = 0, H = 0, lastY = window.scrollY, vel = 0;

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  function frame() {
    var y = window.scrollY;
    var raw = (y - lastY);
    lastY = y;
    vel += (raw - vel) * 0.12;
    var v = Math.max(-1, Math.min(1, vel / 55));       // capped: never rubbery

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.u_res, W, H);

    for (var i = 0; i < plates.length; i++) {
      var p = plates[i];
      if (!p.live) continue;
      if (!p.ready) { makeTexture(p); if (!p.ready) continue; }
      var r = p.el.getBoundingClientRect();
      if (r.bottom < -50 || r.top > H + 50) continue;

      p.hover += (p.hoverT - p.hover) * (p.hoverT > p.hover ? 0.028 : 0.018);  // 600ms in, 900ms out
      var progress = 1 - Math.max(0, Math.min(1, (r.top + r.height) / (H + r.height)));
      p.reveal += (1 - p.reveal) * 0.06;

      var frameAspect = r.width / r.height;
      var cover = p.aspect > frameAspect
        ? [frameAspect / p.aspect, 1]
        : [1, p.aspect / frameAspect];

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, p.tex);
      gl.uniform1i(U.u_tex, 0);
      gl.uniform4f(U.u_rect, r.left, r.top, r.width, r.height);
      gl.uniform1f(U.u_vel, v);
      gl.uniform1f(U.u_reveal, Math.min(1, p.reveal));
      gl.uniform2f(U.u_mouse, p.mx, p.my);
      gl.uniform1f(U.u_hover, p.hover);
      gl.uniform1f(U.u_parallax, (progress - 0.5) * 0.12);   // ~1.12x inside the frame
      gl.uniform2f(U.u_cover, cover[0], cover[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      /* Prove it drew before hiding the DOM image. One readback per plate,
         at the centre of where it should have painted. If the pixel is
         empty the effect is silently abandoned for that plate and the real
         photograph stays on screen. */
      if (!p.checked && p.reveal > 0.6) {
        p.checked = true;
        var sx = Math.round((r.left + r.width / 2) * dpr);
        var sy = Math.round((H - (r.top + r.height / 2)) * dpr);
        if (sx > 0 && sy > 0 && sx < canvas.width && sy < canvas.height) {
          var px = new Uint8Array(4);
          gl.readPixels(sx, sy, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
          if (px[3] > 8) { p.el.classList.add('gl-on'); p.proved = true; drew++; }
        }
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // if the context is lost, fall back to the DOM images rather than blank out
  canvas.addEventListener('webglcontextlost', function (e) {
    e.preventDefault();
    document.documentElement.classList.remove('has-gl');
    plates.forEach(function (p) { p.el.classList.remove('gl-on'); });
  });
})();
