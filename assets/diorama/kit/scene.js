/* Myoko Diorama: scene core (three.js r128, global THREE; kit.js and houses.js are loaded by this file).
   Builds the stylised world from layout.json and the relief images, places the village houses and attraction
   models, runs the fixed-angle fly-in camera, and applies the STYLE PARTS (production bible, section 7):

     MyokoStyle.part("terrain" | "water" | "forest" | "atmosphere", function (ctx) { ... return { ... }; });

   With no style parts loaded everything is drawn in plain clay, so a style part can be judged on its own.
   Used by tools/diorama/style-lab.html now and by the site's map engine in stage 4.

   MyokoScene.create(container, { dataPath, kitPath, stylePath, quality }) -> Promise<scene>
*/
(function () {
  "use strict";

  /* ---------------------------------------------------------------- the style-part registry (exists before any part file runs) */
  const STYLE_ORDER = ["terrain", "water", "fields", "forest", "atmosphere"];
  const S = window.MyokoStyle = window.MyokoStyle || {};
  S.parts = S.parts || {};
  S.recent = S.recent || [];
  S.order = STYLE_ORDER;
  S.part = function (name, fn) {
    if (STYLE_ORDER.indexOf(name) < 0) throw new Error(`MyokoStyle.part: unknown part "${name}". Use one of: ${STYLE_ORDER.join(", ")}.`);
    if (typeof fn !== "function") throw new Error(`MyokoStyle.part("${name}"): the second argument must be a function (ctx) => { ... }.`);
    S.parts[name] = fn; S.recent.push("style:" + name);
  };

  const FOV = 24, PITCH = 42 * Math.PI / 180;
  const DIR = () => new THREE.Vector3(0, -Math.sin(PITCH), -Math.cos(PITCH));   // looking west and down
  const loadScript = src => new Promise(res => { const s = document.createElement("script"); s.src = src; s.onload = () => res(true); s.onerror = () => res(false); document.head.appendChild(s); });
  const loadImage = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("Couldn't load " + src.slice(0, 80))); i.src = src; });
  function pixels(img) {
    const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(img, 0, 0);
    return { w: c.width, h: c.height, data: x.getImageData(0, 0, c.width, c.height).data };
  }

  async function create(container, opts) {
    opts = opts || {};
    const T = window.THREE;
    if (!T) throw new Error("three.js didn't load.");
    const B = window.DIORAMA_BUNDLE || null;                 // data URIs for pages opened straight from disk
    const dataPath = opts.dataPath || "data/", kitPath = opts.kitPath || "kit/";
    const src = n => (B && B[n]) || dataPath + n + "?v=17.3";
    const prog = (opts.onProgress && typeof opts.onProgress === "function") ? opts.onProgress : () => {};

    let L;
    if (B && B["layout.json"]) L = B["layout.json"];
    else { const r = await fetch(dataPath + "layout.json?v=17.3"); if (!r.ok) throw new Error("layout.json " + r.status); L = await r.json(); }
    prog(0.08);
    const [hImg, shImg, cvImg, wtImg] = await Promise.all(["relief-height-lo.png", "relief-shape-lo.png", "relief-cover-lo.png", "relief-water-lo.png"].map(n => loadImage(src(n))));
    prog(0.3);
    const tnImg = await loadImage(src("relief-tone-hi.png")).catch(() => null);   // v3.1: tone, ridge lines and rivers (optional)
    prog(0.55);

    const EXAG = L.exaggeration || 1.8;
    const SE = L.spanMetres.eastWest, SN = L.spanMetres.northSouth;
    const hp = pixels(hImg), W = hp.w, H = hp.h;
    const hgt = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) hgt[i] = (hp.data[i * 4] * 256 + hp.data[i * 4 + 1]) / 10 - 50;
    const toRC = (x, z) => [((SN / 2 - x) / SN) * H - 0.5, ((z + SE / 2) / SE) * W - 0.5];
    function heightAt(x, z) {
      let [r, c] = toRC(x, z);
      r = Math.max(0, Math.min(H - 1.001, r)); c = Math.max(0, Math.min(W - 1.001, c));
      const r0 = Math.floor(r), c0 = Math.floor(c), fr = r - r0, fc = c - c0;
      const a = hgt[r0 * W + c0], b = hgt[r0 * W + c0 + 1], d = hgt[(r0 + 1) * W + c0], e = hgt[(r0 + 1) * W + c0 + 1];
      return (a * (1 - fc) + b * fc) * (1 - fr) + (d * (1 - fc) + e * fc) * fr;
    }

    /* ---------------------------------------------------------------- renderer */
    const phone = opts.quality === "lo" || (opts.quality !== "hi" && (matchMedia("(pointer: coarse)").matches || (navigator.deviceMemory || 8) < 4));
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: "high-performance" });
    if (!renderer.capabilities.isWebGL2) { renderer.dispose(); const e = new Error("This browser has no WebGL2."); e.fallback = true; throw e; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, phone ? 1.25 : 1.75));   // v3.3: capped (the painting is soft; 2x cost ~30% more fill)
    renderer.sortObjects = true;
    container.appendChild(renderer.domElement);
    const scene = new T.Scene();
    const CLAY_BG = new T.Color(0xEFEBE2);
    scene.background = CLAY_BG.clone();
    const camera = new T.PerspectiveCamera(FOV, 1, 50, 400000);
    scene.add(camera);                                        // so style parts can attach screen-fixed things to it

    /* ---------------------------------------------------------------- textures for the style parts
       uv.x = (z + SE/2) / SE  (0 = west edge, 1 = east edge)
       uv.y = (x + SN/2) / SN  (0 = south edge, 1 = north edge)            */
    const cpu = {};                                          // north-up RGBA pixels of each data image, for ctx.sample
    function rgbaTex(img, name) {
      const p = pixels(img), out = new Uint8Array(p.w * p.h * 4);
      if (name) cpu[name] = p;
      for (let r = 0; r < p.h; r++) out.set(p.data.subarray((p.h - 1 - r) * p.w * 4, (p.h - r) * p.w * 4), r * p.w * 4);   // row 0 = south
      const t = new T.DataTexture(out, p.w, p.h, T.RGBAFormat, T.UnsignedByteType);
      t.minFilter = t.magFilter = T.LinearFilter; t.wrapS = t.wrapT = T.ClampToEdgeWrapping; t.generateMipmaps = false; t.needsUpdate = true;
      return t;
    }
    const halfH = new Uint16Array(W * H);
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) halfH[r * W + c] = T.DataUtils.toHalfFloat(hgt[(H - 1 - r) * W + c]);
    const heightTex = new T.DataTexture(halfH, W, H, T.RedFormat, T.HalfFloatType);
    heightTex.minFilter = heightTex.magFilter = T.LinearFilter; heightTex.wrapS = heightTex.wrapT = T.ClampToEdgeWrapping; heightTex.generateMipmaps = false; heightTex.needsUpdate = true;
    // The slope of the ground (metres per metre, real heights) as its own smoothly filtered texture: normals and stroke
    // directions taken from it are continuous. Differences of the filtered height would be constant across each 33 m
    // texel and show as blocks when zoomed in.
    const grad = new Uint16Array(W * H * 2), mE = SE / W, mN = SN / H;
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      const ir = H - 1 - r;                                   // texture row r (south first) = image row ir
      const n = hgt[Math.max(0, ir - 1) * W + c], s = hgt[Math.min(H - 1, ir + 1) * W + c];
      const e = hgt[ir * W + Math.min(W - 1, c + 1)], w = hgt[ir * W + Math.max(0, c - 1)];
      const k = (r * W + c) * 2;
      grad[k] = T.DataUtils.toHalfFloat((n - s) / ((ir > 0 && ir < H - 1 ? 2 : 1) * mN));          // d height / d north (x)
      grad[k + 1] = T.DataUtils.toHalfFloat((e - w) / ((c > 0 && c < W - 1 ? 2 : 1) * mE));        // d height / d east (z)
    }
    const gradTex = new T.DataTexture(grad, W, H, T.RGFormat, T.HalfFloatType);
    gradTex.internalFormat = "RG16F";                       // r128 has no RG + half-float mapping of its own
    gradTex.minFilter = gradTex.magFilter = T.LinearFilter; gradTex.wrapS = gradTex.wrapT = T.ClampToEdgeWrapping; gradTex.generateMipmaps = false; gradTex.needsUpdate = true;
    const tex = { height: heightTex, gradient: gradTex, shape: rgbaTex(shImg, "shape"), cover: rgbaTex(cvImg, "cover"), water: rgbaTex(wtImg, "water") };
    if (tnImg) tex.tone = rgbaTex(tnImg, "tone");
    // bilinear lookup of a data image at world (x, z): [r, g, b] in 0..1 (same channels as the textures)
    function sample(name, x, z) {
      const p = cpu[name]; if (!p) return [0, 0, 0];
      let r = ((SN / 2 - x) / SN) * p.h - 0.5, c = ((z + SE / 2) / SE) * p.w - 0.5;
      r = Math.max(0, Math.min(p.h - 1.001, r)); c = Math.max(0, Math.min(p.w - 1.001, c));
      const r0 = Math.floor(r), c0 = Math.floor(c), fr = r - r0, fc = c - c0, out = [0, 0, 0];
      for (let k = 0; k < 3; k++) {
        const at = (rr, cc) => p.data[(rr * p.w + cc) * 4 + k];
        out[k] = ((at(r0, c0) * (1 - fc) + at(r0, c0 + 1) * fc) * (1 - fr) + (at(r0 + 1, c0) * (1 - fc) + at(r0 + 1, c0 + 1) * fc) * fr) / 255;
      }
      return out;
    }

    /* ---------------------------------------------------------------- terrain */
    const STEP = phone ? 3 : 2, GW = Math.floor((W - 1) / STEP) + 1, GH = Math.floor((H - 1) / STEP) + 1;
    const pos = new Float32Array(GW * GH * 3), uv = new Float32Array(GW * GH * 2);
    let k = 0, q = 0;
    for (let r = 0; r < GH; r++) for (let c = 0; c < GW; c++) {
      const rr = r * STEP, cc = c * STEP;
      const x = SN / 2 - ((rr + 0.5) / H) * SN, z = ((cc + 0.5) / W) * SE - SE / 2;
      pos[k++] = x; pos[k++] = hgt[rr * W + cc] * EXAG; pos[k++] = z;
      uv[q++] = (z + SE / 2) / SE; uv[q++] = (x + SN / 2) / SN;
    }
    const idx = new Uint32Array((GW - 1) * (GH - 1) * 6);
    k = 0;
    for (let r = 0; r < GH - 1; r++) for (let c = 0; c < GW - 1; c++) {
      const a = r * GW + c, b = a + 1, d = a + GW, e = d + 1;
      idx[k++] = a; idx[k++] = d; idx[k++] = b; idx[k++] = b; idx[k++] = d; idx[k++] = e;
    }
    const tg = new T.BufferGeometry();
    tg.setAttribute("position", new T.BufferAttribute(pos, 3));
    tg.setAttribute("uv", new T.BufferAttribute(uv, 2));
    tg.setIndex(new T.BufferAttribute(idx, 1));
    tg.computeVertexNormals();
    const clay = {
      terrain: new T.MeshLambertMaterial({ color: 0xd9d2c4 }),
      lake: new T.MeshLambertMaterial({ color: 0x9fb3c2 }), sea: new T.MeshLambertMaterial({ color: 0x9fb3c2 }),
      river: new T.MeshLambertMaterial({ color: 0x8fa8ba, side: T.DoubleSide }), shore: new T.MeshLambertMaterial({ color: 0xc9d4dc, side: T.DoubleSide }),
      rail: new T.MeshLambertMaterial({ color: 0x5d6461, side: T.DoubleSide })
    };
    const terrain = new T.Mesh(tg, clay.terrain); terrain.name = "terrain"; terrain.renderOrder = 0;
    scene.add(terrain);

    /* ---------------------------------------------------------------- water and lines (vectors from layout.json, sharp at every zoom) */
    const uvOf = (x, z) => [(z + SE / 2) / SE, (x + SN / 2) / SN];
    function flatPoly(outline, y) {
      const shape = new T.Shape(outline.map(([x, z]) => new T.Vector2(x, -z)));
      const g = new T.ShapeGeometry(shape);
      g.rotateX(-Math.PI / 2); g.translate(0, y, 0);
      const p = g.attributes.position, u = new Float32Array(p.count * 2);
      for (let i = 0; i < p.count; i++) { const t = uvOf(p.getX(i), p.getZ(i)); u[i * 2] = t[0]; u[i * 2 + 1] = t[1]; }
      g.setAttribute("uv", new T.BufferAttribute(u, 2));
      return g;
    }
    // A ribbon along points. uv.x = metres along the line, uv.y = 0..1 across it; attribute "width" = metres.
    function ribbon(points, width, lift, opt) {
      opt = opt || {};
      const p = opt.closed ? points.concat([points[0]]) : points;
      const v = [], u = [], wd = [], ind = [];
      let along = 0;
      for (let i = 0; i < p.length; i++) {
        if (i) along += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
        const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)];
        let tx = b[0] - a[0], tz = b[1] - a[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
        const nx = -tz * width / 2, nz = tx * width / 2;
        const y1 = opt.y !== undefined ? opt.y : heightAt(p[i][0] + nx, p[i][1] + nz) * EXAG + lift;
        const y2 = opt.y !== undefined ? opt.y : heightAt(p[i][0] - nx, p[i][1] - nz) * EXAG + lift;
        v.push(p[i][0] + nx, y1, p[i][1] + nz, p[i][0] - nx, y2, p[i][1] - nz);
        u.push(along, 0, along, 1); wd.push(width, width);
        if (i) { const o = (i - 1) * 2; ind.push(o, o + 2, o + 1, o + 1, o + 2, o + 3); }
      }
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.Float32BufferAttribute(v, 3)); g.setAttribute("uv", new T.Float32BufferAttribute(u, 2));
      g.setAttribute("width", new T.Float32BufferAttribute(wd, 1));
      g.setIndex(ind); g.computeVertexNormals();
      return g;
    }
    function merge(geos) {          // same attribute set, indexed -> one geometry
      const names = Object.keys(geos[0].attributes), out = new T.BufferGeometry(), ind = [];
      const arrs = {}; names.forEach(n => arrs[n] = []);
      let base = 0;
      geos.forEach(g => {
        names.forEach(n => arrs[n].push(...g.attributes[n].array));
        const gi = g.index ? g.index.array : [...Array(g.attributes.position.count).keys()];
        for (let i = 0; i < gi.length; i++) ind.push(gi[i] + base);
        base += g.attributes.position.count;
      });
      names.forEach(n => out.setAttribute(n, new T.Float32BufferAttribute(arrs[n], geos[0].attributes[n].itemSize)));
      out.setIndex(ind); out.computeBoundingSphere();
      return out;
    }
    const lines = {};
    const lakeY = l => l.level * EXAG + 2;
    lines.lake = new T.Mesh(merge((L.lakes || []).map(l => flatPoly(l.outline, lakeY(l)))), clay.lake);
    lines.sea = L.sea ? new T.Mesh(flatPoly(L.sea, 2), clay.sea) : null;
    lines.shore = new T.Mesh(merge((L.lakes || []).map(l => ribbon(l.outline, 60, 0, { closed: true, y: lakeY(l) + 0.6 }))
      .concat(L.seaCoast ? [ribbon(L.seaCoast.slice(1, -1), 60, 0, { y: 2.6 })] : [])), clay.shore);
    lines.river = tnImg ? null : new T.Mesh(merge((L.rivers || []).map(r => ribbon(r.points, Math.max(r.width * 1.25, 95), 5))), clay.river);   // v3: a little wider, so its lake-like colour reads
    lines.rail = null;          // v2: the railway is not drawn (it read as a stray dark line); layout.json keeps it
    const LINE_OFFSET = { lake: -2, sea: -2, shore: -3, river: -4, rail: -5 };
    Object.keys(lines).forEach(n => { const m = lines[n]; if (!m) return; m.name = n; m.renderOrder = 0; scene.add(m); });
    function setLineMat(n, mat) {
      const m = lines[n]; if (!m || !mat) return;
      mat.polygonOffset = true; mat.polygonOffsetFactor = LINE_OFFSET[n]; mat.polygonOffsetUnits = LINE_OFFSET[n];
      if (mat.side === undefined || n === "river" || n === "shore" || n === "rail") mat.side = T.DoubleSide;
      m.material = mat;
    }
    Object.keys(lines).forEach(n => setLineMat(n, clay[n]));

    /* ---------------------------------------------------------------- lights (clay until the kit loads) */
    const clayLights = [new T.HemisphereLight(0xf4f1ea, 0x8e9690, 0.62), new T.DirectionalLight(0xffffff, 0.72)];
    clayLights[1].position.set(-0.55, 0.75, -0.45);
    clayLights.forEach(l => scene.add(l));

    /* ---------------------------------------------------------------- kit, houses, attraction models */
    const tokens = [];
    const tokMat = new T.MeshLambertMaterial({ color: 0xffffff });
    (L.attractions || []).forEach(a => {
      const g = new T.Group(); g.name = "attraction:" + a.id;
      g.position.set(a.x, (a.onWater ? a.y : heightAt(a.x, a.z)) * EXAG, a.z);
      if (a.seatSlope) g.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(-EXAG * a.seatSlope[0], 1, -EXAG * a.seatSlope[1]).normalize());
      scene.add(g); tokens.push({ a, g, model: null });
    });
    function placeholder(t) {
      t.g.clear();
      const r = 0.4 * t.a.size;
      const body = new T.Mesh(new T.CylinderGeometry(r * 0.55, r * 0.75, r * 0.7, 6), tokMat);
      body.position.y = r * 0.35; t.g.add(body); t.model = null;
    }
    tokens.forEach(placeholder);
    prog(0.62);
    const ok = await loadScript(kitPath + "kit.js");
    prog(0.68);
    const K = ok && window.MyokoKit;
    let houses = null, trains = null, critters = null;
    const animated = new Set();
    /* v3: every activity stands on a "seal" ring draped on the ground (lake: floating on the water): a crisp gold rim
       with a fine ink edge and a faint washi wash inside. It marks the activity clearly at every zoom while the
       model's own base takes the colour of the painted ground under it, so the model sits in the map. The old glow
       sprite is kept (hidden) for the stage-4 hover and selection states. */
    const ringUniforms = { uShrink: { value: 1 }, uKin: { value: new T.Color(0xC4A25E) }, uInk: { value: new T.Color(0x2E3B35) }, uGofun: { value: new T.Color(0xFBF3E4) } };
    function ringMaterial(onWater) {
      return new T.ShaderMaterial({
        uniforms: Object.assign({}, ringUniforms, { uWaterRing: { value: onWater ? 1 : 0 }, uState: { value: 0 }, uKin: { value: new T.Color(0xC4A25E) }, uFade: { value: 1 } }),
        vertexShader: `varying vec2 vR; varying vec3 vW; attribute vec2 rr;
          void main() { vR = rr; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: `uniform vec3 uKin; uniform vec3 uInk; uniform vec3 uGofun; uniform float uWaterRing; uniform float uState; uniform float uShrink; uniform float uFade;
          varying vec2 vR; varying vec3 vW;
          void main() {
            float r = vR.x, R = vR.y * uShrink;                     // metres from the centre, rim radius
            float px = max(fwidth(r), 1e-3);
            float d = (r - R) / px;                        // pixels from the rim
            float rimW = 0.7 + 0.4 * uWaterRing + 0.6 * uState;
            float rim = 1.0 - smoothstep(rimW - 0.6, rimW + 0.6, abs(d));
            float inkO = 1.0 - smoothstep(0.4, 1.2, abs(d - rimW - 0.9));      // fine ink line just outside the gold
            float inkI = (1.0 - smoothstep(0.4, 1.2, abs(d + rimW + 0.9))) * 0.6;
            // second, thinner gold ring outside (water only): reads like a ripple round the boat
            float d2 = (r - R * 1.10) / px;
            float rip = uWaterRing * (1.0 - smoothstep(0.3, 1.1, abs(d2))) * 0.85;
            float inside = 1.0 - smoothstep(R * 0.55, R * 1.0, r);
            float wash = mix(0.07, 0.36, uWaterRing) * (1.0 - smoothstep(R * 0.80, R, r)) * step(r, R) * (0.6 + 0.4 * inside);
            vec3 col = uGofun; float a = wash;
            col = mix(col, uInk, max(inkO, inkI) * 0.7); a = max(a, max(inkO, inkI) * 0.55);
            col = mix(col, uKin, max(rim, rip)); a = max(a, max(rim, rip));
            a *= uFade;
            if (a < 0.01) discard;
            gl_FragColor = vec4(col, a);
          }`,
        transparent: true, depthWrite: false, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4
      });
    }
    function makeRing(t) {
      const a = t.a, R = 0.49 * a.size, r0 = 0.0, r1 = R * 1.18, NA = 96, NR = 10;
      const v = [], rr = [], id = [];
      for (let j = 0; j <= NR; j++) for (let i = 0; i <= NA; i++) {
        const r = r0 + (r1 - r0) * Math.pow(j / NR, 0.6), th = i / NA * Math.PI * 2;
        const x = a.x + Math.cos(th) * r, z = a.z + Math.sin(th) * r;
        const y = a.onWater ? a.y * EXAG + 3 : heightAt(x, z) * EXAG + 3.5;
        v.push(x, y, z); rr.push(r, R);
      }
      for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) { const p = j * (NA + 1) + i; id.push(p, p + NA + 1, p + 1, p + 1, p + NA + 1, p + NA + 2); }
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.Float32BufferAttribute(v, 3)); g.setAttribute("rr", new T.Float32BufferAttribute(rr, 2)); g.setIndex(id);
      const m = new T.Mesh(g, ringMaterial(!!a.onWater)); m.renderOrder = 1; m.name = "ring:" + a.id; m.frustumCulled = false;
      return m;
    }
    const rings = new T.Group(); rings.name = "rings"; scene.add(rings);
    tokens.forEach(t => { t.ring = makeRing(t); rings.add(t.ring); });

    // the model's base takes the painted ground colour under it (stronger toward its edge), so it sits in the map
    let groundColor = null;
    function tintBase(t) {
      const body = t.model && t.model.getObjectByName("body"); if (!body) return;
      const g = body.geometry, col = g.attributes.color, pos = g.attributes.position;
      if (!g.userData.orig) g.userData.orig = Float32Array.from(col.array);
      const o = g.userData.orig; col.array.set(o);
      if (groundColor && !t.a.onWater) {
        const f = (t.a.facing || 0) * Math.PI / 180, s = t.a.size / 100, cache = new Map();
        for (let i = 0; i < pos.count; i++) {
          const y = pos.getY(i); if (y > 2.6) continue;
          const r = o[i * 3], gg = o[i * 3 + 1], b = o[i * 3 + 2];
          if (b > r + 0.02 || (r > 0.6 && gg < 0.4)) continue;              // water, red lacquer: leave
          if (r > 0.95 && gg > 0.92 && b > 0.85) continue;                  // white walls and plaster
          const lx = pos.getX(i), lz = pos.getZ(i), rad = Math.hypot(lx, lz);
          const k = (Math.round(lx / 3) + "," + Math.round(lz / 3));
          let c = cache.get(k);
          if (!c) { const out = 1.25 * Math.max(rad, 30) / Math.max(rad, 1e-3);           // sample just outside the seat (its own ground is flattened)
            const wx = t.a.x + (lx * Math.cos(f) + lz * Math.sin(f)) * s * out, wz = t.a.z + (-lx * Math.sin(f) + lz * Math.cos(f)) * s * out; c = groundColor(wx, wz); cache.set(k, c); }
          const e = Math.min(1, Math.max(0, (rad - 34) / 12)), w = 0.14 + 0.66 * e * e * (3 - 2 * e);   // a light touch inside, the rim melts into the ground
          col.array[i * 3] = r + (c.r - r) * w; col.array[i * 3 + 1] = gg + (c.g - gg) * w; col.array[i * 3 + 2] = b + (c.b - b) * w;
        }
      }
      col.needsUpdate = true;
    }
    function buildModel(t) {
      if (!K || !K.has(t.a.id)) { placeholder(t); return false; }
      let m;
      K.satBoost = window.ATTR_SAT || 0; try { m = K.build(t.a.id, { facing: t.a.facing || 0 }); } catch (e) { placeholder(t); throw e; } finally { K.satBoost = 0; }
      t.g.clear(); animated.delete(t.model);
      const holder = new T.Group(); holder.scale.setScalar(t.a.size / 100);
      const info = m.userData.kit;
      const halo = K.makeHalo(Math.max(info.radius, 20)); halo.position.y = info.height * 0.45;
      halo.material.depthTest = false; halo.material.opacity = 0.55; halo.scale.multiplyScalar(1.12);
      halo.visible = false;                                            // v3: the seal ring marks the activity; glow kept for hover states
      const turn = new T.Group(); turn.rotation.y = (t.a.facing || 0) * Math.PI / 180; turn.add(m);
      holder.add(halo, turn); t.g.add(holder);
      t.g.position.y = t.a.onWater ? t.a.y * EXAG + 2 : heightAt(t.a.x, t.a.z) * EXAG;
      t.model = m; t.halo = halo;
      tintBase(t);
      if (m.userData.animate) animated.add(m);
      return true;
    }
    const modelErrors = [];
    if (K) {
      let _done = 0; const _n = tokens.length + 1; const _tick = p => p.then(v => { _done++; prog(0.68 + 0.26 * _done / _n); return v; });
      await Promise.all(tokens.map(t => _tick(loadScript(kitPath + "attractions/" + t.a.id + ".js?v=17.3"))).concat(_tick(loadScript(kitPath + "houses.js"))));
      await loadScript(kitPath + "attractions/train.js?v=16.0"); await loadScript(kitPath + "trains.js?v=17.18"); await loadScript(kitPath + "grazers.js?v=21.1"); await loadScript(kitPath + "critters.js?v=21.1").catch(() => null);
      try {
        if (window.MyokoTrains) { trains = window.MyokoTrains.create({ T, K, scene, L, heightAt, EXAG, reduce: () => matchMedia("(prefers-reduced-motion: reduce)").matches }); trains.prepare(); }
      } catch (e) { trains = null; modelErrors.push("trains: " + e.message); }
      if (window.MyokoHouses) { const hs = window.MyokoHouses.build(L, heightAt, EXAG); houses = hs; scene.add(hs.group); }
      try { if (trains) scene.add(trains.build()); } catch (e) { trains = null; modelErrors.push("trains: " + e.message); }
      try { if (window.MyokoCritters && K) { critters = window.MyokoCritters.create({ T, kit: K.api, L, heightAt, EXAG }); scene.add(critters.build()); } } catch (e) { critters = null; modelErrors.push("critters: " + e.message); }
      clayLights.forEach(l => scene.remove(l)); K.lights().forEach(l => scene.add(l));
      tokens.forEach(t => { try { buildModel(t); } catch (e) { modelErrors.push(`${t.a.id}: ${e.message}`); } });
    }

    /* ---------------------------------------------------------------- shared uniforms and GLSL given to every style part */
    const sun = new T.Vector3(-0.55, 0.78, -0.42).normalize();
    const shared = {
      uTime: { value: 0 }, uZoom: { value: 1 }, uCamPos: { value: new T.Vector3() }, uViewDist: { value: 1 },
      uViewport: { value: new T.Vector2(1, 1) }, uPixelRatio: { value: renderer.getPixelRatio() },
      uSpan: { value: new T.Vector2(SE, SN) }, uExag: { value: EXAG }, uSun: { value: sun.clone() },
      uReduceMotion: { value: matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 0 }
    };
    const PAL = K ? K.PALETTE : {};
    const vec3 = hex => { const c = new T.Color(hex); return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`; };
    const glsl = {
      palette: Object.keys(PAL).map(k => `const vec3 ${k.toUpperCase()} = ${vec3(PAL[k])};`).join("\n"),
      uniforms: `uniform float uTime; uniform float uZoom; uniform vec3 uCamPos; uniform float uViewDist; uniform vec2 uViewport; uniform float uPixelRatio;
uniform vec2 uSpan; uniform float uExag; uniform vec3 uSun; uniform float uReduceMotion;`,
      worldUV: `vec2 worldUV(vec3 p) { return vec2((p.z + uSpan.x * 0.5) / uSpan.x, (p.x + uSpan.y * 0.5) / uSpan.y); }`
    };
    /* Shared painting helpers, so every surface fades into the distance and the paper edge in exactly the same way.
       Include after glsl.uniforms and glsl.palette. Everything is smooth (no grain): value noise is only used at
       kilometre scales. */
    glsl.paint = `
float pHash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec2 pHash2(vec2 p) { float n = pHash(p); return vec2(n, pHash(p + n + 17.17)); }
float pNoise(vec2 p) {                       // smooth value noise, about 0..1
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(pHash(i), pHash(i + vec2(1.0, 0.0)), u.x), mix(pHash(i + vec2(0.0, 1.0)), pHash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float pFbm(vec2 p) { return 0.6 * pNoise(p) + 0.3 * pNoise(p * 2.03 + 7.1) + 0.1 * pNoise(p * 4.01 + 3.7); }
// how far toward the distance a point is: 0 near, 1 far (relative to how far the camera is from what it looks at)
float pFar(vec3 wp) { return smoothstep(0.85 * uViewDist, 2.1 * uViewDist, length(wp - uCamPos)); }
// aerial perspective: further is paler, bluer and softer
vec3 pAerial(vec3 col, vec3 wp) {
  float f = pFar(wp);
  vec3 c = mix(col, mix(col, ENZAN, 0.55), f * 0.8);
  return mix(c, PAPER, f * f * 0.08);
}
// the area's edges dissolve into paper along a soft, irregular line: 0 at the very edge, 1 inside
float pEdge(vec3 wp) { return 1.0; }
vec3 pFinish(vec3 col, vec3 wp) { return mix(PAPER, pAerial(col, wp), pEdge(wp)); }
// metres covered by one screen pixel at this point (for constant-width lines)
float pPixel(vec3 wp) { return max(length(fwidth(wp.xz)) * 0.7071, 1e-3); }
`;

    if (critters) critters.setAtmosphere(shared, glsl);

    /* ---------------------------------------------------------------- applying the style parts */
    const styleRoot = new T.Group(); styleRoot.name = "style"; scene.add(styleRoot);
    let updaters = [], styleErrors = [], styleLog = [];
    const disposeTree = o => o.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) [].concat(c.material).forEach(m => m.dispose()); });
    function applyStyle(enabled) {
      updaters = []; styleErrors = []; styleLog = [];
      styleRoot.children.slice().forEach(c => { styleRoot.remove(c); disposeTree(c); });
      terrain.material = clay.terrain; Object.keys(lines).forEach(n => setLineMat(n, clay[n]));
      if (groundColor) { groundColor = null; tokens.forEach(tintBase); }
      scene.background = CLAY_BG.clone();
      if (enabled === false) return;
      const ctx = {
        THREE: T, kit: K ? K.api : null, PALETTE: PAL, shared, glsl, tex, layout: L, heightAt, exaggeration: EXAG,
        span: { eastWest: SE, northSouth: SN }, metresPerTexel: SE / W, quality: phone ? "lo" : "hi",
        camera, renderer, terrain, lines, houses: houses && houses.group, models: tokens.map(t => t.g),
        sun: sun.clone(), worldToUV: (x, z) => uvOf(x, z), sample
      };
      STYLE_ORDER.forEach(name => {
        const fn = S.parts[name]; if (!fn) return;
        let out;
        try { out = fn(ctx) || {}; if (name === "fields" && critters) critters.setObstacles(out.plots || []); }
        catch (e) { styleErrors.push(`${name}: ${e.message}`); console.error(e); return; }
        const got = [], undo = [];
        if (out.material) { const was = terrain.material; terrain.material = out.material; got.push("terrain material"); undo.push(() => terrain.material = was); }
        ["lake", "sea", "river", "shore", "rail"].forEach(n => { if (out[n] && lines[n]) { const was = lines[n].material; setLineMat(n, out[n]); got.push(n); undo.push(() => lines[n].material = was); } });
        if (out.object) { styleRoot.add(out.object); got.push("objects"); undo.push(() => { styleRoot.remove(out.object); disposeTree(out.object); }); }
        if (typeof out.colorAt === "function") { groundColor = out.colorAt; tokens.forEach(tintBase); got.push("ground colour"); undo.push(() => { groundColor = null; tokens.forEach(tintBase); }); }
        if (out.background !== undefined) { const was = scene.background; scene.background = new T.Color(out.background); got.push("background"); undo.push(() => scene.background = was); }
        if (typeof out.update === "function") { updaters.push({ name, fn: out.update }); got.push("update"); undo.push(() => updaters = updaters.filter(u => u.name !== name)); }
        const mats = [];
        if (out.material) mats.push(out.material);
        ["lake", "sea", "river", "shore", "rail"].forEach(n => { if (out[n]) mats.push(out[n]); });
        if (out.object) out.object.traverse(o => { if (o.material) [].concat(o.material).forEach(m => mats.push(m)); });
        const bad = compileErrors(mats);
        if (bad) { undo.reverse().forEach(f => f()); styleErrors.push(`${name}: the shader didn't compile, so this part is switched off.\n${bad}`); styleLog.push(`${name}: shader error`); return; }
        styleLog.push(`${name}: ${got.join(", ") || "nothing returned"}`);
      });
    }
    // Compile now (only new materials actually compile; the rest are cached) so a shader error is reported against the
    // part that caused it, in a short form: which shader, the error, and the offending line of code.
    function compileErrors(mats) {
      const origLog = console.error; let thrown = "";
      console.error = function () { };               // three logs the whole expanded shader; we report a short form below
      try { renderer.compile(scene, camera); } catch (e) { thrown = String(e && e.message); } finally { console.error = origLog; }
      if (thrown) return "  " + thrown;
      const out = [];
      mats.forEach(m => {
        const props = renderer.properties.get(m);
        const progs = props.programs ? [...props.programs.values()] : (props.program ? [props.program] : []);   // r128 keeps a map
        const d = (progs.find(p => p.diagnostics && !p.diagnostics.runnable) || {}).diagnostics;
        if (!d) return;
        [["vertex", d.vertexShader, m.vertexShader], ["fragment", d.fragmentShader, m.fragmentShader]].forEach(([kind, sd, src]) => {
          if (!sd || !sd.log) return;
          const pre = (sd.prefix || "").split("\n").length;              // lines three.js adds (#version + prefix) before the part's own code
          const own = String(src || "").split("\n");
          for (const e of sd.log.matchAll(/ERROR: \d+:(\d+): ([^\n\u0000]*)/g)) {
            const n = +e[1] - pre, line = own[n - 1];
            out.push(`  ${kind} shader, line ${n}: ${e[2].trim()}` + (line !== undefined ? `\n    > ${line.trim()}` : ""));
            if (out.length >= 4) return;
          }
        });
        if (!out.length && d.programLog) out.push("  " + d.programLog.trim().slice(0, 300));
      });
      return [...new Set(out)].join("\n");
    }

    /* ---------------------------------------------------------------- camera: fixed angle, fly-in zoom */
    // v3.4: zoom limits (the site zooms out only until the clouds at the sides just show)
    const BASE_MIN_Z = opts.minZoom || 1, MAX_Z = opts.maxZoom || 6;
    let MIN_Z = BASE_MIN_Z;
    const view = { x: 0, z: 0, zoom: MIN_Z };
    const dir = DIR();
    let baseDist = 1, cw = 1, ch = 1;
    function fit() {
      cw = container.clientWidth || 1; ch = container.clientHeight || 1;
      renderer.setSize(cw, ch, false); camera.aspect = cw / ch; camera.updateProjectionMatrix();
      if (K) K.setViewport(cw, ch, renderer.getPixelRatio());
      shared.uViewport.value.set(cw * renderer.getPixelRatio(), ch * renderer.getPixelRatio()); shared.uPixelRatio.value = renderer.getPixelRatio();
      const t = Math.tan((FOV * Math.PI / 180) / 2);
      const needV = (SE * Math.sin(PITCH) + 3000 * EXAG * Math.cos(PITCH)) * 0.5 * 1.04 / t;   // v3.2: room for the taller peaks
      const needH = (SN * 0.5 * 1.04) / (t * camera.aspect);
      baseDist = Math.max(needV, needH) * (window.FIT_PAD || 1);
      MIN_Z = opts.fitCorners === false ? BASE_MIN_Z : solveMinZoom();
    }
    /* v12.2: the farthest zoom-out is the one where the board's two bottom (near) corners have only just left the view,
       so the map always fills its pane. Solved numerically for the pane's own size and shape (binary search on zoom). */
    const probe = new T.PerspectiveCamera(FOV, 1, 1, 1e7);
    function probeXY(zoom, wx, wy, wz) {
      const d = baseDist / zoom, ty = heightAt(0, 0) * EXAG * Math.min(1, (zoom - 1) / 2);
      probe.aspect = cw / ch; probe.clearViewOffset(); probe.updateProjectionMatrix();
      const sh = (window.SHIFT_X || 0) * cw * Math.max(0, 1 - (zoom - 1) / 1.4);
      if (Math.abs(sh) > 0.5) probe.setViewOffset(cw, ch, sh, 0, cw, ch);
      probe.position.set(0, ty, 0).addScaledVector(dir, -d); probe.lookAt(0, ty, 0); probe.updateMatrixWorld(true);
      const v = new T.Vector3(wx, wy, wz).project(probe);
      return { x: (v.x * 0.5 + 0.5) * cw, y: (0.5 - v.y * 0.5) * ch };
    }
    function bottomCornersGone(zoom) {
      const out = p => p.y > ch + 1 || p.x < -1 || p.x > cw + 1;
      return [-SN / 2, SN / 2].every(x => out(probeXY(zoom, x, heightAt(x, SE / 2) * EXAG, SE / 2)));
    }
    function solveMinZoom() {
      let lo = BASE_MIN_Z, hi = Math.min(MAX_Z, 2.6);
      if (bottomCornersGone(lo)) return lo;
      if (!bottomCornersGone(hi)) return hi;
      for (let i = 0; i < 22; i++) { const mid = (lo + hi) / 2; if (bottomCornersGone(mid)) hi = mid; else lo = mid; }
      return hi;
    }
    function clampView() {
      view.zoom = Math.min(MAX_Z, Math.max(MIN_Z, view.zoom));
      const lim = 1 - 1 / view.zoom;
      view.x = Math.max(-SN / 2 * lim, Math.min(SN / 2 * lim, view.x));
      view.z = Math.max(-SE / 2 * lim, Math.min(SE / 2 * lim, view.z));
    }
    const listeners = { move: [] };
    function place() {
      const d = baseDist / view.zoom;
      camera.near = Math.max(20, d * 0.08); camera.far = d * 3 + 80000;
      // v9: at full view the board sits a little left of centre (room for the key on the right); eases out as you zoom in
      const sh = (window.SHIFT_X || 0) * cw * Math.max(0, 1 - (view.zoom - 1) / 1.4);
      // v11: a screen-space slide (px, + = board moves right) so a side panel can take its share of the canvas at ANY zoom, without touching the zoom
      const sx = sh - shiftPx;
      if (Math.abs(sx) > 0.5) camera.setViewOffset(cw, ch, sx, 0, cw, ch); else if (camera.view && camera.view.enabled) camera.clearViewOffset();
      camera.updateProjectionMatrix();
      const ty = heightAt(view.x, view.z) * EXAG * Math.min(1, (view.zoom - 1) / 2);
      const target = new T.Vector3(view.x, ty, view.z);
      camera.position.copy(target).addScaledVector(dir, -d); camera.lookAt(target);
      shared.uZoom.value = view.zoom; shared.uCamPos.value.copy(camera.position); shared.uViewDist.value = d;
      // v2: models stay prominent when zoomed in (they shrink only to 80%, was 55%)
      const shrink = 1 - 0.20 * Math.min(1, Math.max(0, (view.zoom - 1) / 5));
      tokens.forEach(t => t.g.scale.setScalar(shrink)); ringUniforms.uShrink.value = shrink;
      if (houses && houses.setZoom) houses.setZoom(view.zoom);
      requestRender();
    }
    let shiftPx = 0, shiftAnim = null;
    function slideTo(px, ms) {
      px = Math.round(px || 0);
      if (!ms || reduce() || Math.abs(px - shiftPx) < 1) { shiftAnim = null; shiftPx = px; place(); return; }
      shiftAnim = { from: shiftPx, to: px, t0: performance.now(), ms };
      const step = now => { const a = shiftAnim; if (!a) return; const t = Math.min(1, (now - a.t0) / a.ms), e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; shiftPx = a.from + (a.to - a.from) * e; place(); if (t < 1) requestAnimationFrame(step); else shiftAnim = null; };
      requestAnimationFrame(step);
    }
    const go = (x, z, zoom) => { flight = null; view.x = x; view.z = z; view.zoom = zoom; clampView(); place(); };
    // v3.3: smooth camera flights (eased; zoom eased in log space so it feels even)
    let flight = null;
    function fly(x, z, zoom, ms) {
      if (!ms || reduce()) { go(x, z, zoom); return; }
      const to = { x, z, zoom: Math.min(MAX_Z, Math.max(MIN_Z, zoom)) };
      flight = { from: { x: view.x, z: view.z, zoom: view.zoom }, to, t0: performance.now(), ms, ease: arguments[4] || "inout" };
    }
    function stepFlight(now) {
      const f = flight; if (!f) return;
      let t = Math.min(1, (now - f.t0) / f.ms); const e = f.ease === "out" ? 1 - Math.pow(1 - t, 3) : t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      view.zoom = Math.exp(Math.log(f.from.zoom) + (Math.log(f.to.zoom) - Math.log(f.from.zoom)) * e);
      view.x = f.from.x + (f.to.x - f.from.x) * e; view.z = f.from.z + (f.to.z - f.from.z) * e;
      clampView(); place();
      if (t >= 1) flight = null;
    }
    const metresPerPx = () => (2 * Math.tan(FOV * Math.PI / 360) * baseDist / view.zoom) / ch;

    /* ---------------------------------------------------------------- rendering: on demand, 30 fps while something animates */
    const reduce = () => shared.uReduceMotion.value > 0.5;
    let pending = false, frames = 0, fpsT = performance.now(), fps = 0, running = true, active = true;
    function draw(now) {
      shared.uTime.value = now / 1000;
      if (!reduce()) { animated.forEach(m => m.userData.animate(now / 1000)); if (trains) trains.update(now / 1000); if (critters) critters.update(now / 1000, view.zoom); }
      updaters.forEach(u => { try { u.fn(now / 1000, view); } catch (e) { styleErrors.push(`${u.name} update: ${e.message}`); updaters = updaters.filter(x => x !== u); } });
      renderer.render(scene, camera);
      frames++; if (now - fpsT > 1000) { fps = frames * 1000 / (now - fpsT); frames = 0; fpsT = now; }
      listeners.move.forEach(f => f());
    }
    function requestRender() { if (pending) return; pending = true; requestAnimationFrame(now => { pending = false; draw(now); }); }
    let last = 0;
    (function loop(now) {
      if (!running) return;
      if (active && !document.hidden && (animated.size || updaters.length || flight || (trains && trains.active()) || (critters && critters.active())) && (flight || !reduce()) && now - last > 33) { last = now; if (flight) stepFlight(now); requestRender(); }
      requestAnimationFrame(loop);
    })(0);

    /* ---------------------------------------------------------------- input: drag to pan, wheel / pinch / double-click to zoom */
    const el = renderer.domElement, ptrs = new Map(); let pinch = 0, trail = [];
    el.style.touchAction = "none";
    const sinP = Math.sin(PITCH);
    // v3.4: the ground follows the hand (both axes), zoom keeps the point under the cursor fixed, a release glides
    function zoomAt(sx, sy, factor, ms) {
      const r = el.getBoundingClientRect(), dx = sx - r.left - cw / 2, dy = sy - r.top - ch / 2;
      const z0 = view.zoom, z1 = Math.min(MAX_Z, Math.max(MIN_Z, z0 * factor));
      if (z1 === z0) return;
      const m0 = metresPerPx(), m1 = m0 * z0 / z1;
      const nx = view.x + dx * (m0 - m1), nz = view.z + dy * (m0 - m1) / sinP;
      if (ms) fly(nx, nz, z1, ms, "out"); else { flight = null; view.x = nx; view.z = nz; view.zoom = z1; clampView(); place(); }
    }
    el.addEventListener("pointerdown", e => { flight = null; el.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); trail = [[performance.now(), e.clientX, e.clientY]]; });
    el.addEventListener("pointermove", e => {
      const p = ptrs.get(e.pointerId); if (!p) return;
      const cur = [e.clientX, e.clientY]; ptrs.set(e.pointerId, cur);
      if (ptrs.size === 1) {
        const m = metresPerPx();
        view.x -= (cur[0] - p[0]) * m; view.z -= (cur[1] - p[1]) * m / sinP; clampView(); place();
        trail.push([performance.now(), cur[0], cur[1]]); if (trail.length > 6) trail.shift();
      } else if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (pinch) zoomAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, d / pinch); pinch = d; trail = [];
      }
    });
    const up = e => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = 0;
      if (ptrs.size || trail.length < 2 || reduce()) return;
      const [t0, x0, y0] = trail[0], [t1, x1, y1] = trail[trail.length - 1], dt = Math.max(16, t1 - t0);
      if (performance.now() - t1 > 80) return;                       // the hand stopped before letting go
      const vx = (x1 - x0) / dt, vy = (y1 - y0) / dt, sp = Math.hypot(vx, vy);
      if (sp < 0.25) return;
      const m = metresPerPx(), k = Math.min(sp, 3.5) / sp * 260;      // glide about a quarter second of travel
      fly(view.x - vx * k * m, view.z - vy * k * m / sinP, view.zoom, 650, "out");
    };
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
    el.addEventListener("wheel", e => {
      e.preventDefault();
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
      zoomAt(e.clientX, e.clientY, Math.exp(-Math.max(-120, Math.min(120, dy)) * 0.0022));
    }, { passive: false });
    el.addEventListener("dblclick", e => zoomAt(e.clientX, e.clientY, e.shiftKey ? 1 / 1.8 : 1.8, 420));
    const onResize = () => { fit(); clampView(); place(); };
    document.addEventListener("visibilitychange", () => { if (!document.hidden) requestRender(); });
    window.addEventListener("resize", onResize);

    fit(); clampView(); applyStyle(true); place();

    return {
      THREE: T, renderer, scene, camera, layout: L, heightAt, get trains() { return trains; }, get critters() { return critters; }, exaggeration: EXAG, tokens, view, tex, shared,
      go, fly, slideTo, zoomAt, get minZoom() { return MIN_Z; }, maxZoom: MAX_Z, render: requestRender, resize: onResize, applyStyle, PITCH,
      metresPerPx: () => metresPerPx(),
      // pause drawing (the map is off-screen or hidden); resume redraws once
      setActive(on) { active = !!on; if (active) requestRender(); },
      // a ring's look: color (hex), fade (0..1), strong (0..1, a thicker rim); glow shows the soft halo behind the model
      setRing(t, o) {
        const u = t.ring && t.ring.material.uniforms; if (!u) return;
        if (o.color !== undefined) u.uKin.value.set(o.color);
        if (o.fade !== undefined) u.uFade.value = o.fade;
        if (o.strong !== undefined) u.uState.value = o.strong;
        if (t.halo && o.glow !== undefined) { t.halo.visible = o.glow > 0; t.halo.material.opacity = 0.5 * o.glow; }
        requestRender();
      },
      rebuildModel(id) { const t = tokens.find(t => t.a.id === id); if (!t) throw new Error(`"${id}" is not an attraction in layout.json`); const r = buildModel(t); place(); return r; },
      setModelsVisible(on) { tokens.forEach(t => { t.g.visible = on; t.ring.visible = on; }); requestRender(); },
      setHousesVisible(on) { if (houses) houses.group.visible = on; requestRender(); },
      project(x, y, z) { const v = new T.Vector3(x, y, z).project(camera); return { x: (v.x + 1) / 2 * cw, y: (1 - v.y) / 2 * ch, visible: v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05 }; },
      on(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); },
      info() {
        const r = renderer.info.render;
        return { fps, calls: r.calls, triangles: r.triangles, zoom: view.zoom, quality: phone ? "lo" : "hi", models: tokens.filter(t => t.model).length, total: tokens.length,
                 houses: houses ? houses.count : 0, styleErrors: styleErrors.slice(), modelErrors: modelErrors.slice(), styleLog: styleLog.slice() };
      },
      destroy() { running = false; window.removeEventListener("resize", onResize); renderer.dispose(); el.remove(); }
    };
  }

  window.MyokoScene = { create, STYLE_ORDER, FOV, PITCH_DEG: 42 };
})();
