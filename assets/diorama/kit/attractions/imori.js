/* Imori-ike: an irregular natural kidney-shaped pond with a thin pale shoreline, a timber boardwalk
   along the front and left shore only, reed clusters, lily pads, white birches, and the low visitor centre. Size M. */
MyokoKit.register("imori", function build(kit) {
  const { mat, tone } = kit;
  const g = kit.group();

  // Ground: meadow lawn patch
  g.add(kit.ground({ r: 44, irregular: 0.08, mat: mat.byakuroku, seed: 16, h: 1.2 }));

  // Pond: irregular, natural kidney shape (~58 wide along X, ~34 deep along Z, centred around z = +4)
  const pondOutline = [
    [-29, 4], [-28, 12], [-22, 18], [-12, 21], [-2, 19],
    [8, 21], [19, 20], [27, 15], [29, 7], [27, -2],
    [21, -9], [11, -12], [1, -9], [-8, -13], [-19, -12],
    [-26, -6], [-29, 0]
  ];
  g.add(kit.water({ outline: pondOutline, y: 1.3, mat: tone("gunjo", 0.25) }));

  // Thin pale shoreline following the pond perimeter
  const shorePoints = [...pondOutline, pondOutline[0]];
  g.add(kit.path({
    points: shorePoints,
    width: 1.2,
    y: 1.42,
    mat: tone("byakugun", 0.3)
  }));

  // Subtle earth path connecting the back-left end of the boardwalk toward the visitor centre
  g.add(kit.path({
    points: [[-20, -13], [-10, -17], [2, -20], [12, -19]],
    width: 2.6,
    y: 1.24,
    mat: mat.tonoko
  }));

  // Boardwalk: thin timber walkway (width 3.5, y 1.9, mat hinoki) along the FRONT shore and up the LEFT side only (~1/2 way round)
  const bwWaypoints = [
    [16, 20.5], [7, 21.2], [-2, 19.6], [-11, 21.2],
    [-20, 18.8], [-27, 13.0], [-29.5, 4.5], [-27.5, -4.5], [-21, -11.5]
  ];

  // Interpolate evenly spaced planks along the curve and place tiny support posts underneath
  const postMat = tone("hinoki", -0.25);
  let postCounter = 0;
  for (let i = 0; i < bwWaypoints.length - 1; i++) {
    const [x1, z1] = bwWaypoints[i];
    const [x2, z2] = bwWaypoints[i + 1];
    const segLen = Math.hypot(x2 - x1, z2 - z1);
    const steps = Math.max(2, Math.round(segLen / 2.2));
    const ang = Math.atan2(x2 - x1, z2 - z1);

    for (let s = 0; s < steps; s++) {
      const f = (s + 0.5) / steps;
      const px = x1 + (x2 - x1) * f;
      const pz = z1 + (z2 - z1) * f;
      const plankLen = (segLen / steps) * 0.86;

      // Short plank (width 3.5 across path, thin 0.35 height, top at y = 1.9)
      g.add(kit.box(3.5, 0.35, plankLen, mat.hinoki, {
        x: px, y: 1.55, z: pz, ry: ang, bevel: 0.08
      }));

      // Tiny support posts under every second plank
      if (postCounter % 2 === 0) {
        const nx = Math.cos(ang) * 1.3;
        const nz = -Math.sin(ang) * 1.3;
        g.add(kit.box(0.4, 0.7, 0.4, postMat, { x: px + nx, y: 1.0, z: pz + nz, bevel: 0 }));
        g.add(kit.box(0.4, 0.7, 0.4, postMat, { x: px - nx, y: 1.0, z: pz - nz, bevel: 0 }));
      }
      postCounter++;
    }
  }

  // Small viewing spur jutting slightly into the pond on the front-left curve (like in style-imori.jpg)
  const spur = kit.group({ x: -12, y: 1.55, z: 18.2, ry: 0.2 });
  spur.add(kit.box(4.2, 0.35, 3.6, mat.hinoki, { y: 0, bevel: 0.08 }));
  spur.add(kit.box(0.4, 0.7, 0.4, postMat, { x: -1.6, y: -0.55, z: -1.4, bevel: 0 }));
  spur.add(kit.box(0.4, 0.7, 0.4, postMat, { x: 1.6, y: -0.55, z: -1.4, bevel: 0 }));
  g.add(spur);

  // Reeds: 6 clusters of thin, tall cones (r 0.5, h 4 to 6) in moegi and kuchiba at the shore edges
  const reedClusters = [
    { x: -21, z: 15.5, seed: 1 },
    { x: -6, z: 17.8, seed: 2 },
    { x: 19, z: 17.5, seed: 3 },
    { x: 25, z: 4.5, seed: 4 },
    { x: 4, z: -8.5, seed: 5 },
    { x: -15, z: -10.5, seed: 6 }
  ];
  const reedOffsets = [
    [0, 0, 5.5, 0],
    [-0.9, 0.5, 4.6, 1],
    [0.8, 0.4, 5.1, 0],
    [-0.4, -0.8, 4.2, 1],
    [0.6, -0.6, 5.8, 1],
    [1.3, 0.1, 4.4, 0]
  ];
  reedClusters.forEach(c => {
    reedOffsets.forEach(([ox, oz, rh, colIdx], j) => {
      const m = (c.seed + colIdx) % 2 === 0 ? mat.moegi : mat.kuchiba;
      g.add(kit.cone(0.5, rh, m, {
        x: c.x + ox,
        y: 1.25,
        z: c.z + oz,
        segments: 6,
        rz: (j % 2 ? 0.06 : -0.05)
      }));
    });
  });

  // 7 small lily pads (flat moegi discs, r 1.2) floating on the water
  const lilyPads = [
    [-16, 11], [-13.2, 12.6], [-10.5, 10.4],
    [15, 12], [18.2, 10.5],
    [-17, -4.5], [-14.2, -5.8]
  ];
  lilyPads.forEach(([lx, lz], i) => {
    g.add(kit.cyl(1.2, 1.2, 0.12, i % 3 === 0 ? tone("moegi", -0.1) : mat.moegi, {
      x: lx, y: 1.36, z: lz, segments: 10
    }));
  });

  // Visitor centre: at back-right (x = +16, z = -25), long low modern timber building (~30 wide, 12 deep, 8 tall)
  // Positioned and angled slightly so its 30-wide footprint stays cleanly inside the r=44 ground circle
  const vc = kit.group({ x: 15, y: 1.2, z: -24, ry: -0.22 });
  const stoneFoundation = tone("kawara", 0.25);
  const darkWood = tone("hinoki", -0.25);
  const windowBandMat = tone("byakugun", -0.2);

  // Low stone foundation and front timber deck
  vc.add(kit.box(30.6, 0.9, 12.6, stoneFoundation, { y: 0, bevel: 0.08 }));
  vc.add(kit.box(28.0, 0.6, 3.6, tone("hinoki", -0.1), { y: 0.3, z: 7.4, bevel: 0.08 }));

  // Hinoki walls (30 wide, 12 deep, rising to ~6.6 before the sloped roof)
  vc.add(kit.box(30.0, 5.8, 12.0, mat.hinoki, { y: 0.9, bevel: 0.05 }));

  // Wide window band in tone("byakugun", -0.2) across the front and sides
  vc.add(kit.box(26.4, 2.5, 0.4, windowBandMat, { y: 2.5, z: 5.9, bevel: 0.02 }));
  vc.add(kit.box(0.4, 2.5, 8.6, windowBandMat, { x: -14.9, y: 2.5, z: 0, bevel: 0.02 }));
  vc.add(kit.box(0.4, 2.5, 8.6, windowBandMat, { x: 14.9, y: 2.5, z: 0, bevel: 0.02 }));

  // Slim vertical timber mullions along the window band and porch posts under the deep overhang
  [-12, -6, 0, 6, 12].forEach(mx => {
    vc.add(kit.box(0.45, 5.8, 0.55, darkWood, { x: mx, y: 0.9, z: 5.95, bevel: 0.03 }));
    vc.add(kit.box(0.5, 5.4, 0.5, darkWood, { x: mx, y: 0.9, z: 8.2, bevel: 0.04 }));
  });

  // Gently sloped single-pitch kawara roof with a deep overhang (reaches total height ~8.2)
  vc.add(kit.box(34.0, 0.9, 17.6, mat.kawara, {
    y: 6.8, z: 1.0, rx: 0.11, bevel: 0.1
  }));
  vc.add(kit.box(34.4, 0.45, 18.0, tone("kawara", -0.25), {
    y: 6.45, z: 1.0, rx: 0.11, bevel: 0.06
  }));
  g.add(vc);

  // Trees: 5 white birches (h 18 to 24) and 3 broadleaf trees around the back and left; nothing in front of the pond
  g.add(kit.tree.birch(23, { x: -24, y: 1.2, z: -20, seed: 31 }));
  g.add(kit.tree.birch(19, { x: -18, y: 1.2, z: -25, seed: 32 }));
  g.add(kit.tree.birch(21, { x: -8, y: 1.2, z: -27, seed: 33 }));
  g.add(kit.tree.birch(24, { x: -34, y: 1.2, z: -8, seed: 34 }));
  g.add(kit.tree.birch(18, { x: -35, y: 1.2, z: 2, seed: 35 }));

  g.add(kit.tree.broadleaf(20, { x: -30, y: 1.2, z: -15, seed: 41 }));
  g.add(kit.tree.broadleaf(18, { x: -13, y: 1.2, z: -23, seed: 42 }));
  g.add(kit.tree.broadleaf(19, { x: 34, y: 1.2, z: -14, seed: 43 }));

  // Two visitors walking on the boardwalk (kit.person pose "walk", h 6, coats gunjo and tonoko)
  g.add(kit.person({
    pose: "walk", coat: "gunjo", h: 6,
    x: -7, y: 1.9, z: 20.3, ry: -1.3
  }));
  g.add(kit.person({
    pose: "walk", coat: "tonoko", hat: "kuchiba", h: 6,
    x: -1.5, y: 1.9, z: 19.8, ry: -1.5
  }));

  return g;
});