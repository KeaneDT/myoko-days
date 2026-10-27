/* Fieldwork galleries and a browser-composed film of scheduled activities only. */
window.MD = window.MD || {};
(function () {
  'use strict';
  const library = MD.mediaLibrary;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  Object.entries(library).forEach(([id, item]) => {
    const a = MD.data.byId[id];
    if (a && item.photos.length) { a.img = item.photos[0].src.replace('assets/img/', '').replace(/\.jpg$/, ''); a.ph = item.photos[0].caption; }
  });
  [['restore','imori'],['discover','daruma'],['active','sup']].forEach(([key,id]) => {
    MD.data.courses[key].img = MD.data.byId[id].img;
    MD.data.courses[key].ph = library[id].photos[0].caption;
  });

  // No thematic substitutions: only an exact activity ID with a scheduled item qualifies.
  function compose(days) {
    const clips = [], missing = [], seen = new Set();
    days.forEach(day => day.items.forEach(a => {
      if (seen.has(a.id)) return;
      seen.add(a.id);
      const videos = library[a.id]?.videos || [];
      if (!videos.length) { missing.push(a.name); return; }
      videos.forEach(v => clips.push({...v, id:a.id, name:a.name, day:day.i + 1}));
    }));
    return {clips, missing};
  }
  let dispose = () => {};
  MD.tripFilm = {compose, destroy() { dispose(); dispose = () => {}; }, mount(root, days) {
    MD.tripFilm.destroy();
    if (!root) return;
    const {clips, missing} = compose(days), chapters=clips.map((c,i)=>({c,i})).filter((x,i,a)=>i===0||x.c.id!==a[i-1].c.id), total = clips.reduce((n,c) => n+c.duration, 0);
    root.innerHTML = `<div class="trip-film__heading"><div><p class="label">A glimpse of your itinerary</p><h2>Your days, in motion.</h2></div><p>Real moments from the team’s October 2026 fieldwork, drawn from the activities in your plan.</p></div>`;
    if (!clips.length) {
      root.innerHTML += `<div class="trip-film__empty"><span aria-hidden="true">▷</span><h3>${missing.length?'Your plan is ready. Its footage is still to come.':'Start with a place that draws you in.'}</h3><p>${missing.length?'There is no matched footage for these planned activities yet.':'Add activities to your itinerary to bring your trip film to life.'}</p><a class="linkbtn" href="#build">Return to your itinerary →</a></div>`;
      return;
    }
    root.innerHTML += `<div class="trip-film__screen"><div class="trip-film__picture"><img class="trip-film__backdrop" src="${esc(clips[0].poster)}" alt=""><video class="trip-film__video" muted playsinline preload="metadata" aria-label="Your itinerary film"></video><video class="trip-film__video" muted playsinline preload="none" aria-hidden="true"></video><div class="trip-film__shade"></div><span class="trip-film__credit">Myoko Days · fieldwork film</span><button type="button" class="trip-film__start" data-film-start aria-label="Play your trip film">▷<span>Play your trip</span></button></div><div class="trip-film__caption"><span class="label" data-film-day></span><h3 data-film-name></h3></div></div><div class="trip-film__controls"><button type="button" data-film-prev title="Previous activity" aria-label="Previous activity">←</button><button type="button" data-film-play aria-label="Play your trip film">Play</button><button type="button" data-film-next title="Next activity" aria-label="Next activity">→</button><label class="sr-only" for="filmSeek">Seek through your trip film</label><input id="filmSeek" type="range" min="0" max="${total}" value="0" step="0.1"><span class="trip-film__time" data-film-time></span><span class="trip-film__silent">Silent film</span></div><div class="trip-film__chapters" aria-label="Film chapters">${chapters.map(({c,i})=>`<button type="button" data-film-chapter="${i}" aria-label="Skip to ${esc(c.name)}, Day ${c.day}"><img src="${esc(c.poster)}" alt=""><span><small>Day ${c.day}</small>${esc(c.name)}</span></button>`).join('')}</div><p class="sr-only" data-film-status aria-live="polite"></p>`;
    const videos = [...root.querySelectorAll('video')], play = root.querySelector('[data-film-play]'), startButton = root.querySelector('[data-film-start]'), seek = root.querySelector('#filmSeek');
    const ac = new AbortController(), failed = new Set();
    let index = 0, active = 0, running = false, dead = false, generation = 0, loadingTimer;
    const listen = (el,event,fn) => el.addEventListener(event,fn,{signal:ac.signal});
    const clock = s => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
    const before = i => clips.slice(0,i).reduce((n,c)=>n+c.duration,0);
    const update = () => {
      if (dead) return;
      seek.value = Math.min(total,before(index)+(videos[active].currentTime||0));
      root.querySelector('[data-film-time]').textContent = `${clock(Number(seek.value))} / ${clock(total)}`;
      play.textContent = running?'Pause':'Play';
      play.setAttribute('aria-label',running?'Pause your trip film':'Play your trip film');
      startButton.hidden = running;
    };
    const load = (video,c) => {
      if(video.getAttribute('src')===c.src) return;
      video.src=c.src; video.poster=c.poster; video.preload='auto'; video.load();
    };
    const setRunning = on => {
      running=on; update();
      if(on) {
        const p=videos[active].play();
        p?.catch(()=>{ if(!dead){running=false;update();} });
      } else videos.forEach(v=>v.pause());
    };
    const show = (next, offset=0, shouldPlay=running) => {
      if(dead) return;
      clearTimeout(loadingTimer);
      const token=++generation;
      videos[active].pause();
      index=(next+clips.length)%clips.length;
      active=1-active;
      const video=videos[active], c=clips[index];
      videos.forEach((v,i)=>{v.classList.toggle('is-active',i===active);v.setAttribute('aria-hidden',String(i!==active));});
      root.querySelector('.trip-film__backdrop').src=c.poster;
      root.querySelector('[data-film-day]').textContent=`Day ${c.day} · activity ${chapters.findIndex(x=>x.c.id===c.id)+1} of ${chapters.length}`;
      root.querySelector('[data-film-name]').textContent=c.name;
      root.querySelector('[data-film-status]').textContent=`Day ${c.day}: ${c.name}`;
      root.querySelectorAll('[data-film-chapter]').forEach(b=>{const on=clips[Number(b.dataset.filmChapter)].id===c.id;b.classList.toggle('is-current',on);b.setAttribute('aria-current',on?'true':'false');});
      root.querySelector('[data-film-prev]').disabled=chapters.findIndex(x=>x.c.id===c.id)===0;root.querySelector('[data-film-next]').disabled=chapters.findIndex(x=>x.c.id===c.id)===chapters.length-1;
      const ready=()=>{
        if(dead||token!==generation) return;
        clearTimeout(loadingTimer);
        video.currentTime=Math.max(0,Math.min(offset,c.duration-.1));
        setRunning(shouldPlay);
        load(videos[1-active],clips[(index+1)%clips.length]);
      };
      load(video,c);
      if(video.readyState>=2) ready();
      else video.addEventListener('loadeddata',ready,{once:true,signal:ac.signal});
      loadingTimer=setTimeout(()=>{if(token===generation && video.readyState<2) fail(video);},12000);
      update();
    };
    const fail = video => {
      if(dead||video!==videos[active]) return;
      failed.add(index);
      if(failed.size===clips.length) {
        setRunning(false); startButton.hidden=true; play.disabled=true;
        root.querySelector('[data-film-status]').textContent='The film could not load. Your written itinerary is alongside.';
        root.querySelector('[data-film-name]').textContent='Your written itinerary is alongside.';
      } else {
        let next=(index+1)%clips.length;
        while(failed.has(next)) next=(next+1)%clips.length;
        show(next,0,running);
      }
    };
    videos.forEach(v=>{
      listen(v,'timeupdate',()=>{if(v===videos[active])update();});
      listen(v,'ended',()=>{if(v!==videos[active])return;if(index===clips.length-1){setRunning(false);seek.value=total;root.querySelector('[data-film-time]').textContent=`${clock(total)} / ${clock(total)}`;}else show(index+1);});
      listen(v,'error',()=>fail(v));
      listen(v,'playing',()=>{if(v===videos[active]){running=true;update();}});
    });
    listen(play,'click',()=>{if(!running&&videos[active].ended)show(0,0,true);else setRunning(!running);});
    listen(startButton,'click',()=>{if(videos[active].ended)show(0,0,true);else setRunning(true);});
    listen(root.querySelector('[data-film-prev]'),'click',()=>{const chapter=chapters[chapters.findIndex(x=>x.c.id===clips[index].id)-1];if(chapter)show(chapter.i);});
    listen(root.querySelector('[data-film-next]'),'click',()=>{const chapter=chapters[chapters.findIndex(x=>x.c.id===clips[index].id)+1];if(chapter)show(chapter.i);});
    root.querySelectorAll('[data-film-chapter]').forEach(b=>listen(b,'click',()=>show(Number(b.dataset.filmChapter))));
    listen(seek,'input',()=>{
      let value=Math.min(Number(seek.value),total-.1), target=0;
      while(target<clips.length-1&&value>=clips[target].duration){value-=clips[target].duration;target++;}
      show(target,value);
    });
    listen(document,'visibilitychange',()=>{if(document.hidden)setRunning(false);});
    listen(document,'fieldwork-gallery-open',()=>setRunning(false));
    dispose=()=>{dead=true;generation++;clearTimeout(loadingTimer);ac.abort();videos.forEach(v=>{v.pause();v.removeAttribute('src');v.load();});};
    const auto=!matchMedia('(prefers-reduced-motion: reduce)').matches&&!navigator.connection?.saveData;
    show(0,0,auto);
  }};

  // One modal, native focus trapping / Escape behaviour, no hidden video playback.
  const dialog=document.createElement('dialog');
  dialog.className='fieldwork-gallery';
  dialog.setAttribute('aria-labelledby','galleryTitle');
  document.body.append(dialog);
  let galleryItems=[], galleryIndex=0, returnFocus;
  function showGalleryItem(n) {
    dialog.querySelector('video')?.pause();
    galleryIndex=(n+galleryItems.length)%galleryItems.length;
    const item=galleryItems[galleryIndex],stage=dialog.querySelector('.fieldwork-gallery__stage');
    stage.innerHTML=item.type==='video'?`<video controls playsinline muted preload="metadata" poster="${esc(item.poster)}" src="${esc(item.src)}" aria-label="${esc(item.caption)}"></video>`:`<img src="${esc(item.src)}" alt="${esc(item.caption)}">`;
    const player=stage.querySelector('video');
    if(player){const playback=player.play();playback?.catch(()=>{});}
    dialog.querySelector('[data-gallery-caption]').textContent=item.caption;
    dialog.querySelector('[data-gallery-count]').textContent=`${galleryIndex+1} / ${galleryItems.length}${item.type==='video'?' · silent film':''}`;
    dialog.querySelectorAll('[data-gallery-item]').forEach((b,i)=>b.setAttribute('aria-current',i===galleryIndex?'true':'false'));
  }
  function openGallery(id, trigger) {
    const item=library[id];if(!item)return;
    returnFocus=trigger;
    galleryItems=[...item.photos.map(p=>({...p,type:'photo'})),...item.videos.map(v=>({...v,type:'video'}))];
    dialog.innerHTML=`<header><div><p class="label">${esc(item.credit)}</p><h2 id="galleryTitle">${esc(item.name)}</h2></div><button type="button" class="gallery-close" aria-label="Close activity gallery">Close ×</button></header><div class="fieldwork-gallery__stage"></div><div class="fieldwork-gallery__caption"><button type="button" data-gallery-prev aria-label="Previous photo or film">←</button><p data-gallery-caption></p><span data-gallery-count></span><button type="button" data-gallery-next aria-label="Next photo or film">→</button></div><div class="fieldwork-gallery__thumbs" aria-label="Photos and films">${galleryItems.map((p,i)=>`<button type="button" data-gallery-item="${i}" aria-label="${p.type==='video'?'Film':'Photo'} ${i+1}: ${esc(p.caption)}"><img src="${esc(p.poster||p.src)}" alt="">${p.type==='video'?'<span aria-hidden="true">▷</span>':''}</button>`).join('')}</div>`;
    showGalleryItem(0);document.dispatchEvent(new Event('fieldwork-gallery-open'));
    document.documentElement.classList.add('gallery-is-open');dialog.showModal();
  }
  document.addEventListener('click',e=>{const b=e.target.closest('[data-gallery]');if(b){e.preventDefault();openGallery(b.dataset.gallery,b);}});
  dialog.addEventListener('click',e=>{
    if(e.target.closest('.gallery-close'))dialog.close();
    else if(e.target.closest('[data-gallery-next]'))showGalleryItem(galleryIndex+1);
    else if(e.target.closest('[data-gallery-prev]'))showGalleryItem(galleryIndex-1);
    else {const b=e.target.closest('[data-gallery-item]');if(b)showGalleryItem(Number(b.dataset.galleryItem));}
  });
  dialog.addEventListener('keydown',e=>{if(e.target.tagName==='VIDEO')return;if(e.key==='ArrowRight'){e.preventDefault();showGalleryItem(galleryIndex+1);}if(e.key==='ArrowLeft'){e.preventDefault();showGalleryItem(galleryIndex-1);}});
  dialog.addEventListener('close',()=>{dialog.querySelector('video')?.pause();document.documentElement.classList.remove('gallery-is-open');returnFocus?.focus({preventScroll:true});dialog.innerHTML='';});
})();
