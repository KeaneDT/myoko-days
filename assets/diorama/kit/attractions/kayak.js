/* Kayaking on Lake Nojiri: a sleek two-person shu-red kayak with a gofun deck stripe,
   two seated paddlers with double-bladed paddles dipping into the lake, a V-shaped wake and ripple strokes. Size S. */
MyokoKit.register("kayak", function build(kit) {
  const { mat, tone } = kit;
  const g = kit.group();

  // Kayak group centred at origin, turned 20 degrees from the X axis so its 52-unit length reads clearly across the view
  // Local +X is bow (front-left), local -X is stern (back-right)
  const kayak = kit.group({ x: 2, y: 0, z: 2, ry: 20 * Math.PI / 180 });

  // Sleek pointed closed-deck hull: ~52 long (X), 10 wide (Z), waterline at y = 0, deck at y ~2.5
  // Main shu hull (single shu accent)
  kayak.add(kit.sphere(1, mat.shu, {
    y: 0.55,
    segments: 16,
    s: [26, 2.1, 5.0]
  }));

  // Gofun deck stripe along the top centre
  kayak.add(kit.sphere(1, mat.gofun, {
    y: 0.9,
    segments: 16,
    s: [23.8, 1.78, 2.3]
  }));

  // Crisp bow and stern deck ridges
  kayak.add(kit.box(42, 0.35, 1.1, mat.gofun, { y: 2.35, bevel: 0.15 }));

  // Two dark oval cockpits in tone("kawara", -0.45), 14 units apart (centres at x = -7 and x = +7)
  const cockpitRimMat = tone("kawara", -0.3);
  const cockpitWellMat = tone("kawara", -0.45);
  [-7, 7].forEach(cx => {
    // Raised coaming rim
    kayak.add(kit.cyl(1, 1, 0.7, cockpitRimMat, {
      x: cx, y: 2.15, segments: 14, s: [4.2, 1, 2.8]
    }));
    // Dark cockpit opening
    kayak.add(kit.cyl(1, 1, 0.75, cockpitWellMat, {
      x: cx, y: 2.2, segments: 14, s: [3.6, 1, 2.3]
    }));
  });

  // Two seated paddlers (kit.person pose "sit", h 16) inside the cockpits, facing the bow (-X -> ry: -Math.PI / 2)
  // kit.persononly accepts palette keys in o.coat, so we tint the second paddler's coat to tone("byakugun", -0.2)
  const frontPaddler = kit.person({
    pose: "sit",
    coat: "gunjo",
    hat: "kuchiba",
    h: 16,
    x: -7,
    y: 2.1,
    z: 0,
    ry: -Math.PI / 2
  });
  kayak.add(frontPaddler);

  const rearPaddler = kit.person({
    pose: "sit",
    coat: "byakugun",
    h: 16,
    x: 7,
    y: 2.1,
    z: 0,
    ry: -Math.PI / 2
  });
  const rearCoatMat = tone("byakugun", -0.2);
  rearPaddler.traverse(o => {
    if (o.isMesh && o.material === mat.byakugun) o.material = rearCoatMat;
  });
  kayak.add(rearPaddler);

  // Double-bladed paddles: 26-long thin hinoki shaft held across the body along Z, tilted ~25 degrees so one blade dips into the water
  function buildDoublePaddle(px, tiltSign) {
    const tilt = tiltSign * (25 * Math.PI / 180); // rx tilts the Z-aligned shaft so one end dips to y ~ -0.5
    const p = kit.group({ x: px, y: 5.0, z: 0, ry: tiltSign * 0.18, rx: tilt });

    // Thin hinoki shaft (26 long along local Z)
    p.add(kit.cyl(0.28, 0.28, 26, mat.hinoki, {
      z: -13, rx: Math.PI / 2, segments: 8
    }));

    // Flat mat.gofun blades (5 long along shaft, 0.6 thick, 2.5 wide) at both ends
    [-12.2, 12.2].forEach(bz => {
      p.add(kit.box(0.6, 2.5, 5.0, mat.gofun, {
        y: -1.25, z: bz, bevel: 0.15
      }));
    });
    return p;
  }

  // Front paddler dips blade on +Z (front-left) side; rear paddler dips blade on -Z (back-right) side
  kayak.add(buildDoublePaddle(-8.2, 1));
  kayak.add(buildDoublePaddle(5.8, -1));

  // Wake: two thin mat.gofun kit.path lines in a narrow V behind the stern (+X end, x = 26 to 48), width 0.9, ~22 long, y = 0.1
  kayak.add(kit.path({
    points: [[25.5, -1.4], [32.5, -3.2], [38.0, -4.7], [43.0, -6.2]],
    width: 0.9,
    y: 0.1,
    mat: mat.gofun
  }));
  kayak.add(kit.path({
    points: [[25.5, 1.4], [32.5, 3.2], [38.0, 4.7], [43.0, 6.2]],
    width: 0.9,
    y: 0.1,
    mat: mat.gofun
  }));

  // 4 short curved mat.gofun ripple strokes around the dipping blades and hull (y = 0.1)
  const bladeRipples = [
    // Two curved strokes around the front paddler's dipping blade (-8.2, +11.2)
    [[-12.5, 9.8], [-8.5, 12.6], [-4.2, 10.6]],
    [[-11.8, 13.8], [-8.0, 15.6], [-4.5, 14.0]],
    // Two curved strokes around the rear paddler's dipping blade (+5.8, -11.2)
    [[1.5, -10.4], [5.8, -12.8], [10.0, -10.2]],
    [[2.2, -14.2], [6.0, -15.8], [9.8, -14.0]]
  ];
  bladeRipples.forEach(pts => {
    kayak.add(kit.path({ points: pts, width: 0.85, y: 0.1, mat: mat.gofun }));
  });

  g.add(kayak);
  return g;
});