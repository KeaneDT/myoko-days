const assert=require('node:assert/strict');
const {plots,buildFields,L}=require('./field-fixture.cjs');
const cells=new Map(),pairs=new Set(),overlaps=[];
function overlap(a,b){
 const axes=[[Math.cos(a.ang),Math.sin(a.ang)],[-Math.sin(a.ang),Math.cos(a.ang)],[Math.cos(b.ang),Math.sin(b.ang)],[-Math.sin(b.ang),Math.cos(b.ang)]];
 for(const [x,z] of axes){
  const extent=p=>Math.abs(x*Math.cos(p.ang)+z*Math.sin(p.ang))*p.w/2+Math.abs(-x*Math.sin(p.ang)+z*Math.cos(p.ang))*p.d/2;
  if(Math.abs((b.x-a.x)*x+(b.z-a.z)*z)>=extent(a)+extent(b)-1e-5)return false;
 }
 return true;
}
for(let i=0;i<plots.length;i++){
 const p=plots[i],r=Math.hypot(p.w,p.d)/2;
 for(let x=Math.floor((p.x-r)/400);x<=Math.floor((p.x+r)/400);x++)for(let z=Math.floor((p.z-r)/400);z<=Math.floor((p.z+r)/400);z++){
  const key=x+':'+z,bin=cells.get(key)||[];
  for(const j of bin){const pk=j+':'+i;if(pairs.has(pk))continue;pairs.add(pk);if(overlap(plots[j],p))overlaps.push([j,i]);}
  bin.push(i);cells.set(key,bin);
 }
}
console.log(`${plots.length} plots; ${pairs.size} nearby pairs checked; ${overlaps.length} overlaps.`);
if(overlaps.length)console.log('First overlap:',plots[overlaps[0][0]],plots[overlaps[0][1]]);
assert.equal(overlaps.length,0,'Rotated paddies must not overlap anywhere on the map.');
console.log('PASS no overlapping rice-field footprints across the full map.');
// Clip each rendered terrain triangle against each plot footprint. Interpolating
// heights at clipping intersections gives the exact maximum under that footprint,
// including ridges between the four corners. Test both production quality grids.
function clip(poly,distance){
 const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=distance(a),db=distance(b);if(da>=-1e-7)out.push(a);if((da>=0)!==(db>=0)){const t=da/(da-db);out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});}}return out;
}
for(const step of [2,3]){
 const {fields,terrainGrid:{positions:v,cols,rows}}=buildFields(step),dx=v[0]-v[cols*3],dz=v[5]-v[2];let triangles=0,minGap=Infinity;
 const point=i=>({x:v[i*3],y:v[i*3+1],z:v[i*3+2]});
 for(const p of fields.plots){
  const ca=Math.cos(p.ang),sa=Math.sin(p.ang),rx=(Math.abs(ca)*p.w+Math.abs(sa)*p.d)/2,rz=(Math.abs(sa)*p.w+Math.abs(ca)*p.d)/2;
  const r0=Math.max(0,Math.floor((v[0]-p.x-rx)/dx)),r1=Math.min(rows-2,Math.floor((v[0]-p.x+rx)/dx)),c0=Math.max(0,Math.floor((p.z-rz-v[2])/dz)),c1=Math.min(cols-2,Math.floor((p.z+rz-v[2])/dz));
  const planes=[q=>(q.x-p.x)*ca+(q.z-p.z)*sa+p.w/2,q=>p.w/2-(q.x-p.x)*ca-(q.z-p.z)*sa,q=>-(q.x-p.x)*sa+(q.z-p.z)*ca+p.d/2,q=>p.d/2+(q.x-p.x)*sa-(q.z-p.z)*ca];
  for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){
   const a=r*cols+c,b=a+1,d=a+cols,e=d+1;
   for(const ids of [[a,d,b],[b,d,e]]){let poly=ids.map(point);for(const plane of planes){poly=clip(poly,plane);if(!poly.length)break;}if(!poly.length)continue;triangles++;for(const q of poly){const gap=p.top-q.y;minGap=Math.min(minGap,gap);assert.ok(gap>=3.2*L.exaggeration-1e-3,'Plot must clear every rendered terrain triangle.');}}
  }
 }
 console.log(`PASS quality step ${step}: ${triangles} clipped terrain triangles; minimum clearance ${minGap.toFixed(3)} world units.`);
 fields.object.geometry.dispose();fields.object.material.dispose();
}
