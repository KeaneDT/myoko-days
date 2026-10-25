/* Forest Therapy Walk: the Elephant Trail (象の小径) on the shore of Lake Nojiri, Shinanomachi's "Healing Forest" course.
   A grassy lakeside clearing under tall broadleaf trees (open crowns, a few turning), a small bay of the lake on the west side,
   the wooden trail board with its blue lake map and orange route, kilometre posts along a winding path, and a group of walkers
   standing in a quiet circle in the clearing (the activity: breathing, listening, noticing). Size M. */
MyokoKit.register("forest", function build(kit) {
  const { mat, tone } = kit;
  const g = kit.group();
  const TOP = 2.2;                                               // top of the domed ground

  // Ground: a soft forest-floor meadow
  g.add(kit.ground({ r: 46, irregular: 0.07, mat: tone("moegi", -0.08), seed: 31, h: TOP }));
  g.add(kit.blob(16, tone("moegi", 0.18), { x: -4, y: TOP - 0.4, z: 8, seed: 6, detail: 1, jitter: 0.05, s: [1.25, 0.07, 1.0] }));        // the sunlit clearing
  g.add(kit.blob(13, tone("moegi", -0.22), { x: 20, y: TOP - 0.5, z: -6, seed: 12, detail: 1, jitter: 0.07, s: [1.2, 0.07, 1.1] }));     // shaded floor under the trees
  g.add(kit.blob(11, tone("kuchiba", 0.05), { x: 10, y: TOP - 0.45, z: 24, seed: 18, detail: 1, jitter: 0.08, s: [1.3, 0.06, 0.9] }));    // fallen leaves

  // The lake: a small bay on the west side, with a pale shore line and a few reeds and stones
  const RB = 42, shore = [[-31, -26], [-28, -13], [-31, 1], [-27, 15], [-30, 27]];
  const a0 = Math.atan2(27, -Math.sqrt(RB * RB - 27 * 27)), a1 = Math.atan2(-26, -Math.sqrt(RB * RB - 26 * 26)) + Math.PI * 2;
  const bay = shore.slice();
  for (let i = 1; i <= 12; i++) { const t = a0 + (a1 - a0) * i / 13; bay.push([Math.cos(t) * RB, Math.sin(t) * RB]); }
  g.add(kit.water({ outline: bay, y: TOP + 0.25, mat: mat.gunjo }));
  g.add(kit.path({ points: shore.map(([x, z]) => [x + 1.3, z]), width: 2.6, y: TOP + 0.32, mat: mat.tonoko }));
  [[[-44, -10], [-39, -8], [-34, -10]], [[-43, 8], [-38, 10], [-33, 7]], [[-41, 22], [-37, 24], [-33, 21]]].forEach(pts => g.add(kit.path({ points: pts, width: 0.5, y: TOP + 0.4, mat: mat.byakugun })));
  [[-26.5, -19], [-25.5, 3], [-27, 21], [-25, -4]].forEach(([x, z], i) => g.add(kit.rock(1.4 + (i % 2) * 0.5, { x, y: TOP + 0.1, z, seed: 20 + i })));
  [[-29, -4], [-28, 22], [-30, 30]].forEach(([x, z]) => {
    g.add(kit.cone(0.3, 4.2, mat.moegi, { x, y: TOP, z, segments: 4, rz: 0.12 }));
    g.add(kit.cone(0.3, 3.5, mat.byakuroku, { x: x + 0.8, y: TOP, z: z + 0.5, segments: 4, rz: -0.1 }));
  });

  // A tall broadleaf tree with open, branching crown (the trees in the photos are bare-boughed and spreading)
  function oak(h, o) {
    const t = kit.group({ x: o.x, y: TOP, z: o.z, ry: o.ry || 0 }), r = kit.rand(o.seed || 3);
    const bark = tone("hinoki", -0.45);
    t.add(kit.cyl(h * 0.04, h * 0.07, h * 0.5, bark, { segments: 7 }));
    const crownMats = o.autumn ? [mat.kuchiba, mat.moegi, mat.kin] : [tone("rokusho", 0.05), mat.moegi, tone("rokusho", 0.22)];
    for (let i = 0; i < 4; i++) {                                // limbs fanning out
      const a = i / 4 * Math.PI * 2 + r() * 0.8, tilt = 0.55 + r() * 0.35, len = h * (0.38 + r() * 0.1);
      const limb = kit.group({ y: h * (0.4 + r() * 0.1), ry: a });
      limb.add(kit.cyl(h * 0.018, h * 0.03, len, bark, { segments: 5, rz: tilt }));
      const ex = Math.sin(tilt) * len, ey = Math.cos(tilt) * len;
      limb.add(kit.blob(h * (0.15 + r() * 0.05), crownMats[(i + (o.seed || 0)) % 3], { x: ex, y: ey + h * 0.04, seed: (o.seed || 3) * 5 + i, detail: 1, jitter: 0.2, s: [1.05, 0.7, 1.05] }));
      t.add(limb);
    }
    t.add(kit.blob(h * 0.2, crownMats[0], { y: h * 0.78, seed: (o.seed || 3) * 3, detail: 1, jitter: 0.18, s: [1.15, 0.72, 1.1] }));
    return t;
  }
  // back and sides: the forest closing round the clearing; the front stays open to the viewer
  [[-16, -26, 36, 1, 0], [2, -32, 40, 2, 1], [22, -22, 34, 3, 0], [36, -4, 32, 4, 1], [34, 20, 28, 5, 0], [-33, -26, 30, 6, 0], [14, -10, 26, 7, 0], [-6, -17, 24, 8, 0], [28, 36, 24, 9, 1]]
    .forEach(([x, z, h, s, a]) => g.add(oak(h, { x, z, seed: s, ry: s, autumn: !!a })));
  g.add(kit.tree.birch(22, { x: -22, y: TOP, z: -24, seed: 51 }));
  g.add(kit.tree.cedar(26, { x: 41, y: TOP, z: 8, seed: 52 }));
  [[-12, -12], [26, 6], [30, 30], [-8, -24], [38, 22]].forEach(([x, z], i) => g.add(kit.blob(3.2 + (i % 3) * 0.6, i % 2 ? mat.moegi : tone("rokusho", 0.1), { x, y: TOP + 0.8, z, seed: 60 + i, detail: 1, jitter: 0.2, s: [1.2, 0.8, 1.1] })));

  // The trail: from the entrance at the front right, past the clearing, along the shore (distance posts on the way)
  const trail = [[34, 42], [30, 30], [20, 22], [10, 26], [0, 24], [-12, 20], [-20, 8], [-22, -8], [-18, -20]];
  g.add(kit.path({ points: trail, width: 3.2, y: TOP + 0.22, mat: tone("tonoko", 0.1) }));
  [[16, 24.3, 0.3], [-2.5, 25.3, 0.2], [-22, -3, 1.4]].forEach(([x, z, ry]) => {
    g.add(kit.box(0.9, 4.2, 0.9, mat.hinoki, { x, y: TOP, z, ry, bevel: 0 }));
    g.add(kit.box(1.5, 1.4, 0.5, mat.gofun, { x, y: TOP + 3.1, z: z + 0.5, ry, bevel: 0 }));
  });

  // The trail board (like the one at the trailhead): dark timber, a blue lake map and an orange route
  const board = kit.group({ x: 27, y: TOP, z: 33, ry: -0.35 });
  [-3.6, 3.6].forEach(x => board.add(kit.box(0.8, 6.2, 0.8, tone("hinoki", -0.35), { x, bevel: 0 })));
  board.add(kit.box(9.6, 5.4, 0.7, tone("hinoki", -0.5), { y: 3.0, bevel: 0.06 }));
  board.add(kit.box(3.4, 4.4, 0.25, mat.gunjo, { x: -2.6, y: 3.5, z: 0.45, bevel: 0 }));
  board.add(kit.box(0.35, 3.0, 0.2, mat.shu, { x: -1.2, y: 3.8, z: 0.62, rz: 0.4, bevel: 0 }));
  board.add(kit.box(0.35, 2.2, 0.2, mat.shu, { x: -2.0, y: 3.2, z: 0.62, rz: -0.5, bevel: 0 }));
  [[2.4, 5.0, 4.6], [2.4, 3.9, 4.0], [2.4, 3.0, 3.6]].forEach(([x, y, w]) => board.add(kit.box(w, 0.4, 0.2, mat.gofun, { x: x + 0.3, y, z: 0.45, bevel: 0 })));
  g.add(board);

  // The walkers: a quiet circle in the clearing, each with a different jacket, a few with packs and hats
  const centre = [-4, 8], coats = ["kawara", "tonoko", "shu", "moegi", "gunjo", "byakuroku", "kuchiba", "sumi", "hinoki"];
  const N = 8, R = 12;
  for (let i = 0; i < N; i++) {
    const a = i / N * Math.PI * 2 + 0.3, px = centre[0] + Math.cos(a) * R, pz = centre[1] + Math.sin(a) * R * 0.9;
    const p = kit.person({ pose: "stand", coat: coats[(i * 2) % coats.length], h: 9, x: px, y: TOP + 0.2, z: pz, ry: Math.atan2(centre[0] - px, centre[1] - pz) + (i % 3 - 1) * 0.25, hat: i === 3 ? "kuchiba" : (i === 6 ? "tonoko" : undefined) });
    if (i % 2 === 0) p.add(kit.box(2.4, 3.2, 1.2, i % 4 === 0 ? mat.gofun : mat.sumi, { y: 2.8, z: -1.9, bevel: 0.1 }));       // a pack on the back
    g.add(p);
  }
  g.add(kit.person({ pose: "stand", coat: "shu", h: 9.6, x: centre[0] + 0.5, y: TOP + 0.2, z: centre[1] + 0.5, ry: 0.4 }));        // the guide, at the centre

  return g;
});
