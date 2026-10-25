/* Daruma painting: a temple hall in Sekigawa on a gravel court, with a big hip roof, and a large red daruma by the
   entrance plus three small ones on a table where visitors paint their own. A pine and clipped shrubs; no torii, no
   cedars, so it reads differently from Sekiyama Shrine. Size S. (Claude, v2) */
MyokoKit.register("daruma", function build(kit) {
  const { mat, tone } = kit;
  const g = kit.group();
  g.add(kit.ground({ r: 44, irregular: 0.08, mat: mat.byakuroku, seed: 51, h: 0.9 }));
  g.add(kit.ground({ r: 38, irregular: 0.05, mat: tone("tonoko", 0.1), seed: 52, h: 1.05 }));     // the gravel court

  // the hall
  const hall = kit.group({ z: -10 });
  const stone = tone("kawara", 0.4), post = tone("hinoki", -0.3);
  hall.add(kit.box(36, 2.6, 25, stone, { y: 0.9 }));
  hall.add(kit.box(31, 9, 20, mat.hinoki, { y: 3.4, bevel: 0.02 }));
  [-10.5, -3.5, 3.5, 10.5].forEach(x => hall.add(kit.box(5.4, 6.2, 0.3, mat.gofun, { x, z: 10.05, y: 4.6, bevel: 0 })));  // white panels
  [-15, -7, 0, 7, 15].forEach(x => hall.add(kit.box(1.2, 9.2, 1.2, post, { x, z: 10.2, y: 3.4, bevel: 0 })));
  hall.add(kit.box(32, 1.0, 21, post, { y: 12.3, bevel: 0 }));
  hall.add(kit.roof({ w: 34, d: 22, h: 15, overhang: 5, style: "hip", sori: 2, thickness: 1.2, mat: mat.kawara, y: 13.2 }));
  hall.add(kit.box(1.6, 1.2, 1.6, mat.kin, { y: 28.6, bevel: 0.1 }));
  [0, 1, 2].forEach(i => hall.add(kit.box(12 - i, 1.1, 2.6, mat.hinoki, { z: 13.6 + i * 2.2, y: 3.4 - (i + 1) * 0.85, bevel: 0 })));  // steps
  g.add(hall);

  // a daruma: egg body, gofun face with kin trim, eyes and brows (no characters)
  function daruma(r, o) {
    const d = kit.group(o);
    d.add(kit.sphere(r, mat.shu, { y: r * 1.15, s: [1, 1.15, 0.95], segments: 14 }));
    d.add(kit.sphere(r * 0.62, mat.kin, { y: r * 1.3, z: r * 0.62, s: [1, 0.92, 0.42], segments: 12 }));
    d.add(kit.sphere(r * 0.56, mat.gofun, { y: r * 1.3, z: r * 0.68, s: [1, 0.9, 0.42], segments: 12 }));
    [-1, 1].forEach(s => {
      d.add(kit.sphere(r * 0.1, mat.sumi, { x: s * r * 0.22, y: r * 1.36, z: r * 0.9, segments: 8 }));
      d.add(kit.box(r * 0.26, r * 0.07, r * 0.07, mat.sumi, { x: s * r * 0.24, y: r * 1.56, z: r * 0.86, rz: -s * 0.25, bevel: 0 }));
    });
    return d;
  }
  // the big one by the entrance, on a timber stand
  g.add(kit.cyl(5.6, 6, 1.6, mat.hinoki, { x: 14, z: 13, y: 1, segments: 12 }));
  g.add(daruma(7, { x: 14, z: 13, y: 2.6, ry: -0.25 }));
  // three small ones on a painting table
  const table = kit.group({ x: -13, z: 14 });
  [[-6.5, -1.8], [6.5, -1.8], [-6.5, 1.8], [6.5, 1.8]].forEach(([x, z]) => table.add(kit.box(0.6, 3, 0.6, post, { x, z, y: 1, bevel: 0 })));
  table.add(kit.box(15, 0.8, 5, mat.hinoki, { y: 4, bevel: 0 }));
  [-4.5, 0, 4.5].forEach((x, i) => table.add(daruma(2.2, { x, y: 4.8, ry: (i - 1) * 0.3 })));
  g.add(table);

  // a pine at the back left, two clipped shrubs by the steps
  g.add(kit.tree.pine(22, { x: -26, z: -23, seed: 6, lean: 0.3 }));
  [-9, 9].forEach((x, i) => g.add(kit.blob(3, mat.moegi, { x, z: 7.5, y: 2.6, s: [1.2, 0.8, 1], seed: 8 + i, detail: 0, jitter: 0.08 })));
  return g;
});
