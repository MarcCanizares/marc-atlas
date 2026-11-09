/* ==========================================================================
   Para Victoria · script.js
   Sin dependencias. Estructura:
     1. Utilidades y estado
     2. Carga de imágenes
     3. Partículas (polvo de luz + pétalos)
     4. Ramo de violetas (SVG generado)
     5. Navegación entre escenas
     6. Lógica de cada escena
     7. Escena final: mensaje progresivo + canción
     8. Arranque
   ========================================================================== */
(() => {
  'use strict';

  /* ---------- 1. Utilidades y estado ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const T = (ms) => (RM ? ms * 0.35 : ms); // acorta esperas si se prefiere menos movimiento

  const scenes = $$('.scene');
  const body = document.body;
  const finale = $('#finale');
  const finished = new Set(); // escenas cuya secuencia ya se completó (al volver se muestran enteras)

  let current = 0;
  let locked = false;
  let timers = [];

  const later = (fn, ms) => {
    const id = setTimeout(fn, T(ms));
    timers.push(id);
    return id;
  };
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
  const show = (el) => el && el.classList.add('in');

  /** Ejecuta fn ya (fast) o tras ms. */
  const at = (fn, ms, fast) => (fast ? fn() : later(fn, ms));

  /* ---------- 2. Carga de imágenes ---------- */
  function loadImgs(root) {
    $$('img[data-src]', root).forEach((img) => {
      const src = img.dataset.src;
      img.removeAttribute('data-src');
      img.loading = 'eager';
      img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
      img.src = src;
      if (img.complete && img.naturalWidth) img.classList.add('loaded');
    });
  }
  const preload = (n) => scenes[n] && loadImgs(scenes[n]);

  /* ---------- 3. Partículas ---------- */
  const fx = (() => {
    const canvas = $('#fx');
    const ctx = canvas.getContext('2d');
    const PETAL_COLORS = ['#b9a3d9', '#a77fb8', '#8f62c6', '#d8c9ee', '#6d3aa6', '#c9b2e6'];
    let w = 0, h = 0, dpr = 1, last = 0, raf = 0;
    let dust = [], petals = [], petalsOn = false, spawnAcc = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(14, Math.min(44, Math.round((w * h) / 24000)));
      dust = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: 0.6 + Math.random() * 1.6,
        vx: (Math.random() - 0.5) * 0.008,
        vy: -(0.006 + Math.random() * 0.02),
        a: 0.15 + Math.random() * 0.4,
        ph: Math.random() * 6.28,
        gold: Math.random() > 0.45,
      }));
      if (RM) draw(0);
    }

    function spawnPetal() {
      const s = 6 + Math.random() * 7;
      petals.push({
        x: Math.random() * w, y: -20, s,
        vy: 0.035 + Math.random() * 0.045,
        sway: 0.4 + Math.random() * 0.9,
        ph: Math.random() * 6.28,
        rot: Math.random() * 6.28,
        vr: (Math.random() - 0.5) * 0.0025,
        flip: Math.random() * 6.28,
        color: PETAL_COLORS[(Math.random() * PETAL_COLORS.length) | 0],
      });
    }

    function draw(dt) {
      ctx.clearRect(0, 0, w, h);
      const t = performance.now() / 1000;

      for (const d of dust) {
        d.x += d.vx * dt; d.y += d.vy * dt;
        if (d.y < -6) { d.y = h + 6; d.x = Math.random() * w; }
        if (d.x < -6) d.x = w + 6; else if (d.x > w + 6) d.x = -6;
        const tw = 0.55 + 0.45 * Math.sin(t * 0.9 + d.ph);
        ctx.globalAlpha = d.a * tw;
        ctx.fillStyle = d.gold ? '#ecd9a2' : '#cdb8ea';
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.283); ctx.fill();
      }

      if (petalsOn && petals.length < 26) {
        spawnAcc += dt;
        if (spawnAcc > 380) { spawnAcc = 0; spawnPetal(); }
      }
      for (let i = petals.length - 1; i >= 0; i--) {
        const p = petals[i];
        p.y += p.vy * dt;
        p.x += Math.sin(t * p.sway + p.ph) * 0.35;
        p.rot += p.vr * dt; p.flip += 0.0016 * dt;
        if (p.y > h + 24) { petals.splice(i, 1); continue; }
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.scale(Math.max(0.25, Math.abs(Math.cos(p.flip))), 1);
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.s);
        ctx.bezierCurveTo(p.s * 0.9, -p.s * 0.5, p.s * 0.7, p.s * 0.7, 0, p.s);
        ctx.bezierCurveTo(-p.s * 0.7, p.s * 0.7, -p.s * 0.9, -p.s * 0.5, 0, -p.s);
        ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    function loop(now) {
      const dt = Math.min(now - (last || now), 50);
      last = now;
      draw(dt);
      raf = requestAnimationFrame(loop);
    }

    function start() {
      resize();
      window.addEventListener('resize', resize);
      if (RM) return; // con movimiento reducido: polvo estático, sin pétalos
      raf = requestAnimationFrame(loop);
      document.addEventListener('visibilitychange', () => {
        cancelAnimationFrame(raf);
        if (!document.hidden) { last = 0; raf = requestAnimationFrame(loop); }
      });
    }

    return { start, petals: (on) => { petalsOn = on && !RM; } };
  })();

  /* ---------- 4. Ramo de violetas (SVG) ---------- */
  // k = orden de aparición; el DOM se ordena por y para que las flores bajas queden delante.
  const FLOWERS = [
    { k: 0, x: 200, y: 200, r: 0, s: 1.3, v: 0 },
    { k: 1, x: 200, y: 275, r: 0, s: 1.35, v: 1 },
    { k: 2, x: 153, y: 235, r: -12, s: 1.25, v: 1 },
    { k: 3, x: 247, y: 235, r: 12, s: 1.25, v: 0 },
    { k: 4, x: 158, y: 308, r: -8, s: 1.2, v: 2 },
    { k: 5, x: 242, y: 308, r: 8, s: 1.2, v: 1 },
    { k: 6, x: 140, y: 158, r: -18, s: 1.2, v: 0 },
    { k: 7, x: 260, y: 158, r: 18, s: 1.2, v: 2 },
    { k: 8, x: 118, y: 285, r: -28, s: 1.15, v: 0 },
    { k: 9, x: 284, y: 285, r: 28, s: 1.15, v: 2 },
    { k: 10, x: 95, y: 214, r: -35, s: 1.1, v: 1 },
    { k: 11, x: 306, y: 214, r: 35, s: 1.1, v: 0 },
    { k: 12, x: 200, y: 128, r: 0, s: 1.1, v: 1 },
  ];
  // Cuántas flores se añaden con cada párrafo (0..6). El párrafo 6 añade además el lazo.
  const FLOWER_GROUPS = [2, 2, 2, 2, 2, 2, 1];

  const LEAVES = [
    { x: 100, y: 326, r: -80, s: 0.95 }, { x: 300, y: 326, r: 80, s: 0.95 },
    { x: 130, y: 340, r: -62, s: 1.15 }, { x: 270, y: 340, r: 62, s: 1.15 },
    { x: 165, y: 346, r: -30, s: 1.05 }, { x: 235, y: 346, r: 30, s: 1.05 },
    { x: 200, y: 350, r: 0, s: 0.9 },
  ];
  const SPARKS = [
    [64, 150, 1.1, 0], [338, 160, 0.9, 0.7], [108, 56, 0.8, 1.4], [296, 70, 1.2, 2.1],
    [200, 34, 0.9, 0.4], [40, 280, 0.8, 1.8], [362, 272, 1, 1.1], [150, 18, 0.6, 2.6], [252, 22, 0.7, 0.9],
  ];

  function buildBouquet() {
    const svg = $('#bouquet');
    const stroke = 'rgba(255,255,255,.14)';

    const flower = (f) => `
      <g transform="translate(${f.x} ${f.y}) rotate(${f.r}) scale(${f.s})"><g class="flower" data-k="${f.k}">
        <ellipse cx="-9" cy="-13" rx="10.5" ry="15" transform="rotate(-18 -9 -13)" fill="url(#v${f.v})" stroke="${stroke}" stroke-width=".8"/>
        <ellipse cx="9" cy="-13" rx="10.5" ry="15" transform="rotate(18 9 -13)" fill="url(#v${f.v})" stroke="${stroke}" stroke-width=".8"/>
        <ellipse cx="-16" cy="2" rx="10" ry="13.5" transform="rotate(-72 -16 2)" fill="url(#v${f.v})" stroke="${stroke}" stroke-width=".8"/>
        <ellipse cx="16" cy="2" rx="10" ry="13.5" transform="rotate(72 16 2)" fill="url(#v${f.v})" stroke="${stroke}" stroke-width=".8"/>
        <ellipse cx="0" cy="14" rx="13.5" ry="12.5" fill="url(#vl${f.v})" stroke="${stroke}" stroke-width=".8"/>
        <path d="M0 5L0 16M-4 6L-8 14M4 6L8 14" stroke="rgba(45,15,80,.45)" stroke-width="1" stroke-linecap="round" fill="none"/>
        <ellipse cx="0" cy="3" rx="4.5" ry="4" fill="#f2d98a"/><circle cx="-1" cy="2" r="1.3" fill="#fff6d6"/>
      </g></g>`;

    const stems = FLOWERS.map((f) => {
      const cx = 200 + (f.x - 200) * 0.35;
      const cy = (440 + f.y) / 2 + 10;
      return `<path class="stem" pathLength="1" d="M200 440Q${cx} ${cy} ${f.x} ${f.y + 22}" stroke="#6b8a5c" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    }).join('');

    const leaves = LEAVES.map((l) => `
      <g transform="translate(${l.x} ${l.y}) rotate(${l.r}) scale(${l.s})">
        <path class="leaf" d="M0 0C-24-8-30-42 0-58C30-42 24-8 0 0Z" fill="url(#lf)" stroke="rgba(255,255,255,.12)" stroke-width=".8"/>
      </g>`).join('');

    const sparks = SPARKS.map(([x, y, s, d]) => `
      <g transform="translate(${x} ${y}) scale(${s})">
        <path class="spark" style="--d:${d}s" d="M0-7L1.7-1.7L7 0L1.7 1.7L0 7L-1.7 1.7L-7 0L-1.7-1.7Z" fill="#ecd9a2"/>
      </g>`).join('');

    const flowersSorted = [...FLOWERS].sort((a, b) => a.y - b.y).map(flower).join('');

    svg.innerHTML = `
      <defs>
        <radialGradient id="v0" cx="50%" cy="60%" r="65%"><stop offset="0" stop-color="#8a5cc6"/><stop offset="1" stop-color="#4a2085"/></radialGradient>
        <radialGradient id="v1" cx="50%" cy="60%" r="65%"><stop offset="0" stop-color="#a07ad6"/><stop offset="1" stop-color="#6a3da8"/></radialGradient>
        <radialGradient id="v2" cx="50%" cy="60%" r="65%"><stop offset="0" stop-color="#c3aee6"/><stop offset="1" stop-color="#8f6dc4"/></radialGradient>
        <radialGradient id="vl0" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#b79be0"/><stop offset="1" stop-color="#7d58b8"/></radialGradient>
        <radialGradient id="vl1" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#cdb9ec"/><stop offset="1" stop-color="#9475c9"/></radialGradient>
        <radialGradient id="vl2" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#e6dcf7"/><stop offset="1" stop-color="#b49bda"/></radialGradient>
        <linearGradient id="lf" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#4f6b48"/><stop offset="1" stop-color="#86a374"/></linearGradient>
        <linearGradient id="pp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbf6ec"/><stop offset="1" stop-color="#e3d6ee"/></linearGradient>
        <linearGradient id="pb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bba0d8"/><stop offset="1" stop-color="#8e6fb8"/></linearGradient>
        <linearGradient id="rb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9a6ad0"/><stop offset="1" stop-color="#6d3aa6"/></linearGradient>
      </defs>

      <g class="paper"><path d="M86 300L200 536L314 300Q200 350 86 300Z" fill="url(#pb)" stroke="rgba(212,179,106,.55)" stroke-width="1"/></g>
      ${stems}
      ${leaves}
      ${flowersSorted}
      <g class="paper">
        <path d="M110 352Q200 380 290 352L200 536Z" fill="url(#pp)" stroke="rgba(212,179,106,.6)" stroke-width="1"/>
        <path d="M110 352L200 536L170 372Q140 368 110 352Z" fill="rgba(185,163,217,.35)"/>
        <path d="M200 536L172 372" stroke="rgba(109,58,166,.18)" stroke-width="1" fill="none"/>
      </g>
      <g class="ribbon">
        <path d="M138 396Q200 414 262 396L264 412Q200 430 136 412Z" fill="url(#rb)"/>
        <path d="M138 404Q200 422 262 404" stroke="#d4b36a" stroke-width="1" fill="none" opacity=".85"/>
        <path d="M198 414Q180 440 172 470L190 458L200 420Z" fill="url(#rb)"/>
        <path d="M202 414Q220 440 228 470L210 458L200 420Z" fill="url(#rb)"/>
        <path d="M200 410C170 380 140 392 160 416C172 428 192 418 200 410Z" fill="url(#rb)"/>
        <path d="M200 410C230 380 260 392 240 416C228 428 208 418 200 410Z" fill="url(#rb)"/>
        <circle cx="200" cy="412" r="7" fill="#5a2d90"/>
      </g>
      ${sparks}`;
  }

  const bouquet = {
    el: null, glow: null,
    base() {
      const svg = this.el;
      $$('.paper', svg).forEach(show);
      $$('.stem', svg).forEach((e, i) => later(() => show(e), 150 + i * 110));
      $$('.leaf', svg).forEach((e, i) => later(() => show(e), 600 + i * 140));
      this.glow.classList.add('on');
    },
    group(g, extra = 0) {
      const start = FLOWER_GROUPS.slice(0, g).reduce((a, b) => a + b, 0);
      const count = FLOWER_GROUPS[g] || 0;
      for (let k = start; k < start + count; k++) {
        const f = $(`.flower[data-k="${k}"]`, this.el);
        later(() => show(f), extra + (k - start) * 600);
      }
      if (g === 6) later(() => show($('.ribbon', this.el)), extra + 900);
    },
    all() {
      $$('.paper, .stem, .leaf, .flower, .ribbon', this.el).forEach(show);
      this.glow.classList.add('on');
      this.el.classList.add('is-final');
    },
    final() { this.el.classList.add('is-final'); },
  };

  /* ---------- 5. Navegación entre escenas ---------- */
  const LAST = scenes.length - 1;
  // La estética (CSS data-stage 0-6) avanza de forma progresiva aunque haya menos escenas.
  const STAGE = [0, 1, 3, 5, 6];
  const progress = $('#progress');
  const backBtn = $('#back');
  progress.innerHTML = '<i></i>'.repeat(3);
  const dots = $$('i', progress);

  function updateUI() {
    dots.forEach((d, i) => {
      d.classList.toggle('on', current > i + 1);
      d.classList.toggle('now', current === i + 1);
    });
    backBtn.classList.toggle('show', current >= 1 && current <= 3);
  }

  function goTo(n, { push = true, force = false } = {}) {
    if (n < 0 || n >= scenes.length || (!force && locked)) return;
    locked = true;
    setTimeout(() => { locked = false; }, T(900));
    clearTimers();

    scenes[current].classList.remove('is-active');
    scenes[current].classList.add('seen');
    if (current === LAST) fx.petals(false);

    current = n;
    const s = scenes[n];
    s.scrollTop = 0;
    s.classList.add('is-active');
    body.dataset.stage = STAGE[n];
    updateUI();
    loadImgs(s); preload(n + 1); preload(n + 2);
    if (push) history.pushState({ s: n }, '');
    ENTER[n](finished.has(n));
  }

  $('#app').addEventListener('click', (e) => {
    if (e.target.closest('[data-next]')) goTo(current + 1);
  });
  backBtn.addEventListener('click', () => history.back());

  // El botón "atrás" del móvil también vuelve a la escena anterior.
  window.addEventListener('popstate', (e) => {
    const target = e.state && typeof e.state.s === 'number' ? e.state.s : 0;
    if (target < current) goTo(target, { push: false, force: true });
    else if (target > current) history.replaceState({ s: current }, '');
  });

  /* ---------- 6. Lógica de cada escena ---------- */

  // Escena 0 · Intriga: el botón aparece tras la pregunta
  function enter0(fast) {
    const beacon = $('.beacon');
    at(() => { beacon.classList.add('ready'); finished.add(0); }, 5000, fast);
  }

  // Escena 1 · Primera pista: cuatro frases, una a una
  function enter1(fast) {
    const s = scenes[1];
    const lines = $$('.line', s);
    lines.forEach((l, i) => at(() => show(l), 700 + i * 1700, fast));
    at(() => { show($('.later', s)); finished.add(1); }, 700 + lines.length * 1700, fast);
  }

  // Escena 3 · Recuerdos: cada toque revela una foto nueva; al final, dos frases
  function enter2(fast) {
    const s = scenes[2];
    const photos = $$('#stack .polaroid');
    const shown = photos.filter((p) => p.classList.contains('is-in')).length;
    at(() => show($('.lead', s)), 500, fast);

    if (fast || shown >= photos.length) {
      photos.forEach((p) => p.classList.add('is-in'));
      $('#memBtn').hidden = true;
      show($('#memA')); show($('#memB')); show($('#next3'));
      finished.add(2);
      return;
    }
    if (shown === 0) later(() => photos[0].classList.add('is-in'), 1400);
    later(() => show($('#memBtn')), 2600);
  }
  function nextMemory() {
    if (current !== 2) return;
    const photos = $$('#stack .polaroid');
    const shown = photos.filter((p) => p.classList.contains('is-in')).length;
    if (shown === 0 || shown >= photos.length) return;
    photos[shown].classList.add('is-in');
    const n = shown + 1;
    $('#memCount').textContent = `${n} / ${photos.length}`;
    if (n >= photos.length) {
      $('#memBtn').disabled = true;
      later(() => { $('#memBtn').hidden = true; show($('#memA')); }, 1500);
      later(() => show($('#memB')), 3600);
      later(() => { show($('#next3')); finished.add(2); }, 5400);
    }
  }

  // Escena 4 · Anticipación: una última luz por tocar
  function enter3(fast) {
    const s = scenes[3];
    const orb = $('#orb');
    orb.classList.remove('is-hit');
    $('#flash').classList.remove('on');
    at(() => show($('.line--big', s)), 400, fast);
    at(() => show($('#line5b')), 2800, fast);
    at(() => { show(orb); show($('#orbHint')); finished.add(3); }, 4600, fast);
  }
  function touchOrb() {
    const orb = $('#orb');
    if (current !== 3 || orb.classList.contains('is-hit')) return;
    orb.classList.add('is-hit');
    const flash = $('#flash');
    // Estos timeouts son independientes de `timers`, que goTo() limpia.
    setTimeout(() => flash.classList.add('on'), T(350));
    setTimeout(() => goTo(LAST, { force: true }), T(1100));
    setTimeout(() => flash.classList.remove('on'), T(1800));
  }

  /* ---------- 7. Escena final ---------- */
  const STEP = 95; // ms entre palabras
  const paras = $$('.msg');
  const song = $('#song');
  const tapHint = $('#tapHint');
  const delivery = $('#delivery');
  // Párrafos en los que se habla de entregar el ramo en persona: se muestra la foto de la entrega.
  const DELIVERY_PARAS = [2, 3];
  const msg = { i: -1, phase: 'idle', doneTimer: 0, hintTimer: 0 };

  function splitWords() {
    $$('[data-split]').forEach((p) => {
      const words = p.textContent.trim().split(/\s+/);
      p.textContent = '';
      words.forEach((w, i) => {
        const span = document.createElement('span');
        span.className = 'w';
        span.style.setProperty('--i', i);
        span.textContent = w;
        p.append(span);
        if (i < words.length - 1) p.append(' ');
      });
      p.style.setProperty('--step', (words.length > 1 ? STEP : 0) + 'ms');
    });
  }

  function showPara(i) {
    msg.i = i; msg.phase = 'writing';
    const p = paras[i];
    p.classList.remove('is-off', 'is-done');
    p.classList.add('is-on');
    const inDelivery = DELIVERY_PARAS.includes(i);
    setDelivery(inDelivery);
    // Mientras se ve la foto, el ramo espera; al volver, las flores pendientes se añaden una tras otra.
    if (!inDelivery) {
      const lastDelivery = DELIVERY_PARAS[DELIVERY_PARAS.length - 1];
      const pending = i === lastDelivery + 1 ? DELIVERY_PARAS.concat(i) : [i];
      pending.filter((g) => g <= 6).forEach((g, k) => bouquet.group(g, k * 1300));
    }
    if (i === paras.length - 1) { bouquet.final(); fx.petals(true); }
    const words = $$('.w', p).length;
    msg.doneTimer = setTimeout(completePara, T((words - 1) * STEP + 1300));
  }

  function setDelivery(on) {
    delivery.classList.toggle('on', on);
    bouquet.el.classList.toggle('dim', on);
  }

  function completePara() {
    clearTimeout(msg.doneTimer);
    if (msg.phase !== 'writing') return;
    paras[msg.i].classList.add('is-done');
    msg.phase = 'ready';
    msg.hintTimer = setTimeout(() => {
      if (msg.phase === 'ready') tapHint.classList.add('on');
    }, T(1200));
  }

  function advance() {
    if (current !== LAST) return;
    if (msg.phase === 'writing') { completePara(); return; }
    if (msg.phase !== 'ready') return;
    clearTimeout(msg.hintTimer);
    tapHint.classList.remove('on');
    msg.phase = 'pausing';
    const p = paras[msg.i];
    p.classList.remove('is-on'); p.classList.add('is-off');
    setTimeout(() => {
      if (msg.i < paras.length - 1) showPara(msg.i + 1);
      else showSong();
    }, T(1000));
  }

  function showSong() {
    msg.phase = 'song';
    song.classList.add('is-on');
    finale.classList.add('is-open');
    finished.add(LAST);
  }

  function enter4(fast) {
    fx.petals(true);
    setDelivery(false);
    if (fast) {
      // Al volver a la escena final, se muestra el resultado completo.
      bouquet.all();
      paras.forEach((p) => p.classList.remove('is-on'));
      song.classList.add('is-on');
      finale.classList.add('is-open');
      msg.phase = 'song';
      return;
    }
    // Primera vez (o reintento si se interrumpió): se reinicia el mensaje.
    paras.forEach((p) => p.classList.remove('is-on', 'is-off', 'is-done'));
    tapHint.classList.remove('on');
    msg.i = -1; msg.phase = 'idle';
    fx.petals(false);
    later(() => bouquet.base(), 700);
    later(() => showPara(0), 3200);
  }

  const ENTER = [enter0, enter1, enter2, enter3, enter4];

  /* ---------- 8. Arranque ---------- */
  function init() {
    splitWords();
    buildBouquet();
    bouquet.el = $('#bouquet');
    bouquet.glow = $('.bouquet-glow');
    fx.start();

    // Interacciones
    $('#memBtn').addEventListener('click', nextMemory);
    $('#stack').addEventListener('click', nextMemory);
    $('#orb').addEventListener('click', touchOrb);

    // Mensaje final: tocar en cualquier punto avanza (los enlaces y botones no)
    $('.hero').addEventListener('click', (e) => {
      if (!e.target.closest('a, button')) advance();
    });
    document.addEventListener('keydown', (e) => {
      if (current !== LAST || e.target.closest('a, button')) return;
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); advance(); }
    });

    $('#scrollCue').addEventListener('click', () => {
      finale.scrollTo({ top: $('#after').offsetTop, behavior: RM ? 'auto' : 'smooth' });
    });
    $('#replay').addEventListener('click', () => window.location.reload());

    // Fotos y frase final: aparecen al hacer scroll
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } });
    }, { root: finale, threshold: 0.25 });
    $$('.io').forEach((el) => io.observe(el));

    // Estado inicial del historial: siempre se empieza por el principio
    history.replaceState({ s: 0 }, '');
    body.dataset.stage = 0;
    updateUI();
    ENTER[0](false);

    // Precarga progresiva del resto de fotos, sin bloquear la primera pantalla
    const warm = () => [2, 3, 4].forEach((n, i) => setTimeout(() => preload(n), 800 + i * 900));
    if (document.readyState === 'complete') warm(); else window.addEventListener('load', warm, { once: true });
  }

  init();
})();
