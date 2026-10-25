/* Myoko Days: small spinning 3D models for the Review page (the same crafted models the map uses).
   One shared WebGL renderer draws each model in turn onto its own small canvas, so a long trip never opens
   more than one GL context. A tile turns very slowly by itself, can be dragged (or turned with the arrow keys),
   and stays still under reduced motion. If WebGL or a model is missing the activity's photo stays in its place. */
MD.tiles = (function () {
  "use strict";
  const BASE = "assets/diorama/", THREE_URL = "js/vendor/three-r128.min.js?v=12";
  const REDUCE = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SPIN = 0.16;            // radians per second: one turn in about 40 s
  const SIZE = 60;              // css px (square)
  let T = null, K = null, renderer = null, cam = null, scene3 = null, readyP = null, failed = false;
  let tiles = [], raf = 0, last = 0, io = null, visible = new Set();

  const loadScript = src => new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("load " + src)); document.head.appendChild(s); });
  const loaded = {};
  const loadModel = id => loaded[id] || (loaded[id] = K.has(id) ? Promise.resolve() : loadScript(BASE + "kit/attractions/" + id + ".js?v=16.4").catch(() => null));

  function boot() {
    if (readyP) return readyP;
    readyP = (async () => {
      try {
        if (!window.THREE) await loadScript(THREE_URL);
        T = window.THREE;
        if (!window.MyokoKit) await loadScript(BASE + "kit/kit.js?v=12.3");
        K = window.MyokoKit;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const cv = document.createElement("canvas");
        renderer = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true });
        renderer.setPixelRatio(1); renderer.setSize(Math.round(SIZE * dpr), Math.round(SIZE * dpr), false);
        renderer.setClearColor(0x000000, 0);
        if (T.sRGBEncoding) renderer.outputEncoding = T.sRGBEncoding;
        scene3 = new T.Scene(); K.lights().forEach(l => scene3.add(l));
        cam = new T.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
        return true;
      } catch (e) { failed = true; return false; }
    })();
    return readyP;
  }

  /* frame a model: orthographic camera, 30 degrees down, sized to the model's own radius and height */
  function frame(info) {
    const R = Math.hypot(Math.max(info.radius, 20), info.height * 0.5) * 1.02;
    const pitch = 30 * Math.PI / 180, d = 400, cy = info.height * 0.4;
    cam.left = -R; cam.right = R; cam.top = R; cam.bottom = -R;
    cam.position.set(0, cy + Math.sin(pitch) * d, Math.cos(pitch) * d); cam.lookAt(0, cy, 0); cam.updateProjectionMatrix();
  }

  function draw(t) {
    if (!t.model) return;
    t.group.rotation.y = t.yaw;
    t.group.rotation.x = t.pitch;
    frame(t.info);
    const u = K.outlineMaterial.uniforms, keepRes = u.uRes.value.clone(), keepPx = u.uPx.value;   // the map shares this material; put it back after
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    K.setViewport(SIZE, SIZE, dpr);
    scene3.add(t.group); renderer.render(scene3, cam); scene3.remove(t.group);
    u.uRes.value.copy(keepRes); u.uPx.value = keepPx;
    const c = t.ctx; c.clearRect(0, 0, t.cv.width, t.cv.height); c.drawImage(renderer.domElement, 0, 0, t.cv.width, t.cv.height);
  }

  function tick(now) {
    raf = 0;
    if (document.hidden || !visible.size) return;
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    tiles.forEach(t => {
      if (!t.model || !visible.has(t.el)) return;
      if (!REDUCE && !t.drag && now > t.hold) t.yaw += SPIN * dt;
      if (t.pitch !== t.pitch0 && !t.drag) t.pitch += (t.pitch0 - t.pitch) * Math.min(1, dt * 2);   // settle back to the resting tilt
      draw(t);
    });
    schedule();
  }
  function schedule() { if (!raf && !document.hidden && visible.size && tiles.some(t => t.model)) raf = requestAnimationFrame(tick); }

  function bind(t) {
    const el = t.el;
    el.addEventListener("pointerdown", e => {
      if (e.button !== 0 || !t.model) return;
      t.drag = { x: e.clientX, y: e.clientY }; el.setPointerCapture(e.pointerId); el.classList.add("is-drag"); e.preventDefault();
    });
    el.addEventListener("pointermove", e => {
      if (!t.drag) return;
      t.yaw += (e.clientX - t.drag.x) * 0.012; t.pitch = Math.max(-0.35, Math.min(0.5, t.pitch + (e.clientY - t.drag.y) * 0.006));
      t.drag.x = e.clientX; t.drag.y = e.clientY; draw(t);
    });
    const end = () => { if (!t.drag) return; t.drag = null; t.hold = performance.now() + 2500; el.classList.remove("is-drag"); schedule(); };
    el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end); el.addEventListener("lostpointercapture", end);
    el.addEventListener("keydown", e => {
      const k = e.key === "ArrowLeft" ? -0.4 : e.key === "ArrowRight" ? 0.4 : 0;
      if (k) { t.yaw += k; t.hold = performance.now() + 2500; draw(t); e.preventDefault(); }
    });
  }

  async function mount(root) {
    unmount();
    const els = [...root.querySelectorAll(".rail__m[data-model]")];
    if (!els.length) return;
    const ok = await boot(); if (!ok || failed) { els.forEach(e => e.remove()); return; }   // no WebGL: the names stand alone
    if (!root.isConnected) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2), px = Math.round(SIZE * dpr);
    io = new IntersectionObserver(es => { es.forEach(en => { en.isIntersecting ? visible.add(en.target) : visible.delete(en.target); }); last = performance.now(); schedule(); }, { rootMargin: "80px" });
    let n = 0;
    for (const el of els) {
      const id = el.dataset.model, t = { el, id, model: null, yaw: 0.6 + (n++ % 5) * 0.9, pitch: 0.08, pitch0: 0.08, hold: 0, drag: null };
      tiles.push(t);
      try {
        await loadModel(id);
        if (!K.has(id) || !el.isConnected) { el.remove(); continue; }
        K.satBoost = 0.34; const m = K.build(id, { facing: 0 }); K.satBoost = 0;
        t.info = m.userData.kit; t.group = new T.Group(); t.group.add(m); t.model = m;
        const cv = document.createElement("canvas"); cv.width = cv.height = px; cv.className = "rail__cv"; cv.setAttribute("aria-hidden", "true");
        t.cv = cv; t.ctx = cv.getContext("2d");
        el.appendChild(cv); el.classList.add("is-3d"); el.tabIndex = 0;
        bind(t); draw(t); io.observe(el);
      } catch (e) { K.satBoost = 0; el.remove(); }
    }
    schedule();
  }
  function unmount() {
    if (raf) cancelAnimationFrame(raf); raf = 0;
    if (io) io.disconnect(); io = null; visible.clear();
    tiles.forEach(t => { if (t.group) t.group.traverse(o => { if (o.geometry) o.geometry.dispose(); }); });
    tiles = [];
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { last = performance.now(); schedule(); } });
  const api = { mount, unmount };
  setTimeout(() => { const r = document.getElementById("bookRoot"); if (r && r.querySelector(".rail__m[data-model]")) mount(r); }, 0);   // a first visit straight to Review renders before this file loads
  return api;
})();
