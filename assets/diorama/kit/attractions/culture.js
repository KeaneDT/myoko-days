/* Sekigawa checkpoint (Sekigawa no Sekisho) on the old North Country Road, v3: the Seki river now runs straight
   through the model and the Edo-period timber gate stands over it, on a plank bridge, so the gate "crosses" the river
   (the engine turns the model so its river lines up with the map's river: model-local X is the river).
   Palisades run along the far bank either side of the bridge, the guardhouse sits behind them, and two travellers in
   straw hats walk the road toward the gate. Size S. No shu in this model. (Claude, v3) */
MyokoKit.register("culture", function build(kit) {
  const { mat, tone } = kit;
  const g = kit.group();
  g.add(kit.ground({ r: 44, irregular: 0.08, mat: mat.byakuroku, seed: 31, h: 1.0 }));

  // the river along X, edge to edge: deep water, paler shallows and a fine white bank line (as the map's rivers)
  const RW = 15, rz = 0;
  const run = [[-47, rz], [-24, rz + 1.2], [0, rz], [24, rz - 1.2], [47, rz]];
  g.add(kit.path({ points: run, width: RW + 2.2, y: 1.04, mat: mat.gofun }));
  g.add(kit.path({ points: run, width: RW, y: 1.07, mat: tone("byakugun", -0.1) }));
  g.add(kit.path({ points: run, width: RW * 0.62, y: 1.10, mat: mat.gunjo }));
  // a few river stones at the bank
  [[-30, 8.6, 1.6], [-18, -8.8, 1.3], [33, -8.4, 1.5], [21, 8.9, 1.2]].forEach(([x, z, r], i) => g.add(kit.rock(r, { x, y: 1.0, z, seed: 60 + i })));

  // the road (along Z) up to each end of the bridge
  g.add(kit.path({ points: [[0, 40], [0.6, 26], [0, 10]], width: 9, y: 1.05, mat: mat.tonoko }));
  g.add(kit.path({ points: [[0, -10], [-0.6, -26], [0, -40]], width: 9, y: 1.05, mat: mat.tonoko }));

  const post = tone("hinoki", -0.3), timber = tone("hinoki", -0.15), deck = tone("hinoki", 0.05);
  // the plank bridge: a gently arched deck on four piers, with low rails
  const DECK_Y = 3.2;
  for (let i = 0; i < 9; i++) {
    const z = -11 + i * 2.75, y = DECK_Y + 1.1 * Math.cos((z / 12) * Math.PI / 2);
    g.add(kit.box(11, 0.7, 2.6, i % 2 ? deck : timber, { z, y, bevel: 0 }));
  }
  [-5.2, 5.2].forEach(x => {
    [-6, 6].forEach(z => g.add(kit.box(1.2, DECK_Y + 0.6, 1.2, post, { x, z, y: 0.4, bevel: 0 })));
    g.add(kit.beam(23, 0.5, 0.5, timber, { x, y: DECK_Y + 2.3, ry: Math.PI / 2, curve: 0.9 }));
    [-10, -5, 5, 10].forEach(z => g.add(kit.box(0.5, 2.2, 0.5, post, { x, z, y: DECK_Y + 0.6, bevel: 0 })));
  });

  // the gate on the middle of the bridge: two thick posts, a heavy tie beam, a small gable roof
  const GY = DECK_Y + 1.6;
  [-6.2, 6.2].forEach(x => g.add(kit.box(2.2, 17, 2.2, post, { x, y: GY - 0.4, bevel: 0.06 })));
  g.add(kit.beam(18, 2.0, 2.4, timber, { y: GY + 15 }));
  g.add(kit.beam(15, 1.1, 1.5, timber, { y: GY + 10.5 }));
  g.add(kit.roof({ w: 19, d: 6.5, h: 5.2, overhang: 1.1, style: "gable", thickness: 0.8, mat: mat.kawara, gableMat: timber, y: GY + 17 }));
  // the two big doors, swung open toward the far bank
  [-1, 1].forEach(s => {
    const hinge = kit.group({ x: s * 5.0, y: GY - 0.2, ry: s * 1.15 });
    hinge.add(kit.box(5, 12.5, 0.7, timber, { x: -s * 2.5, bevel: 0.05 }));
    [3, 8.5].forEach(y => hinge.add(kit.box(5.2, 0.6, 1.0, post, { x: -s * 2.5, y, bevel: 0 })));
    g.add(hinge);
  });

  // palisades along the far bank either side of the bridge
  const BANK = -11.5;
  [-1, 1].forEach(s => {
    for (let x = 8; x <= 38; x += 2.1) {
      const h = 7 - (x > 33 ? (x - 33) * 0.6 : 0);
      g.add(kit.box(1.5, h, 1.2, tone("hinoki", -0.22), { x: s * x, z: BANK, y: 1, bevel: 0 }));
    }
    g.add(kit.box(30, 0.6, 1.5, post, { x: s * 23, z: BANK + 0.2, y: 5.4, bevel: 0 }));
  });

  // the guardhouse behind the palisade, back right
  const gh = kit.group({ x: 18, z: -25 });
  gh.add(kit.box(21, 1.4, 13, tone("kawara", 0.4), { y: 0.8 }));
  gh.add(kit.box(19, 7.5, 11, mat.gofun, { y: 2.2, bevel: 0.03 }));
  [-9.2, -3, 3, 9.2].forEach(x => gh.add(kit.box(1.1, 7.6, 1.1, post, { x, z: 5.6, y: 2.2, bevel: 0 })));
  gh.add(kit.box(7, 4.5, 0.5, tone("hinoki", -0.45), { z: 5.6, y: 2.4, bevel: 0 }));
  gh.add(kit.roof({ w: 20, d: 12, h: 9, overhang: 2.2, style: "irimoya", sori: 1.2, thickness: 0.9, mat: mat.kawara, gableMat: timber, y: 9.6 }));
  g.add(gh);

  // two travellers on the near road, walking toward the bridge
  g.add(kit.person({ pose: "walk", h: 9, coat: "tonoko", hat: "kuchiba", x: -1.6, z: 18, ry: Math.PI }));
  g.add(kit.person({ pose: "walk", h: 9, coat: "gunjo", hat: "kuchiba", x: 2, z: 27, ry: Math.PI }));

  // old cedars behind, a pine on the near bank
  g.add(kit.grove({ x: -14, z: -29, r: 8, count: 4, kinds: ["cedar"], h: 30, seed: 12 }));
  g.add(kit.tree.cedar(32, { x: 34, z: -27, seed: 9 }));
  g.add(kit.tree.pine(16, { x: -28, z: 24, seed: 4, lean: 0.3 }));
  return g;
});
