/* Naena Falls: a tall, slim white waterfall dropping down a dark rock cliff into a pool,
   with a suspension footbridge crossing the stream below and cedar groves on both sides. Size L. */
MyokoKit.register("naena", function build(kit) {
  const { mat, tone } = kit;
  const g = kit.group();

  // Ground: mossy forest floor
  g.add(kit.ground({ r: 44, irregular: 0.08, mat: mat.rokusho, seed: 7, h: 1.2 }));

  // Cliff: curved wall of large faceted rock and block masses across the back (x: -35..35, z: -18..-40)
  // Rising to ~60 at the centre with a central notch at y ~58 for the waterfall, stepping down to ~35 at the sides
  const darkRock = tone("kawara", -0.35);
  const midRock = tone("kawara", -0.18);

  // Central notch bed behind the waterfall lip
  g.add(kit.box(14, 57, 18, darkRock, { x: 0, y: 1, z: -28, bevel: 0.08 }));
  g.add(kit.path({
    points: [[0, -36], [0, -17]],
    width: 8, y: 58.1, mat: tone("byakugun", 0.5)
  }));

  // Large structural cliff blocks (left and right of the central notch, curving forward at the sides)
  const cliffBlocks = [
    // Inner flank columns next to the notch (rising to 61)
    [-11, 60, 14, 18, -27, darkRock, -0.05],
    [11, 60, 14, 18, -27, darkRock, 0.05],
    // Mid-inner masses (height ~54)
    [-20, 53, 16, 18, -25, midRock, 0.12],
    [20, 53, 16, 18, -25, midRock, -0.12],
    // Outer-mid masses (height ~45)
    [-28, 44, 16, 16, -21, darkRock, 0.22],
    [28, 44, 16, 16, -21, darkRock, -0.22],
    // Side walls curving forward to z -18 (height ~35)
    [-34, 34, 14, 14, -16, midRock, 0.3],
    [34, 34, 14, 14, -16, midRock, -0.3]
  ];
  cliffBlocks.forEach(([x, h, w, d, z, m, ry]) => {
    g.add(kit.box(w, h, d, m, { x, y: 1, z, ry, bevel: 0.12 }));
  });

  // Large overlapping faceted rock masses to give a bold craggy gorge face
  const cliffRocks = [
    [-10, 46, -21, 9, darkRock, [1.0, 1.8, 0.9], 11],
    [10, 46, -21, 9, darkRock, [1.0, 1.8, 0.9], 12],
    [-13, 22, -20, 10, midRock, [1.2, 1.6, 0.9], 13],
    [13, 22, -20, 10, midRock, [1.2, 1.6, 0.9], 14],
    [-22, 34, -19, 10, darkRock, [1.2, 1.7, 1.0], 15],
    [22, 34, -19, 10, darkRock, [1.2, 1.7, 1.0], 16],
    [-24, 15, -17, 9, midRock, [1.3, 1.3, 1.0], 17],
    [24, 15, -17, 9, midRock, [1.3, 1.3, 1.0], 18],
    [-32, 22, -14, 9, darkRock, [1.2, 1.5, 1.1], 19],
    [32, 22, -14, 9, darkRock, [1.2, 1.5, 1.1], 20]
  ];
  cliffRocks.forEach(([x, y, z, r, m, s, seed]) => {
    g.add(kit.rock(r, { x, y, z, mat: m, s, seed }));
  });

  // Mossy tops in rokusho crowning the cliff shoulders
  const mossCaps = [
    [-11, 61.2, -27, 14, 16, -0.05],
    [11, 61.2, -27, 14, 16, 0.05],
    [-20, 54.2, -25, 16, 16, 0.12],
    [20, 54.2, -25, 16, 16, -0.12],
    [-28, 45.2, -21, 15, 15, 0.22],
    [28, 45.2, -21, 15, 15, -0.22],
    [-34, 35.2, -16, 13, 13, 0.3],
    [34, 35.2, -16, 13, 13, -0.3]
  ];
  mossCaps.forEach(([x, y, z, w, d, ry]) => {
    g.add(kit.box(w, 2.2, d, mat.rokusho, { x, y, z, ry, bevel: 0.2 }));
  });

  // Gorge side ledges to support the side footbridge towers at y ~8
  g.add(kit.box(14, 7.2, 12, midRock, { x: -21, y: 1, z: 20, bevel: 0.15 }));
  g.add(kit.box(14, 7.2, 12, midRock, { x: 21, y: 1, z: 20, bevel: 0.15 }));
  g.add(kit.box(12, 1.2, 10, mat.rokusho, { x: -21, y: 8.0, z: 20, bevel: 0.2 }));
  g.add(kit.box(12, 1.2, 10, mat.rokusho, { x: 21, y: 8.0, z: 20, bevel: 0.2 }));

  // Pool: irregular pool about 30 wide and 18 deep at the foot of the fall (z: -19 to -1)
  const waterMat = tone("byakugun", -0.1);
  const poolOutline = [
    [-12, -19], [12, -19], [15, -13], [15, -6],
    [10, -1], [-10, -1], [-15, -6], [-15, -13]
  ];
  g.add(kit.water({ outline: poolOutline, y: 1.4, mat: waterMat }));

  // Stream: flowing forward from the pool to the front edge, width 7 narrowing to 5
  g.add(kit.path({
    points: [[0, -2], [-1, 8], [1, 19], [0, 31], [0, 43]],
    width: f => 7 - 2 * f,
    y: 1.3,
    mat: waterMat
  }));

  // Small rocks along the stream and pool edge
  const streamRocks = [
    [-14, 1.6, -5, 2.6, 31], [14, 1.6, -5, 2.8, 32],
    [-6, 1.4, 3, 2.0, 33], [5, 1.4, 6, 1.8, 34],
    [-5, 1.4, 13, 2.2, 35], [5, 1.4, 15, 1.7, 36],
    [-4.5, 1.4, 27, 1.9, 37], [4.5, 1.4, 30, 2.1, 38],
    [-4, 1.4, 37, 1.6, 39], [4, 1.4, 39, 1.8, 40]
  ];
  streamRocks.forEach(([x, y, z, r, seed]) => {
    g.add(kit.rock(r, { x, y, z, seed, mat: seed % 2 ? midRock : darkRock }));
  });

  // Waterfall: ONE tall, slim ribbon from the notch (y 58) to the pool (y 2) at z -16, facing +Z
  // About 8 wide at the top and 10 at the bottom, built from three thin vertical slabs
  const edgeWater = tone("byakugun", 0.5);
  // Outer edge slabs (slightly wider at bottom via two-tier overlap + gentle side splay)
  g.add(kit.box(2.4, 56, 1.4, edgeWater, { x: -3.2, y: 2, z: -16.3, rz: -0.018, bevel: 0.15 }));
  g.add(kit.box(2.4, 56, 1.4, edgeWater, { x: 3.2, y: 2, z: -16.3, rz: 0.018, bevel: 0.15 }));
  // Bright central core slab in gofun (6.2 wide at top, 7.6 wide on lower half)
  g.add(kit.box(6.2, 56.2, 1.8, mat.gofun, { x: 0, y: 2, z: -16.0, bevel: 0.15 }));
  g.add(kit.box(7.6, 34.0, 1.7, mat.gofun, { x: 0, y: 2, z: -16.05, bevel: 0.15 }));
  // Rounded crest lip at y 58 curving out of the notch
  g.add(kit.box(6.6, 2.0, 3.6, mat.gofun, { x: 0, y: 56.5, z: -17.0, bevel: 0.25 }));

  // Pale foam cluster of 5 soft mat.gofun blobs where the water lands (y ~2, z -15)
  const foamCluster = [
    [0, 2.2, -14.5, 3.2, 41],
    [-3.4, 1.9, -14.8, 2.5, 42],
    [3.4, 1.9, -14.8, 2.5, 43],
    [-1.8, 1.8, -12.8, 2.2, 44],
    [1.8, 1.8, -12.8, 2.2, 45]
  ];
  foamCluster.forEach(([x, y, z, r, seed]) => {
    g.add(kit.blob(r, mat.gofun, { x, y, z, seed, detail: 1, jitter: 0.1, s: [1.2, 0.65, 1.1] }));
  });

  // Optional moving part: 3 thin mat.gofun streaks sliding down the ribbon at ~5 units/sec
  const streaks = [];
  const streakSpecs = [
    { x: -1.6, len: 8.5, offset: 0 },
    { x: 0.2, len: 10.0, offset: 16 },
    { x: 1.7, len: 8.0, offset: 32 }
  ];
  streakSpecs.forEach(s => {
    const m = kit.keep(kit.box(1.1, s.len, 0.6, mat.gofun, { x: s.x, y: 30, z: -14.9, bevel: 0.2 }));
    m.userData.spec = s;
    streaks.push(m);
    g.add(m);
  });

  // Suspension footbridge across the stream at z +20, span 32 along X, walking deck at y ~8
  const bridgeZ = 20;
  const span = 32;
  const endY = 8.8;
  const sagDepth = 1.0;

  // Two small timber posts at each end in hinoki
  [-span / 2, span / 2].forEach(x => {
    [-1.6, 1.6].forEach(dz => {
      g.add(kit.box(1.1, 5.2, 1.1, mat.hinoki, { x, y: 8.0, z: bridgeZ + dz, bevel: 0.08 }));
    });
    g.add(kit.box(1.2, 0.8, 4.2, tone("hinoki", -0.2), { x, y: 12.6, z: bridgeZ, bevel: 0.08 }));
  });

  // Thin hinoki deck made of 9 short kit.box planks following the sag
  const numPlanks = 9;
  const plankLen = (span - 2) / numPlanks;
  for (let i = 0; i < numPlanks; i++) {
    const f = (i + 0.5) / numPlanks;
    const px = -span / 2 + 1 + f * (span - 2);
    const py = endY - Math.sin(Math.PI * f) * sagDepth;
    const slope = (Math.PI * sagDepth / (span - 2)) * Math.cos(Math.PI * f);
    g.add(kit.box(plankLen - 0.25, 0.5, 3.2, mat.hinoki, {
      x: px, y: py, z: bridgeZ, rz: -slope, bevel: 0.08
    }));
  }

  // Two hand cables + two deck support cables with gentle sag
  [-1.5, 1.5].forEach(dz => {
    g.add(kit.cable(
      [-span / 2, 12.3, bridgeZ + dz],
      [span / 2, 12.3, bridgeZ + dz],
      { sag: 0.055, r: 0.2, mat: mat.sumi }
    ));
    g.add(kit.cable(
      [-span / 2, endY, bridgeZ + dz],
      [span / 2, endY, bridgeZ + dz],
      { sag: sagDepth / span, r: 0.14, mat: tone("hinoki", -0.25) }
    ));
  });

  // Trees: dense cedar groves (with a few broadleafs) on both sides of the gorge and at the front corners
  g.add(kit.grove({ x: -29, z: -17, r: 5, count: 5, kinds: ["cedar"], h: 36, seed: 51 }));
  g.add(kit.grove({ x: -31, z: -5, r: 5, count: 4, kinds: ["cedar"], h: 33, seed: 52 }));
  g.add(kit.grove({ x: 29, z: -17, r: 5, count: 5, kinds: ["cedar"], h: 36, seed: 53 }));
  g.add(kit.grove({ x: 31, z: -5, r: 5, count: 4, kinds: ["cedar"], h: 33, seed: 54 }));

  // Front corner trees framing the view without blocking the bridge or waterfall
  g.add(kit.tree.cedar(32, { x: -34, z: 12, seed: 61 }));
  g.add(kit.tree.broadleaf(24, { x: -27, z: 24, seed: 62 }));
  g.add(kit.tree.cedar(32, { x: 34, z: 12, seed: 63 }));
  g.add(kit.tree.broadleaf(24, { x: 27, z: 24, seed: 64 }));

  // Slow downward sliding streaks along the waterfall ribbon (~5 units/sec)
  g.userData.animate = function (t) {
    const travel = 46; // from y=50 down to y=4
    for (let i = 0; i < streaks.length; i++) {
      const m = streaks[i];
      const d = (t * 5 + m.userData.spec.offset) % travel;
      m.position.y = 50 - d;
    }
  };

  return g;
});