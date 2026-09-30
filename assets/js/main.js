/* =========================================================
   Raghav Singh — Portfolio
   ========================================================= */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');

  const intro = $('#intro');
  const stage = $('#stage');
  const site = $('#site');
  const menu = $('#menu');
  const menuBtn = $('#menuBtn');
  const lb = $('#lb');

  let entered = false;
  let menuOpen = false;

  /* ---------------------------------------------------------
     Smooth scroll (Lenis) + scroll locking
     --------------------------------------------------------- */
  let lenis = null;
  if (!reduce && typeof window.Lenis === 'function') {
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95 });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  function syncLock() {
    const on = !intro.hidden || menuOpen || !lb.hidden;
    root.classList.toggle('is-locked', on);
    if (lenis) on ? lenis.stop() : lenis.start();
  }

  function scrollToEl(el, immediate) {
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { duration: 1.6, immediate: !!immediate });
    else el.scrollIntoView({ behavior: reduce || immediate ? 'auto' : 'smooth', block: 'start' });
  }

  /* =========================================================
     INTRO — retro pixel desktop
     ========================================================= */
  const winPlayer = $('#winPlayer');
  const winComic = $('#winComic');
  const cable = $('#cable');
  const cablePaths = $$('path', cable);
  let S = 1, SW = 1200, SH = 750;

  function layoutStage() {
    const w = innerWidth, h = innerHeight;
    const port = w / h < 0.85;
    if (port !== stage.classList.contains('port')) {
      stage.classList.toggle('port', port);
      stage.classList.toggle('land', !port);
      $$('.win', stage).forEach((el) => { el.style.left = el.style.top = ''; });
    }
    SW = port ? 400 : 1200;
    SH = port ? 780 : 750;
    S = Math.min(w / SW, h / SH) * (port ? 0.98 : 0.95);
    stage.style.setProperty('--s', S.toFixed(4));
    drawCable();
  }

  function drawCable() {
    cable.classList.toggle('off', winPlayer.classList.contains('closed') || winComic.classList.contains('closed'));
    const port = stage.classList.contains('port');
    const x1 = winPlayer.offsetLeft + winPlayer.offsetWidth * (port ? 0.8 : 0.4);
    const y1 = winPlayer.offsetTop + winPlayer.offsetHeight - 2;
    const x2 = winComic.offsetLeft + winComic.offsetWidth * (port ? 0.6 : 0.2);
    const y2 = winComic.offsetTop + 2;
    const dy = Math.max(30, Math.abs(y2 - y1) * 0.5);
    const d = `M${x1} ${y1} C${x1} ${y1 + dy} ${x2} ${y2 - dy} ${x2} ${y2}`;
    cablePaths.forEach((p) => p.setAttribute('d', d));
  }

  /* draggable windows */
  let zTop = 10;
  $$('[data-drag]', stage).forEach((win) => {
    const handle = $('[data-handle]', win);
    win.addEventListener('pointerdown', () => { win.style.zIndex = ++zTop; });
    handle.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('button')) return;
      e.preventDefault();
      handle.setPointerCapture(e.pointerId);
      const sx = e.clientX, sy = e.clientY, ox = win.offsetLeft, oy = win.offsetTop;
      win.classList.add('dragging');
      const move = (ev) => {
        win.style.left = clamp(ox + (ev.clientX - sx) / S, 60 - win.offsetWidth, SW - 60) + 'px';
        win.style.top = clamp(oy + (ev.clientY - sy) / S, -10, SH - 44) + 'px';
        drawCable();
      };
      const up = () => {
        win.classList.remove('dragging');
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', up);
        handle.removeEventListener('pointercancel', up);
      };
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', up);
      handle.addEventListener('pointercancel', up);
    });
  });

  /* title-bar buttons */
  $$('.tb-btn', stage).forEach((btn) => btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const win = btn.closest('.win');
    const act = btn.dataset.act;
    if (act === 'min') {
      win.classList.toggle('min');
    } else if (act === 'max') {
      if (win === winPlayer) win.classList.toggle('viz');
      else openLb(cmImgs[ci].dataset.full, btn);
    } else if (act === 'close') {
      win.classList.add('closed');
      setTimeout(() => { win.classList.remove('closed'); drawCable(); }, 2200);
    }
    drawCable();
  }));

  /* sparkles: random twinkle phase + mouse parallax */
  const sparks = $$('.spk', intro);
  sparks.forEach((s) => s.style.setProperty('--tw', (-Math.random() * 2.6).toFixed(2) + 's'));
  intro.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || reduce) return;
    const mx = e.clientX / innerWidth - 0.5, my = e.clientY / innerHeight - 0.5;
    sparks.forEach((s) => {
      const z = +s.dataset.z || 1;
      s.style.translate = `${(mx * z * 28).toFixed(1)}px ${(my * z * 28).toFixed(1)}px`;
    });
  });

  /* music player (visual only) */
  const tracks = [
    { t: 'PRIDE. - KENDRICK LAMAR', d: 275 },
    { t: 'LOVE. - KENDRICK LAMAR', d: 213 },
    { t: 'DUCKWORTH. - KENDRICK LAMAR', d: 248 },
  ];
  let ti = 0, pos = 199, playing = true, repeat = false, shuffle = false, shownSec = -1;
  const plName = $('#plName'), plTime = $('#plTime'), plFill = $('#plFill');
  const plPlay = $('#plPlay'), plViz = $('#plViz'), plVol = $('#plVol');
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const bars = Array.from({ length: 18 }, () => plViz.appendChild(document.createElement('i')));

  function renderPlayer(force) {
    const tr = tracks[ti];
    plFill.style.width = (pos / tr.d * 100).toFixed(2) + '%';
    if (!force && Math.floor(pos) === shownSec) return;
    shownSec = Math.floor(pos);
    plTime.textContent = `${fmt(pos)} / ${fmt(tr.d)}`;
    if (plName.textContent !== tr.t) {
      plName.textContent = tr.t;
      const box = plName.parentElement;
      box.classList.remove('scroll');
      if (plName.scrollWidth > box.clientWidth + 2) box.classList.add('scroll');
    }
  }
  function setPlaying(on) {
    playing = on;
    plPlay.innerHTML = `<svg><use href="#i-${on ? 'pause' : 'play'}"/></svg>`;
    plPlay.setAttribute('aria-label', on ? 'Pause' : 'Play');
  }
  function skip(dir) {
    ti = shuffle
      ? (ti + 1 + Math.floor(Math.random() * (tracks.length - 1))) % tracks.length
      : (ti + dir + tracks.length) % tracks.length;
    pos = 0;
    renderPlayer(true);
  }
  plPlay.addEventListener('click', () => setPlaying(!playing));
  $('#plNext').addEventListener('click', () => skip(1));
  $('#plPrev').addEventListener('click', () => { if (pos > 3) { pos = 0; renderPlayer(true); } else skip(-1); });
  const toggler = (btn, set) => btn.addEventListener('click', () => {
    const on = btn.getAttribute('aria-pressed') !== 'true';
    btn.setAttribute('aria-pressed', String(on));
    set(on);
  });
  toggler($('#plRepeat'), (on) => { repeat = on; });
  toggler($('#plShuffle'), (on) => { shuffle = on; });
  $('#plBar').addEventListener('click', (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    pos = clamp((e.clientX - r.left) / r.width, 0, 0.999) * tracks[ti].d;
    renderPlayer(true);
  });
  const setVol = (k) => {
    k = clamp(k, 0, 1);
    plVol.style.setProperty('--v', (k * 100).toFixed(1) + '%');
    plVol.setAttribute('aria-valuenow', Math.round(k * 100));
  };
  plVol.addEventListener('pointerdown', (e) => {
    plVol.setPointerCapture(e.pointerId);
    const r = plVol.getBoundingClientRect();
    const mv = (ev) => setVol((ev.clientX - r.left) / r.width);
    mv(e);
    plVol.addEventListener('pointermove', mv);
    plVol.addEventListener('pointerup', () => plVol.removeEventListener('pointermove', mv), { once: true });
  });
  plVol.addEventListener('keydown', (e) => {
    const v = +plVol.getAttribute('aria-valuenow') / 100;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); setVol(v + 0.1); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); setVol(v - 0.1); }
  });

  /* comic viewer slideshow */
  const cmImgs = $$('#cmFrame img');
  const cmCount = $('#cmCount');
  let ci = 0, cmTimer = 0;
  function showComic(i) {
    cmImgs[ci].classList.remove('on');
    ci = (i + cmImgs.length) % cmImgs.length;
    cmImgs[ci].classList.add('on');
    cmCount.textContent = `0${ci + 1}/0${cmImgs.length}`;
  }
  function cmAuto() {
    clearInterval(cmTimer);
    if (!reduce) cmTimer = setInterval(() => showComic(ci + 1), 3600);
  }
  const cmFrame = $('#cmFrame');
  cmFrame.addEventListener('click', () => { showComic(ci + 1); cmAuto(); });
  cmFrame.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showComic(ci + 1); cmAuto(); }
  });

  /* intro frame loop (player clock + visualiser) */
  let introOn = false, lastT = 0, vizT = 0;
  function introLoop(t) {
    if (!introOn) return;
    const dt = lastT ? Math.min(0.1, (t - lastT) / 1000) : 0;
    lastT = t;
    if (playing) {
      pos += dt;
      if (pos >= tracks[ti].d) { if (repeat) pos = 0; else skip(1); }
      if (t - vizT > 110 && winPlayer.classList.contains('viz')) {
        vizT = t;
        bars.forEach((b) => b.style.setProperty('--h', (12 + Math.random() * 88).toFixed(0) + '%'));
      }
    }
    renderPlayer();
    requestAnimationFrame(introLoop);
  }

  /* typing title + loading bar */
  const pxType = $('#pxType'), pxFill = $('#pxFill'), pxPct = $('#pxPct');
  let bootId = 0;
  function bootIntro() {
    const id = ++bootId;
    intro.classList.remove('ready');
    pxType.textContent = '';
    const letters = Array.from('PORTFOLIO', (ch) => {
      const s = document.createElement('span');
      s.textContent = ch;
      s.style.visibility = 'hidden';
      return pxType.appendChild(s);
    });
    letters.forEach((s, i) => setTimeout(() => { if (id === bootId) s.style.visibility = ''; }, reduce ? 0 : 500 + i * 90));
    const t0 = performance.now(), dur = reduce ? 1 : 1900;
    const step = (now) => {
      if (id !== bootId) return;
      const k = clamp((now - t0) / dur, 0, 1);
      const e = 1 - Math.pow(1 - k, 3);
      pxFill.style.transform = `scaleX(${e.toFixed(4)})`;
      pxPct.textContent = `LOADING ${Math.round(e * 100)}%`;
      if (k < 1) requestAnimationFrame(step);
      else intro.classList.add('ready');
    };
    requestAnimationFrame(step);
  }

  function showIntro() {
    intro.hidden = false;
    root.classList.add('is-intro');
    site.inert = true;
    menuBtn.inert = true;
    entered = false;
    $$('.win', stage).forEach((w) => {
      w.classList.remove('min', 'closed', 'viz', 'dragging');
      w.style.left = w.style.top = w.style.zIndex = '';
      w.style.animation = 'none';
      void w.offsetWidth;
      w.style.animation = '';
    });
    layoutStage();
    bootIntro();
    cmAuto();
    introOn = true;
    lastT = 0;
    requestAnimationFrame(introLoop);
    syncLock();
  }

  function hideIntro() {
    intro.hidden = true;
    introOn = false;
    clearInterval(cmTimer);
    root.classList.remove('is-intro');
    site.inert = false;
    menuBtn.inert = false;
    syncLock();
  }

  /* pixel-grid wipe between intro and site */
  function wipe(x, y, mid) {
    const cv = $('#wipe');
    const ctx = cv.getContext('2d');
    const W = innerWidth, H = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.display = 'block';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const s = Math.max(44, Math.round(Math.min(W, H) / 9));
    const cols = Math.ceil(W / s), rows = Math.ceil(H / s);
    const cells = [];
    let maxD = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const d = Math.hypot(c * s + s / 2 - x, r * s + s / 2 - y);
        maxD = Math.max(maxD, d);
        cells.push({ c, r, d, j: Math.random() });
      }
    }
    const SPREAD = 480, JIT = 160, DUR = 240;
    const ease = (k) => 1 - Math.pow(1 - k, 3);
    let phase = 0, t0 = performance.now();
    const frame = (now) => {
      const t = now - t0;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#141414';
      let done = true;
      for (const k of cells) {
        const p = clamp((t - (k.d / maxD) * SPREAD - k.j * JIT) / DUR, 0, 1);
        if (p < 1) done = false;
        const sz = phase === 0 ? ease(p) : 1 - ease(p);
        if (sz <= 0) continue;
        const side = s * sz + 1;
        ctx.fillRect(k.c * s + (s - side) / 2, k.r * s + (s - side) / 2, side, side);
      }
      if (!done) { requestAnimationFrame(frame); return; }
      if (phase === 0) {
        phase = 1;
        mid();
        t0 = performance.now() + 60;
        requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, W, H);
        cv.style.display = 'none';
      }
    };
    requestAnimationFrame(frame);
  }

  function enterSite(x, y) {
    if (entered) return;
    entered = true;
    const go = () => {
      hideIntro();
      window.scrollTo(0, 0);
      if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
      relayout();
      startSite();
      onScroll();
    };
    if (reduce) go(); else wipe(x, y, go);
  }

  $('#enterBtn').addEventListener('click', (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    enterSite(e.clientX || r.left + r.width / 2, e.clientY || r.top + r.height / 2);
  });

  $('#replay').addEventListener('click', (e) => {
    const x = e.clientX || innerWidth / 2, y = e.clientY || innerHeight / 2;
    if (reduce) showIntro(); else wipe(x, y, showIntro);
  });

  /* =========================================================
     MAIN — De School-style cell grid
     ========================================================= */
  const mqMd = matchMedia('(max-width: 1099px)');
  const mqSm = matchMedia('(max-width: 699px)');
  const grids = $$('.g');
  let CELL = 80, COLS = 16, L = 2;

  function measureGrid() {
    const w = root.clientWidth;
    COLS = mqSm.matches ? 6 : mqMd.matches ? 10 : 16;
    L = parseFloat(getComputedStyle(root).getPropertyValue('--L')) || 2;
    const side = mqSm.matches ? 12 : mqMd.matches ? 24 : 40;
    CELL = Math.max(36, Math.floor((Math.min(w, 1600) - side * 2 - L) / COLS));
    const gx = Math.max(0, Math.floor((w - (COLS * CELL + L)) / 2));
    root.style.setProperty('--cell', CELL + 'px');
    root.style.setProperty('--cols', COLS);
    root.style.setProperty('--gx', gx + 'px');
  }

  /* each block grows (in whole cells) to fit its content */
  function fitBlocks() {
    root.classList.add('measuring');
    const jobs = [];
    for (const b of $$('.g > .b')) {
      const cs = getComputedStyle(b);
      if (cs.display === 'none') continue;
      const O = parseInt(cs.getPropertyValue('--O'), 10) || 0;
      const H = parseInt(cs.getPropertyValue('--H'), 10) || 1;
      let n = H;
      if (!b.hasAttribute('data-fixed')) {
        const pc = b.querySelector('.pc');
        if (pc && pc.offsetHeight) n = Math.max(H, Math.ceil(pc.offsetHeight / CELL - 0.04));
      }
      jobs.push([b, O + n]);
    }
    root.classList.remove('measuring');
    for (const [b, span] of jobs) {
      if (b._span !== span) { b._span = span; b.style.gridRowEnd = 'span ' + span; }
    }
  }

  const key = (r, c) => r * 64 + c;
  function placeCell(el, r, c) {
    el.style.left = c * CELL + L + 'px';
    el.style.top = r * CELL + L + 'px';
    el.style.width = el.style.height = CELL - L + 'px';
  }

  /* which cells are covered, plus a few twinkling sparkles in empty ones */
  function mapGrid() {
    for (const g of grids) {
      const occ = new Set();
      for (const b of g.children) {
        if (!b.classList.contains('b') || !b.offsetParent) continue;
        const p = b.querySelector(':scope > .p');
        if (!p) continue;
        const r0 = Math.round((b.offsetTop + p.offsetTop) / CELL);
        const c0 = Math.round(b.offsetLeft / CELL);
        const rs = Math.round(p.offsetHeight / CELL);
        const cs = Math.round(b.offsetWidth / CELL);
        for (let r = r0; r < r0 + rs; r++) for (let c = c0; c < c0 + cs; c++) occ.add(key(r, c));
      }
      g._occ = occ;
      g._rows = Math.round(g.clientHeight / CELL);

      for (const [k, cell] of g._paint) {
        if (occ.has(k) || cell.c >= COLS || cell.r >= g._rows) { cell.el.remove(); g._paint.delete(k); }
        else placeCell(cell.el, cell.r, cell.c);
      }

      (g._spk || []).forEach((el) => el.remove());
      g._spk = [];
      if (reduce || g.closest('.menu')) continue;
      const free = [];
      for (let r = 0; r < g._rows; r++) {
        for (let c = 0; c < COLS; c++) if (!occ.has(key(r, c)) && !g._paint.has(key(r, c))) free.push([r, c]);
      }
      const n = Math.min(free.length, COLS > 10 ? 3 : 2);
      const size = Math.round(CELL * 0.2);
      for (let i = 0; i < n; i++) {
        const [r, c] = free.splice(Math.floor(Math.random() * free.length), 1)[0];
        const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        s.setAttribute('class', 'cspk');
        s.setAttribute('aria-hidden', 'true');
        s.innerHTML = `<use href="#i-${Math.random() < 0.55 ? 'x' : 'spark'}"/>`;
        s.style.cssText = `left:${c * CELL + L + (CELL - L - size) / 2}px;top:${r * CELL + L + (CELL - L - size) / 2}px;width:${size}px;height:${size}px;--tw:${(-Math.random() * 3).toFixed(2)}s`;
        g.appendChild(s);
        g._spk.push(s);
      }
    }
  }

  /* hover trail + click-to-draw on empty cells */
  grids.forEach((g) => {
    g._paint = new Map();
    g._occ = new Set();
    g._last = -1;
    const cellAt = (e) => {
      const r = g.getBoundingClientRect();
      return [Math.floor((e.clientY - r.top) / CELL), Math.floor((e.clientX - r.left) / CELL)];
    };
    g.addEventListener('pointermove', (e) => {
      if (reduce || e.pointerType !== 'mouse' || e.target !== g) return;
      const [r, c] = cellAt(e);
      if (r < 0 || c < 0 || c >= COLS || r >= g._rows) return;
      const k = key(r, c);
      if (k === g._last) return;
      g._last = k;
      if (g._occ.has(k) || g._paint.has(k)) return;
      const f = document.createElement('i');
      f.className = 'flash';
      placeCell(f, r, c);
      g.appendChild(f);
      f.addEventListener('animationend', () => f.remove(), { once: true });
    });
    g.addEventListener('pointerleave', () => { g._last = -1; });
    g.addEventListener('click', (e) => {
      if (e.target !== g) return;
      const [r, c] = cellAt(e);
      if (r < 0 || c < 0 || c >= COLS || r >= g._rows) return;
      const k = key(r, c);
      if (g._occ.has(k)) return;
      if (g._paint.has(k)) {
        g._paint.get(k).el.remove();
        g._paint.delete(k);
        return;
      }
      const el = document.createElement('i');
      el.className = 'paint';
      placeCell(el, r, c);
      g.appendChild(el);
      g._paint.set(k, { r, c, el });
      g._spk.forEach((s) => {
        if (parseFloat(s.style.left) < (c + 1) * CELL && parseFloat(s.style.left) > c * CELL &&
            parseFloat(s.style.top) < (r + 1) * CELL && parseFloat(s.style.top) > r * CELL) s.remove();
      });
    });
  });

  /* live website previews (scaled iframes) */
  const pvs = $$('.pv');
  function scalePreviews() {
    pvs.forEach((pv) => {
      const f = pv.querySelector('iframe');
      const w = pv.clientWidth, h = pv.clientHeight;
      if (!w || !h) return;
      const vw = +pv.dataset.vw || (w < 520 ? 820 : 1280);
      const s = w / vw;
      f.style.width = vw + 'px';
      f.style.height = Math.ceil(h / s) + 'px';
      f.style.transform = `scale(${s})`;
    });
  }
  function loadPreview(pv) {
    const f = pv.querySelector('iframe');
    if (f.getAttribute('src')) return;
    f.addEventListener('load', () => pv.classList.add('loaded'), { once: true });
    f.src = pv.dataset.src;
  }
  function setLive(pv, on) {
    const go = pv.querySelector('.pv-go');
    if (!go) { window.open(pv.dataset.src, '_blank', 'noopener'); return; }
    loadPreview(pv);
    pv.classList.toggle('live', on);
    $('span', go).textContent = on ? 'Exit' : 'Interact';
    pv.querySelector('iframe').tabIndex = on ? 0 : -1;
  }
  pvs.forEach((pv) => {
    pv.addEventListener('click', (e) => {
      if (!pv.classList.contains('live') && !e.target.closest('.pv-go')) setLive(pv, true);
    });
    const go = pv.querySelector('.pv-go');
    if (go) go.addEventListener('click', (e) => { e.stopPropagation(); setLive(pv, !pv.classList.contains('live')); });
  });

  /* placeholder art shown while the live site loads */
  $$('.mock').forEach((m) => {
    if (m.dataset.mock === 'climate') {
      let cells = '';
      for (let i = 0; i < 48; i++) cells += `<i style="--a:${(0.1 + ((i * 37) % 11) / 13).toFixed(2)}"></i>`;
      m.innerHTML = `<div class="mk-h"><span>ClimateWatch India</span><span class="mk-load">Loading…</span></div><div class="mk-heat">${cells}</div><div class="mk-row"><i></i><i></i><i></i></div>`;
    } else {
      let cells = '';
      for (let i = 1; i <= 35; i++) cells += `<i${[6, 13, 17, 24].includes(i) ? ' class="on"' : ''}>${i <= 30 ? i : ''}</i>`;
      m.innerHTML = `<div class="mk-h"><span>Monthly planner</span><span class="mk-load">Loading…</span></div><div class="mk-cal">${cells}</div>`;
    }
  });

  /* rotating role in the hero title */
  const roleEl = $('.role');
  const glyphs = '#%&*+=/<>[]01';
  function scramble(el, to) {
    if (reduce) { el.textContent = to; return; }
    const from = el.textContent;
    const len = Math.max(from.length, to.length);
    let f = 0;
    const tick = () => {
      let out = '';
      for (let i = 0; i < len; i++) {
        const settle = 7 + i * 0.9;
        if (f >= settle) out += to[i] || '';
        else if (f >= settle - 7) out += to[i] === ' ' ? ' ' : glyphs[(Math.random() * glyphs.length) | 0];
        else out += from[i] || '';
      }
      el.textContent = out;
      if (f++ < 8 + len * 0.9) requestAnimationFrame(tick);
      else el.textContent = to;
    };
    tick();
  }
  if (roleEl) {
    const roles = roleEl.dataset.roles.split('|');
    let ri = 0;
    setInterval(() => {
      if (document.hidden || !entered || !intro.hidden) return;
      ri = (ri + 1) % roles.length;
      scramble(roleEl, roles[ri]);
    }, 2800);
  }

  /* slot-machine counters */
  function countUp(p) {
    $$('[data-count]', p).forEach((el) => {
      const to = String(el.dataset.count).padStart(2, '0');
      if (reduce) { el.textContent = to; return; }
      const t0 = performance.now(), dur = 900 + Math.random() * 500;
      let lastSwap = 0;
      const step = (t) => {
        if (t - t0 >= dur) { el.textContent = to; return; }
        if (t - lastSwap > 60) { lastSwap = t; el.textContent = String((Math.random() * 99) | 0).padStart(2, '0'); }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  /* reveal panels as they scroll in */
  let revealIO = null;
  function startSite() {
    if (revealIO) return;
    revealIO = new IntersectionObserver((entries) => {
      entries
        .filter((en) => en.isIntersecting)
        .sort((a, b) => (a.boundingClientRect.top - b.boundingClientRect.top) || (a.boundingClientRect.left - b.boundingClientRect.left))
        .forEach((en, i) => {
          const p = en.target;
          p.style.setProperty('--d', (Math.min(i, 10) * 0.07).toFixed(2) + 's');
          p.classList.add('in');
          revealIO.unobserve(p);
          countUp(p);
        });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });
    $$('.site .b:not(.void) > .p').forEach((p) => revealIO.observe(p));

    const pvIO = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      loadPreview(en.target);
      pvIO.unobserve(en.target);
    }), { rootMargin: '300px 0px' });
    pvs.forEach((pv) => pvIO.observe(pv));
  }

  /* hero image: peek around the page with the mouse */
  $$('.media.pan').forEach((m) => {
    const img = $('img', m);
    const base = img.style.getPropertyValue('--py') || '50%';
    m.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = m.getBoundingClientRect();
      img.style.setProperty('--px', (30 + clamp((e.clientX - r.left) / r.width, 0, 1) * 40).toFixed(1) + '%');
      img.style.setProperty('--py', (10 + clamp((e.clientY - r.top) / r.height, 0, 1) * 80).toFixed(1) + '%');
    });
    m.addEventListener('pointerleave', () => { img.style.setProperty('--px', '50%'); img.style.setProperty('--py', base); });
  });

  /* marquee: duplicate content for a seamless loop */
  $$('.mq-track').forEach((t) => { t.innerHTML += t.innerHTML; });

  /* live IST clock */
  const clocks = $$('[data-clock]');
  let fmtClock = null;
  try {
    fmtClock = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  } catch (_) { /* old browser: leave placeholder */ }
  const tickClock = () => { if (fmtClock) { const s = fmtClock.format(new Date()); clocks.forEach((c) => { c.textContent = s; }); } };
  tickClock();
  setInterval(tickClock, 1000);
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* toast + copy email */
  const toastEl = $('#toast');
  let toastT = 0;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    const v = b.dataset.copy;
    try {
      await navigator.clipboard.writeText(v);
      toast('EMAIL COPIED!');
    } catch (_) {
      location.href = 'mailto:' + v;
    }
  }));

  /* menu */
  $$('.menu .b:not(.void) > .p').forEach((p, i) => p.style.setProperty('--i', i));
  function setMenu(open) {
    menuOpen = open;
    menu.classList.toggle('open', open);
    menu.inert = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    $('span', menuBtn).textContent = open ? 'Close' : 'Menu';
    if (open) menu.scrollTop = 0;
    syncLock();
    onScroll();
  }
  menu.inert = true;
  menuBtn.addEventListener('click', () => setMenu(!menuOpen));

  /* in-page links glide instead of jump */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const el = document.getElementById(a.getAttribute('href').slice(1));
    if (!el) return;
    e.preventDefault();
    if (menuOpen) { setMenu(false); setTimeout(() => scrollToEl(el), 380); }
    else scrollToEl(el);
  });

  /* lightbox */
  const lbImg = $('#lbImg'), lbCap = $('#lbCap');
  const art = [];
  $$('[data-lb]').forEach((el) => {
    if (!art.some((a) => a.src === el.dataset.lb)) {
      art.push({ src: el.dataset.lb, cap: el.dataset.cap || '', alt: ($('img', el) || {}).alt || '' });
    }
    el.addEventListener('click', () => openLb(el.dataset.lb, el));
  });
  let li = 0, lbReturn = null;
  function showLb() {
    const a = art[li];
    lbImg.src = a.src;
    lbImg.alt = a.alt;
    lbCap.textContent = `${String(li + 1).padStart(2, '0')}/${String(art.length).padStart(2, '0')} — ${a.cap}`;
  }
  function openLb(src, from) {
    li = Math.max(0, art.findIndex((a) => a.src === src));
    lbReturn = from || document.activeElement;
    showLb();
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add('open'));
    syncLock();
    $('#lbX').focus({ preventScroll: true });
  }
  function closeLb() {
    lb.classList.remove('open');
    setTimeout(() => { lb.hidden = true; syncLock(); }, 320);
    if (lbReturn && lbReturn.focus) lbReturn.focus({ preventScroll: true });
  }
  const stepLb = (d) => { li = (li + d + art.length) % art.length; showLb(); };
  $('#lbX').addEventListener('click', closeLb);
  $('#lbPrev').addEventListener('click', () => stepLb(-1));
  $('#lbNext').addEventListener('click', () => stepLb(1));
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });

  /* keyboard */
  document.addEventListener('keydown', (e) => {
    if (!lb.hidden) {
      if (e.key === 'Escape') closeLb();
      else if (e.key === 'ArrowRight') stepLb(1);
      else if (e.key === 'ArrowLeft') stepLb(-1);
      return;
    }
    if (e.key === 'Escape' && menuOpen) { setMenu(false); menuBtn.focus(); return; }
    if (!intro.hidden && !entered && (e.key === 'Enter' || e.key === ' ') &&
        !e.target.closest('button, a, [role="button"], [role="slider"]')) {
      e.preventDefault();
      enterSite(innerWidth / 2, innerHeight / 2);
    }
  });

  /* section indicator + scroll progress */
  const nowEl = $('#now'), nowT = $('#nowT'), nowBar = $('#nowBar');
  const named = grids.filter((g) => site.contains(g) && g.dataset.name);
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = innerHeight * 0.45;
      let cur = named[0];
      for (const g of named) if (g.getBoundingClientRect().top <= y) cur = g;
      if (nowT.textContent !== cur.dataset.name) nowT.textContent = cur.dataset.name;
      const max = root.scrollHeight - innerHeight;
      nowBar.style.transform = `scaleX(${(max > 0 ? clamp(scrollY / max, 0, 1) : 0).toFixed(3)})`;
      nowEl.classList.toggle('show', intro.hidden && !menuOpen && scrollY > innerHeight * 0.4);
    });
  }
  addEventListener('scroll', onScroll, { passive: true });

  /* layout */
  function relayout() {
    measureGrid();
    fitBlocks();
    mapGrid();
    scalePreviews();
  }
  let rz = 0;
  addEventListener('resize', () => {
    cancelAnimationFrame(rz);
    rz = requestAnimationFrame(() => { layoutStage(); relayout(); onScroll(); });
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { relayout(); drawCable(); });
  addEventListener('load', () => { relayout(); drawCable(); });

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  relayout();
  const deep = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (deep && site.contains(deep)) {
    entered = true;
    hideIntro();
    startSite();
    requestAnimationFrame(() => { scrollToEl(deep, true); onScroll(); });
  } else {
    showIntro();
  }
})();
