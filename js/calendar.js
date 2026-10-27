/* Price-led calendar. All displayed rates come from the same stay model as the quote. */
window.MD=window.MD||{};
MD.calendar=(()=>{
  const modes=new Map(),months=new Map(),iso=d=>MD.stay.iso(d),add=(s,n)=>MD.stay.addDays(s,n);
  const allowed=s=>s>=MD.app.today()&&[7,8,9,10].includes(Number(s.slice(5,7)))&&Number(s.slice(0,4))<=Number(MD.app.today().slice(0,4))+2;
  const monthLabel=s=>new Date(MD.stay.parse(s)).toLocaleDateString('en-GB',{month:'long',year:'numeric',timeZone:'UTC'});
  function neighbourMonth(s,n){const d=new Date(MD.stay.parse(s));d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+n);while(![6,7,8,9].includes(d.getUTCMonth()))d.setUTCMonth(d.getUTCMonth()+n);return iso(d);}
  function hasDates(s){const d=new Date(MD.stay.parse(s));return Array.from({length:31},(_,i)=>add(s,i)).some(x=>x.slice(0,7)===s.slice(0,7)&&allowed(x));}
  function render(id,value){
    const A=MD.app,S=A.S,priced=MD.stay.isStay(S.stay),k=MD.stay.isStay(S.stay)?S.stay:'madarao';
    let first=months.get(id)||value.slice(0,7)+'-01';if(!hasDates(first))first=value.slice(0,7)+'-01';months.set(id,first);
    const d=new Date(MD.stay.parse(first)),n=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate(),offset=(d.getUTCDay()+6)%7;
    const mode=modes.get(id)||'arrival',end=add(value,S.days-1),rates=Array.from({length:n},(_,i)=>MD.stay.nightRate(k,add(first,i)).rate),low=Math.min(...rates);
    const rate=s=>MD.stay.nightRate(k,s),money=v=>'¥'+Math.round(v/1000*10)/10+'k';
    const cells=Array.from({length:offset},()=>'<span class="pcal__blank" aria-hidden="true"></span>');
    for(let i=1;i<=n;i++){
      const s=add(first,i-1),valid=mode==='departure'?!MD.setup.range(value,s,A.today()).error:!MD.setup.range(s,add(s,S.days-1),A.today()).error,r=rate(s),on=s===value,last=s===end,range=s>value&&s<end,tier=!priced?'date':r.rate<=low*1.02?'value':r.rate<=low*1.2?'regular':'peak';
      const label=new Date(MD.stay.parse(s)).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
      cells.push(`<button type="button" class="pcal__day pcal__day--${tier}${on?' is-start':''}${last?' is-end':''}${range?' is-range':''}" data-cal-date="${s}"${valid?'':' disabled'} aria-pressed="${mode==='departure'?last:on}" aria-label="${A.esc(label)}${priced?', '+A.yen(r.rate)+' per room per night':''}${priced&&r.tags.length?', '+A.esc(r.tags.join(', ')):''}${on?', first day':last?', final day':''}"><span>${i}</span><small>${priced?money(r.rate):''}</small>${on?'<i>Arrive</i>':last?'<i>Depart</i>':''}</button>`);
    }
    const shift=n=>{const s=add(value,n),q=MD.stay.quote({...S,date:s,stay:k}),base=MD.stay.quote({...S,stay:k}),diff=q.total-base.total;return `<button type="button" data-cal-date="${s}" data-cal-shift class="pcal__shift"${MD.setup.range(s,add(s,S.days-1),A.today()).error?' disabled':''} aria-label="Start one day ${n<0?'earlier':'later'}"><span aria-hidden="true">${n<0?'←':'→'}</span><span>${n<0?'A day earlier':'A day later'}<small>${new Date(MD.stay.parse(s)).toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'})} · ${diff===0?'same stay total':(diff<0?'save ':'+')+A.yen(Math.abs(diff))}${MD.stay.isStay(S.stay)?'':' reference stay'}</small></span></button>`;};
    const previous=neighbourMonth(first,-1),next=neighbourMonth(first,1);
    const year=d.getUTCFullYear(),month=d.getUTCMonth()+1,baseYear=Number(A.today().slice(0,4));
    const monthOptions=[7,8,9,10].map(m=>`<option value="${m}"${hasDates(`${year}-${String(m).padStart(2,'0')}-01`)?'':' disabled'}${m===month?' selected':''}>${new Date(Date.UTC(2000,m-1,1)).toLocaleDateString('en-GB',{month:'long',timeZone:'UTC'})}</option>`).join('');
    const yearOptions=Array.from({length:3},(_,i)=>baseYear+i).map(y=>`<option value="${y}"${y===year?' selected':''}>${y}</option>`).join('');
    return `<section id="${id}" class="pcal" aria-label="Arrival and departure"><div class="pcal__month"><header class="pcal__head"><button type="button" data-cal-nav="${previous}" aria-label="Previous month"${hasDates(previous)?'':' disabled'}>←</button><div><p class="label">${priced?'Nightly Price Guide':'Choose Your Dates'}</p><div class="pcal__jump"><select data-cal-month aria-label="Calendar month">${monthOptions}</select><select data-cal-year aria-label="Calendar year">${yearOptions}</select></div><h3 class="sr-only">${monthLabel(first)}</h3></div><button type="button" data-cal-nav="${next}" aria-label="Next month"${hasDates(next)?'':' disabled'}>→</button></header><div class="pcal__mode" role="group" aria-label="Select date type"><button type="button" data-cal-mode="arrival" aria-pressed="${mode==='arrival'}">Arrival</button><button type="button" data-cal-mode="departure" aria-pressed="${mode==='departure'}">Departure</button></div><div class="pcal__week" aria-hidden="true">${['M','T','W','T','F','S','S'].map(x=>'<span>'+x+'</span>').join('')}</div><div class="pcal__grid">${cells.join('')}</div>${priced?'<div class="pcal__legend"><span class="value">Lower</span><span class="regular">Standard</span><span class="peak">Higher</span><small>Room / Night · JPY</small></div>':''}</div><div class="pcal__summary"><p class="pcal__eyebrow">Your dates</p><div class="pcal__quick"><div class="pcal__date-fields"><label>Arrival<input type="date" data-cal-quick value="${value}" min="${A.today()}" max="${baseYear+2}-10-31" aria-label="Arrival date" aria-describedby="${id}-quick-error"></label><label>Departure<input type="date" data-cal-end value="${end}" min="${add(value,2)}" max="${add(value,6)}" aria-label="Departure date" aria-describedby="${id}-quick-error"></label></div><p id="${id}-quick-error" class="pcal__error" data-cal-error role="status" hidden></p><small>July–October · 3–7 days</small></div><div class="pcal__range"><b>${A.esc(A.dayShort(0))} <i aria-hidden="true">→</i> ${A.esc(A.dayShort(S.days-1))}</b><small>${S.days} days · ${S.days-1} nights</small></div><p class="pcal__quote">${MD.stay.isStay(S.stay)?`<b>${A.yen(MD.stay.quote(S).total)} · complete stay</b>${MD.stay.quote(S).rooms} ${MD.stay.quote(S).rooms===1?'room':'rooms'}, ${S.days-1} nights · ${A.sgd(MD.stay.quote(S).perPerson)} per person`:'Stay booked separately.'}</p>${priced?`<div class="pcal__neighbours">${shift(-1)}${shift(1)}</div>`:''}</div></section>`;
  }
  document.addEventListener('change',e=>{
    const input=e.target,box=input.closest('.pcal');if(!box)return;const id=box.id;
    if(input.matches('[data-cal-quick],[data-cal-end]')){
      const A=MD.app,isEnd=input.matches('[data-cal-end]'),arrival=isEnd?A.S.date:input.value,departure=isEnd?input.value:add(input.value,A.S.days-1),result=MD.setup.range(arrival,departure,A.today());
      if(result.error){const error=box.querySelector('[data-cal-error]');error.textContent=result.error;error.hidden=false;input.setAttribute('aria-invalid','true');return;}
      const top=scrollY;months.set(id,arrival.slice(0,7)+'-01');A.setDates(arrival,departure);if(location.hash==='#plan')A.renderPlan();else box.outerHTML=render(id,A.S.date);requestAnimationFrame(()=>window.scrollTo({top,behavior:'instant'}));return;
    }
    if(!input.matches('[data-cal-month],[data-cal-year]'))return;
    const y=Number(box.querySelector('[data-cal-year]').value),m=Number(box.querySelector('[data-cal-month]').value);
    let first=`${y}-${String(m).padStart(2,'0')}-01`;
    if(!hasDates(first)){
      const valid=[7,8,9,10].map(n=>`${y}-${String(n).padStart(2,'0')}-01`).filter(hasDates);first=valid[0]||MD.app.S.date.slice(0,7)+'-01';
    }
    months.set(id,first);box.outerHTML=render(id,MD.app.S.date);
  });
  document.addEventListener('click',e=>{
    const toggle=e.target.closest('[data-cal-mode]');if(toggle){const box=toggle.closest('.pcal'),id=box.id;modes.set(id,toggle.dataset.calMode);box.outerHTML=render(id,MD.app.S.date);document.getElementById(id)?.querySelector('[data-cal-mode="'+toggle.dataset.calMode+'"]')?.focus({preventScroll:true});return;}
    const nav=e.target.closest('[data-cal-nav]');if(nav){const box=nav.closest('.pcal');months.set(box.id,nav.dataset.calNav);box.outerHTML=render(box.id,MD.app.S.date);document.getElementById(box.id)?.querySelector('[data-cal-nav]')?.focus({preventScroll:true});return;}
    const pick=e.target.closest('[data-cal-date]');if(!pick)return;const A=MD.app,id=pick.closest('.pcal').id,top=window.scrollY;
    months.set(id,pick.dataset.calDate.slice(0,7)+'-01');if(modes.get(id)==='departure'&&!pick.hasAttribute('data-cal-shift'))A.setDates(A.S.date,pick.dataset.calDate);else A.setDate(pick.dataset.calDate);if(location.hash==='#plan')A.renderPlan();else document.getElementById(id).outerHTML=render(id,A.S.date);
    requestAnimationFrame(()=>{window.scrollTo({top,behavior:'instant'});document.getElementById(id)?.querySelector('.is-start')?.focus({preventScroll:true});});
  });
  return{render,allowed};
})();
