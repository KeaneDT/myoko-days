/* Myoko Days — the map: the painted 3D Myoko diorama (assets/diorama), behind the same MD.map interface the site
   already uses (init, update, focus, showDay, overview, resize, setRoute, hover, setInsets, isReady, instance).
   - Each activity is its crafted model standing on a seal ring. The ring shows its state: gold = available,
     shu red with a day seal = in your trip, grey and faded = not this month or too much walking, faint = filtered out.
   - Hover shows the card (add or remove in one click); click opens the detail panel.
   - "More in the area" activities without a model are small paper pins.
   - Day routes are drawn as a red line from your hotel through the day's stops.
   - Drag moves the ground with the hand and glides on release; the wheel zooms toward the cursor.
   - The wheel always zooms the map (no click-to-engage); the page never scrolls on the build view.
   - Phones get the same 3D map (touch to drag and pinch), with the days below it.
   - Drawing pauses while the map is off-screen or the tab is hidden.
   - No WebGL: a short message points to the Places list (there is no 2D substitute map). */
window.MD = window.MD || {};

MD.icons = {
  water: '<path d="M3 14c2.5 0 2.5-2.5 5-2.5S10.5 14 13 14s2.5-2.5 5-2.5 2.5 2.5 3 2.5M3 19c2.5 0 2.5-2.5 5-2.5S10.5 19 13 19s2.5-2.5 5-2.5 2.5 2.5 3 2.5M12 3v6"/>',
  bike: '<circle cx="6" cy="16" r="3.6"/><circle cx="18" cy="16" r="3.6"/><path d="M6 16l4-8h5l3 8M10 8l3 8"/>',
  walk: '<path d="M3 20l6-10 4 6 3-4 5 8z"/>',
  leaf: '<path d="M5 19C5 10 11 5 20 4c0 9-5 15-14 15zM5 19l8-8"/>',
  food: '<path d="M3 12h18c0 4-4 7-9 7s-9-3-9-7zM8 9c0-2 2-2 2-4M13 9c0-2 2-2 2-4"/>',
  culture: '<path d="M3 6h18M5 9.5h14M7 6v14M17 6v14M4 3.6c5 1.2 11 1.2 16 0"/>',
  onsen: '<path d="M4 15c0 3 4 5 8 5s8-2 8-5H4zM8 12c-1-2 1-3 0-5M12 12c-1-2 1-3 0-5M16 12c-1-2 1-3 0-5"/>',
  sky: '<path d="M2 6l20 6M8 8v5M6.5 13h3l-1.5 5M16 10v4"/>',
  craft: '<circle cx="12" cy="13" r="7"/><path d="M9.2 12h.01M14.8 12h.01M9 15.8c2 1.4 4 1.4 6 0"/>',
  train: '<rect x="6" y="3" width="12" height="13" rx="2"/><path d="M6 10h12M9 19l-2 2M15 19l2 2M9 16v3M15 16v3"/>',
  home: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-5h4v5"/>',
  peak: '<path d="M2 20L9 7l4 6 2-3 7 10z"/>'
};

MD.svg = (name, size = 18) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${MD.icons[name] || MD.icons.leaf}</svg>`;

MD.map = (function () {
  "use strict";
  const D = MD.data;
  const BASE = "assets/diorama/";
  const THREE_URL = "js/vendor/three-r128.min.js";
  const COL = { kin: 0xC4A25E, shu: 0xB0452C, off: 0x8C8C84, base: 0x2E3B35 };
  const MAX_ZOOM = 4.6, MIN_ZOOM = 1.0, START_ZOOM = 1.0, FIT_PAD = 1.28, BADGE_ZOOM = 2.4, TOUR_STOP = { culture: 0, sekiyama: 1, kiminoi: 2, kanzuri: 3 };   // activity badges appear from this zoom up   // MIN_ZOOM is only the floor: the real limit is solved in the scene, where the board's bottom corners have just left the pane
  const minZ = () => (scene && scene.minZoom) || MIN_ZOOM;

  let rootEl = null, stageEl, sceneEl, svgEl, overlayEl, tipEl, hintEl, loadEl;
  let cb = {}, initialized = false, ready = false, swapped = false;
  let scene = null, T = null;
  let lastState = null, lastPlan = null;
  let filterSignature='';
  let tourWorld = [];   // the stops of a hovered or selected multi-stop activity, joined by a dotted line
  let hoverId = null, extHover = null, tipRec = null, tipTimer = 0;
  let routeWorld = [];
  const insets = { left: 0, right: 0, top: 0, bottom: 0 };
  const recs = [];          // one per activity on the map
  const byId = {};
  let pickList = [];        // tokens that can be clicked: { t, rec, stopName }
  let baseTok = null, baseTagEl = null, propTags = [], baseHot = false;
  const labels = [];        // peaks and the lake

  const loadScript = src => new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("Couldn't load " + src)); document.head.appendChild(s); });
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function priceShort(a) { return a.price ? "¥" + a.price.toLocaleString("en-US") : "Free"; }
  function duration(a) {
    if (a.u === 2) return "Full day";
    if (a.u === 1) return a.w === "am" ? "Half day · Morning" : a.w === "pm" ? "Half day · Afternoon" : "Half day";
    return a.slot === "eve" ? "Evening" : "Short stop";
  }

  /* ---------------------------------------------------------------- DOM */
  function buildDOM() {
    rootEl.innerHTML = "";
    rootEl.classList.add("imap-root", "dio");
    rootEl.tabIndex = 0;
    stageEl = document.createElement("div"); stageEl.className = "imap-stage dio__stage";
    sceneEl = document.createElement("div"); sceneEl.className = "dio__scene";
    svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svgEl.setAttribute("class", "imap-svg"); svgEl.setAttribute("aria-hidden", "true");
    overlayEl = document.createElement("div"); overlayEl.className = "imap-overlay";
    tipEl = document.createElement("div"); tipEl.className = "imap-tooltip"; tipEl.hidden = true;
    loadEl = document.createElement("div"); loadEl.className = "dio__load"; loadEl.setAttribute("role", "progressbar"); loadEl.setAttribute("aria-label", "Painting the map"); loadEl.setAttribute("aria-valuemin", "0"); loadEl.setAttribute("aria-valuemax", "100"); loadEl.setAttribute("aria-valuenow", "0");
    loadEl.innerHTML = `<svg class="dio__peaks" viewBox="0 0 48 32" width="96" height="64" aria-hidden="true"><defs><clipPath id="peakFill"><rect class="dio__fillrect" x="0" y="32" width="48" height="32"/></clipPath></defs><path class="dio__peaks-bg" d="M2 28 13 11l7 11L27 3l8 19 4-9 8 15H2Z"/><path class="dio__peaks-fill" clip-path="url(#peakFill)" d="M2 28 13 11l7 11L27 3l8 19 4-9 8 15H2Z"/><path class="dio__peaks-line" d="M2 28 13 11l7 11L27 3l8 19 4-9 8 15H2Z"/><path class="dio__peaks-snow" d="m9 18 4 3 3-4m7-5 4 4 4-4m6 6 2 3 2-3"/><path class="dio__peaks-base" d="M3 31h42"/></svg><span class="dio__loadtxt">Painting the map <b class="dio__pct">0%</b></span>`;
    const cart = document.createElement("div"); cart.className = "imap-cartouche"; cart.setAttribute("aria-hidden", "true");
    cart.innerHTML = `<span class="imap-cartouche__text">Myoko, illustrated · not to scale</span><span class="imap-cartouche__compass" title="North is to the right"><svg viewBox="0 0 30 14" width="28" height="13" fill="none" stroke="currentColor" stroke-width="1"><path d="M1 7h26"/><path d="M20 2l7 5-7 5z" fill="currentColor"/></svg>N</span>`;
    hintEl = document.createElement("div"); hintEl.className = "imap-hint is-gone"; hintEl.setAttribute("aria-hidden", "true");
    const ctl = document.createElement("div"); ctl.className = "dio__ctl";
    ctl.innerHTML = `<button type="button" data-z="in" aria-label="Zoom in">+</button><button type="button" data-z="out" aria-label="Zoom out">−</button><button type="button" data-z="all" aria-label="Show the whole map"><svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4"/></svg></button>`;
    ctl.addEventListener("click", e => {
      const b = e.target.closest("[data-z]"); if (!b || !scene) return;
      const v = scene.view;
      if (b.dataset.z === "all") overview();
      else scene.fly(v.x, v.z, Math.min(MAX_ZOOM, Math.max(minZ(), v.zoom * (b.dataset.z === "in" ? 1.6 : 1 / 1.6))), 420);
    });
    tipEl.addEventListener("click", e => {
      const b = e.target.closest("[data-tip-pin]"); if (!b) return;
      e.stopPropagation(); hideTip(true);
      if (cb.onToggle) cb.onToggle(b.dataset.tipPin); else if (cb.onPin) cb.onPin(b.dataset.tipPin);
    });
    tipEl.addEventListener("pointerenter", () => clearTimeout(tipTimer));
    tipEl.addEventListener("pointerleave", () => hideTip());
    const key = document.createElement("details"); key.className = "dio-key";
    key.innerHTML = `<summary class="dio-key__t" aria-label="Map key">?</summary>
      <p><i class="dio-key__disc"></i>White: open to add</p>
      <p><i class="dio-key__disc dio-key__disc--in">2</i>Red: in your trip, numbered by day</p>
      <p class="dio-key__over" hidden><i class="dio-key__disc dio-key__disc--in">!</i>In your trip but not in a day yet</p>
      <p class="dio-key__n">Click a place for details. Scroll to zoom, drag to move.</p>`;
    stageEl.append(sceneEl, svgEl, overlayEl, tipEl, cart, key, hintEl, ctl, loadEl);
    // the wheel always zooms toward the cursor, over the canvas, pins, labels and all
    stageEl.addEventListener("wheel", e => {
      if (!scene || e.target.closest(".imap-tooltip,.dio-key")) return;
      e.preventDefault();
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
      scene.zoomAt(e.clientX, e.clientY, Math.exp(-Math.max(-120, Math.min(120, dy)) * 0.0022));
    }, { passive: false });
    rootEl.appendChild(stageEl);
  }
  function flash(text, ms) {
    hintEl.textContent = text; hintEl.classList.remove("is-gone");
    clearTimeout(flash.t); flash.t = setTimeout(() => hintEl.classList.add("is-gone"), ms || 1800);
  }

  /* ---------------------------------------------------------------- start */
  /* the loader: the three-peak mark fills from the base up. The shown value eases toward the real one and
     creeps a little between steps, so it never freezes and never runs ahead of the work. */
  let prog = { real: 0, shown: 0, raf: 0, t: 0 };
  const reduceMotion = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function setProgress(p) { prog.real = Math.max(prog.real, Math.min(1, p)); if (!prog.raf) prog.raf = requestAnimationFrame(tickProgress); }
  function paintProgress(v) {
    if (!loadEl) return;
    const r = loadEl.querySelector(".dio__fillrect"), t = loadEl.querySelector(".dio__pct");
    if (r) r.setAttribute("y", (32 - 32 * v).toFixed(2));
    if (t) t.textContent = Math.round(v * 100) + "%";
    loadEl.setAttribute("aria-valuenow", String(Math.round(v * 100)));
  }
  function tickProgress(now) {
    prog.raf = 0;
    const dt = Math.min(250, prog.t ? now - prog.t : 16); prog.t = now;
    const creep = Math.min(prog.real + 0.05, 0.97);
    const goal = prog.real >= 1 ? 1 : Math.max(prog.real, Math.min(creep, prog.shown + dt * 0.00012));
    const k = reduceMotion() ? 1 : 1 - Math.exp(-dt / (prog.real >= 1 ? 260 : 420));      // time-based, so a slow machine fills at the same pace
    prog.shown += (goal - prog.shown) * k;
    if (goal - prog.shown < 0.002) prog.shown = goal;
    paintProgress(prog.shown);
    if (prog.shown < 1) prog.raf = requestAnimationFrame(tickProgress); else prog.t = 0;
  }
  const loadBase = async () => {
    if (!window.THREE) await loadScript(THREE_URL);
    if (!window.MyokoScene) await loadScript(BASE + "kit/scene.js?v=21.1");
    await Promise.all(MyokoScene.STYLE_ORDER.map(p => loadScript(BASE + "style/" + p + ".js?v=20.0").catch(() => null)));
    if (location.protocol === "file:") await loadScript(BASE + "data/bundle.js").catch(() => null);
  };
  let basePromise = null;
  // called when the app is idle: fetches the scripts (no drawing) so opening the map is quicker
  function prefetch() { if (basePromise || swapped) return; basePromise = loadBase().catch(() => null); }
  function pulse(id) {
    const r = byId[id]; if (!r || !ready) return;
    [r.tag, r.el].forEach(e => { e.classList.remove("is-pulse"); void e.offsetWidth; e.classList.add("is-pulse"); });
    setTimeout(() => { r.tag.classList.remove("is-pulse"); r.el.classList.remove("is-pulse"); }, 1200);
  }
  async function start() {
    setProgress(0.02);
    try {
      basePromise = basePromise || loadBase();
      await basePromise;
      if (!window.MyokoScene) throw new Error("scene kit missing");
      setProgress(0.14);
      window.FIT_PAD = FIT_PAD;                       // room round the board for its base
      window.SHIFT_X = 0; window.ATTR_SAT = 0.34;   // framing a little left of centre; attraction models more saturated
      scene = await MyokoScene.create(sceneEl, { dataPath: BASE + "data/", kitPath: BASE + "kit/", minZoom: MIN_ZOOM, maxZoom: MAX_ZOOM, onProgress: p => setProgress(0.14 + 0.8 * p) });
      setProgress(0.95);
      // the flat base: the land block on its plate (optional: the map still works without it)
      await loadScript(BASE + "kit/plinth.js?v=12.3").catch(() => null);
      scene.scene.background = null; scene.renderer.setClearColor(0x000000, 0);
      if (window.MyokoPlinth) MyokoPlinth.add(scene);
    } catch (e) {
      console.warn("Myoko 3D map unavailable:", e && e.message);
      return fallBack();
    }
    T = scene.THREE;
    scene.renderer.domElement.setAttribute("aria-hidden", "true");
    buildRecords();
    bindPointer();
    scene.on("move", positionOverlay);
    // pause while off-screen (list view, another page) or hidden
    if ("IntersectionObserver" in window) new IntersectionObserver(es => es.forEach(en => scene.setActive(en.isIntersecting))).observe(rootEl);
    ready = true;
    resize(); if (!phoneHome(true)) scene.go(0, 0, START_ZOOM);
    if (lastState) update(lastState, lastPlan);
    setProgress(1);
    // let the mark finish filling, then lift the loader
    const done = () => { loadEl.classList.add("is-gone"); setTimeout(() => loadEl.remove(), 900); };
    const wait = () => (prog.shown >= 0.999 ? setTimeout(done, 220) : setTimeout(wait, 40));
    wait();
    if (cb.onReady) cb.onReady();
  }
  // there is only one map: the 3D diorama. If it can't start (no WebGL), say so; every place is still in the Places list.
  function fallBack() {
    if (swapped) return; swapped = true;
    if (loadEl) { loadEl.removeAttribute("role"); loadEl.innerHTML = '<span class="dio__loadtxt">The 3D map needs WebGL, which this browser has turned off. Every place is still in the Places list.</span>'; }
  }

  /* ---------------------------------------------------------------- records */
  const coarseD = matchMedia("(pointer: coarse)").matches;
  function buildRecords() {
    const L = scene.layout, E = scene.exaggeration;
    const place = id => (L.places || []).find(p => p.id === id);
    D.activities.forEach(a => {
      const toks = scene.tokens.filter(t => t.a.act === a.id);
      const main = toks.find(t => t.a.id === a.id) || toks[0];
      let pos = null, el = null, seal = null, label = null;
      if (main) pos = main.g.position.clone();
      else {
        const p = place(a.id);
        if (p && a.art) pos = new T.Vector3(p.x, scene.heightAt(p.x, p.z) * E, p.z);
      }
      if (!pos) return;
      // a focusable button per activity (keyboard and screen readers); pointer clicks go through the canvas
      el = document.createElement("button"); el.type = "button"; el.className = "dio-pin" + (main ? "" : " dio-pin--dot");
      el.setAttribute("aria-label", a.name);
      el.innerHTML = `<span class="dio-pin__tag">${MD.svg(a.cat, main ? 15 : 13)}</span>`;
      el.addEventListener("click", () => cb.onPin && cb.onPin(a.id, a.stops ? { stop: 0 } : undefined));
      el.addEventListener("focus", () => { setHover(a.id); showTip(byId[a.id]); });
      el.addEventListener("blur", () => { setHover(null); hideTip(); });
      {
        el.addEventListener("pointerenter", () => { setHover(a.id); showTip(byId[a.id]); });
        el.addEventListener("pointerleave", () => { setHover(null); hideTip(); });
      }
      seal = document.createElement("span"); seal.className = "dio-seal"; seal.hidden = true; seal.setAttribute("aria-hidden", "true");
      label = document.createElement("span"); label.className = "dio-label"; label.textContent = a.name; label.setAttribute("aria-hidden", "true");
      overlayEl.append(el, seal, label);
      const rec = { a, toks, main, pos, el, tag: el.firstChild, icon: el.firstChild.innerHTML, seal, label, state: "av", dimmed: false, hide: false, day: 0, offReason: "" };
      recs.push(rec); byId[a.id] = rec;
      // a multi-stop activity (the Local Culture Tour): every stop is numbered, in tour order, and the gate is stop 1 like the others
      rec.stopToks = [];
      if (a.stops && a.stops.length > 1) {
        toks.forEach(t => {
          const i = TOUR_STOP[t.a.id]; if (i == null || !a.stops[i]) return;
          const stop = { i, n: a.stops.length, name: a.stops[i].name };
          if (i === 0) { rec.stopToks.push({ t, i, el: null, stop }); return; }   // the gate already has the tour's own badge; it just carries the number 1
          const b = document.createElement("button"); b.type = "button"; b.className = "dio-stop"; b.style.visibility = "hidden";
          b.setAttribute("aria-label", `${a.name}, stop ${i + 1} of ${stop.n}: ${stop.name}`);
          b.innerHTML = `<span class="dio-stop__d">${MD.svg(a.cat, 15)}<i class="dio-num">${i + 1}</i></span>`;
          b.addEventListener("click", () => cb.onPin && cb.onPin(a.id, { stop: i }));
          b.addEventListener("pointerenter", () => { setHover(a.id); showTip(rec, stop); });
          b.addEventListener("pointerleave", () => { setHover(null); hideTip(); });
          b.addEventListener("focus", () => { setHover(a.id); showTip(rec, stop); });
          b.addEventListener("blur", () => { setHover(null); hideTip(); });
          overlayEl.appendChild(b); rec.stopToks.push({ t, i, el: b, stop });
        });
        rec.stopToks.sort((x, y) => x.i - y.i);
      }
      toks.forEach(t => pickList.push({ t, rec, stop: a.stops && TOUR_STOP[t.a.id] != null && a.stops[TOUR_STOP[t.a.id]] ? { i: TOUR_STOP[t.a.id], n: a.stops.length, name: a.stops[TOUR_STOP[t.a.id]].name } : null }));
    });
    // the hotel tokens are bases, not activities
    // each PCG property has a name tag, shown only for the one you are staying at, where it reads "Base · name"
    propTags = ["madarao", "lime", "sixsenses"].map(k => {
      const el = document.createElement("span"); el.className = "dio-prop"; el.setAttribute("aria-hidden", "true"); el.textContent = D.bases[k].name;
      overlayEl.appendChild(el); return { k, el, tok: null };
    });
    // labels: the four peaks and the lake
    (L.peaks || []).forEach(p => {
      const d = D.peaks.find(q => p.name.startsWith(q.name)); if (!d) return;
      const el = document.createElement("span"); el.className = "dio-peak"; el.setAttribute("aria-hidden", "true");
      el.innerHTML = `<b>${esc(d.name)}</b><i lang="ja">${esc(d.ja)}</i><small>${esc(d.el)}</small>`;
      overlayEl.appendChild(el); labels.push({ el, pos: new T.Vector3(p.x, p.y * E + 250, p.z), minZoom: 0, off: null });   // v17.2: every peak name sits on its summit (Madarao no longer needs to dodge the lake rings)
    });
    const noj = (L.lakes || []).find(l => l.id === "nojiri");
    if (noj) {
      const n = noj.outline.length, cx = noj.outline.reduce((s, q) => s + q[0], 0) / n, cz = noj.outline.reduce((s, q) => s + q[1], 0) / n;
      const el = document.createElement("span"); el.className = "imap-landmark imap-landmark--water dio-lake"; el.setAttribute("aria-hidden", "true");
      el.innerHTML = `Lake Nojiri <span lang="ja">野尻湖</span>`;
      overlayEl.appendChild(el); labels.push({ el, pos: new T.Vector3(cx, noj.level * E, cz), minZoom: 1.6, isLake: true });
    }
    // nothing shows until the first positioning pass has run (no stray labels in the corner)
    overlayEl.querySelectorAll(":scope > span").forEach(e => { e.style.visibility = "hidden"; });
  }

  /* ---------------------------------------------------------------- picking and pointer */
  function screenOf(v) { return scene.project(v.x, v.y, v.z); }
  function pick(sx, sy) {
    let best = null, bestD = 1;
    pickList.forEach(p => {
      if (p.rec.hide || p.rec.dimmed) return;
      const g = p.t.g.position, R = 0.49 * p.t.a.size * p.t.g.scale.x;
      const c = scene.project(g.x, g.y, g.z), e = scene.project(g.x + R, g.y, g.z);
      if (!c.visible) return;
      const rx = Math.max(14, Math.hypot(e.x - c.x, e.y - c.y)), dx = (sx - c.x) / rx, dy = sy - c.y;
      const d = Math.hypot(dx, dy / (dy > 0 ? rx * 0.72 : rx * 1.05));
      if (d < bestD) { bestD = d; best = p; }
    });
    return best;
  }
    function bindPointer() {
    const cv = scene.renderer.domElement;
    let down = null;
    cv.addEventListener("pointerdown", e => { down = [e.clientX, e.clientY]; hideTip(true); stageEl.classList.add("is-dragging"); });
    window.addEventListener("pointerup", e => {
      stageEl.classList.remove("is-dragging");
      if (!down) return;
      const moved = Math.hypot(e.clientX - down[0], e.clientY - down[1]); down = null;
      if (moved > 6) return;
      const r = cv.getBoundingClientRect(), p = pick(e.clientX - r.left, e.clientY - r.top);
      if (p && cb.onPin) cb.onPin(p.rec.a.id, p.stop ? { stop: p.stop.i } : undefined);
    });
    cv.addEventListener("pointermove", e => {
      if (down || e.pointerType === "touch") return;
      const r = cv.getBoundingClientRect(), p = pick(e.clientX - r.left, e.clientY - r.top);
      cv.style.cursor = p ? "pointer" : "";
      const id = p ? p.rec.a.id : null;
      if (id !== hoverId || (p && p.stop && tipStop !== p.stop.i)) { setHover(id); if (p) showTip(p.rec, p.stop); else hideTip(); }
      setBaseHot(!p && overBase(e.clientX - r.left, e.clientY - r.top));
    });
    cv.addEventListener("pointerleave", () => { setBaseHot(false); if (hoverId) { setHover(null); hideTip(); } });
    rootEl.addEventListener("keydown", e => {
      if (!scene || e.target !== rootEl) return;
      const v = scene.view, m = scene.metresPerPx() * 120, k = e.key;
      if (k === "+" || k === "=") scene.fly(v.x, v.z, Math.min(MAX_ZOOM, v.zoom * 1.5), 300);
      else if (k === "-") scene.fly(v.x, v.z, Math.max(minZ(), v.zoom / 1.5), 300);
      else if (k === "ArrowRight") scene.fly(v.x + m, v.z, v.zoom, 200);
      else if (k === "ArrowLeft") scene.fly(v.x - m, v.z, v.zoom, 200);
      else if (k === "ArrowUp") scene.fly(v.x, v.z - m * 1.5, v.zoom, 200);
      else if (k === "ArrowDown") scene.fly(v.x, v.z + m * 1.5, v.zoom, 200);
      else return;
      e.preventDefault();
    });
  }

  /* ---------------------------------------------------------------- tooltip */
  let tipStop = -1;
  function showTip(rec, stop) {
    if (!rec) return;
    clearTimeout(tipTimer);
    const a = rec.a;
    let act = "";
    if (rec.state === "in") act = `<button type="button" class="imap-tooltip__act" data-tip-pin="${a.id}">${rec.day ? "In Day " + rec.day : "Not scheduled"} · Remove</button>`;
    else if (rec.state === "off") act = `<span class="imap-tooltip__reason">${esc(rec.offReason)}</span>`;
    else if (a.closed) act = `<span class="imap-tooltip__reason">${esc(a.closed)}</span>`;
    else act = `<button type="button" class="imap-tooltip__act imap-tooltip__act--add" data-tip-pin="${a.id}">Add to my days</button>`;
    tipStop = stop ? stop.i : -1;
    tipEl.innerHTML = `<div class="imap-tooltip__title">${esc(stop ? stop.name : a.name)}</div>
      ${stop ? `<div class="imap-tooltip__meta">Stop ${stop.i + 1} of ${stop.n} · ${esc(a.name)}</div>` : ""}
      <div class="imap-tooltip__meta">${duration(a)} · ${priceShort(a)}</div>
      <div class="imap-tooltip__foot">${act}</div>`;
    tipEl.hidden = false; tipRec = rec; positionTip();
  }
  function hideTip(now) {
    clearTimeout(tipTimer);
    const go = () => { tipEl.hidden = true; tipRec = null; };
    if (now) go(); else tipTimer = setTimeout(go, 260);
  }
  function positionTip() {
    if (!tipRec || tipEl.hidden) return;
    const r = tipRec, top = r.main ? r.main.g.position.y + 0.42 * r.main.a.size * r.main.g.scale.x : r.pos.y + 40;
    const p = scene.project(r.pos.x, top, r.pos.z);
    const w = sceneEl.clientWidth, h = sceneEl.clientHeight;
    const half=tipEl.offsetWidth/2+10,height=tipEl.offsetHeight;
    const side=p.x+2*half+24<w?p.x+half+24:p.x-half-24;
    const x = Math.max(half, Math.min(w-half,side)), y = Math.max(height+10,Math.min(h-12,p.y+height/2));
    tipEl.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0) translate(-50%, -100%)`;
  }

  /* ---------------------------------------------------------------- state */
  function setHover(id) { hoverId = id; paintRings(); }
  // the chosen stay keeps its glow all the time; its "Base · name" tag appears only while the pointer is over it
  function overBase(sx, sy) {
    if (!baseTok) return false;
    const g = baseTok.g.position, R = 0.49 * baseTok.a.size * baseTok.g.scale.x;
    const c = scene.project(g.x, g.y, g.z), e = scene.project(g.x + R, g.y, g.z);
    if (!c.visible) return false;
    const rx = Math.max(14, Math.hypot(e.x - c.x, e.y - c.y)), dx = (sx - c.x) / rx, dy = sy - c.y;
    return Math.hypot(dx, dy / (dy > 0 ? rx * 0.72 : rx * 1.05)) < 1;
  }
  function setBaseHot(on) {
    if (on === baseHot) return; baseHot = on;
    propTags.forEach(pt => pt.el.classList.toggle("is-hot", on && !!pt.on));
    if (scene && scene.requestRender) scene.requestRender();
  }
  function paintRings() {
    if (!scene) return;
    tourWorld = [];
    const focusId = lastState && lastState.focus;
    recs.forEach(r => {
      const hot = r.a.id === hoverId || r.a.id === extHover || r.a.id === focusId;
      const color = r.state === "in" ? COL.shu : r.state === "off" ? COL.off : r.match ? 0xF0CB79 : COL.kin;
      const fade = r.hide ? 0 : r.dimmed ? 0.09 : r.state === "off" ? 0.32 : 1;
      r.toks.forEach(t => scene.setRing(t, { color, fade, strong: hot||r.match ? 1 : r.state === "in" ? 0.7 : 0.25, glow: (hot||r.match) && !r.dimmed ? 1 : 0 }));
      r.el.classList.toggle("is-hot", hot);
      r.stopToks.forEach(st => st.el && st.el.classList.toggle("is-hot", hot));
      if (hot && r.stopToks.length > 1 && !r.hide && !r.dimmed) tourWorld = r.stopToks.map(st => st.t.g.position);
    });
    drawRoute();
    // the three PCG properties stand quietly on the map: only the one you are staying at is ringed (and, below, named)
    scene.tokens.forEach(t => { if (!t.a.act) scene.setRing(t, t === baseTok ? { color: COL.base, fade: 1, strong: 0.7, glow: 0.6 } : { color: COL.kin, fade: 0, strong: 0, glow: 0 }); });
  }
  function update(state, plan) {
    lastState = state; lastPlan = plan;
    if (!ready) return;
    const days = plan ? MD.planner.dayIndex(plan) : {};
    const sel = state && state.sel ? state.sel : new Set();
    let anyOver = false;
    recs.forEach(r => {
      const a = r.a, inTrip = sel.has(a.id);
      r.offReason = state ? MD.planner.availability(a, state) : "";
      if (a.closed && !inTrip) r.offReason = a.closed;
      r.day = inTrip ? (days[a.id] || 0) : 0;
      r.state = inTrip ? "in" : r.offReason ? "off" : a.src === "desk" ? "ex" : "av";
      const outCat = state && state.catFilter && state.catFilter.length && !state.catFilter.includes(a.cat);
      const outZone = state && state.zoneFilter && a.zone !== state.zoneFilter;
      r.caution = state ? MD.planner.caution(a, state) : "";
      const outAvail = state && state.fitsOnly && !!r.caution;
      const q = state && state.query ? state.query.trim().toLowerCase() : "";
      const outQ = !!q && !(a.name + " " + a.desc + " " + D.zones[a.zone].name + " " + a.host).toLowerCase().includes(q);
      const outExtra = !(state && state.showExtras) && a.src === "desk";
      r.dimmed = !!(outCat || outZone || outAvail || outExtra || outQ);
      r.hide = !inTrip && outExtra;
      const filtering=!!((state.catFilter&&state.catFilter.length)||state.zoneFilter||state.fitsOnly||(state.query&&state.query.trim()));
      r.match=filtering&&!r.dimmed&&!r.hide&&!r.offReason&&!r.caution;
      r.el.hidden = r.hide;
      r.el.className = "dio-pin" + (r.main ? "" : " dio-pin--dot") + ` dio-pin--${r.state}` + (r.dimmed ? " is-dimmed" : "")+(r.match?' is-match':'');
      r.label.classList.toggle('is-match-label',r.match);
      r.el.setAttribute("aria-label", `${a.name}${inTrip ? `${r.day ? ", assigned to day " + r.day : ", not scheduled"}` : r.offReason ? `, ${r.offReason}` : ""}`);
      const over = inTrip && !r.day;   // in the trip but it does not fit the days: show "!" instead of a day number
      r.seal.hidden = true;   // v12: the number lives in the disc itself
      r.tag.innerHTML = (inTrip ? `<b>${over ? "!" : r.day}</b>` : r.icon) + (r.stopToks.length ? '<i class="dio-num">1</i>' : ""); r.tag.classList.toggle("is-over", over); if (over) anyOver = true;
      r.seal.style.opacity=r.dimmed?'0.12':'1';
      r.label.hidden = r.hide;
      r.stopToks.forEach(st => { if (!st.el) return; st.el.hidden = r.hide; st.el.classList.toggle("is-dimmed", r.dimmed); st.el.classList.toggle("is-in", inTrip); });
    });
    { const ko = rootEl.querySelector(".dio-key__over"); if (ko) ko.hidden = !anyOver; }
    const stayKey = (state && state.stay && D.bases[state.stay]) ? state.stay : "madarao";
    propTags.forEach(pt => { pt.tok = scene.tokens.find(t => t.a.id === D.bases[pt.k].token) || null; const on = pt.k === stayKey; pt.on = on; pt.el.classList.toggle("is-base", on); pt.el.classList.remove("is-hot"); pt.el.textContent = "Base · " + D.bases[pt.k].name; });
    baseTok = (propTags.find(pt => pt.k === stayKey) || {}).tok || null;
    paintRings(); positionOverlay();
    const signature=[state.catFilter,state.zoneFilter,state.fitsOnly,state.showExtras,(state.query||'').trim()].join('|');
    if(signature!==filterSignature){filterSignature=signature;const matches=recs.filter(r=>r.match).map(r=>r.pos);if(matches.length)fit(matches,1.4);}
    if (tipRec) showTip(tipRec);
  }

  /* ---------------------------------------------------------------- overlay (labels, seals, base tag, route) */
  function positionOverlay() {
    if (!ready) return;
    rootEl.dataset.zoom = scene.view.zoom.toFixed(2);
    { const z = scene.view.zoom; rootEl.classList.toggle("lod-far", z < 1.7); rootEl.classList.toggle("lod-near", z >= 2.2); rootEl.classList.toggle("badges-off", z < BADGE_ZOOM); }
    const zoom = scene.view.zoom, w = sceneEl.clientWidth, h = sceneEl.clientHeight;
    const put = (el, p, show) => { const on = show && p.visible && p.x > -40 && p.x < w + 40 && p.y > -40 && p.y < h + 40; el.style.visibility = on ? "" : "hidden"; if (p.visible) el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`; };
    recs.forEach(r => {
      const g = r.main ? r.main.g.position : r.pos, s = r.main ? r.main.a.size * r.main.g.scale.x : 0;
      const c = scene.project(g.x, g.y, g.z);
      put(r.el, c, !r.hide);
      let rad = 0;
      if (r.main) { const e = scene.project(g.x + 0.49 * s, g.y, g.z); rad = Math.max(16, Math.hypot(e.x - c.x, e.y - c.y)); r.el.style.setProperty("--r", rad.toFixed(1) + "px"); }
      // v12.2: the disc sits ON the ring, at its bottom centre (the ring's front rim), no floating pin and no leader line.
      // It scales with the ring so zoomed-out rings are not crowded by oversized discs.
      if (r.main) {
        const rim = scene.project(g.x, g.y, g.z + 0.49 * s);
        r.el.style.setProperty("--by", (rim.y - c.y).toFixed(1) + "px");
        r.el.style.setProperty("--d", Math.round(Math.min(32, Math.max(coarseD ? 28 : 21, rad * 0.78))) + "px");
      } else r.el.style.setProperty("--d", Math.round(Math.min(26, Math.max(coarseD ? 24 : 18, 14 + zoom * 4))) + "px");
      const lb = scene.project(g.x, g.y, g.z + (r.main ? 0.5 * s : 90));
      r._lb = lb; r._c = c;
    });
    recs.forEach(r => r.stopToks.forEach(st => { const g = st.t.g.position, s = 0.49 * st.t.a.size * st.t.g.scale.x; if (!st.el) return; put(st.el, scene.project(g.x, g.y, g.z + s), !r.hide); st.el.style.setProperty("--d", r.el.style.getPropertyValue("--d") || "24px"); }));   // stops 2-4 carry the ordinary badge on the front rim of their ring, numbered
    placeLabels(put);
    propTags.forEach(pt => { if (!pt.tok) return; const g = pt.tok.g.position; put(pt.el, scene.project(g.x, g.y, g.z + 0.52 * pt.tok.a.size * pt.tok.g.scale.x), !!pt.on); });   // the chosen stay's tag hangs just below its ring and shows on hover only (CSS .is-hot); the others stay unlabelled
    const bt = baseTok ? scene.project(baseTok.g.position.x, baseTok.g.position.y, baseTok.g.position.z) : null;
    const lps = labels.map(l => scene.project(l.pos.x, l.pos.y, l.pos.z));
    labels.forEach((l, i) => {
      let lp = lps[i];
      if (l.off) lp = { x: lp.x + l.off[0] * Math.sqrt(Math.max(1, zoom)), y: lp.y + l.off[1], visible: lp.visible };
      let clash = bt && Math.abs(lp.x - bt.x) < 130 && lp.y > bt.y + 10 && lp.y < bt.y + 110;   // keep names clear of the hotel tag (it hangs below the ring)
      if (clash && !l.isLake) { lp = { x: lp.x, y: Math.min(lp.y, bt.y - 100), visible: lp.visible }; clash = false; }   // a peak name rides above the tag instead of hiding
      if (l.isLake) labels.forEach((o, j) => { if (!o.isLake && Math.abs(lps[j].x - lp.x) < 150 && Math.abs(lps[j].y - 22 - lp.y) < 52) clash = true; });   // and the lake name clear of a peak name
      put(l.el, lp, zoom >= l.minZoom && !clash);
    });
    positionTip();
    drawRoute();
  }
  /* labels: always for what's in the trip, the hovered or matched place, and the target day; the rest only once
     zoomed in, and only where there is room (greedy by importance, so nothing overlaps) */
  function placeLabels(put) {
    // v11: no name boxes on the map. The hover tooltip names a place, and the pin numbers show what is in the plan.
    recs.forEach(r => { r.label.style.visibility = "hidden"; });
    return;
    const zoom = scene.view.zoom, st = lastState || {};
    const tgtDay = st.target ? st.target.day + 1 : 0;
    const cands = [];
    recs.forEach(r => {
      if (r.hide) { r.label.style.visibility = "hidden"; return; }
      let pr = 0;
      if (r.a.id === hoverId || r.a.id === extHover || r.a.id === st.focus) pr = 100;
      else if (r.state === "in") pr = zoom >= 1.7 || (tgtDay && r.day === tgtDay && zoom >= 1.3) ? 80 + (tgtDay && r.day === tgtDay ? 10 : 0) : 0;
      else if (r.dimmed) pr = 0;
      else if (r.match) pr = zoom >= 1.4 ? 60 : 0;
      else if (zoom >= 2.3 && r.state !== "off") pr = 30 - (r.state === "ex" ? 12 : 0);
      else if (zoom >= 3.2) pr = 12;
      cands.push({ r, pr });
    });
    cands.sort((a, b) => b.pr - a.pr);
    const boxes = [];
    recs.forEach(r => { if (!r.hide && r._c && r._c.visible) boxes.push([r._c.x - 16, r._c.y - 20, r._c.x + 16, r._c.y + 12]); });
    cands.forEach(({ r, pr }) => {
      const lb = r._lb;
      if (!pr || !lb || !lb.visible) { r.label.style.visibility = "hidden"; return; }
      const lw = (r._lw || (r._lw = r.label.offsetWidth || r.a.name.length * 7 + 18)), lh = 22;
      const box = [lb.x - lw / 2 - 3, lb.y - 3, lb.x + lw / 2 + 3, lb.y + lh];
      const clash = pr < 100 && boxes.some(b => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1]);
      if (clash) { r.label.style.visibility = "hidden"; return; }
      boxes.push(box); put(r.label, lb, true);
    });
  }
  function drawRoute() {
    let out = "";
    const line = (world, cls) => { const pts = world.map(v => scene.project(v.x, v.y, v.z)).map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" "); return `<polyline class="${cls}" points="${pts}"/>`; };
    if (routeWorld.length) out += line(routeWorld, "imap-route imap-route--day-bg") + line(routeWorld, "imap-route imap-route--day dio-route") + line(routeWorld, "imap-route imap-route--day-dots");
    if (tourWorld.length > 1) out += line(tourWorld, "dio-tour dio-tour--bg") + line(tourWorld, "dio-tour dio-tour--dots");
    if (svgEl.innerHTML !== out) svgEl.innerHTML = out;
  }

  /* ---------------------------------------------------------------- camera */
  /* v17.3: on a phone-shaped pane the whole board is a thin band, so the home view frames the valley's places instead */
  function phoneHome(instant) {
    if (!scene) return false;
    const w = sceneEl.clientWidth || 0, h = sceneEl.clientHeight || 0;
    if (!w || w >= 640 || h < w * 0.9) return false;
    const pts = recs.filter(r => r.main && r.a.src !== "desk").map(r => r.pos);
    if (pts.length < 3) return false;
    fit(pts, 1.3, instant, 2600);
    return true;
  }
  function fit(points, minZoom, instant, padOverride) {
    if (!scene || !points.length) return;
    const w = sceneEl.clientWidth || 1, h = sceneEl.clientHeight || 1;
    const reserve = insets.right, lft = insets.left;
    const aw = Math.max(200, w - lft - reserve), ah = Math.max(160, h - insets.top - insets.bottom);
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    points.forEach(p => { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); });
    const pad = padOverride || (w < 700 ? 1200 : 2600), mpp1 = scene.metresPerPx() * scene.view.zoom, sinP = Math.sin(scene.PITCH);
    let zoom = Math.min(aw * mpp1 / (x1 - x0 + 2 * pad), ah * mpp1 * sinP / (z1 - z0 + 2 * pad));
    zoom = Math.max(minZoom || minZ(), minZ(), Math.min(MAX_ZOOM, zoom));
    const m = mpp1 / zoom;
    // centre the points in the part of the map the detail card leaves clear
    const cx = (x0 + x1) / 2 + reserve / 2 * m;   // the left panel is handled by a screen-space slide (setInsets), not here
    const cz = (z0 + z1) / 2 + (insets.bottom - insets.top) / 2 * m / sinP;
    if (instant) scene.go(cx, cz, zoom); else scene.fly(cx, cz, zoom, 850);
  }
  function overview(instant) {
    if (!scene) return;
    routeWorld = []; drawRoute();
    if (phoneHome(instant)) return;
    if (instant) scene.go(0, 0, minZ()); else scene.fly(0, 0, minZ(), 850);
  }
  function focus(id) {
    const r = byId[id]; if (!r || !scene) return;
    if (id === "culture" && r.toks.length > 1) { fit(r.toks.map(t => t.g.position), 1.2); return; }
    const z = Math.max(scene.view.zoom, 2.8);
    const m = scene.metresPerPx() * scene.view.zoom / z;
    scene.fly(r.pos.x + insets.right / 2 * m, r.pos.z + (insets.bottom - insets.top) / 2 * m / Math.sin(scene.PITCH), z, 850);
  }
  function focusStop(id, i) {
    const r = byId[id]; if (!r || !scene) return;
    const st = r.stopToks.find(x => x.i === i); if (!st) return focus(id);
    const z = Math.max(scene.view.zoom, 2.4), m = scene.metresPerPx() * scene.view.zoom / z, g = st.t.g.position;
    scene.fly(g.x + insets.right / 2 * m, g.z + (insets.bottom - insets.top) / 2 * m / Math.sin(scene.PITCH), z, 700);
  }
  function showDay(day) {
    if (!scene || !day) return;
    const pts = (day.items || []).map(a => byId[a.id] && byId[a.id].pos).filter(Boolean);
    const b = baseTok ? baseTok.g.position : null;
    // Frame the selected places; no straight-line connection is a verified travel route.
    routeWorld = [];
    drawRoute();
    const points=(b?[b]:[]).concat(pts);
    if(points.length)fit(points,1.3);
  }
  function setRoute(coords) { if (!coords || !coords.length) { routeWorld = []; drawRoute(); } }

  /* ---------------------------------------------------------------- public */
  function init(container, callbacks) {
    cb = callbacks || {};
    if (initialized && rootEl === container) { resize(); return; }
    rootEl = container; initialized = true;
    buildDOM();
    start();
  }
  function resize() { if (scene) { scene.resize(); positionOverlay(); } }
  function hover(id) { extHover = id || null; paintRings(); }
  function setInsets(o) {
    const before = insets.left;
    insets.left = (o && o.left) || 0; insets.right = (o && o.right) || 0; insets.top = (o && o.top) || 0; insets.bottom = (o && o.bottom) || 0;
    // v11: the Places panel covers the left of the map. Slide the board so its centre sits in the clear gap; sliding back when it closes. Zoom is never touched.
    if (scene && scene.slideTo && before !== insets.left) scene.slideTo(insets.left / 2, 520);
  }

  return {
    init, update, focus, focusStop, showDay, overview, resize, setRoute, hover, setInsets, prefetch, pulse,
    setBase() {}, set3D() {},
    isReady: () => ready,
    instance: () => (scene ? { getZoom: () => scene.view.zoom, isFallback: () => false, isHD: () => true, scene } : null)
  };
})();



