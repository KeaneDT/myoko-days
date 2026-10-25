/* Myoko Diorama: village houses (needs three.js r128 and kit.js).
   Seven house types built with the same kit helpers as the attraction models (bevelled walls, Japanese roofs with
   a curved profile, fascia and ridge cap, dark timber base and doors) and the same black ink outline. Drawn with
   instancing: per type one mesh for walls, roof, roof trim, dark timber and ink, so ~260 houses cost 35 draw calls.
   Each house has its own roof and wall colour from the palette (layout.json houses: type, roof, wall).
   MyokoHouses.build(layout, heightAt, exaggeration) -> { group, setZoom(zoom), count } */
window.MyokoHouses = (function () {
  "use strict";
  const T = window.THREE, K = window.MyokoKit, kit = K.api;
  const UNIT = 10;            // houses are modelled 10 units long; an instance is scaled by size / UNIT
  const SINK = 2.0;           // walls run this far below ground so slopes never show a gap

  // role markers: which instanced mesh (and colour) a part belongs to
  const R = { wall: kit.mat.gofun, roof: kit.mat.kawara, trim: kit.tone("kawara", -0.25), dark: kit.mat.sumi };
  const ROOF_OPTS = { mat: R.roof, fasciaMat: R.trim, ridgeMat: R.trim, gableMat: R.wall };

  function house(spec) {
    const g = kit.group(), s = spec;
    g.add(kit.box(s.w, s.wh + SINK, s.d, R.wall, { y: -SINK, bevel: 0.04 }));
    if (s.base) g.add(kit.box(s.w + 0.25, s.base + SINK, s.d + 0.25, R.dark, { y: -SINK, bevel: 0 }));
    if (s.band) g.add(kit.box(s.w + 0.2, 0.45, s.d + 0.2, R.dark, { y: s.band, bevel: 0 }));
    g.add(kit.box(s.door, Math.min(2.4, s.wh * 0.75), 0.25, R.dark, { z: s.d / 2, bevel: 0 }));           // door / shop front
    [-1, 1].forEach(sx => g.add(kit.box(0.35, s.wh, 0.35, R.dark, { x: sx * (s.w / 2 - 0.05), z: s.d / 2 - 0.05, bevel: 0 })));  // corner posts
    g.add(kit.roof(Object.assign({ w: s.w, d: s.d, h: s.h, overhang: s.o, style: s.roof, sori: s.sori || 0, thickness: s.th, y: s.wh }, ROOF_OPTS)));
    return g;
  }
  const SPEC = [
    { w: 10, d: 6.2, wh: 3.2, h: 3.8, o: 0.9, roof: "irimoya", sori: 0.35, th: 0.32, base: 0.7, door: 2.4 },  // 0 farmhouse, tiled
    { w: 8, d: 5.6, wh: 5.4, h: 2.3, o: 0.6, roof: "gable", th: 0.3, band: 2.7, door: 3.2 },                    // 1 machiya, two storeys
    { w: 10, d: 6.6, wh: 2.6, h: 6.6, o: 1.1, roof: "irimoya", sori: 0.2, th: 0.75, base: 0.5, door: 2.2 },     // 2 thatched farmhouse
    { w: 6.2, d: 4.6, wh: 5.2, h: 2.0, o: 0.5, roof: "gable", th: 0.45, base: 1.3, door: 1.4 },                 // 3 kura storehouse
    { w: 7, d: 4.6, wh: 2.6, h: 1.4, o: 0.5, roof: "gable", th: 0.22, door: 2.6 },                              // 4 shed, tin roof
    { w: 9, d: 7.4, wh: 3.2, h: 5.6, o: 1.4, roof: "irimoya", sori: 0.7, th: 0.4, base: 0.9, door: 3.0 },      // 5 temple hall
    { w: 10, d: 5.6, wh: 5.6, h: 2.8, o: 0.7, roof: "hip", sori: 0.25, th: 0.3, band: 2.8, door: 3.0 }         // 6 inn / lodge
  ];

  // flatten a kit-built house into one geometry per role (+ one for the ink hull)
  function bake(spec) {
    const root = house(spec); root.updateMatrixWorld(true);
    const parts = { wall: [[], []], roof: [[], []], trim: [[], []], dark: [[], []] };
    root.traverse(o => {
      if (!o.isMesh) return;
      const role = Object.keys(R).find(k => R[k] === o.material) || "wall";
      const g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()).applyMatrix4(o.matrixWorld);
      g.computeVertexNormals();
      const flip = o.matrixWorld.determinant() < 0, p = g.attributes.position, n = g.attributes.normal;
      for (let i = 0; i < p.count; i += 3) (flip ? [0, 2, 1] : [0, 1, 2]).forEach(k => {
        parts[role][0].push(p.getX(i + k), p.getY(i + k), p.getZ(i + k));
        parts[role][1].push(n.getX(i + k), n.getY(i + k), n.getZ(i + k));
      });
    });
    const out = {}, allP = [], allN = [];
    Object.keys(parts).forEach(k => {
      const [p, n] = parts[k];
      if (!p.length) return;
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.Float32BufferAttribute(p, 3)); g.setAttribute("normal", new T.Float32BufferAttribute(n, 3));
      out[k] = g; allP.push(...p); allN.push(...n);
    });
    // ink hull with smoothed normals, as the kit does for the models
    const acc = new Map();
    for (let i = 0; i < allP.length; i += 3) {
      const key = allP[i].toFixed(3) + "," + allP[i + 1].toFixed(3) + "," + allP[i + 2].toFixed(3);
      const v = acc.get(key) || [0, 0, 0]; v[0] += allN[i]; v[1] += allN[i + 1]; v[2] += allN[i + 2]; acc.set(key, v);
    }
    const on = new Float32Array(allN.length);
    for (let i = 0; i < allP.length; i += 3) {
      const v = acc.get(allP[i].toFixed(3) + "," + allP[i + 1].toFixed(3) + "," + allP[i + 2].toFixed(3)), l = Math.hypot(v[0], v[1], v[2]) || 1;
      on[i] = v[0] / l; on[i + 1] = v[1] / l; on[i + 2] = v[2] / l;
    }
    const ink = new T.BufferGeometry();
    ink.setAttribute("position", new T.Float32BufferAttribute(allP, 3)); ink.setAttribute("onormal", new T.BufferAttribute(on, 3));
    out.ink = ink; out.triangles = allP.length / 9;
    return out;
  }

  function build(L, heightAt, EXAG) {
    const tone = kit.tone, mat = kit.mat, C = m => m.userData.kitColor.clone();
    // Muted, as in the master painting (villages read as clusters of pale houses with grey roofs). The eight roof
    // slots that villages.py assigns keep their meaning but in quiet tints: tiled greys, a weathered blue-grey and
    // moss-green tin, thatch, and an aged red-brown tin roof.
    const ROOF = [C(mat.kawara), C(tone("kawara", -0.25)), C(tone("byakugun", -0.38)), C(tone("hinoki", -0.5)),
                  C(tone("rokusho", 0.22)), C(tone("kuchiba", -0.35)), C(tone("kawara", 0.22)), C(tone("kawara", -0.4))];
    const WALL = [C(mat.gofun), C(tone("tonoko", 0.45)), C(tone("hinoki", 0.15)), C(tone("hinoki", -0.25)), C(mat.gofun)];
    const DARK = C(tone("hinoki", -0.55));
    const items = (L.houses && L.houses.items) || [];
    const group = new T.Group(); group.name = "houses";
    const body = K.toonMaterial(0xffffff);
    const m4 = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), sc = new T.Vector3(), Y = new T.Vector3(0, 1, 0);
    let tris = 0;
    SPEC.forEach((s, ti) => {
      const list = items.filter(it => (it[4] | 0) === ti);
      if (!list.length) return;
      const geo = bake(s);
      const meshes = {};
      ["wall", "roof", "trim", "dark"].forEach(k => { if (geo[k]) meshes[k] = new T.InstancedMesh(geo[k], body, list.length); });
      meshes.ink = new T.InstancedMesh(geo.ink, K.outlineMaterial, list.length);
      list.forEach((it, i) => {
        q.setFromAxisAngle(Y, it[3] * Math.PI / 180);
        p.set(it[0], heightAt(it[0], it[1]) * EXAG, it[1]); sc.setScalar(it[2] / UNIT);
        m4.compose(p, q, sc);
        Object.values(meshes).forEach(m => m.setMatrixAt(i, m4));
        const roof = ROOF[it[5]] || ROOF[0];
        meshes.wall.setColorAt(i, WALL[it[6]] || WALL[0]);
        meshes.roof.setColorAt(i, roof);
        if (meshes.trim) meshes.trim.setColorAt(i, roof.clone().multiplyScalar(0.68));
        if (meshes.dark) meshes.dark.setColorAt(i, DARK);
      });
      Object.values(meshes).forEach(m => {
        m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
        m.frustumCulled = false; m.renderOrder = 2; group.add(m);
      });
      tris += geo.triangles * list.length;
    });
    return { group, setZoom() {}, count: items.length, triangles: tris };
  }
  return { build, SPEC };
})();
