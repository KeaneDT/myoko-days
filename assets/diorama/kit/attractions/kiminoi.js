/* Kiminoi sake brewery in Arai: a white-walled kura with a heavy tiled roof and a namako lower band, a green cedar ball
   (sugidama) under the front eave, a timber shop front with a short indigo noren, and a stack of straw-wrapped barrels
   (komodaru) with a shu band each. Size S. No text or brand marks. (Claude, v2) */
MyokoKit.register("kiminoi", function build(kit) {
  const { mat, tone } = kit;
  const g = kit.group();
  g.add(kit.ground({ r: 44, irregular: 0.08, mat: tone("tonoko", 0.05), seed: 61, h: 1.0 }));

  // the kura
  const kura = kit.group({ x: -6, z: -10 });
  const band = tone("kawara", 0.1);
  kura.add(kit.box(30, 14, 18, mat.gofun, { y: 1, bevel: 0.03 }));
  kura.add(kit.box(30.4, 4, 18.4, band, { y: 1, bevel: 0 }));
  for (let x = -13.5; x <= 13.5; x += 3) kura.add(kit.box(0.35, 4, 0.3, mat.gofun, { x, z: 9.2, y: 1, bevel: 0 }));   // namako grid
  [2.3, 3.9].forEach(y => kura.add(kit.box(30.4, 0.3, 0.3, mat.gofun, { z: 9.2, y, bevel: 0 })));
  kura.add(kit.roof({ w: 30, d: 18, h: 10, overhang: 3, style: "gable", thickness: 1.6, mat: mat.kawara, gableMat: mat.gofun, y: 15 }));
  [-8, 8].forEach(x => kura.add(kit.box(3, 3, 0.6, tone("kawara", -0.4), { x, z: 9.1, y: 9, bevel: 0 })));               // shuttered windows
  kura.add(kit.box(6, 7, 0.5, tone("hinoki", -0.45), { z: 9.1, y: 1, bevel: 0 }));                                      // the door
  // the sugidama under the front eave, on a short cord
  kura.add(kit.cyl(0.18, 0.18, 2.8, mat.sumi, { z: 11, y: 13.2, segments: 5 }));
  kura.add(kit.blob(4.2, mat.rokusho, { z: 11, y: 9.8, seed: 5, detail: 1, jitter: 0.06 }));
  g.add(kura);

  // the shop front at the right
  const shop = kit.group({ x: 17, z: -9 });
  shop.add(kit.box(14, 8, 14, tone("hinoki", 0.1), { y: 1, bevel: 0.03 }));
  for (let x = -6; x <= 6; x += 1.2) shop.add(kit.box(0.4, 6.5, 0.3, tone("hinoki", -0.35), { x, z: 7.1, y: 1.2, bevel: 0 }));   // lattice
  [-1.8, 1.8].forEach(x => shop.add(kit.box(3.4, 3.2, 0.3, mat.gunjo, { x, z: 7.5, y: 5, bevel: 0 })));                            // noren
  shop.add(kit.roof({ w: 14, d: 14, h: 5, overhang: 1.8, style: "gable", thickness: 1.0, mat: mat.kawara, gableMat: tone("hinoki", -0.2), y: 9, ry: Math.PI / 2 }));
  g.add(shop);

  // komodaru barrels stacked 3-2-1 at the front left
  const straw = tone("tonoko", 0.3);
  function barrel(x, y, z) {
    const b = kit.group({ x, y, z });
    b.add(kit.cyl(3, 3, 5, straw, { segments: 12 }));
    [0.8, 4.2].forEach(h => b.add(kit.cyl(3.08, 3.08, 0.35, tone("kawara", -0.3), { y: h, segments: 12 })));
    b.add(kit.cyl(3.1, 3.1, 1.1, mat.shu, { y: 2.0, segments: 12 }));
    return b;
  }
  [-6.2, 0, 6.2].forEach(x => g.add(barrel(-16 + x, 1, 16)));
  [-3.1, 3.1].forEach(x => g.add(barrel(-16 + x, 6, 16)));
  g.add(barrel(-16, 11, 16));

  // trees: a pine at the back right, broadleaf behind
  g.add(kit.tree.pine(18, { x: 30, z: -28, seed: 3, lean: 0.25 }));
  g.add(kit.tree.broadleaf(20, { x: -28, z: -30, seed: 4 }));
  g.add(kit.tree.broadleaf(17, { x: 8, z: -34, seed: 6 }));
  return g;
});
