/* Mt Madarao sightseeing chairlift and summit hike: a smooth green meadow slope rising toward the back,
   a chairlift line with T-pylons, cables, chairs and two riders between timber stations, and a zigzagging
   hiking trail with two hikers framed by side groves. Size L. */
MyokoKit.register("madarao", function build(kit) {
  const { mat, tone } = kit;
  const g = kit.group();

  // Ground: meadow lawn patch
  g.add(kit.ground({ r: 44, irregular: 0.08, mat: mat.byakuroku, seed: 11, h: 1.2 }));

  // Hill: 3 large overlapping smooth kit.blob shapes (no facets) rising continuously from front (y ~2) to back (y ~36 at z = -30)
  const hillDefs = [
    // Lower apron across the front-mid
    { r: 28, mat: mat.byakuroku, x: 0, y: 0.5, z: 10, s: [1.35, 0.45, 1.05], seed: 21, jitter: 0.04 },
    // Mid-slope body in moegi
    { r: 29, mat: mat.moegi, x: 1, y: 6.5, z: -8, s: [1.25, 0.65, 1.0], seed: 22, jitter: 0.04 },
    // Upper summit dome reaching y ~36.4 at z = -26..-30
    { r: 25, mat: tone("moegi", 0.1), x: 2, y: 14.5, z: -25, s: [1.18, 0.88, 0.92], seed: 23, jitter: 0.04 }
  ];

  hillDefs.forEach(d => {
    g.add(kit.blob(d.r, d.mat, {
      x: d.x, y: d.y, z: d.z,
      seed: d.seed, detail: 2, jitter: d.jitter,
      s: d.s
    }));
  });

  // Helper to evaluate the approximate surface height of the overlapping smooth blobs at (x, z)
  function hillY(x, z) {
    let maxY = 1.2;
    for (let i = 0; i < hillDefs.length; i++) {
      const b = hillDefs[i];
      const dx = (x - b.x) / (b.r * b.s[0]);
      const dz = (z - b.z) / (b.r * b.s[2]);
      const d2 = dx * dx + dz * dz;
      if (d2 < 1) {
        const y = b.y + b.r * b.s[1] * Math.sqrt(1 - d2);
        if (y > maxY) maxY = y;
      }
    }
    return maxY;
  }

  // Chairlift alignment: straight line from bottom station (-14, +30) to top station (+4, -28)
  const botX = -14, botZ = 30;
  const topX = 4, topZ = -28;
  const liftAngle = Math.atan2(topX - botX, topZ - botZ); // ~ +2.84 rad, facing up the hill

  // Helper for bottom and top timber stations (about 10 wide, hinoki walls, kawara gable roof)
  function buildStation(x, y, z) {
    const st = kit.group({ x, y, z, ry: liftAngle });
    const stone = tone("kawara", 0.25);
    const darkWood = tone("hinoki", -0.25);
    // Stone foundation embedded into the slope so nothing floats
    st.add(kit.box(10.6, 5.0, 11.6, stone, { y: -3.8, bevel: 0.08 }));
    // Timber deck and side walls
    st.add(kit.box(10.0, 0.8, 11.0, darkWood, { y: 1.0, bevel: 0.06 }));
    st.add(kit.box(1.2, 6.2, 10.0, mat.hinoki, { x: -4.1, y: 1.8, bevel: 0.05 }));
    st.add(kit.box(1.2, 6.2, 10.0, mat.hinoki, { x: 4.1, y: 1.8, bevel: 0.05 }));
    st.add(kit.box(8.8, 2.5, 9.8, darkWood, { y: 5.5, bevel: 0.05 }));
    // Bullwheel housing under the roof
    st.add(kit.cyl(3.2, 3.2, 0.8, tone("kawara", -0.2), { y: 5.0, segments: 12 }));
    // Gable roof in kawara (ridge along the lift line)
    st.add(kit.roof({
      w: 11.2, d: 10.2, h: 4.4, overhang: 1.4,
      style: "gable", thickness: 0.6,
      mat: mat.kawara, gableMat: mat.hinoki,
      y: 7.8, ry: Math.PI / 2
    }));
    return st;
  }

  const botGroundY = hillY(botX, botZ);
  const topGroundY = hillY(topX, topZ);
  g.add(buildStation(botX, botGroundY, botZ));
  g.add(buildStation(topX, topGroundY, topZ));

  // 5 slim T-shaped pylons along the line in tone("kawara", -0.2), each ~12 tall above the hill surface
  const pylonMat = tone("kawara", -0.2);
  const pylonDark = tone("kawara", -0.35);
  const pylonFracs = [0.15, 0.32, 0.50, 0.68, 0.85];
  const cableWaypoints = [];

  // Start point at bottom station bullwheel
  cableWaypoints.push({ x: botX, y: botGroundY + 6.4, z: botZ });

  pylonFracs.forEach(f => {
    const px = botX + (topX - botX) * f;
    const pz = botZ + (topZ - botZ) * f;
    const py = hillY(px, pz);
    const topY = py + 11.8;

    const pylon = kit.group({ x: px, y: py, z: pz, ry: liftAngle });
    // Concrete base pad embedded in the slope
    pylon.add(kit.box(2.4, 3.5, 2.4, tone("kawara", 0.2), { y: -2.5, bevel: 0.1 }));
    // Vertical mast (~12 tall)
    pylon.add(kit.cyl(0.65, 0.85, 11.8, pylonMat, { y: 0, segments: 8 }));
    // T-crossarm (width 6.8 across the lift line)
    pylon.add(kit.box(6.8, 0.85, 0.9, pylonMat, { y: 11.2, bevel: 0.08 }));
    // Sheave assembly rollers at each end of the crossarm
    [-2.7, 2.7].forEach(cx => {
      pylon.add(kit.box(0.6, 0.7, 2.2, pylonDark, { x: cx, y: 10.7, bevel: 0.05 }));
    });
    g.add(pylon);

    cableWaypoints.push({ x: px, y: topY - 0.3, z: pz });
  });

  // End point at top station bullwheel
  cableWaypoints.push({ x: topX, y: topGroundY + 6.4, z: topZ });

  // Unit vector perpendicular to the lift line in XZ (for left/right parallel cables)
  const dirX = topX - botX, dirZ = topZ - botZ;
  const dirLen = Math.hypot(dirX, dirZ);
  const perpX = -dirZ / dirLen; // points right (+X/+Z side)
  const perpZ = dirX / dirLen;
  const halfGauge = 2.7;

  // Two parallel cables (r 0.35, mat sumi) connecting station to pylons to top station
  for (let i = 0; i < cableWaypoints.length - 1; i++) {
    const a = cableWaypoints[i];
    const b = cableWaypoints[i + 1];
    [-1, 1].forEach(side => {
      const ox = side * halfGauge * perpX;
      const oz = side * halfGauge * perpZ;
      g.add(kit.cable(
        [a.x + ox, a.y, a.z + oz],
        [b.x + ox, b.y, b.z + oz],
        { sag: 0.015, r: 0.35, mat: mat.sumi }
      ));
    });
  }

  // Helper to interpolate cable height at fraction f along the lift line
  function cableYAt(f) {
    const fracs = [0, ...pylonFracs, 1];
    for (let i = 0; i < fracs.length - 1; i++) {
      if (f >= fracs[i] && f <= fracs[i + 1]) {
        const t = (f - fracs[i]) / (fracs[i + 1] - fracs[i]);
        const ya = cableWaypoints[i].y;
        const yb = cableWaypoints[i + 1].y;
        return ya + (yb - ya) * t - Math.sin(Math.PI * t) * 0.25;
      }
    }
    return cableWaypoints[0].y;
  }

  // 7 chairs hanging from the cables (4 ascending on right side with 2 riders, 3 descending on left side)
  const chairSpecs = [
    { f: 0.23, side: 1, riderCoat: "shu" },    // ascending chair with shu rider (single shu accent)
    { f: 0.41, side: 1, riderCoat: null },
    { f: 0.59, side: 1, riderCoat: "gunjo" },  // ascending chair with gunjo rider
    { f: 0.77, side: 1, riderCoat: null },
    { f: 0.26, side: -1, riderCoat: null },    // descending empty chairs
    { f: 0.52, side: -1, riderCoat: null },
    { f: 0.75, side: -1, riderCoat: null }
  ];

  chairSpecs.forEach(cs => {
    const cx = botX + (topX - botX) * cs.f + cs.side * halfGauge * perpX;
    const cz = botZ + (topZ - botZ) * cs.f + cs.side * halfGauge * perpZ;
    const cy = cableYAt(cs.f);
    const facing = cs.side === 1 ? liftAngle : liftAngle + Math.PI;

    const ch = kit.group({ x: cx, y: cy, z: cz, ry: facing });
    // Thin hanger rod from cable down to chair frame
    ch.add(kit.cyl(0.14, 0.14, 3.6, mat.sumi, { y: -3.6, segments: 6 }));
    ch.add(kit.box(2.8, 0.25, 0.25, mat.sumi, { y: -1.8, bevel: 0 }));
    // Small hinoki bench seat and backrest
    ch.add(kit.box(2.8, 0.4, 1.5, mat.hinoki, { y: -3.6, bevel: 0.08 }));
    ch.add(kit.box(2.8, 1.4, 0.35, tone("hinoki", -0.15), { y: -3.3, z: -0.6, bevel: 0.08 }));

    if (cs.riderCoat) {
      ch.add(kit.person({
        pose: "sit", coat: cs.riderCoat, h: 7,
        y: -3.3, z: 0.1
      }));
    }
    g.add(ch);
  });

  // Winding hiking trail: tonoko kit.path (width 2.5) zigzagging up the right side of the hill to the top station
  const rawTrailXZ = [
    [10, 34], [16, 28], [22, 21], [24, 15],
    [18, 10], [11, 5], [14, -1], [21, -6],
    [22, -12], [16, -17], [10, -22], [7, -26]
  ];

  // Build elevated 3D trail segments so every point follows the curved hill surface cleanly
  for (let i = 0; i < rawTrailXZ.length - 1; i++) {
    const [x1, z1] = rawTrailXZ[i];
    const [x2, z2] = rawTrailXZ[i + 1];
    const steps = 4;
    for (let s = 0; s < steps; s++) {
      const f0 = s / steps, f1 = (s + 1) / steps, fm = (f0 + f1) / 2;
      const sx = x1 + (x2 - x1) * fm;
      const sz = z1 + (z2 - z1) * fm;
      const y0 = hillY(x1 + (x2 - x1) * f0, z1 + (z2 - z1) * f0);
      const y1 = hillY(x1 + (x2 - x1) * f1, z1 + (z2 - z1) * f1);
      const sy = (y0 + y1) / 2;
      const segLen = Math.hypot(x2 - x1, z2 - z1) / steps;
      const yaw = Math.atan2(x2 - x1, z2 - z1);
      const pitch = Math.atan2(y1 - y0, segLen);

      const seg = kit.group({ x: sx, y: sy, z: sz, ry: yaw });
      seg.add(kit.box(2.5, 0.8, segLen + 0.7, mat.tonoko, { y: -0.25, rx: -pitch, bevel: 0.15 }));
      g.add(seg);
    }
  }

  // Two hikers walking up the trail (kit.person pose "walk", h 7, hat "kuchiba")
  const hiker1X = 19, hiker1Z = 14;
  g.add(kit.person({
    pose: "walk", coat: "gunjo", hat: "kuchiba", h: 7,
    x: hiker1X, y: hillY(hiker1X, hiker1Z) - 0.1, z: hiker1Z,
    ry: -2.4
  }));

  const hiker2X = 18, hiker2Z = -4;
  g.add(kit.person({
    pose: "walk", coat: "rokusho", hat: "kuchiba", h: 7,
    x: hiker2X, y: hillY(hiker2X, hiker2Z) - 0.1, z: hiker2Z,
    ry: 2.5
  }));

  // Trees: cedar and broadleaf groves along the left and right edges and around the bottom station, clear of lift and trail
  // Left flank trees (west of the lift line)
  const leftTrees = [
    { kind: "cedar", h: 25, x: -30, z: 24, seed: 41 },
    { kind: "broadleaf", h: 19, x: -26, z: 32, seed: 42 },
    { kind: "cedar", h: 27, x: -33, z: 12, seed: 43 },
    { kind: "broadleaf", h: 21, x: -27, z: 4, seed: 44 },
    { kind: "cedar", h: 28, x: -31, z: -6, seed: 45 },
    { kind: "cedar", h: 26, x: -24, z: -15, seed: 46 },
    { kind: "broadleaf", h: 20, x: -19, z: -23, seed: 47 },
    { kind: "cedar", h: 24, x: -13, z: -29, seed: 48 }
  ];
  // Right flank trees (east of the hiking trail)
  const rightTrees = [
    { kind: "broadleaf", h: 19, x: 29, z: 27, seed: 51 },
    { kind: "cedar", h: 25, x: 34, z: 18, seed: 52 },
    { kind: "cedar", h: 27, x: 35, z: 6, seed: 53 },
    { kind: "broadleaf", h: 20, x: 32, z: -4, seed: 54 },
    { kind: "cedar", h: 26, x: 30, z: -15, seed: 55 },
    { kind: "cedar", h: 24, x: 23, z: -24, seed: 56 },
    { kind: "broadleaf", h: 18, x: -2, z: 35, seed: 57 }
  ];

  [...leftTrees, ...rightTrees].forEach(t => {
    const ty = hillY(t.x, t.z) - 0.6;
    g.add(kit.tree[t.kind](t.h, { x: t.x, y: ty, z: t.z, seed: t.seed }));
  });

  return g;
});