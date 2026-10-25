/* Shinano Railway: the two-car electric train that serves Myoko-Kogen station (SR1-300 series).
   Livery: apple-red body, a cream waist stripe, a dark window band, a grey roof with its air-conditioner boxes and a pantograph.
   This file does two jobs:
     1. kit.trainCar(kit, { s })    builds ONE car (length 1 unit = 1 m of the map at s = 1; the map's train system clones it)
     2. register("train", ...)     the Review tile: Myoko-Kogen platform with the train drawn in, people with luggage,
                                    the small timber station, overhead-line posts. Used for "Arrive / Depart by Shinano Railway". */
(function () {
  const K = window.MyokoKit;
  if (!K) return;

  /* One car, local +X is the way it runs. Dimensions in metres of the map at s = 1: 190 long, 36 wide, 44 high. */
  K.api.trainCar = function trainCar(kit, o) {
    o = o || {};
    const { mat, tone } = kit, s = o.s || 1;
    const car = kit.group({ x: o.x, y: o.y, z: o.z, ry: o.ry });
    const g = kit.group(); g.scale.setScalar(s); car.add(g);
    const echigo = o.livery === "echigo";            // the Echigo Tokimeki Railway's train: white, with a toki-pink stripe
    const L = 190, W = 36, red = echigo ? tone("tonoko", 0.62) : tone("shu", -0.02), cream = echigo ? tone("shu", 0.38) : tone("tonoko", 0.5), glass = tone("gunjo", -0.45), roofC = tone("kawara", 0.22), dark = tone("sumi", 0);
    g.add(kit.box(L - 18, 6, W - 10, dark, { y: 6, bevel: 0 }));                                   // underframe
    [-62, 62].forEach(x => {                                                                          // bogies and wheels
      g.add(kit.box(30, 8, W - 12, dark, { x, y: 2, bevel: 0.1 }));
      [-9, 9].forEach(dx => [-1, 1].forEach(sz => g.add(kit.cyl(6.5, 6.5, 3, tone("kawara", -0.35), { x: x + dx, y: 6.5, z: sz * (W / 2 - 8), rx: Math.PI / 2, segments: 8 }))));
    });
    g.add(kit.box(L, 36, W, red, { y: 8, bevel: 0.05 }));                                            // the body
    g.add(kit.box(L + 0.6, 3.6, W + 0.6, cream, { y: 19.5, bevel: 0 }));                              // cream waist stripe
    g.add(kit.box(L - 24, 12, W + 1.0, glass, { y: 26, bevel: 0 }));                                  // the window band
    for (let i = -7; i <= 7; i++) g.add(kit.box(1.4, 12.4, W + 1.3, echigo ? tone("tonoko", 0.5) : red, { x: i * 11.5, y: 26, bevel: 0 }));   // window pillars
    [-66, 0, 66].forEach(x => g.add(kit.box(11, 28, W + 1.6, cream, { x, y: 9, bevel: 0 })));         // doors (cream), with a dark pane
    [-66, 0, 66].forEach(x => g.add(kit.box(7.5, 12, W + 2.0, glass, { x, y: 24, bevel: 0 })));
    g.add(kit.box(L - 4, 5, W - 7, roofC, { y: 43.5, bevel: 0.3 }));                                  // roof
    g.add(kit.box(L - 30, 3, W - 18, roofC, { y: 47.5, bevel: 0.3 }));
    [-50, 22].forEach(x => g.add(kit.box(26, 6, 18, tone("kawara", 0.4), { x, y: 49, bevel: 0.2 })));   // air-conditioner boxes
    // pantograph
    [[-1, 0.5], [1, 0.5]].forEach(([d]) => g.add(kit.cable([-82 + d * 8, 47, -6], [-82, 66, 0], { r: 1.1, sag: 0, mat: dark })));
    [[-1], [1]].forEach(([d]) => g.add(kit.cable([-82 + d * 8, 47, 6], [-82, 66, 0], { r: 1.1, sag: 0, mat: dark })));
    g.add(kit.box(3, 1.8, 26, dark, { x: -82, y: 66, bevel: 0 }));
    // the cab: a dark raked windscreen, headlights, a tail light, a skirt and a coupler
    [1, -1].forEach(e => {
      const x = e * (L / 2);
      g.add(kit.box(3, 18, W - 8, glass, { x: x + e * 0.4, y: 26, rz: -e * 0.16, bevel: 0 }));
      g.add(kit.box(3.4, 3.6, 5, mat.gofun, { x: x + e * 1.1, y: 17, z: 11, bevel: 0 }));
      g.add(kit.box(3.4, 3.6, 5, mat.gofun, { x: x + e * 1.1, y: 17, z: -11, bevel: 0 }));
      g.add(kit.box(5, 5, W - 14, dark, { x: x + e * 1.6, y: 9, bevel: 0.1 }));
    });
    return car;
  };
  K.register("traincar", kit => kit.trainCar(kit, { s: 1.7 }));      // used by the map's train system (Shinano Railway)
  K.register("traincar-echigo", kit => kit.trainCar(kit, { s: 1.7, livery: "echigo" }));   // and the Echigo Tokimeki Railway

  /* ---------------------------------------------------------------- the Review tile */
  K.register("train", function build(kit) {
    const { mat, tone } = kit;
    const g = kit.group(), TOP = 2.0;
    g.add(kit.ground({ r: 50, irregular: 0.05, mat: tone("byakuroku", -0.1), seed: 8, h: TOP }));
    g.add(kit.blob(14, tone("moegi", 0.1), { x: 22, y: TOP - 0.4, z: 30, seed: 4, detail: 1, jitter: 0.06, s: [1.4, 0.07, 1.0] }));

    // the track: ballast, sleepers, two rails; the train stands on it
    const TZ = -6;
    g.add(kit.box(112, 0.9, 14, tone("kawara", 0.38), { x: 0, y: TOP, z: TZ, bevel: 0 }));
    for (let x = -52; x <= 52; x += 2.6) g.add(kit.box(0.9, 0.5, 9.2, tone("hinoki", -0.35), { x, y: TOP + 0.9, z: TZ, bevel: 0 }));
    [-2.6, 2.6].forEach(dz => g.add(kit.box(112, 0.55, 0.55, tone("kawara", -0.3), { x: 0, y: TOP + 1.4, z: TZ + dz, bevel: 0 })));
    g.add(kit.box(2.4, 1.6, 9.6, mat.shu, { x: -54, y: TOP + 0.9, z: TZ, bevel: 0.2 }));        // buffer stop at the far end

    // two cars, nose towards the right
    [-19, 19].forEach(x => g.add(kit.trainCar(kit, { s: 0.19, x, y: TOP + 1.6, z: TZ })));

    // platform, a yellow safety line, and a canopy over part of it
    g.add(kit.box(80, 2.6, 12, tone("tonoko", 0.3), { x: -2, y: TOP, z: 10, bevel: 0 }));
    g.add(kit.box(80, 0.15, 0.7, mat.kin, { x: -2, y: TOP + 2.6, z: 5.0, bevel: 0 }));
    [-30, -10].forEach(x => g.add(kit.box(0.6, 8.6, 0.6, tone("hinoki", -0.3), { x, y: TOP + 2.6, z: 12.5, bevel: 0 })));
    g.add(kit.box(26, 0.7, 8, tone("kawara", 0.0), { x: -20, y: TOP + 11.0, z: 11.5, bevel: 0.2 }));
    g.add(kit.box(26, 0.5, 8.6, tone("shu", -0.12), { x: -20, y: TOP + 10.6, z: 11.5, bevel: 0 }));

    // the small timber station building, front left
    const st = kit.group({ x: -30, y: TOP, z: 27, ry: 0.12 });
    st.add(kit.box(26, 9, 14, tone("hinoki", -0.05), { y: 0, bevel: 0.03 }));
    st.add(kit.box(18, 4.5, 0.4, mat.gunjo, { y: 2.6, z: 7.2, bevel: 0 }));
    st.add(kit.box(5, 7, 0.4, tone("hinoki", -0.4), { x: -9, y: 0, z: 7.2, bevel: 0 }));
    st.add(kit.roof({ w: 26, d: 14, h: 6, overhang: 2.0, style: "gable", thickness: 0.8, mat: tone("shu", -0.1), gableMat: tone("hinoki", -0.05), y: 9 }));
    st.add(kit.box(6, 2.4, 0.3, mat.gofun, { x: 4, y: 7.4, z: 7.3, bevel: 0 }));                   // the station name board
    g.add(st);

    // overhead line posts with the wire
    const wireY = TOP + 17.5;
    [-44, -14, 16, 46].forEach(x => {
      g.add(kit.box(0.7, 17.5, 0.7, tone("kawara", -0.2), { x, y: TOP, z: -13, bevel: 0 }));
      g.add(kit.box(0.5, 0.5, 11, tone("kawara", -0.2), { x, y: wireY, z: -8, bevel: 0 }));
    });
    g.add(kit.cable([-44, wireY - 0.5, TZ], [46, wireY - 0.5, TZ], { r: 0.15, sag: 0.0, mat: tone("sumi", 0.1) }));

    // travellers on the platform, some with suitcases
    const coats = ["gunjo", "shu", "tonoko", "moegi", "byakuroku", "kuchiba"];
    [[-6, 9], [-2, 11.4], [3, 8.6], [8, 11], [13, 9.2], [17, 11.6], [22, 8.8]].forEach(([x, z], i) => {
      g.add(kit.person({ pose: "stand", coat: coats[i % coats.length], h: 4.6, x, y: TOP + 2.7, z, ry: 0.4 + i * 0.5, hat: i === 2 ? "kuchiba" : undefined }));
      if (i % 2 === 0) g.add(kit.box(1.4, 1.9, 0.9, i % 4 === 0 ? mat.gunjo : mat.shu, { x: x + 1.5, y: TOP + 2.7, z: z + 0.4, bevel: 0.1 }));
    });

    // trees and a few shrubs around the edges
    g.add(kit.tree.cedar(26, { x: 40, y: TOP, z: 24, seed: 3 }));
    g.add(kit.tree.cedar(20, { x: 33, y: TOP, z: 36, seed: 4 }));
    g.add(kit.tree.broadleaf(18, { x: -10, y: TOP, z: 40, seed: 5 }));
    g.add(kit.tree.broadleaf(22, { x: -30, y: TOP, z: -34, seed: 6 }));
    g.add(kit.tree.cedar(30, { x: 22, y: TOP, z: -38, seed: 7 }));
    g.add(kit.tree.cedar(26, { x: 34, y: TOP, z: -30, seed: 8 }));
    [[-42, 8], [44, -10], [-4, 44]].forEach(([x, z], i) => g.add(kit.blob(3.4, i % 2 ? mat.moegi : tone("rokusho", 0.1), { x, y: TOP + 0.8, z, seed: 70 + i, detail: 1, jitter: 0.2, s: [1.2, 0.8, 1.1] })));
    return g;
  });
})();

/* Myoko-Kogen station for the map (metres at s = 1). Local +X runs along the track, +Z towards the station side,
   origin on the track centre line at the platform's middle, y = 0 at the ballast surface.
   Registered as "trainstation"; the map's train system places it. */
(function () {
  const K = window.MyokoKit;
  if (!K) return;
  K.register("trainstation", function build(kit) {
    const { mat, tone } = kit;
    const g = kit.group();
    const stone = tone("kawara", 0.34);
    g.add(kit.box(400, 40, 52, stone, { x: 0, y: -32, z: 52, bevel: 0 }));                         // the raised platform, a stone wall down to the ground
    g.add(kit.box(400, 1.6, 52, tone("tonoko", 0.34), { x: 0, y: 7.6, z: 52, bevel: 0 }));        // its paved top
    g.add(kit.box(400, 0.8, 3.4, mat.kin, { x: 0, y: 8.2, z: 28.5, bevel: 0 }));                  // yellow safety line
    // canopy
    [-60, -20, 20, 60].forEach(x => g.add(kit.box(3.2, 44, 3.2, tone("hinoki", -0.3), { x, y: 8, z: 66, bevel: 0 })));
    g.add(kit.box(170, 3.6, 40, tone("kawara", 0.1), { x: 0, y: 52, z: 58, bevel: 0.2 }));
    g.add(kit.box(170, 2.4, 41, tone("shu", -0.12), { x: 0, y: 50, z: 58, bevel: 0 }));
    // the timber station building and its forecourt
    g.add(kit.box(130, 40, 62, stone, { x: -20, y: -32, z: 150, bevel: 0 }));               // the station building on its own plinth
    const st = kit.group({ x: -20, y: 8, z: 150 });
    st.add(kit.box(118, 36, 54, tone("hinoki", -0.05), { y: 0, bevel: 0.03 }));
    st.add(kit.box(70, 18, 1.2, mat.gunjo, { x: -10, y: 10, z: -27.5, bevel: 0 }));
    st.add(kit.box(20, 28, 1.2, tone("hinoki", -0.4), { x: 34, y: 0, z: -27.5, bevel: 0 }));
    st.add(kit.roof({ w: 118, d: 54, h: 28, overhang: 9, style: "gable", thickness: 3.4, mat: tone("shu", -0.1), gableMat: tone("hinoki", -0.05), y: 36 }));
    st.add(kit.box(30, 9, 1.4, mat.gofun, { x: -10, y: 27, z: -28.2, bevel: 0 }));                // the name board
    g.add(st);
    [[-90, 215], [-70, 232], [-110, 232]].forEach(([x, z], i) => g.add(kit.box(30, 12, 15, i === 1 ? mat.gunjo : mat.gofun, { x, y: 6, z, ry: 0.1, bevel: 0.3 })));   // a few small cars
    g.add(kit.tree.cedar(120, { x: 90, y: 4, z: 190, seed: 3 }));
    g.add(kit.tree.broadleaf(80, { x: 128, y: 4, z: 140, seed: 5 }));
    g.add(kit.tree.cedar(100, { x: 70, y: 4, z: 220, seed: 8 }));
    // overhead line: posts either end of the platform and the wire between them
    [-230, -115, 0, 115, 230].forEach(x => {
      g.add(kit.box(3, 74, 3, tone("kawara", -0.2), { x, y: 0, z: -34, bevel: 0 }));
      g.add(kit.box(2.4, 2.4, 38, tone("kawara", -0.2), { x, y: 70, z: -16, bevel: 0 }));
    });
    g.add(kit.cable([-240, 68, 0], [240, 68, 0], { r: 0.7, sag: 0.0, mat: tone("sumi", 0.1) }));
    // a few travellers on the platform
    ["gunjo", "shu", "tonoko", "moegi", "byakuroku"].forEach((c, i) => g.add(kit.person({ pose: "stand", coat: c, h: 22, x: -50 + i * 28, y: 8, z: 42 + (i % 2) * 14, ry: 0.5 + i })));
    return g;
  });
})();
