const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const f=require('./field-fixture.cjs'),{T,L,heightAt,c,plots}=f;
const animals=c.MyokoGrazers.create({T,kit:c.MyokoKit.api,L,heightAt,EXAG:L.exaggeration});animals.setObstacles(plots);
const states={horse:new Set(),rabbit:new Set()},bounds={},previous={},results={};
for(const a of animals.actors){assert.ok(a.rig.root.visible);bounds[a.key]={minX:Infinity,maxX:-Infinity,minZ:Infinity,maxZ:-Infinity};}
for(let frame=0;frame<24000;frame++){
 const dt=[.033,.1,.047,.072][frame%4];animals.update(dt);
 for(const a of animals.actors){
  assert.ok(a.rig.root.visible,'residents remain present');states[a.key].add(a.state);
  const prev=previous[a.key],m=a.rig.root.userData.motion;
  if(prev){const step=Math.hypot(a.x-prev.x,a.z-prev.z);assert.ok(step<(a.key==='horse'?16:43),'no teleport at circuit/state boundaries');if(a.key==='rabbit'&&a.air===0&&prev.air===0&&a.state!=='hop')assert.ok(step<1e-7,'planted rabbit never slides');}
  previous[a.key]={x:a.x,z:a.z,air:a.air};
  if(frame%100===0){for(let j=0;j<12;j++){const th=j/12*Math.PI*2;assert.ok(animals.safe(a.key,a.x+Math.cos(th)*a.radius,a.z+Math.sin(th)*a.radius),'full footprint stays clear of water, fields, houses, attractions and steep ground');}
   const b=bounds[a.key];b.minX=Math.min(b.minX,a.x);b.maxX=Math.max(b.maxX,a.x);b.minZ=Math.min(b.minZ,a.z);b.maxZ=Math.max(b.maxZ,a.z);
   assert.ok(a.rig.root.position.y>=heightAt(a.x,a.z)*L.exaggeration+4,'body origin is seated above terrain');
   if(a.state==='graze'&&a.local>2){a.rig.root.updateMatrixWorld(true);const probes=a.key==='horse'?[[1.04,-.23,0],[.72,-.38,0]]:[[.57,-.045,0],[.42,-.18,0]];for(const q of probes){const p=a.rig.head.localToWorld(new T.Vector3(...q));assert.ok(p.y>=heightAt(p.x,p.z)*L.exaggeration+2,'grazing muzzle stays above actual terrain');}}
  }
 }
}
for(const key of ['horse','rabbit']){assert.ok(states[key].has('graze')&&states[key].has('listen'));results[key]={states:[...states[key]],bounds:bounds[key]};}
assert.ok(states.horse.has('dash')&&states.horse.has('walk'));assert.ok(states.rabbit.has('hop'));
const shared={uCamPos:{value:new T.Vector3()},uViewDist:{value:1000}};animals.setAtmosphere(shared,{uniforms:'',palette:'',paint:''});
let fog=0;animals.group.traverse(o=>{if(o.isMesh&&o.material.customProgramCacheKey?.()==='myoko-grazers-v21')fog++;});assert.ok(fog>50);
results.frames=24000;results.simulatedSeconds=1512;results.foggedMeshes=fog;
fs.writeFileSync(path.join(__dirname,'grazer-results.json'),JSON.stringify(results,null,2));console.log('PASS all grazer motion states, grounded rests, persistent visibility, route wrap, full-footprint habitat checks and private haze materials.');console.log(results);
