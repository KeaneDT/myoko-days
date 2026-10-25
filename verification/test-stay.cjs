global.window = global; require(__dirname + '/../js/assumptions.js'); require(__dirname + '/../js/stay.js');
const S = MD.stay; let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } };
const h27 = [...S.holidays(2027)].filter(x => x >= '2027-07-01' && x <= '2027-11-30').sort();
console.log('2027 hol', h27.join(' '));
ok(h27.includes('2027-07-19') && h27.includes('2027-08-11') && h27.includes('2027-09-20') && h27.includes('2027-09-23') && h27.includes('2027-10-11') && h27.includes('2027-11-03') && h27.includes('2027-11-23'), '2027 holidays');
const h26 = [...S.holidays(2026)].filter(x => x >= '2026-09-01' && x <= '2026-09-30');
console.log('2026 sep', h26.join(' ')); ok(h26.includes('2026-09-21') && h26.includes('2026-09-22') && h26.includes('2026-09-23'), 'Silver Week 2026');
// 2027-09-07 Tue
ok(S.dow('2027-09-07') === 2, 'Tue');
const r = (t, d) => S.nightRate(t, d).rate;
console.log('madarao Tue/Fri/Sat', r('madarao','2027-09-07'), r('madarao','2027-09-10'), r('madarao','2027-09-11'));
ok(r('madarao','2027-09-07') === 18000, 'madarao tue 18000');
ok(r('madarao','2027-09-10') === 20500, 'fri 18000*1.15=20700 -> 20500');
ok(r('madarao','2027-09-11') === 24500, 'sat 24300->24500');
ok(r('lime','2027-09-07') === 34000, 'lime tue');
ok(r('sixsenses','2027-09-11') === 138000, 'six sat 137750 -> 138000');
// long weekend: Sports Day weekend 2027: Sat 9, Sun 10, Mon 11 Oct. nights Fri 8, Sat 9, Sun 10
const lw = d => S.longWeekendNight(d);
console.log('LW oct', ['2027-10-07','2027-10-08','2027-10-09','2027-10-10','2027-10-11'].map(lw).join());
ok(!lw('2027-10-07') && lw('2027-10-08') && lw('2027-10-09') && lw('2027-10-10') && !lw('2027-10-11'), 'long weekend nights');
// 2027 Sep 20 Mon holiday: Sat18 Sun19 Mon20 -> nights Fri17, Sat18, Sun19
ok(lw('2027-09-17') && lw('2027-09-18') && lw('2027-09-19') && !lw('2027-09-20'), 'Sep 2027 weekend');
// Silver Week 2026: nights Fri 18..Tue 22
ok(lw('2026-09-18') && lw('2026-09-21') && lw('2026-09-22') && !lw('2026-09-23') && !lw('2026-09-17'), 'silver week 2026');
// Sunday night normal = 1, Sun in long weekend = 1.30
ok(r('madarao','2027-09-12') === 18000, 'normal sunday');
ok(r('madarao','2027-09-19') === 23500, 'holiday sunday 18000*1.3=23400->23500');
// Obon: Aug 13 2027 Fri: 18000*1.5*1.15 = 31050 -> 31000; Aug 14 Sat 18000*1.5*1.35=36450->36500
ok(r('madarao','2027-08-14') === 36500, 'obon sat');
ok(r('madarao','2027-08-10') === 21500, 'aug tue 21600 -> 21500');

// quote: couple, 4 days from Tue 7 Sep 2027 -> 3 nights, 1 room
const q = S.quote({ stay: 'madarao', who: 'couple', days: 4, date: '2027-09-07' });
ok(q.nights.length === 3 && q.rooms === 1 && q.total === 54000 && q.perPerson === 27000, 'quote madarao couple ' + JSON.stringify([q.total, q.perPerson]));
const q2 = S.quote({ stay: 'lime', who: 'friends', days: 3, date: '2027-09-10' });   // Fri Sat nights, 2 rooms
ok(q2.rooms === 2 && q2.nights.length === 2 && q2.total === (39000 + 46000) * 2 && q2.perPerson === 42500, 'quote lime friends ' + JSON.stringify([q2.total, q2.perPerson]));
const q3 = S.quote({ stay: 'own', who: 'couple', days: 4, date: '2027-09-07' }); ok(!q3.stay && q3.total === 0 && q3.nights.length === 0, 'own stay is zero');
const q4 = S.quote({ stay: 'madarao', who: 'solo', days: 3, date: '2027-09-07' }); ok(q4.rooms === 1 && q4.perPerson === q4.total, 'solo');
const h = S.shiftHint({ stay: 'madarao', who: 'couple', days: 3, date: '2027-09-10' }, d => true);   // Fri-Sat; shifting earlier saves
ok(h && h.shift === -1 && h.save > 0, 'shift hint ' + JSON.stringify(h));
ok(S.shiftHint({ stay: 'madarao', who: 'couple', days: 3, date: '2027-09-07' }, d => true) === null || S.shiftHint({ stay: 'madarao', who: 'couple', days: 3, date: '2027-09-07' }, d => true).save > 0, 'tue hint sane');
ok(S.shiftHint({ stay: 'own', who: 'couple', days: 4, date: '2027-09-07' }) === null, 'no hint for own');
// all tiers: monotone
for (const d of ['2027-07-06', '2027-08-13', '2027-09-11', '2027-10-16']) ok(r('madarao', d) < r('lime', d) && r('lime', d) < r('sixsenses', d), 'tier order ' + d);
console.log(fail ? fail + ' FAILED' : 'stay: all passed'); process.exit(fail ? 1 : 0);
