const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const T=require(path.join(root,'js/vendor/three-r128.min.js'));
const {PNG}=require('pngjs');
const L=JSON.parse(fs.readFileSync(path.join(root,'assets/diorama/data/layout.json'),'utf8'));
const png=PNG.sync.read(fs.readFileSync(path.join(root,'assets/diorama/data/relief-height-lo.png')));
const {width:W,height:H,data}=png, SN=L.spanMetres.northSouth,SE=L.spanMetres.eastWest;
function heightAt(x,z){
 const r=Math.max(0,Math.min(H-1.001,(SN/2-x)/SN*H-.5)),c=Math.max(0,Math.min(W-1.001,(z+SE/2)/SE*W-.5));
 const i=Math.floor(r),j=Math.floor(c),fr=r-i,fc=c-j;
 const h=(r,c)=>(data[(r*W+c)*4]*256+data[(r*W+c)*4+1])/10-50;
 return (h(i,j)*(1-fc)+h(i,j+1)*fc)*(1-fr)+(h(i+1,j)*(1-fc)+h(i+1,j+1)*fc)*fr;
}
const document={createElement:()=>({getContext:()=>({createRadialGradient:()=>({addColorStop(){}}),fillRect(){}})})};
let seed=291;const math=Object.create(Math);math.random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
const c={THREE:T,console,document,Math:math};c.window=c;vm.createContext(c);
for(const file of ['kit.js','critters.js'])vm.runInContext(fs.readFileSync(path.join(root,'assets/diorama/kit',file),'utf8'),c);
const animals=c.MyokoCritters.create({T,kit:c.MyokoKit.api,L,heightAt,EXAG:L.exaggeration});
const {plots}=require('./field-fixture.cjs');
animals.setObstacles(plots);
const snake=animals.group.getObjectByName('kurohime-snake');
assert.ok(snake,'A fully validated foothill route must exist');
const foxObject=animals.group.getObjectByName('iizuna-fox');
assert.ok(snake.visible&&foxObject.visible,'both residents are posed and visible immediately, even without an animation clock');
const ud=snake.userData,zone=animals.zones.snake, pk=L.peaks.find(p=>p.name.startsWith('Mt Kurohime'));
const slope=(x,z)=>Math.hypot(heightAt(x+120,z)-heightAt(x-120,z),heightAt(x,z+120)-heightAt(x,z-120))/240;
const inPoly=(p,x,z)=>{let inside=false;for(let i=0,j=p.length-1;i<p.length;j=i++)if((p[i][1]>z)!=(p[j][1]>z)&&x<(p[j][0]-p[i][0])*(z-p[i][1])/(p[j][1]-p[i][1])+p[i][0])inside=!inside;return inside;};
function dist(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);}
function safe(x,z){
 assert.ok(Math.hypot(x-zone.x,z-zone.z)<=zone.R,'whole body within foothill patch');
 assert.ok(Math.hypot(x-pk.x,z-pk.z)>=2600,'no climbing onto the mountain');
 assert.ok(heightAt(x,z)<1150 && slope(x,z)<=.38,'low, gentle foothill ground');
 assert.ok(!L.lakes.some(l=>inPoly(l.outline,x,z))&&!inPoly(L.sea,x,z),'no water');
 assert.ok(L.attractions.every(a=>Math.hypot(x-a.x,z-a.z)>.62*a.size+500),'no model pads');
 assert.ok(L.houses.items.every(h=>Math.hypot(x-h[0],z-h[1])>h[2]*.9+80),'no house or roof footprints');
 for(const p of plots){if(Math.hypot(x-p.x,z-p.z)>400)continue;const dx=x-p.x,dz=z-p.z,ca=Math.cos(p.ang),sa=Math.sin(p.ang);assert.ok(Math.abs(dx*ca+dz*sa)>p.w/2+55||Math.abs(-dx*sa+dz*ca)>p.d/2+55,'outside rice plots plus setback');}
 for(const r of L.rivers)for(let i=1;i<r.points.length;i++)assert.ok(dist(x,z,r.points[i-1],r.points[i])>(r.width||120)/2+280,'no river crossings');
}
// Check welded topology (the radial texture seam is intentionally duplicated).
let now=0; animals.update(now,3);animals.force('snake');
const states=new Set();let sampled=0,travel=0,maxStep=0,previous=null,lastCenters=null,restStable=0;
const bounds={minX:Infinity,maxX:-Infinity,minZ:Infinity,maxZ:-Infinity};
for(let frame=0;frame<18000;frame++){
 const dt=[1/30,.045,.08,.1,.019][frame%5];now+=dt;animals.update(now,frame%200<100?1:3);
 assert.ok(snake.visible&&foxObject.visible,'neither resident despawns at any zoom or life age');
 if(!snake.visible)continue;
 const info=animals.info().find(a=>a.key==='snake');states.add(info.st);
 const centers=ud.centers;
 const p=centers[0]; if(previous){const step=Math.hypot(p.x-previous.x,p.z-previous.z);maxStep=Math.max(maxStep,step);travel+=step;assert.ok(step<6.6,'no teleporting, darting or loop-wrap jumps');}
 if(lastCenters && info.st==='rest' && previous && Math.hypot(p.x-previous.x,p.z-previous.z)<1e-8){
  for(let i=0;i<centers.length;i++)assert.ok(Math.hypot(centers[i].x-lastCenters[i].x,centers[i].z-lastCenters[i].z)<1e-7,'body does not wriggle while resting');restStable++;
 }
 if(frame%100===0){
  const pos=ud.body.geometry.attributes.position;
  for(let i=0;i<centers.length;i+=4){
   const p=centers[i];safe(p.x,p.z);
   for(const j of [0,3,6,9]){const k=i*13+j;safe(pos.getX(k),pos.getZ(k));assert.ok(pos.getY(k)>=heightAt(pos.getX(k),pos.getZ(k))*L.exaggeration+6.5,'skin stays above the ground');}
   bounds.minX=Math.min(bounds.minX,p.x);bounds.maxX=Math.max(bounds.maxX,p.x);bounds.minZ=Math.min(bounds.minZ,p.z);bounds.maxZ=Math.max(bounds.maxZ,p.z);
  }
  for(let i=1;i<centers.length;i++)assert.ok(Math.hypot(centers[i].x-centers[i-1].x,centers[i].z-centers[i-1].z)<=6.1,'constant body length through bends');
  sampled++;
 }
 previous={...p};lastCenters=centers.map(p=>({...p}));
}
assert.ok(states.has('look')&&states.has('rest')&&states.has('slither'));
assert.ok(restStable>20&&travel>15000,'exercise many route circuits and complete rests');
// One welded, closed and connected triangle skin.
const geo=ud.body.geometry,pos=geo.attributes.position,edges=new Map(),ids=new Map();let next=0;
const weld=i=>{const k=[pos.getX(i),pos.getY(i),pos.getZ(i)].map(n=>n.toFixed(3)).join(',');if(!ids.has(k))ids.set(k,next++);return ids.get(k);};
for(let i=0;i<geo.index.count;i+=3){const a=[0,1,2].map(j=>weld(geo.index.array[i+j]));for(let j=0;j<3;j++){const edge=[a[j],a[(j+1)%3]].sort((a,b)=>a-b).join(',');edges.set(edge,(edges.get(edge)||0)+1);}}
assert.ok([...edges.values()].every(n=>n===2),'every welded edge is shared by two faces');
assert.equal(next-edges.size+geo.index.count/3,2,'connected closed tube with end caps');
const normal=geo.attributes.normal;for(let i=0;i<normal.count;i++)assert.ok(Number.isFinite(normal.getX(i))&&Number.isFinite(normal.getY(i))&&Number.isFinite(normal.getZ(i)));
// Fog uses cloned materials, exact terrain helper, and live uniform references.
const fox=c.MyokoKit.api.mat.gofun, savedColor=fox.color.getHex(), savedProgram=fox.customProgramCacheKey();
const shared={uCamPos:{value:new T.Vector3(0,1000,50000)},uViewDist:{value:35000}};
animals.setAtmosphere(shared,{uniforms:'uniform vec3 uCamPos; uniform float uViewDist;',palette:'',paint:'vec3 pAerial(vec3 c,vec3 p){return c;}'});
let fogCount=0;animals.group.traverse(o=>{if(o.isMesh&&o.material.customProgramCacheKey?.()==='myoko-fox-aerial-v19'){
 const shader={uniforms:{},vertexShader:'#include <worldpos_vertex>',fragmentShader:'#include <fog_fragment>'};o.material.onBeforeCompile(shader);
 assert.equal(shader.uniforms.uCamPos,shared.uCamPos);assert.ok(shader.fragmentShader.includes('pAerial(gl_FragColor.rgb, vCritterWorld)'));fogCount++;
}});assert.ok(fogCount>20);assert.equal(fox.color.getHex(),savedColor);assert.equal(fox.customProgramCacheKey(),savedProgram);
const result={simulatedSeconds:Math.round(now),frames:18000,habitatSamples:sampled,travelUnits:Math.round(travel),maxFrameTravel:maxStep,states:[...states],restFrames:restStable,bounds,triangles:geo.index.count/3,foggedFoxMeshes:fogCount};
fs.writeFileSync(path.join(__dirname,'critter-results.json'),JSON.stringify(result,null,2));console.log('PASS continuous closed snake skin, terrain contact, foothill confinement, stable body length, travel/pause motion, loop wrap, and private live fox haze.');console.log(JSON.stringify(result,null,2));
