const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
function boot(saved){
 const node=()=>({play(){},pause(){},innerHTML:'',value:'',dataset:{},style:{},children:[],classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},removeAttribute(){},addEventListener(){},focus(){},querySelector(){return node()},querySelectorAll(){return[]},getBoundingClientRect(){return{top:0,bottom:500,width:1000,height:500}},offsetHeight:68});
 const nodes=new Map(),get=s=>{if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)};
 const c={console,Set,Map,Date,Intl,JSON,URL,Blob,Math,performance:{now:()=>0},setTimeout:()=>0,clearTimeout(){},requestAnimationFrame:()=>0,cancelAnimationFrame(){},matchMedia:()=>({matches:false,addEventListener(){}}),location:{hash:'#home'},navigator:{},getComputedStyle:()=>({position:'relative',top:'0px'}),localStorage:{getItem:()=>JSON.stringify(saved),setItem(){}},document:{querySelector:get,querySelectorAll:()=>[],createElement:node,addEventListener(){},body:node(),documentElement:node(),hidden:false},scrollY:0,innerHeight:900,scrollTo(){},addEventListener(){}};
 c.window=c;vm.createContext(c);for(const f of ['assumptions.js','stay.js','data.js','planner.js','app.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',f),'utf8'),c);return c.MD;
}
const records=[];
const bad=boot({sel:[],course:'constructor',date:'2027-09-07'});
assert.equal(bad.app.S.course,'constructor');
let error;try{bad.app.coursePreview(bad.app.S.course)}catch(e){error=e.message}
assert.ok(error);records.push({case:'Inherited key in saved course',accepted:bad.app.S.course,error,exposure:'Corrupted or deliberately edited same-origin localStorage; no remote input path identified.'});
const M=boot({sel:[]});
const long=M.data.activities.filter(a=>a.u===2);records.push({case:'Long outings treated as one block',outings:long.map(a=>({id:a.id,name:a.name}))});
const s={sel:new Set(['mtmyoko','kayak']),placements:{mtmyoko:{day:1,slot:'am',locked:true},kayak:{day:1,slot:'pm',locked:true}},days:4,date:'2027-09-07',walk:5,who:'couple',stay:'own',month:9,flex:false};
const day=M.planner.schedule(s).days[1];assert.equal(day.items.length,2);assert.ok(day.long);records.push({case:'Full-day mountain climb plus afternoon kayaking',accepted:day.items.map(a=>a.name),longWarning:day.long});
const src=fs.readFileSync(path.join(root,'js/map.js'),'utf8');assert.ok(src.includes('basePromise = loadBase().catch(() => null)')&&src.includes('basePromise = basePromise || loadBase()'));records.push({case:'Preload failure is cached as a fulfilled null promise',evidence:'prefetch catches a rejection to null, then start reuses the same promise instead of retrying.'});
fs.writeFileSync(path.join(__dirname,'audit-results.json'),JSON.stringify(records,null,2));console.log(JSON.stringify(records,null,2));
