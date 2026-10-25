const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const c={console,Set,Map,Date,Intl,JSON,Math};c.window=c;vm.createContext(c);
for(const file of ['assumptions','stay','data','planner'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/'+file+'.js'),'utf8'),c);
const P=c.MD.planner,D=c.MD.data,stay=c.MD.stay;
const state=(ids=[],placements={})=>({sel:new Set(ids),placements,walk:5,days:3,date:'2027-09-07',month:9,flex:true,stay:'madarao',who:'couple'});
const a=state(['soba'],{soba:{day:1,slot:'am',locked:false}}),before=JSON.stringify(a.placements);
assert.equal(P.direct(a,'ebike',{day:1,slot:'am'}).ok,false);
assert.equal(JSON.stringify(a.placements),before,'conflict leaves the original plan untouched');
const free=P.direct(a,'sup',{day:1,slot:'pm'});assert.equal(free.ok,true);assert.equal(free.placements.soba.day,1);assert.equal(free.placements.soba.slot,'am');assert.equal(free.days,3);
const full=state(['imori','daruma','soba','sup'],{imori:{day:0,slot:'pm'},daruma:{day:2,slot:'am'},soba:{day:1,slot:'am'},sup:{day:1,slot:'pm'}});
assert.equal(P.direct(full,'cruise',null).ok,false,'normal addition cannot grow or rearrange a full trip');
assert.equal(P.add(full,'cruise',{}).ok,true,'Best Day sorting retains its explicit automatic path');
const hike=P.direct(state(),'mtmyoko',{day:1,slot:'am'});assert.equal(hike.ok,true);
const hiking=state(['mtmyoko'],hike.placements),day=P.schedule(hiking).days[1];
assert.equal(day.am.id,'mtmyoko');assert.equal(day.pm.id,'mtmyoko');assert.equal(day.items.length,1);
assert.equal(P.direct(hiking,'sup',{day:1,slot:'pm'}).ok,false,'afternoon cannot overlap a full-day hike');
assert.equal(P.direct(a,'mtmyoko',{day:1,slot:'am'}).ok,false,'full-day hike cannot swallow an existing half-day');
assert.equal(P.direct(state(),'mtmyoko',{day:2,slot:'am'}).ok,false,'a full-day hike cannot occupy departure day');
for(const hotel of ['madarao','lime','sixsenses']){
 const thu=stay.nightRate(hotel,'2027-09-09'),fri=stay.nightRate(hotel,'2027-09-10'),sat=stay.nightRate(hotel,'2027-09-11');
 assert.ok(thu.rate<fri.rate&&fri.rate<sat.rate,'calendar weekend ladder agrees with quote');
 const q=stay.quote({...state(),stay:hotel,date:'2027-09-09',days:4});assert.equal(q.perRoom,thu.rate+fri.rate+sat.rate);
 assert.ok(stay.nightRate(hotel,'2027-08-14').rate>stay.nightRate(hotel,'2027-07-14').rate,'peak nights cost more');
}
let seed=58;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296),ids=D.activities.filter(x=>x.src!=='desk').map(x=>x.id);
for(let trial=0;trial<250;trial++){
 let s=state();s.days=3+Math.floor(random()*5);
 for(let i=0;i<15;i++){
  const id=ids[Math.floor(random()*ids.length)];if(s.sel.has(id))continue;
  const snapshot=JSON.stringify(s.placements),r=P.direct(s,id,null);assert.equal(JSON.stringify(s.placements),snapshot);
  if(!r.ok)continue;
  for(const key of s.sel){assert.equal(r.placements[key].day,s.placements[key].day);assert.equal(r.placements[key].slot,s.placements[key].slot);}
  s={...s,sel:new Set([...s.sel,id]),placements:r.placements};
  for(const d of P.schedule(s).days)if(d.am&&P.isLong(d.am)){assert.equal(d.pm,d.am);assert.equal(d.items.length,1);}
 }
}
console.log('PASS explicit placement, immutable conflict handling, Best Day sorting, full-day reservation, rate consistency and 250 random manual itineraries.');
