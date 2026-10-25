/* Myoko Days — the stay: three PCG properties and the choice to stay elsewhere.
   Pure functions, no randomness and no DOM. A night is priced by the date you arrive:
     rate = base × season × max(day-of-week, long-weekend), rounded to the nearest ¥500.
   Every number comes from MD.assume (see ASSUMPTIONS.md). Dates are plain "YYYY-MM-DD" strings; arithmetic is done in UTC so a
   visitor's time zone can never move a night. */
window.MD = window.MD || {};

MD.stay = (function () {
  "use strict";
  const A = MD.assume.v;
  const DAY = 86400000;

  /* ---------- the four choices ---------- */
  const OPTIONS = {
    madarao: { key: "madarao", name: "Madarao Kogen Hotel", line: "Mountain comfort", tier: 1, pcg: true, zone: "MD",
      blurb: "An MGallery hotel at Madarao Kogen, beside the forest and the zip line.", place: "Madarao Kogen, Iiyama" },
    lime: { key: "lime", name: "Lime Resort Myoko", line: "Wellness resort", tier: 2, pcg: true, zone: "MK",
      blurb: "A 38-room MGallery resort at the foot of Mt Myoko, with onsen, restaurants and a lounge bar.", place: "Sekigawa, Myoko Kogen" },
    sixsenses: { key: "sixsenses", name: "Six Senses Myoko", line: "Luxury retreat", tier: 3, pcg: true, zone: "MK",
      blurb: "Private-onsen suites, a spa and Kengo Kuma design, set in the Suginohara resort.", place: "Suginohara, Myoko Kogen" },
    own: { key: "own", name: "Somewhere else", line: "Activities only", tier: 0, pcg: false, zone: "MK",
      blurb: "Stay wherever suits you. Your days start from Myoko-Kogen Station.", place: "Myoko-Kogen Station" }
  };
  const ORDER = ["madarao", "lime", "sixsenses", "own"];
  const isStay = k => !!(OPTIONS[k] && OPTIONS[k].pcg);

  /* ---------- date helpers ---------- */
  const parse = s => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s)); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : NaN; };
  const iso = t => { const d = new Date(t); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`; };
  const addDays = (s, n) => iso(parse(s) + n * DAY);
  const dow = s => new Date(parse(s)).getUTCDay();                       // 0 Sunday … 6 Saturday
  const nthMonday = (y, m, n) => { const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(); return 1 + ((8 - first) % 7) + (n - 1) * 7; };
  const key = (m, d) => m * 100 + d;

  /* ---------- Japanese public holidays, by rule (2000–2099) ---------- */
  const cache = {};
  function holidays(y) {
    if (cache[y]) return cache[y];
    const k = y - 1980, vernal = Math.floor(20.8431 + 0.242194 * k - Math.floor(k / 4)), autumn = Math.floor(23.2488 + 0.242194 * k - Math.floor(k / 4));
    const list = [[1, 1], [1, nthMonday(y, 1, 2)], [2, 11], [2, 23], [3, vernal], [4, 29], [5, 3], [5, 4], [5, 5], [7, nthMonday(y, 7, 3)], [8, 11], [9, nthMonday(y, 9, 3)], [9, autumn], [10, nthMonday(y, 10, 2)], [11, 3], [11, 23]];
    const set = new Set(list.map(([m, d]) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`));
    [...set].forEach(s => { if (dow(s) === 0) { let t = addDays(s, 1); while (set.has(t)) t = addDays(t, 1); set.add(t); } });   // a holiday on Sunday moves to the next free day
    for (let m = 1; m <= 12; m++) for (let d = 1; d <= 31; d++) {                                                                   // a day between two holidays is a holiday too
      const s = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`; if (isNaN(parse(s)) || new Date(parse(s)).getUTCMonth() !== m - 1) continue;
      if (!set.has(s) && dow(s) !== 0 && set.has(addDays(s, -1)) && set.has(addDays(s, 1))) set.add(s);
    }
    return (cache[y] = set);
  }
  const hol = s => holidays(+s.slice(0, 4)).has(s);
  const isOff = s => dow(s) === 0 || dow(s) === 6 || hol(s);

  /* A night belongs to the day you arrive. It is a "long-weekend" night when the morning after falls inside a run of three or more
     days off that includes a public holiday: Silver Week, or a Saturday-to-Monday holiday weekend. */
  function longWeekendNight(s) {
    const nxt = addDays(s, 1); if (!isOff(nxt)) return false;
    let a = nxt, b = nxt; while (isOff(addDays(a, -1))) a = addDays(a, -1); while (isOff(addDays(b, 1))) b = addDays(b, 1);
    const len = (parse(b) - parse(a)) / DAY + 1; if (len < 3) return false;
    for (let t = a; parse(t) <= parse(b); t = addDays(t, 1)) if (hol(t)) return true;
    return false;
  }

  /* ---------- the rate ---------- */
  function seasonFor(s) {
    const m = +s.slice(5, 7), d = +s.slice(8, 10), f = A.seasonF, k = key(m, d);
    const within = r => k >= key(r[0][0], r[0][1]) && k <= key(r[1][0], r[1][1]);
    if (m === 7) return { f: f.jul, tag: "" };
    if (m === 8) return within(A.obonNights) ? { f: f.obon, tag: "Obon" } : { f: f.aug, tag: "" };
    if (m === 9) return { f: f.sep, tag: "" };
    if (m === 10) return within(A.foliageNights) ? { f: f.octPeak, tag: "Autumn colour" } : { f: f.octEarly, tag: "" };
    return { f: 1, tag: "" };
  }
  function nightRate(stay, s) {
    if (!isStay(stay) || isNaN(parse(s))) return null;
    const season = seasonFor(s), tbl = stay === "sixsenses" ? A.dowF.top : A.dowF.std, d = dow(s);
    const lw = longWeekendNight(s), peakF = Math.max(tbl[d], lw ? A.longWeekendF : 1);
    const rate = Math.round(A.stayRate[stay] * season.f * peakF / A.roundTo) * A.roundTo;
    const tags = [];
    if (season.tag) tags.push(season.tag);
    if (lw) tags.push("Holiday weekend"); else if (d === 6) tags.push("Weekend"); else if (d === 5) tags.push("Weekend");
    return { date: s, rate, tags, weekday: d, long: lw };
  }

  /* ---------- a quote for the trip ---------- */
  const partyOf = who => A.party[who] || 2;
  const roomsFor = party => Math.max(1, Math.ceil(party / A.perRoom));
  /* nights = days - 1 ; the first night is the first day's date */
  function quote(S) {
    const o = OPTIONS[S.stay] || OPTIONS.own, party = partyOf(S.who), rooms = roomsFor(party), n = Math.max(0, S.days - 1);
    if (!o.pcg || isNaN(parse(S.date))) return { option: o, stay: false, party, rooms, nights: [], perRoom: 0, total: 0, perPerson: 0, avgRoom: 0 };
    const nights = []; for (let i = 0; i < n; i++) nights.push(nightRate(o.key, addDays(S.date, i)));
    const perRoom = nights.reduce((a, x) => a + x.rate, 0), total = perRoom * rooms;
    return { option: o, stay: true, party, rooms, nights, perRoom, total, perPerson: Math.round(total / party), avgRoom: n ? Math.round(perRoom / n / A.roundTo) * A.roundTo : 0 };
  }
  /* would starting a day earlier or later cost less? Returns the cheapest of the two shifts, or null. */
  function shiftHint(S, allowed) {
    const base = quote(S); if (!base.stay) return null;
    let best = null;
    [-1, 1].forEach(sh => {
      const date = addDays(S.date, sh); if (allowed && !allowed(date)) return;
      const q = quote({ ...S, date }), save = base.total - q.total;
      if (save > 0 && (!best || save > best.save)) best = { shift: sh, date, save, perPerson: Math.round(save / base.party) };
    });
    return best && best.perPerson >= 1000 ? best : null;
  }

  return { OPTIONS, ORDER, isStay, nightRate, quote, shiftHint, holidays, isHoliday: hol, longWeekendNight, partyOf, roomsFor, addDays, dow, parse, iso };
})();
