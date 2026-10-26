// Exercise the actual onboarding controller without WebGL or a browser account.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../js/map-example.js'),'utf8');
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),data};};
const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
function launch(local=memory(),session=memory(),reduce=false){
  let shows=0,timers=0;
  const node=()=>({isConnected:true,textContent:'',innerHTML:'',focus(){},setAttribute(){},removeAttribute(){},toggleAttribute(){},classList:{add(){},remove(){},toggle(){}},getAnimations:()=>[],animate(){}});
  const button=node(),nodes=new Map();
  const box={hidden:true,innerHTML:'',contains:()=>false,addEventListener(){},querySelector:s=>s==='[data-example-model]'?null:s==='.example-head'&&!box.innerHTML?null:(nodes.has(s)?nodes.get(s):(nodes.set(s,node()),nodes.get(s))),querySelectorAll:()=>[node(),node(),node(),node()],showModal(){shows++;},close(){}};
  const trip={sel:['imori'],placements:{imori:{day:0,slot:'pm'}},date:'2027-09-07'};
  const before=JSON.stringify(trip);
  const MD={svg:()=>'<svg></svg>',app:{esc:s=>s,D:{byId:{daruma:{name:'Daruma Painting',img:'daruma'}}},S:trip,reduceMotion:reduce},studio:{ui:{active:false}},map:{isReady:()=>false}};
  vm.runInNewContext(source,{MD,document:{body:{},activeElement:null,getElementById:id=>id==='mapExample'?box:{classList:{remove(){}}},querySelector:()=>button,addEventListener(){}},localStorage:local,sessionStorage:session,ResizeObserver:class{observe(){}},setTimeout:()=>++timers,clearTimeout(){}});
  MD.studio.ui.active=true;
  return {demo:MD.mapExample,box,local,session,get shows(){return shows;},get timers(){return timers;},unchanged:()=>assert.equal(JSON.stringify(trip),before)};
}
const persistent=memory(),first=launch(persistent);
first.demo.maybeOpen();assert.equal(first.shows,1);assert.equal(first.timers,1);first.unchanged();
first.demo.close();first.demo.maybeOpen();assert.equal(first.shows,1);
const returning=launch(persistent);returning.demo.maybeOpen();assert.equal(returning.shows,0);
returning.demo.open();assert.equal(returning.shows,1);returning.unchanged();
const session=memory(),fallback=launch(blocked,session);fallback.demo.maybeOpen();assert.equal(fallback.shows,1);fallback.demo.close();
const sessionReturn=launch(blocked,session);sessionReturn.demo.maybeOpen();assert.equal(sessionReturn.shows,0);
const privateMode=launch(blocked,blocked);privateMode.demo.maybeOpen();privateMode.demo.close();privateMode.demo.maybeOpen();assert.equal(privateMode.shows,1);privateMode.unchanged();
const reduced=launch(memory(),memory(),true);reduced.demo.maybeOpen();assert.equal(reduced.shows,1);assert.equal(reduced.timers,0);assert.ok(reduced.box.innerHTML.includes('Play example'));reduced.unchanged();
assert.equal(persistent.data.size,1);assert.equal(persistent.getItem('md_planning_demo_v1'),'1');
console.log('PASS first-visit autoplay, returning visitor suppression, manual replay, storage fallbacks, reduced motion and trip isolation.');
