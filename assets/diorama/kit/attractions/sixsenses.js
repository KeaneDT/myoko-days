/* Six Senses Myoko ($$$): the grandest of the three, in the same cream walls, dark slate roofs, hinoki trim and dark window
   bands as the Madarao hotel, but stepped into terraces up the slope like a mountain palace. A stone plinth with a broad
   stair, a three-storey base tier, two set-back tiers each crowned by a deep slate eave and wrapped in a fine hinoki lattice,
   a hip-roofed top tier and a tall crown tower with a gold finial, two angled wings, three private-onsen villas on one side,
   a large rock-ringed onsen pool with slow steam on the other, and a straight lantern avenue to the stair. Size M. Base
   marker. No shu. */
MyokoKit.register("sixsenses", function build(kit) {
  const { mat, tone } = kit;
  const g = kit.group();
  const rnd = kit.rand(97);

  g.add(kit.ground({ r: 44, irregular: 0.07, mat: mat.byakuroku, seed: 61, h: 1.0 }));

  const wallUpper = tone("tonoko", 0.5);
  const wallBase = tone("tonoko", 0.1);
  const roofSlate = tone("kawara", -0.35);
  const roofEdge = tone("kawara", -0.45);
  const winBand = tone("kawara", -0.3);
  const trimWood = mat.hinoki;
  const lattice = tone("hinoki", -0.12);
  const stone = tone("kawara", 0.38);
  const water = tone("byakugun", 0.1);
  const ST = 6.7;                                              // one storey

  // a tier: a block of storeys with trim and window bands, a lattice screen on the front, and either a flat deep eave or a hip roof
  function tier(w, d, storeys, y0, opts, roofKind, roofH) {
    const t = kit.group(opts);
    const H = storeys * ST;
    t.add(kit.box(w, H, d, wallUpper, { y: y0, bevel: 0.04 }));
    t.add(kit.box(w + 0.2, 1.4, d + 0.2, wallBase, { y: y0, bevel: 0.04 }));
    for (let i = 0; i < storeys; i++) {
      const by = y0 + i * ST + 2.4;
      t.add(kit.box(w - 3.0, 1.7, 0.5, winBand, { y: by, z: d / 2 - 0.1, bevel: 0.02 }));
      t.add(kit.box(w - 3.0, 1.7, 0.5, winBand, { y: by, z: -d / 2 + 0.1, bevel: 0.02 }));
      t.add(kit.box(w - 2.2, 0.3, 0.8, trimWood, { y: by - 0.4, z: d / 2, bevel: 0.02 }));
      if (i) t.add(kit.box(w + 0.4, 0.45, d + 0.4, trimWood, { y: y0 + i * ST - 0.2, bevel: 0.05 }));
    }
    // the timber lattice: fine vertical slats across the front, between two horizontal rails
    const lw = w * 0.72, n = Math.floor(lw / 1.5);
    t.add(kit.box(lw + 0.6, 0.35, 0.5, trimWood, { y: y0 + 1.5, z: d / 2 + 0.55, bevel: 0 }));
    t.add(kit.box(lw + 0.6, 0.35, 0.5, trimWood, { y: y0 + H - 0.8, z: d / 2 + 0.55, bevel: 0 }));
    for (let i = 0; i <= n; i++) t.add(kit.box(0.26, H - 2.6, 0.3, lattice, { x: -lw / 2 + i * (lw / n), y: y0 + 1.7, z: d / 2 + 0.55, bevel: 0 }));
    if (roofKind === "eave") {
      t.add(kit.box(w + 6.0, 0.9, d + 6.0, roofEdge, { y: y0 + H, bevel: 0.05 }));
      t.add(kit.box(w + 4.4, 0.7, d + 4.4, roofSlate, { y: y0 + H + 0.9, bevel: 0.05 }));
    } else {
      t.add(kit.roof({ w, d, h: roofH, overhang: 2.4, style: "hip", sori: 0.6, thickness: 0.9, mat: roofSlate, fasciaMat: roofEdge, ridgeMat: roofEdge, y: y0 + H }));
    }
    return t;
  }

  // the plinth and the broad stair
  g.add(kit.box(76, 2.2, 38, stone, { y: 0.8, z: -4, bevel: 0.05 }));
  [0, 1, 2].forEach(i => g.add(kit.box(22 - i * 2, 0.7, 4 - i * 0.2, stone, { y: 0.9 + i * 0.7, z: 16 + (2 - i) * 1.6, bevel: 0.05 })));

  // the base tier (three storeys, flat deep eave), then two set-back tiers, then the crowned top tier
  g.add(tier(58, 20, 3, 3.0, { x: 0, z: -9 }, "eave"));
  g.add(tier(44, 16, 2, 25.1, { x: 0, z: -11 }, "eave"));
  g.add(tier(30, 12, 2, 40.5, { x: 0, z: -12.5 }, "hip", 8));

  // two angled wings, each of three storeys with a hip roof
  const wingAngle = 25 * Math.PI / 180;
  g.add(tier(15, 14, 3, 3.0, { x: -31.5, z: -12.5, ry: wingAngle }, "hip", 8));
  g.add(tier(15, 14, 3, 3.0, { x: 31.5, z: -12.5, ry: -wingAngle }, "hip", 8));

  // the crown tower on the top tier: square, tall, with a steep spire and a gold finial and a gold clock face
  const tw = kit.group({ x: 0, z: -9.2 });
  const tb = 54.4, tt = 66;
  tw.add(kit.box(11.4, tt - tb, 11.4, wallUpper, { y: tb, bevel: 0.05 }));
  [tb, tb + 6.2, tt - 0.5].forEach(ty => tw.add(kit.box(12.0, 0.5, 12.0, trimWood, { y: ty, bevel: 0.05 })));
  [tb + 3.0, tb + 8.4].forEach(by => {
    tw.add(kit.box(0.5, 1.6, 7.2, winBand, { x: -5.6, y: by, bevel: 0.02 }));
    tw.add(kit.box(0.5, 1.6, 7.2, winBand, { x: 5.6, y: by, bevel: 0.02 }));
  });
  tw.add(kit.box(7.2, 1.6, 0.5, winBand, { y: tb + 8.4, z: 5.6, bevel: 0.02 }));
  tw.add(kit.cyl(2.3, 2.3, 0.5, mat.kin, { y: tb + 3.8, z: 5.9, rx: Math.PI / 2, segments: 16 }));
  tw.add(kit.cone(10.0, 15, roofSlate, { y: tt, segments: 4, ry: Math.PI / 4 }));
  tw.add(kit.box(1.4, 2.2, 1.4, mat.kin, { y: tt + 14.6, bevel: 0.15 }));
  tw.add(kit.sphere(1.1, mat.kin, { y: tt + 16.8, segments: 8 }));
  g.add(tw);

  // two small corner pavilions at the ends of the base tier, each with a gold-tipped spire
  [-26, 26].forEach(x => {
    const t = kit.group({ x, z: -1.2 });
    t.add(kit.box(8.2, 14, 8.2, wallUpper, { y: 25.1, bevel: 0.05 }));
    t.add(kit.box(8.8, 0.5, 8.8, trimWood, { y: 25.0, bevel: 0.05 }));
    t.add(kit.box(5.0, 1.6, 0.5, winBand, { y: 29, z: 3.9, bevel: 0.02 }));
    t.add(kit.box(5.0, 1.6, 0.5, winBand, { y: 34, z: 3.9, bevel: 0.02 }));
    t.add(kit.cone(6.4, 9, roofSlate, { y: 39.1, segments: 4, ry: Math.PI / 4 }));
    t.add(kit.sphere(0.8, mat.kin, { y: 48.8, segments: 8 }));
    g.add(t);
  });

  // the grand entrance: a deep porte-cochère on eight columns over the stair head
  const porch = kit.group({ x: 0, z: 7.6 });
  porch.add(kit.box(24.0, 0.8, 9.0, stone, { y: 3.0, bevel: 0.1 }));
  [-10, -3.4, 3.4, 10].forEach(px => [-3.2, 3.4].forEach(pz => porch.add(kit.box(1.2, 7.4, 1.2, wallBase, { x: px, y: 3.8, z: pz, bevel: 0.06 }))));
  porch.add(kit.box(23.0, 1.1, 8.2, wallUpper, { y: 11.0, bevel: 0.06 }));
  porch.add(kit.box(23.6, 0.45, 8.8, trimWood, { y: 12.0, bevel: 0.05 }));
  porch.add(kit.roof({ w: 23.0, d: 8.2, h: 4.8, overhang: 1.5, style: "hip", sori: 0.3, thickness: 0.6, mat: roofSlate, y: 12.4 }));
  porch.add(kit.sphere(0.9, mat.kin, { y: 17.8, segments: 8 }));
  porch.add(kit.box(7.0, 5.4, 0.6, winBand, { y: 3.8, z: -4.5, bevel: 0.04 }));
  g.add(porch);

  // the avenue: a straight tonoko approach to the stair, a lantern on either side every few steps
  g.add(kit.path({ points: [[0, 42], [0, 24]], width: 7.5, y: 1.12, mat: mat.tonoko }));
  const lant = (x, z) => {
    const l = kit.group({ x, z, s: 0.8 }), s2 = tone("kawara", 0.45);
    l.add(kit.box(2.6, 0.8, 2.6, s2, { bevel: 0.15 })); l.add(kit.cyl(0.65, 0.75, 4, s2, { y: 0.8, segments: 6 }));
    l.add(kit.box(2.8, 0.7, 2.8, s2, { y: 4.8, bevel: 0.15 })); l.add(kit.box(2.1, 1.8, 2.1, mat.gofun, { y: 5.5, bevel: 0.1 }));
    l.add(kit.cone(2.5, 1.7, s2, { y: 7.3, segments: 4, ry: Math.PI / 4 }));
    g.add(l);
  };
  [26, 31, 36, 41].forEach(z => { lant(-5.4, z); lant(5.4, z); });
  [-4.4, 4.4].forEach((sx, i) => g.add(kit.blob(2.0, mat.moegi, { x: sx * 2.2, y: 1.3, z: 22.5, seed: 80 + i, detail: 1, s: [1.1, 0.75, 1.1] })));

  // three private-onsen villas down the right-hand side, each cream with a slate hip roof and its own small pool
  [[30, 14.5], [35, 25.5], [24, 32]].forEach(([vx, vz], i) => {
    const v = kit.group({ x: vx, z: vz, ry: -0.12 + i * 0.12 });
    v.add(kit.box(10, 0.9, 10, stone, { y: 0.8, bevel: 0.05 }));
    v.add(kit.box(8.6, 6.0, 7.4, wallUpper, { y: 1.7, bevel: 0.04 }));
    v.add(kit.box(6.2, 1.6, 0.4, winBand, { y: 3.4, z: 3.8, bevel: 0.02 }));
    v.add(kit.box(9.0, 0.4, 7.8, trimWood, { y: 7.5, bevel: 0.04 }));
    v.add(kit.roof({ w: 8.6, d: 7.4, h: 3.4, overhang: 1.6, style: "hip", sori: 0.3, thickness: 0.5, mat: roofSlate, y: 7.8 }));
    v.add(kit.water({ outline: [[-3.2, 4.6], [3.2, 4.6], [3.2, 8.2], [-3.2, 8.2]], y: 1.5, mat: water }));
    g.add(v);
  });

  // the great onsen pool at the front left: a large rock-ringed pool behind a long timber screen, with slow steam
  const ox = -28, oz = 20;
  const pool = [[-8, -3], [-3.5, -6.5], [3.5, -6.8], [8, -2.5], [8.4, 3.6], [4, 7.4], [-3, 7.8], [-7.8, 4.4]].map(([x, z]) => [ox + x, oz + z]);
  g.add(kit.water({ outline: pool, y: 1.4, mat: water }));
  pool.forEach(([x, z], i) => g.add(kit.rock(1.3 + rnd() * 1.0, { x, z, y: 1.4, seed: 40 + i, mat: tone("kawara", 0.22) })));
  g.add(kit.box(18, 5.6, 0.9, mat.hinoki, { x: ox, z: oz - 10.2, y: 1, bevel: 0 }));
  g.add(kit.box(0.9, 5.6, 12, mat.hinoki, { x: ox - 10.6, z: oz - 3, y: 1, bevel: 0 }));
  const steam = [];
  [[ox, oz, 4, 3.4], [ox + 2, oz + 1, 9, 4.2], [ox - 1, oz - 1, 14, 4.8]].forEach(([x, z, y, r], i) => {
    const s = kit.keep(kit.blob(r, mat.gofun, { x, z, y, s: [1.2, 0.65, 1], seed: 70 + i, detail: 1, jitter: 0.08 }));
    s.userData.y0 = y; steam.push(s); g.add(s);
  });
  g.userData.animate = t => steam.forEach((s, i) => {
    const k = ((t * 1.0 + i * 4.5) % 14) / 14;
    s.position.y = 4 + k * 14; s.scale.setScalar(0.8 + k * 0.5);
  });
  g.add(kit.tree.pine(16, { x: ox - 8, z: oz + 11, seed: 7, lean: 0.25 }));

  // cedars and broadleaf behind and at the sides
  g.add(kit.grove({ x: -17, z: -31, r: 7, count: 5, kinds: ["cedar", "broadleaf"], h: 34, seed: 19 }));
  g.add(kit.grove({ x: 17, z: -31, r: 7, count: 5, kinds: ["cedar", "broadleaf"], h: 34, seed: 20 }));
  g.add(kit.tree.cedar(32, { x: 0, z: -35, seed: 3 }));
  g.add(kit.grove({ x: -37, z: 2, r: 3, count: 3, kinds: ["cedar", "broadleaf"], h: 28, seed: 21 }));
  g.add(kit.tree.cedar(30, { x: 38, z: 2, seed: 4 }));
  return g;
});
