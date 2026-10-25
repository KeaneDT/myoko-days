/* Biwajima (cruise): the wooded island shrine in Lake Nojiri with a rocky shore, dense dome of cedars and pines,
   a small shrine hall on a front clearing, a large vermilion torii standing in the water, and a white sightseeing boat with a wake. Size L. */
MyokoKit.register("cruise", function build(kit) {
  const { mat, tone } = kit;
  const g = kit.group();

  // Island base: centred at z = -6, about 60 wide (X) and 44 deep (Z), sitting directly on the lake surface (y = 0)
  // Thin pale beach (tonoko) at the waterline, scaled along X to form an oval ~60x44
  const beach = kit.ground({ r: 22, mat: mat.tonoko, seed: 14, irregular: 0.1, h: 0.7 });
  beach.scale.set(1.36, 1, 1.0);
  beach.position.set(0, 0, -6);
  g.add(beach);

  // Main grassy island mound rising to ~3.2
  const mound = kit.ground({ r: 20.5, mat: tone("rokusho", 0.15), seed: 19, irregular: 0.1, h: 3.2 });
  mound.scale.set(1.34, 1, 0.98);
  mound.position.set(0, 0.2, -6);
  g.add(mound);

  // Inner crown rising gently to y = 5 in the middle
  const crown = kit.ground({ r: 14, mat: mat.rokusho, seed: 23, irregular: 0.08, h: 2.0 });
  crown.scale.set(1.3, 1, 0.92);
  crown.position.set(-2, 3.0, -8);
  g.add(crown);

  // Rocky shore: a ring of low rocks around the island perimeter (1 to 3 tall)
  const rockMat1 = tone("kawara", 0.15);
  const rockMat2 = tone("kawara", 0.05);
  const shoreCount = 18;
  for (let i = 0; i < shoreCount; i++) {
    const a = (i / shoreCount) * Math.PI * 2;
    // Leave a slight gap at the front-right landing where the stone path meets the water
    if (a > 0.85 && a < 1.25) continue;
    const rx = Math.cos(a) * 28.5 + Math.sin(i * 3.1) * 1.4;
    const rz = -6 + Math.sin(a) * 20.5 + Math.cos(i * 2.7) * 1.2;
    const rSize = 1.6 + (i % 3) * 0.65;
    const hScale = 0.55 + (i % 2) * 0.2;
    g.add(kit.rock(rSize, {
      x: rx, y: 0.3, z: rz,
      mat: i % 2 ? rockMat1 : rockMat2,
      seed: 100 + i,
      s: [1.2, hScale, 1.1]
    }));
  }

  // Dense dome of 38 trees covering the back two-thirds of the island (leaving front-right clearing at x: +4..+22, z: 0..+14 open)
  // Tallest cedars in the middle (h 28 to 34)
  const coreCedars = [
    [-2, -12, 34, 1], [4, -14, 33, 2], [-8, -10, 32, 3], [0, -7, 31, 4],
    [-5, -16, 32, 5], [8, -11, 30, 6], [-12, -13, 30, 7], [2, -19, 31, 8],
    [-14, -7, 29, 9], [-7, -4, 28, 10], [11, -16, 29, 11], [-3, -22, 28, 12],
    [14, -9, 27, 13], [-17, -11, 28, 14]
  ];
  coreCedars.forEach(([x, z, h, s]) => {
    g.add(kit.tree.cedar(h, { x, y: 3.8, z, seed: 200 + s, ry: s * 1.1 }));
  });

  // Mid-ring cedars (h 24 to 27)
  const midCedars = [
    [-19, -5, 26, 15], [-10, -21, 26, 16], [8, -22, 25, 17], [17, -13, 25, 18],
    [-15, -18, 26, 19], [-11, 1, 25, 20], [-4, 1, 24, 21], [19, -6, 24, 22],
    [13, -4, 24, 23], [-21, -13, 25, 24]
  ];
  midCedars.forEach(([x, z, h, s]) => {
    g.add(kit.tree.cedar(h, { x, y: 2.8, z, seed: 220 + s, ry: s * 1.3 }));
  });

  // Outer edge pines (h 16 to 22) leaning outward toward the lake
  const edgePines = [
    [-24, -2, 21, 0.28, 0.2, 31],
    [-20, 5, 19, 0.3, 0.8, 32],
    [-14, 7, 18, 0.25, 1.2, 33],
    [-25, -9, 20, 0.26, -0.3, 34],
    [-19, -20, 19, 0.24, -0.9, 35],
    [0, -24, 20, 0.22, -1.5, 36],
    [14, -21, 19, 0.25, -2.2, 37],
    [22, -10, 20, 0.28, 3.0, 38],
    [23, -1, 18, 0.26, 2.5, 39]
  ];
  edgePines.forEach(([x, z, h, lean, ry, s]) => {
    g.add(kit.tree.pine(h, { x, y: 1.8, z, lean, ry, seed: 250 + s }));
  });

  // Broadleaf trees softening the canopy transitions
  const broadleafs = [
    [-22, 2, 18, 41], [-7, 5, 17, 42], [6, -2, 18, 43],
    [21, -16, 19, 44], [-8, -24, 18, 45]
  ];
  broadleafs.forEach(([x, z, h, s]) => {
    g.add(kit.tree.broadleaf(h, { x, y: 2.2, z, seed: 280 + s }));
  });

  // Shrine: on the front-right clearing (x = 12, z = 5), clearly visible in front of the tree dome
  const shrine = kit.group({ x: 12, y: 2.2, z: 5, ry: -0.18 });
  const stoneMat = tone("kawara", 0.35);
  const postMat = tone("hinoki", -0.3);

  // Stone base and raised wooden veranda
  shrine.add(kit.box(15.5, 1.8, 11.5, stoneMat, { y: 0, bevel: 0.1 }));
  shrine.add(kit.box(14.2, 0.8, 10.2, tone("hinoki", -0.15), { y: 1.8, bevel: 0.08 }));
  // White plaster walls (gofun)
  shrine.add(kit.box(12.4, 5.6, 8.4, mat.gofun, { y: 2.6, bevel: 0.04 }));
  // Timber corner and intermediate posts
  [-6.1, -2.0, 2.0, 6.1].forEach(px => {
    [-4.1, 4.1].forEach(pz => {
      shrine.add(kit.box(0.75, 5.8, 0.75, postMat, { x: px, y: 2.6, z: pz, bevel: 0.05 }));
    });
  });
  // Top tie beam and front wooden doors
  shrine.add(kit.box(13.2, 0.7, 9.2, postMat, { y: 8.0, bevel: 0.05 }));
  shrine.add(kit.box(4.2, 4.4, 0.5, tone("hinoki", -0.05), { y: 2.8, z: 4.2, bevel: 0.05 }));
  // Front stone steps
  shrine.add(kit.box(5.6, 1.0, 2.4, stoneMat, { y: 0, z: 6.4, bevel: 0.1 }));
  // Irimoya roof (w 14, d 10, h 8, mat kawara)
  shrine.add(kit.roof({
    w: 14, d: 10, h: 8, overhang: 2.6,
    style: "irimoya", sori: 1.1, thickness: 0.7,
    mat: mat.kawara, gableMat: mat.gofun, y: 8.5
  }));
  g.add(shrine);

  // Short stone path leading from the shrine steps to the front shore, plus a small wooden pier
  g.add(kit.path({
    points: [[11.0, 11.2], [9.8, 13.8], [8.5, 16.5]],
    width: 3.4, y: 1.4, mat: stoneMat
  }));
  g.add(kit.box(3.8, 0.9, 4.5, mat.hinoki, { x: 8.2, y: 0.2, z: 17.5, ry: -0.18, bevel: 0.1 }));

  // Torii: standing IN the water just off the front-left shore (x = -14, z = 22), facing +Z
  // Single shu accent in the model
  g.add(kit.torii({ h: 22, w: 20, x: -14, y: 0, z: 22 }));

  // Two small mat.gofun ripple rings around the torii posts (at x = -14 ± 7.2, z = 22)
  [-21.2, -6.8].forEach(px => {
    const ringPts = [];
    const r = 2.3;
    for (let i = 0; i <= 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ringPts.push([px + Math.cos(a) * r, 22 + Math.sin(a) * r]);
    }
    g.add(kit.path({ points: ringPts, width: 0.8, y: 0.1, mat: mat.gofun }));
  });

  // Sightseeing boat at the front-right (x = 24, z = 34), heading left (-X), ~26 long, 9 wide, 9 tall
  const boat = kit.group({ x: 10, y: 0, z: 31 });

  // Lower hull in gofun: main body + tapered bow (-X) and stern (+X)
  boat.add(kit.box(18, 3.0, 9.0, mat.gofun, { x: 1, y: 0, bevel: 0.15 }));
  boat.add(kit.box(6.4, 2.9, 6.4, mat.gofun, { x: -8.0, y: 0.05, ry: Math.PI / 4, bevel: 0.15 }));
  boat.add(kit.box(4.6, 2.7, 4.6, mat.gofun, { x: -10.2, y: 0.15, ry: Math.PI / 4, bevel: 0.15 }));
  boat.add(kit.box(4.0, 2.8, 8.2, mat.gofun, { x: 11.0, y: 0.1, bevel: 0.15 }));

  // Gunjo stripe along the hull
  boat.add(kit.box(18.2, 0.9, 9.2, mat.gunjo, { x: 1, y: 1.7, bevel: 0.05 }));
  boat.add(kit.box(6.5, 0.9, 6.5, mat.gunjo, { x: -8.0, y: 1.7, ry: Math.PI / 4, bevel: 0.05 }));
  boat.add(kit.box(4.2, 0.9, 8.4, mat.gunjo, { x: 11.0, y: 1.7, bevel: 0.05 }));

  // Deck trim
  boat.add(kit.box(19.5, 0.6, 8.6, mat.gofun, { x: 1.2, y: 2.9, bevel: 0.1 }));

  // Cabin with a band of windows in tone("kawara", -0.3)
  const winMat = tone("kawara", -0.3);
  boat.add(kit.box(14.5, 1.4, 7.2, mat.gofun, { x: 1.5, y: 3.4, bevel: 0.08 }));
  boat.add(kit.box(13.8, 1.8, 6.8, winMat, { x: 1.5, y: 4.7, bevel: 0.05 }));
  // White window mullions and wheelhouse front
  [-4.2, -1.2, 1.8, 4.8, 7.6].forEach(wx => {
    boat.add(kit.box(0.55, 1.9, 7.1, mat.gofun, { x: wx, y: 4.7, bevel: 0 }));
  });
  boat.add(kit.box(2.5, 1.6, 5.4, winMat, { x: -5.5, y: 4.8, bevel: 0.08 }));

  // Flat roof deck (bringing total height to ~9)
  boat.add(kit.box(15.6, 0.9, 7.6, mat.gofun, { x: 1.2, y: 6.4, bevel: 0.12 }));
  boat.add(kit.box(9.5, 0.8, 4.8, mat.gofun, { x: 1.5, y: 7.2, bevel: 0.1 }));
  boat.add(kit.cyl(0.35, 0.4, 1.4, mat.kawara, { x: -1.5, y: 7.9, segments: 8 }));
  g.add(boat);

  // Boat wake: two thin mat.gofun kit.path lines in a narrow V behind the stern (+X), ~20 long, y = 0.1
  g.add(kit.path({
    points: [[23.5, 30.2], [27.0, 29.2], [30.5, 28.2], [33.5, 27.4]],
    width: f => 1.1 - 0.6 * f,
    y: 0.1,
    mat: mat.gofun
  }));
  g.add(kit.path({
    points: [[23.5, 31.8], [27.0, 32.8], [30.5, 33.8], [33.5, 34.6]],
    width: f => 1.1 - 0.6 * f,
    y: 0.1,
    mat: mat.gofun
  }));

  // 4 short curved mat.gofun wave strokes on the open water (width 1, y 0.1)
  const waves = [
    [[-34, 14], [-29, 15.2], [-24, 14.3]],
    [[-26, 33], [-20, 34.2], [-14, 33.2]],
    [[-4, 29], [2, 30.1], [8, 29.0]],
    [[27, 12], [32, 13.2], [37, 12.1]]
  ];
  waves.forEach(pts => {
    g.add(kit.path({ points: pts, width: 1.0, y: 0.1, mat: mat.gofun }));
  });

  return g;
});