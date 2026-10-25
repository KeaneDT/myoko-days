/* Myoko Diorama style part: FOREST (by Claude, v2).
   Small stylised 3D trees on the wooded hills (the painting's tree dabs, made slightly 3D): tall cedar cones and
   rounded broadleaf crowns in quiet olive greens, softly lit, no outlines. They are placed around the places people
   zoom into (attractions, villages, the lake) and grow in only as you zoom past about 2x, so the full view stays a
   clean painted wash and never turns into dotty noise. Two draw calls. */
MyokoStyle.part("forest", function (ctx) {
  const T = ctx.THREE, L = ctx.layout, E = ctx.exaggeration;
  const SN = ctx.span.northSouth, SE = ctx.span.eastWest;
  const rnd = ctx.kit.rand(777);
  const MAX = ctx.quality === "lo" ? 5000 : 12000;
  const focus = [];
  (L.attractions || []).forEach(a => focus.push([a.x, a.z, 4200]));
  (L.villages || []).forEach(v => focus.push([v.x, v.z, 2600]));
  (L.lakes || []).slice(0, 1).forEach(l => { const n = l.outline.length; l.outline.forEach((p, i) => { if (i % 12 === 0) focus.push([p[0], p[1], 2800]); }); });
  const models = (L.attractions || []).map(a => [a.x, a.z, 0.70 * a.size]);
  const near = () => true;
  const madP = (L.peaks || []).find(p => /Madarao/.test(p.name));
  const nearMad = (x, z) => !!madP && Math.hypot(x - madP.x, z - madP.z) < 5400;
  const clear = (x, z) => models.every(([mx, mz, r]) => (x - mx) * (x - mx) + (z - mz) * (z - mz) > r * r);

  // groves, not scattered trees: dense rounded clumps (tallest in the middle, like the ink-outlined cedar clumps of the
  // reference), set on the wooded ground near the places people zoom into, at least 650 m apart
  const okGround = (x, z, minForest) => {
    if (ctx.tex.tone) { const tt = ctx.sample("tone", x, z); if (tt[0] < 0.12 || tt[2] < 0.80) return false; }
    if (ctx.heightAt(x, z) > (nearMad(x, z) ? 2700 : 1750)) return false;     // v3.1: woods on the hills, not on the gold plains
    const c = ctx.sample("cover", x, z);
    if (c[0] < minForest || c[2] > 0.12) return false;
    for (const [ox, oz] of [[0, 0], [90, 0], [-90, 0], [0, 90], [0, -90]]) { const w = ctx.sample("water", x + ox, z + oz); if (w[0] >= 0.02 || w[1] >= 0.02 || w[2] >= 0.02) return false; }   // v12: nothing grows at the water's edge
    return true;
  };
  const groves = [];
  const GSTEP = 320;
  for (let x = -SN / 2 + 2000; x < SN / 2 - 2000; x += GSTEP) for (let z = -SE / 2 + 2000; z < SE / 2 - 2000; z += GSTEP) {
    const gx = x + (rnd() - 0.5) * GSTEP, gz = z + (rnd() - 0.5) * GSTEP;
    if (!near(gx, gz) || !okGround(gx, gz, 0.6) || !clear(gx, gz)) continue;
    if (groves.some(([a, b]) => (a - gx) * (a - gx) + (b - gz) * (b - gz) < 1350 * 1350)) continue;
    groves.push([gx, gz, 420 + rnd() * 360, rnd() * 6.28]);
  }
  const spots = [];
  const TSTEP = 200;
  groves.forEach(([gx, gz, R, ph]) => {
    for (let x = gx - R; x <= gx + R; x += TSTEP) for (let z = gz - R; z <= gz + R; z += TSTEP) {
      const jx = x + (rnd() - 0.5) * TSTEP * 0.8, jz = z + (rnd() - 0.5) * TSTEP * 0.8;
      const ang = Math.atan2(jz - gz, jx - gx);
      const edge = R * (0.86 + 0.18 * Math.sin(3 * ang + ph) + 0.08 * Math.sin(5 * ang - ph));   // irregular outline
      const r = Math.hypot(jx - gx, jz - gz) / edge;
      if (r > 1 || (r > 0.8 && rnd() < (r - 0.8) * 3)) continue;
      if (!okGround(jx, jz, 0.35) || !clear(jx, jz)) continue;
      { const tb = Math.min(1, Math.max(0, (jz + 0.02 * SE) / (-0.38 * SE))), ss = tb * tb * (3 - 2 * tb); if (rnd() < 0.06 + 0.8 * ss) continue; }
      if (rnd() < 0.72) continue;                                     // v17.2: 20% fewer trees (was 0.65)
      if (!nearMad(jx, jz) && ctx.heightAt(jx, jz) > 1350 && rnd() < (ctx.heightAt(jx, jz) - 1350) / 400) continue;
      if (nearMad(jx, jz) && ctx.heightAt(jx, jz) > 2200 && rnd() < (ctx.heightAt(jx, jz) - 2200) / 400) continue;
      spots.push([jx, jz, 1.12 - 0.32 * r * r]);                      // taller toward the middle: a rounded dome
    }
  });
  while (spots.length > MAX) spots.splice(Math.floor(rnd() * spots.length), 1);

  // the two tree shapes (unit size; scaled per instance)
  const cedarG = new T.ConeGeometry(0.5, 1, 8, 1, true); cedarG.translate(0, 0.5, 0);
  const leafG = new T.SphereGeometry(0.5, 9, 6); leafG.scale(1, 0.9, 1); leafG.translate(0, 0.45, 0);
  const pal = ctx.PALETTE, C = h => new T.Color(h);
  const greens = [C(pal.rokusho), C(pal.rokusho).lerp(C(pal.byakuroku), 0.35), C(pal.rokusho).lerp(C(pal.sumi), 0.12), C(pal.byakuroku).lerp(C(pal.rokusho), 0.6)];
  const vs = `
    attribute vec3 aColor; uniform float uZoom;
    varying vec3 vWorld; varying vec3 vNormal; varying vec3 vColor; varying float vH;
    void main() {
      // groves are flat canopy patches (painted clumps) at full view and rise into 3D trees as you zoom in;
      // crowns never shrink, so they never break up into dots
      float rise = 1.0;
      float spread = 1.0;       // zoomed out, crowns overlap into one patch
      vec3 p = vec3(position.x * spread, position.y * rise, position.z * spread);
      vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.0);
                  // zoomed right out the groves sink away: a clean wash
      vWorld = wp.xyz; vH = position.y;
      vNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
      vColor = aColor;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`;
  const fs = `
    ${ctx.glsl.uniforms}
    ${ctx.glsl.palette}
    ${ctx.glsl.paint}
    varying vec3 vWorld; varying vec3 vNormal; varying vec3 vColor; varying float vH;
    void main() {
      float l = clamp(dot(normalize(vNormal), normalize(uSun)) * 0.5 + 0.5, 0.0, 1.0);
      float soft = 0.5 * smoothstep(0.30, 0.55, l) + 0.5 * l;         // two soft painted tones
                  // no per-crown flicker when zoomed out
      vec3 col = vColor * (0.86 + 0.22 * soft);
      float fade = max(pFar(vWorld) * 0.9, smoothstep(-0.02 * uSpan.x, -0.40 * uSpan.x, vWorld.z) * 0.9);
      col = mix(col, vec3(0.60, 0.68, 0.74), fade * 0.78);
      col = mix(col * 0.86, col, smoothstep(0.0, 0.6, vH));            // a little darker at the foot
      col = mix(col, PAPER, 0.05 * soft);
      gl_FragColor = vec4(pFinish(col, vWorld), 1.0);
    }`;
  const mat = new T.ShaderMaterial({ uniforms: Object.assign({}, ctx.shared), vertexShader: vs, fragmentShader: fs, side: T.DoubleSide });
  const group = new T.Group(); group.name = "forest";
  const kinds = [[], []];
  spots.forEach(s => kinds[(ctx.heightAt(s[0], s[1]) > 650 ? rnd() < 0.7 : rnd() < 0.3) ? 0 : 1].push(s));
  [cedarG, leafG].forEach((g, k) => {
    const list = kinds[k];
    const mesh = new T.InstancedMesh(g, mat, Math.max(1, list.length));
    const col = new Float32Array(list.length * 3);
    const m4 = new T.Matrix4(), q = new T.Quaternion(), Y = new T.Vector3(0, 1, 0);
    list.forEach(([x, z, dome], i) => {
      const hgt = (k === 0 ? 280 : 196) * dome * (0.8 + rnd() * 0.4);
      const wid = (k === 0 ? 0.52 : 1.0) * hgt * (0.9 + rnd() * 0.2);
      q.setFromAxisAngle(Y, rnd() * 6.28);
      m4.compose(new T.Vector3(x, ctx.heightAt(x, z) * E - 3, z), q, new T.Vector3(wid, hgt, wid));
      mesh.setMatrixAt(i, m4);
      // v3: each tree takes the painted ground colour under it, a little deeper, so groves read as texture in the wash
      const base = ctx.colorAt ? ctx.colorAt(x, z) : greens[0].clone();
      const c = base.clone().lerp(greens[Math.floor(rnd() * greens.length)], 0.55).multiplyScalar(0.84 + rnd() * 0.08);
      col.set([c.r, c.g, c.b], i * 3);
    });
    g.setAttribute("aColor", new T.InstancedBufferAttribute(col, 3));
    mesh.count = list.length; mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false;
    group.add(mesh);
  });
  group.userData.trees = spots.length; group.userData.groves = groves.length;
  return { object: group };
});
