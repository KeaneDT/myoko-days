/* Shared setup validation: no DOM, prices or itinerary mutation. */
window.MD=window.MD||{};
MD.setup=(()=>{
  const party=(n,fallback=2)=>Number.isInteger(n)&&n>=1&&n<=9?n:fallback;
  const rooms=(n,p)=>Number.isInteger(n)?Math.max(Math.ceil(p/2),Math.min(p,n)):Math.ceil(p/2);
  function range(arrival,departure,today){
    if(!MD.planner.validDate(arrival)||!MD.planner.validDate(departure))return{error:'Choose valid arrival and departure dates.'};
    const days=Math.round((MD.stay.parse(departure)-MD.stay.parse(arrival))/86400000)+1;
    if(arrival<today)return{error:'Choose an arrival date from today onwards.'};
    if(days<3||days>7)return{error:'Choose a trip of 3–7 days (2–6 nights).'};
    if(arrival.slice(0,4)!==departure.slice(0,4)||![7,8,9,10].includes(+arrival.slice(5,7))||![7,8,9,10].includes(+departure.slice(5,7))||+arrival.slice(0,4)>+today.slice(0,4)+2)return{error:'Choose dates within July–October, up to two years ahead.'};
    return{days,nights:days-1};
  }
  return{party,rooms,range};
})();
