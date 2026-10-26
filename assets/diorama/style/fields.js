/* Myoko Diorama style part: FIELDS (by Claude, v2).
   Rice paddies as low raised plots on the flat plains (the painting's field grid, made slightly 3D): quiet young-rice
   greens and ripening golds pulled toward the ground colour so they blend, earthen bunds between them, a grid whose
   angle drifts slowly across the plain, and faint rice rows that appear only when you zoom in. One draw call. */
MyokoStyle.part("fields", function (ctx) {
  const T = ctx.THREE, L = ctx.layout, E = ctx.exaggeration;
  const SN = ctx.span.northSouth, SE = ctx.span.eastWest;
  const rnd = ctx.kit.rand(4242);
  const attractions = (L.attractions || []).map(a => [a.x, a.z, 0.68 * a.size]);
  const clearOfModels = (x, z) => attractions.every(([ax, az, r]) => (x - ax) * (x - ax) + (z - az) * (z - az) > r * r);
  const nz = (x, z) => 0.5 * Math.sin(x / 2100 + 1.1) * Math.cos(z / 1700 - 0.6) + 0.35 * Math.sin((x + z) / 1300 + 2.0) + 0.25 * Math.cos((x - z) / 900);
  function grade(x, z) {      // 2 = core rice land, 1 = open or gentle ground (filled in patches), 0 = no
    if (Math.abs(x) > SN / 2 - 1500 || Math.abs(z) > SE / 2 - 1500) return 0;
    const c = ctx.sample("cover", x, z), w = ctx.sample("water", x, z), s = ctx.sample("shape", x, z), t = ctx.sample("tone", x, z);
    if (w[0] > 0.05 || w[1] > 0.05 || w[2] > 0.05 || c[2] >= 0.22) return 0;
    if (t && ctx.tex.tone && t[2] < 0.74) return 0;                      // keep clear of the rivers and their banks
    const sl = s[0] * 50, hh = ctx.heightAt(x, z);
    if ((c[1] > 0.3 || (c[0] < 0.35 && sl < 3.0 && hh < 1000)) && sl < 5.6) return 2;
    if ((c[1] > 0.12 || (c[0] < 0.7 && hh < 1100)) && sl < 5.0) return 1;
    if (t && ctx.tex.tone && t[0] < 0.15 && sl < 5.0 && nz(x, z) > -0.35) return 2;   // any low flat plain
    return 0;
  }
  function good(x, z) { const g = grade(x, z); return g === 2 || (g === 1 && nz(x, z) > -0.05); }
  const TILE = 2600, GAP = 16;
  // The rendered terrain is coarser than the source height texture. Its triangles
  // can sit above an interpolated corner sample, especially on phone quality.
  // Bound every terrain cell touched by the plot; a linear triangle cannot rise
  // above its highest vertex. This is intentionally conservative at the edges.
  function terrainCeiling(corners) {
    const grid = ctx.terrainGrid;
    if (!grid) return -Infinity;
    const { positions: p, cols, rows } = grid;
    const dx = p[0] - p[cols * 3], dz = p[5] - p[2];
    const xs = corners.map(c => c[0]), zs = corners.map(c => c[1]);
    const r0 = Math.max(0, Math.floor((p[0] - Math.max(...xs)) / dx));
    const r1 = Math.min(rows - 1, Math.ceil((p[0] - Math.min(...xs)) / dx));
    const c0 = Math.max(0, Math.floor((Math.min(...zs) - p[2]) / dz));
    const c1 = Math.min(cols - 1, Math.ceil((Math.max(...zs) - p[2]) / dz));
    let high = -Infinity;
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) high = Math.max(high, p[(r * cols + c) * 3 + 1]);
    return high;
  }
  const plots = [];
  for (let tx = -SN / 2; tx < SN / 2; tx += TILE) for (let tz = -SE / 2; tz < SE / 2; tz += TILE) {
    const cx = tx + TILE / 2, cz = tz + TILE / 2;
    if (!good(cx, cz) && !good(tx, tz) && !good(tx + TILE, tz + TILE) && !good(tx, tz + TILE) && !good(tx + TILE, tz)) continue;
    // the grid's angle drifts slowly across the plain (a smooth function of position, so neighbouring tiles agree roughly)
    const ang = 0.35 * Math.sin(cx / 9000 + 1.3) + 0.3 * Math.cos(cz / 7000 - 0.4);
    const ca = Math.cos(ang), sa = Math.sin(ang);
    let u = -TILE / 2;
    while (u < TILE / 2) {
      const wRow = 150 + rnd() * 110;
      let v = -TILE / 2;
      while (v < TILE / 2) {
        const dCol = 110 + rnd() * 80;
        const lu = u + wRow / 2, lv = v + dCol / 2;
        const x = cx + lu * ca - lv * sa, z = cz + lu * sa + lv * ca;
        const hw = (wRow - GAP) / 2, hd = (dCol - GAP) / 2;
        const corners = [[hw, hd], [-hw, hd], [hw, -hd], [-hw, -hd]].map(([a, b]) => [x + a * ca - b * sa, z + a * sa + b * ca]);
        // Check the ROTATED world corners against the owning world tile. Local
        // coordinates alone let adjacent rotated grids overlap and shimmer.
        if (Math.abs(lu) + wRow / 2 <= TILE / 2 && Math.abs(lv) + dCol / 2 <= TILE / 2 && rnd() > 0.02 &&
            corners.every(([a, b]) => a >= tx + GAP / 2 && a <= tx + TILE - GAP / 2 && b >= tz + GAP / 2 && b <= tz + TILE - GAP / 2) &&
            good(x, z) && corners.every(([a, b]) => good(a, b)) && clearOfModels(x, z)) {
          const hs = corners.map(([a, b]) => ctx.heightAt(a, b)).concat([ctx.heightAt(x, z)]);
          const top = Math.max(Math.max(...hs) * E, terrainCeiling(corners)) + 3.2 * E, bottom = (Math.min(...hs) - 4) * E;
          plots.push({ x, z, w: wRow - GAP, d: dCol - GAP, ang, top, bottom });
        }
        v += dCol;
      }
      u += wRow;
    }
  }

  const geo = new T.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
  const pal = ctx.PALETTE, C = h => new T.Color(h);
  const ground = new T.Color(0xDEC274).lerp(C(pal.paper), 0.04);   // v3: the terrain's golden plain
  const crops = [C(pal.moegi), C(pal.moegi).lerp(C(pal.byakuroku), 0.5), C(pal.kuchiba), C(pal.byakuroku), C(pal.moegi).lerp(C(pal.kuchiba), 0.5), C(0xD9A04A), C(0xCF8F45), C(0xDDAE5E), C(0xC98B52)];   // v13: a few warm amber and orange plots
  const material = new T.ShaderMaterial({
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,   // v17.15: pulled a little towards the camera, so a plot top and the ground never fight for the same depth
    uniforms: Object.assign({}, ctx.shared, { uGround: { value: ground } }),
    vertexShader: `
      attribute vec3 aColor; attribute float aAngle; uniform float uZoom;
      varying vec3 vWorld; varying vec3 vNormal; varying vec3 vColor; varying vec2 vLocal; varying float vTop;
      void main() {
        vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        vNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
        vColor = aColor;
        vec3 sx = vec3(instanceMatrix[0]); vec3 sz = vec3(instanceMatrix[2]);
        vLocal = vec2(position.x * length(sx), position.z * length(sz));     // metres across the plot
        vTop = step(0.5, normal.y);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `
      ${ctx.glsl.uniforms}
      ${ctx.glsl.palette}
      ${ctx.glsl.paint}
      uniform vec3 uGround;
      varying vec3 vWorld; varying vec3 vNormal; varying vec3 vColor; varying vec2 vLocal; varying float vTop;
      void main() {
        float l = clamp(dot(normalize(vNormal), normalize(uSun)) * 0.5 + 0.5, 0.0, 1.0);
        // zoomed out, the plots melt into the plain (a faint tint, no mosaic); their detail comes in as you zoom
        // v3: the patchwork stays visible at full view (the painting's field texture on the plains); bunds and rows
        // come in as you zoom
        float detail = smoothstep(1.4, 2.6, uZoom);
        vec3 top = mix(mix(uGround, vColor, 0.9), vColor, detail);
        vec3 col = mix(mix(uGround, uGround * 0.86, detail), top, vTop);  // the sides are the earthen bund
        // faint rice rows along the plot, only when they are several pixels apart on screen
        float px = pPixel(vWorld);
        float rows = abs(fract(vLocal.y / 14.0) - 0.5) * 14.0;
        float rowLine = (1.0 - smoothstep(px * 0.5, px * 1.5, rows)) * smoothstep(5.0, 10.0, 14.0 / px) * vTop;
        col = mix(col, col * 0.9, rowLine * 0.5);
        // a soft rim of bund colour round the top, as the painting's thin plot borders
        vec2 edge = vec2(fwidth(vLocal.x), fwidth(vLocal.y));
        col *= mix(0.95 + 0.04 * l, 0.86 + 0.20 * l, detail);
        gl_FragColor = vec4(pFinish(col, vWorld), 1.0);
      }`
  });
  const mesh = new T.InstancedMesh(geo, material, Math.max(1, plots.length));
  const colors = new Float32Array(plots.length * 3), angles = new Float32Array(plots.length);
  const m4 = new T.Matrix4(), q = new T.Quaternion(), Y = new T.Vector3(0, 1, 0);
  plots.forEach((p, i) => {
    q.setFromAxisAngle(Y, -p.ang);
    m4.compose(new T.Vector3(p.x, p.bottom, p.z), q, new T.Vector3(p.w, p.top - p.bottom, p.d));
    mesh.setMatrixAt(i, m4);
    const c = crops[Math.floor(rnd() * crops.length)].clone().lerp(ground, 0.30 + rnd() * 0.16);
    c.offsetHSL((rnd() - 0.5) * 0.03, (rnd() - 0.5) * 0.12, (rnd() - 0.5) * 0.06);   // v13: each plot a touch different
    colors.set([c.r, c.g, c.b], i * 3); angles[i] = p.ang;
  });
  geo.setAttribute("aColor", new T.InstancedBufferAttribute(colors, 3));
  geo.setAttribute("aAngle", new T.InstancedBufferAttribute(angles, 1));
  mesh.count = plots.length; mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false; mesh.name = "rice-plots";
  return { object: mesh, plots };
});
