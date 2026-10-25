/* Myoko Diorama style part: ATMOSPHERE (by Claude, v3.2).
   The painting's suyari-gasumi: long, soft cream cloud banks with irregular, brushed edges, a brighter crown and a
   warmer underside. No hard shapes: each bank is a soft lobed shape, and wherever the ground rises into a bank the
   cloud thins away smoothly, so mountains rise out of the mist instead of cutting through it.
   - Mt Myoko and Mt Kurohime stand above the clouds: a collar of cloud lies round each at a bit over half its height,
     and the upper slopes and summit rise clear of it;
   - banks along the far ranges and in two valleys;
   - soft corner and side banks lying over the edge of the map, so the box dissolves into cloud (the north-west corner
     is kept open for the sea).
   Clouds thin out as you zoom in, and drift very slowly (not when the visitor prefers reduced motion). */
MyokoStyle.part("atmosphere", function (ctx) {
  const T = ctx.THREE, L = ctx.layout, E = ctx.exaggeration;
  const SN = ctx.span.northSouth, SE = ctx.span.eastWest;
  const rnd = ctx.kit.rand(1923);
  const keepClear = (L.attractions || []).map(a => [a.x, a.z]);
  const clearOf = (x, z, r) => keepClear.every(([a, b]) => (x - a) * (x - a) + (z - b) * (z - b) > r * r);
  const peak = id => (L.peaks || []).find(p => p.id === id);
  const banks = [];
  const add = b => banks.push(Object.assign({ rot: 0, edge: 0, alpha: 0.82, zoomOut: 1, ang: undefined }, b));

  // a) along the far (west) ranges
  [[-0.26, 15000], [0.06, 13000]].forEach(([fx, len]) => add({ x: fx * SN, z: -SE * 0.36, len, wid: 3800, y: 0 }));
  // b) collars round the two hero peaks: the summit rises clear above them
  [["peak-mt-myoko", 0.56], ["peak-mt-kurohime", 0.58]].forEach(([id, f]) => {
    const p = peak(id); if (!p) return;
    const top = p.y * E;
    add({ x: p.x - 2600, z: p.z + 1300, len: 12000, wid: 3400, y: top * f, fixedY: true, alpha: 0.86 });       // in front, a little left
    add({ x: p.x + 2400, z: p.z - 1800, len: 10000, wid: 3000, y: top * (f + 0.05), fixedY: true, alpha: 0.78 }); // behind, to the right
  });
  [[0.28, -0.20, 8000], [-0.30, -0.28, 8500], [0.20, -0.04, 7000], [-0.05, -0.30, 7500]].forEach(([fx, fz, len]) => add({ x: fx * SN, z: fz * SE, len, wid: 3500, y: 0, alpha: 0.6 }));
  // c) in the low valleys: points well below their surroundings, away from attractions and the lake
  const cands = [];
  for (let x = -SN * 0.38; x < SN * 0.38; x += 1500) for (let z = -SE * 0.3; z < SE * 0.38; z += 1500) {
    const h = ctx.heightAt(x, z); let ring = 0;
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; ring += ctx.heightAt(x + Math.cos(a) * 3000, z + Math.sin(a) * 3000); }
    const depth = ring / 8 - h;
    if (depth > 260 && clearOf(x, z, 3400)) cands.push({ x, z, h, depth });
  }
  cands.sort((a, b) => b.depth - a.depth);
  let valleys = 0;
  for (const c of cands) {
    if (valleys >= 4) break;
    if (banks.some(b => Math.hypot(b.x - c.x, b.z - c.z) < 8000)) continue;
    add({ x: c.x, z: c.z, len: 5000 + rnd() * 1500, wid: 3000, y: (c.h + 220) * E, fixedY: true, alpha: 0.66 }); valleys++;
  }
  // d) v3.5: big soft banks laid diagonally across each corner (and lighter ones down the sides), so the board reads
  //    as an oval vignette of cloud rather than a rectangle. The north-west corner (top right, the sea) stays lighter.
  const corner = (sx, sz, len, wid, alpha, inset) => {
    const cx = sx * SN / 2, cz = sz * SE / 2, d = Math.hypot(cx, cz);
    const ux = -cx / d, uz = -cz / d;                                  // toward the middle
    const tx = -uz, tz = ux;                                           // along the corner (perpendicular to the diagonal)
    add({ x: cx + ux * inset, z: cz + uz * inset, len, wid, y: 0, edge: 1, ang: Math.atan2(-tz, tx), alpha });
  };
  // corner(-1, -1, 22000, 9500, 0.95, 2600);     // back left
  // corner(1, -1, 15000, 6000, 0.70, 1200);      // back right: lighter, the sea shows through
  // corner(-1, 1, 22000, 9500, 0.95, 2600);      // front left
  // corner(1, 1, 22000, 9500, 0.95, 2600);       // front right
  // add({ x: -SN / 2 - 600, z: 0, len: 13000, wid: 5200, y: 0, edge: 1, rot: 1, alpha: 0.75 });   // left side
  // add({ x: SN / 2 + 600, z: SE * 0.12, len: 11000, wid: 5000, y: 0, edge: 1, rot: 1, alpha: 0.72 });  // right side
  // add({ x: 0, z: -SE / 2 - 400, len: 20000, wid: 4800, y: 0, edge: 1, alpha: 0.7 });           // the far edge
  // add({ x: 0, z: SE / 2 + 700, len: 20000, wid: 4600, y: 0, edge: 1, alpha: 0.75 });           // the near edge

  // banks without a fixed height float a little above the highest ground under their middle
  banks.forEach(b => {
    if (b.fixedY) return;
    let top = 0;
    for (let i = -4; i <= 4; i++) for (let j = -1; j <= 1; j++) {
      const ax = b.rot ? b.x + j * b.wid / 4 : b.x + i * b.len / 10, az = b.rot ? b.z + i * b.len / 10 : b.z + j * b.wid / 4;
      top = Math.max(top, ctx.heightAt(Math.max(-SN / 2, Math.min(SN / 2, ax)), Math.max(-SE / 2, Math.min(SE / 2, az))));
    }
    b.y = Math.max(b.y, (top * 0.7 + 200) * E);
  });

  // clouds never lie over an activity: each bank opens up softly round every model
  const holes = (L.attractions || []).slice(0, 24).map(a => new T.Vector3(a.x, a.z, 0.62 * a.size));
  while (holes.length < 24) holes.push(new T.Vector3(0, 0, 0));
  const group = new T.Group(); group.name = "mist";
  banks.forEach((b, i) => {
    const m = new T.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: !b.edge,   // edge banks are never cut by the edge of the land
      uniforms: Object.assign({}, ctx.shared, {
        uSize: { value: new T.Vector2(b.len, b.wid) }, uSeed: { value: i * 3.7 + 1.0 }, uEdgeBank: { value: b.edge }, uAlpha: { value: b.alpha },
        uY: { value: b.y }, uHeight: { value: ctx.tex.height }, uRot: { value: b.rot }, uHoles: { value: holes }
      }),
      vertexShader: `varying vec2 vUv; varying vec3 vWorld;
        void main() { vUv = uv; vWorld = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vWorld, 1.0); }`,
      fragmentShader: `
        ${ctx.glsl.uniforms}
        ${ctx.glsl.palette}
        ${ctx.glsl.worldUV}
        ${ctx.glsl.paint}
        uniform vec2 uSize; uniform float uSeed; uniform float uEdgeBank; uniform float uAlpha; uniform float uY; uniform float uRot;
        uniform sampler2D uHeight; uniform vec3 uHoles[24];
        varying vec2 vUv; varying vec3 vWorld;
        // cloud noise: smooth value noise with each octave rotated, so no square grid shows through
        float cNoise(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
          return mix(mix(pHash(i), pHash(i + vec2(1.0, 0.0)), u.x), mix(pHash(i + vec2(0.0, 1.0)), pHash(i + vec2(1.0, 1.0)), u.x), u.y); }
        float cFbm(vec2 p) { mat2 r = mat2(0.80, 0.60, -0.60, 0.80); float s = 0.0, a = 0.5;
          for (int k = 0; k < 5; k++) { s += a * cNoise(p); p = r * p * 2.03 + 11.7; a *= 0.5; } return s / 0.97; }
        void main() {
          vec2 q = (vUv - 0.5) * 2.0;                                     // -1..1 across the quad; x along the bank
          float drift = uReduceMotion > 0.5 ? 0.0 : uTime * 0.004;
          vec2 w = vWorld.xz / 2600.0 + vec2(uSeed, uSeed * 0.7) + vec2(drift, 0.0);
          float n1 = cFbm(w), n2 = cFbm(w * 2.1 + 5.1);
          // a long soft lobe: the edge wavers (brushed, irregular), thicker in the middle, tapering at the ends;
          // everything is round (elliptical), and fades to nothing well inside the quad, so no straight edge can show
          float r = length(q);
          float thick = 0.55 + 0.45 * (1.0 - q.x * q.x);
          float e = q.x * q.x + pow(abs(q.y) / thick, 2.0);
          e += (n1 - 0.5) * 0.70 + (n2 - 0.5) * 0.30;
          float a = 1.0 - smoothstep(0.20, 0.95, e);
          a *= 1.0 - smoothstep(0.62, 0.98, r);
          a *= 0.78 + 0.22 * smoothstep(0.3, 0.7, n2);                    // a few thinner veils inside
          // where the ground rises into the bank the cloud thins away smoothly: mountains rise out of it
          float ground = texture2D(uHeight, worldUV(vWorld)).r * uExag;
          a *= uEdgeBank > 0.5 ? 1.0 : smoothstep(0.0, 520.0, uY - ground);
          for (int i = 0; i < 24; i++) { if (uHoles[i].z > 0.0) a *= smoothstep(uHoles[i].z, uHoles[i].z * 1.9, length(vWorld.xz - uHoles[i].xy)); }
          // colour: a brighter crown on the far side, a warmer underside on the near side
          float side = uRot > 0.5 ? q.x : -q.y;
          vec3 col = mix(KASUMI, GOFUN, 0.25 + 0.45 * smoothstep(-0.2, 0.9, side) * (1.0 - smoothstep(0.2, 0.9, e)));
          col = mix(col, mix(KASUMI, PAPER, 0.5), 0.25 * smoothstep(0.3, -0.8, side));
          float zoomFade = 1.0 - 0.92 * smoothstep(2.0, 3.4, uZoom);
          float fade = uEdgeBank > 0.5 ? 1.0 : pEdge(vWorld);
          gl_FragColor = vec4(col, a * uAlpha * zoomFade * fade);
        }`
    });
    const mesh = new T.Mesh(new T.PlaneGeometry(b.len, b.wid, 1, 1), m);
    mesh.rotation.x = -Math.PI / 2;
    if (b.ang !== undefined) mesh.rotation.z = b.ang; else if (b.rot) mesh.rotation.z = Math.PI / 2;
    mesh.position.set(b.x, b.y, b.z);
    mesh.renderOrder = 3;
    group.add(mesh);
  });
  return { object: group, update() {} };
});
