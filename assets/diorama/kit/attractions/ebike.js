/* E-bike through the rice fields (v3, quieter and closer to the painting): an irregular patchwork of terraced paddies
   in young-rice greens, ripening gold and a few still-flooded mirrors of sky, divided by low earth levees; a narrow
   farm lane winding through with an irrigation channel beside it; one rider on a slim e-bike (thin ring wheels, an
   indigo jacket); a thatched farmhouse with its storehouse and a cedar windbreak; a long hasa drying rack by the lane.
   Size M (displayed large). Muted, crafted, no cartoon proportions. (Claude, v3) */
MyokoKit.register("ebike", function build(kit) {
  const { mat, tone } = kit;
  const g = kit.group();
  const rnd = kit.rand(812);

  // the ground: earth of the levees
  g.add(kit.ground({ r: 46, irregular: 0.05, mat: tone("tonoko", -0.12), seed: 12, h: 0.8 }));

  // ---- paddies: organic quadrilaterals on a slightly skewed grid, each a low raised plate (the gaps are the levees)
  const young = [tone("moegi", -0.16), tone("moegi", -0.08), tone("byakuroku", -0.06)];
  const gold = [tone("kuchiba", -0.08), tone("kuchiba", -0.16)];
  const flooded = tone("byakugun", 0.05);
  const lane = t => [-44 + 88 * t, 10 * Math.sin(t * Math.PI * 1.2 - 0.6) + 4];   // the lane, x along, z
  const laneZ = x => { const t = (x + 44) / 88; return lane(t)[1]; };
  const cols = [-42, -29, -16, -3, 10, 23, 36, 46], rows = [-44, -31, -19, -7, 6, 18, 30, 44];
  for (let i = 0; i < cols.length - 1; i++) for (let j = 0; j < rows.length - 1; j++) {
    const j0 = (a, b) => [a + (rnd() - 0.5) * 2.4, b + (rnd() - 0.5) * 2.4];
    const x0 = cols[i] + 1.1, x1 = cols[i + 1] - 1.1, z0 = rows[j] + 1.1, z1 = rows[j + 1] - 1.1;
    const sk = 0.10 * (x0 + x1) * 0.5;                                  // the grid leans gently with the slope
    const quad = [j0(x0, z0 + sk), j0(x1, z0 + sk), j0(x1, z1 + sk), j0(x0, z1 + sk)];
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2 + sk;
    if (Math.hypot(cx, cz) > 40) continue;                              // inside the round base
    if (Math.abs(cz - laneZ(cx)) < 8.5) continue;                       // the lane runs here
    if (Math.hypot(cx + 2, cz - laneZ(-2)) < 17) continue;               // open ground round the bike
    if (cx < -14 && cz < -14) continue;                                 // the farmstead, back left
    const roll = rnd();
    const m = roll < 0.16 ? flooded : roll < 0.40 ? gold[Math.floor(rnd() * 2)] : young[Math.floor(rnd() * 3)];
    g.add(kit.water({ outline: quad, y: 0.95 + rnd() * 0.25, mat: m }));
    // faint planting rows on the green and gold plots
    if (m !== flooded) for (let k = 1; k < 4; k++) {
      const f = k / 4, za = quad[0][1] + (quad[3][1] - quad[0][1]) * f, zb = quad[1][1] + (quad[2][1] - quad[1][1]) * f;
      g.add(kit.path({ points: [[quad[0][0] + 1, za], [quad[1][0] - 1, zb]], width: 0.3, y: 1.32, mat: tone(m === gold[0] || m === gold[1] ? "kuchiba" : "moegi", -0.24) }));
    }
  }

  // ---- the lane and the irrigation channel beside it
  const lanePts = []; for (let t = 0; t <= 1.0001; t += 0.05) lanePts.push(lane(t));
  g.add(kit.path({ points: lanePts, width: 5.2, y: 1.0, mat: tone("tonoko", 0.12) }));
  // the irrigation stream: the map's river runs in at one end and on to Lake Nojiri at the other (as wide as the map's river)
  const ch = lanePts.map(([x, z]) => [x, z + 4.6]);
  g.add(kit.path({ points: ch, width: 3.0, y: 1.02, mat: mat.gofun }));
  g.add(kit.path({ points: ch, width: 2.5, y: 1.04, mat: tone("byakugun", -0.1) }));
  g.add(kit.path({ points: ch, width: 1.5, y: 1.06, mat: mat.gunjo }));

  // ---- the rider on an e-bike, large and always side-on to the viewer, so it reads as a bicycle at a glance
  //      (whatever way the engine turns the model, the bike is turned back to run across the screen)
  const bx = -2, bz = laneZ(-2) + 2;
  const bike = kit.group({ x: bx, y: 1.1, z: bz, ry: (kit.facing || 0) * Math.PI / 180 });
  const BS = 2.1;                                                        // bike scale
  const P = (x, y) => [x * BS, y * BS, 0];
  const ring = (cx, cy, r) => {
    const n = 20;
    for (let i = 0; i < n; i++) {
      const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2;
      bike.add(kit.cable(P(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r), P(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r), { r: 0.55, sag: 0, mat: mat.sumi }));
    }
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI; bike.add(kit.cable(P(cx + Math.cos(a) * r, cy + Math.sin(a) * r), P(cx - Math.cos(a) * r, cy - Math.sin(a) * r), { r: 0.12, sag: 0, mat: tone("kawara", 0.2) })); }
    bike.add(kit.cyl(0.9, 0.9, 1.0, tone("kawara", -0.2), { x: cx * BS, y: cy * BS, rx: Math.PI / 2, segments: 10 }));
  };
  ring(-4.2, 3.2, 3.0); ring(4.2, 3.2, 3.0);
  const frame = tone("shu", -0.15);                                      // a lacquer-red frame: the one bright accent
  const tube = (a, b, r) => bike.add(kit.cable(P(...a), P(...b), { r: r * BS, sag: 0, mat: frame }));
  tube([-4.2, 3.2], [-0.6, 3.4], 0.24); tube([-0.6, 3.4], [-1.6, 7.0], 0.26); tube([-1.6, 7.0], [3.0, 7.0], 0.26);
  tube([-0.6, 3.4], [3.0, 7.0], 0.34); tube([3.0, 7.0], [4.2, 3.2], 0.24); tube([-4.2, 3.2], [-1.6, 7.0], 0.2);
  tube([3.0, 7.0], [3.3, 8.4], 0.24);
  bike.add(kit.box(1.9 * BS, 0.9 * BS, 0.9 * BS, mat.gofun, { x: 1.0 * BS, y: 4.4 * BS, rz: 0.78, bevel: 0.1 }));       // the battery
  bike.add(kit.box(0.5 * BS, 0.5 * BS, 3.6 * BS, mat.sumi, { x: 3.3 * BS, y: 8.4 * BS, bevel: 0 }));                  // handlebar
  bike.add(kit.box(2.0 * BS, 0.5 * BS, 1.0 * BS, mat.sumi, { x: -1.8 * BS, y: 7.3 * BS, bevel: 0.1 }));               // saddle
  bike.add(kit.box(1.6 * BS, 1.0 * BS, 1.8 * BS, tone("hinoki", -0.1), { x: -4.4 * BS, y: 6.3 * BS, bevel: 0.1 }));  // a basket of vegetables
  bike.add(kit.person({ pose: "ride", coat: "gunjo", hat: "kuchiba", h: 9.5 * BS, x: -1.2 * BS, y: 7.3 * BS, ry: Math.PI / 2 }));
  // the rider's legs down to the pedals, so the figure reads as cycling
  bike.add(kit.cable(P(-1.0, 7.6), P(0.4, 5.2), { r: 0.45 * BS, sag: 0, mat: tone("kawara", -0.3) }));
  bike.add(kit.cable(P(0.4, 5.2), P(-0.4, 3.4), { r: 0.4 * BS, sag: 0, mat: tone("kawara", -0.3) }));
  bike.add(kit.cable(P(1.6, 8.9), P(3.3, 8.5), { r: 0.35 * BS, sag: 0, mat: mat.gunjo }));                            // arm to the bars
  // a short shadow under it, so it sits on the lane
  bike.add(kit.ground({ r: 9 * BS, h: 0.05, irregular: 0.02, mat: tone("tonoko", -0.25), seed: 3 }));
  bike.children[bike.children.length - 1].scale.set(1, 1, 0.28);
  g.add(bike);

  // ---- the farmstead, back left: thatched farmhouse, storehouse, cedar windbreak
  const yard = kit.group({ x: -25, y: 0.8, z: -24, ry: 0.35 });
  yard.add(kit.box(26, 0.3, 20, tone("tonoko", 0.05), { y: 0, bevel: 0 }));
  const post = tone("hinoki", -0.3);
  const house = kit.group({ x: -2, z: 2 });
  house.add(kit.box(15, 1.0, 9.5, tone("kawara", 0.3), { y: 0.2 }));
  house.add(kit.box(14, 5.2, 8.5, tone("hinoki", -0.05), { y: 1.2, bevel: 0.03 }));
  house.add(kit.box(9, 3.8, 0.4, mat.gofun, { y: 2.0, z: 4.3, bevel: 0 }));
  [-6.8, -2.3, 2.3, 6.8].forEach(x => house.add(kit.box(0.7, 5.4, 0.7, post, { x, y: 1.2, z: 4.3, bevel: 0 })));
  house.add(kit.roof({ w: 14, d: 8.5, h: 9.5, overhang: 2.0, style: "irimoya", sori: 0.4, thickness: 1.8,
    mat: tone("kuchiba", -0.38), fasciaMat: tone("kuchiba", -0.5), ridgeMat: tone("kawara", -0.3), gableMat: tone("hinoki", -0.3), y: 6.4 }));
  yard.add(house);
  const kura = kit.group({ x: 9, z: -4 });
  kura.add(kit.box(6.5, 1.0, 6, tone("kawara", 0.25), { y: 0.2 }));
  kura.add(kit.box(6, 6.5, 5.5, mat.gofun, { y: 1.2, bevel: 0.03 }));
  kura.add(kit.box(6.1, 1.6, 5.6, tone("kawara", -0.2), { y: 1.2, bevel: 0 }));               // namako base band
  kura.add(kit.roof({ w: 6, d: 5.5, h: 3.2, overhang: 0.9, style: "gable", thickness: 0.6, mat: mat.kawara, gableMat: mat.gofun, y: 7.7 }));
  yard.add(kura);
  g.add(yard);
  g.add(kit.grove({ x: -34, z: -36, r: 7, count: 5, kinds: ["cedar"], h: 26, seed: 21 }));
  g.add(kit.grove({ x: -12, z: -40, r: 5, count: 3, kinds: ["cedar"], h: 22, seed: 27 }));
  g.add(kit.tree.broadleaf(14, { x: -40, z: -12, seed: 31 }));

  // ---- one long hasa rack beside the lane, hung with rice
  const rack = kit.group({ x: 20, y: 0.9, z: laneZ(20) - 7.5, ry: Math.atan2(-(laneZ(24) - laneZ(16)), 8) });
  for (let x = -11; x <= 11; x += 5.5) rack.add(kit.cyl(0.3, 0.36, 7.5, tone("hinoki", -0.2), { x, segments: 6 }));
  [4.0, 6.4].forEach(y => rack.add(kit.beam(23, 0.32, 0.32, tone("hinoki", -0.3), { y })));
  for (let x = -10; x <= 10; x += 1.6) rack.add(kit.box(1.3, 2.3, 1.1, tone("kuchiba", -0.12 - 0.06 * ((x * 7) % 2)), { x, y: 4.2, bevel: 0.2 }));
  g.add(rack);

  // a stone lantern where the lane leaves the farmstead
  const lan = kit.group({ x: -16, y: 0.9, z: laneZ(-16) - 5 });
  lan.add(kit.cyl(0.9, 1.1, 2.6, tone("kawara", 0.25), { segments: 8 }));
  lan.add(kit.box(2.2, 1.4, 2.2, tone("kawara", 0.15), { y: 2.6, bevel: 0.1 }));
  lan.add(kit.cone(1.8, 1.3, tone("kawara", -0.05), { y: 4.0, segments: 6 }));
  g.add(lan);
  return g;
});
