/* Myoko Days: the flat base of the diorama (v8 proposal). A strata-walled land block on a rounded, bevelled plate with an
   inlay line and an engraved label. Added to an existing MyokoScene: MyokoPlinth.add(scene). Pure geometry + two small
   shaders, one canvas texture; no extra files. */
(function () {
function build(S){
  const T=S.THREE, L=S.layout, SN=L.spanMetres.northSouth, SE=L.spanMetres.eastWest, E=S.exaggeration, BASE=-2600, IN=40;
  const grp=new T.Group(); grp.name='plinth';
  // ---- strata walls (the four sides of the land block)
  const pos=[], nrm=[], idx=[], aT=[];
  const wall=(a,b,nx,nz,n)=>{ // a,b = [x,z] ends, sampled every ~45 m
    const len=Math.hypot(b[0]-a[0],b[1]-a[1]), k=Math.max(2,Math.round(len/45)), base=pos.length/3;
    for(let i=0;i<=k;i++){const t=i/k, x=a[0]+(b[0]-a[0])*t, z=a[1]+(b[1]-a[1])*t, h=S.heightAt(x,z)*E-12;
      pos.push(x,h,z, x,BASE,z); nrm.push(nx,0,nz, nx,0,nz); aT.push(1,0);}
    for(let i=0;i<k;i++){const q=base+i*2; idx.push(q,q+1,q+2, q+1,q+3,q+2);}
  };
  const x0=-SN/2+IN,x1=SN/2-IN,z0=-SE/2+IN,z1=SE/2-IN;
  wall([x0,z1],[x1,z1],0,1); wall([x1,z1],[x1,z0],1,0); wall([x1,z0],[x0,z0],0,-1); wall([x0,z0],[x0,z1],-1,0);
  const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(pos,3)); g.setAttribute('normal',new T.Float32BufferAttribute(nrm,3)); g.setAttribute('aT',new T.Float32BufferAttribute(aT,1)); g.setIndex(idx);
  const sm=new T.ShaderMaterial({side:T.DoubleSide, vertexShader:'attribute float aT; varying float vT; varying vec3 vW; varying vec3 vN; void main(){ vT=aT; vW=position; vN=normal; gl_Position=projectionMatrix*viewMatrix*vec4(position,1.0);}',
    fragmentShader:`varying float vT; varying vec3 vW; varying vec3 vN;
      float h1(float n){return fract(sin(n*127.1)*43758.5453);}
      float vn(float x){float i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(h1(i),h1(i+1.),f);}
      void main(){
        float wob=(vn((vW.x+vW.z)/5200.)-0.5)*60.;   // one slow, gentle swell shared by all four walls, so the layers read as level bands
        float y=vW.y+wob;
        vec3 c0=vec3(0.640,0.545,0.395), c1=vec3(0.745,0.655,0.495), c2=vec3(0.815,0.735,0.575), c3=vec3(0.860,0.790,0.640), top=vec3(0.800,0.715,0.500);
        vec3 c=mix(c0,c1,smoothstep(-2600.,-1800.,y)); c=mix(c,c2,smoothstep(-1500.,-1100.,y)); c=mix(c,c3,smoothstep(-700.,-250.,y));
        c=mix(c,top,smoothstep(-120.,60.,y)*0.7);
        float seam=0.0; for(int i=0;i<3;i++){ float yy=i==0?-1500.:(i==1?-700.:-250.); seam+=smoothstep(26.,0.,abs(y-yy)); }
        c*=1.0-0.07*clamp(seam,0.,1.);
        c*=0.90+0.10*smoothstep(-2600.,-2350.,vW.y);                         // soft contact at the foot
        float sh = vN.z>0.5?1.0 : vN.x<-0.5?1.04 : vN.x>0.5?0.84 : 0.92;
        gl_FragColor=vec4(c*sh,1.0);
      }`});
  grp.add(new T.Mesh(g,sm));
  // ---- the flat base plate (rounded, bevelled)
  const M=1100, W=SN+2*M, D=SE+2*M, R=900, TH=1100, BV=130;
  const sh=new T.Shape(); const hx=W/2-BV, hy=D/2-BV;
  sh.moveTo(-hx+R,-hy); sh.lineTo(hx-R,-hy); sh.quadraticCurveTo(hx,-hy,hx,-hy+R); sh.lineTo(hx,hy-R); sh.quadraticCurveTo(hx,hy,hx-R,hy); sh.lineTo(-hx+R,hy); sh.quadraticCurveTo(-hx,hy,-hx,hy-R); sh.lineTo(-hx,-hy+R); sh.quadraticCurveTo(-hx,-hy,-hx+R,-hy);
  const pg=new T.ExtrudeGeometry(sh,{depth:TH-2*BV,bevelEnabled:true,bevelThickness:BV,bevelSize:BV,bevelSegments:4,curveSegments:24});
  const pm=new T.ShaderMaterial({vertexShader:'varying vec3 vN; varying vec3 vL; void main(){ vN=normalize(mat3(modelMatrix)*normal); vL=position; gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.0);}',
    fragmentShader:`varying vec3 vN; varying vec3 vL; const float SNH=${(SN/2).toFixed(1)}; const float SEH=${(SE/2).toFixed(1)};
      void main(){ vec3 n=normalize(vN); vec3 base=vec3(0.945,0.925,0.875);
        float top=smoothstep(0.5,0.9,n.y); float front=smoothstep(0.3,0.8,n.z); float side=n.x;
        vec3 c=base*(0.80+0.20*top); c*= (front>0.5?0.94:1.0); c*= (side>0.5?0.82:side<-0.5?0.97:1.0);
        c=mix(c,base*1.04,top*0.5);
        vec2 q=vec2(abs(vL.x)-SNH, abs(vL.y)-SEH); float dd=max(q.x,q.y);
        c*=mix(0.90,1.0,smoothstep(0.0,520.0,dd))*1.0;
        c=mix(c,base*0.80,top*smoothstep(46.,0.,abs(dd-360.))*0.55);
        gl_FragColor=vec4(c,1.0);}`});
  const pmesh=new T.Mesh(pg,pm); pmesh.rotation.x=-Math.PI/2; pmesh.position.set(0,BASE-(TH-BV),0);
  grp.add(pmesh);
  const cv=document.createElement('canvas'); cv.width=4096; cv.height=320; const cx=cv.getContext('2d');
  cx.font='600 64px ui-monospace, Menlo, Consolas, "DejaVu Sans Mono", monospace'; cx.letterSpacing='9px'; cx.fillStyle='rgba(96,86,66,0.85)'; cx.textBaseline='middle';
  cx.fillText('MYOKO KOGEN  ·  NOJIRI TO ARAI', 900, 160); cx.textAlign='right'; cx.fillText('36.85°N  138.19°E', 4096-120, 160);
  const tex=new T.CanvasTexture(cv); tex.anisotropy=8;
  const tw=SN*0.92, th=tw*320/4096;
  const tm=new T.Mesh(new T.PlaneGeometry(tw,th), new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,toneMapped:false}));
  tm.rotation.x=-Math.PI/2; tm.position.set(0,BASE+6,SE/2+IN+ (M-IN)*0.62); tm.renderOrder=5; grp.add(tm);
  S.scene.add(grp); return grp;
}
  window.MyokoPlinth = { add: function (S) { try { return build(S); } catch (e) { console.warn("plinth unavailable", e && e.message); return null; } } };
})();
