/* Stand-up paddleboarding on Lake Nojiri: two large paddleboarders on a white and a yellow board,
   with fine V-shaped wakes and white ripple strokes on the lake surface. Size S. */
MyokoKit.register("sup", function build(kit) {
  const { mat, tone } = kit;
  const g = kit.group();

  // Helper to build a 34-long, 8-wide, 1.4-thick SUP board with a pointed nose, stripe, deck pad, paddler, and V-wake
  function buildSup({ x, z, ry, boardMat, stripeMat, coat, hat }) {
    const unit = kit.group({ x, y: 0, z, ry });

    // Main board body: total length ~34 along local Z (+Z is nose, -Z is tail), 8 wide, 1.4 thick, top at y = 1.2
    unit.add(kit.box(8.0, 1.4, 24.0, boardMat, { y: -0.2, z: -1.5, bevel: 0.3 }));

    // Pointed nose at +Z (formed from overlapping bevelled diamond/tapered blocks and a horizontal cone tip)
    unit.add(kit.box(5.6, 1.35, 5.6, boardMat, { y: -0.18, z: 10.5, ry: Math.PI / 4, bevel: 0.3 }));
    unit.add(kit.box(3.6, 1.25, 3.6, boardMat, { y: -0.12, z: 13.0, ry: Math.PI / 4, bevel: 0.3 }));
    unit.add(kit.cone(2.2, 4.2, boardMat, { y: 0.55, z: 13.2, rx: Math.PI / 2, segments: 10, s: [1.1, 1.0, 0.32] }));

    // Rounded tail at -Z
    unit.add(kit.box(5.4, 1.35, 5.4, boardMat, { y: -0.18, z: -13.5, ry: Math.PI / 4, bevel: 0.3 }));

    // Thin decorative stripe along the top deck
    unit.add(kit.box(1.4, 0.16, 26.5, stripeMat, { y: 1.12, z: -0.5, bevel: 0.05 }));

    // Subtle traction pad under the paddler's feet
    unit.add(kit.box(5.2, 0.18, 10.5, tone("kawara", 0.25), { y: 1.14, z: -1.0, bevel: 0.1 }));

    // Standing paddleboarder (pose: "paddle", h: 22, standing on the board at y = 1.2)
    const paddler = kit.person({
      pose: "paddle",
      coat,
      hat,
      h: 22,
      y: 1.2,
      z: -0.5
    });
    unit.add(paddler);

    // Paddle blade dipping into the water beside the board (+X side, matching the paddle shaft in kit.person)
    unit.add(kit.box(0.35, 4.2, 1.8, tone("hinoki", -0.2), {
      x: 8.6, y: -0.6, z: 1.2, rz: 0.45, bevel: 0.15
    }));

    // Small ripple ring where the paddle blade enters the water
    unit.add(kit.path({
      points: [
        [7.2, 3.2], [8.8, 3.8], [10.4, 3.0], [10.6, 1.2], [9.2, 0.2], [7.4, 0.8]
      ],
      width: 0.7,
      y: 0.1,
      mat: mat.gofun
    }));

    // Narrow V-shaped wake behind the tail (-Z), two thin mat.gofun kit.path lines (~18 long, width 0.9, y 0.1)
    unit.add(kit.path({
      points: [[-2.2, -16.8], [-4.0, -22.5], [-5.2, -26.5], [-6.2, -29.5]],
      width: 0.9,
      y: 0.1,
      mat: mat.gofun
    }));
    unit.add(kit.path({
      points: [[2.2, -16.8], [4.0, -22.5], [5.2, -26.5], [6.2, -29.5]],
      width: 0.9,
      y: 0.1,
      mat: mat.gofun
    }));

    return unit;
  }

  // Board 1: front-left (x = -12, z = +12), turned ~65° so its 34-unit length reads clearly across the view
  // White board (mat.gofun) with gunjo stripe, paddler in shu coat (single shu accent)
  g.add(buildSup({
    x: -12,
    z: 12,
    ry: -1.12,
    boardMat: mat.gofun,
    stripeMat: mat.gunjo,
    coat: "shu",
    hat: "kuchiba"
  }));

  // Board 2: behind and to the right (x = +12, z = -10), turned ~-105° so its length also reads across the view
  // Yellow ochre board (mat.kuchiba) with gofun stripe, paddler in gunjo coat
  g.add(buildSup({
    x: 12,
    z: -10,
    ry: -1.38,
    boardMat: mat.kuchiba,
    stripeMat: mat.gofun,
    coat: "gunjo"
  }));

  // 6 short curved mat.gofun ripple strokes around the boards (width 0.8, length 6 to 10, y 0.1)
  const ripples = [
    [[-34, 4], [-29, 5.2], [-24, 4.1]],
    [[-22, 29], [-16, 30.3], [-11, 29.1]],
    [[2, 25], [7, 26.1], [12, 25.0]],
    [[-16, -18], [-11, -16.8], [-6, -17.9]],
    [[24, 9], [29, 10.2], [34, 9.0]],
    [[6, -29], [11, -27.8], [17, -28.9]]
  ];
  ripples.forEach(pts => {
    g.add(kit.path({ points: pts, width: 0.8, y: 0.1, mat: mat.gofun }));
  });

  return g;
});