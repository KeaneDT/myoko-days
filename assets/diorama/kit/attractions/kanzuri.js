/* Kanzuri, the chilli paste maker in Arai: a farmhouse workshop with a wide open doorway, red chillies drying in rows
   on straw mats across the front yard and heaped in wooden tubs, and a worker crouching by a mat. Shu is used on the
   chillies only (the subject), so the mats read as red patches even at full view. Size S. (Claude, v2) */
MyokoKit.register("kanzuri", function build(kit) {
  const { mat, tone } = kit;
  const g = kit.group();
  const rnd = kit.rand(91);
  g.add(kit.ground({ r: 44, irregular: 0.08, mat: tone("tonoko", 0.1), seed: 71, h: 1.0 }));

  // the farmhouse
  const house = kit.group({ z: -15 });
  const post = tone("hinoki", -0.3);
  house.add(kit.box(31, 1.2, 17, tone("kawara", 0.35), { y: 0.8 }));
  house.add(kit.box(30, 10, 16, mat.gofun, { y: 1.8, bevel: 0.02 }));
  [-14.4, -7.2, 7.2, 14.4].forEach(x => house.add(kit.box(1.2, 10.2, 1.2, post, { x, z: 8.1, y: 1.8, bevel: 0 })));
  house.add(kit.box(12, 8, 0.4, tone("hinoki", -0.55), { z: 8.1, y: 1.9, bevel: 0 }));      // the wide open doorway
  house.add(kit.roof({ w: 30, d: 16, h: 12, overhang: 3, style: "irimoya", sori: 1.0, thickness: 1.0, mat: mat.kawara, gableMat: post, y: 12 }));
  g.add(house);

  // straw mats of chillies, in rows
  const chilli = mat.shu, under = tone("shu", -0.12);
  function matOf(x, z, ry) {
    const m = kit.group({ x, z, ry });
    m.add(kit.box(14, 0.4, 9, mat.kuchiba, { y: 1.05, bevel: 0 }));
    m.add(kit.box(12.6, 0.3, 7.6, under, { y: 1.45, bevel: 0 }));                       // the mat covered in chillies
    for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) {
      m.add(kit.cone(0.55, 2.2, chilli, { x: -5.4 + c * 1.8 + (rnd() - 0.5) * 0.4, z: -3.2 + r * 1.6, y: 2.05, rz: Math.PI / 2, ry: (rnd() - 0.5) * 0.6, segments: 4 }));
    }
    return m;
  }
  g.add(matOf(-15, 9, 0.05));
  g.add(matOf(1, 11, -0.04));
  g.add(matOf(-8, 25, 0.02));
  g.add(matOf(10, 26, -0.06));

  // wooden tubs heaped with chillies
  [[24, 6], [30, 18], [21, 30]].forEach(([x, z], i) => {
    const t = kit.group({ x, z });
    t.add(kit.cyl(4, 3.7, 3.5, mat.hinoki, { y: 1, segments: 12 }));
    [1.6, 3.8].forEach(y => t.add(kit.cyl(4.05, 4.05, 0.35, mat.sumi, { y, segments: 12 })));
    t.add(kit.blob(3.9, chilli, { y: 4.4, s: [1, 0.55, 1], seed: 11 + i, detail: 0, jitter: 0.1 }));
    for (let k = 0; k < 4; k++) t.add(kit.cone(0.55, 2.2, chilli, { x: (rnd() - 0.5) * 4, z: (rnd() - 0.5) * 4, y: 6.3, rz: Math.PI / 2, ry: rnd() * 3, segments: 4 }));
    g.add(t);
  });

  // a worker crouching by a mat; two broadleaf trees behind the house
  g.add(kit.person({ pose: "sit", h: 9, coat: "gunjo", hat: "kuchiba", x: -4, z: 17, y: 1 }));
  g.add(kit.tree.broadleaf(21, { x: -22, z: -29, seed: 3 }));
  g.add(kit.tree.broadleaf(18, { x: 22, z: -30, seed: 8 }));
  return g;
});
