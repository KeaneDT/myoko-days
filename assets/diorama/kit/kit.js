/* Myoko Diorama — model kit (three.js r128, global THREE).
   Everything an attraction model may use: the palette materials, shape helpers for crafted miniatures
   (bevelled blocks, Japanese roofs, torii, trees, figures, water, paths, fences, cables, rocks, ground),
   and the finishing step that turns a model into one vertex-coloured toon mesh with a crisp ink outline.

   A model file does only this:
     MyokoKit.register("naena", function build(kit) { const g = kit.group(); ...; return g; });

   Model space: the model fits a circle 100 units across, base centred at (0, 0, 0), +Y up, the front faces +Z
   (toward the camera). Only kit.mat.* materials. No textures, images, lights or text.
   Parts that move: kit.keep(mesh) keeps a mesh separate, and group.userData.animate = (t) => { ... } moves it
   (very slowly; the engine does not call it when the visitor prefers reduced motion). */
window.MyokoKit = (function () {
  "use strict";
  const T = window.THREE;
  if (!T) throw new Error("MyokoKit needs three.js r128 (global THREE) loaded first.");

  /* ---------------------------------------------------------------- palette (production bible, section 4)
     Sampled from the master painting myoko-art.jpg (Taishō bird's-eye style, 16 Oct): warm washi, olive mineral
     greens, ochre plains, teal-indigo lake, grey-green ink. The token names are unchanged, so every model follows.
     Earlier frame-B values, for reference: paper F3EEE3, gofun FBF8F1, sumi 26302B, rokusho 3E6B4F, byakuroku A9C39A,
     moegi B9C77E, kuchiba D8C27A, tonoko E3D3B4, gunjo 2D5590, byakugun 8DB3C9, kawara 6B7580, hinoki B98A5E,
     shu C0462E, kin C9A45C. */
  const PALETTE = {
    paper: 0xF4E5C8, gofun: 0xFBF3E4, sumi: 0x2E3B35, rokusho: 0x4F6B53, byakuroku: 0xA6AA83,
    moegi: 0xB5B57C, kuchiba: 0xD6BC80, tonoko: 0xDFC896, gunjo: 0x26566F, byakugun: 0xA9BFBE,
    kawara: 0x707873, hinoki: 0xB08A5E, shu: 0xB0452C, kin: 0xC4A25E,
    enzan: 0x9DA9A3,    // distant ranges: the blue-grey of the far mountains (aerial perspective)
    kasumi: 0xF7EAD2    // mist bands
  };

  // Soft painted light: four tones with smooth steps between them (not photographic, not hard cel bands).
  const gradient = (() => {
    const v = [150, 196, 232, 255];
    const data = new Uint8Array(v.length * 4);
    v.forEach((t, i) => data.set([t, t, t, 255], i * 4));
    const tex = new T.DataTexture(data, v.length, 1, T.RGBAFormat);
    tex.minFilter = T.LinearFilter; tex.magFilter = T.LinearFilter; tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return tex;
  })();

  function toonMaterial(color, opts) {
    return new T.MeshToonMaterial(Object.assign({ color, gradientMap: gradient, side: T.DoubleSide }, opts || {}));
  }

  /* Palette materials. A model mixes a token toward paper (t > 0, lighter) or sumi (t < 0, darker) with
     kit.tone("rokusho", -0.2): still inside the palette family. */
  const mat = {};
  const toneCache = {};
  Object.keys(PALETTE).forEach(k => {
    mat[k] = toonMaterial(PALETTE[k]);
    mat[k].userData.kitColor = new T.Color(PALETTE[k]);
    mat[k].userData.kitToken = k;
  });
  function tone(token, t) {
    if (!(token in PALETTE)) throw new Error(`kit.tone: unknown colour "${token}"`);
    const key = token + ":" + t.toFixed(2);
    if (toneCache[key]) return toneCache[key];
    const c = new T.Color(PALETTE[token]).lerp(new T.Color(t >= 0 ? PALETTE.gofun : PALETTE.sumi), Math.min(1, Math.abs(t)));
    const m = toonMaterial(c.getHex());
    m.userData.kitColor = c; m.userData.kitToken = key;
    return (toneCache[key] = m);
  }

  /* ---------------------------------------------------------------- small utilities */
  function rand(seed) {
    let s = (seed >>> 0) || 1;
    return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  }
  function place(obj, o) {
    if (!o) return obj;
    obj.position.set(o.x || 0, o.y || 0, o.z || 0);
    obj.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0);
    if (o.s !== undefined) { if (Array.isArray(o.s)) obj.scale.set(o.s[0], o.s[1], o.s[2]); else obj.scale.setScalar(o.s); }
    return obj;
  }
  function mesh(geom, m, o) {
    if (!m || !m.userData || !m.userData.kitColor) console.warn("MyokoKit: use only kit.mat.* or kit.tone(...) materials.");
    return place(new T.Mesh(geom, m), o);
  }
  const group = o => place(new T.Group(), o);

  /* ---------------------------------------------------------------- primitive helpers */
  // A block with softly bevelled edges (crafted, never razor sharp). Bottom at y = 0 before placement.
  function box(w, h, d, m, o) {
    // tiny parts (posts, planks, trim, window bands) get a plain box: their bevel is sub-pixel at every zoom and
    // a bevelled box costs five times the triangles
    const b = Math.min(w, h, d) < 1.6 ? 0 : Math.min(((o && o.bevel) !== undefined ? o.bevel : 0.08) * Math.min(w, h, d), Math.min(w, d, h) * 0.3);
    let g;
    if (b <= 0.0001) { g = new T.BoxGeometry(w, h, d); g.translate(0, h / 2, 0); }
    else {
      const bs = b * 0.6, hw = w / 2 - bs, hd = d / 2 - bs, rc = Math.min(b * 0.5, hw * 0.5, hd * 0.5);
      const s = new T.Shape();
      s.moveTo(-hw + rc, -hd); s.lineTo(hw - rc, -hd); s.quadraticCurveTo(hw, -hd, hw, -hd + rc);
      s.lineTo(hw, hd - rc); s.quadraticCurveTo(hw, hd, hw - rc, hd); s.lineTo(-hw + rc, hd);
      s.quadraticCurveTo(-hw, hd, -hw, hd - rc); s.lineTo(-hw, -hd + rc); s.quadraticCurveTo(-hw, -hd, -hw + rc, -hd);
      g = new T.ExtrudeGeometry(s, { depth: Math.max(h - 2 * b, 0.0001), bevelEnabled: true, bevelThickness: b, bevelSize: bs, bevelSegments: 1, curveSegments: 1 });
      g.rotateX(-Math.PI / 2); g.translate(0, b, 0);
    }
    return mesh(g, m, o);
  }
  function cyl(rTop, rBottom, h, m, o) {
    const g = new T.CylinderGeometry(rTop, rBottom, h, (o && o.segments) || 12, 1, false);
    g.translate(0, h / 2, 0);
    return mesh(g, m, o);
  }
  function cone(r, h, m, o) {
    const g = new T.ConeGeometry(r, h, (o && o.segments) || 10, 1, false);
    g.translate(0, h / 2, 0);
    return mesh(g, m, o);
  }
  function sphere(r, m, o) {
    const g = new T.SphereGeometry(r, (o && o.segments) || 12, Math.max(6, ((o && o.segments) || 12) * 0.6 | 0));
    return mesh(g, m, o);
  }
  function blob(r, m, o) {          // an organic lump: foliage, bushes (smooth); rocks pass { facets: true }
    const rnd = rand((o && o.seed) || 3);
    const seg = (o && o.detail) !== undefined ? 6 + o.detail * 3 : 9;
    const g = new T.SphereGeometry(r, seg + 2, seg);
    const p = g.attributes.position, v = new T.Vector3();
    const jitter = (o && o.jitter) !== undefined ? o.jitter : 0.12;
    const seen = new Map();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const key = v.x.toFixed(3) + "," + v.y.toFixed(3) + "," + v.z.toFixed(3);
      if (!seen.has(key)) seen.set(key, 1 + (rnd() - 0.5) * 2 * jitter);
      v.multiplyScalar(seen.get(key));
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    const out = (o && o.facets) ? g.toNonIndexed() : g;
    if (o && o.facets) out.computeVertexNormals();
    return mesh(out, m, o);
  }

  // A beam along X, optionally curved up at both ends (kasagi of a torii, ridge pieces, bridge rails)
  function beam(length, h, d, m, o) {
    const curve = (o && o.curve) || 0;
    const g = new T.BoxGeometry(length, h, d, 16, 1, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) / (length / 2);
      p.setY(i, p.getY(i) + curve * Math.pow(Math.abs(x), 2.4));
    }
    g.computeVertexNormals();
    return mesh(g, m, o);
  }

  /* ---------------------------------------------------------------- Japanese roof
     roof({ w, d, h, overhang, style: "gable" | "hip" | "irimoya", sori, thickness, mat, ridgeMat, gableMat })
     w along X, d along Z, eaves at y = 0, ridge at y = h. Concave profile (steeper at the ridge, flatter at the eaves)
     and corners that lift slightly (sori), like temple and farmhouse roofs. */
  function roof(o) {
    const W = o.w / 2 + (o.overhang || 0), D = o.d / 2 + (o.overhang || 0), H = o.h;
    const style = o.style || "gable", sori = o.sori !== undefined ? o.sori : 0.10 * H;
    const th = o.thickness !== undefined ? o.thickness : Math.max(0.05 * H, 0.3);
    const m = o.mat || mat.kawara;
    const ridgeHalf = style === "gable" ? W : Math.max(W - D * (style === "irimoya" ? 0.62 : 1.0), W * 0.12);
    const prof = t => H * Math.pow(1 - t, 1.55);
    const lift = (s, t) => (style === "gable" ? 0 : sori * Math.pow(Math.abs(s), 4) * t * t);
    const NU = Math.max(4, Math.min(12, Math.round(W / 1.6))), NV = H > 6 ? 6 : 4, verts = [], idx = [];   // resolution scales with roof size
    function face(fn) {
      const base = verts.length / 3;
      for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
        const s = (i / NU) * 2 - 1, t = j / NV; const q = fn(s, t); verts.push(q[0], q[1], q[2]);
      }
      for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) {
        const a = base + j * (NU + 1) + i, b = a + 1, c = a + NU + 1, e = c + 1;
        idx.push(a, c, b, b, c, e);
      }
    }
    const half = t => ridgeHalf + t * (W - ridgeHalf);
    face((s, t) => [s * half(t), prof(t) + lift(s, t), t * D]);            // front (+Z)
    face((s, t) => [-s * half(t), prof(t) + lift(s, t), -t * D]);          // back (-Z)
    if (style !== "gable") {
      face((s, t) => [half(t), prof(t) + lift(s, t), -s * t * D]);         // +X end
      face((s, t) => [-half(t), prof(t) + lift(s, t), s * t * D]);         // -X end
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(verts, 3)); g.setIndex(idx); g.computeVertexNormals();
    const grp = group(o);
    grp.add(mesh(g, m));
    // fascia: a thin band under the eave edge gives the roof its thickness
    const eave = [];
    if (style === "gable") {
      eave.push([[-W, 0, D], [W, 0, D]], [[W, 0, -D], [-W, 0, -D]]);
    } else {
      eave.push([[-W, 0, D], [W, 0, D]], [[W, 0, D], [W, 0, -D]], [[W, 0, -D], [-W, 0, -D]], [[-W, 0, -D], [-W, 0, D]]);
    }
    const fv = [], fi = [];
    eave.forEach(([a, b]) => {
      const n = 12, base = fv.length / 3;
      for (let i = 0; i <= n; i++) {
        const f = i / n, x = a[0] + (b[0] - a[0]) * f, z = a[2] + (b[2] - a[2]) * f;
        const s = style === "gable" ? 0 : (Math.abs(b[0] - a[0]) > 0 ? x / W : z / D);
        const y = lift(s, 1);
        fv.push(x, y, z, x, y - th, z);
        if (i) { const k = base + (i - 1) * 2; fi.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
      }
    });
    const fg = new T.BufferGeometry();
    fg.setAttribute("position", new T.Float32BufferAttribute(fv, 3)); fg.setIndex(fi); fg.computeVertexNormals();
    grp.add(mesh(fg, o.fasciaMat || tone("kawara", -0.25)));
    // ridge cap
    const rl = Math.max(ridgeHalf * 2, 0.6);
    grp.add(beam(rl + th * 2, th * 1.4, th * 1.6, o.ridgeMat || tone("kawara", -0.35), { y: H + th * 0.4, curve: style === "gable" ? 0 : th * 0.8 }));
    // gable plates: the vertical end of the roof, following its concave profile (gable: the whole end;
    // irimoya: the small gable at the top of the hip)
    const gm = o.gableMat || mat.gofun;
    function gablePlate(x, tEnd) {
      const n = 10, v = [x, prof(tEnd), 0], id = [];
      for (let i = 0; i <= n; i++) { const t = tEnd * i / n; v.push(x, prof(t), -t * D); }
      for (let i = 0; i <= n; i++) { const t = tEnd * i / n; v.push(x, prof(t), t * D); }
      for (let i = 0; i < n; i++) { id.push(0, 1 + i, 2 + i); id.push(0, n + 3 + i, n + 2 + i); }
      const gg = new T.BufferGeometry();
      gg.setAttribute("position", new T.Float32BufferAttribute(v, 3)); gg.setIndex(id); gg.computeVertexNormals();
      grp.add(mesh(gg, gm));
    }
    if (style === "gable") {
      const inset = o.overhang || 0, te = Math.max(0.05, (D - inset) / D);
      gablePlate(W - inset, te); gablePlate(-(W - inset), te);
    } else if (style === "irimoya") {
      gablePlate(ridgeHalf * 0.995, 0.36); gablePlate(-ridgeHalf * 0.995, 0.36);
    }
    return grp;
  }

  /* ---------------------------------------------------------------- torii (myōjin style) */
  function torii(o) {
    o = o || {};
    const h = o.h || 10, w = o.w || h * 1.1, red = o.mat || mat.shu, top = o.topMat || mat.sumi;
    const g = group(o);
    const pr = h * 0.05;
    [-1, 1].forEach(sx => g.add(cyl(pr * 0.9, pr * 1.1, h * 0.9, red, { x: sx * w * 0.36, segments: 10 })));
    g.add(beam(w * 0.86, h * 0.07, h * 0.07, red, { y: h * 0.64 }));                     // nuki
    g.add(box(h * 0.06, h * 0.14, h * 0.06, red, { y: h * 0.71, bevel: 0 }));             // gakuzuka
    g.add(beam(w * 1.02, h * 0.08, h * 0.10, red, { y: h * 0.88, curve: h * 0.05 }));     // shimaki
    g.add(beam(w * 1.16, h * 0.07, h * 0.12, top, { y: h * 0.955, curve: h * 0.09 }));    // kasagi
    return g;
  }

  /* ---------------------------------------------------------------- trees */
  const tree = {
    cedar(h, o) {      // simple conifer: trunk + two stacked cones
      const g = group(o);
      g.add(cyl(h * 0.04, h * 0.055, h * 0.28, mat.hinoki, { segments: 6 }));
      g.add(cone(h * 0.27, h * 0.56, mat.rokusho, { y: h * 0.14, segments: 9 }));
      g.add(cone(h * 0.2, h * 0.5, tone("rokusho", -0.1), { y: h * 0.5, segments: 9 }));
      return g;
    },
    broadleaf(h, o) {  // simple round tree: trunk + one smooth crown
      const g = group(o);
      g.add(cyl(h * 0.05, h * 0.07, h * 0.45, mat.hinoki, { segments: 6 }));
      g.add(sphere(h * 0.32, (o && o.seed % 2) ? mat.byakuroku : tone("rokusho", 0.25), { y: h * 0.68, segments: 10, s: [1, 0.92, 1] }));
      return g;
    },
    pine(h, o) {       // a rounded, slightly flattened crown on a thin trunk
      const g = group(o);
      g.add(cyl(h * 0.03, h * 0.05, h * 0.66, tone("hinoki", -0.3), { segments: 6 }));
      g.add(sphere(h * 0.27, tone("rokusho", 0.1), { y: h * 0.74, segments: 10, s: [1.25, 0.62, 1.1] }));
      return g;
    },
    birch(h, o) {      // slim white trunk, tall oval crown
      const g = group(o);
      g.add(cyl(h * 0.025, h * 0.035, h * 0.62, mat.gofun, { segments: 6 }));
      g.add(sphere(h * 0.2, mat.moegi, { y: h * 0.75, segments: 9, s: [0.85, 1.35, 0.85] }));
      return g;
    }
  };
  // a soft cluster of trees scattered in a circle: kit.grove({ r, count, kinds: ["cedar", "broadleaf"], h, seed, x, z })
  function grove(o) {
    const g = group({ x: o.x, z: o.z }), rnd = rand(o.seed || 5), kinds = o.kinds || ["cedar", "broadleaf"];
    for (let i = 0; i < (o.count || 8); i++) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * (o.r || 10), hh = (o.h || 10) * (0.8 + rnd() * 0.4);
      g.add(tree[kinds[i % kinds.length]](hh, { x: Math.cos(a) * r, z: Math.sin(a) * r, seed: (o.seed || 5) * 7 + i, ry: rnd() * 6 }));
    }
    return g;
  }

  /* ---------------------------------------------------------------- people (tiny, stylised) */
  // kit.person({ pose: "stand" | "walk" | "paddle" | "sit" | "ride", coat: "gunjo", h: 4, x, z, ry })
  function person(o) {
    o = o || {};
    const h = o.h || 4, g = group(o), coat = mat[o.coat || "gunjo"] || mat.gunjo, skin = mat.tonoko;
    const sit = o.pose === "sit" || o.pose === "ride";
    const bodyH = h * (sit ? 0.42 : 0.62);
    if (!sit) {
      g.add(cyl(h * 0.07, h * 0.08, h * 0.32, tone("kawara", -0.3), { x: -h * 0.06, segments: 6, rz: o.pose === "walk" ? 0.2 : 0 }));
      g.add(cyl(h * 0.07, h * 0.08, h * 0.32, tone("kawara", -0.3), { x: h * 0.06, segments: 6, rz: o.pose === "walk" ? -0.2 : 0 }));
    }
    g.add(cyl(h * 0.13, h * 0.17, bodyH, coat, { y: sit ? 0 : h * 0.3, segments: 8 }));
    g.add(sphere(h * 0.11, skin, { y: (sit ? 0 : h * 0.3) + bodyH + h * 0.1, segments: 10 }));
    if (o.hat) g.add(cone(h * 0.2, h * 0.08, mat[o.hat] || mat.kuchiba, { y: (sit ? 0 : h * 0.3) + bodyH + h * 0.17, segments: 10 }));
    if (o.pose === "paddle") g.add(cyl(h * 0.02, h * 0.02, h * 1.1, mat.hinoki, { x: h * 0.18, y: h * 0.2, rz: 0.45, segments: 5 }));
    return g;
  }

  /* ---------------------------------------------------------------- ground, water, paths, fences, cables, rocks */
  // An organic patch of ground for a model to stand on: slightly domed, edge bevelled down so it meets the terrain.
  function ground(o) {
    const r = o.r || 40, n = 48, rnd = rand(o.seed || 9), m = o.mat || mat.byakuroku;
    const ring = []; for (let i = 0; i < n; i++) ring.push(1 + (rnd() - 0.5) * 2 * (o.irregular !== undefined ? o.irregular : 0.12));
    for (let k = 0; k < 3; k++) for (let i = 0; i < n; i++) ring[i] = (ring[(i + n - 1) % n] + ring[i] * 2 + ring[(i + 1) % n]) / 4;
    const verts = [0, o.h || 1.2, 0], idx = [];
    const rings = [[0.85, (o.h || 1.2)], [1.0, 0]];
    rings.forEach(([f, y]) => { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; verts.push(Math.cos(a) * r * f * ring[i], y, Math.sin(a) * r * f * ring[i]); } });
    for (let i = 0; i < n; i++) { const a = 1 + i, b = 1 + (i + 1) % n; idx.push(0, b, a); }
    for (let i = 0; i < n; i++) { const a = 1 + i, b = 1 + (i + 1) % n, c = 1 + n + i, d = 1 + n + (i + 1) % n; idx.push(a, b, c, b, d, c); }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(verts, 3)); g.setIndex(idx); g.computeVertexNormals();
    return mesh(g, m, { x: o.x, y: o.y, z: o.z });
  }
  // Flat water from an outline [[x, z], ...] at height y. kit.water({ outline, y, mat })
  function water(o) {
    const shape = new T.Shape(o.outline.map(([x, z]) => new T.Vector2(x, -z)));
    const g = new T.ShapeGeometry(shape, 8); g.rotateX(-Math.PI / 2);
    return mesh(g, o.mat || mat.gunjo, { y: o.y || 0.2 });
  }
  // A flat ribbon along points [[x, z], ...]: paths, streams, wakes, ripple lines. kit.path({ points, width, y, mat })
  function path(o) {
    const p = o.points, w = o.width || 2, y = o.y || 0.15, v = [], id = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)];
      let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
      const ww = (typeof w === "function" ? w(i / (p.length - 1)) : w) / 2;
      v.push(p[i][0] - tz * ww, y, p[i][1] + tx * ww, p[i][0] + tz * ww, y, p[i][1] - tx * ww);
      if (i) { const k = (i - 1) * 2; id.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(v, 3)); g.setIndex(id); g.computeVertexNormals();
    return mesh(g, o.mat || mat.tonoko);
  }
  function fence(o) {
    const g = group(), p = o.points, h = o.h || 1.6, m = o.mat || mat.hinoki, gap = o.spacing || 3;
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i], b = p[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / gap)), ang = Math.atan2(-(b[1] - a[1]), b[0] - a[0]);
      for (let k = 0; k <= n; k++) { const f = k / n; g.add(box(0.3, h, 0.3, m, { x: a[0] + (b[0] - a[0]) * f, z: a[1] + (b[1] - a[1]) * f, bevel: 0 })); }
      g.add(beam(L, 0.18, 0.18, m, { x: (a[0] + b[0]) / 2, y: h * 0.8, z: (a[1] + b[1]) / 2, ry: ang }));
      g.add(beam(L, 0.18, 0.18, m, { x: (a[0] + b[0]) / 2, y: h * 0.4, z: (a[1] + b[1]) / 2, ry: ang }));
    }
    return g;
  }
  // A cable or rope between two points [x, y, z] with a gentle sag (zip lines, chairlift cable, footbridge)
  function cable(a, b, o) {
    o = o || {};
    const pts = [], n = 24, sag = o.sag !== undefined ? o.sag : 0.04;
    const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    for (let i = 0; i <= n; i++) {
      const f = i / n;
      pts.push(new T.Vector3(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f - Math.sin(Math.PI * f) * sag * L, a[2] + (b[2] - a[2]) * f));
    }
    const g = new T.TubeGeometry(new T.CatmullRomCurve3(pts), 24, o.r || 0.15, 4, false);
    return mesh(g, o.mat || mat.sumi);
  }
  function rock(r, o) { return blob(r, (o && o.mat) || tone("kawara", 0.2), Object.assign({ detail: 0, jitter: 0.2, facets: true }, o || {})); }

  /* ---------------------------------------------------------------- outline and halo (used by finish and the engine) */
  const outlineUniforms = { uPx: { value: 0.55 }, uRes: { value: new T.Vector2(1280, 720) }, uColor: { value: new T.Color(0x5B5E52) } };
  const outlineMaterial = new T.ShaderMaterial({
    uniforms: outlineUniforms,
    vertexShader: `
      attribute vec3 onormal;
      uniform float uPx; uniform vec2 uRes;
      void main() {
        #ifdef USE_INSTANCING
          vec4 clip = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
          vec3 nv = normalize(normalMatrix * mat3(instanceMatrix) * onormal);
        #else
          vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          vec3 nv = normalize(normalMatrix * onormal);
        #endif
        vec2 d = (projectionMatrix * vec4(nv, 0.0)).xy;
        float l = length(d);
        if (l > 1e-5) clip.xy += (d / l) * uPx * 2.0 / uRes * clip.w;
        gl_Position = clip;
      }`,
    fragmentShader: `uniform vec3 uColor; void main() { gl_FragColor = vec4(uColor, 1.0); }`,
    side: T.BackSide
  });
  function setViewport(w, h, dpr) { outlineUniforms.uRes.value.set(w * (dpr || 1), h * (dpr || 1)); outlineUniforms.uPx.value = 0.55 * (dpr || 1); }

  const haloTexture = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const x = c.getContext("2d"), g = x.createRadialGradient(64, 64, 6, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.45, "rgba(255,255,255,.55)"); g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    const t = new T.CanvasTexture(c); return t;
  })();
  /* A soft glow behind a model; the engine sets its colour and opacity per state (production bible, section 6).
     Draw order is terrain (renderOrder 0) -> halos (1) -> models (2), all in the opaque pass: the halo is blended on as
     light-coloured paint, is hidden by terrain in front of it, and never tints the model (the model is drawn over it). */
  function makeHalo(radius) {
    const s = new T.Sprite(new T.SpriteMaterial({ map: haloTexture, color: 0xffffff, transparent: false, blending: T.CustomBlending, blendSrc: T.SrcAlphaFactor, blendDst: T.OneMinusSrcAlphaFactor, opacity: 0.35, depthWrite: false }));
    s.scale.set(radius * 2.4, radius * 2.4, 1);
    s.renderOrder = 1;
    return s;
  }

  /* ---------------------------------------------------------------- finishing: one mesh, vertex colours, ink outline */
  const keep = m => { m.userData.kitKeep = true; return m; };
  function finish(root, id) {
    root.updateMatrixWorld(true);
    const inv = new T.Matrix4().copy(root.matrixWorld).invert();
    const pos = [], nor = [], col = [], kept = [], warnings = [];
    let tris = 0;
    root.traverse(o => {
      if (!o.isMesh) return;
      if (o.userData.kitKeep) { kept.push(o); return; }
      let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      if (!g.attributes.normal) g.computeVertexNormals();
      const m = new T.Matrix4().multiplyMatrices(inv, o.matrixWorld);
      g.applyMatrix4(m);
      let c = o.material && o.material.userData && o.material.userData.kitColor;
      if (!c) {                      // not a kit material: keep its colour but report it (the viewer lists this)
        c = (o.material && o.material.color) ? o.material.color.clone() : new T.Color(PALETTE.kawara);
        warnings.push(`"${o.name || o.geometry.type}" uses a material that is not from the kit`);
      }
      const boost = (window.MyokoKit && window.MyokoKit.satBoost) || 0;
      if (boost > 0) {                // v9: attractions a little more saturated (whites and greys stay put)
        const hsl = {}; c.getHSL(hsl);
        const k = Math.min(1, hsl.s) * (1 + boost) + 0.02 * boost;
        c = new T.Color().setHSL(hsl.h, Math.min(0.92, k), hsl.l * (1 - 0.05 * boost * (1 - Math.abs(hsl.l - 0.5) * 2)));
      }
      const p = g.attributes.position, n = g.attributes.normal;
      const flip = m.determinant() < 0;
      for (let i = 0; i < p.count; i += 3) {
        const order = flip ? [0, 2, 1] : [0, 1, 2];
        order.forEach(k => {
          pos.push(p.getX(i + k), p.getY(i + k), p.getZ(i + k));
          nor.push(n.getX(i + k), n.getY(i + k), n.getZ(i + k));
          col.push(c.r, c.g, c.b);
        });
      }
      tris += p.count / 3;
    });
    const merged = new T.BufferGeometry();
    merged.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    merged.setAttribute("normal", new T.Float32BufferAttribute(nor, 3));
    merged.setAttribute("color", new T.Float32BufferAttribute(col, 3));
    // smooth normals for the outline hull (so corners don't split the ink line)
    const acc = new Map(), on = new Float32Array(nor.length);
    for (let i = 0; i < pos.length; i += 3) {
      const k = pos[i].toFixed(3) + "," + pos[i + 1].toFixed(3) + "," + pos[i + 2].toFixed(3);
      const a = acc.get(k) || [0, 0, 0]; a[0] += nor[i]; a[1] += nor[i + 1]; a[2] += nor[i + 2]; acc.set(k, a);
    }
    for (let i = 0; i < pos.length; i += 3) {
      const a = acc.get(pos[i].toFixed(3) + "," + pos[i + 1].toFixed(3) + "," + pos[i + 2].toFixed(3));
      const l = Math.hypot(a[0], a[1], a[2]) || 1; on[i] = a[0] / l; on[i + 1] = a[1] / l; on[i + 2] = a[2] / l;
    }
    merged.setAttribute("onormal", new T.BufferAttribute(on, 3));
    merged.computeBoundingSphere();
    const out = new T.Group();
    out.name = id || "model";
    const body = new T.Mesh(merged, toonMaterial(0xffffff, { vertexColors: true }));
    body.name = "body";
    const ink = new T.Mesh(merged, outlineMaterial); ink.name = "ink";
    body.renderOrder = 2; ink.renderOrder = 2;
    out.add(ink, body);
    kept.forEach(k => {
      const w = new T.Matrix4().multiplyMatrices(inv, k.matrixWorld);
      if (k.parent) k.parent.remove(k);
      k.renderOrder = 2;
      w.decompose(k.position, k.quaternion, k.scale);
      out.add(k);
      tris += (k.geometry.index ? k.geometry.index.count : k.geometry.attributes.position.count) / 3;
    });
    // size report
    let rMax = 0, yMax = 0;
    for (let i = 0; i < pos.length; i += 3) { rMax = Math.max(rMax, Math.hypot(pos[i], pos[i + 2])); yMax = Math.max(yMax, pos[i + 1]); }
    root.traverse(o => { if (o.isLight) warnings.push("contains a light (lights come from the engine)"); if (o.isSprite || o.isLine || o.isPoints) warnings.push(`contains a ${o.type} (only meshes are allowed)`); });
    out.userData = Object.assign({}, root.userData, { kit: { triangles: Math.round(tris), radius: +rMax.toFixed(1), height: +yMax.toFixed(1), keptParts: kept.length, warnings: [...new Set(warnings)] } });
    return out;
  }

  /* ---------------------------------------------------------------- registry */
  const builders = {};
  function register(id, build) {
    if (typeof build !== "function") throw new Error(`MyokoKit.register("${id}"): the second argument must be a build function.`);
    builders[id] = build;
  }
  function build(id, opts) {
    if (!builders[id]) throw new Error(`No model registered as "${id}".`);
    api.facing = (opts && opts.facing) || 0;            // degrees the engine turns this model by (a model may keep a part facing the viewer)
    const root = builders[id](api);
    if (!root || !root.isObject3D) throw new Error(`Model "${id}" must return a THREE.Group.`);
    return finish(root, id);
  }

  /* The light rig shared by the model viewer and the engine: soft light from the upper left of the screen
     (the camera looks west, so that is south-west and high), cool blue-green shade. */
  function lights() {
    const sun = new T.DirectionalLight(0xfff4e2, 0.58);
    sun.position.set(-0.55, 0.78, -0.42);
    const sky = new T.HemisphereLight(0xf2efe8, 0x8fa6a8, 0.50);
    return [sun, sky];
  }

  const api = {
    THREE: T, PALETTE, mat, tone, rand, place, group, keep,
    box, cyl, cone, sphere, blob, beam, roof, torii, tree, grove, person, ground, water, path, fence, cable, rock
  };
  return { register, build, has: id => !!builders[id], ids: () => Object.keys(builders), api, lights, makeHalo, setViewport, outlineMaterial, toonMaterial, PALETTE };
})();
