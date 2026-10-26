const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.join(__dirname,'..');
const T=require(path.join(root,'js/vendor/three-r128.min.js'));
const {PNG}=require('pngjs');
const L=JSON.parse(fs.readFileSync(path.join(root,'assets/diorama/data/layout.json'),'utf8')),SN=L.spanMetres.northSouth,SE=L.spanMetres.eastWest;
const images={};for(const name of ['height','cover','water','shape','tone'])images[name]=PNG.sync.read(fs.readFileSync(path.join(root,`assets/diorama/data/relief-${name}-${name==='tone'?'hi':'lo'}.png`)));
function sample(name,x,z){const p=images[name],W=p.width,H=p.height,r=Math.max(0,Math.min(H-1.001,(SN/2-x)/SN*H-.5)),c=Math.max(0,Math.min(W-1.001,(z+SE/2)/SE*W-.5)),i=Math.floor(r),j=Math.floor(c),fr=r-i,fc=c-j;return [0,1,2].map(k=>{const v=(r,c)=>p.data[(r*W+c)*4+k];return ((v(i,j)*(1-fc)+v(i,j+1)*fc)*(1-fr)+(v(i+1,j)*(1-fc)+v(i+1,j+1)*fc)*fr)/255;});}
// Heights must decode before interpolation, exactly as scene.js does.
function heightAt(x,z){const p=images.height,W=p.width,H=p.height,r=Math.max(0,Math.min(H-1.001,(SN/2-x)/SN*H-.5)),c=Math.max(0,Math.min(W-1.001,(z+SE/2)/SE*W-.5)),i=Math.floor(r),j=Math.floor(c),fr=r-i,fc=c-j;const h=(r,c)=>(p.data[(r*W+c)*4]*256+p.data[(r*W+c)*4+1])/10-50;return (h(i,j)*(1-fc)+h(i,j+1)*fc)*(1-fr)+(h(i+1,j)*(1-fc)+h(i+1,j+1)*fc)*fr;}
const document={createElement:()=>({getContext:()=>({createRadialGradient:()=>({addColorStop(){}}),fillRect(){}})})};
const c={THREE:T,console,document};c.window=c;vm.createContext(c);
for(const f of ['kit/kit.js','kit/grazers.js','kit/critters.js'])vm.runInContext(fs.readFileSync(path.join(root,'assets/diorama',f),'utf8'),c);
let factory;c.MyokoStyle={part:(name,fn)=>factory=fn};vm.runInContext(fs.readFileSync(path.join(root,'assets/diorama/style/fields.js'),'utf8'),c);
function buildFields(step=2){
 const p=images.height,W=p.width,H=p.height,cols=Math.floor((W-1)/step)+1,rows=Math.floor((H-1)/step)+1,positions=new Float32Array(rows*cols*3);
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const i=(r*cols+c)*3;positions[i]=SN/2-(r*step+.5)/H*SN;positions[i+1]=heightAt(positions[i],(c*step+.5)/W*SE-SE/2)*L.exaggeration;positions[i+2]=(c*step+.5)/W*SE-SE/2;}
 const terrainGrid={positions,cols,rows};
 const fields=factory({THREE:T,kit:c.MyokoKit.api,layout:L,span:{northSouth:SN,eastWest:SE},exaggeration:L.exaggeration,heightAt,sample,terrainGrid,tex:{tone:{}},shared:{},glsl:{uniforms:'',palette:'',paint:''},PALETTE:c.MyokoKit.PALETTE});
 return {fields,terrainGrid};
}
const {fields}=buildFields();
const plots=fields.plots||(()=>{const out=[],m=new T.Matrix4(),p=new T.Vector3(),q=new T.Quaternion(),s=new T.Vector3(),e=new T.Euler();for(let i=0;i<fields.object.count;i++){fields.object.getMatrixAt(i,m);m.decompose(p,q,s);e.setFromQuaternion(q);out.push({x:p.x,z:p.z,w:s.x,d:s.z,ang:-e.y});}return out;})();
module.exports={T,L,heightAt,sample,c,plots,buildFields};
if(require.main===module){fs.writeFileSync(path.join(__dirname,'field-footprints.json'),JSON.stringify({plots,houses:L.houses.items}));console.log(plots.length,'actual rice plots;',L.houses.items.length,'houses');}
