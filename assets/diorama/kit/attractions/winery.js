/* St. Cousair Winery and orchard: parallel vine rows on a gentle back slope, a white chapel with a slim steeple,
   the timber-trimmed winery building with a terrace, and apple trees dotted with red apples. Size L. */
MyokoKit.register("winery", function build(kit) {
  const { mat, tone } = kit;
  const g = kit.group();

  // Ground: meadow lawn patch
  g.add(kit.ground({ r: 44, irregular: 0.08, mat: mat.byakuroku, seed: 18, h: 1.0 }));

  // Slope: back half rises gently toward the back to ~10 high using a large flattened blob
  // (stepped terraces are built with the rows below: each row sits one step higher than the row in front)

  //Vineyard rows: 8 parallel rows running along X across the slope (z from -35 to -5.6), each 44 long
  const vineDark = mat.rokusho;
  const vineLight = tone("rokusho", 0.15);
  const postMat = tone("hinoki", -0.2);

  for (let i = 0; i < 8; i++) {
    const rz = -35 + i * 4.2;
    const f = i / 7; // 0 at back (-35), 1 at front (-5.6)
    // Follow the gentle slope contour from y ~7.5 at back down to y ~2.0 at front
    const ry = 1.0 + (1 - f) * 7.0;
    const rowLen = 44;

    // grass terrace step under the row (rises toward the back, so every row is visible from the camera)
    g.add(kit.box(rowLen + 5, ry, 4.4, i % 2 ? mat.byakuroku : tone("byakuroku", -0.05), { x: 0, y: 0, z: rz, bevel: 0.04 }));

    // Tonoko earth strip between/under rows
    g.add(kit.box(rowLen + 2.5, 0.6, 3.8, mat.tonoko, {
      x: 0, y: ry - 0.3, z: rz, bevel: 0.1
    }));

    // Low hedge (3 tall, 2.5 deep) alternating rokusho and tone("rokusho", 0.15)
    g.add(kit.box(rowLen, 3.0, 2.5, i % 2 === 0 ? vineDark : vineLight, {
      x: 0, y: ry, z: rz, bevel: 0.15
    }));

    // Thin hinoki posts at the row ends (and mid-row supports)
    [-rowLen / 2 - 0.4, 0, rowLen / 2 + 0.4].forEach(px => {
      g.add(kit.box(0.45, 3.5, 0.45, postMat, {
        x: px, y: ry, z: rz, bevel: 0.05
      }));
    });
  }

  // Tonoko paths linking the chapel, the winery, and the vineyard rows
  g.add(kit.path({
    points: [[-20, 28], [-16, 22], [-6, 17], [5, 16], [16, 21]],
    width: 4.2, y: 1.12, mat: mat.tonoko
  }));
  g.add(kit.path({
    points: [[-2, 16.5], [-1, 6], [0, -4]],
    width: 3.6, y: 1.35, mat: mat.tonoko
  }));

  // Chapel: at the front-left (x = -20, z = +16), gofun walls ~11 wide and 17 long
  const chapel = kit.group({ x: -20, y: 1.0, z: 16, ry: 0.12 });
  const chapelRoofMat = tone("kawara", -0.2);
  const darkWin = tone("kawara", -0.35);
  const stoneBase = tone("kawara", 0.3);

  // Stone foundation and gofun nave walls (11 wide along X, 17 long along Z)
  chapel.add(kit.box(11.6, 1.2, 17.6, stoneBase, { y: 0, bevel: 0.08 }));
  chapel.add(kit.box(11.0, 9.5, 17.0, mat.gofun, { y: 1.2, bevel: 0.05 }));

  // Side window bands and hinoki trim
  [4.8].forEach(wy => {
    chapel.add(kit.box(0.4, 2.2, 11.5, darkWin, { x: -5.4, y: wy, z: -1.0, bevel: 0.02 }));
    chapel.add(kit.box(0.4, 2.2, 11.5, darkWin, { x: 5.4, y: wy, z: -1.0, bevel: 0.02 }));
  });
  chapel.add(kit.box(11.3, 0.4, 17.3, mat.hinoki, { y: 10.4, bevel: 0.05 }));

  // Steep gable roof over nave (rotated 90° so the ridge runs along Z, w=17 along ridge, d=11 across span)
  chapel.add(kit.roof({
    w: 17.0, d: 11.0, h: 7.5, overhang: 1.2,
    style: "gable", thickness: 0.6,
    mat: chapelRoofMat, gableMat: mat.gofun,
    y: 10.7, ry: Math.PI / 2
  }));

  // Slim square steeple at the front end (z = +6.2) rising to ~34 with a four-sided spire and tiny kin finial
  chapel.add(kit.box(5.0, 21.5, 5.0, mat.gofun, { y: 1.2, z: 6.2, bevel: 0.06 }));
  chapel.add(kit.box(5.4, 0.45, 5.4, mat.hinoki, { y: 16.5, z: 6.2, bevel: 0.05 }));
  chapel.add(kit.box(5.4, 0.45, 5.4, mat.hinoki, { y: 22.4, z: 6.2, bevel: 0.05 }));
  // Belfry louver openings
  chapel.add(kit.box(2.2, 2.6, 5.2, darkWin, { y: 18.5, z: 6.2, bevel: 0.02 }));
  chapel.add(kit.box(5.2, 2.6, 2.2, darkWin, { y: 18.5, z: 6.2, bevel: 0.02 }));
  // Four-sided spire from y = 22.7 to y = 32.5 (world y ~33.5) + tiny kin finial to y = 34.5
  chapel.add(kit.cone(3.9, 9.8, chapelRoofMat, { y: 22.7, z: 6.2, segments: 4, ry: Math.PI / 4 }));
  chapel.add(kit.box(0.7, 1.3, 0.7, mat.kin, { y: 32.3, z: 6.2, bevel: 0.1 }));
  chapel.add(kit.sphere(0.55, mat.kin, { y: 33.7, z: 6.2, segments: 8 }));

  // Front entrance porch and steps
  chapel.add(kit.box(4.6, 0.9, 2.8, stoneBase, { y: 0, z: 9.6, bevel: 0.08 }));
  chapel.add(kit.box(2.4, 4.2, 0.5, tone("hinoki", -0.15), { y: 1.2, z: 8.65, bevel: 0.05 }));
  g.add(chapel);

  // Winery building: at the front-right (x = +18, z = +14), 26 wide and 13 deep, white walls with hinoki timber
  const winery = kit.group({ x: 18, y: 1.0, z: 14, ry: -0.1 });

  // Stone base and white walls (26 wide, 13 deep)
  winery.add(kit.box(26.6, 1.2, 13.6, stoneBase, { y: 0, bevel: 0.08 }));
  winery.add(kit.box(26.0, 8.2, 13.0, mat.gofun, { y: 1.2, bevel: 0.05 }));

  // Hinoki half-timbered posts and beams
  [-12.8, -6.4, 0, 6.4, 12.8].forEach(px => {
    winery.add(kit.box(0.65, 8.4, 13.3, mat.hinoki, { x: px, y: 1.2, bevel: 0.04 }));
  });
  winery.add(kit.box(26.4, 0.55, 13.4, mat.hinoki, { y: 5.2, bevel: 0.04 }));
  winery.add(kit.box(26.4, 0.6, 13.4, mat.hinoki, { y: 9.1, bevel: 0.04 }));

  // Dark window band and arched/timber entrance door on front (+Z)
  winery.add(kit.box(22.0, 1.6, 0.4, darkWin, { y: 6.4, z: 6.4, bevel: 0.02 }));
  winery.add(kit.box(18.0, 1.5, 0.4, darkWin, { y: 2.6, z: 6.4, bevel: 0.02 }));
  winery.add(kit.box(4.2, 4.0, 0.6, tone("hinoki", -0.2), { x: 0, y: 1.2, z: 6.4, bevel: 0.05 }));

  // Low gable roof in kawara
  winery.add(kit.roof({
    w: 26.0, d: 13.0, h: 5.2, overhang: 1.6,
    style: "gable", sori: 0.3, thickness: 0.65,
    mat: mat.kawara, gableMat: mat.gofun,
    y: 9.4
  }));

  // Small terrace in front (+Z) with two tables
  winery.add(kit.box(18.0, 0.7, 7.2, tone("tonoko", -0.1), { x: 0, y: 0, z: 10.0, bevel: 0.1 }));
  [-4.8, 4.8].forEach(tx => {
    const tbl = kit.group({ x: tx, y: 0.7, z: 10.4 });
    // Table post and round top
    tbl.add(kit.cyl(0.35, 0.45, 2.0, postMat, { y: 0, segments: 8 }));
    tbl.add(kit.cyl(2.2, 2.2, 0.35, mat.gofun, { y: 2.0, segments: 12 }));
    // Two small bench seats
    tbl.add(kit.box(1.2, 1.2, 1.2, mat.hinoki, { x: -2.6, y: 0, bevel: 0.1 }));
    tbl.add(kit.box(1.2, 1.2, 1.2, mat.hinoki, { x: 2.6, y: 0, bevel: 0.1 }));
    winery.add(tbl);
  });
  g.add(winery);

  // Apple trees: 5 broadleaf trees (h 14 to 18) between the buildings and orchard clearing,
  // each with 5 or 6 tiny mat.shu spheres (r = 0.9) on the canopy (the single shu accent)
  const appleTrees = [
    { x: -7.5, y: 1.2, z: 6.5, h: 17, seed: 31 },
    { x: 1.5, y: 1.2, z: 5.0, h: 18, seed: 35 },
    { x: -3.5, y: 1.1, z: 14.5, h: 15, seed: 39 },
    { x: 5.5, y: 1.1, z: 12.0, h: 16, seed: 43 },
    { x: -11.5, y: 1.1, z: 22.0, h: 14, seed: 47 }
  ];

  // Relative apple offsets around a broadleaf canopy
  const appleOffsets = [
    [0.24, 0.65, 0.22],
    [-0.25, 0.68, 0.20],
    [0.05, 0.80, 0.25],
    [-0.18, 0.76, -0.22],
    [0.26, 0.74, -0.18],
    [-0.02, 0.90, 0.04]
  ];

  appleTrees.forEach((t, idx) => {
    g.add(kit.tree.broadleaf(t.h, { x: t.x, y: t.y, z: t.z, seed: t.seed }));
    const count = idx % 2 === 0 ? 6 : 5;
    for (let k = 0; k < count; k++) {
      const [ox, oy, oz] = appleOffsets[k];
      g.add(kit.sphere(0.9, mat.shu, {
        x: t.x + ox * t.h,
        y: t.y + oy * t.h,
        z: t.z + oz * t.h,
        segments: 8
      }));
    }
  });

  return g;
});