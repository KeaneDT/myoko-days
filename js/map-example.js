/* Optional example using the production Daruma model and activity data.
   Its scene and itinerary are isolated: no saved trip or map camera mutations. */
(function(){
  'use strict';
  const A=MD.app,box=document.getElementById('mapExample'),dock=document.getElementById('dock'),a=A.D.byId.daruma;
  const SEEN_KEY='md_planning_demo_v1';
  let seenInMemory=false;
  function hasSeen(){
    if(seenInMemory)return true;
    try{if(localStorage.getItem(SEEN_KEY)==='1')return true;}catch(e){/* Storage may be unavailable. */}
    try{return sessionStorage.getItem(SEEN_KEY)==='1';}catch(e){return false;}
  }
  function remember(){
    seenInMemory=true;
    try{localStorage.setItem(SEEN_KEY,'1');}catch(e){try{sessionStorage.setItem(SEEN_KEY,'1');}catch(e2){/* Once for this page if all storage is blocked. */}}
  }
  let opened=false,step=0,playing=false,timer=null,opener=null,generation=0;
  let renderer=null,scene=null,camera=null,model=null,modelBoot=null;
  const titles=['Find a place that draws you','Explore the activity','Choose where it goes','Your day takes shape'];
  const copy=['Select Daruma Painting on the map or in Places.','Check the activity, then choose Add to my trip.','Choose Day 2 afternoon, then confirm. Existing activities stay put.','Daruma Painting now belongs to Day 2. View day takes you straight to it.'];
  const photo=()=>`<img src="assets/thumb/${a.img}.jpg" alt="">`;
  const pin=()=>MD.svg('craft',20);
  function sceneHTML(){
    if(step===0)return `<div class="example-model-scene"><div class="example-model-slot" data-example-model></div><span class="example-real-pin">${pin()}</span><span class="example-place-name">${A.esc(a.name)}</span><span class="demo-cursor demo-cursor--pin" aria-hidden="true">${cursor()}</span></div>`;
    if(step===1)return `<div class="example-detail"><div class="example-model-slot example-model-slot--small" data-example-model></div><div class="example-detail-copy"><small>MYOKO KOGEN · CRAFTS</small><strong>${A.esc(a.name)}</strong><p>Half day · ${A.priceTxt(a)} · Seated</p></div><div class="example-real-button">Add to my trip <span>→</span></div><span class="demo-cursor demo-cursor--add" aria-hidden="true">${cursor()}</span></div>`;
    if(step===2)return `<div class="example-placement-card"><div class="example-mini-heading">${photo()}<strong>${A.esc(a.name)}</strong></div><label>Add to a day</label><div class="example-real-select">Day 2 · Afternoon <span>⌄</span></div><div class="example-choice-list"><span>Day 1 · Afternoon</span><span>Day 2 · Morning</span><b>Day 2 · Afternoon <i>✓</i></b></div><div class="example-real-button">Confirm activity <span>→</span></div><span class="demo-cursor demo-cursor--confirm" aria-hidden="true">${cursor()}</span></div>`;
    return `<div class="example-result"><div class="example-result-receipt"><span>✓ Added to Day 2 afternoon</span><u>View day</u></div><div class="example-result-heading"><b>Day 2</b><span>MYOKO KOGEN</span></div><div class="example-open-block">Morning <span>Free to explore</span></div><div class="example-planned-block"><span>Afternoon</span><div class="example-model-slot example-model-slot--row" data-example-model></div><div><strong>${A.esc(a.name)}</strong><small>${A.priceTxt(a)}</small></div></div><div class="example-pin-result">${pin()}<b>2</b></div></div>`;
  }
  function cursor(){return `<svg viewBox="0 0 24 28"><path d="m3 2 17 14-8 1-4 8-5-23Z" fill="#fbf8f0" stroke="#263c32" stroke-width="1.5"/></svg>`;}
  async function loadScript(src){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});}
  async function bootModel(){
    if(modelBoot)return modelBoot;
    modelBoot=(async()=>{try{
      if(!window.THREE)await loadScript('js/vendor/three-r128.min.js?v=12');
      if(!window.MyokoKit)await loadScript('assets/diorama/kit/kit.js?v=12.3');
      if(!MyokoKit.has('daruma'))await loadScript('assets/diorama/kit/attractions/daruma.js?v=16.4');
      const T=window.THREE;
      renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setClearColor(0,0);if(T.sRGBEncoding)renderer.outputEncoding=T.sRGBEncoding;
      renderer.domElement.setAttribute('aria-hidden','true');
      scene=new T.Scene();MyokoKit.lights().forEach(l=>scene.add(l));
      model=MyokoKit.build('daruma',{facing:0});model.rotation.y=.55;scene.add(model);
      camera=new T.OrthographicCamera(-100,100,100,-100,.1,1000);
      return true;
    }catch(e){return false;}})();return modelBoot;
  }
  async function drawModel(){
    const token=++generation,slot=box.querySelector('[data-example-model]');if(!slot)return;
    if(!await bootModel()||!opened||token!==generation||!slot.isConnected){if(slot.isConnected&&!renderer)slot.innerHTML=photo();return;}
    slot.appendChild(renderer.domElement);
    const w=slot.clientWidth||250,h=slot.clientHeight||210,info=model.userData.kit;
    const r=Math.hypot(Math.max(info.radius,20),info.height*.5)*1.12,aspect=w/h,cy=info.height*.4;
    camera.left=-r*Math.max(1,aspect);camera.right=-camera.left;camera.top=r/Math.min(1,aspect);camera.bottom=-camera.top;
    camera.position.set(200,cy+230,350);camera.lookAt(0,cy,0);camera.updateProjectionMatrix();renderer.setSize(w,h,false);
    const u=MyokoKit.outlineMaterial.uniforms,res=u.uRes.value.clone(),px=u.uPx.value;
    MyokoKit.setViewport(w,h,Math.min(devicePixelRatio||1,2));renderer.render(scene,camera);u.uRes.value.copy(res);u.uPx.value=px;
    slot.classList.add('is-ready');
  }
  const DWELL=4200;
  let remaining=DWELL,started=0,renderedStep=-1;
  function stop(preserve=false){if(preserve&&timer!==null)remaining=Math.max(0,remaining-(Date.now()-started));clearTimeout(timer);timer=null;}
  function schedule(){stop();if(playing){started=Date.now();timer=setTimeout(()=>{timer=null;remaining=DWELL;if(step<3){step++;draw();schedule();}else{playing=false;draw();}},remaining);}}
  function draw(){
    if(!box.querySelector('.example-head')){
      box.innerHTML=`<div class="example-head"><p class="label">How to plan · a quick example</p><button type="button" data-example-close aria-label="Close example">×</button></div><div class="example-stepper" aria-label="Example steps">${['Explore','Details','Choose day','Your day'].map((s,i)=>`<button type="button" data-example-step="${i}">${i+1} · ${s}</button>`).join('')}</div><h3 id="exampleTitle"></h3><div class="example-stage example-stage--real"><div class="example-canvas" aria-hidden="true"></div></div><p class="example-caption" role="status"></p><p class="example-note">Example only. Your actual dates and activities stay unchanged.</p><div class="example-controls"><button type="button" data-example-play>Play example</button><button type="button" class="linkbtn" data-example-next>Next →</button></div>`;
      renderedStep=-1;
    }
    const stage=box.querySelector('.example-stage'),canvas=box.querySelector('.example-canvas');
    if(renderedStep!==step){
      canvas.getAnimations?.().forEach(animation=>animation.cancel());
      canvas.innerHTML=sceneHTML();
      box.querySelector('#exampleTitle').textContent=titles[step];
      box.querySelector('.example-caption').textContent=copy[step];
      box.querySelectorAll('[data-example-step]').forEach((button,i)=>{if(i===step)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
      stage.classList.toggle('is-playing',playing&&!A.reduceMotion);
      drawModel();
      if(!A.reduceMotion)canvas.animate?.([{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:460,easing:'cubic-bezier(.22,1,.36,1)',fill:'none'});
      renderedStep=step;
    }
    if(playing&&!A.reduceMotion)stage.classList.add('is-playing');
    stage.classList.toggle('is-paused',!playing);
    box.querySelector('[data-example-play]').textContent=playing?'Pause':step===3?'Replay':'Play example';
    const next=box.querySelector('.example-controls .linkbtn');
    next.textContent=step===3?'Try it on my trip →':'Next →';
    next.toggleAttribute('data-example-close',step===3);next.toggleAttribute('data-example-next',step!==3);
  }
  function open(){
    if(opened)return;opener=document.activeElement;opened=true;step=0;remaining=DWELL;renderedStep=-1;playing=!A.reduceMotion;
    box.hidden=false;draw();box.showModal();remember();drawModel();schedule();box.querySelector('[data-example-close]').focus({preventScroll:true});
  }
  function close(render=true){
    if(!opened)return;stop();generation++;opened=false;playing=false;box.close();box.hidden=true;dock.classList.remove('has-example');
    if(render){if(opener?.isConnected&&opener!==document.body)opener.focus({preventScroll:true});else document.querySelector('[data-example-open]')?.focus({preventScroll:true});}
  }
  box.addEventListener('click',e=>{
    if(e.target===box){const r=box.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom){close();return;}}
    if(e.target.closest('[data-example-close]')){close();return;}
    if(e.target.closest('[data-example-play]')){if(playing){stop(true);playing=false;draw();}else{if(step===3){step=0;remaining=DWELL;}playing=true;draw();schedule();}return;}
    const b=e.target.closest('[data-example-step]');if(b){step=Number(b.dataset.exampleStep);playing=false;stop();remaining=DWELL;draw();return;}
    if(e.target.closest('[data-example-next]')){step=Math.min(3,step+1);playing=false;stop();remaining=DWELL;draw();}
  });
  box.addEventListener('cancel',e=>{e.preventDefault();close();});
  document.addEventListener('keydown',e=>{if(opened&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}},true);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stop(true);playing=false;if(opened)draw();}});
  new ResizeObserver(()=>{if(opened)drawModel();}).observe(box);
  function maybeOpen(){if(MD.studio?.ui.active&&!hasSeen())open();}
  MD.mapExample={open,close,maybeOpen,active:()=>opened};
  if(MD.studio?.ui.active&&MD.map?.isReady())maybeOpen();
})();
