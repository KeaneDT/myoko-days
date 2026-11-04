const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),c={console,Set,Map,Date,Intl,JSON,Math,Number};c.window=c;vm.createContext(c);
for(const name of ['assumptions','stay','data','planner','setup','costs'])vm.runInContext(fs.readFileSync(path.join(root,'js',name+'.js'),'utf8'),c);
const {planner:P,costs:C,data:D,stay:T,setup}=c.MD;
const state={date:'2027-09-07',days:4,walk:4,party:2,rooms:1,stay:'madarao',sel:new Set(['imori','picnic','naena','forest','cruise','winery']),placements:{}};
state.placements=P.fit(state).placements;
const plan=P.schedule(state),q=C.quote(state,plan);
assert.equal(q.vanDays,4);assert.equal(q.vanGroup,120000);assert.equal(q.van,60000);assert.equal(q.rail,18380);
assert.equal(q.total,q.activities+q.stay+q.van);
assert.equal(q.activities,15300);assert.equal(q.stay,27000);assert.equal(q.total,102300);assert.equal(q.groupTotal,204600);
assert.equal(C.quote({...state,stay:"own",sel:new Set(),placements:{}}).total,0,"An empty activities-only itinerary does not charge rail");
// Occupancy drives a flat daily group charge, independent of activity ticket price.
const base={...state,sel:new Set(['imori']),placements:{imori:{day:1,slot:'am',locked:true}}};
const same={...base,sel:new Set(['imori','daruma']),placements:{...base.placements,daruma:{day:1,slot:'pm',locked:true}}};
const another={...same,placements:{...same.placements,daruma:{day:2,slot:'pm',locked:true}}};
assert.equal(C.quote(base).vanGroup,30000);assert.equal(C.quote(same).vanGroup,30000);assert.equal(C.quote(another).vanGroup,60000);
for(let party=1;party<=9;party++){
 const s={...state,party,rooms:Math.ceil(party/2)},cost=C.quote(s);
 assert.equal(cost.van,Math.round(120000/party));assert.equal(cost.stay,T.quote(s).perPerson);
 assert.equal(C.quote({...s,stay:'own'}).total,cost.total-cost.stay);
}
const five={...state,days:5};assert.equal(C.quote(five).total-q.total,T.quote(five).perPerson-T.quote(state).perPerson);
assert.ok(setup.range('2027-10-29','2027-11-01','2026-11-03').error);
for(const activity of D.activities){assert.ok(['Gentle','Moderate','Active'].includes(D.effort[activity.ef]));}
assert.equal(D.effort[D.byId.tsubame.ef],'Moderate');
assert.equal(D.effort[D.byId.winery.ef],'Gentle');
for(const s of [{...base,walk:3},{...base,date:'2027-08-30',days:7,walk:5}]){
 for(const [key,items]of Object.entries(P.suggestPlan(s,3))){const day=Number(key.split(':')[0]);for(const {a}of items)assert.equal(P.caution(a,s,day),'');}
}
// Film composition includes evening/short-stop extras and counts a full-day activity once.
const source=fs.readFileSync(path.join(root,'js/media.js'),'utf8');
const film={library:{imori:{videos:[{src:'pond.mp4'}]},onsen:{videos:[{src:'bath.mp4'}]}},Set};vm.createContext(film);
vm.runInContext(source.slice(source.indexOf('  function compose(days)'),source.indexOf('  let dispose')),film);
const composed=film.compose([{i:0,items:[{id:'imori',name:'Pond'},{id:'imori',name:'Pond'}],extras:[{id:'onsen',name:'Onsen'},{id:'rice',name:'Rice'}]}]);
assert.equal(composed.clips.length,2);assert.equal(composed.missing.length,1);
console.log('PASS shared trip estimate, separate rail allowance, flat van-day costs, group/room splits, extension delta, preference/season suggestions and film extras.');
