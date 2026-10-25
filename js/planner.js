/* Myoko Days — planning engine (v10).
   Principles
   - Every activity takes ONE half-day block (morning or afternoon). Nothing locks out a whole day.
     Four researched outings run long (u = 2 in the data); they still sit in one block but carry a "long outing"
     flag, which only adds a soft preference to leave the rest of that day light.
   - Short stops (museum, farmers' shop) and the evening onsen are add-ons: they ride along with a day and never take a block.
   - Areas can be mixed freely in one day. The planner prefers neighbouring areas (a soft cost from the real distance between
     area centres) but never refuses a combination.
   - Day 1 afternoon and the last morning are usable for gentler activities (the original team rule), not reserved.
   - Adding is never a dead end: the engine finds the best free block; if there is none it re-arranges activities the
     visitor has not pinned; if that is not enough it can grow the trip by a day. When nothing works it returns concrete
     ways forward (swap, extend, change a setting) instead of a refusal.
   - Placement values are { day, slot: 'am' | 'pm' | 'x', locked }. 'x' marks an add-on. locked = the visitor placed it by hand.
   All functions are pure: they take a state and return a result; they never mutate their input. */
window.MD = window.MD || {};
MD.planner = (() => {
  const D = MD.data;
  const RULES = {
    minDays: 3, maxDays: 7,
    edgeEffort: 3,        // arrival afternoon / departure morning: activities up to "Easy"
    moveCost: 6,          // cost of moving an activity the visitor did not pin
    nodeLimit: 90000      // search budget; far above what a 7-day trip needs
  };
  const SLOTS = ['am', 'pm'];
  const slotKey = (day, slot) => day * 2 + (slot === 'pm' ? 1 : 0);

  /* ---------- dates ---------- */
  const validDate = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    const d = new Date(value + 'T12:00:00');
    return Number.isFinite(d.getTime()) && d.getFullYear() === Number(value.slice(0, 4)) && d.getMonth() + 1 === Number(value.slice(5, 7)) && d.getDate() === Number(value.slice(8, 10));
  };
  const dateAt = (s, day) => {
    if (!validDate(s.date)) return null;
    const d = new Date(s.date + 'T12:00:00'); d.setDate(d.getDate() + day); return d;
  };

  /* ---------- geography: straight-line distance between area centres (real coordinates) ---------- */
  const rad = x => x * Math.PI / 180;
  const km = (p, q) => {
    const dLat = rad(q[1] - p[1]), dLon = rad(q[0] - p[0]);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(p[1])) * Math.cos(rad(q[1])) * Math.sin(dLon / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(h));
  };
  const centres = {};
  Object.keys(D.zones).forEach(z => {
    const pts = D.activities.filter(a => a.zone === z && a.geo !== 'tbc' && a.ll).map(a => a.ll);
    centres[z] = pts.length ? [pts.reduce((n, p) => n + p[0], 0) / pts.length, pts.reduce((n, p) => n + p[1], 0) / pts.length] : null;
  });
  const zoneKm = (a, b) => a === b ? 0 : (centres[a] && centres[b] ? km(centres[a], centres[b]) : 15);

  /* ---------- rules ---------- */
  const isLong = a => a.u === 2;
  const wOf = a => a.w === 'full' ? 'am' : a.w;        // long outings start in the morning
  const isAddon = a => a.u === 0;

  /* v12: only facts that make an activity impossible block it (unknown id, closed, or not a day-by-day activity).
     Walking level and season are advice, never a lock: see caution(). */
  function availability(a) {
    if (!a) return 'Unknown activity';
    if (a.closed) return a.closed;
    if (a.id === 'camp') return 'Overnight camping needs a separate stay, so it is not part of the day-by-day plan';
    return '';
  }
  /* Soft notes: more walking than the visitor chose, or outside the listed season. '' = nothing to flag.
     Used to rank suggestions and to show a small note; it never stops an activity from being added or placed. */
  function caution(a, s, day) {
    if (!a) return '';
    const bits = [];
    if (a.ef > s.walk) bits.push('More walking than you chose');
    if (day != null) {
      const d = dateAt(s, day), m = d ? d.getMonth() + 1 : s.month;
      if (!a.months.includes(m)) bits.push('Outside the listed season on this day');
    } else {
      const months = Array.from({ length: s.days }, (_, i) => dateAt(s, i)?.getMonth() + 1 || s.month);
      if (!months.some(m => a.months.includes(m))) bits.push('Outside the listed season for your dates');
    }
    return bits.join('. ');
  }
  /* Why a block cannot take an activity (independent of what else is planned). '' = fine. */
  function slotWhy(a, s, day, slot) {
    const last = s.days - 1;
    if (!Number.isInteger(day) || day < 0 || day > last) return 'That day is outside your trip';
    if (!SLOTS.includes(slot)) return 'Choose a morning or afternoon';
    if (day === 0 && slot === 'am') return 'Day 1 morning is for travelling to Myoko';
    if (day === last && slot === 'pm') return 'The last afternoon is kept for the journey home';
    if ((day === 0 || day === last) && a.ef > RULES.edgeEffort) return day === 0 ? 'Too demanding for an arrival afternoon' : 'Too demanding for the morning you leave';
    if (wOf(a) === 'am' && slot === 'pm') return 'This one needs a morning';
    if (wOf(a) === 'pm' && slot === 'am') return 'This one needs an afternoon';
    return '';
  }
  function candidates(a, s) {
    const out = [];
    for (let day = 0; day < s.days; day++) {
      if (availability(a, s, day)) continue;
      for (const slot of SLOTS) if (!slotWhy(a, s, day, slot)) out.push({ day, slot, k: slotKey(day, slot) });
    }
    return out;
  }

  /* ---------- soft costs ---------- */
  function unary(a, c, s, prev) {
    const last = s.days - 1;
    let u = 0;
    const p = prev && prev[a.id];
    if (p && !(p.day === c.day && p.slot === c.slot)) u += RULES.moveCost;
    const edge = c.day === 0 || c.day === last;
    if (a.id === 'winery') u += (c.day === last) ? 0 : 1.2;       // the data says it suits the last day
    else if (edge) u += 1.2;                                        // fill the full days first
    if (a.months && caution(a, s, c.day).includes('season')) u += 4;   // allowed, but prefer a day in season
    u += c.day * 0.01 + (c.slot === 'pm' ? 0.004 : 0);              // stable tie-break: earlier first
    return u;
  }
  function pair(a, b) {
    let c = 0;
    if (a.zone !== b.zone) c += 1 + zoneKm(a.zone, b.zone) / 12;
    if (a.ef >= 4 && b.ef >= 4) c += 2;
    if (a.lunch && b.lunch) c += 1.2;
    if (isLong(a) || isLong(b)) c += (isLong(a) && isLong(b)) ? 6 : 2.5;
    return c;
  }

  /* ---------- validity of what is stored ---------- */
  function validPlacements(s) {
    const out = {}, used = new Set();
    [...s.sel].forEach(id => {
      const a = D.byId[id], p = s.placements && s.placements[id];
      if (!a || !p || isAddon(a) || p.slot === 'x') return;
      if (availability(a, s, p.day) || slotWhy(a, s, p.day, p.slot)) return;
      const k = slotKey(p.day, p.slot);
      if (used.has(k)) return;
      used.add(k); out[id] = { day: p.day, slot: p.slot, locked: !!p.locked };
    });
    return out;
  }
  function addonDayOk(a, s, day) {
    if (!Number.isInteger(day) || day < 0 || day >= s.days) return false;
    if (a.slot === 'eve' && day === s.days - 1) return false;        // an evening is not spent after you leave
    return !availability(a, s, day);
  }
  function validAddons(s) {
    const out = {};
    [...s.sel].forEach(id => {
      const a = D.byId[id], p = s.placements && s.placements[id];
      if (!a || !isAddon(a) || !p || p.slot !== 'x') return;
      if (addonDayOk(a, s, p.day)) out[id] = { day: p.day, slot: 'x', locked: !!p.locked };
    });
    return out;
  }

  /* ---------- the search: best assignment of activities to free blocks ---------- */
  function solve(s, ids, fixed, o) {
    o = o || {};
    const occ = new Map();
    Object.entries(fixed).forEach(([id, p]) => occ.set(slotKey(p.day, p.slot), id));
    const items = ids.map(id => D.byId[id]);
    const cand = items.map(a => {
      let c = candidates(a, s).filter(x => !occ.has(x.k));
      const r = o.restrict && o.restrict[a.id];
      if (r) c = c.filter(r);
      return c.map(x => ({ ...x, u: unary(a, x, s, o.prev) })).sort((p, q) => p.u - q.u);
    });
    if (cand.some(c => !c.length)) return null;
    const order = items.map((_, i) => i).sort((x, y) => cand[x].length - cand[y].length);
    let best = null, bestCost = Infinity, nodes = 0;
    const chosen = new Array(items.length);
    (function rec(n, cost) {
      if (cost >= bestCost || nodes > RULES.nodeLimit) return;
      if (n === order.length) { best = chosen.slice(); bestCost = cost; return; }
      nodes++;
      const i = order[n], a = items[i];
      for (const c of cand[i]) {
        if (occ.has(c.k)) continue;
        let add = c.u;
        const partner = occ.get(slotKey(c.day, c.slot === 'am' ? 'pm' : 'am'));
        if (partner) add += pair(a, D.byId[partner]);
        occ.set(c.k, a.id); chosen[i] = c;
        rec(n + 1, cost + add);
        occ.delete(c.k);
      }
    })(0, 0);
    if (!best) return null;
    const assign = {};
    items.forEach((a, i) => { assign[a.id] = { day: best[i].day, slot: best[i].slot }; });
    return { assign, cost: bestCost };
  }

  /* Place `must` activities. Stage A moves nothing; stage B may move activities the visitor has not pinned. */
  function twoStage(s, must, placed, extraFixed, restrict) {
    const fixedA = { ...placed, ...extraFixed };
    let r = solve(s, must, fixedA, { prev: placed, restrict });
    if (r) return { assign: r.assign, rearranged: false };
    const locked = Object.fromEntries(Object.entries(placed).filter(([, p]) => p.locked));
    const flex = Object.keys(placed).filter(x => !placed[x].locked && !must.includes(x));
    const fixedB = { ...locked, ...extraFixed };
    r = solve(s, [...must, ...flex], fixedB, { prev: placed, restrict });
    if (r) return { assign: r.assign, rearranged: true };
    return null;
  }

  function buildPlacements(s, placed, addons, assign, lockIds) {
    const out = {};
    Object.entries(placed).forEach(([id, p]) => { out[id] = { ...p }; });
    Object.entries(addons).forEach(([id, p]) => { out[id] = { ...p }; });
    Object.entries(assign).forEach(([id, p]) => { out[id] = { day: p.day, slot: p.slot, locked: (lockIds && lockIds.includes(id)) || (placed[id] ? placed[id].locked : false) }; });
    return out;
  }
  const movedList = (placed, assign, skip) => Object.keys(assign).filter(id => placed[id] && id !== skip && (placed[id].day !== assign[id].day || placed[id].slot !== assign[id].slot)).map(id => ({ id, from: { day: placed[id].day, slot: placed[id].slot }, to: { day: assign[id].day, slot: assign[id].slot } }));

  /* ---------- add-ons: short stops and the evening onsen ---------- */
  function chooseAddonDay(a, s, plan) {
    let best = -1, bestScore = Infinity;
    for (let d = 0; d < s.days; d++) {
      if (!addonDayOk(a, s, d)) continue;
      const items = plan[d] || [];
      let sc;
      if (a.slot === 'eve') {
        const effort = items.reduce((n, x) => n + x.ef, 0), hard = items.some(x => x.ef >= 4);
        sc = hard ? 0 : items.some(x => x.zone === a.zone) ? 1 : items.length ? 2 : 3;
        sc += d * 0.01 - Math.min(effort, 8) * 0.001;
      } else {
        const same = items.some(x => x.zone === a.zone);
        sc = same ? 0 : items.length ? 1 + Math.min(...items.map(x => zoneKm(x.zone, a.zone))) / 20 : 2.5;
        sc += d * 0.01;
      }
      if (sc < bestScore) { bestScore = sc; best = d; }
    }
    return best;
  }
  function dayItems(s, placements) {
    const plan = Array.from({ length: s.days }, () => []);
    Object.entries(placements).forEach(([id, p]) => { if (p.slot !== 'x' && plan[p.day] && D.byId[id]) plan[p.day].push(D.byId[id]); });
    return plan;
  }

  /* ---------- schedule: what the visitor sees ---------- */
  function schedule(s) {
    const placed = validPlacements(s), addons = validAddons(s), last = s.days - 1;
    const days = Array.from({ length: s.days }, (_, i) => ({
      i, am: null, pm: null, items: [], extras: [], zones: [],
      canAM: i > 0, canPM: i < last, edge: i === 0 ? 'arrival' : i === last ? 'departure' : null
    }));
    Object.entries(placed).forEach(([id, p]) => { days[p.day][p.slot] = D.byId[id]; });
    Object.entries(addons).forEach(([id, p]) => { days[p.day].extras.push(D.byId[id]); });
    days.forEach(d => {
      d.items = [d.am, d.pm].filter(Boolean);
      d.zones = [...new Set(d.items.map(a => a.zone))];
      d.km = d.zones.length === 2 ? Math.round(zoneKm(d.zones[0], d.zones[1])) : 0;
      d.long = d.items.some(isLong);
    });
    const overflow = [], reasons = {};
    [...s.sel].forEach(id => {
      const a = D.byId[id]; if (!a || placed[id] || addons[id]) return;
      overflow.push(a);
      const p = s.placements && s.placements[id];
      reasons[id] = availability(a, s) || (p && !isAddon(a) && slotWhy(a, s, p.day, p.slot)) || 'Not placed in a day yet';
    });
    return { days, overflow, reasons };
  }
  const dayIndex = p => Object.fromEntries(p.days.flatMap(d => [...d.items, ...d.extras].map(a => [a.id, d.i + 1])));
  const slotOf = (p, id) => { for (const d of p.days) { if (d.am && d.am.id === id) return { day: d.i, slot: 'am' }; if (d.pm && d.pm.id === id) return { day: d.i, slot: 'pm' }; if (d.extras.some(a => a.id === id)) return { day: d.i, slot: 'x' }; } return null; };

  /* ---------- explaining a failure ---------- */
  function explain(s, id) {
    const a = D.byId[id];
    if (!a) return { code: 'unknown', why: 'Unknown activity' };
    const off = availability(a, s);
    if (off) {
      return { code: a.closed ? 'closed' : 'camp', why: off };
    }
    if (isAddon(a)) return { code: 'days', why: 'No day in your trip suits this' };
    const c = candidates(a, s);
    if (!c.length) {
      const sample = SLOTS.map(sl => slotWhy(a, s, 1, sl)).filter(Boolean)[0] || 'None of your days suit this one';
      return { code: 'slots', why: sample };
    }
    return { code: 'full', why: 'Every block that suits this is taken' };
  }

  /* ---------- add ---------- */
  function addIn(s, id, o) {
    const a = D.byId[id];
    const placed = validPlacements(s), addons = validAddons(s);
    if (isAddon(a)) {
      const plan = dayItems(s, placed);
      const day = o.targetDay != null && addonDayOk(a, s, o.targetDay) ? o.targetDay : chooseAddonDay(a, s, plan);
      if (day < 0) return null;
      const placements = buildPlacements(s, placed, addons, {}, []);
      placements[id] = { day, slot: 'x', locked: o.targetDay === day && !!o.lock };
      return { ok: true, placements, placed: { day, slot: 'x' }, moved: [], extended: false, retargeted: o.targetDay != null && o.targetDay !== day, rearranged: false };
    }
    const tryRestrict = r => twoStage(s, [id], placed, {}, r);
    let res = null, retargeted = false;
    if (o.targetDay != null) {
      res = tryRestrict({ [id]: c => c.day === o.targetDay });
      if (!res) retargeted = true;
    }
    if (!res) res = tryRestrict(null);
    if (!res) return null;
    const assign = res.assign, placements = buildPlacements(s, placed, addons, assign, o.lock ? [id] : []);
    return { ok: true, placements, placed: { day: assign[id].day, slot: assign[id].slot }, moved: movedList(placed, assign, id), extended: false, retargeted, rearranged: res.rearranged };
  }
  function add(s, id, o) {
    o = o || {};
    const a = D.byId[id];
    if (!a) return { ok: false, code: 'unknown', why: 'Unknown activity', options: [] };
    const sel = new Set(s.sel); sel.add(id);
    const base = { ...s, sel, placements: { ...(s.placements || {}) } };
    delete base.placements[id];
    const off = availability(a, base);
    if (off) { const e = explain(base, id); return { ok: false, ...e, options: [] }; }
    let r = addIn(base, id, o);
    if (r) return { ...r, days: base.days, caution: caution(a, base, r.placed && r.placed.day) };
    if (s.flex !== false && base.days < RULES.maxDays) {
      const grown = { ...base, days: base.days + 1 };
      r = addIn(grown, id, o);
      if (r) return { ...r, days: grown.days, extended: true, caution: caution(a, grown, r.placed && r.placed.day) };
    }
    const e = explain(base, id), options = [];
    if (e.code === 'full') {
      if (base.days < RULES.maxDays) options.push({ type: 'extend' });
      Object.keys(validPlacements(base)).filter(x => x !== id).forEach(x => {
        if (options.length >= 4) return;
        const sel2 = new Set(base.sel); sel2.delete(x);
        const pl = { ...base.placements }; delete pl[x];
        if (addIn({ ...base, sel: sel2, placements: pl }, id, { lock: false })) options.push({ type: 'swap', id: x });
      });
    }
    return { ok: false, ...e, options };
  }
  const preview = add;

  /* ---------- place by hand (drag and drop, or "move to") ---------- */
  function place(s, id, day, slot) {
    const a = D.byId[id];
    if (!a || !s.sel.has(id)) return { ok: false, why: 'Choose an activity first' };
    if (isAddon(a)) return placeAddon(s, id, day);
    const why = (Number.isInteger(day) && availability(a, s, day)) || slotWhy(a, s, day, slot);
    if (why) return { ok: false, why };
    const placedAll = validPlacements(s), addons = validAddons(s);
    const src = placedAll[id], base = { ...placedAll }; delete base[id];
    const hereId = Object.keys(base).find(x => base[x].day === day && base[x].slot === slot);
    const mine = { day, slot, locked: true };
    if (!hereId) {
      const placements = buildPlacements(s, base, addons, {}, []); placements[id] = mine;
      return { ok: true, placements, placed: { day, slot }, moved: [], extended: false, days: s.days, rearranged: false };
    }
    const occ = D.byId[hereId], occP = base[hereId];
    if (src && !availability(occ, s, src.day) && !slotWhy(occ, s, src.day, src.slot)) {
      const placements = buildPlacements(s, base, addons, {}, []);
      placements[hereId] = { day: src.day, slot: src.slot, locked: occP.locked }; placements[id] = mine;
      return { ok: true, placements, placed: { day, slot }, moved: [{ id: hereId, from: { day, slot }, to: { day: src.day, slot: src.slot } }], swapped: hereId, extended: false, days: s.days, rearranged: false };
    }
    const attempt = st => {
      const rest = { ...base }; delete rest[hereId];
      const r = twoStage(st, [hereId], rest, { [id]: { day, slot } }, null);
      if (!r) return null;
      const assign = { ...r.assign, [id]: { day, slot } };
      const placements = buildPlacements(st, rest, addons, assign, [id]);
      placements[hereId] = { ...assign[hereId], locked: false };
      return { ok: true, placements, placed: { day, slot }, moved: movedList({ ...base }, assign, id), extended: false, days: st.days, rearranged: true };
    };
    let r = attempt(s);
    if (r) return r;
    if (s.flex !== false && s.days < RULES.maxDays) { r = attempt({ ...s, days: s.days + 1 }); if (r) return { ...r, extended: true }; }
    return { ok: false, why: `${occ.name} has nowhere else to go. Move it first, or remove it.` };
  }
  function placeAddon(s, id, day) {
    const a = D.byId[id];
    if (!addonDayOk(a, s, day)) return { ok: false, why: availability(a, s, day) || (a.slot === 'eve' ? 'An evening is not spent after you leave' : 'That day is outside your trip') };
    const placed = validPlacements(s), addons = validAddons(s);
    const placements = buildPlacements(s, placed, addons, {}, []);
    placements[id] = { day, slot: 'x', locked: true };
    return { ok: true, placements, placed: { day, slot: 'x' }, moved: [], extended: false, days: s.days, rearranged: false };
  }
  /* Move to a day without choosing the block: the engine picks the best one. */
  function move(s, id, day, slot) {
    if (slot) return place(s, id, day, slot);
    const a = D.byId[id];
    if (!a || !s.sel.has(id)) return { ok: false, why: 'Add this activity first' };
    if (day === -1 || day == null) {
      const placements = { ...(s.placements || {}) }; delete placements[id];
      return { ok: true, placements, placed: null, moved: [], days: s.days };
    }
    if (isAddon(a)) return placeAddon(s, id, day);
    const placedAll = validPlacements(s);
    const taken = new Set(Object.keys(placedAll).filter(x => x !== id && placedAll[x].day === day).map(x => placedAll[x].slot));
    let last = { ok: false, why: 'No block suits this day' };
    for (const sl of [...SLOTS.filter(x => !taken.has(x)), ...SLOTS.filter(x => taken.has(x))]) {
      const r = place(s, id, day, sl);
      if (r.ok) return r;
      last = r;
    }
    return last;
  }
  function swap(s, id, other) {
    const p = validPlacements(s), x = p[id], y = p[other];
    if (!x || !y) return { ok: false, why: 'Place both activities before swapping' };
    return place(s, id, y.day, y.slot);
  }

  /* ---------- arrange: fit everything chosen into the days (used for sample itineraries and setting changes) ---------- */
  function fit(s) {
    const placed = validPlacements(s), addons = validAddons(s);
    const ids = [...s.sel].filter(id => D.byId[id] && !isAddon(D.byId[id]));
    const locked = Object.fromEntries(Object.entries(placed).filter(([, p]) => p.locked));
    let pool = ids.filter(id => !locked[id]);
    const dropped = [];
    pool = pool.filter(id => { if (candidates(D.byId[id], s).length) return true; dropped.push(id); return false; });
    let r = null;
    while (pool.length) {
      r = solve(s, pool, locked, { prev: placed });
      if (r) break;
      dropped.push(pool.pop());
    }
    const assign = r ? r.assign : {};
    const placements = {};
    Object.entries(locked).forEach(([id, p]) => { placements[id] = { ...p }; });
    Object.entries(assign).forEach(([id, p]) => { placements[id] = { day: p.day, slot: p.slot, locked: false }; });
    // add-ons last: each goes with the day it suits best
    const plan = dayItems(s, placements);
    [...s.sel].map(id => D.byId[id]).filter(a => a && isAddon(a)).forEach(a => {
      const kept = addons[a.id];
      if (kept) { placements[a.id] = { ...kept }; return; }
      const day = chooseAddonDay(a, s, plan);
      if (day >= 0) placements[a.id] = { day, slot: 'x', locked: false }; else dropped.push(a.id);
    });
    return { placements, dropped };
  }
  const arrange = s => fit(s).placements;

  /* ---------- suggestions for an empty block ----------
     v11: curated, not alphabetical. Each candidate is scored on
       - the course the visitor picked (its own places lead),
       - the area: stay inside one area per day where the plan allows (the valley has very limited public transport,
         so fewer transfers = a cheaper, calmer charter day),
       - effort balance with the other half of the day, variety of theme across the whole trip, and lunch balance.
     suggestPlan() fills every open block in one pass so no activity is offered twice, and every pick carries a short reason. */
  const THEME = { water: 'on the water', walk: 'on foot', food: 'a taste of the valley', leaf: 'among the trees', culture: 'local culture', onsen: 'a soak', bike: 'on two wheels', sky: 'up high', craft: 'by hand' };
  function scoreFor(a, s, plan, day, slot, taken) {
    const d = plan.days[day], other = d[slot === 'am' ? 'pm' : 'am'];
    const course = D.courses[s.course], inCourse = !!(course && course.ids.includes(a.id));
    const chosen = D.activities.filter(x => s.sel.has(x.id));
    const have = new Set(chosen.map(x => x.cat)), dayCats = new Set(d.items.map(x => x.cat));
    const dayZones = [...new Set(d.items.map(x => x.zone))];
    let sc = 0, why = '', best = 0;
    const note = (w, text) => { if (w > best) { best = w; why = text; } };
    sc += { ours: 1.2, mates: 0.7, desk: 0 }[a.src] || 0;
    if (inCourse) { sc += 3; note(1.5, `Part of your ${course.name} course`); }
    // area: stay put if the day already has somewhere to be
    if (dayZones.length) {
      if (dayZones.includes(a.zone)) { sc += 3; note(2.6, `Same area as ${other ? other.name : d.items[0].name}, so no extra transfer`); }
      else { const km = Math.min(...dayZones.map(z => zoneKm(z, a.zone))); sc -= 1.5 + km / 10; }
    } else {
      // empty day: lean to the area the neighbouring days are already in, else the base
      const nb = [plan.days[day - 1], plan.days[day + 1]].filter(Boolean).flatMap(x => x.items.map(i => i.zone));
      if (nb.includes(a.zone)) { sc += 1; note(1, 'Close to the places on the next days'); }
    }
    // effort balance
    if (other) {
      if (other.ef >= 4 && a.ef <= 2) { sc += 2.4; note(2.2, `A gentler counterpart to ${other.name}`); }
      else if (other.ef <= 2 && a.ef >= 3 && a.ef <= 4) { sc += 1.6; note(1.4, `Adds some energy to a quiet ${slot === 'am' ? 'afternoon' : 'morning'}`); }
      else if (other.ef >= 4 && a.ef >= 4) sc -= 2.5;
      if (a.lunch && other.lunch) sc -= 2.5; else if (a.lunch && !other.lunch && slot === 'am') { sc += 0.8; note(0.9, 'Lunch is part of it'); }
      if (other.cat === a.cat) sc -= 1.2;
    }
    // variety across the trip
    if (!have.has(a.cat)) { sc += 1.4; note(1.2, `Adds ${THEME[a.cat] || a.cat} to your trip`); } else if (have.has(a.cat) && !dayCats.has(a.cat)) sc -= 0.3;
    if (a.id === 'winery' && day === s.days - 1) { sc += 1.5; note(2.4, 'A fitting last stop before the journey home'); }
    if ((day === 0 || day === s.days - 1) && a.ef <= 2) { sc += 0.8; if (!why) why = day === 0 ? 'Easy on an arrival day' : 'Easy before you travel'; }
    if (taken.has(a.id)) sc -= 99;
    if (!why) why = inCourse ? `Part of your ${course.name} course` : `Suits ${slot === 'am' ? 'a morning' : 'an afternoon'} here`;
    return { sc, why };
  }
  function suggestPlan(s, n) {
    n = n || 1;
    const plan = schedule(s), out = {}, taken = new Set();
    const pool = D.activities.filter(a => !s.sel.has(a.id) && !isAddon(a) && (a.src !== 'desk' || s.showExtras));
    // fill the days that already have something first, so suggestions follow what was chosen; then the empty days
    const blocks = [];
    plan.days.forEach(d => ['am', 'pm'].forEach(sl => { if (!d[sl] && (sl === 'am' ? d.canAM : d.canPM)) blocks.push({ d, sl, k: d.items.length ? 0 : 1 }); }));
    blocks.sort((x, y) => x.k - y.k || x.d.i - y.d.i || (x.sl === 'am' ? -1 : 1));
    blocks.forEach(({ d, sl }) => {
      const ranked = pool.filter(a => !availability(a) && !caution(a, s, d.i) && !slotWhy(a, s, d.i, sl) && !taken.has(a.id))
        .map(a => ({ a, ...scoreFor(a, s, plan, d.i, sl, taken) }))
        .sort((x, y) => y.sc - x.sc || x.a.name.localeCompare(y.a.name)).slice(0, n);
      out[d.i + ':' + sl] = ranked;
      ranked.forEach(r => taken.add(r.a.id));
    });
    return out;
  }
  function suggest(s, day, slot, n) { return ((suggestPlan(s, n || 1))[day + ':' + slot] || []); }

  function totals(s) {
    let yen = 0, tbc = 0, lunch = 0, ef = 0;
    s.sel.forEach(id => { const a = D.byId[id]; if (!a) return; if (a.price == null) tbc++; else yen += a.price; if (a.lunch) lunch++; ef = Math.max(ef, a.ef); });
    return { yen, tbc, lunch, ef };
  }
  const recommended = s => s.walk >= 5 ? 'active' : s.who === 'friends' ? 'discover' : 'restore';


  return { RULES, availability, caution, slotWhy, candidates, explain, totals, schedule, dayIndex, slotOf, recommended, add, preview, place, move, swap, fit, arrange, suggest, suggestPlan, zoneKm, dateAt, validDate, isLong, isAddon };
})();
