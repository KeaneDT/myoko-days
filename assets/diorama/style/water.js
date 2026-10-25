/* Myoko Diorama style part: WATER (by Claude, v2).
   Lake Nojiri and the ponds: deep teal-indigo, darker in the middle, paler toward the shore, with a few curved white
   wave strokes and a thin pale shoreline, as in the master painting. Rivers: pale grey-blue ribbons with a soft edge.
   Sea: pale, fading into paper. All lines keep a constant width on screen and appear only when large enough to read. */
MyokoStyle.part("water", function (ctx) {
  const T = ctx.THREE;
  const head = `${ctx.glsl.uniforms}\n${ctx.glsl.palette}\n${ctx.glsl.worldUV}\n${ctx.glsl.paint}\n`;
  const vs = `
    varying vec3 vWorld; varying vec2 vUv;
    void main() { vUv = uv; vWorld = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vWorld, 1.0); }`;
  const mat = (fs, extra, opts) => new T.ShaderMaterial(Object.assign({
    uniforms: Object.assign({}, ctx.shared, extra || {}), vertexShader: vs, fragmentShader: head + fs
  }, opts || {}));

  const lake = mat(`
    uniform sampler2D uShape; varying vec3 vWorld; varying vec2 vUv;
    // short curved wave strokes, one per cell at most, lying across the view (along world x)
    float waves(vec2 p, float cell, float px, float seed) {
      vec2 c = floor(p / cell); float best = 0.0;
      for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) {
        vec2 id = c + vec2(float(i), float(j)); vec2 h = pHash2(id + seed);
        if (h.x < 0.50) continue;
        vec2 ctr = (id + 0.2 + 0.6 * pHash2(id * 2.3 + seed)) * cell;
        vec2 q = p - ctr;
        float L = cell * (0.22 + 0.16 * h.y);
        float t = clamp(q.x / L, -1.0, 1.0);
        float mvv = uReduceMotion > 0.5 ? 0.0 : 1.0;
        float bow = (t * t - 0.35) * L * 0.16 + mvv * sin(uTime * (1.5 + 0.8 * h.y) + h.x * 30.0) * L * 0.075;   // v17.4: the arc sways visibly, like a swell passing under it
        float w = px * (0.9 + 1.3 * (1.0 - t * t));
        float a = 1.0 - smoothstep(w * 0.5, w * 0.5 + px, abs(q.y - bow));
        a *= 1.0 - smoothstep(L * 0.8, L, abs(q.x));
        float breathe = uReduceMotion > 0.5 ? 1.0 : 0.15 + 0.85 * (0.5 + 0.5 * sin(uTime * (1.7 + 0.9 * h.y) + h.x * 40.0));   // each stroke fades in and out on its own slow beat
        best = max(best, a * breathe);
      }
      return best;
    }
    void main() {
      float d = texture2D(uShape, worldUV(vWorld)).b;                 // 0 at the shore, 1 at 1,200 m in
      vec3 shallow = mix(GUNJO, BYAKUGUN, 0.42);
      vec3 col = mix(shallow, GUNJO, smoothstep(0.0, 0.28, d));
      col = mix(col, mix(GUNJO, SUMI, 0.24), smoothstep(0.30, 1.0, d));
      col *= 0.97 + 0.06 * pFbm(vWorld.xz / 900.0);                   // a very soft mottle, like a wash drying unevenly
      float px = pPixel(vWorld);
      // v3.2: the water moves very slowly: the wave strokes drift with a light breeze and the colour breathes
      float mv = 1.0 - uReduceMotion;
      vec2 wp = vWorld.xz + vec2(uTime * 26.0, uTime * 11.0) * mv;   // v17.4: the strokes travel across the lake at a visible walking pace
      float k = waves(wp, 420.0, px, 3.0) * smoothstep(7.0, 14.0, 420.0 / px);
      k = max(k, waves(wp * 1.0 + vec2(-uTime * 40.0, uTime * 14.0) * mv, 210.0, px, 9.0) * smoothstep(12.0, 22.0, 210.0 / px) * 0.7);
      col *= 1.0 + 0.05 * mv * sin(uTime * 0.9 + pFbm(vWorld.xz / 1300.0) * 9.0);
      // v17.4: long ripple crests roll across the lake: pale lines that travel with the breeze, broken up by a slow noise so they never read as a pattern
      float crest = sin((vWorld.x * 0.55 + vWorld.z * 0.83) / 85.0 - uTime * 1.9 * mv + 3.0 * pFbm(vWorld.xz / 700.0));
      float crest2 = sin((vWorld.x * 0.2 - vWorld.z * 0.98) / 120.0 - uTime * 1.3 * mv + 5.0 * pFbm(vWorld.xz / 900.0 + 7.0));
      float rip = smoothstep(0.82, 0.96, max(crest, crest2)) * smoothstep(0.30, 0.50, pFbm(vWorld.xz / 1100.0 + vec2(uTime * 0.015 * mv, 0.0))) * smoothstep(8.0, 20.0, 85.0 / px);
      k *= smoothstep(0.03, 0.12, d);                                  // not right on the shoreline
      col = mix(col, GOFUN, max(k * 0.85, rip * 0.62 * smoothstep(0.05, 0.2, d)));
      gl_FragColor = vec4(pFinish(col, vWorld), 1.0);
    }`, { uShape: { value: ctx.tex.shape } });

  // the shoreline: a thin pale line on the waterline and a faint lighter band just inside it
  const shore = mat(`
    uniform sampler2D uTone; uniform float uHasTone;
    varying vec3 vWorld; varying vec2 vUv;
    void main() {
      // v3.1: where a river runs into the lake or the sea, the shoreline opens so the two waters join
      if (uHasTone > 0.5 && (texture2D(uTone, worldUV(vWorld)).b * 255.0 - 128.0) * 1.6 < 6.0) discard;
      float fw = max(fwidth(vUv.y), 1e-5);
      float pxFromLine = abs(vUv.y - 0.5) / fw;
      float line = 1.0 - smoothstep(0.55, 1.45, pxFromLine);
      float band = (1.0 - smoothstep(0.0, 6.0, (0.5 - vUv.y) / fw)) * step(vUv.y, 0.5) * 0.35;
      float mvs = 1.0 - uReduceMotion;
      line *= 0.8 + 0.2 * mvs * sin(vUv.x / 170.0 - uTime * 2.2) * sin(vUv.x / 610.0 + uTime * 0.7);   // a faint glimmer running along the waterline
      float a = max(line * 0.92, band);
      if (a < 0.01) discard;
      vec3 col = mix(mix(GUNJO, BYAKUGUN, 0.6), GOFUN, line);
      gl_FragColor = vec4(pFinish(col, vWorld), a * pEdge(vWorld));
    }`, { uTone: { value: ctx.tex.tone || null }, uHasTone: { value: ctx.tex.tone ? 1 : 0 } }, { transparent: true, depthWrite: false });

  // rivers pass under the land models' bases instead of painting across them
  const pads = (ctx.layout.attractions || []).filter(a => !a.onWater).slice(0, 24).map(a => new T.Vector4(a.x, a.z, 0.46 * a.size, 0));
  while (pads.length < 24) pads.push(new T.Vector4(0, 0, 0, 0));
  // v3: rivers painted like Lake Nojiri: teal-indigo water, paler at the banks, a thin washi-white bank line on each
  // side, and the odd white ripple stroke along the flow once the river is wide enough on screen
  const river = mat(`
    uniform vec4 uPads[24];
    varying vec3 vWorld; varying vec2 vUv;
    void main() {
      for (int i = 0; i < 24; i++) { if (uPads[i].z > 0.0 && length(vWorld.xz - uPads[i].xy) < uPads[i].z) discard; }
      float fw = max(fwidth(vUv.y), 1e-5);
      float widthPx = 1.0 / fw;
      float edgePx = min(vUv.y, 1.0 - vUv.y) / fw;
      float across = 1.0 - abs(vUv.y - 0.5) * 2.0;                       // 0 at the banks, 1 mid-stream
      vec3 shallow = mix(GUNJO, BYAKUGUN, 0.42);
      vec3 col = mix(shallow, mix(GUNJO, BYAKUGUN, 0.10), smoothstep(0.0, 0.7, across) * smoothstep(2.0, 6.0, widthPx));
      col *= 0.97 + 0.06 * pFbm(vWorld.xz / 700.0);
      // ripple strokes along the flow (uv.x = metres along the river)
      float cell = 260.0; float id = floor(vUv.x / cell); float h = pHash(vec2(id, 3.7));
      float f = fract(vUv.x / cell);
      float stroke = (1.0 - smoothstep(0.0, 0.18, abs(f - 0.5))) * step(0.55, h) * (1.0 - smoothstep(0.06, 0.16, abs(vUv.y - 0.35 - 0.3 * pHash(vec2(id, 9.1)))));
      col = mix(col, GOFUN, stroke * smoothstep(9.0, 16.0, widthPx) * 0.7);
      // the bank line, as the lake's shoreline: washi white, about one pixel
      float bank = (1.0 - smoothstep(0.5, 1.4, edgePx)) * smoothstep(3.0, 7.0, widthPx);
      col = mix(col, GOFUN, bank * 0.85);
      float soft = smoothstep(0.0, 0.9, edgePx);
      gl_FragColor = vec4(pFinish(col, vWorld), max(soft, bank) * pEdge(vWorld));
    }`, { uPads: { value: pads } }, { transparent: true, depthWrite: false });

  const sea = mat(`
    varying vec3 vWorld; varying vec2 vUv;
    void main() {
      vec3 col = mix(BYAKUGUN, GOFUN, 0.10);
      float north = smoothstep(uSpan.y * 0.5 - 5000.0, uSpan.y * 0.5 - 600.0, vWorld.x);
      col = mix(col, PAPER, north * 0.7);
      gl_FragColor = vec4(pFinish(col, vWorld), 1.0);
    }`);

  // v9: the sea has its own paint: pale shallows, soft blue, a surf line and swell lines that follow the coast
  const coastPts = (ctx.layout.seaCoast || []).slice(0, 40).map(p => new T.Vector2(p[0], p[1]));
  const NC = coastPts.length;
  while (coastPts.length < 40) coastPts.push(coastPts[NC - 1] ? coastPts[NC - 1].clone() : new T.Vector2(0, 0));
  const seaWater = NC > 1 ? mat(`
    uniform vec2 uCoast[40]; uniform float uNC; uniform float uEndZ;
    varying vec3 vWorld; varying vec2 vUv;
    float coastDist(vec2 p) {
      float best = 1.0e9;
      for (int i = 0; i < 39; i++) {
        if (float(i + 1) >= uNC) break;
        if (float(i + 2) >= uNC) continue;   // Only the last segment closes along the board edge; the first is real coast.
        vec2 a = uCoast[i], b = uCoast[i + 1], ab = b - a;
        float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 1.0), 0.0, 1.0);
        best = min(best, length(p - (a + ab * t)));
      }
      return best;
    }
    // v18: finite, smoothly faded strokes. No changing floor(phase) IDs or fract seams.
    float seaRipples(vec2 p, float px, float time) {
      float cell = 480.0;
      vec2 grid = floor(p / cell);
      float result = 0.0;
      for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) {
        vec2 id = grid + vec2(float(i), float(j));
        vec2 h = pHash2(id + 37.0);
        if (h.x < 0.48) continue;
        vec2 q = p - (id + 0.25 + 0.5 * pHash2(id + 81.0)) * cell;
        float halfLength = 55.0 + 65.0 * h.y;
        float t = q.x / halfLength;
        float bow = (t * t - 0.35) * 12.0 + sin(time * 0.65 + h.x * 30.0) * 9.0;
        float width = max(4.0, px * 0.65);
        float stroke = 1.0 - smoothstep(width, width + px, abs(q.y - bow));
        stroke *= 1.0 - smoothstep(0.55, 1.0, abs(t));
        stroke *= 0.4 + 0.6 * (0.5 + 0.5 * sin(time * 0.55 + h.y * 40.0));
        result = max(result, stroke);
      }
      return result;
    }
    void main() {
      float mv = 1.0 - uReduceMotion;
      float px = pPixel(vWorld);
      float d = coastDist(vWorld.xz);
      vec3 shallow = mix(vec3(0.74, 0.86, 0.83), BYAKUGUN, 0.35);
      vec3 mid = mix(GUNJO, BYAKUGUN, 0.42);
      vec3 deep = mix(GUNJO, SUMI, 0.08);
      vec3 col = mix(shallow, mid, smoothstep(30.0, 800.0, d));
      col = mix(col, deep, smoothstep(700.0, 2600.0, d) * 0.8);
      col *= 0.97 + 0.06 * pFbm(vWorld.xz / 900.0);
      // Fade fine detail out before it becomes subpixel, keeping the overview calm.
      vec2 rippleP = vec2(vWorld.z, -vWorld.x) + vec2(uTime * 8.0, uTime * 5.0) * mv;
      float ripple = seaRipples(rippleP, px, uTime * mv);
      ripple *= smoothstep(250.0, 650.0, d) * smoothstep(6.0, 13.0, 120.0 / px);
      col = mix(col, GOFUN, ripple * 0.34);
      // the surf: a pale band that breathes along the coast and a thin white line at its edge
      float fw = 82.0 + 34.0 * sin(vWorld.z / 310.0 + uTime * 0.9 * mv) + 20.0 * sin(vWorld.z / 97.0 - uTime * 1.5 * mv) + 36.0 * sin(uTime * 0.8 * mv + vWorld.z / 900.0);   // v17.4: the surf washes up and back
      fw = max(fw, 24.0); // Keep smoothstep edges ordered throughout the animation.
      float foam = 1.0 - smoothstep(fw * 0.35, fw, d);
      float fline = 1.0 - smoothstep(max(px * 0.9, 6.0) * 0.5, max(px * 0.9, 6.0) * 1.6, abs(d - fw));
      col = mix(col, GOFUN, foam * 0.55);
      col = mix(col, GOFUN, fline * (0.55 + 0.4 * (0.5 + 0.5 * sin(vWorld.z / 140.0 - uTime * 2.4 * mv))));
      float seaA = max(smoothstep(0.0, 150.0, d + 45.0 * (pFbm(vWorld.xz / 420.0) - 0.5)), max(foam * 0.6, fline * 0.9)) * smoothstep(0.0, 1700.0, uEndZ - vWorld.z + 200.0);   // v12: the water thins out to the beach instead of ending on a ruled line
      gl_FragColor = vec4(pFinish(col, vWorld), clamp(seaA, 0.0, 1.0));
    }`, { uCoast: { value: coastPts }, uNC: { value: NC }, uEndZ: { value: NC > 1 ? coastPts[NC - 1].y : 0 } }, { transparent: true, depthWrite: false }) : lake;
  // v3.1: the sea is painted exactly like Lake Nojiri (its depth comes from the same distance-from-shore channel)
  // v3.2 details: two small rowing boats on Lake Nojiri, three fishing boats on the sea, a skein of birds over the
  // lake. Tiny, in the models' palette, bobbing or gliding very slowly.
  const kit = ctx.kit, details = new T.Group(); details.name = "water-details";
  const boats = [];
  const noj = (ctx.layout.lakes || []).find(l => l.id === "nojiri");
  const inPoly = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { if ((P[i][1] > z) !== (P[j][1] > z) && x < (P[j][0] - P[i][0]) * (z - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; } return c; };
  const clearOfModels = (x, z, r) => (ctx.layout.attractions || []).every(a => Math.hypot(a.x - x, a.z - z) > 0.62 * a.size + r);
  function boat(x, z, y, s, ry, sail) {
    const g = kit.group({ x, y, z, ry, s });
    g.add(kit.box(14, 1.6, 4.2, kit.tone("hinoki", -0.25), { bevel: 0.25 }));
    g.add(kit.box(11, 0.4, 3.0, kit.tone("hinoki", 0.1), { y: 1.5, bevel: 0 }));
    if (sail) { g.add(kit.cyl(0.25, 0.25, 12, kit.tone("hinoki", -0.4), { y: 1.5, segments: 5 })); g.add(kit.box(0.3, 8, 6, kit.mat.gofun, { x: 0.2, y: 4.5, z: 0.4, bevel: 0 })); }
    else g.add(kit.person({ pose: "sit", h: 4.5, coat: "kawara", hat: "kuchiba", x: -2 }));
    details.add(g); boats.push({ g, y, ph: x * 0.013 + z * 0.007 });
  }
  if (noj) {
    const rnd = kit.rand(55); let n = 0;
    for (let k = 0; k < 400 && n < 2; k++) {
      const p = noj.outline[Math.floor(rnd() * noj.outline.length)], c = [noj.outline.reduce((s, q) => s + q[0], 0) / noj.outline.length, noj.outline.reduce((s, q) => s + q[1], 0) / noj.outline.length];
      const x = p[0] + (c[0] - p[0]) * (0.18 + rnd() * 0.2), z = p[1] + (c[1] - p[1]) * (0.18 + rnd() * 0.2);
      if (inPoly(noj.outline, x, z) && clearOfModels(x, z, 400)) { boat(x, z, noj.level * ctx.exaggeration + 3, 9, rnd() * 6.28, false); n++; }
    }
  }
  if (ctx.layout.seaCoast) {
    const C = ctx.layout.seaCoast;
    // v17.15: each fishing boat floats a set fraction of the way from the shore to the board's edge, so none can drift out past the edge
    const edgeX = ctx.layout.spanMetres.northSouth / 2;
    [[0.25, 0.4], [0.5, 0.45], [0.72, 0.4]].forEach(([f, fr], i) => {
      const p = C[Math.floor(f * (C.length - 1))];
      boat(p[0] + (edgeX - p[0]) * fr, p[1] - 200 * i, 4, 12, 1.2 + i, true);
    });
  }
  function update(t) {
    if (ctx.shared.uReduceMotion.value > 0.5) return;
    boats.forEach(b => { b.g.position.y = b.y + Math.sin(t * 0.8 + b.ph) * 1.6; b.g.rotation.z = Math.sin(t * 0.6 + b.ph) * 0.04; });
  }
  details.traverse(o => { o.renderOrder = 2; });
  return { lake, shore, river, sea: seaWater, object: details, update };
});
