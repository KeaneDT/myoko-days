/* Rice Harvest & Sasa-zushi: a hillside paddy in the last week of harvest. Half the plot is cut and lying in rows of sheaves,
   the rest still standing gold; a double hasa rack by the track is hung with drying rice; two harvesters in wide hats and neck cloths
   bend to the cutting (blue bucket, sickle); a white kei truck waits on the farm track under a cedar edge. At the front, a bamboo
   tray of sasa-zushi: leaf-wrapped pieces topped with salmon, egg, mushroom and bamboo shoot, the second half of the day. Size M. */
MyokoKit.register("rice", function build(kit) {
  const { mat, tone } = kit;
  const g = kit.group();
  const rnd = kit.rand(447);
  const TOP = 1.0;

  g.add(kit.ground({ r: 46, irregular: 0.06, mat: tone("byakuroku", -0.12), seed: 15, h: TOP }));

  // ---- the paddy plots: a standing gold plot (back), the cut plot (centre), a narrow green bank between and around
  const gold = [tone("kin", 0.05), tone("kuchiba", 0.0), tone("kin", -0.06)];
  const stub = tone("tonoko", -0.12), stub2 = tone("tonoko", -0.24);
  const plot = (quad, m, y) => g.add(kit.water({ outline: quad, y, mat: m }));
  plot([[-34, -34], [10, -38], [14, -12], [-30, -8]], gold[0], TOP + 0.12);           // standing rice
  plot([[-30, -6], [16, -10], [22, 18], [-26, 16]], stub, TOP + 0.20);                // the cut plot
  plot([[-38, 20], [-4, 22], [-6, 36], [-34, 34]], gold[1], TOP + 0.16);              // a small plot at the front left
  plot([[18, -34], [38, -30], [38, -8], [20, -10]], gold[2], TOP + 0.18);             // the next terrace up, right
  // standing rice: rows of tufts
  for (let k = 1; k < 9; k++) {
    const f = k / 9, z = -36 + f * 26;
    g.add(kit.path({ points: [[-31 + f * 3, z], [10 + f * 3, z + 1]], width: 0.5, y: TOP + 0.3, mat: tone("kuchiba", -0.26) }));
  }
  for (let i = 0; i < 26; i++) g.add(kit.blob(1.4 + rnd() * 0.7, gold[i % 2], { x: -28 + rnd() * 38, y: TOP + 0.7, z: -34 + rnd() * 24, seed: 100 + i, detail: 0, jitter: 0.25, s: [1.5, 0.8, 1.1] }));
  // stubble stripes on the cut plot, and the cut rice lying in rows (sheaves)
  for (let k = 0; k < 7; k++) g.add(kit.path({ points: [[-26, -3 + k * 3.1], [18, -6 + k * 3.4]], width: 0.5, y: TOP + 0.32, mat: stub2 }));
  [[-18, -2], [-10, 0], [-2, 2], [6, 3], [-20, 6], [-12, 8], [-4, 10], [4, 11], [12, 12], [-16, 13], [-8, 14]].forEach(([x, z], i) => {
    const a = (i % 3 - 1) * 0.18;
    g.add(kit.box(5.2, 0.9, 1.6, tone("kuchiba", 0.04 - (i % 2) * 0.1), { x, y: TOP + 0.7, z, ry: a, bevel: 0.3 }));
    g.add(kit.box(1.0, 0.8, 1.8, tone("tonoko", -0.3), { x: x + 1.2, y: TOP + 0.75, z, ry: a, bevel: 0.2 }));    // the binding
  });
  // levees between the plots
  [[[-36, -7], [18, -11]], [[-36, 19], [-3, 21]]].forEach(pts => g.add(kit.path({ points: pts, width: 2.2, y: TOP + 0.34, mat: tone("moegi", -0.05) })));

  // ---- the farm track along the front, to the truck and out of the model on the right
  g.add(kit.path({ points: [[-46, 40], [-20, 40], [4, 34], [26, 26], [44, 18]], width: 5.4, y: TOP + 0.1, mat: tone("tonoko", 0.06) }));
  g.add(kit.path({ points: [[-46, 36.8], [-20, 36.8], [3, 30.8], [26, 23], [44, 15]], width: 1.4, y: TOP + 0.14, mat: tone("moegi", 0.1) }));

  // ---- the double hasa rack with drying rice
  const rack = kit.group({ x: 28, y: TOP, z: 4, ry: 0.15 });
  for (let x = -12; x <= 12; x += 6) {
    rack.add(kit.cyl(0.32, 0.4, 11, tone("hinoki", -0.25), { x, z: -1.1, segments: 6 }));
    rack.add(kit.cyl(0.32, 0.4, 11, tone("hinoki", -0.25), { x, z: 1.1, segments: 6 }));
  }
  [3.8, 6.4, 9.0].forEach(y => rack.add(kit.beam(26, 0.4, 0.4, tone("hinoki", -0.35), { y })));
  for (let tier = 0; tier < 3; tier++) for (let x = -12; x <= 12; x += 1.7)
    rack.add(kit.box(1.4, 2.4, 2.4, tone("kuchiba", -0.08 - 0.06 * ((x * 5 + tier) % 2)), { x, y: 3.9 + tier * 2.6, bevel: 0.25 }));
  g.add(rack);

  // ---- cedar edge and trees, back and right
  g.add(kit.grove({ x: 30, z: -38, r: 6, count: 6, kinds: ["cedar"], h: 27, seed: 71 }));
  g.add(kit.grove({ x: -10, z: -42, r: 9, count: 6, kinds: ["cedar", "broadleaf"], h: 23, seed: 73 }));
  g.add(kit.grove({ x: -37, z: -24, r: 4, count: 3, kinds: ["cedar"], h: 21, seed: 77 }));
  g.add(kit.tree.broadleaf(12, { x: 40, y: TOP, z: 8, seed: 83 }));

  // ---- a small farm shed at the left edge
  const shed = kit.group({ x: -40, y: TOP, z: -4, ry: 0.4 });
  shed.add(kit.box(11, 5.2, 8, tone("hinoki", -0.3), { y: 0, bevel: 0.03 }));
  shed.add(kit.roof({ w: 11, d: 8, h: 3.4, overhang: 1.2, style: "gable", thickness: 0.6, mat: tone("kawara", -0.1), gableMat: tone("hinoki", -0.3), y: 5.2 }));
  g.add(shed);

  // ---- the white kei truck on the track
  const truck = kit.group({ x: 14, y: TOP + 0.3, z: 29, ry: -0.42 });
  truck.add(kit.box(11, 1.0, 5.2, mat.sumi, { y: 0.9, bevel: 0.1 }));                 // chassis
  truck.add(kit.box(4.6, 4.2, 5.0, mat.gofun, { x: 2.8, y: 1.6, bevel: 0.15 }));      // cab
  truck.add(kit.box(0.4, 1.8, 4.4, mat.gunjo, { x: 5.2, y: 3.0, bevel: 0 }));         // windscreen
  truck.add(kit.box(6.2, 1.2, 5.2, mat.gofun, { x: -2.8, y: 1.5, bevel: 0.1 }));      // bed
  truck.add(kit.box(5.8, 0.9, 4.5, tone("kuchiba", -0.1), { x: -2.8, y: 2.5, bevel: 0.3 }));     // a load of sheaves
  [[-3.4, 2.7], [-3.4, -2.7], [3.4, 2.7], [3.4, -2.7]].forEach(([x, z]) => truck.add(kit.cyl(1.3, 1.3, 0.8, mat.sumi, { x, y: 1.3, z, rx: Math.PI / 2, segments: 10 })));
  g.add(truck);

  // ---- the harvesters: wide hat with neck cloth, bending to the rice; a blue bucket
  const worker = (x, z, ry, coat, sc) => {
    const w = kit.person({ pose: "stand", coat, h: 15 * sc, x, y: TOP + 0.4, z, ry, hat: "tonoko" });
    w.rotation.x = 0.35;
    g.add(w);
  };
  worker(-7, 5, 0.9, "gunjo", 1);
  worker(9, 9, -0.6, "byakuroku", 0.95);
  g.add(kit.cyl(2.4, 2.0, 4.0, mat.gunjo, { x: -1, y: TOP + 0.4, z: 8, segments: 10 }));     // the blue bucket
  g.add(kit.cyl(2.5, 2.5, 0.3, mat.gunjo, { x: -1, y: TOP + 4.4, z: 8, segments: 10 }));

  // ---- foreground: a tray of sasa-zushi on an indigo cloth, front left
  const tray = kit.group({ x: -20, y: TOP + 0.2, z: 24, ry: 0.4 });
  tray.add(kit.box(26, 0.5, 20, mat.gunjo, { y: 0, bevel: 0.2 }));                                  // indigo cloth
  tray.add(kit.box(26, 0.05, 1.0, mat.gofun, { y: 0.52, z: -5, bevel: 0 }));
  tray.add(kit.cyl(10.5, 9.4, 1.8, tone("kuchiba", -0.05), { y: 0.5, segments: 20 }));               // the bamboo tray
  tray.add(kit.cyl(9.2, 9.2, 0.2, tone("tonoko", 0.1), { y: 2.2, segments: 20 }));
  const tops = ["shu", "kin", "hinoki", "gofun", "shu"];
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2 + 0.3, px = Math.cos(a) * 4.8, pz = Math.sin(a) * 4.8;
    const p = kit.group({ x: px, y: 2.4, z: pz, ry: -a + Math.PI / 2 });
    p.add(kit.blob(2.5, tone("rokusho", 0.04), { y: 0.5, seed: 200 + i, detail: 0, jitter: 0.1, s: [2.2, 0.55, 1.0] }));    // the bamboo leaf
    p.add(kit.blob(1.9, mat.gofun, { y: 1.5, seed: 210 + i, detail: 0, jitter: 0.12, s: [1.6, 0.6, 0.9] }));              // the rice
    p.add(kit.box(2.6, 0.5, 1.5, tone(tops[i], 0), { y: 2.3, bevel: 0.3 }));                                               // the topping
    tray.add(p);
  }
  tray.add(kit.cyl(0.25, 0.25, 8, tone("tonoko", 0.2), { x: 8, y: 0.6, z: 6.5, rz: Math.PI / 2, segments: 5 }));   // chopsticks
  tray.add(kit.cyl(0.25, 0.25, 8, tone("tonoko", 0.2), { x: 8, y: 0.6, z: 7.4, rz: Math.PI / 2, segments: 5 }));
  tray.scale.set(1.15, 1.15, 1.15);
  g.add(tray);

  return g;
});
