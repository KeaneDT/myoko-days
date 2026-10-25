/* Madarao forest zip line: two timber platforms high in tall cedars, a cable running diagonally between them and one
   rider gliding along it, in a dense cedar wood with a clear corridor along the cable. Size M. (Claude, v2) */
MyokoKit.register("zip", function build(kit) {
  const { mat, tone } = kit;
  const g = kit.group();
  g.add(kit.ground({ r: 44, irregular: 0.08, mat: mat.rokusho, seed: 21, h: 1.1 }));

  // a platform tree: a tall bare trunk with its crown above the deck, so the deck reads
  function platformTree(x, z, deckY, seed) {
    const t = kit.group({ x, z });
    t.add(kit.cyl(1.1, 1.6, deckY + 12, tone("hinoki", -0.35), { segments: 7 }));
    t.add(kit.cone(6.5, 11, mat.rokusho, { y: deckY + 4, segments: 8, ry: seed }));
    t.add(kit.cone(5.0, 10, tone("rokusho", -0.12), { y: deckY + 9.5, segments: 8, ry: seed + 1 }));
    t.add(kit.cone(3.4, 8, mat.rokusho, { y: deckY + 15, segments: 8, ry: seed + 2 }));
    // round timber deck with a simple railing
    t.add(kit.cyl(7, 7, 1.2, mat.hinoki, { y: deckY - 1.2, segments: 10 }));
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      if (Math.abs(Math.sin(a - 0.6)) < 0.25) continue;              // a gap where the cable leaves
      t.add(kit.box(0.5, 3.2, 0.5, tone("hinoki", -0.2), { x: Math.cos(a) * 6.5, z: Math.sin(a) * 6.5, y: deckY, bevel: 0 }));
    }
    for (let i = 0; i < 8; i++) {                                   // the hand rail, segment by segment
      const a0 = i / 8 * Math.PI * 2, a1 = (i + 1) / 8 * Math.PI * 2, am = (a0 + a1) / 2;
      if (Math.abs(Math.sin(am - 0.6)) < 0.35 && Math.cos(am - 0.6) > 0) continue;
      t.add(kit.box(5.2, 0.45, 0.45, tone("hinoki", -0.2), { x: Math.cos(am) * 6.3, z: Math.sin(am) * 6.3, y: deckY + 2.8, ry: -am + Math.PI / 2, bevel: 0 }));
    }
    return t;
  }
  const A = [-28, 34, -16], B = [26, 24, 14];
  g.add(platformTree(A[0], A[2], A[1], 1));
  g.add(platformTree(B[0], B[2], B[1], 4));

  // zigzag stair up the front-right tree
  for (let i = 0; i < 6; i++) {
    const y0 = i * 4, dir = i % 2 ? 1 : -1;
    g.add(kit.box(7, 0.8, 2.4, mat.hinoki, { x: B[0] - 6 + dir * 2, z: B[2] + 5, y: y0 + 2, ry: dir * 0.5, bevel: 0 }));
    g.add(kit.box(0.6, 4, 0.6, tone("hinoki", -0.25), { x: B[0] - 6 + dir * 5, z: B[2] + 5, y: y0, bevel: 0 }));
  }

  // the cable, from just above one deck to just above the other
  const a = [A[0] + 4, A[1] + 4, A[2] + 2.5], b = [B[0] - 4, B[1] + 4, B[2] - 2.5];
  g.add(kit.cable(a, b, { sag: 0.05, r: 0.5, mat: mat.sumi }));

  // the rider, 40% along, hanging on a short strap
  const f = 0.4, L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const px = a[0] + (b[0] - a[0]) * f, pz = a[2] + (b[2] - a[2]) * f;
  const py = a[1] + (b[1] - a[1]) * f - Math.sin(Math.PI * f) * 0.05 * L;
  g.add(kit.cyl(0.25, 0.25, 4, mat.sumi, { x: px, z: pz, y: py - 4, segments: 5 }));
  g.add(kit.person({ pose: "sit", h: 11, coat: "shu", hat: "kuchiba", x: px, z: pz, y: py - 4 - 4.6, ry: 0.5 }));

  // the wood: cedars round the edges and the back, a clear corridor along the cable
  const spots = [[-38, 6], [-40, -8], [-16, -34], [-2, -38], [12, -34], [30, -24], [40, -6], [-6, 30], [-26, 22], [8, 38], [38, 22], [-36, 24]];
  spots.forEach(([x0, z0], i) => {
    const x = x0 * 0.84, z = z0 * 0.84;
    // distance from the cable's ground track
    const t = Math.max(0, Math.min(1, ((x - A[0]) * (B[0] - A[0]) + (z - A[2]) * (B[2] - A[2])) / ((B[0] - A[0]) ** 2 + (B[2] - A[2]) ** 2)));
    const d = Math.hypot(x - (A[0] + (B[0] - A[0]) * t), z - (A[2] + (B[2] - A[2]) * t));
    if (d < 11) return;
    g.add(i % 4 === 3 ? kit.tree.broadleaf(22, { x, z, seed: i }) : kit.tree.cedar(34 + (i * 7) % 12, { x, z, seed: i + 3 }));
  });
  return g;
});
