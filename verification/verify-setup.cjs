const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const c={console,Set,Map,Date,Intl,JSON,Math,Number};c.window=c;vm.createContext(c);
for(const f of ['assumptions','stay','data','planner','setup'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/'+f+'.js'),'utf8'),c);
const {stay,setup}=c.MD;
const state={stay:'lime',party:5,rooms:4,who:'couple',date:'2027-09-07',days:5};
const q=stay.quote(state);assert.equal(q.party,5);assert.equal(q.rooms,4);assert.equal(q.total,q.perRoom*4);assert.equal(q.perPerson,Math.round(q.total/5));assert.equal(stay.quote({...state,rooms:1}).rooms,3);assert.equal(stay.quote({...state,rooms:99}).rooms,5);
assert.equal(stay.quote({stay:'madarao',who:'friends',date:state.date,days:3}).party,4,'legacy state still migrates');
assert.ok(!stay.ORDER.includes('undecided'));
for(const k of ['own']){const x=stay.quote({...state,stay:k});assert.equal(x.total,0);assert.equal(x.stay,false);assert.equal(x.party,5);assert.equal(x.rooms,4);}
assert.equal(setup.range('2027-09-07','2027-09-11','2026-10-26').days,5);
for(const [a,b]of [['2027-09-07','2027-09-08'],['2027-09-07','2027-09-14'],['2027-10-30','2027-11-02'],['2027-02-30','2027-03-04'],['2026-07-01','2026-07-04'],['2029-07-01','2029-07-04']])assert.ok(setup.range(a,b,'2026-10-26').error,a+' invalid');
assert.equal(setup.range('2027-10-29','2027-10-31','2026-10-26').nights,2);assert.equal(setup.rooms(4,2),2);assert.equal(setup.party(0),2);
async function fxCase(fail){
const storage=new Map(),events=[];const ctx={console,Intl,Number,Math,JSON,Date,AbortController,setTimeout,clearTimeout,Event,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},dispatchEvent:e=>events.push(e.type),fetch:async()=>{if(fail)throw Error('offline');return{ok:true,json:async()=>['SGD','USD','EUR','GBP','AUD','HKD'].map(quote=>({quote,date:'2026-10-23',rate:quote==='USD'?.01:.02}))}}};ctx.window=ctx;ctx.MD={data:{yenPerSgd:120}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/currency.js'),'utf8'),ctx);ctx.MD.currency.select('USD');await new Promise(r=>setImmediate(r));assert.match(ctx.MD.currency.format(10000),fail?/JPY.*10,000/:/USD.*100/);assert.match(ctx.MD.currency.note(),fail?/unavailable/:/2026-10-23/);assert.equal(storage.get('md_currency'),'USD');assert.ok(events.length);}
Promise.all([fxCase(false),fxCase(true)]).then(()=>console.log('PASS explicit room/group totals, legacy counts, date boundaries, independent stay exclusion, FX conversion and offline fallback.')).catch(e=>{console.error(e);process.exit(1)});
