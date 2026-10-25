/* Myoko Diorama: the railway on the map (stage: trains).
   MyokoTrains.create({ T, K, scene, L, heightAt, EXAG, reduce }) -> { prepare(), build(), update(sec), advance(dt), active(), stations(), group }

   Myoko-Kogen is the meeting point of two railways. The Kita-Shinano Line (Shinano Railway) comes up from Nagano through
   Kurohime; the Myoko Haneuma Line (Echigo Tokimeki Railway) runs on from the same station past Sekiyama, Nihongi and Arai towards
   Takada. The map keeps them as ONE track through the station: south (the left of the screen) is Nagano, north (the right) is Arai.
   - prepare(): lays the line (a smooth curve through layout.json's rail, kept off the lakes and the attraction models, running from
     the north edge of the board to the south edge), and removes the village houses that would stand on the track or a station.
   - build(): draws the track on a graded bed (it never sinks into the hills: the bed is lifted to clear the ground across its
     whole width and the slopes either side are drawn down to the terrain as an embankment), the five stations, and two trains.
     Nothing here is an attraction: no ring, no pin, never picked.
   - update(sec): the timetable. One two-car train at a time, the two lines taking turns. The Shinano train appears at Kurohime, runs
     up to Myoko-Kogen, brakes to a stop at the platform, waits, then reverses out the way it came and fades away; 20 to 30 seconds
     later the Echigo Tokimeki train does the same from Sekiyama. With reduced motion, one train simply stands at the platform. */
window.MyokoTrains = (function () {
  "use strict";
  const STEP = 40;                  // metres between samples
  const SC = 1.7;                   // everything is drawn this much bigger than the 1:1 train, so it reads on the map like the houses do
  const CAR = { len: 190 * SC, gap: 8 * SC };
  const TRAIN_LEN = CAR.len * 2 + CAR.gap;
  const VMAX = 900, ACC = 130, DWELL = 9.5, WAIT_MIN = 6, WAIT_MAX = 10, FADE = 900;
  const KM = { myoko: 0, sekiyama: 6.4, nihongi: 14.7, arai: 21.0 };      // kilometres from Myoko-Kogen on the Myoko Haneuma Line (public line data)
  const smooth = x => x * x * (3 - 2 * x);

  function create(ctx) {
    const { T, K, scene, L, heightAt, EXAG } = ctx;
    const group = new T.Group(); group.name = "railway"; group.renderOrder = 0;
    const noRay = o => { o.raycast = () => {}; return o; };

    /* ------------------------------------------------ the line: u = metres from the north edge, running south (to the left of the screen) */
    const half = L.spanMetres.northSouth / 2;
    const rail = L.rail.map(p => [p[0], p[1]]);                                                       // Arai first, the south edge last
    {                                                                                                  // beyond Arai the line carries on in its own direction, off the north edge towards Takada
      const a = rail[1], b = rail[0], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), t = (half + 500 - b[0]) / (dx / l);
      rail.unshift([b[0] + dx / l * t, b[1] + dz / l * t], [b[0] + dx / l * t * 0.5, b[1] + dz / l * t * 0.5]);   // far point first, then the midpoint, then Arai
    }
    const st = (L.stations || []).find(s => s.id === "station-myoko-kogen") || { x: -1746.6, z: 2673.5 };
    const curve = new T.CatmullRomCurve3(rail.map(p => new T.Vector3(p[0], 0, p[1])), false, "centripetal");
    const DISC = { ebike: [46, 0.8], forest: [46, 2.2], rice: [46, 1.0], picnic: [44, 2.2], daruma: [44, 1.05], imori: [44, 1.2], madarao: [44, 1.2], naena: [44, 1.2], zip: [44, 1.1] };
    let Q = curve.getSpacedPoints(Math.ceil(curve.getLength() / STEP));
    // The painted lakes are a little fuller than the surveyed rail line allows for, so the line would run out over open water.
    // Push every point that is in, or too close to, a lake back to dry shore, keeping the curve smooth, then resample it evenly.
    {
      const lks = (L.lakes || []).map(l => l.outline);
      const segD2 = (px, pz, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1; let t = ((px - a[0]) * dx + (pz - a[1]) * dz) / l2; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - a[0] - t * dx, pz - a[1] - t * dz); };
      const lakeGap = (x, z) => {
        let m = 1e9;
        for (const o of lks) {
          let inside = false, md = 1e9;
          for (let i = 0, j = o.length - 1; i < o.length; j = i++) {
            if ((o[i][1] > z) !== (o[j][1] > z) && x < (o[j][0] - o[i][0]) * (z - o[i][1]) / (o[j][1] - o[i][1]) + o[i][0]) inside = !inside;
            const d = segD2(x, z, o[j], o[i]); if (d < md) md = d;
          }
          const d = inside ? -md : md; if (d < m) m = d;
        }
        return m;
      };
      const dsk = (L.attractions || []).filter(a => !a.onWater).map(a => ({ x: a.x, z: a.z, r: (DISC[a.id] || [44])[0] * a.size / 100 + 70 }));   // the line goes round attraction models, not through them
      const wetOrModel = (x, z) => { let m = lakeGap(x, z); for (const d of dsk) { const g = Math.hypot(x - d.x, z - d.z) - d.r; if (g < m) m = g; } return m; };
      const SHORE = 150;
      for (let it = 0; it < 60; it++) {
        let moved = 0;
        for (let i = 1; i < Q.length - 1; i++) {
          const g = wetOrModel(Q[i].x, Q[i].z); if (g >= SHORE) continue;
          const gx = wetOrModel(Q[i].x + 30, Q[i].z) - wetOrModel(Q[i].x - 30, Q[i].z), gz = wetOrModel(Q[i].x, Q[i].z + 30) - wetOrModel(Q[i].x, Q[i].z - 30), l = Math.hypot(gx, gz) || 1;
          const push = Math.min(120, (SHORE - g) * 0.5); Q[i].x += gx / l * push; Q[i].z += gz / l * push; moved++;
        }
        const c = Q.map(v => v.clone());
        for (let i = 1; i < Q.length - 1; i++) { Q[i].x = 0.25 * c[i - 1].x + 0.5 * c[i].x + 0.25 * c[i + 1].x; Q[i].z = 0.25 * c[i - 1].z + 0.5 * c[i].z + 0.25 * c[i + 1].z; }
        if (!moved && it > 4) break;
      }
      const ctl = []; for (let i = 0; i < Q.length; i += 6) ctl.push(Q[i]); ctl.push(Q[Q.length - 1]);
      const c2 = new T.CatmullRomCurve3(ctl.map(v => new T.Vector3(v.x, 0, v.z)), false, "centripetal");
      Q = c2.getSpacedPoints(Math.ceil(c2.getLength() / STEP));
    }
    // trim to the board: the line runs right up to its north and south edges and is cut square there
    const XL = half - 6;
    let i0 = 0, i1 = Q.length - 1;
    while (i0 < Q.length - 1 && Math.abs(Q[i0].x) > XL) i0++;
    while (i1 > 0 && Math.abs(Q[i1].x) > XL) i1--;
    let P = Q.slice(Math.max(0, i0 - 1), Math.min(Q.length, i1 + 2));
    P[0].x = XL; P[P.length - 1].x = -XL;
    let qReal = 0, rb = 1e18; P.forEach((v, i) => { const d = Math.hypot(v.x - st.x, v.z - st.z); if (d < rb) { rb = d; qReal = i; } });
    // The platform is centred on the real Myoko-Kogen station. It may slide a few hundred metres along the line (and the building may
    // take either side) only to keep the platform off the river bank.
    // wetGap(x, z): distance to the nearest water edge (negative = in the water), rivers by their drawn width, lakes by their outline
    const rivs = (L.rivers || []).map(r => ({ p: r.points, w: (r.width || 60) / 2 }));
    const lakes = (L.lakes || []).map(l => l.outline);
    const segD = (px, pz, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1; let t = ((px - a[0]) * dx + (pz - a[1]) * dz) / l2; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - a[0] - t * dx, pz - a[1] - t * dz); };
    const gapTo = (x, z) => {
      let m = 1e9;
      for (const r of rivs) for (let i = 0; i + 1 < r.p.length; i++) { const d = segD(x, z, r.p[i], r.p[i + 1]) - r.w; if (d < m) m = d; }
      for (const o of lakes) {
        let inside = false, md = 1e9;
        for (let i = 0, j = o.length - 1; i < o.length; j = i++) {
          if ((o[i][1] > z) !== (o[j][1] > z) && x < (o[j][0] - o[i][0]) * (z - o[i][1]) / (o[j][1] - o[i][1]) + o[i][0]) inside = !inside;
          const d = segD(x, z, o[j], o[i]); if (d < md) md = d;
        }
        const d = inside ? -md : md; if (d < m) m = d;
      }
      return m;
    };
    const riverGap = (cx, cz, nx, nz, tx0, tz0) => {
      let m = 1e9;
      for (const lat of [60 * SC, 110 * SC, 170 * SC, 230 * SC]) for (const al of [-210 * SC, -105 * SC, 0, 105 * SC, 210 * SC]) m = Math.min(m, gapTo(cx + nx * lat + tx0 * al, cz + nz * lat + tz0 * al));
      return m;
    };
    const dirAt = i => { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)]; const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; };
    const span = Math.round(520 * SC / STEP), HALFP = Math.round(260 * SC / STEP);
    let c0 = qReal, side = 1, bestScore = -1e18, bestGap = 0;
    for (let c = Math.max(HALFP + 2, qReal - 22); c <= Math.min(P.length - HALFP - 3, qReal + 22); c++) {
      let tg = 1e9; for (let i = c - HALFP; i <= c + HALFP; i++) tg = Math.min(tg, gapTo(P[i].x, P[i].z));      // the whole platform stretch
      const [tx0, tz0] = dirAt(c);
      for (const sd of [1, -1]) {
        const g = Math.min(riverGap(P[c].x, P[c].z, -tz0 * sd, tx0 * sd, tx0, tz0), 260);
        const a = dirAt(Math.max(1, c - span)), b = dirAt(Math.min(P.length - 2, c + span)), bend = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1])));
        const score = Math.min(tg, 150) * 14 - Math.max(0, 110 - tg) * 60 + g * 2 - Math.abs(c - qReal) * STEP * 0.8 - bend * 5000 - (sd < 0 ? 5 : 0);   // dry ground first, then close to the real station, then straight
        if (score > bestScore) { bestScore = score; c0 = c; side = sd; bestGap = tg; }
      }
    }
    const N = P.length, S = (N - 1) * STEP;
    const I0 = 0;
    const tx = new Float32Array(N), tz = new Float32Array(N);
    for (let i = 0; i < N; i++) { const a = P[Math.max(0, i - 1)], b = P[Math.min(N - 1, i + 1)]; let dx = b.x - a.x, dz = b.z - a.z; const l = Math.hypot(dx, dz) || 1; tx[i] = dx / l; tz[i] = dz / l; }
    /* the ground the bed must clear: the terrain, and the raised ground of any attraction model the line runs over (the e-bike
       model sits on Kurohime itself), so the track rides over it instead of sinking in */
    const discs = (L.attractions || []).filter(a => !a.onWater).map(a => { const d = DISC[a.id] || [44, 1.0], sc = a.size / 100; return { x: a.x, z: a.z, r: d[0] * sc, top: d[1] * sc, base: heightAt(a.x, a.z) * EXAG }; });
    const gH = (x, z) => {
      let m = heightAt(x, z) * EXAG;
      for (const d of discs) { const dd = Math.hypot(x - d.x, z - d.z); if (dd < d.r) m = Math.max(m, d.base + d.top * (dd < 0.85 * d.r ? 1 : (d.r - dd) / (0.15 * d.r))); }
      return m;
    };
    /* the stations: Myoko-Kogen at the centre, Kurohime to the south, Sekiyama, Nihongi and Arai to the north. A halt stands where
       the line is clear of the lakes and the models, as near as it can to its real position. */
    const stat = id => (L.stations || []).find(x => x.id === id);
    const clearOfModels = (x, z) => discs.every(d => Math.hypot(x - d.x, z - d.z) > d.r + 380) && gapTo(x, z) > 160;
    const pickNear = (x, z, lo, hi) => {
      let best = -1, bd = 1e18, any = -1, ad = 1e18;
      for (let i = Math.max(12, lo); i <= Math.min(N - 13, hi); i++) {
        const d = Math.hypot(P[i].x - x, P[i].z - z); if (d < ad) { ad = d; any = i; }
        let ok = true; for (let j = -10; j <= 10; j += 5) if (!clearOfModels(P[i + j].x, P[i + j].z)) { ok = false; break; }
        if (ok && d < bd) { bd = d; best = i; }
      }
      return best >= 0 ? best : any;
    };
    const kur = stat("station-kurohime") || { x: -11316.3, z: -154.6 }, sek = stat("station-sekiyama") || { x: 4161, z: 4103 }, arai = stat("station-arai") || { x: 11450, z: 6672 };
    const iKur = pickNear(kur.x, kur.z, c0 + 60, N - 13), iSek = pickNear(sek.x, sek.z, 12, c0 - 60);
    const iArai = pickNear(arai.x, arai.z, 12, iSek - 60);
    const frac = (KM.nihongi - KM.sekiyama) / (KM.arai - KM.sekiyama), iNih0 = Math.round(iSek + frac * (iArai - iSek));
    const iNih = pickNear(P[iNih0].x, P[iNih0].z, iArai + 40, iSek - 40);

    /* ------------------------------------------------ the graded bed: it clears the ground across its whole width */
    const HW = 36 * SC;                                           // half-width of the bed incl. its shoulders
    const centre = new Float32Array(N), env = new Float32Array(N), yb = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      centre[i] = gH(P[i].x, P[i].z);
      const nx = -tz[i], nz = tx[i]; let m = -1e9;
      for (let o = -HW; o <= HW + 1; o += 18) for (const [dx, dz] of [[0, 0], [45, 0], [-45, 0], [0, 45], [0, -45]]) {   // the terrain mesh is coarser than the height map, so look around each point
        const v = gH(P[i].x + nx * o + dx, P[i].z + nz * o + dz); if (v > m) m = v;
      }
      env[i] = m;
    }
    const blur = (arr, win) => { const c = arr.slice(); for (let i = 0; i < N; i++) { let a = 0, n = 0; for (let k = -win; k <= win; k++) { const j = i + k; if (j >= 0 && j < N) { a += c[j]; n++; } } arr[i] = a / n; } };
    const LIFT = 4;                                                // the bed stands this far above the ground
    for (let i = 0; i < N; i++) yb[i] = centre[i] + LIFT;
    blur(yb, 3); blur(yb, 3);
    for (let pass = 0; pass < 4; pass++) { for (let i = 0; i < N; i++) yb[i] = Math.max(yb[i], env[i] + LIFT); blur(yb, 2); }
    for (let i = 0; i < N; i++) yb[i] = Math.max(yb[i], env[i] + LIFT * 0.75);
    function at(u) {                                           // position along the line, u in metres from the buffer stop
      const f = Math.max(0, Math.min(N - 1.0001, u / STEP)), i = Math.floor(f), k = f - i;
      const l = (a, b) => a + (b - a) * k;
      let dx = l(tx[i], tx[i + 1]), dz = l(tz[i], tz[i + 1]); const m = Math.hypot(dx, dz) || 1;
      return { x: l(P[i].x, P[i + 1].x), z: l(P[i].z, P[i + 1].z), y: l(yb[i], yb[i + 1]), tx: dx / m, tz: dz / m };
    }
    const sideOf = (i, real) => {                                // the side of the line the station building stands on: where the real station lies, else the side with more room
      const [tx0, tz0] = dirAt(i), off = (real.x - P[i].x) * -tz0 + (real.z - P[i].z) * tx0;
      if (Math.abs(off) > 60) return off > 0 ? 1 : -1;
      return riverGap(P[i].x, P[i].z, -tz0, tx0, tx0, tz0) >= riverGap(P[i].x, P[i].z, tz0, -tx0, tx0, tz0) ? 1 : -1;
    };
    const mkStn = (id, name, i, sd) => { const u = i * STEP; return { id, name, i, u, C: at(u), side: sd }; };
    const nihPos = P[iNih];
    const STN = {
      myoko: mkStn("station-myoko-kogen", "Myoko-Kogen", c0, side),
      kurohime: mkStn("station-kurohime", "Kurohime", iKur, sideOf(iKur, kur)),
      sekiyama: mkStn("station-sekiyama", "Sekiyama", iSek, sideOf(iSek, sek)),
      nihongi: mkStn("station-nihongi", "Nihongi", iNih, sideOf(iNih, nihPos)),
      arai: mkStn("station-arai", "Arai", iArai, sideOf(iArai, arai))
    };
    const ALL = Object.values(STN);
    const uSt = STN.myoko.u, stC = STN.myoko.C;

    /* ------------------------------------------------ houses off the track */
    function prepare() {
      const items = L.houses && L.houses.items; if (!items) return;
      const cell = 200, grid = new Map(), key = (x, z) => Math.floor(x / cell) + "," + Math.floor(z / cell);
      for (let i = 0; i < N; i++) { const k = key(P[i].x, P[i].z); (grid.get(k) || grid.set(k, []).get(k)).push(i); }
      const near = (x, z, r) => {
        const cx = Math.floor(x / cell), cz = Math.floor(z / cell);
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const g = grid.get((cx + a) + "," + (cz + b)); if (g) for (const i of g) if (Math.hypot(P[i].x - x, P[i].z - z) < r) return true; }
        return false;
      };
      const tn = [-stC.tz * side, stC.tx * side];                                    // from the track towards the station building (world x, z)
      const along = (x, z) => (x - stC.x) * stC.tx + (z - stC.z) * stC.tz, lat = (x, z) => (x - stC.x) * tn[0] + (z - stC.z) * tn[1];
      const onStn = (S, x, z, pad) => { const kn = [-S.C.tz * S.side, S.C.tx * S.side], al = (x - S.C.x) * S.C.tx + (z - S.C.z) * S.C.tz, la = (x - S.C.x) * kn[0] + (z - S.C.z) * kn[1]; return Math.abs(al) < 360 + pad && la > -90 - pad && la < 330 + pad; };   // the platform, canopy and building
      const onStation = (x, z, pad) => ALL.some(S => onStn(S, x, z, pad));
      const kept = items.filter(it => !near(it[0], it[1], 70 + (it[2] || 100) * 0.5 + 40) && !onStation(it[0], it[1], (it[2] || 100) * 0.5));
      /* Myoko-Kogen is the hub of the valley, so a small town gathers round the station: shops and inns along the street behind the
         station building, storehouses, a few houses beyond the end of the line. Placed on dry, gentle ground, clear of the track,
         the river, the attractions and each other. */
      let seed = 4711; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
      const riverNear = (x, z, r) => gapTo(x, z) < r;
      const slope = (x, z) => Math.hypot(heightAt(x + 35, z) - heightAt(x - 35, z), heightAt(x, z + 35) - heightAt(x, z - 35)) / 70;
      const att = (L.attractions || []);
      const placed = kept.slice();
      const free = (x, z, sz) => {
        if (near(x, z, 190 + sz * 0.3) || onStation(x, z, sz * 0.5) || riverNear(x, z, 80 + sz * 0.4) || slope(x, z) > 0.22) return false;
        for (const a of att) if (Math.hypot(a.x - x, a.z - z) < 260) return false;
        for (const h of placed) if (Math.hypot(h[0] - x, h[1] - z) < ((h[2] || 100) + sz) * 0.5 * 0.92) return false;
        return true;
      };
      const mix = [1, 1, 1, 6, 1, 3, 0, 1, 4, 1, 6, 1];                                  // mostly machiya (two-storey shops), some inns, storehouses, sheds
      const add = (x, z, fx, fz, big) => {
        const type = mix[Math.floor(rnd() * mix.length)], sz = (type === 6 ? 125 : type === 3 ? 82 : type === 4 ? 78 : 100) * (big ? 1.08 : 1) * (0.9 + rnd() * 0.2);
        if (!free(x, z, sz)) return;
        const ry = (Math.atan2(fx, fz) * 180 / Math.PI) + (rnd() - 0.5) * 8;
        placed.push([x, z, sz, ry, type, Math.floor(rnd() * 8), Math.floor(rnd() * 5), 50]);
      };
      for (const [off, front, big] of [[420, -1, true], [570, 1, false], [720, -1, false]]) {      // streets parallel to the line, behind the building
        for (let al = -1000; al <= 1000; al += 120 + rnd() * 30) {
          const x = stC.x + stC.tx * al + tn[0] * (off + (rnd() - 0.5) * 24), z = stC.z + stC.tz * al + tn[1] * (off + (rnd() - 0.5) * 24);
          add(x, z, tn[0] * front, tn[1] * front, big);
        }
      }
      for (let al = -1000; al <= 1000; al += 140 + rnd() * 30) {                          // the near side of the line (opposite the building), where the river leaves room
        for (const off of [-270, -420]) add(stC.x + stC.tx * al + tn[0] * off, stC.z + stC.tz * al + tn[1] * off, tn[0], tn[1], false);
      }
      for (let i = 0; i < 30; i++) {                                                     // further out: the town spreads up and down the valley
        const al = (rnd() - 0.5) * 2600, off = (rnd() < 0.5 ? -1 : 1) * (480 + rnd() * 620);
        add(stC.x + stC.tx * al + tn[0] * off, stC.z + stC.tz * al + tn[1] * off, tn[0] * (off > 0 ? -1 : 1), tn[1] * (off > 0 ? -1 : 1), false);
      }
      L.houses.items = placed;
    }

    /* ------------------------------------------------ the track */
    function buildTrack() {
      const pos = [], col = [], idx = [];
      const C = hex => { const c = new T.Color(hex); return [c.r, c.g, c.b]; };
      const XM = half - 1.5;                                          // nothing crosses the board's north or south edge
      const quad = (a, b, c, d, color) => { const n = pos.length / 3; [a, b, c, d].forEach(v => { pos.push(Math.max(-XM, Math.min(XM, v[0])), v[1], v[2]); col.push(color[0], color[1], color[2]); }); idx.push(n, n + 1, n + 2, n, n + 2, n + 3); };
      const tape = () => 1;
      const ballast = C(0xCBC4B2), edge = C(0x9E9984), sleeper = C(0x6C5B48), railTop = C(0x8E9692), railSide = C(0x3C423F);
      const bank = [C(0xB4AB93), C(0xA9A58C)], bankEnd = C(0x9C9C82);
      const wob = [C(0xCBC4B2), C(0xC4BDAA)];
      const prev = {};
      const strip = (name, i, off, wd, y, color) => {
        const f = tape(i * STEP), o = off * f, w = wd * f;
        const a = [P[i].x - tz[i] * (o - w / 2), y, P[i].z + tx[i] * (o - w / 2)], b = [P[i].x - tz[i] * (o + w / 2), y, P[i].z + tx[i] * (o + w / 2)];
        const pv = prev[name]; prev[name] = [a, b];
        if (pv) quad(pv[0], pv[1], b, a, color);
      };
      for (let i = I0; i < N; i++) {
        const y = yb[i];
        strip("b", i, 0, 64 * SC, y, wob[(i >> 1) & 1]);
        strip("e1", i, 31 * SC, 5 * SC, y + 0.15, edge); strip("e2", i, -31 * SC, 5 * SC, y + 0.15, edge);
        for (const s of [-1, 1]) strip("rt" + s, i, s * 13 * SC, 4.6 * SC, y + 4.6 * SC, railTop);   // two rails
      }
      // the embankment: from each shoulder the slope runs down to the terrain and stops where it meets it
      const SLOPE = 0.7, SK = 28, KMAX = 7, EDGE = 33.5 * SC;
      const endRows = [], endRows2 = [];
      for (const s of [-1, 1]) {
        let pv = null;
        for (let i = I0; i < N; i++) {
          const f = tape(i * STEP), nx = -tz[i] * s, nz = tx[i] * s, row = [];
          const base = yb[i] - 0.4;
          let o = EDGE * f, y = base, tt = gH(P[i].x + nx * o, P[i].z + nz * o), hit = false;
          row.push([P[i].x + nx * o, y, P[i].z + nz * o]);
          for (let k = 1; k <= KMAX; k++) {
            if (hit) { row.push(row[row.length - 1]); continue; }
            const o2 = o + SK * f, ys = base - SLOPE * SK * k * f, t2 = gH(P[i].x + nx * o2, P[i].z + nz * o2);
            const g0 = y - tt, g1 = ys - t2;
            if (g1 <= 0.5 || f < 0.05) {                         // meets the ground here: end the bank in a thin line, a touch below the surface
              const fr = g0 / Math.max(1e-6, g0 - g1), oo = o + SK * f * Math.max(0, Math.min(1, fr)), yy = y + (ys - y) * Math.max(0, Math.min(1, fr));
              row.push([P[i].x + nx * oo, yy - 0.6, P[i].z + nz * oo]); hit = true; continue;
            }
            row.push([P[i].x + nx * o2, ys, P[i].z + nz * o2]); o = o2; y = ys; tt = t2;
          }
          if (!hit) { const last = row[row.length - 1]; row[row.length - 1] = [last[0], Math.min(last[1], tt - 0.6), last[2]]; }
          if (pv) for (let k = 0; k < row.length - 1; k++) quad(pv[k], pv[k + 1], row[k + 1], row[k], k === row.length - 2 ? bankEnd : bank[(i >> 1) & 1]);
          if (i === I0) endRows.push(row);
          if (i === N - 1) endRows2.push(row);
          pv = row;
        }
      }
      for (let k = 0; k < Math.min(endRows[0].length, endRows[1].length) - 1; k++)           // the square ends of the bed, at the board's edges
        quad(endRows[0][k], endRows[0][k + 1], endRows[1][k + 1], endRows[1][k], bank[0]);
      for (let k = 0; k < Math.min(endRows2[0].length, endRows2[1].length) - 1; k++)
        quad(endRows2[0][k], endRows2[0][k + 1], endRows2[1][k + 1], endRows2[1][k], bank[0]);
      // rail sides as upright quads, sleepers as flat quads
      for (let i = I0; i < N - 1; i++) {
        const f = tape(i * STEP); if (f < 0.02) continue;
        const y = yb[i], y1 = yb[i + 1];
        for (const s of [-1, 1]) for (const e of [-2.3, 2.3]) {
          const o = (s * 13 + e) * SC * f, ax = P[i].x - tz[i] * o, az = P[i].z + tx[i] * o, bx = P[i + 1].x - tz[i + 1] * o, bz = P[i + 1].z + tx[i + 1] * o;
          quad([ax, y + 0.8 * SC, az], [bx, y1 + 0.8 * SC, bz], [bx, y1 + 4.6 * SC, bz], [ax, y + 4.6 * SC, az], railSide);
        }
      }
      const SL = 22 * SC;
      for (let u = Math.max(SL / 2, I0 * STEP); u < S - SL / 2; u += SL) {
        const p = at(u), f = tape(u); if (f < 0.05) continue;
        const nx = -p.tz, nz = p.tx, hl = 25 * SC * f, hw = 3.4 * SC * f, y = p.y + 0.9 * SC;
        const A = [p.x - nx * hl - p.tx * hw, y, p.z - nz * hl - p.tz * hw], B = [p.x + nx * hl - p.tx * hw, y, p.z + nz * hl - p.tz * hw];
        const Cc = [p.x + nx * hl + p.tx * hw, y, p.z + nz * hl + p.tz * hw], D = [p.x - nx * hl + p.tx * hw, y, p.z - nz * hl + p.tz * hw];
        quad(A, B, Cc, D, sleeper);
      }
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new T.Float32BufferAttribute(col, 3));
      g.setIndex(idx); g.computeVertexNormals();
      const m = new T.MeshLambertMaterial({ vertexColors: true, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 });
      const mesh = noRay(new T.Mesh(g, m)); mesh.name = "track"; mesh.renderOrder = 1;
      return mesh;
    }

/* ------------------------------------------------ trains */
    const tpl = {}; let parked = null;
    const inkFrag = `uniform vec3 uColor; uniform float uAlpha; void main() { gl_FragColor = vec4(uColor, uAlpha); }`;
    function makeTrain(livery) {
      const tr = { group: new T.Group(), cars: [], bodyMats: [], inkMats: [], alpha: 1 };
      const om = K.outlineMaterial;
      const ink = new T.ShaderMaterial({ uniforms: Object.assign({}, om.uniforms, { uAlpha: { value: 1 } }), vertexShader: om.vertexShader, fragmentShader: inkFrag, side: T.BackSide, transparent: true });
      tr.inkMats.push(ink);
      for (let c = 0; c < 2; c++) {
        const car = tpl[livery].clone(true); car.rotation.order = "YZX";
        car.traverse(o => { if (!o.isMesh) return; noRay(o); if (o.name === "ink") o.material = ink; else if (o.name === "body") { o.material = o.material.clone(); tr.bodyMats.push(o.material); } });
        tr.group.add(car); tr.cars.push(car);
      }
      tr.group.visible = false; return tr;
    }
    function setAlpha(tr, a) {
      if (a === tr.alpha) return; tr.alpha = a;
      tr.bodyMats.forEach(m => { m.transparent = a < 0.999; m.opacity = a; m.needsUpdate = true; });
      tr.inkMats.forEach(m => { m.uniforms.uAlpha.value = a; });
    }
    // c = the train's centre, in metres along the line from the north edge; face = which way its nose points (+1 south, -1 north)
    function place(tr, c, face) {
      for (let k = 0; k < 2; k++) {
        const ctr = c + (k - 0.5) * (CAR.len + CAR.gap);
        const f = at(ctr + face * 62 * SC), b = at(ctr - face * 62 * SC);
        const fx = f.x - b.x, fz = f.z - b.z, fy = f.y - b.y, hl = Math.hypot(fx, fz) || 1;
        const car = tr.cars[k];
        car.position.set((f.x + b.x) / 2, (f.y + b.y) / 2 + 4.7 * SC, (f.z + b.z) / 2);
        car.rotation.set(0, Math.atan2(-fz, fx), Math.atan2(fy, hl));
      }
    }

    /* ------------------------------------------------ the timetable (v17.13): two trains, running at the same time, each stopping at every station on its run
       - the Shinano train comes in from the left border (the south edge, towards Nagano), stops at Kurohime, then at Myoko-Kogen, waits,
         turns round, stops at Kurohime again and runs off the left border;
       - the Echigo Tokimeki train stands at the Myoko-Kogen platform, then stops at Sekiyama, Nihongi and Arai on its way to the
         right-hand (north) border, where it vanishes.
       The Echigo train leaves while the Shinano train is still on its way in, so the platform is clear when it arrives. */
    const rnd = () => Math.random();
    const uSouth = () => Math.max(uSt + 2000, S - TRAIN_LEN * 0.5), uNorth = () => Math.min(uSt - 2000, TRAIN_LEN * 0.5);   // where a train appears or vanishes
    const northStops = [STN.sekiyama, STN.nihongi, STN.arai].sort((p, q) => q.u - p.u);                                   // in the order the Echigo train meets them
    const smoothStep = x => smooth(Math.max(0, Math.min(1, x)));
    // wp: where to stop (u = metres from the north edge), dwell seconds there, face = which way the nose points afterwards (+1 south, -1 north); a waypoint with exit: true is a border, where the train vanishes
    const lines = [
      { key: "shinano", livery: "shinano", tr: null, a: null, plan: () => [
          { u: STN.kurohime.u, dwell: 5, face: -1 }, { u: uSt, dwell: DWELL, face: 1 }, { u: STN.kurohime.u, dwell: 4, face: 1 }, { u: uSouth(), exit: true, face: 1 }] },
      { key: "echigo", livery: "echigo", tr: null, a: null, plan: () => [
          { u: uSt, dwell: 3.2, face: -1, appear: true }].concat(northStops.map((st, i) => ({ u: st.u, dwell: i === northStops.length - 1 ? 6 : 4.5, face: -1 })), [{ u: uNorth(), exit: true, face: -1 }]) }
    ];
    let cycle = { state: "wait", t: 0 };
    let last = null;
    function update(sec) {
      if (!parked && !lines[0].tr) return;
      if (ctx.reduce && ctx.reduce()) { return; }
      if (last === null) last = sec; const dt = Math.max(0, Math.min(0.1, sec - last)); last = sec;
      if (dt) advance(dt);
    }
    function launch() {                                            // both trains set off together; the Echigo one is already at the platform
      lines.forEach((ln, i) => {
        const wp = ln.plan(), start = i === 0 ? uSouth() : uSt;
        ln.a = { u: start, v: 0, wp, k: 0, state: i === 0 ? "run" : "dwell", t: i === 0 ? 0 : wp[0].dwell, face: i === 0 ? -1 : -1, born: 0, live: true };
        if (i === 0) ln.a.v = VMAX;
        ln.tr.group.visible = true; ln.tr.alpha = -1; place(ln.tr, ln.a.u, ln.a.face);
      });
    }
    function advance(dt) {                                         // one step of the timetable (also used by the tests to run it fast)
      if (!lines[0].tr) return;
      if (cycle.state === "wait") { cycle.t -= dt; if (cycle.t <= 0) { launch(); cycle.state = "go"; } return; }
      lines.forEach(ln => stepTrain(ln, dt));
      if (lines.every(ln => !ln.a || !ln.a.live)) { cycle.state = "wait"; cycle.t = WAIT_MIN + rnd() * (WAIT_MAX - WAIT_MIN); }
    }
    function stepTrain(ln, dt) {
      const a = ln.a; if (!a || !a.live) return;
      a.born += dt;
      const w = a.wp[a.k];
      if (a.state === "dwell") {
        a.t -= dt;
        if (a.t <= 0) { a.face = w.face; a.k++; a.state = "run"; a.v = 0; }
      } else {
        const tgt = a.wp[a.k].u, dist = Math.abs(tgt - a.u), dir = Math.sign(tgt - a.u) || 1;
        a.face = dir;
        a.v = Math.min(VMAX, a.v + ACC * dt, w.exit ? VMAX : Math.max(5, Math.sqrt(2 * ACC * 0.9 * dist)));
        const step = a.v * dt;
        if (dist <= step + 0.5) {
          a.u = tgt; a.v = 0;
          if (w.exit) { ln.tr.group.visible = false; a.live = false; return; }
          a.state = "dwell"; a.t = w.dwell; a.face = w.arrive != null ? w.arrive : dir;
        } else a.u += dir * step;
      }
      const edge = Math.min(a.u - uNorth(), uSouth() - a.u);                                   // fade in and out over the last stretch before a border
      const appear = a.wp[0].appear ? smoothStep(a.born / 1.2) : 1;
      setAlpha(ln.tr, Math.min(smoothStep(edge / FADE), appear));
      place(ln.tr, a.u, a.face);
    }
    const active = () => !!lines[0].tr && !(ctx.reduce && ctx.reduce());

    /* ------------------------------------------------ build everything */
    function build() {
      group.add(buildTrack());
      if (K.has("trainstation")) {
        ALL.forEach(S => {
          const m = K.build("trainstation", { facing: 0 });
          const holder = new T.Group(); holder.position.set(S.C.x, S.C.y, S.C.z);
          holder.rotation.y = Math.atan2(-S.C.tz, S.C.tx); holder.scale.set(SC, SC, SC * S.side);
          holder.add(m); group.add(holder); noRay(m); m.traverse(noRay);
        });
      }
      if (K.has("traincar") && K.has("traincar-echigo")) {
        tpl.shinano = K.build("traincar", { facing: 0 }); tpl.echigo = K.build("traincar-echigo", { facing: 0 });
        lines.forEach(ln => { ln.tr = makeTrain(ln.livery); group.add(ln.tr.group); });
        if (ctx.reduce && ctx.reduce()) { parked = lines[0].tr; parked.group.visible = true; place(parked, uSt, -1); }
        else { cycle.state = "wait"; cycle.t = 1.0; }
      }
      return group;
    }
    const stations = () => ALL.map(S => ({ id: S.id, name: S.name, x: S.C.x, y: S.C.y, z: S.C.z, side: S.side, tx: S.C.tx, tz: S.C.tz }));
    return { prepare, build, update, advance, active, stations, group, info: () => ({ kurohime: STN.kurohime.u, sekiyama: STN.sekiyama.u, wetGap: Math.round(bestGap), shiftM: (c0 - qReal) * STEP, samples: N, length: S, station: uSt, state: cycle.state + ":" + lines.map(l => l.a ? (l.a.live ? l.a.state + "@" + l.a.k : "off") : "-").join("/"), u: lines.map(l => l.a ? Math.round(l.a.u) : null), stops: { shinano: lines[0].plan().map(p => Math.round(p.u)), echigo: lines[1].plan().map(p => Math.round(p.u)) }}), _at: at, _gap: gapTo, _stn: STN };
  }
  return { create };
})();
