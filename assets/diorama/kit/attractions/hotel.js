/* Madarao Kogen Hotel: a long cream European mountain-resort hotel with dark slate hip roofs,
   angled side wings, a central clock-style tower with a steep spire, a porte-cochère entrance,
   and a curved carriage drive among cedar and broadleaf groves. Size L. */
MyokoKit.register("hotel", function build(kit) {
  const { mat, tone } = kit;
  const g = kit.group();

  // Ground: meadow lawn patch
  g.add(kit.ground({ r: 44, irregular: 0.08, mat: mat.byakuroku, seed: 15, h: 1.0 }));

  const wallUpper = tone("tonoko", 0.5);
  const wallBase = tone("tonoko", 0.1);
  const roofSlate = tone("kawara", -0.35);
  const winBand = tone("kawara", -0.3);
  const trimWood = mat.hinoki;

  // Helper for a hotel wing/section with base storey, upper walls, dark window bands, hinoki trim, and hip roof
  function buildSection(w, d, opts) {
    const sec = kit.group(opts);
    // Base storey (y: 1.0 to 7.2)
    sec.add(kit.box(w, 6.2, d, wallBase, { y: 1.0, bevel: 0.04 }));
    // Upper two storeys (y: 7.2 to 20.6)
    sec.add(kit.box(w - 0.2, 13.4, d - 0.2, wallUpper, { y: 7.2, bevel: 0.04 }));

    // Horizontal hinoki trim lines dividing the storeys
    const trimW = w + 0.4, trimD = d + 0.4;
    [7.1, 13.6, 20.2].forEach(ty => {
      sec.add(kit.box(trimW, 0.45, trimD, trimWood, { y: ty, bevel: 0.05 }));
    });

    // Three dark window bands across the front (+Z) and back (-Z), 1.6 tall, 0.5 deep
    const bandW = w - 3.0;
    [3.4, 9.6, 15.8].forEach(by => {
      sec.add(kit.box(bandW, 1.6, 0.5, winBand, { y: by, z: d / 2 - 0.1, bevel: 0.02 }));
      sec.add(kit.box(bandW, 1.6, 0.5, winBand, { y: by, z: -d / 2 + 0.1, bevel: 0.02 }));
      // Thin hinoki sill under each window band
      sec.add(kit.box(bandW + 0.6, 0.3, 0.7, trimWood, { y: by - 0.3, z: d / 2, bevel: 0.02 }));
    });

    // Dark slate hip roof (h: 9, overhang: 2, sori: 0.5)
    sec.add(kit.roof({
      w, d, h: 9, overhang: 2,
      style: "hip", sori: 0.5, thickness: 0.8,
      mat: roofSlate, fasciaMat: tone("kawara", -0.45), ridgeMat: tone("kawara", -0.45),
      y: 20.6
    }));
    return sec;
  }

  // Main block: 52 wide along X so with the two angled wings the total width stays ~74 (well under 80), 18 deep, at z = -8
  g.add(buildSection(52, 18, { x: 0, z: -8 }));

  // Two short wings at each end (18 wide, 16 deep), angled back by 25 degrees (~0.436 rad)
  const wingAngle = 25 * Math.PI / 180;
  g.add(buildSection(18, 16, { x: -29, z: -11.2, ry: wingAngle }));
  g.add(buildSection(18, 16, { x: 29, z: -11.2, ry: -wingAngle }));

  // 4 small gable dormers along the front roof slope (2 left of the central tower, 2 right)
  [-18, -10.5, 10.5, 18].forEach(dx => {
    const dormer = kit.group({ x: dx, y: 22.8, z: -1.8 });
    dormer.add(kit.box(3.4, 3.0, 4.0, wallUpper, { y: 0, bevel: 0.05 }));
    dormer.add(kit.box(2.2, 1.2, 0.4, winBand, { y: 0.9, z: 1.9, bevel: 0.02 }));
    dormer.add(kit.roof({
      w: 3.6, d: 4.4, h: 2.2, overhang: 0.6,
      style: "gable", thickness: 0.4,
      mat: roofSlate, gableMat: wallUpper,
      y: 2.8, rz: 0
    }));
    g.add(dormer);
  });

  // Central tower: square 12 by 12, rising to y = 40, with a steep 4-sided spire to y = 54 and kin finial
  const tower = kit.group({ x: 0, z: -6.5 });
  // Base and shaft
  tower.add(kit.box(12.4, 6.2, 12.4, wallBase, { y: 1.0, bevel: 0.05 }));
  tower.add(kit.box(12.0, 32.8, 12.0, wallUpper, { y: 7.2, bevel: 0.05 }));

  // Tower horizontal hinoki cornices and trim bands
  [7.1, 20.2, 30.5, 39.6].forEach(ty => {
    tower.add(kit.box(12.6, 0.5, 12.6, trimWood, { y: ty, bevel: 0.05 }));
  });

  // Tower dark window bands on the front (+Z) and sides (±X)
  [9.6, 15.8, 25.0, 34.0].forEach(by => {
    tower.add(kit.box(7.6, 1.6, 0.5, winBand, { y: by, z: 5.9, bevel: 0.02 }));
    tower.add(kit.box(0.5, 1.6, 7.6, winBand, { x: -5.9, y: by, bevel: 0.02 }));
    tower.add(kit.box(0.5, 1.6, 7.6, winBand, { x: 5.9, y: by, bevel: 0.02 }));
  });

  // Gable pediment detail on the front face of the tower
  tower.add(kit.box(8.0, 0.45, 0.6, trimWood, { y: 31.8, z: 6.0, bevel: 0.04 }));

  // Steep four-sided spire from y = 40 to y = 54 (kit.cone, 4 segments, rotated 45 degrees)
  // Radius 9.2 at 45° gives square base width ~13.0 (slight overhang over the 12x12 tower)
  tower.add(kit.cone(9.2, 14.0, roofSlate, { y: 40.0, segments: 4, ry: Math.PI / 4 }));
  // Small kin finial at the peak (y = 54)
  tower.add(kit.box(1.2, 1.8, 1.2, mat.kin, { y: 53.6, bevel: 0.15 }));
  tower.add(kit.sphere(0.9, mat.kin, { y: 55.4, segments: 8 }));
  g.add(tower);

  // Entrance: covered porch (porte-cochère) at the front centre (z = +5.5)
  const porch = kit.group({ x: 0, z: 5.5 });
  // Low stone step platform
  porch.add(kit.box(13.0, 0.8, 8.5, tone("kawara", 0.3), { y: 1.0, bevel: 0.1 }));
  // Four pillars supporting the porte-cochère roof
  [-5.0, 5.0].forEach(px => {
    [-2.8, 3.0].forEach(pz => {
      porch.add(kit.box(1.1, 6.2, 1.1, wallBase, { x: px, y: 1.8, z: pz, bevel: 0.06 }));
    });
  });
  // Porch entablature and hip roof
  porch.add(kit.box(12.2, 1.0, 7.6, wallUpper, { y: 7.6, bevel: 0.06 }));
  porch.add(kit.box(12.6, 0.4, 8.0, trimWood, { y: 8.5, bevel: 0.05 }));
  porch.add(kit.roof({
    w: 12.2, d: 7.6, h: 3.6, overhang: 1.4,
    style: "hip", sori: 0.3, thickness: 0.6,
    mat: roofSlate, y: 8.8
  }));
  // Dark entrance doorway behind the porch
  porch.add(kit.box(5.2, 4.2, 0.6, winBand, { y: 1.8, z: -4.2, bevel: 0.04 }));
  g.add(porch);

  // Curved tonoko drive sweeping in from the front-left and front-right to the porte-cochère, enclosing a central lawn
  g.add(kit.path({
    points: [
      [-28, 30], [-22, 22], [-14, 14], [-6, 10],
      [0, 9.2],
      [6, 10], [14, 14], [22, 22], [28, 30]
    ],
    width: 5, y: 1.12, mat: mat.tonoko
  }));
  // Lower loop of the turnaround enclosing the round front lawn
  g.add(kit.path({
    points: [
      [-17, 17], [-12, 24], [-5, 28], [0, 29], [5, 28], [12, 24], [17, 17]
    ],
    width: 4.2, y: 1.11, mat: mat.tonoko
  }));

  // Round lawn island inside the carriage loop with a bed of moegi bushes
  g.add(kit.cyl(8.5, 9.0, 0.35, tone("byakuroku", -0.1), { x: 0, y: 1.05, z: 19.5, segments: 16 }));
  const bushes = [
    [0, 1.4, 19.5, 2.6, 1],
    [-3.2, 1.3, 18.8, 2.0, 2],
    [3.2, 1.3, 18.8, 2.1, 3],
    [-1.8, 1.3, 21.6, 1.9, 4],
    [2.0, 1.3, 21.4, 1.8, 5]
  ];
  bushes.forEach(([bx, by, bz, br, seed]) => {
    g.add(kit.blob(br, mat.moegi, { x: bx, y: by, z: bz, seed: 70 + seed, detail: 1, jitter: 0.12, s: [1.2, 0.7, 1.1] }));
  });
  // Small shrubs flanking the porch steps
  [-8.5, 8.5].forEach((sx, i) => {
    g.add(kit.blob(1.9, mat.moegi, { x: sx, y: 1.3, z: 3.5, seed: 80 + i, detail: 1, s: [1.1, 0.75, 1.1] }));
  });

  // Trees: cedar and broadleaf groves behind the hotel and at the sides (x about ±36..40), none in front of the facade
  g.add(kit.grove({ x: -18, z: -26, r: 7, count: 4, kinds: ["cedar", "broadleaf"], h: 32, seed: 91 }));
  g.add(kit.grove({ x: 18, z: -26, r: 7, count: 4, kinds: ["cedar", "broadleaf"], h: 32, seed: 92 }));
  g.add(kit.grove({ x: -35, z: -10, r: 4, count: 3, kinds: ["cedar", "broadleaf"], h: 28, seed: 93 }));
  g.add(kit.grove({ x: 35, z: -10, r: 4, count: 3, kinds: ["cedar", "broadleaf"], h: 28, seed: 94 }));

  // Accent trees at the outer sides (behind z = 8 so the entire front facade and drive are unobstructed)
  g.add(kit.tree.broadleaf(22, { x: -35, z: 6, seed: 101 }));
  g.add(kit.tree.cedar(27, { x: -31, z: -22, seed: 102 }));
  g.add(kit.tree.broadleaf(22, { x: 35, z: 6, seed: 103 }));
  g.add(kit.tree.cedar(27, { x: 31, z: -22, seed: 104 }));

  return g;
});