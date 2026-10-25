/* Haneuma and Madarao rabbit: permanent, terrain-seated residents.
   Models, safe circuits and distance-driven poses live here; no click targets or external assets. */
window.MyokoGrazers = (function () {
  'use strict';
  const TAU=Math.PI*2, clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v);};
  function create(ctx){
    const {T,kit,L,heightAt,EXAG}=ctx, group=new T.Group();group.name='haneuma-and-rabbit';
    const gy=(x,z)=>heightAt(x,z)*EXAG;
    const inPoly=(P,x,z)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++)if((P[i][1]>z)!=(P[j][1]>z)&&x<(P[j][0]-P[i][0])*(z-P[i][1])/(P[j][1]-P[i][1])+P[i][0])c=!c;return c;};
    const segdist=(x,z,a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);};
    let plots=[];
    const sphere=(m,x,y,z,sx,sy,sz)=>kit.sphere(1,m,{x,y,z,s:[sx,sy,sz],segments:12});
    function leg(parent,x,y,z,upper,lower,width,body,hoof){
      const hip=new T.Group();hip.position.set(x,y,z);parent.add(hip);
      hip.add(kit.cyl(width,width*.72,upper,body,{y:-upper,segments:8}));
      const knee=new T.Group();knee.position.y=-upper;hip.add(knee);
      const foot=kit.box(width*2.3,.13,width*2.1,hoof,{x:.025,y:-lower-.06,bevel:.08});
      knee.add(kit.cyl(width*.65,width*.48,lower,body,{y:-lower,segments:8}),foot);
      return {hip,knee,foot,upper,lower};
    }
    function horse(){
      const root=new T.Group(),rig=new T.Group();root.name='haneuma-horse';root.add(rig);rig.scale.setScalar(110);
      const coat=kit.tone('sumi',.11),warm=kit.tone('sumi',.18),dark=kit.tone('sumi',-.06),nose=kit.tone('sumi',.24);
      const torso=new T.Group();rig.add(torso);
      torso.add(sphere(coat,0,1.66,0,1.45,.62,.52),sphere(warm,.87,1.67,0,.62,.69,.52),sphere(coat,-1.05,1.77,0,.65,.64,.55));
      const neck=new T.Group();neck.position.set(1.0,1.87,0);torso.add(neck);
      const neckSkin=sphere(coat,.22,.52,0,.36,.82,.34);neckSkin.rotation.z=-.31;neck.add(neckSkin);
      const head=new T.Group();head.position.set(.55,1.15,0);neck.add(head);
      head.add(sphere(coat,.10,.03,0,.37,.35,.26),sphere(coat,.43,-.07,0,.35,.25,.24),sphere(nose,.71,-.19,0,.33,.20,.23));
      const jaw=new T.Group();jaw.position.set(.32,-.18,0);jaw.add(sphere(warm,.2,-.015,0,.38,.11,.22));head.add(jaw);
      const ears=[];
      [-1,1].forEach(sd=>{
        const ear=new T.Group();ear.position.set(-.02,.28,sd*.19);head.add(ear);
        ear.add(sphere(coat,0,.13,0,.085,.18,.065),sphere(dark,.035,.13,0,.022,.12,.04));ears.push(ear);
        head.add(sphere(dark,.29,.10,sd*.255,.047,.048,.025),sphere(kit.mat.gofun,.305,.117,sd*.272,.012,.013,.008),
          sphere(dark,.91,-.10,sd*.18,.045,.025,.017));
      });
      for(let i=0;i<6;i++)neck.add(sphere(dark,-.10+i*.055,.18+i*.15,0,.10,.14,.15-i*.01));
      const tail=new T.Group();tail.position.set(-1.48,1.92,0);torso.add(tail);
      const tailParts=[];let par=tail;
      for(let i=0;i<4;i++){const g=new T.Group();if(i)g.position.set(-.11,-.28,0);par.add(g);g.add(sphere(dark,-.06,-.20,0,.12-i*.018,.30,.11-i*.014));tailParts.push(g);par=g;}
      const legs=[leg(torso,.92,1.59,.38,.76,.70,.115,coat,dark),leg(torso,.92,1.59,-.38,.76,.70,.115,coat,dark),
        leg(torso,-1.04,1.62,.39,.79,.70,.14,coat,dark),leg(torso,-1.04,1.62,-.39,.79,.70,.14,coat,dark)];
      return {root,rig,torso,neck,head,jaw,ears,tail,tailParts,legs,scale:110};
    }
    function rabbit(){
      const root=new T.Group(),rig=new T.Group();root.name='madarao-rabbit';root.add(rig);rig.scale.setScalar(90);
      const fur=kit.tone('hinoki',-.38),light=kit.tone('tonoko',.12),dark=kit.tone('sumi',.02),inner=kit.tone('kuchiba',-.15);
      const torso=new T.Group();rig.add(torso);
      torso.add(sphere(fur,-.18,.57,0,.78,.51,.43),sphere(fur,-.56,.62,0,.51,.55,.44),sphere(light,.35,.48,0,.35,.35,.32),sphere(light,-1.01,.65,0,.22,.22,.20));
      const head=new T.Group();head.position.set(.61,.87,0);torso.add(head);
      head.add(sphere(fur,.13,.08,0,.36,.34,.29),sphere(light,.39,-.03,0,.19,.16,.21),sphere(dark,.55,-.005,0,.035,.028,.04));
      const ears=[];
      [-1,1].forEach(sd=>{
        head.add(sphere(dark,.26,.18,sd*.255,.048,.06,.025),sphere(kit.mat.gofun,.274,.20,sd*.275,.014,.015,.008));
        const e=new T.Group();e.position.set(-.02,.29,sd*.16);e.rotation.x=sd*.12;
        e.add(sphere(fur,0,.39,0,.12,.49,.08),sphere(inner,.045,.40,0,.065,.35,.05));head.add(e);ears.push(e);
      });
      const front=[],hind=[];
      [-1,1].forEach(sd=>{
        const f=new T.Group();f.position.set(.44,.42,sd*.25);f.add(sphere(fur,0,-.16,0,.10,.24,.10),sphere(light,.10,-.36,0,.20,.085,.12));torso.add(f);front.push(f);
        const h=new T.Group();h.position.set(-.55,.42,sd*.32);h.add(sphere(fur,0,0,0,.31,.38,.24),sphere(light,.16,-.35,.015,.34,.09,.15));torso.add(h);hind.push(h);
      });
      return {root,rig,torso,head,ears,front,hind,scale:90};
    }
    const schedules={horse:[['walk',12],['settle',2],['graze',15],['listen',6],['dash',4],['settle',3],['rest',8]],
      rabbit:[['rest',4],['graze',9],['listen',3],['hop',4.6],['rest',4],['hop',2.3],['graze',7]]};
    function stateAt(time,schedule){let t=time%schedule.reduce((n,s)=>n+s[1],0);for(const [state,duration]of schedule){if(t<duration)return{state,local:t,duration};t-=duration;}return{state:'rest',local:0,duration:1};}
    const actors=[{key:'horse',home:{x:-4000,z:-13000,R:1050},radius:355,ax:380,az:250,rig:horse()},
      {key:'rabbit',home:{x:-2400,z:12600,R:730},radius:150,ax:260,az:170,rig:rabbit()}];
    const shadowGeo=new T.CircleGeometry(1,24);shadowGeo.rotateX(-Math.PI/2);
    actors.forEach(a=>{a.time=0;a.distance=0;a.v=0;a.phase=0;a.lastHop=0;a.state='rest';
      a.shadow=new T.Mesh(shadowGeo,new T.MeshBasicMaterial({color:0x344136,transparent:true,opacity:.15,depthWrite:false}));a.shadow.renderOrder=1;
      group.add(a.shadow,a.rig.root);a.rig.root.traverse(o=>{o.raycast=()=>{};});});
    function safe(a,x,z){
      if(Math.hypot(x-a.home.x,z-a.home.z)>a.home.R)return false;
      if(Math.abs(x)>L.spanMetres.northSouth/2-1000||Math.abs(z)>L.spanMetres.eastWest/2-1000)return false;
      if((L.lakes||[]).some(l=>inPoly(l.outline,x,z))||inPoly(L.sea||[],x,z))return false;
      if((L.attractions||[]).some(p=>Math.hypot(x-p.x,z-p.z)<.62*p.size+500))return false;
      if(((L.houses&&L.houses.items)||[]).some(h=>Math.hypot(x-h[0],z-h[1])<h[2]*.9+60))return false;
      if(Math.hypot(heightAt(x+120,z)-heightAt(x-120,z),heightAt(x,z+120)-heightAt(x,z-120))/240>.55)return false;
      for(const p of plots){if(Math.hypot(x-p.x,z-p.z)>400)continue;const dx=x-p.x,dz=z-p.z,ca=Math.cos(p.ang),sa=Math.sin(p.ang);if(Math.abs(dx*ca+dz*sa)<p.w/2+50&&Math.abs(-dx*sa+dz*ca)<p.d/2+50)return false;}
      for(const r of L.rivers||[])for(let i=1;i<r.points.length;i++)if(segdist(x,z,r.points[i-1],r.points[i])<(r.width||120)/2+200)return false;
      return true;
    }
    function route(a){
      for(const scale of [1,.8,.6,.4]){
        const pts=[];for(let i=0;i<20;i++){const t=i/20*TAU;pts.push(new T.Vector3(a.home.x+scale*(a.ax*Math.cos(t)+a.ax*.12*Math.sin(2*t)),0,a.home.z+scale*a.az*Math.sin(t)));}
        const path=new T.CatmullRomCurve3(pts,true,'centripetal');path.arcLengthDivisions=1024;path.updateArcLengths();const length=path.getLength();
        const at=d=>path.getPointAt(((d%length)+length)%length/length);let valid=true;
        for(let d=0;valid&&d<length;d+=25){const p=at(d);if(!safe(a,p.x,p.z)||(a.key==='horse'&&Math.hypot(heightAt(p.x+20,p.z)-heightAt(p.x-20,p.z),heightAt(p.x,p.z+20)-heightAt(p.x,p.z-20))/40>.25)){valid=false;break;}for(let j=0;j<12;j++){const t=j/12*TAU;if(!safe(a,p.x+a.radius*Math.cos(t),p.z+a.radius*Math.sin(t))){valid=false;break;}}}
        if(valid)return{at,length,scale};
      }return null;
    }
    function pose(a,dt){
      a.time+=dt;const st=stateAt(a.time,schedules[a.key]);const oldState=a.state;a.state=st.state;a.local=st.local;
      let air=0,crouch=0,land=0;
      if(a.key==='horse'){
        const target=st.state==='walk'?48:st.state==='dash'?150*smooth(st.local/.65)*smooth((st.duration-st.local)/.8):0;
        const old=a.v;a.v+=clamp(target-a.v,-100*dt,85*dt);const dd=(old+a.v)*dt*.5;a.distance+=dd;a.phase+=dd/(a.rig.scale*(st.state==='dash'?.26:.16));
      }else{
        if(st.state==='hop'){
          const f=st.local%1.15,u=clamp((f-.18)/.55,0,1),progress=(Math.floor(st.local/1.15)+smooth(u))*155;
          if(oldState!=='hop')a.lastHop=0;a.distance+=Math.max(0,progress-a.lastHop);a.lastHop=progress;
          air=f>=.18&&f<=.73?Math.sin(u*Math.PI)*65:0;
          crouch=f<.18?Math.sin(f/.18*Math.PI*.5):0;land=f>.73&&f<.98?Math.sin((f-.73)/.25*Math.PI):0;
        }else a.lastHop=0;
      }
      if(!a.path){a.rig.root.visible=false;a.shadow.visible=false;return;}
      const p=a.path.at(a.distance),ahead=a.path.at(a.distance+20),back=a.path.at(a.distance-20),hd=Math.atan2(ahead.z-back.z,ahead.x-back.x);
      a.x=p.x;a.z=p.z;a.air=air;
      const root=a.rig.root;root.visible=true;root.position.set(p.x,gy(p.x,p.z)+5+air,p.z);root.rotation.order='YXZ';
      const crossSlope=Math.atan2(gy(p.x-Math.sin(hd)*55,p.z+Math.cos(hd)*55)-gy(p.x+Math.sin(hd)*55,p.z-Math.cos(hd)*55),110);
      root.rotation.set(-crossSlope,-hd,Math.atan2(gy(ahead.x,ahead.z)-gy(back.x,back.z),Math.hypot(ahead.x-back.x,ahead.z-back.z)));
      const graze=st.state==='graze'?smooth(Math.min(st.local/1.7,(st.duration-st.local)/1.5)):0;
      if(a.key==='horse'){
        const r=a.rig,amp=smooth(a.v/38),dash=st.state==='dash',ph=a.phase;
        r.torso.position.y=-.10+Math.abs(Math.sin(ph*2))*.02*amp;
        root.updateMatrixWorld(true);
        r.legs.forEach((l,i)=>{
          const q=ph+(dash?[0,.35,2.3,2.65][i]:[0,Math.PI,Math.PI,0][i]),stride=Math.sin(q)*.30*amp,lift=Math.max(0,Math.cos(q))*.22*amp;
          const target=r.torso.localToWorld(new T.Vector3(l.hip.position.x+stride,0,l.hip.position.z));
          target.y=gy(target.x,target.z)+(lift+.065)*r.scale+2;r.torso.worldToLocal(target);
          const dx=target.x-l.hip.position.x,dy=target.y-l.hip.position.y,d=clamp(Math.hypot(dx,dy),.15,l.upper+l.lower-.001);
          const beta=-Math.acos(clamp((d*d-l.upper*l.upper-l.lower*l.lower)/(2*l.upper*l.lower),-1,1));
          l.hip.rotation.z=Math.atan2(dx,-dy)-Math.atan2(l.lower*Math.sin(beta),l.upper+l.lower*Math.cos(beta));l.knee.rotation.z=beta;
          l.foot.rotation.z=-l.hip.rotation.z-beta;
        });
        r.neck.rotation.z=-1.95*graze+Math.sin(a.time*.9)*.025*(1-graze);r.head.rotation.z=-.22+.52*graze;
        r.jaw.rotation.z=graze*(.04+.035*Math.sin(a.time*7));
        r.ears.forEach((e,i)=>{e.rotation.z=Math.sin(a.time*.65+i*2)*.07;e.rotation.x=(i?1:-1)*(.08+.1*Math.max(0,Math.sin(a.time*1.4+i)));});
        r.tail.rotation.x=Math.sin(a.time*1.1)*.18;r.tailParts.forEach((g,i)=>g.rotation.x=Math.sin(a.time*1.3-i*.4)*.07);
      }else{
        const r=a.rig,fold=crouch*.14+land*.17;r.torso.position.y=-fold;r.torso.rotation.z=(air>0?-.06*Math.sin(st.local*7):0);
        r.head.position.y=.87-.25*graze;r.head.rotation.z=-1.20*graze+graze*Math.sin(a.time*6)*.035;
        r.ears.forEach((e,i)=>{e.rotation.z=-.1-graze*.35+Math.max(0,Math.sin(a.time*1.9+i*2.4))*.08;e.rotation.x=(i?1:-1)*(.12+.12*Math.sin(a.time*.7+i));});
        r.front.forEach(g=>g.rotation.z=air>0?-.55:.15*(crouch+land));r.hind.forEach(g=>g.rotation.z=air>0?.38:-.12*(crouch+land));
      }
      // Ground-aware muzzle limit: grazing reaches the grass without burying the face on an uphill patch.
      if(graze>.01){
        const joint=a.key==='horse'?a.rig.neck:a.rig.head,head=a.rig.head;
        const probes=a.key==='horse'?[[1.04,-.23,0],[.72,-.38,0]]:[[.57,-.045,0],[.42,-.18,0]];
        root.updateMatrixWorld(true);
        const clear=()=>probes.every(q=>{const wp=head.localToWorld(new T.Vector3(...q));return wp.y>=gy(wp.x,wp.z)+3;});
        if(!clear()){let low=joint.rotation.z,high=0;for(let i=0;i<10;i++){joint.rotation.z=(low+high)/2;joint.updateMatrixWorld(true);if(clear())high=joint.rotation.z;else low=joint.rotation.z;}joint.rotation.z=high;joint.updateMatrixWorld(true);}
      }
      a.shadow.visible=true;a.shadow.position.set(p.x,gy(p.x,p.z)+4,p.z);a.shadow.rotation.y=-hd;
      a.shadow.scale.set(a.key==='horse'?210:90,1,a.key==='horse'?72:48);a.shadow.material.opacity=.15*(1-air/110);
      root.userData.motion={state:a.state,x:a.x,z:a.z,air:a.air,distance:a.distance,routeScale:a.path.scale};
    }
    function setObstacles(next){plots=next||[];actors.forEach(a=>{a.path=route(a);pose(a,0);});}
    function setAtmosphere(shared,glsl){
      const clones=new Map();group.traverse(o=>{if(!o.isMesh||o===actors[0].shadow||o===actors[1].shadow)return;
        if(!clones.has(o.material)){const m=o.material.clone();m.onBeforeCompile=shader=>{Object.assign(shader.uniforms,shared);shader.vertexShader='varying vec3 vGrazerWorld;\n'+shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvGrazerWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');shader.fragmentShader=glsl.uniforms+'\n'+glsl.palette+'\n'+glsl.paint+'\nvarying vec3 vGrazerWorld;\n'+shader.fragmentShader.replace('#include <fog_fragment>','#include <fog_fragment>\ngl_FragColor.rgb=pAerial(gl_FragColor.rgb,vGrazerWorld);');};m.customProgramCacheKey=()=> 'myoko-grazers-v21';clones.set(o.material,m);}o.material=clones.get(o.material);
      });
    }
    setObstacles([]);
    return{group,setObstacles,setAtmosphere,update:dt=>actors.forEach(a=>pose(a,dt)),
      info:()=>actors.map(a=>({key:a.key,st:a.state,x:a.x,z:a.z,visible:a.rig.root.visible,air:a.air,routeLength:a.path&&a.path.length,routeScale:a.path&&a.path.scale})),
      safe:(key,x,z)=>safe(actors.find(a=>a.key===key),x,z),actors};
  }return{create};
})();
