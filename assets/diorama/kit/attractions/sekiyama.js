/* Sekiyama Shrine (culture-tour stop): a shrine hall with an irimoya roof on a stone base, a vermilion torii on the
   approach, a pair of stone lanterns, a gravel path and old cedars behind. Size S.
   Reference model written by Claude to set the quality bar and show how the kit is used:
   the subject fills most of the circle, the ground patch is only a little larger than the subject, and the key
   shapes (roof, torii) are big and clear so the model still reads at 60 px. */
MyokoKit.register("sekiyama", function build(kit) {
  const { mat, tone } = kit;
  const g = kit.group();

  // ground: a mossy patch with a pale gravel approach that turns from the torii to the hall
  g.add(kit.ground({ r: 44, mat: tone("byakuroku", 0.05), seed: 4, irregular: 0.08, h: 1.0 }));
  g.add(kit.path({ points: [[-20, 40], [-15, 28], [-6, 20], [0, 14], [0, 8]], width: 8, y: 1.05, mat: mat.tonoko }));

  // the hall: stone base, raised timber floor, white walls between dark posts, a big irimoya roof
  const hall = kit.group({ z: -4 });
  const stone = tone("kawara", 0.4), post = tone("hinoki", -0.35);
  hall.add(kit.box(44, 3.4, 30, stone, { y: 0.9 }));
  hall.add(kit.box(40, 1.4, 26.5, tone("hinoki", -0.25), { y: 4.3 }));
  hall.add(kit.box(36, 10, 22, mat.gofun, { y: 5.7, bevel: 0.02 }));
  [-17.4, -5.8, 5.8, 17.4].forEach(x => [10.9, -10.9].forEach(z =>
    hall.add(kit.box(1.5, 10.2, 1.5, post, { x, z, y: 5.7, bevel: 0.05 }))));
  hall.add(kit.box(37.5, 1.3, 23.5, post, { y: 15.2, bevel: 0.05 }));
  hall.add(kit.box(11, 7.5, 0.7, tone("hinoki", -0.1), { z: 11.2, y: 6.2, bevel: 0.05 }));          // doors
  hall.add(kit.box(16, 1.4, 6, stone, { z: 17, y: 0.9 }));                                           // steps
  hall.add(kit.box(14, 1.4, 3.4, stone, { z: 15.8, y: 2.3 }));
  hall.add(kit.roof({ w: 37, d: 23.5, h: 17, overhang: 6, style: "irimoya", sori: 2.4, thickness: 1.3,
                      mat: mat.kawara, gableMat: tone("hinoki", -0.1), y: 16.3 }));
  hall.add(kit.box(1.8, 1.0, 1.8, mat.kin, { y: 34.2, bevel: 0.1 }));                                 // gilt finial
  g.add(hall);

  // the torii on the approach, front left so it frames the hall instead of hiding it
  g.add(kit.torii({ h: 22, w: 20, x: -15, z: 28, ry: 0.35 }));

  // a pair of stone lanterns (tōrō) beside the steps
  [-13, 13].forEach(x => {
    const l = kit.group({ x, z: 21 }), s = tone("kawara", 0.45);
    l.add(kit.box(3.2, 1, 3.2, s, { bevel: 0.15 }));
    l.add(kit.cyl(0.8, 0.9, 5, s, { y: 1, segments: 6 }));
    l.add(kit.box(3.4, 0.9, 3.4, s, { y: 6, bevel: 0.15 }));
    l.add(kit.box(2.6, 2.2, 2.6, mat.gofun, { y: 6.9, bevel: 0.1 }));
    l.add(kit.cone(3.0, 2.0, s, { y: 9.1, segments: 4, ry: Math.PI / 4 }));
    g.add(l);
  });

  // old cedars close behind the hall, one soft tree at each side
  g.add(kit.grove({ x: 0, z: -32, r: 13, count: 5, kinds: ["cedar"], h: 40, seed: 8 }));
  g.add(kit.tree.broadleaf(22, { x: -34, z: -10, seed: 3 }));
  g.add(kit.tree.cedar(34, { x: 33, z: -14, seed: 6 }));
  return g;
});
