/* Display conversion only. All calculations and source prices remain in JPY. */
window.MD=window.MD||{};
MD.currency=(()=>{
  const codes=['JPY','SGD','USD','EUR','GBP','AUD','HKD'];
  let selected='SGD',rates={JPY:1,SGD:1/MD.data.yenPerSgd},date='',busy=false,failed=false;
  try{const pref=localStorage.getItem('md_currency');if(codes.includes(pref))selected=pref;const cache=JSON.parse(localStorage.getItem('md_fx')||'null');if(cache&&typeof cache.date==='string'&&codes.every(c=>c==='JPY'||Number.isFinite(cache.rates[c])&&cache.rates[c]>0)){rates={JPY:1,...Object.fromEntries(codes.filter(c=>c!=='JPY').map(c=>[c,cache.rates[c]]))};date=cache.date;}}catch(e){}
  const actual=()=>rates[selected]?selected:'JPY';
  const format=v=>new Intl.NumberFormat('en-US',{style:'currency',currency:actual(),currencyDisplay:'code',maximumFractionDigits:0}).format(Math.round(v*(rates[actual()]||1)));
  const note=()=>selected==='JPY'?'Source prices in JPY. All prices are planning estimates.':!rates[selected]?(busy?'Loading exchange rate; JPY shown meanwhile.':'Conversion unavailable; JPY shown. Select again to retry.'):date?`Reference conversion dated ${date} via Frankfurter${failed?' (cached; refresh unavailable)':''}. Estimates only; card and booking rates may differ.`:'SGD uses the original illustrative planning rate. Reference rates have not loaded.';
  const announce=()=>window.dispatchEvent(new Event('md-currency'));
  async function refresh(){if(busy)return;busy=true;failed=false;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7000);
    try{const res=await fetch('https://api.frankfurter.dev/v2/rates?base=JPY&quotes=SGD,USD,EUR,GBP,AUD,HKD',{signal:controller.signal});if(!res.ok)throw Error('FX response');const rows=await res.json(),next={JPY:1};let stamp='';for(const c of codes.filter(c=>c!=='JPY')){const row=rows.find(r=>r.quote===c);if(!row||!Number.isFinite(row.rate)||row.rate<=0||!/^\d{4}-\d{2}-\d{2}$/.test(row.date))throw Error('FX data');next[c]=row.rate;if(!stamp||row.date<stamp)stamp=row.date;}rates=next;date=stamp;try{localStorage.setItem('md_fx',JSON.stringify({rates,date}));}catch(e){}}
    catch(e){failed=true;}finally{clearTimeout(timer);busy=false;announce();}
  }
  function select(c){if(!codes.includes(c))return;selected=c;try{localStorage.setItem('md_currency',c);}catch(e){}if(c!=='JPY')refresh();announce();}
  return{codes,format,note,code:()=>selected,select,init:()=>{if(selected!=='JPY')refresh();}};
})();
