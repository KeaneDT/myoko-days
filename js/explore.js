/* Home's independent, read-only diorama. No planning callbacks or shared camera. */
(function () {
  'use strict';
  const dialog = document.createElement('dialog');
  dialog.className = 'map-explorer';
  dialog.setAttribute('aria-labelledby', 'exploreTitle');
  dialog.innerHTML = `<div class="map-explorer__sheet"><header class="map-explorer__head"><div><p class="label">Myoko, illustrated</p><h2 id="exploreTitle">A little closer to Myoko.</h2></div><button type="button" class="map-explorer__close" aria-label="Close map preview">×</button></header><div class="map-explorer__map" aria-label="Explore Myoko's places. Drag to move, scroll or pinch to zoom; hover or tap a place for photographs."></div><footer class="map-explorer__foot"><p>Drag to explore · Zoom to discover · Hover or tap for photos</p><button type="button" class="btn" data-explore-plan>Play your itinerary <span class="arrow" aria-hidden="true"></span></button></footer></div>`;
  document.body.append(dialog);
  let map, trigger;
  const container = dialog.querySelector('.map-explorer__map');
  function open(button) {
    trigger = button;
    dialog.showModal();
    document.documentElement.classList.add('map-explorer-open');
    if (!map) {
      map = MD.createMap({preview:true});
      map.init(container, {onPin:id=>map.inspect(id), onReady:()=>map.setActive(dialog.open)});
      // Browsing shows every place, with no selected hotel, trip, filters or day routes.
      map.update({sel:new Set(),placements:{},focus:null,target:null,catFilter:[],query:'',fitsOnly:false,showExtras:true,stay:'own',date:'2027-09-07',month:9,days:4,walk:5}, null);
    }
    map.setActive(true);
    requestAnimationFrame(()=>map.resize());
  }
  document.addEventListener('click', e=>{
    const button=e.target.closest('[data-open-explorer]');
    if(button)open(button);
  });
  dialog.querySelector('.map-explorer__close').addEventListener('click',()=>dialog.close());
  dialog.querySelector('[data-explore-plan]').addEventListener('click',()=>{dialog.close();location.hash='#plan';});
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
  dialog.addEventListener('close',()=>{
    map?.setActive(false);
    document.documentElement.classList.remove('map-explorer-open');
    trigger?.focus({preventScroll:true});
  });
  document.addEventListener('fieldwork-gallery-open',()=>{if(dialog.open)map?.setActive(false);});
  const gallery=document.querySelector('.fieldwork-gallery');
  gallery?.addEventListener('close',()=>{if(dialog.open)map?.setActive(true);});
  window.addEventListener('hashchange',()=>{if(dialog.open)dialog.close();});
})();
