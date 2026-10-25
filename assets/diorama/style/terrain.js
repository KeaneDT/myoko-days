/* Myoko Diorama style part: TERRAIN (by Claude, v3.1, 16 Oct evening).
   The land as the master painting paints it (myoko-art.jpg, a 1920s Taishō bird's-eye map) on warm washi.
   One smooth colour ramp from the tone map (data/relief-tone-hi.png, R = how high the ground stands above its valley
   floor and the sea): golden plains and valley floors, a yellow-green foot, mid greens, and deep cedar green on the
   high mountains, with no gaps or stray patches. On top of it:
   - ridge lines (tone map G): the crest of every ridge and spur in a dark green that goes almost black on the high
     ground, so height reads at a glance and the hero peaks stand out;
   - soft painted light from the upper left and a few downhill brush strokes on the green slopes, only when zoomed in;
   - rivers (tone map B, a signed distance to the bank): every river is one body of water painted like Lake Nojiri,
     teal-indigo with pale shallows and a fine white bank line, so tributaries join cleanly with no seams;
   - distance: far ranges fade to the painting's blue-grey and soften into the paper.
   It also gives the engine colorAt(x, z), the same ramp on the CPU, for the model bases and tree groves. */
MyokoStyle.part("terrain", function (ctx) {
  const T = ctx.THREE;
  const pads = (ctx.layout.attractions || []).filter(a => !a.onWater).slice(0, 24)
    .map(a => new T.Vector4(a.x, a.z, 0.62 * a.size, 0));
  while (pads.length < 24) pads.push(new T.Vector4(0, 0, 0, 0));
  const COL = { plain: 0xEAD59A, warm: 0xE2C884, foot: 0xCBC88A, light: 0xA6B67E, mid: 0x6C8C6A, deep: 0x4C6E5C, ink: 0x46544C, far: 0x93A7BD };
  const v3 = hex => { const c = new T.Color(hex); return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`; };
  const tone = ctx.tex.tone || null;

  const material = new T.ShaderMaterial({
    uniforms: Object.assign({}, ctx.shared, {
      uGrad: { value: ctx.tex.gradient }, uShape: { value: ctx.tex.shape }, uCover: { value: ctx.tex.cover },
      uWater: { value: ctx.tex.water }, uHeight: { value: ctx.tex.height }, uTone: { value: tone }, uHasTone: { value: tone ? 1 : 0 },
      uPads: { value: pads }
    }),
    vertexShader: `
      varying vec3 vWorld;
      void main() {
        vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * viewMatrix * vec4(vWorld, 1.0);
      }`,
    fragmentShader: `
      ${ctx.glsl.uniforms}
      ${ctx.glsl.palette}
      ${ctx.glsl.worldUV}
      ${ctx.glsl.paint}
      uniform sampler2D uGrad; uniform sampler2D uShape; uniform sampler2D uCover; uniform sampler2D uWater; uniform sampler2D uHeight;
      uniform sampler2D uTone; uniform float uHasTone; uniform vec4 uPads[24];
      varying vec3 vWorld;
      const vec3 C_PLAIN = ${v3(COL.plain)}; const vec3 C_WARM = ${v3(COL.warm)}; const vec3 C_FOOT = ${v3(COL.foot)};
      const vec3 C_LIGHT = ${v3(COL.light)}; const vec3 C_MID = ${v3(COL.mid)}; const vec3 C_DEEP = ${v3(COL.deep)};
      const vec3 C_INK = ${v3(COL.ink)}; const vec3 C_FAR = ${v3(COL.far)};

      vec3 ramp(float t) {                       // plains gold -> yellow-green foot -> greens -> deep cedar green
        vec3 c = mix(C_PLAIN, C_FOOT, smoothstep(0.035, 0.15, t));
        c = mix(c, C_LIGHT, smoothstep(0.12, 0.34, t));
        c = mix(c, C_MID, smoothstep(0.32, 0.62, t));
        return mix(c, C_DEEP, smoothstep(0.60, 0.92, t));
      }
      float kebiki(vec2 p, vec2 dir, float cell, float px, float seed) {
        vec2 c = floor(p / cell); float best = 0.0; vec2 side = vec2(-dir.y, dir.x);
        for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) {
          vec2 id = c + vec2(float(i), float(j)); vec2 h = pHash2(id + seed);
          if (h.x < 0.55) continue;
          vec2 ctr = (id + 0.2 + 0.6 * pHash2(id * 1.7 + seed + 3.1)) * cell; vec2 q = p - ctr;
          float along = dot(q, dir), across = dot(q, side);
          float L = cell * (0.40 + 0.25 * h.y); float t = clamp(along / L, -1.0, 1.0);
          float w = px * (0.3 + 0.7 * (1.0 - t * t));
          float a = (1.0 - smoothstep(w * 0.5, w * 0.5 + px, abs(across))) * (1.0 - smoothstep(L * 0.8, L, abs(along)));
          best = max(best, a * (0.5 + 0.5 * h.y));
        }
        return best;
      }
      float sdfAt(vec2 uv) { return (texture2D(uTone, uv).b * 255.0 - 128.0) * 1.6; }

      void main() {
        vec2 uv = worldUV(vWorld);
        vec4 tn = texture2D(uTone, uv);
        vec4 shape = texture2D(uShape, uv);
        vec2 g = texture2D(uGrad, uv).rg * uExag;
        float slope = length(g);
        vec2 o = vec2(140.0 / uSpan.x, 140.0 / uSpan.y);
        vec2 gb = (2.0 * g + (texture2D(uGrad, uv + vec2(o.x, 0.0)).rg + texture2D(uGrad, uv - vec2(o.x, 0.0)).rg
                  + texture2D(uGrad, uv + vec2(0.0, o.y)).rg + texture2D(uGrad, uv - vec2(0.0, o.y)).rg) * uExag) / 6.0;
        vec3 n = normalize(vec3(-gb.x, 1.0, -gb.y));
        float formB = (2.0 * shape.g + texture2D(uShape, uv + 2.0 * vec2(o.x, 0.0)).g + texture2D(uShape, uv - 2.0 * vec2(o.x, 0.0)).g
                  + texture2D(uShape, uv + 2.0 * vec2(0.0, o.y)).g + texture2D(uShape, uv - 2.0 * vec2(0.0, o.y)).g) / 6.0;

        float pad = 0.0;
        for (int i = 0; i < 24; i++) {
          if (uPads[i].z <= 0.0) continue;
          float d = length(vWorld.xz - uPads[i].xy) / uPads[i].z;
          pad = max(pad, 1.0 - smoothstep(0.75, 1.35, d));
        }
        // ---- the tone: one smooth ramp; spurs a touch deeper and folds a touch lighter, only on the hills
        float t = tn.r;
        float hillW = smoothstep(0.08, 0.30, t) * (1.0 - pad);
        t = clamp(t + 0.07 * (formB - 0.5) * 2.0 * hillW, 0.0, 1.0);
        float broad = pFbm(vWorld.xz / 5200.0);
        vec3 col = ramp(t);
        col = mix(col, mix(C_PLAIN, C_WARM, broad), (1.0 - smoothstep(0.02, 0.12, t)) * 0.6);   // the plains' slow wash
        col = mix(col, PAPER, 0.03 * (1.0 - broad) * (1.0 - smoothstep(0.0, 0.3, t)));

        // ---- light: soft, from the upper left; stronger on the mountains, quiet on the plains and under models
        float ndl = dot(n, normalize(uSun));
        float lt = clamp(ndl * 0.62 + 0.38, 0.0, 1.0);
        lt = mix(lt, 0.5 * smoothstep(0.36, 0.60, lt) + 0.5 * smoothstep(0.66, 0.90, lt), 0.3);
        lt = mix(lt, 0.62, pad * 0.85);
        float lk = mix(0.10, 0.34, smoothstep(0.08, 0.5, t));
        col *= (1.0 - lk * 0.75) + lk * lt;
        col = mix(col, mix(col, ENZAN, 0.5), 0.14 * (1.0 - lt) * smoothstep(0.15, 0.5, t));

        // ---- ridge lines: dark green, close to black on the high ground (the darker the line, the higher the ridge)
        float px = pPixel(vWorld);
        float ridge = smoothstep(0.22, 0.85, tn.g) * (1.0 - pad);
        ridge *= mix(1.0, 0.7, smoothstep(2.0, 5.0, uZoom));
        vec3 ink = mix(mix(C_DEEP, C_INK, 0.35), C_INK, smoothstep(0.5, 0.95, tn.r));
        float ridgeA = ridge * mix(0.50, 0.90, smoothstep(0.3, 0.9, tn.r)) * 0.34;
        col = mix(col, ink, ridgeA);

        // ---- a few downhill strokes on the green slopes, only when large enough on screen
        float strokeWant = smoothstep(0.16, 0.5, tn.r) * (1.0 - pFar(vWorld)) * (1.0 - pad) * 0.18;
        if (strokeWant > 0.01 && slope > 1e-4) {
          vec2 dir = g / slope; float k = 0.0;
          float fA = smoothstep(10.0, 20.0, 230.0 / px), fB = smoothstep(10.0, 20.0, 115.0 / px);
          if (fA > 0.0) k = max(k, kebiki(vWorld.xz, dir, 230.0, px, 1.0) * fA);
          if (fB > 0.0) k = max(k, kebiki(vWorld.xz, dir, 115.0, px, 7.0) * fB * 0.8);
          col = mix(col, C_DEEP * 0.85, k * strokeWant);
        }

        // ---- rivers: one water body from the signed distance (negative = in the water)
        if (uHasTone > 0.5) {
          float sd = sdfAt(uv);
          if (sd < 2.0 * px + 4.0) {
            float inWater = 1.0 - smoothstep(-0.6 * px, 0.6 * px, sd);
            float deep = smoothstep(0.0, 75.0, -sd);
            vec3 shallow = mix(GUNJO, BYAKUGUN, 0.42);
            vec3 wcol = mix(shallow, mix(GUNJO, BYAKUGUN, 0.16), deep);
            wcol *= 0.97 + 0.06 * pFbm(vWorld.xz / 700.0);
            // ripple dashes along the flow, once the river is a few pixels wide
            vec2 e = vec2(30.0 / uSpan.x, 30.0 / uSpan.y);
            vec2 sg = vec2(sdfAt(uv + vec2(0.0, e.y)) - sdfAt(uv - vec2(0.0, e.y)), sdfAt(uv + vec2(e.x, 0.0)) - sdfAt(uv - vec2(e.x, 0.0)));
            vec2 across = length(sg) > 1e-3 ? normalize(sg) : vec2(1.0, 0.0);
            vec2 along = vec2(-across.y, across.x);
            vec2 cid = floor(vWorld.xz / 240.0); float hh = pHash(cid + 5.3);
            vec2 q = vWorld.xz - (cid + 0.5) * 240.0;
            float dash = (1.0 - smoothstep(18.0, 34.0, abs(dot(q, along)))) * (1.0 - smoothstep(0.4 * px, 1.3 * px, abs(dot(q, across))))
                         * step(0.5, hh) * smoothstep(-6.0, -22.0, sd) * smoothstep(14.0, 7.0, px)
                         * (uReduceMotion > 0.5 ? 1.0 : 0.55 + 0.45 * sin(uTime * 0.7 + hh * 40.0));   // a slow glint
            wcol = mix(wcol, GOFUN, dash * 0.75);
            // the bank: a fine washi-white line just inside the water's edge, when zoomed in enough to read
            float bank = (1.0 - smoothstep(0.35 * px, 1.1 * px, abs(sd + 1.0 * px))) * smoothstep(30.0, 14.0, px);
            wcol = mix(wcol, wcol * 0.70, (1.0 - smoothstep(0.35 * px, 1.25 * px, abs(sd + 0.7 * px))) * 0.55);   // v8: hairline rim
            col = mix(col, wcol, inWater);
            col = mix(col, GOFUN, bank * 0.85);
          }
        }

        // ---- under lakes and the sea (the water meshes cover this): shore colour, so edges never show green
        vec4 water = texture2D(uWater, uv);
        col = mix(col, mix(C_PLAIN, PAPER, 0.25), max(water.r, water.g) * 0.9);

        // ---- distance: far mountains fade to the painting's blue-grey, then soften toward the paper
        float far = pFar(vWorld);
        // at the full view the westernmost ranges (the back of the map) take the painting's blue as well
        float farW = smoothstep(-0.12 * uSpan.x, -0.47 * uSpan.x, vWorld.z) * (1.0 - smoothstep(1.3, 2.6, uZoom));
        far = max(far, farW * 0.9);
        col = mix(col, mix(col, C_FAR, 0.85), far * (0.40 + 0.60 * smoothstep(0.12, 0.5, tn.r)));
        gl_FragColor = vec4(pFinish(col, vWorld), 1.0);
      }`
  });

  /* colorAt(x, z): the same ramp on the CPU, without light, lines or strokes (model bases, tree groves) */
  const C = k => new T.Color(COL[k]);
  const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  function rampCPU(t) {
    return C("plain").lerp(C("foot"), ss(0.035, 0.15, t)).lerp(C("light"), ss(0.12, 0.34, t)).lerp(C("mid"), ss(0.32, 0.62, t)).lerp(C("deep"), ss(0.60, 0.92, t));
  }
  function colorAt(x, z) {
    const t = tone ? ctx.sample("tone", x, z)[0] : 0.2;
    const c = rampCPU(t);
    c.lerp(C("plain").lerp(C("warm"), 0.5), (1 - ss(0.02, 0.12, t)) * 0.6);
    return c.multiplyScalar(0.94);
  }
  ctx.colorAt = colorAt;
  return { material, background: ctx.PALETTE.paper, colorAt };
});
