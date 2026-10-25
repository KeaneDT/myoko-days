/* Soba making with lunch: an old thatched minka with a big steep irimoya roof, an indigo noren over the door, a bench
   with a shu cloth and a tray of soba, a small white-flowering buckwheat field and the host by the door. Size S.
   (Claude, v2) */
MyokoKit.register("soba", function build(kit) {
  const { mat, tone } = kit;
  const g = kit.group();
  const rnd = kit.rand(77);
  g.add(kit.ground({ r: 44, irregular: 0.08, mat: mat.byakuroku, seed: 41, h: 1.0 }));
  g.add(kit.path({ points: [[2, 44], [2, 26], [1, 14], [0, 6]], width: 6, y: 1.05, mat: mat.tonoko }));

  const post = tone("hinoki", -0.3);
  const house = kit.group({ z: -6 });
  house.add(kit.box(33, 1.2, 21, tone("kawara", 0.35), { y: 0.8 }));
  house.add(kit.box(32, 9, 20, mat.gofun, { y: 1.8, bevel: 0.02 }));
  [-15.6, -7.8, 0, 7.8, 15.6].forEach(x => house.add(kit.box(1.3, 9.2, 1.3, post, { x, z: 10.1, y: 1.8, bevel: 0 })));
  house.add(kit.box(32.4, 1.0, 20.4, post, { y: 10.2, bevel: 0 }));
  house.add(kit.box(10, 7, 0.4, tone("hinoki", -0.55), { z: 10.1, y: 1.9, bevel: 0 }));     // the open door
  // the big thatched roof
  house.add(kit.roof({ w: 32, d: 20, h: 20, overhang: 4, style: "irimoya", sori: 0.6, thickness: 2.5,
                       mat: tone("kuchiba", -0.35), ridgeMat: tone("kuchiba", -0.5), fasciaMat: tone("kuchiba", -0.45), gableMat: post, y: 11 }));
  // the noren: three indigo panels over the door
  [-3.6, 0, 3.6].forEach(x => house.add(kit.box(3.4, 5, 0.3, mat.gunjo, { x, z: 10.6, y: 4, bevel: 0 })));
  g.add(house);

  // the bench (shogi) with a shu cloth and a zaru of soba
  const bench = kit.group({ x: 12, z: 16 });
  [[-5, -1.4], [5, -1.4], [-5, 1.4], [5, 1.4]].forEach(([x, z]) => bench.add(kit.box(0.7, 2.4, 0.7, post, { x, z, y: 1, bevel: 0 })));
  bench.add(kit.box(12, 0.9, 4.2, mat.hinoki, { y: 3.4, bevel: 0 }));
  bench.add(kit.box(12.4, 0.35, 4.6, mat.shu, { y: 4.3, bevel: 0 }));
  bench.add(kit.cyl(2.6, 2.4, 0.6, mat.hinoki, { x: -2, y: 4.65, segments: 12 }));
  bench.add(kit.blob(1.9, tone("tonoko", -0.25), { x: -2, y: 5.4, s: [1, 0.4, 1], seed: 3, detail: 0, jitter: 0.08 }));
  bench.add(kit.cyl(0.9, 0.7, 1.0, tone("kawara", -0.2), { x: 2.6, y: 4.65, segments: 8 }));    // a cup of dipping sauce
  g.add(bench);

  // a small buckwheat field: low rows dotted with white flowers
  const field = kit.group({ x: -21, z: 18, ry: 0.1 });
  field.add(kit.box(19, 0.6, 13, tone("byakuroku", -0.12), { y: 1, bevel: 0 }));
  for (let r = 0; r < 5; r++) {
    const z = -5 + r * 2.5;
    field.add(kit.box(18, 1.6, 1.6, mat.byakuroku, { z, y: 1.4, bevel: 0 }));
    for (let i = 0; i < 9; i++) field.add(kit.box(0.9, 0.9, 0.9, mat.gofun, { x: -8 + i * 2 + rnd() * 0.8, z: z + (rnd() - 0.5) * 1.0, y: 2.9, bevel: 0 }));
  }
  g.add(field);

  // trees behind the house; the host by the door
  g.add(kit.tree.broadleaf(22, { x: -26, z: -28, seed: 2 }));
  g.add(kit.tree.broadleaf(19, { x: 25, z: -30, seed: 5 }));
  g.add(kit.tree.cedar(34, { x: 4, z: -38, seed: 7 }));
  g.add(kit.person({ pose: "stand", h: 9, coat: "gunjo", x: 7.5, z: 7 }));
  return g;
});
