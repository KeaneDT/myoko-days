/* Lime Resort Myoko ($$): the grander sister of the Madarao hotel, in the same cream walls, dark slate hip roofs, hinoki trim
   bands and dark window bands. A long four-storey main block, two angled three-storey wings, a taller central clock tower
   with a steep spire, two corner turrets, a double-height porte-cochère, a carriage drive around a fountain court, and an
   onsen garden at one side (a rock-ringed pool behind a timber screen, with slow steam). Size M. Base marker. No shu.
   (id "akakura" is kept for the file name; the place is Lime Resort Myoko.) */
MyokoKit.register("akakura", function build(kit) {
  const { mat, tone } = kit;
  const g = kit.group();
  const rnd = kit.rand(23);

  g.add(kit.ground({ r: 44, irregular: 0.08, mat: mat.byakuroku, seed: 81, h: 1.0 }));

  const wallUpper = tone("tonoko", 0.5);
  const wallBase = tone("tonoko", 0.1);
  const roofSlate = tone("kawara", -0.35);
  const roofEdge = tone("kawara", -0.45);
  const winBand = tone("kawara", -0.3);
  const trimWood = mat.hinoki;
  const stone = tone("kawara", 0.35);

  // one section of the hotel: a stone-coloured base storey, cream upper storeys, hinoki trim, dark window bands, hip roof
  function section(w, d, storeys, roofH, opts) {
    const s = kit.group(opts);
    const upperH = (storeys - 1) * 6.7;                       // each upper storey is 6.7 tall
    const top = 7.2 + upperH;                                 // underside of the roof
    s.add(kit.box(w, 6.2, d, wallBase, { y: 1.0, bevel: 0.04 }));
    s.add(kit.box(w - 0.2, upperH, d - 0.2, wallUpper, { y: 7.2, bevel: 0.04 }));
    const trimY = [7.1]; for (let i = 1; i < storeys; i++) trimY.push(7.2 + i * 6.7 - 0.3);
    trimY.forEach(ty => s.add(kit.box(w + 0.4, 0.45, d + 0.4, trimWood, { y: ty, bevel: 0.05 })));
    const bandW = w - 3.0, bands = [3.4]; for (let i = 0; i < storeys - 1; i++) bands.push(9.6 + i * 6.7);
    bands.forEach(by => {
      s.add(kit.box(bandW, 1.6, 0.5, winBand, { y: by, z: d / 2 - 0.1, bevel: 0.02 }));
      s.add(kit.box(bandW, 1.6, 0.5, winBand, { y: by, z: -d / 2 + 0.1, bevel: 0.02 }));
      s.add(kit.box(bandW + 0.6, 0.3, 0.7, trimWood, { y: by - 0.3, z: d / 2, bevel: 0.02 }));
    });
    s.add(kit.roof({ w, d, h: roofH, overhang: 2, style: "hip", sori: 0.5, thickness: 0.8, mat: roofSlate, fasciaMat: roofEdge, ridgeMat: roofEdge, y: top }));
    return s;
  }

  // a square tower with a four-sided spire and a gold finial
  function tower(wd, shaftTop, spireR, spireH, opts, clock) {
    const t = kit.group(opts);
    t.add(kit.box(wd + 0.4, 6.2, wd + 0.4, wallBase, { y: 1.0, bevel: 0.05 }));
    t.add(kit.box(wd, shaftTop - 7.2, wd, wallUpper, { y: 7.2, bevel: 0.05 }));
    [7.1, 20.2, 30.5, shaftTop - 0.4].forEach(ty => { if (ty < shaftTop) t.add(kit.box(wd + 0.6, 0.5, wd + 0.6, trimWood, { y: ty, bevel: 0.05 })); });
    const bw = wd * 0.62;
    [9.6, 15.8, 25.0, 34.0].forEach(by => {
      if (by + 1.6 > shaftTop - 1) return;
      t.add(kit.box(bw, 1.6, 0.5, winBand, { y: by, z: wd / 2 - 0.1, bevel: 0.02 }));
      t.add(kit.box(0.5, 1.6, bw, winBand, { x: -wd / 2 + 0.1, y: by, bevel: 0.02 }));
      t.add(kit.box(0.5, 1.6, bw, winBand, { x: wd / 2 - 0.1, y: by, bevel: 0.02 }));
    });
    if (clock) {                                              // a gold clock face on the front, under the cornice
      const c = kit.cyl(2.6, 2.6, 0.5, mat.kin, { y: clock, z: wd / 2 + 0.1, rx: Math.PI / 2, segments: 16 });
      t.add(c);
      t.add(kit.box(0.35, 1.9, 0.3, tone("kawara", -0.45), { y: clock - 0.3, z: wd / 2 + 0.55, bevel: 0 }));
    }
    t.add(kit.cone(spireR, spireH, roofSlate, { y: shaftTop, segments: 4, ry: Math.PI / 4 }));
    t.add(kit.box(1.3, 2.0, 1.3, mat.kin, { y: shaftTop + spireH - 0.4, bevel: 0.15 }));
    t.add(kit.sphere(1.0, mat.kin, { y: shaftTop + spireH + 1.6, segments: 8 }));
    return t;
  }

  // main block: four storeys, 54 wide, 19 deep, set back at z = -9
  g.add(section(54, 19, 4, 10, { x: 0, z: -9 }));

  // two angled three-storey wings
  const wingAngle = 25 * Math.PI / 180;
  g.add(section(16, 14, 3, 8, { x: -30.5, z: -12.5, ry: wingAngle }));
  g.add(section(16, 14, 3, 8, { x: 30.5, z: -12.5, ry: -wingAngle }));

  // central clock tower, rising well above the main roof
  g.add(tower(14, 46, 10.6, 17, { x: 0, z: -6.5 }, 40));
  // two corner turrets
  [-25, 25].forEach(x => g.add(tower(8.6, 33, 6.6, 10, { x, z: -1.8 })));

  // four small gable dormers on the front roof slope
  [-18.5, -12, 12, 18.5].forEach(dx => {
    const dormer = kit.group({ x: dx, y: 29.4, z: -1.6 });
    dormer.add(kit.box(3.6, 3.2, 4.0, wallUpper, { y: 0, bevel: 0.05 }));
    dormer.add(kit.box(2.3, 1.3, 0.4, winBand, { y: 0.9, z: 1.9, bevel: 0.02 }));
    dormer.add(kit.roof({ w: 3.8, d: 4.4, h: 2.4, overhang: 0.6, style: "gable", thickness: 0.4, mat: roofSlate, gableMat: wallUpper, y: 3.0 }));
    g.add(dormer);
  });

  // porte-cochère: a wide covered entrance on six columns with a gold finial
  const porch = kit.group({ x: 0, z: 6.4 });
  porch.add(kit.box(19.0, 0.8, 9.0, stone, { y: 1.0, bevel: 0.1 }));
  [-8, 0, 8].forEach(px => [-3.2, 3.4].forEach(pz => porch.add(kit.box(1.2, 7.4, 1.2, wallBase, { x: px, y: 1.8, z: pz, bevel: 0.06 }))));
  porch.add(kit.box(18.0, 1.1, 8.2, wallUpper, { y: 9.0, bevel: 0.06 }));
  porch.add(kit.box(18.6, 0.45, 8.8, trimWood, { y: 10.0, bevel: 0.05 }));
  porch.add(kit.roof({ w: 18.0, d: 8.2, h: 4.4, overhang: 1.5, style: "hip", sori: 0.3, thickness: 0.6, mat: roofSlate, y: 10.4 }));
  porch.add(kit.sphere(0.8, mat.kin, { y: 15.4, segments: 8 }));
  porch.add(kit.box(6.0, 5.0, 0.6, winBand, { y: 1.8, z: -4.5, bevel: 0.04 }));
  g.add(porch);

  // the drive: two arms sweeping in to the porch, a loop around a fountain court
  g.add(kit.path({ points: [[-22, 30], [-17, 22], [-10, 15.5], [-4, 12], [0, 11.2], [4, 12], [10, 15.5], [17, 22], [22, 30]], width: 5, y: 1.12, mat: mat.tonoko }));
  g.add(kit.path({ points: [[-13, 18], [-9, 25], [-4, 29], [0, 30], [4, 29], [9, 25], [13, 18]], width: 4.2, y: 1.11, mat: mat.tonoko }));
  // the fountain: a round basin of water, a stone rim, a column and a gold finial
  const fx = 0, fz = 21;
  g.add(kit.cyl(9.2, 9.6, 0.5, tone("byakuroku", -0.1), { x: fx, y: 1.05, z: fz, segments: 18 }));
  g.add(kit.cyl(6.0, 6.2, 0.9, stone, { x: fx, y: 1.3, z: fz, segments: 18 }));
  g.add(kit.cyl(5.2, 5.2, 0.4, tone("byakugun", 0.1), { x: fx, y: 2.0, z: fz, segments: 18 }));
  g.add(kit.cyl(0.9, 1.3, 4.6, stone, { x: fx, y: 2.2, z: fz, segments: 8 }));
  g.add(kit.cyl(2.4, 0.9, 0.7, stone, { x: fx, y: 6.4, z: fz, segments: 10 }));
  g.add(kit.sphere(0.7, mat.kin, { x: fx, y: 7.6, z: fz, segments: 8 }));
  [[-7.5, 20], [7.5, 20], [-6.6, 25], [6.6, 25]].forEach(([bx, bz], i) =>
    g.add(kit.blob(1.9, mat.moegi, { x: bx, y: 1.3, z: bz, seed: 70 + i, detail: 1, jitter: 0.12, s: [1.2, 0.75, 1.1] })));
  [-9.5, 9.5].forEach((sx, i) => g.add(kit.blob(2.0, mat.moegi, { x: sx, y: 1.3, z: 5, seed: 80 + i, detail: 1, s: [1.1, 0.75, 1.1] })));

  // the onsen garden at the front right: a rock-ringed pool behind a timber screen, with slow steam
  const px = 31, pz = 17;
  const pool = [[-5.4, -3], [-1.5, -5.6], [3.8, -5.2], [6.8, -1.2], [6.4, 3.8], [2.6, 6.4], [-2.6, 5.8], [-5.8, 2.4]].map(([x, z]) => [px + x, pz + z]);
  g.add(kit.water({ outline: pool, y: 1.4, mat: tone("byakugun", 0.1) }));
  pool.forEach(([x, z], i) => g.add(kit.rock(1.3 + rnd() * 0.9, { x, z, y: 1.4, seed: 30 + i, mat: tone("kawara", 0.2) })));
  g.add(kit.box(0.9, 5.6, 14, mat.hinoki, { x: px + 10.2, z: pz, y: 1, bevel: 0 }));
  g.add(kit.box(14, 5.6, 0.9, mat.hinoki, { x: px + 1.5, z: pz - 9.4, y: 1, bevel: 0 }));
  const steam = [];
  [[px, pz, 4, 3.0], [px + 2, pz + 1, 9, 3.8], [px + 1, pz - 1, 14, 4.4]].forEach(([x, z, y, r], i) => {
    const s = kit.keep(kit.blob(r, mat.gofun, { x, z, y, s: [1.2, 0.65, 1], seed: 50 + i, detail: 1, jitter: 0.08 }));
    s.userData.y0 = y; steam.push(s); g.add(s);
  });
  g.userData.animate = t => steam.forEach((s, i) => {
    const k = ((t * 1.0 + i * 4.5) % 14) / 14;                    // about 1 unit a second, looping
    s.position.y = 4 + k * 14; s.scale.setScalar(0.8 + k * 0.5);
  });
  g.add(kit.tree.pine(17, { x: px + 6, z: pz + 9, seed: 5, lean: -0.3 }));

  // two stone lanterns at the head of the drive
  [-6, 6].forEach(lx => {
    const l = kit.group({ x: lx, z: 36 }), s2 = tone("kawara", 0.45);
    l.add(kit.box(2.6, 0.8, 2.6, s2, { bevel: 0.15 })); l.add(kit.cyl(0.65, 0.75, 4, s2, { y: 0.8, segments: 6 }));
    l.add(kit.box(2.8, 0.7, 2.8, s2, { y: 4.8, bevel: 0.15 })); l.add(kit.box(2.1, 1.8, 2.1, mat.gofun, { y: 5.5, bevel: 0.1 }));
    l.add(kit.cone(2.5, 1.7, s2, { y: 7.3, segments: 4, ry: Math.PI / 4 }));
    g.add(l);
  });

  // cedars and broadleaf behind and beside
  g.add(kit.grove({ x: -17, z: -30, r: 7, count: 4, kinds: ["cedar", "broadleaf"], h: 32, seed: 91 }));
  g.add(kit.grove({ x: 17, z: -30, r: 7, count: 4, kinds: ["cedar", "broadleaf"], h: 32, seed: 92 }));
  g.add(kit.grove({ x: -35, z: 6, r: 4, count: 3, kinds: ["cedar", "broadleaf"], h: 28, seed: 93 }));
  g.add(kit.tree.cedar(28, { x: 0, z: -34, seed: 102 }));
  g.add(kit.tree.broadleaf(22, { x: -33, z: 20, seed: 101 }));
  return g;
});
