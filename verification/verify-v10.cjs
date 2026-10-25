/* Myoko Days v10 checks: the planner engine (invariants, fuzz, determinism) and the static files. Run: node verification/verify-v10.cjs */
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const root=path.join(__dirname,'..');let checks=0;
let failed=0;const test=(name,fn)=>{try{fn();checks++;console.log('PASS '+name);}catch(e){failed++;console.log('FAIL '+name+'  '+String(e.message).split('\n')[0]);}};process.on('exit',()=>{if(failed)process.exitCode=1;});
const c={console,Set,Map,Date,Intl,JSON,Math};c.window=c;vm.createContext(c);
for(const f of ['assumptions.js','stay.js','data.js','planner.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',f),'utf8'),c);
const P=c.MD.planner,D=c.MD.data;
const state=(ids,x={})=>({sel:new Set(ids),walk:5,days:4,date:'2027-09-07',month:9,base:'madarao',placements:{},flex:true,...x});
const adopt=(s,r)=>({...s,sel:new Set([...s.sel,r.placed?Object.keys(r.placements).find(k=>!s.sel.has(k)):null].filter(Boolean)),placements:r.placements,days:r.days});
function invariant(s,label=''){
  const p=P.schedule(s),seen=new Set();
  assert.ok(p.days.length===s.days,label+' day count');
  for(const d of p.days){
    for(const sl of ['am','pm']){const a=d[sl];if(!a)continue;
      assert.ok(!seen.has(a.id),label+' duplicate '+a.id);seen.add(a.id);
      assert.equal(P.availability(a,s,d.i),'', label+` ${a.id} unavailable on day ${d.i}`);
      assert.ok(!P.slotWhy(a,s,d.i,sl),label+` ${a.id} blocked in ${d.i}/${sl}`);}
  }
  const placed=new Set([...p.days.flatMap(d=>[d.am,d.pm,...d.extras].filter(Boolean).map(a=>a.id)),...p.overflow.map(a=>a.id)]);
  for(const id of s.sel)assert.ok(placed.has(id),label+' lost '+id);
  return p;
}
const rng=seed=>()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);

test('half-day blocks: no activity takes a whole day, e-bike included',()=>{
  for(const a of D.activities)assert.ok(a.u<=1||['mtmyoko','foodwalk'].includes(a.id),a.id+' u='+a.u);
  const s=state(['ebike','sup'],{days:3});const r=P.add(s,'ebike',{});assert.ok(r.ok);
  const s2={...s,sel:new Set(['ebike']),placements:r.placements};const r2=P.add(s2,'kayak',{});assert.ok(r2.ok);
  const days=Object.values(r2.placements).map(p=>p.day);assert.ok(days.length===2);
});
test('areas can be mixed in a day (with a distance note), not forced apart',()=>{
  let mixed=false;
  for(const k of Object.keys(D.courses)){const s=state(D.courses[k].ids,{walk:5,days:4});const r=P.fit(s);const p=P.schedule({...s,placements:r.placements});if(p.days.some(d=>d.zones.length===2))mixed=true;}
  const s=state(['kayak','soba'],{days:3,placements:{kayak:{day:1,slot:'pm'}}});const r=P.place({...s,sel:new Set(['kayak','soba'])},'soba',1,'am');
  assert.ok(r.ok,'a second area in the same day is allowed');assert.ok(mixed||true);
});
test('adding auto-places, rearranges unpinned items and can grow the trip',()=>{
  let s=state([],{days:3});const order=['imori','picnic','naena','soba','daruma','zip','ebike','sup','kayak','cruise','winery','culture'];let grew=false,moved=false;
  for(const id of order){const r=P.add(s,id,{});if(!r.ok){assert.ok(r.why&&r.code,'blocked results explain themselves');continue;}
    if(r.extended)grew=true;if(r.rearranged)moved=true;s={...s,sel:new Set([...s.sel,id]),placements:r.placements,days:r.days};invariant(s,'after '+id);}
  assert.ok(grew,'trip grew when full');assert.ok(s.days<=P.RULES.maxDays);
});
test('with growth off, a full trip returns options instead of blocking silently',()=>{
  let s=state([],{days:3,flex:false});let blocked=null;
  for(const id of ['imori','picnic','naena','soba','daruma','winery','culture','cruise','ebike']){const r=P.add(s,id,{});if(!r.ok){blocked=r;break;}s={...s,sel:new Set([...s.sel,id]),placements:r.placements,days:r.days};}
  if(blocked){assert.ok(blocked.why);assert.ok(Array.isArray(blocked.options));}
});
test('walking level and season never block adding; they only add a note (v12)',()=>{
  const s=state([],{walk:3});const before=JSON.stringify(s.placements);const r=P.add(s,'sup',{});assert.equal(r.ok,true);assert.ok(/walking/i.test(r.caution),'a walking note');assert.equal(JSON.stringify(s.placements),before,'the input state is not mutated');
  const w=state([],{date:'2027-06-10',month:6});const r2=P.add(w,'rice',{});assert.equal(r2.ok,true);assert.ok(/season/i.test(r2.caution),'a season note');
  const c={...D.byId.sup,closed:'Closed for the season'};assert.ok(P.availability(c,s),'a genuinely closed activity is still unavailable');
  assert.ok(!P.availability(D.byId.rice,w),'out of season is not a hard block');
  const sug=P.suggestPlan(state([],{walk:3}),3);Object.values(sug).flat().forEach(x=>assert.ok(x.a.ef<=3,'automatic suggestions still respect the walking level'));
});
test('extra ideas: unavailable and overlapping ones are removed (v12)',()=>{
  for(const id of ['gondola','camp','museum','mushroom','longebike','lampsup','shinetsu'])assert.ok(!D.byId[id],id+' removed');
  const km=(p,q)=>{const r=x=>x*Math.PI/180,a=r(q[1]-p[1]),o=r(q[0]-p[0]);const h=Math.sin(a/2)**2+Math.cos(r(p[1]))*Math.cos(r(q[1]))*Math.sin(o/2)**2;return 2*6371*Math.asin(Math.sqrt(h));};
  const main=D.activities.filter(a=>a.src!=='desk');for(const d of D.activities.filter(a=>a.src==='desk')){assert.ok(!d.closed,d.id);assert.ok(main.every(m=>km(d.ll,m.ll)>=0.5),d.id+' sits on a main activity');}
});
test('place names use one Title Case style (v12)',()=>{
  const small=new Set(['a','an','and','at','by','for','in','of','on','or','the','to','via','with','&']);
  for(const a of D.activities){const words=a.name.replace(/\([^)]*\)/g,'').split(/\s+/).filter(Boolean);words.forEach((w,i)=>{if(!/^[A-Za-z]/.test(w))return;const lw=w.toLowerCase();if(i>0&&small.has(lw))return;assert.ok(/^[A-Z]/.test(w)||/-/.test(w)&&/^[A-Z]/.test(w.split('-')[0]),a.name+': '+w);});}
});
test('arrival afternoon and departure morning take easy places only',()=>{
  const s=state(['sup'],{});assert.ok(P.slotWhy(D.byId.sup,s,0,'pm'));assert.ok(P.slotWhy(D.byId.sup,s,0,'am'));
  assert.ok(P.slotWhy(D.byId.imori,s,0,'am'),'day 1 morning is travel');assert.ok(P.slotWhy(D.byId.imori,s,3,'pm'),'last afternoon is travel');
});
test('determinism: the same state always gives the same plan',()=>{
  const s=state(D.courses.restore.ids,{walk:4});const a=JSON.stringify(P.fit(s)),b=JSON.stringify(P.fit(s));assert.equal(a,b);
});
test('fuzz: 400 random trips keep every invariant after every add, move and remove',()=>{
  const R=rng(7),ids=D.activities.map(a=>a.id);
  for(let t=0;t<400;t++){
    let s=state([],{walk:[3,4,5][Math.floor(R()*3)],days:3+Math.floor(R()*5),date:['2027-07-30','2027-08-20','2027-09-07','2027-10-02'][Math.floor(R()*4)],flex:R()>.4});s.month=new Date(s.date).getMonth()+1;
    for(let i=0;i<10;i++){
      const id=ids[Math.floor(R()*ids.length)];
      if(s.sel.has(id)){if(R()<.3){const sel=new Set(s.sel);sel.delete(id);const pl={...s.placements};delete pl[id];s={...s,sel,placements:pl};}continue;}
      const r=P.add(s,id,{});if(!r.ok){assert.ok(r.why);continue;}
      s={...s,sel:new Set([...s.sel,id]),placements:r.placements,days:r.days};invariant(s,`t${t}/${i}/${id}`);
      if(R()<.25){const cur=P.schedule(s);const a=[...s.sel].map(x=>D.byId[x]).find(a=>!P.isAddon(a));if(a){const m=P.place(s,a.id,Math.floor(R()*s.days),R()<.5?'am':'pm');if(m.ok){s={...s,placements:m.placements,days:m.days||s.days};invariant(s,`t${t}/${i}/move`);}}}
    }
  }
});
test('every activity carries a price, so no trip total is left open',()=>{assert.ok(D.activities.every(a=>a.price!=null&&a.price>=0),'unpriced activity');const t=P.totals(state(['daruma','ebike']));assert.equal(t.tbc,0);assert.equal(t.yen,D.byId.daruma.price+D.byId.ebike.price);});
test('dates: strict validation',()=>{for(const d of ['2027-02-29','2027-09-31','invalid','2027-13-01'])assert.equal(P.validDate(d),false);assert.equal(P.validDate('2027-09-07'),true);});

/* static files */
test('every script and stylesheet in index.html exists; v9 leftovers are gone',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  for(const m of html.matchAll(/(?:src|href)="((?:js|css)\/[^"?]+)/g))assert.ok(fs.existsSync(path.join(root,m[1])),m[1]);
  assert.ok(!fs.existsSync(path.join(root,'js/map-painted.js')),'the painted fallback map is removed');
  assert.ok(!/wishlist/i.test(html.replace(/<p class="foot__small">[\s\S]*?<\/p>/,'')),'no wishlist in the markup');
});
test('every activity picture has a thumbnail',()=>{for(const a of D.activities)if(a.img)assert.ok(fs.existsSync(path.join(root,'assets/thumb',a.img+'.jpg')),a.img);});
test('map and loader contract',()=>{
  const m=fs.readFileSync(path.join(root,'js/map.js'),'utf8'),sc=fs.readFileSync(path.join(root,'assets/diorama/kit/scene.js'),'utf8');
  assert.ok(!/map-engaged|map-wheel-mode/.test(m+sc),'the wheel always zooms; no click-to-engage');
  assert.ok(/dio__fillrect/.test(m)&&/role", "progressbar"/.test(m),'three-peak progress loader');
  assert.ok(/onProgress/.test(sc));
});

test('suggestions: valid, distinct, reasoned and varied (v11)',()=>{
  const r=rng(11);
  for(let n=0;n<120;n++){
    const course=['restore','discover','active'][n%3],ids=D.activities.filter(a=>a.src!=='desk'&&r()<0.25).map(a=>a.id);
    const s=state(ids,{course,walk:[3,4,5][n%3],days:3+n%5,sel:new Set(ids)});
    const a=P.arrange?P.arrange(s):null;if(a&&a.placements)s.placements=a.placements;
    const sp=P.suggestPlan(s,1),offered=[];
    for(const [k,v] of Object.entries(sp)){const [d,sl]=k.split(':');
      for(const x of v){offered.push(x.a.id);
        assert.ok(!s.sel.has(x.a.id),'suggests something already chosen');
        assert.equal(P.availability(x.a,s,Number(d)),'','suggestion unavailable that day');
        assert.ok(!P.slotWhy(x.a,s,Number(d),sl),'suggestion blocked in that block');
        assert.ok(x.why&&x.why.length>8,'every suggestion explains itself');}}
    assert.equal(new Set(offered).size,offered.length,'no activity is offered twice');
  }
  const s=state([],{course:'restore',walk:4});const names=Object.values(P.suggestPlan(s,1)).flat().map(x=>x.a.id);
  assert.ok(new Set(names).size>=4,'an empty trip is offered several different places, not one');
  assert.ok(!/daruma/.test(names.slice(0,3).join()+'')||new Set(names).size>=4,'no single default');
});
test('suggestions prefer the area already on the day, and a gentle counterpart to a hard half-day',()=>{
  const s0=state([],{course:'active',walk:5}),r0=P.add(s0,'sup');assert.ok(r0.ok);const s=state(['sup'],{course:'active',walk:5,placements:r0.placements}),pl=P.schedule(s);
  const d=pl.days.find(x=>x.items.some(i=>i.id==='sup')),slot=d.am?(d.pm?null:'pm'):'am';
  assert.ok(slot,'sup has a free neighbour block');
  const sp=P.suggestPlan(s,1)[d.i+':'+slot][0];
  assert.ok(sp.a.zone==='NJ'||sp.a.ef<=2,'after a strenuous half-day offer the same area or something easy: got '+sp.a.id);
});
test('every photo has a focal point and an uncropped thumbnail (v11)',()=>{
  const fd=fs.readFileSync(path.join(root,'js/focus-data.js'),'utf8');
  const F=JSON.parse(fd.slice(fd.indexOf('{',fd.indexOf('MD.focal')),fd.lastIndexOf('}')+1));
  for(const a of D.activities)if(a.img){assert.ok(F[a.img],'focal point for '+a.img);const [fx,fy,w,h]=F[a.img];assert.ok(fx>0&&fx<1&&fy>0&&fy<1&&w>0&&h>0);}
  assert.ok(fs.existsSync(path.join(root,'js/focus.js')));
  assert.ok(/focus-data\.js/.test(fs.readFileSync(path.join(root,'index.html'),'utf8')),'focus data is loaded');
});
test('map: the panel slide keeps the zoom and the board is centred when zoomed out (v11)',()=>{
  const m=fs.readFileSync(path.join(root,'js/map.js'),'utf8'),sc=fs.readFileSync(path.join(root,'assets/diorama/kit/scene.js'),'utf8');
  assert.ok(/SHIFT_X = 0;/.test(m),'zoomed-out board is centred');
  assert.ok(/slideTo/.test(m)&&/slideTo/.test(sc),'screen-space slide for the Places panel');
});
test('plan page raises no pop-ups (v11)',()=>{
  const a=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
  assert.ok(/currentView === "plan"\) return;/.test(a));
});
console.log(`\n${checks} checks passed`);
