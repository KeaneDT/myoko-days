/* Myoko Diorama: two small easter eggs (v19).
   MyokoCritters.create({ T, kit, L, heightAt, EXAG }) -> { build(), update(sec, zoom), active(), info(), force(name), group }

   - A small white fox lives in the meadow behind Mt Iizuna. Iizuna is the mountain of the tengu Iizuna Saburo, who rides a white fox, so it wears
     the little red cord of a shrine fox. It trots about, stops to sit and look around, sniffs the grass, crouches and pounces, hops about for the
     fun of it, and now and then dashes. It remains present throughout the visit.
   - A small charcoal snake has one continuous tapered skin. Its entire body follows a validated, gently sinuous circuit on the lower
     southeast foot of Mt Kurohime, with slow travel, rests and modest head/tongue inspection. It never roams onto the mountain.
   - The fox uses the terrain's live aerial perspective on cloned materials, including a softer distant shadow.
   Both remain spawned at every zoom and are never clickable or labelled. Reduced motion keeps their initial still poses.
   The snake's full-width circuit excludes actual rice plots, village house footprints, water and attraction models. */
window.MyokoCritters = (function () {
  "use strict";
  const TAU = Math.PI * 2;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const smooth = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };

  function create(ctx) {
    const { T, kit, L, heightAt, EXAG } = ctx;
    const group = new T.Group(); group.name = "myoko-critters";
    const grazers = window.MyokoGrazers ? window.MyokoGrazers.create(ctx) : null; if (grazers) group.add(grazers.group);
    const noRay = o => { o.raycast = () => {}; return o; };
    const halfN = L.spanMetres.northSouth / 2, halfE = L.spanMetres.eastWest / 2;
    const gy = (x, z) => heightAt(x, z) * EXAG;
    const rnd = Math.random, rr = (a, b) => a + rnd() * (b - a);

    /* ---------------------------------------------------------------- the land they may walk on */
    const peakOf = name => { const p = (L.peaks || []).find(q => q.name.startsWith(name)); return p ? { x: p.x, z: p.z } : null; };
    const inPoly = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { if ((P[i][1] > z) !== (P[j][1] > z) && x < (P[j][0] - P[i][0]) * (z - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; } return c; };
    const lakes = (L.lakes || []).map(l => l.outline), sea = L.sea || [];
    const models = (L.attractions || []).map(a => ({ x: a.x, z: a.z, r: 0.62 * a.size + 500 }));
    const riverSegs = [];                                              // every river segment, with the margin to keep from it (half its width + room)
    (L.rivers || []).forEach(r => { const P = r.points || []; for (let i = 1; i < P.length; i++) riverSegs.push({ ax: P[i - 1][0], az: P[i - 1][1], bx: P[i][0], bz: P[i][1], m: (r.width || 120) / 2 + 280 }); });
    const slopeAt = (x, z) => Math.hypot(heightAt(x + 120, z) - heightAt(x - 120, z), heightAt(x, z + 120) - heightAt(x, z - 120)) / 240;
    const riverClear = (x, z, near) => {
      for (const s of riverSegs) {
        if (Math.abs(x - (s.ax + s.bx) / 2) > near && Math.abs(z - (s.az + s.bz) / 2) > near) continue;
        const dx = s.bx - s.ax, dz = s.bz - s.az, l2 = dx * dx + dz * dz || 1, t = clamp(((x - s.ax) * dx + (z - s.az) * dz) / l2, 0, 1);
        if (Math.hypot(x - s.ax - t * dx, z - s.az - t * dz) < s.m) return false;
      }
      return true;
    };
    // a zone: a disc round an anchor, minus water, models, rivers and ground that is too steep. A creature never leaves it.
    function makeZone(z) {
      const near = z.R + 3000, segs = riverSegs.filter(s => Math.hypot((s.ax + s.bx) / 2 - z.x, (s.az + s.bz) / 2 - z.z) < near + 3000);
      z.ok = (x, y) => {
        if (Math.hypot(x - z.x, y - z.z) > z.R) return false;
        if (z.hole && Math.hypot(x - z.hole.x, y - z.hole.z) < z.hole.r) return false;
        if (Math.abs(x) > halfN - 1300 || Math.abs(y) > halfE - 1300) return false;
        if (lakes.some(o => inPoly(o, x, y)) || inPoly(sea, x, y)) return false;
        if (models.some(m => Math.hypot(x - m.x, y - m.z) < m.r)) return false;
        if (slopeAt(x, y) > z.slope) return false;
        for (const s of segs) {
          const dx = s.bx - s.ax, dz = s.bz - s.az, l2 = dx * dx + dz * dz || 1, t = clamp(((x - s.ax) * dx + (y - s.az) * dz) / l2, 0, 1);
          if (Math.hypot(x - s.ax - t * dx, y - s.az - t * dz) < s.m) return false;
        }
        return true;
      };
      z.line = (x0, y0, x1, y1) => { const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 140)); for (let i = 1; i <= n; i++) if (!z.ok(lerp(x0, x1, i / n), lerp(y0, y1, i / n))) return false; return true; };
      z.pick = (x0, y0, minD, maxD) => {                              // a random spot in the zone that can be walked to in a straight line
        for (let k = 0; k < 40; k++) {
          const a = rnd() * TAU, d = rr(minD, maxD), x = x0 + Math.cos(a) * d, y = y0 + Math.sin(a) * d;
          if (z.ok(x, y) && z.line(x0, y0, x, y)) return { x, z: y };
        }
        return null;
      };
      z.spawn = () => { for (let k = 0; k < 120; k++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * z.R * 0.8, x = z.x + Math.cos(a) * d, y = z.z + Math.sin(a) * d; if (z.ok(x, y)) return { x, z: y }; } return null; };
      return z;
    }

    /* ---------------------------------------------------------------- shared little things: a ground shadow, a puff of mist */
    const shadowMat = new T.MeshBasicMaterial({ color: 0x1d2a24, transparent: true, opacity: 0.26, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    const circle = new T.CircleGeometry(1, 18); circle.rotateX(-Math.PI / 2);
    function makeShadow() { const m = noRay(new T.Mesh(circle, shadowMat.clone())); m.renderOrder = 2; m.visible = false; group.add(m); return m; }
    const puffs = []; const puffMat = kit.mat.kasumi;
    function puffAt(x, y, z, size) {
      const g = new T.Group(); g.position.set(x, y, z);
      const bits = []; for (let i = 0; i < 7; i++) { const m = noRay(kit.sphere(1, puffMat, { segments: 7 })); const a = i / 7 * TAU + rnd(); m.userData = { dx: Math.cos(a) * size * rr(0.2, 0.55), dz: Math.sin(a) * size * rr(0.2, 0.55), up: size * rr(0.1, 0.45), r: size * rr(0.16, 0.3) }; g.add(m); bits.push(m); }
      group.add(g); puffs.push({ g, bits, t: 0 });
    }
    function stepPuffs(dt, gate) {
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i]; p.t += dt;
        const k = p.t / 0.9;
        if (k >= 1) { group.remove(p.g); puffs.splice(i, 1); continue; }
        p.bits.forEach(m => { const u = m.userData, e = Math.sin(Math.PI * k) * gate; m.position.set(u.dx * (0.3 + k), u.up * k, u.dz * (0.3 + k)); m.scale.setScalar(Math.max(0.001, u.r * e)); });
      }
    }

    /* ================================================================ THE FOX */
    const SF = 125;                                                    // model units to metres: a fox about 350 m long
    const FOX = { hipY: 0.72, up: 0.36, low: 0.34 };
    function makeFox() {
      const white = kit.tone("gofun", -0.03), cream = kit.tone("tonoko", 0.42), warm = kit.tone("kuchiba", 0.3), dark = kit.tone("sumi", 0.06), red = kit.mat.shu;
      const S = (r, m, x, y, z, sx, sy, sz, seg) => kit.sphere(r, m, { x, y, z, s: [sx || 1, sy || 1, sz || 1], segments: seg || 10 });
      const root = new T.Group(), rig = new T.Group(); root.name = "iizuna-fox"; rig.scale.setScalar(SF); root.add(rig);
      const torso = new T.Group(); rig.add(torso);
      torso.add(S(0.38, white, 0, 0, 0, 1.55, 0.82, 0.78), S(0.36, white, 0.48, 0.04, 0, 1.0, 1.0, 0.85), S(0.34, white, -0.42, 0, 0, 1.0, 0.95, 0.9),
                S(0.3, cream, 0.0, 0.17, 0, 1.75, 0.5, 0.72), S(0.22, warm, -0.2, 0.2, 0, 1.3, 0.34, 0.5));
      // head: neck, skull, muzzle, cheeks, ears, eyes, and a small red cord (a shrine fox's)
      const neck = new T.Group(); neck.position.set(0.74, 0.2, 0); torso.add(neck);
      neck.add(S(0.2, white, 0.05, 0.02, 0, 1.2, 1.0, 0.9));
      const cord = new T.Mesh(new T.TorusGeometry(0.17, 0.035, 6, 14), red); cord.rotation.y = Math.PI / 2; cord.position.set(0.02, 0.0, 0); neck.add(cord);
      const head = new T.Group(); head.position.set(0.2, 0.1, 0); neck.add(head);
      head.add(S(0.25, white, 0, 0, 0, 1.05, 0.95, 0.95));
      const mz = new T.Group(); mz.rotation.z = -Math.PI / 2; mz.position.set(0.12, -0.03, 0); mz.add(kit.cone(0.115, 0.4, white, { segments: 8 })); head.add(mz);
      head.add(S(0.05, dark, 0.53, -0.01, 0, 1.1, 0.9, 1.0, 7));
      [-1, 1].forEach(sd => {
        head.add(S(0.12, white, -0.02, -0.08, sd * 0.2, 1.3, 0.7, 0.55, 7));                       // cheek fluff
        head.add(S(0.034, dark, 0.14, 0.07, sd * 0.15, 1, 1.15, 0.8, 6));                           // eye
        const ear = kit.cone(0.105, 0.34, white, { x: -0.07, y: 0.17, z: sd * 0.14, rx: sd * 0.28, rz: 0.12, segments: 7 });
        const inner = kit.cone(0.06, 0.22, dark, { x: -0.035, y: 0.17, z: sd * 0.14, rx: sd * 0.28, rz: 0.12, segments: 7 });
        head.add(ear, inner); (head.userData["ear" + sd] = ear);
      });
      // tail: four soft lumps chained, each able to swing
      const tail = new T.Group(); tail.position.set(-0.6, 0.1, 0); torso.add(tail);
      const tailSegs = []; let par = tail;
      [[0.17, 1.5, white, -0.2], [0.21, 1.45, white, -0.26], [0.18, 1.45, cream, -0.22], [0.13, 1.5, white, -0.17]].forEach(([r, sx, m, off], i) => {
        const g = new T.Group(); g.position.set(i ? tailSegs[i - 1].len : 0, 0, 0); par.add(g); g.add(S(r, m, off, 0, 0, sx, 0.92, 0.92)); tailSegs.push({ g, len: -0.4 + (i === 1 ? -0.04 : 0) }); par = g;
      });
      // legs: thigh and shin (dark socks), each hung from a hip joint
      function leg(x, z, front) {
        const hip = new T.Group(); hip.position.set(x, -0.1, z); torso.add(hip);
        hip.add(kit.cyl(0.095, 0.065, FOX.up, front ? white : cream, { y: -FOX.up, segments: 7 }));
        const knee = new T.Group(); knee.position.y = -FOX.up; hip.add(knee);
        knee.add(kit.cyl(0.058, 0.042, FOX.low, dark, { y: -FOX.low, segments: 6 }), kit.box(0.17, 0.06, 0.1, dark, { x: 0.035, y: -FOX.low - 0.01, bevel: 0.2 }));
        return { hip, knee, front };
      }
      const legs = { fl: leg(0.46, 0.17, true), fr: leg(0.46, -0.17, true), hl: leg(-0.4, 0.17, false), hr: leg(-0.4, -0.17, false) };
      root.traverse(noRay);
      return { root, torso, neck, head, tail, tailSegs, legs, ears: [head.userData.ear1, head.userData["ear-1"]] };
    }
    function poseFox(f, P) {                                           // P: gait phase, amp, crouch, sit, air (0..1 or -1), pitch, headPitch, headYaw, tailLift, tailSwish, ear
      const r = f.rig, lg = r.legs;
      const trot = P.amp, ph = P.phase;
      // each leg: [hip angle, knee angle]
      function setLeg(l, phase, hipBase, kneeBase, hipAmp, bend) {
        const s = Math.sin(phase), c = Math.cos(phase);
        l.hip.rotation.z = hipBase + hipAmp * s * trot;
        l.knee.rotation.z = kneeBase - bend * Math.max(0, c) * trot;
      }
      const cr = P.crouch, sit = P.sit;
      const gallop = P.gallop || 0;
      const pairA = ph, pairB = ph + Math.PI;
      const fPh = gallop ? ph : null;
      const frontA = gallop ? ph : pairA, frontB = gallop ? ph + 0.35 : pairB, hindA = gallop ? ph + 2.4 : pairB, hindB = gallop ? ph + 2.75 : pairA;
      setLeg(lg.fl, frontA, 0.0 + 0.45 * cr, 0.12 - 0.8 * cr, 0.62, 1.0);
      setLeg(lg.fr, frontB, 0.0 + 0.45 * cr, 0.12 - 0.8 * cr, 0.62, 1.0);
      setLeg(lg.hl, hindA, 0.32 + 0.5 * cr, -0.6 - 0.7 * cr, 0.55, 1.0);
      setLeg(lg.hr, hindB, 0.32 + 0.5 * cr, -0.6 - 0.7 * cr, 0.55, 1.0);
      let y = lerp(FOX.hipY, 0.5, cr), pitch = P.pitch || 0;
      y += trot * (gallop ? 0.1 : 0.035) * Math.abs(Math.sin(ph));
      pitch += trot * (gallop ? 0.14 : 0.03) * Math.sin(ph * (gallop ? 1 : 2) + 1);
      if (sit > 0) {                                                  // sitting: rump down, chest up, front legs straight, hind legs folded
        const sp = 0.62 * sit;
        y = lerp(y, 0.554, sit); pitch += sp;
        lg.fl.hip.rotation.z = lg.fr.hip.rotation.z = lerp(lg.fl.hip.rotation.z, -sp, sit); lg.fl.knee.rotation.z = lg.fr.knee.rotation.z = lerp(lg.fl.knee.rotation.z, 0.05, sit);
        lg.hl.hip.rotation.z = lg.hr.hip.rotation.z = lerp(lg.hl.hip.rotation.z, 1.35, sit); lg.hl.knee.rotation.z = lg.hr.knee.rotation.z = lerp(lg.hl.knee.rotation.z, -2.3, sit);
      }
      if (P.air >= 0) {                                               // in the air: front legs reach, hind legs trail, everything tucks at the top
        const a = P.air, tuck = Math.sin(Math.PI * a);
        lg.fl.hip.rotation.z = lg.fr.hip.rotation.z = 0.7 + 0.25 * Math.cos(Math.PI * a) + 0.1 * tuck; lg.fl.knee.rotation.z = lg.fr.knee.rotation.z = -1.0 * tuck - 0.1;
        lg.hl.hip.rotation.z = lg.hr.hip.rotation.z = -0.55 + 0.9 * smooth(a); lg.hl.knee.rotation.z = lg.hr.knee.rotation.z = -0.5 - 0.9 * tuck;
        y = FOX.hipY - 0.05 * tuck;
      }
      r.torso.position.y = y; r.torso.rotation.z = pitch;
      // the legs of a sitting fox hang straight down whatever the body does
      r.neck.rotation.z = (P.headPitch || 0) * 0.45 - (sit ? 0.5 * sit : 0); r.head.rotation.z = (P.headPitch || 0) * 0.55;
      r.neck.rotation.y = (P.headYaw || 0) * 0.5; r.head.rotation.y = (P.headYaw || 0) * 0.6;
      const tl = P.tailLift == null ? 0.25 : P.tailLift, sw = P.tailSwish || 0;
      r.tail.rotation.z = tl; r.tail.rotation.y = sw * 0.3;
      r.tailSegs.forEach((s, i) => { s.g.rotation.y = sw * 0.35 * (i + 1) / 2; s.g.rotation.z = -0.08 * i + (P.tailCurl || 0) * 0.35 + Math.sin(P.tailPhase * 1.6 - i * 0.7) * 0.07 * (1 + trot); });
      const ear = P.ear || 0; r.ears.forEach((e, i) => { if (e) e.rotation.z = 0.12 - ear * 0.5 * (i ? 1 : 0.4); });
    }

    const foxZone = (() => {
      const pk = peakOf("Mt Iizuna"); if (!pk) return null;
      return makeZone({ x: pk.x + 1500, z: pk.z - 5200, R: 3300, slope: 0.3 });   // the meadow behind Iizuna: on the far side of the peak from the valley
    })();

    function newFox() {
      const f = { key: "fox", zone: foxZone, rig: makeFox(), shadow: makeShadow(), st: "hidden", t: 0, x: 0, z: 0, hd: 0, v: 0, phase: 0, age: 0, life: 0, scale: 0, h: 0, tailPhase: 0, look: 0 };
      f.rig.root.visible = false; group.add(f.rig.root);
      return f;
    }
    function foxPick(f, minD, maxD) { return f.zone.pick(f.x, f.z, minD, maxD); }
    function foxAfter(f) {                                             // what to do next: mostly wander, often stop and do something
      const r = rnd();
      // The fox is a permanent resident; its behavioural cycle never despawns it.
      if (r < 0.34) return foxGo(f, 500, 1900);
      if (r < 0.50) { f.st = "sit"; f.t = rr(3.5, 6.5); f.look = rnd() * TAU; return; }
      if (r < 0.62) { f.st = "sniff"; f.t = rr(2.2, 3.6); return; }
      if (r < 0.76) return foxPounce(f);
      if (r < 0.90) return foxHops(f);
      return foxDash(f);
    }
    function foxGo(f, a, b) { const p = foxPick(f, a, b); if (!p) { f.st = "sit"; f.t = 2.5; return; } f.tx = p.x; f.tz = p.z; f.st = "trot"; f.vmax = rr(130, 200); }
    function foxDash(f) { const p = foxPick(f, 1600, 3000); if (!p) return foxGo(f, 400, 1200); f.tx = p.x; f.tz = p.z; f.st = "dash"; f.vmax = 430; }
    function jumpTarget(f, dist, spread) {                             // a landing spot in front of the fox, kept on its own ground
      for (let k = 0; k < 12; k++) {
        const a = f.hd + rr(-spread, spread), d = dist * rr(0.8, 1.15), x = f.x + Math.cos(a) * d, z = f.z + Math.sin(a) * d;
        if (f.zone.ok(x, z) && f.zone.line(f.x, f.z, x, z)) return { x, z, a };
      }
      return null;
    }
    function foxPounce(f) {
      const p = jumpTarget(f, 1000, 0.9); if (!p) return foxGo(f, 500, 1500);
      f.jx0 = f.x; f.jz0 = f.z; f.jx1 = p.x; f.jz1 = p.z; f.jh = 520; f.jt = 1.05; f.hopsLeft = 0; f.tx = p.x; f.tz = p.z; f.faceTo = p.a;
      f.st = "stalk"; f.t = rr(1.1, 1.7);
    }
    function foxHops(f) { f.hopsLeft = 3 + (rnd() < 0.5 ? 1 : 0); foxHop(f); }
    function foxHop(f) {
      const p = jumpTarget(f, 520, 1.4); if (!p) { f.hopsLeft = 0; return foxAfter(f); }
      f.jx0 = f.x; f.jz0 = f.z; f.jx1 = p.x; f.jz1 = p.z; f.jh = 210; f.jt = 0.6; f.faceTo = p.a; f.st = "leap"; f.t = 0; f.hop = true;
    }
    function stepFox(f, dt, sec, gate) {
      const P = { phase: f.phase, amp: 0, crouch: 0, sit: 0, air: -1, pitch: 0, headPitch: 0, headYaw: 0, tailLift: 0.25, tailSwish: 0, ear: 0, tailPhase: sec, gallop: 0 };
      let height = 0;
      if (f.st === "hidden") {
        f.t -= dt; if (f.t > 0) return;
        const s = f.zone && f.zone.spawn(); if (!s) { f.t = 6; return; }
        f.x = s.x; f.z = s.z; f.hd = rnd() * TAU; f.age = 0; f.life = Infinity; f.scale = 1; f.v = 0; f.st = "sit"; f.t = 4; f.rig.root.visible = true; f.shadow.visible = true;

      }
      f.age += dt;
      const move = (vmax, turn, acc) => {                              // steer towards (tx,tz) and walk; returns the distance left
        const dx = f.tx - f.x, dz = f.tz - f.z, d = Math.hypot(dx, dz), want = Math.atan2(dz, dx), da = angDiff(f.hd, want);
        f.hd += clamp(da, -turn * dt, turn * dt);
        const align = Math.max(0.15, Math.cos(Math.min(1.4, Math.abs(da))));
        f.v = lerp(f.v, Math.min(vmax, d * 1.6 + 40) * align, Math.min(1, acc * dt));
        const nx = f.x + Math.cos(f.hd) * f.v * dt, nz = f.z + Math.sin(f.hd) * f.v * dt;
        if (f.zone.ok(nx, nz)) { f.x = nx; f.z = nz; } else { f.v = 0; f.tx = f.x; f.tz = f.z; return 0; }
        return d;
      };
      switch (f.st) {
        case "appear": f.t += dt; f.v = 0; if (f.t > 0.7) foxAfter(f); break;
        case "trot": case "dash": {
          const dash = f.st === "dash", d = move(f.vmax, dash ? 3.4 : 2.6, dash ? 2.4 : 3);
          f.phase += dt * (f.v / (SF * 0.34)) * (dash ? 0.72 : 1);
          P.phase = f.phase; P.amp = clamp(f.v / (dash ? 300 : 150), 0.2, 1.2); P.gallop = dash ? 1 : 0; P.tailLift = dash ? 0.05 : 0.2; P.tailSwish = Math.sin(sec * 3) * 0.3; P.headPitch = dash ? 0.1 : 0;
          if (d < 90 || f.v < 3) { f.st = "settle"; f.t = rr(0.3, 0.9); }
          break;
        }
        case "settle": f.v = lerp(f.v, 0, Math.min(1, dt * 7)); f.t -= dt; P.phase = f.phase; P.amp = clamp(f.v / 150, 0, 1); f.phase += dt * f.v / (SF * 0.34); P.headYaw = Math.sin(sec * 2) * 0.3; if (f.t <= 0) foxAfter(f); break;
        case "sit": {
          f.v = 0; f.t -= dt; const e = smooth(Math.min(1, (1 - Math.max(0, f.t - 0)) ));  // eased in over the first moments
          const into = smooth(clamp(f.sitT = (f.sitT || 0) + dt, 0, 0.6) / 0.6);
          P.sit = f.t > 0.5 ? into : smooth(f.t / 0.5) * into;
          P.headYaw = Math.sin(sec * 0.9 + f.look) * 0.9; P.headPitch = Math.sin(sec * 0.55 + 1) * 0.18 + 0.1;
          P.tailSwish = Math.sin(sec * 1.7) * 0.6; P.tailCurl = 1; P.tailLift = -0.5; P.ear = Math.max(0, Math.sin(sec * 3.1)) * (Math.sin(sec * 0.7) > 0.4 ? 1 : 0);
          if (f.t <= 0) { f.sitT = 0; foxAfter(f); }
          break;
        }
        case "sniff": {
          f.t -= dt; f.v = lerp(f.v, 22, Math.min(1, dt * 3)); f.phase += dt * 2.2; P.phase = f.phase; P.amp = 0.28;
          f.x += Math.cos(f.hd) * f.v * dt * (f.zone.ok(f.x + Math.cos(f.hd) * 60, f.z + Math.sin(f.hd) * 60) ? 1 : 0); f.z += Math.sin(f.hd) * f.v * dt * (f.zone.ok(f.x + Math.cos(f.hd) * 60, f.z + Math.sin(f.hd) * 60) ? 1 : 0);
          P.headPitch = -0.95 + Math.sin(sec * 7) * 0.12; P.tailLift = 0.35; P.tailSwish = Math.sin(sec * 4) * 0.4; P.crouch = 0.2;
          if (f.t <= 0) foxAfter(f);
          break;
        }
        case "stalk": {                                                // crouch, eyes on the spot, haunches wiggling
          f.t -= dt; f.v = 0; const want = f.faceTo; f.hd += clamp(angDiff(f.hd, want), -3 * dt, 3 * dt);
          const k = smooth(Math.min(1, (1.3 - f.t) / 0.5)); P.crouch = 0.9 * k; P.headPitch = -0.35 * k; P.tailLift = 0.45 * k; P.tailSwish = Math.sin(sec * 22) * 0.7 * k; P.amp = 0;
          P.pitch = -0.1 * k; f.rig.root.userData.wig = Math.sin(sec * 22) * 0.05 * k;
          if (f.t <= 0) { f.st = "leap"; f.t = 0; f.hop = false; }
          break;
        }
        case "leap": {
          f.t += dt; const a = clamp(f.t / f.jt, 0, 1);
          f.x = lerp(f.jx0, f.jx1, a); f.z = lerp(f.jz0, f.jz1, a); f.hd += clamp(angDiff(f.hd, f.faceTo), -9 * dt, 9 * dt);
          height = 4 * f.jh * a * (1 - a); P.air = a; P.pitch = f.hop ? 0.5 - 1.0 * a : 0.65 - 1.7 * a; P.headPitch = f.hop ? 0 : -0.3 * a; P.tailLift = 0.5 - 0.7 * a; P.tailSwish = Math.sin(sec * 9) * 0.3; f.v = 0;
          if (a >= 1) {
            f.x = f.jx1; f.z = f.jz1;
            if (f.hop && f.hopsLeft > 1) { f.hopsLeft--; foxHop(f); } else { f.st = "land"; f.t = f.hop ? 0.25 : 0.9; P.air = -1; f.landSq = 1; }
          }
          break;
        }
        case "land": {                                                 // the squash of landing, then a proud shake
          f.t -= dt; const k = smooth(f.t / (f.hop ? 0.25 : 0.9)); P.crouch = 0.75 * k; P.headPitch = (f.hop ? 0 : -0.6) * k; P.tailSwish = Math.sin(sec * 14) * 0.6 * (1 - k); P.tailLift = 0.4;
          if (f.t <= 0) foxAfter(f);
          break;
        }
      }
      // appear and vanish: pop up out of the ground
      const grow = 1;
      f.scale = grow;
      poseFox(f, P);
      const ground = gy(f.x, f.z), ahead = gy(f.x + Math.cos(f.hd) * 110, f.z + Math.sin(f.hd) * 110), behind = gy(f.x - Math.cos(f.hd) * 110, f.z - Math.sin(f.hd) * 110);
      const root = f.rig.root;
      root.position.set(f.x, ground + 4 + height, f.z);
      root.rotation.order = "YZX"; root.rotation.set(0, -f.hd, Math.atan2(ahead - behind, 220) * 0.8 * (height > 0 ? 0 : 1));
      root.scale.setScalar(Math.max(0.001, grow * gate));
      const sh = f.shadow; sh.position.set(f.x, ground + 5, f.z); sh.rotation.y = -f.hd;
      const hh = clamp(height / 500, 0, 1); sh.scale.set(SF * 1.1 * (1 - 0.35 * hh) * grow * gate + 0.001, 1, SF * 0.55 * (1 - 0.35 * hh) * grow * gate + 0.001); sh.material.opacity = 0.26 * (1 - 0.6 * hh);
      if (f.haze) {
        const u = f.haze, dist = root.position.distanceTo(u.uCamPos.value), vd = Math.max(1, u.uViewDist.value);
        sh.material.opacity *= 1 - 0.65 * smooth((dist - 0.85 * vd) / (1.25 * vd));
      }
    }

    /* ================================================================ THE SNAKE (v19: one continuous skin) */
    const SNAKE_LENGTH = 580, BODY_SPANS = 96, BODY_SIDES = 12;
    const kurPk = peakOf("Mt Kurohime");
    const houseBlocks = ((L.houses && L.houses.items) || []).map(h => ({ x: h[0], z: h[1], r: h[2] * 0.9 + 80 }));
    let fieldBlocks = [];
    const snakeZone = kurPk ? makeZone({ x: kurPk.x - 1500, z: kurPk.z + 3050, R: 850, slope: 0.38,
      hole: { x: kurPk.x, z: kurPk.z, r: 2600 } }) : null;
    if (snakeZone) {
      const landOK = snakeZone.ok;
      snakeZone.ok = (x, z) => landOK(x, z) && heightAt(x, z) < 1150 &&
        houseBlocks.every(h => Math.hypot(x - h.x, z - h.z) > h.r) &&
        fieldBlocks.every(p => { const dx = x - p.x, dz = z - p.z;
          return Math.abs(dx * p.ca + dz * p.sa) > p.hw || Math.abs(-dx * p.sa + dz * p.ca) > p.hd; });
    }

    // Validate the whole ribbon, including the body's thickness, before it can become a route.
    function makeSnakeRoute() {
      if (!snakeZone) return null;
      for (const scale of [1, 0.85, 0.7]) {
        const points = [];
        for (let i = 0; i < 128; i++) {
          const a = i / 128 * TAU;
          const x = snakeZone.x + scale * (520 * Math.cos(a) + 55 * Math.sin(2 * a));
          const z = snakeZone.z + scale * (300 * Math.sin(a) + 30 * Math.sin(3 * a));
          const dx = scale * (-520 * Math.sin(a) + 110 * Math.cos(2 * a));
          const dz = scale * (300 * Math.cos(a) + 90 * Math.cos(3 * a));
          const len = Math.hypot(dx, dz), wave = 42 * Math.sin(a * 8);
          points.push(new T.Vector3(x - dz / len * wave, 0, z + dx / len * wave));
        }
        const path = new T.CatmullRomCurve3(points, true, "centripetal");
        path.arcLengthDivisions = 2048; path.updateArcLengths();
        const length = path.getLength();
        let safe = length > SNAKE_LENGTH * 3;
        for (let d = 0; safe && d < length; d += 8) {
          const p = path.getPointAt(d / length);
          for (let j = 0; j < 8; j++) {
            const a = j / 8 * TAU;
            if (!snakeZone.ok(p.x + 44 * Math.cos(a), p.z + 44 * Math.sin(a))) { safe = false; break; }
          }
        }
        if (safe) return { path, length, at: d => path.getPointAt(((d % length) + length) % length / length) };
      }
      return null;
    }
    let snakeRoute = makeSnakeRoute();
    function setObstacles(plots) {
      if (grazers) grazers.setObstacles(plots);
      if (!snakeZone) return;
      fieldBlocks = (plots || []).filter(p => Math.hypot(p.x - snakeZone.x, p.z - snakeZone.z) < snakeZone.R + 500)
        .map(p => ({ x: p.x, z: p.z, hw: p.w / 2 + 55, hd: p.d / 2 + 55, ca: Math.cos(p.ang), sa: Math.sin(p.ang) }));
      snakeRoute = makeSnakeRoute();
      const snake = crit.find(c => c.key === "snake");
      if (snake && snakeRoute) stepSnake(snake, 0, 0, 1);
      else if (snake) snake.obj.visible = false;
    }
    function snakeRadius(u) { return 20 * (0.74 + 0.26 * smooth(u / 0.16)) * Math.pow(1 - u, 0.48) + 0.65; }
    function makeSnake() {
      const root = new T.Group(); root.name = "kurohime-snake";
      const vertices = new Float32Array((BODY_SPANS + 1) * (BODY_SIDES + 1) * 3);
      const colors = new Float32Array(vertices.length), indices = [];
      const dorsal = new T.Color(0x35443a), flank = new T.Color(0x465346), belly = new T.Color(0x8b8e6b);
      for (let i = 0; i <= BODY_SPANS; i++) for (let j = 0; j <= BODY_SIDES; j++) {
        const a = j / BODY_SIDES * TAU, y = Math.sin(a), c = flank.clone();
        c.lerp(y < 0 ? belly : dorsal, y < 0 ? smooth((-y - 0.3) / 0.6) * 0.65 : y * 0.65);
        c.toArray(colors, (i * (BODY_SIDES + 1) + j) * 3);
        if (i < BODY_SPANS && j < BODY_SIDES) {
          const k = i * (BODY_SIDES + 1) + j, n = k + BODY_SIDES + 1;
          indices.push(k, k + 1, n, k + 1, n + 1, n);
        }
      }
      for (let j = 1; j < BODY_SIDES - 1; j++) {
        const tail = BODY_SPANS * (BODY_SIDES + 1);
        indices.push(0, j + 1, j, tail, tail + j, tail + j + 1);
      }
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.BufferAttribute(vertices, 3).setUsage(T.DynamicDrawUsage));
      geo.setAttribute("color", new T.BufferAttribute(colors, 3)); geo.setIndex(indices);
      const material = kit.tone("sumi", 0.08).clone(); material.color.setHex(0xffffff); material.vertexColors = true;
      const body = noRay(new T.Mesh(geo, material)); body.name = "snake-continuous-body"; body.frustumCulled = false;
      root.add(body);
      // Flattened, softly rounded head; no alternating beads or oversized cartoon features.
      const head = new T.Group(); head.name = "snake-head";
      const ink = kit.tone("sumi", 0.04), jaw = kit.tone("sumi", 0.22);
      head.add(kit.sphere(1, ink, { s: [29, 13, 21], segments: 16 }),
        kit.sphere(1, ink, { x: 22, y: -1, s: [18, 9, 16], segments: 12 }),
        kit.sphere(1, jaw, { x: 12, y: -7, s: [23, 4.5, 16], segments: 12 }));
      [-1, 1].forEach(sd => {
        head.add(kit.sphere(2.5, kit.tone("kin", -0.24), { x: 15, y: 6, z: sd * 17, segments: 8 }),
          kit.sphere(1.5, ink, { x: 16, y: 6.4, z: sd * 18.5, segments: 7 }));
      });
      const tongue = new T.Group(); tongue.position.set(34, -3, 0);
      const red = kit.tone("shu", -0.2);
      function tonguePart(a, b) {
        const from = new T.Vector3(...a), to = new T.Vector3(...b), v = to.clone().sub(from);
        const m = new T.Mesh(new T.CylinderGeometry(0.8, 1, v.length(), 5), red);
        m.position.copy(from.add(to).multiplyScalar(0.5));
        m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), v.normalize()); tongue.add(m);
      }
      tonguePart([0, 0, 0], [12, 0, 0]);
      [-1, 1].forEach(sd => tonguePart([12, 0, 0], [19, 0, sd * 4]));
      head.add(tongue); root.add(head); root.traverse(noRay);
      root.userData = { body, head, tongue, centers: [], length: SNAKE_LENGTH };
      return root;
    }
    function newSnake() {
      const s = { key: "snake", zone: snakeZone, obj: makeSnake(), st: "hidden", t: 0,
        distance: 0, x: 0, z: 0, v: 0, lift: 0, age: 0, cycle: 0 };
      s.obj.visible = false; group.add(s.obj); return s;
    }
    function snakeGo(s) { s.st = "slither"; s.t = rr(12, 19); s.vmax = rr(43, 61); }
    function stepSnake(s, dt, sec, gate) {
      if (!snakeRoute) return;
      if (s.st === "hidden") {
        s.t -= dt; if (s.t > 0) return;
        s.distance = 0; s.v = 0; s.age = 0; snakeGo(s);
      }
      s.age += dt; s.t -= dt;
      if (s.t <= 0) {
        if (s.st === "slither") { s.st = (++s.cycle % 3 === 0) ? "rest" : "look"; s.t = rr(3.5, 5.5); }
        else snakeGo(s);
      }
      const target = s.st === "slither" ? s.vmax * (0.94 + 0.06 * Math.sin(s.age * 0.45)) * smooth(s.t / 2) : 0;
      const oldV = s.v;
      s.v += clamp(target - s.v, -32 * dt, 24 * dt);
      s.distance += (oldV + s.v) * 0.5 * dt;
      const paused = 1 - smooth(s.v / 15);
      const wantLift = s.st === "look" ? 27 * paused * smooth(s.t / 0.8) : 0;
      s.lift = lerp(s.lift, wantLift, 1 - Math.exp(-3 * dt));
      const ud = s.obj.userData, arr = ud.body.geometry.attributes.position.array;
      const sc = gate;
      s.obj.visible = sc > 0.015;
      const centers = ud.centers; centers.length = 0;
      for (let i = 0; i <= BODY_SPANS; i++) {
        const u = i / BODY_SPANS, d = s.distance - u * SNAKE_LENGTH;
        const p = snakeRoute.at(d), before = snakeRoute.at(d - 3), after = snakeRoute.at(d + 3);
        const dx = after.x - before.x, dz = after.z - before.z, len = Math.hypot(dx, dz);
        const nx = -dz / len, nz = dx / len, r = snakeRadius(u) * sc;
        const lift = s.lift * smooth(1 - u / 0.22);
        centers.push({ x: p.x, z: p.z, r, y: gy(p.x, p.z) + r * 0.72 + 7 + lift });
        for (let j = 0; j <= BODY_SIDES; j++) {
          const a = j / BODY_SIDES * TAU, x = p.x + nx * Math.cos(a) * r, z = p.z + nz * Math.cos(a) * r;
          const k = (i * (BODY_SIDES + 1) + j) * 3;
          arr[k] = x; arr[k + 1] = gy(x, z) + r * 0.72 * (1 + Math.sin(a)) + 7 + lift; arr[k + 2] = z;
        }
      }
      ud.body.geometry.attributes.position.needsUpdate = true;
      ud.body.geometry.computeVertexNormals();
      // Close the shading seam by giving the duplicate ring vertices one shared normal.
      const normals = ud.body.geometry.attributes.normal;
      for (let i = 0; i <= BODY_SPANS; i++) {
        const a = i * (BODY_SIDES + 1), b = a + BODY_SIDES;
        const n = new T.Vector3().fromBufferAttribute(normals, a).add(new T.Vector3().fromBufferAttribute(normals, b)).normalize();
        normals.setXYZ(a, n.x, n.y, n.z); normals.setXYZ(b, n.x, n.y, n.z);
      }
      normals.needsUpdate = true;
      const p = centers[0], aim = snakeRoute.at(s.distance + 18), behind = snakeRoute.at(s.distance - 18);
      s.x = p.x; s.z = p.z;
      ud.head.position.set(p.x, p.y + 1, p.z); ud.head.scale.setScalar(Math.max(0.001, sc));
      ud.head.rotation.order = "YXZ";
      ud.head.rotation.set(0, -Math.atan2(aim.z - behind.z, aim.x - behind.x),
        Math.atan2(gy(aim.x, aim.z) - gy(behind.x, behind.z), Math.hypot(aim.x - behind.x, aim.z - behind.z)) + s.lift / 150);
      const flick = s.st === "look" && paused > 0.9 ? Math.max(0, Math.sin(s.age * 9)) ** 8 : 0;
      ud.tongue.visible = flick > 0.08; ud.tongue.scale.set(flick, 1, 1);
    }

    // Use the terrain's exact live aerial-perspective function, on private material clones.
    function setAtmosphere(shared, glsl) {
      if (grazers) grazers.setAtmosphere(shared, glsl);
      const fox = crit.find(c => c.key === "fox"); if (!fox) return;
      const clones = new Map();
      fox.rig.root.traverse(o => {
        if (!o.isMesh) return;
        const original = o.material;
        if (!clones.has(original)) {
          const m = original.clone();
          m.onBeforeCompile = shader => {
            Object.assign(shader.uniforms, shared);
            shader.vertexShader = "varying vec3 vCritterWorld;\n" + shader.vertexShader.replace("#include <worldpos_vertex>",
              "#include <worldpos_vertex>\nvCritterWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;");
            shader.fragmentShader = `${glsl.uniforms}\n${glsl.palette}\n${glsl.paint}\nvarying vec3 vCritterWorld;\n` +
              shader.fragmentShader.replace("#include <fog_fragment>", "#include <fog_fragment>\ngl_FragColor.rgb = pAerial(gl_FragColor.rgb, vCritterWorld);");
          };
          m.customProgramCacheKey = () => "myoko-fox-aerial-v19";
          clones.set(original, m);
        }
        o.material = clones.get(original);
      });
      fox.haze = shared;
    }

    /* ---------------------------------------------------------------- the clock */
    const crit = [];
    if (foxZone) crit.push(newFox());
    if (snakeRoute) crit.push(newSnake());
    crit.forEach(c => c.key === "fox" ? stepFox(c, 0.001, 0, 1) : stepSnake(c, 0.001, 0, 1));
    let last = null, gate = 1;
    function update(sec, zoom) {
      if (last === null) last = sec; const dt = Math.max(0, Math.min(0.1, sec - last)); last = sec;
      gate = 1; // Permanent residents, also visible at overview zoom.
      if (!dt) return;
      crit.forEach(c => c.key === "fox" ? stepFox(c, dt, sec, gate) : stepSnake(c, dt, sec, gate));
      if (grazers) grazers.update(dt);
      stepPuffs(dt, gate);
    }
    function force(name) { const c = crit.find(k => k.key === name); if (c) { c.st = "hidden"; c.t = 0; } }
    function jump(name, state) { const c = crit.find(k => k.key === name); if (!c) return; if (name === "fox") { if (state === "pounce") foxPounce(c); else if (state === "hops") foxHops(c); else if (state === "sit") { c.st = "sit"; c.t = 6; c.sitT = 0; } else if (state === "dash") foxDash(c); else if (state === "sniff") { c.st = "sniff"; c.t = 4; } } else { if (state === "look" || state === "rest") { c.st = state; c.t = 6; } else snakeGo(c); } }
    return { setAtmosphere, setObstacles, build: () => group, update, active: () => true, force, jump, info: () => crit.map(c => ({ key: c.key, st: c.st, x: Math.round(c.x), z: Math.round(c.z), age: Math.round(c.age) })).concat(grazers ? grazers.info() : []), zones: { fox: foxZone && { x: foxZone.x, z: foxZone.z, R: foxZone.R }, snake: snakeZone && { x: snakeZone.x, z: snakeZone.z, R: snakeZone.R } }, group };
  }
  return { create };
})();
