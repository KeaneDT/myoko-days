/* Sasagamine highland picnic: a gently domed green meadow with three Holstein dairy cows,
   a curved post-and-rail pasture fence, white birches at the back, and two people enjoying a bento on a blanket. Size M. */
MyokoKit.register("picnic", function build(kit) {
  const { mat, tone } = kit;
  const g = kit.group();

  // Ground: gently domed highland meadow in moegi
  g.add(kit.ground({ r: 44, irregular: 0.08, mat: mat.moegi, seed: 14, h: 2.2 }));

  // Soft grass contour patches for meadow texture
  g.add(kit.blob(18, tone("byakuroku", 0.1), {
    x: -14, y: 1.3, z: -6, seed: 5, detail: 1, jitter: 0.06, s: [1.3, 0.08, 1.1]
  }));
  g.add(kit.blob(15, tone("byakuroku", 0.15), {
    x: 16, y: 1.2, z: 16, seed: 9, detail: 1, jitter: 0.06, s: [1.2, 0.07, 1.0]
  }));

  // Helper to build a crafted Holstein dairy cow (~15 long including head, ~9 tall)
  function buildCow({ x, y, z, ry, grazing, seed }) {
    const cow = kit.group({ x, y, z, ry });

    // Four short legs (kit.cyl, gofun with sumi hooves)
    [[-1.8, -3.6], [1.8, -3.6], [-1.8, 3.6], [1.8, 3.6]].forEach(([lx, lz]) => {
      cow.add(kit.cyl(0.6, 0.5, 3.4, mat.gofun, { x: lx, y: 0, z: lz, segments: 8 }));
      cow.add(kit.cyl(0.55, 0.6, 0.7, mat.sumi, { x: lx, y: 0, z: lz, segments: 8 }));
    });

    // Main body: bevelled kit.box in mat.gofun (5.6 wide, 5.2 tall, 11.2 long, top at y = 8.4)
    cow.add(kit.box(5.6, 5.2, 11.2, mat.gofun, { y: 3.2, bevel: 0.22 }));

    // 4 irregular mat.sumi patches set just proud of the body
    cow.add(kit.box(5.85, 2.8, 4.2, mat.sumi, {
      x: 0.05, y: 5.7, z: -1.8, bevel: 0.18
    }));
    cow.add(kit.box(5.85, 3.0, 3.6, mat.sumi, {
      x: -0.05, y: 4.6, z: 2.6, bevel: 0.18
    }));
    cow.add(kit.blob(1.9, mat.sumi, {
      x: 2.3, y: 5.5, z: -0.2, seed: seed + 1, detail: 1, jitter: 0.12, s: [0.45, 0.85, 1.2]
    }));
    cow.add(kit.blob(1.8, mat.sumi, {
      x: -2.3, y: 5.2, z: -3.2, seed: seed + 2, detail: 1, jitter: 0.12, s: [0.45, 0.8, 1.1]
    }));

    // Tail at the back (-Z)
    cow.add(kit.cyl(0.22, 0.3, 3.6, mat.gofun, { y: 4.5, z: -5.8, rx: 0.18, segments: 6 }));
    cow.add(kit.sphere(0.45, mat.sumi, { y: 4.3, z: -6.1, segments: 6 }));

    // Neck and head group at +Z (either raised or angled down grazing)
    const headGrp = kit.group({
      y: grazing ? 4.4 : 6.4,
      z: grazing ? 5.6 : 5.4,
      rx: grazing ? 0.68 : 0.08
    });

    // Neck connection
    headGrp.add(kit.box(3.4, 3.2, 2.8, mat.gofun, { y: -1.0, z: -0.8, bevel: 0.2 }));

    // Head box in gofun with sumi crown patch
    headGrp.add(kit.box(3.6, 3.2, 3.8, mat.gofun, { y: -0.6, z: 1.4, bevel: 0.2 }));
    headGrp.add(kit.box(3.75, 1.4, 2.4, mat.sumi, { y: 1.3, z: 1.1, bevel: 0.15 }));

    // Tonoko muzzle at the front of the head
    headGrp.add(kit.box(3.2, 2.0, 1.6, mat.tonoko, { y: -0.5, z: 3.6, bevel: 0.22 }));

    // Ears sticking out sideways
    [-2.2, 2.2].forEach(ex => {
      headGrp.add(kit.box(1.2, 0.6, 0.8, mat.sumi, { x: ex, y: 1.5, z: 0.8, bevel: 0.15 }));
    });

    // Tiny horns on top of the head
    [-1.2, 1.2].forEach(hx => {
      headGrp.add(kit.cone(0.35, 1.2, mat.tonoko, {
        x: hx, y: 2.5, z: 0.9, rz: hx < 0 ? 0.3 : -0.3, segments: 6
      }));
    });

    cow.add(headGrp);
    return cow;
  }

  // Three Holstein dairy cows around the middle and left (around x -14, z -6), grazing in different directions
  g.add(buildCow({ x: -22, y: 2.0, z: -4, ry: 0.85, grazing: true, seed: 10 }));
  g.add(buildCow({ x: -6, y: 2.1, z: -11, ry: -0.55, grazing: false, seed: 20 }));
  g.add(buildCow({ x: -14, y: 2.0, z: 7, ry: 2.15, grazing: false, seed: 30 }));

  // Fence: short curved post-and-rail fence (kit.fence, h 4) behind the cows, from x -36 to x +6 at z about -24
  const fenceSection = kit.fence({
    points: [[-36, -18], [-23, -23], [-9, -25], [6, -23]],
    h: 4,
    spacing: 7,
    mat: mat.hinoki
  });
  fenceSection.position.y = 1.8;
  g.add(fenceSection);

  // Picnic: at the front-right (x = +16, z = +16)
  const picnic = kit.group({ x: 16, y: 1.9, z: 16, ry: -0.18 });

  // Blanket: flat kit.box 16 by 0.4 by 12, mat.gunjo with a gofun border
  picnic.add(kit.box(16.6, 0.36, 12.6, mat.gofun, { y: 0, bevel: 0.1 }));
  picnic.add(kit.box(14.6, 0.42, 10.6, mat.gunjo, { y: 0.02, bevel: 0.1 }));

  // Bento: small hinoki box in the middle of the blanket with gofun rice, moegi greens, and a shu umeboshi/topping (single shu accent)
  const bento = kit.group({ x: 0, y: 0.42, z: 0.8, ry: 0.25 });
  bento.add(kit.box(4.4, 1.1, 3.4, mat.hinoki, { y: 0, bevel: 0.1 }));
  // Lid resting beside the bento
  bento.add(kit.box(4.2, 0.35, 3.2, tone("hinoki", -0.15), { x: 3.4, y: 0, z: 1.6, ry: -0.4, bevel: 0.08 }));
  // Gofun rice compartment (left side)
  bento.add(kit.box(2.1, 0.35, 2.8, mat.gofun, { x: -0.9, y: 0.85, bevel: 0.08 }));
  // Moegi vegetable compartment (right-back)
  bento.add(kit.box(1.6, 0.35, 1.4, mat.moegi, { x: 1.0, y: 0.85, z: -0.6, bevel: 0.08 }));
  // Kuchiba tamagoyaki roll (right-front)
  bento.add(kit.box(1.6, 0.35, 1.2, mat.kuchiba, { x: 1.0, y: 0.85, z: 0.7, bevel: 0.08 }));
  // Shu topping (single shu accent)
  bento.add(kit.sphere(0.65, mat.shu, { x: -0.9, y: 1.25, z: 0, segments: 8, s: [1.1, 0.65, 1.1] }));
  picnic.add(bento);

  // Small thermos / tea cups beside the bento
  picnic.add(kit.cyl(0.6, 0.6, 2.2, mat.gofun, { x: -1.8, y: 0.42, z: -2.4, segments: 8 }));
  picnic.add(kit.cyl(0.45, 0.4, 0.9, mat.kuchiba, { x: -0.4, y: 0.42, z: -2.2, segments: 8 }));

  // Two people sitting on the blanket (kit.person pose "sit", h 9, coats tonoko and byakugun)
  // Positioned at the back-left and back-right of the blanket so the bento stays completely visible from the front
  picnic.add(kit.person({
    pose: "sit",
    coat: "tonoko",
    hat: "kuchiba",
    h: 9,
    x: -4.8,
    y: 0.42,
    z: -1.6,
    ry: 1.15
  }));
  picnic.add(kit.person({
    pose: "sit",
    coat: "byakugun",
    h: 9,
    x: 4.8,
    y: 0.42,
    z: -1.4,
    ry: -1.15
  }));

  g.add(picnic);

  // Birches: 5 white birches (kit.tree.birch, h 22 to 30) at the back-right and back-left
  g.add(kit.tree.birch(28, { x: -32, y: 1.6, z: -25, seed: 41 }));
  g.add(kit.tree.birch(23, { x: -24, y: 1.8, z: -31, seed: 42 }));
  g.add(kit.tree.birch(30, { x: 18, y: 1.8, z: -26, seed: 43 }));
  g.add(kit.tree.birch(25, { x: 28, y: 1.6, z: -18, seed: 44 }));
  g.add(kit.tree.birch(22, { x: 25, y: 1.5, z: -29, seed: 45 }));

  return g;
});