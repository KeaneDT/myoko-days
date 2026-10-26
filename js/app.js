/* Myoko Days — core: state, planning actions, home / plan / review pages, router.
   The build workspace (map + days dock) lives in js/studio.js and reads everything through MD.app. */
(function () {
  "use strict";
  const D = MD.data, P = MD.planner;
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const yen = v => "¥" + Math.round(v).toLocaleString("en-US");
  const sgd = v => "S$" + Math.round(v / D.yenPerSgd).toLocaleString("en-US");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const smooth = reduceMotion ? "auto" : "smooth";
  const ARROW = '<span class="arrow" aria-hidden="true"></span>';
  const MIN_DAYS = P.RULES.minDays, MAX_DAYS = P.RULES.maxDays;

  /* ---------- state ---------- */
  const S = {
    who: "couple", walk: 4, days: 4, month: 9, course: "restore", flex: true,
    sel: new Set(), placements: {}, stay: "madarao", date: "2027-09-07",
    focus: null, target: null,                       // target = { day, slot|null }: where the next added place should go
    catFilter: [], fitsOnly: false, showExtras: false, query: "",
    removed: []
  };
  const KEY = "md_trip_v10";
  const persist = () => ({ who: S.who, walk: S.walk, days: S.days, month: S.month, course: S.course, flex: S.flex, sel: [...S.sel], stay: S.stay, date: S.date, placements: S.placements });
  function save() { try { localStorage.setItem(KEY, JSON.stringify(persist())); } catch (e) { /* private mode or blocked storage */ } }
  const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const localDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  let hasSavedTrip = false;
  (function load() {
    try {
      const o = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!o || typeof o !== "object" || !Array.isArray(o.sel)) return;
      hasSavedTrip = true;
      if (D.who.some(w => w[0] === o.who)) S.who = o.who;
      if ([3, 4, 5].includes(o.walk)) S.walk = o.walk;
      if (Number.isInteger(o.days) && o.days >= MIN_DAYS && o.days <= MAX_DAYS) S.days = o.days;
      if (typeof o.flex === "boolean") S.flex = o.flex;
      if (o.course === "blank" || D.courses[o.course]) S.course = o.course;
      if (MD.stay.OPTIONS[o.stay]) S.stay = o.stay;
      else if (o.base && o.base !== "madarao") S.stay = "own";                       // an older save: anything but the Madarao hotel meant "somewhere else"
      if (P.validDate(o.date) && D.months[Number(o.date.slice(5, 7))] && o.date >= today()) S.date = o.date;
      S.month = Number(S.date.slice(5, 7));
      S.sel = new Set(o.sel.filter(id => D.byId[id]));
      if (o.placements && typeof o.placements === "object" && !Array.isArray(o.placements)) {
        S.placements = Object.fromEntries(Object.entries(o.placements).filter(([id, p]) => D.byId[id] && p && Number.isInteger(p.day) && p.day >= 0 && p.day < S.days && ["am", "pm", "x"].includes(p.slot)).map(([id, p]) => [id, { day: p.day, slot: p.slot, locked: !!p.locked }]));
      }
    } catch (e) { /* ignore a broken save */ }
  })();

  const snap = () => ({ sel: [...S.sel], course: S.course, walk: S.walk, days: S.days, month: S.month, flex: S.flex, removed: S.removed.slice(), placements: JSON.parse(JSON.stringify(S.placements)), date: S.date, stay: S.stay, target: S.target && { ...S.target } });
  function restore(s) {
    S.sel = new Set(s.sel); S.course = s.course; S.walk = s.walk; S.days = s.days; S.month = s.month; S.flex = s.flex !== false; S.removed = s.removed || [];
    S.placements = JSON.parse(JSON.stringify(s.placements || {})); S.date = s.date || S.date; S.stay = s.stay || S.stay; S.target = s.target || null;
    changed();
  }

  /* anything that changes the trip calls changed(): save, then redraw whoever is listening */
  const listeners = [];
  function changed(meta) { save(); setCount(); listeners.forEach(fn => fn(meta || {})); }
  function setCount() { const n = $("#navcount"); if (n) { const b = $("#navn"); if (b) b.textContent = S.sel.size; n.dataset.n = S.sel.size; n.title = S.sel.size + (S.sel.size === 1 ? " place" : " places") + " in your trip"; const em = n.querySelector("em"); if (em) em.textContent = S.sel.size === 1 ? " place" : " places"; } }

  /* ---------- small helpers ---------- */
  function toast(msg, o) {
    o = o || {};
    if (currentView === "plan") return;   // the Plan page changes things quietly in the background; no pop-ups there
    const box = $("#toasts"); if (!box) return;
    while (box.children.length >= 2) box.firstChild.remove();   // two at most; the oldest makes way
    const t = document.createElement("div");
    t.className = "toast" + (o.kind ? " toast--" + o.kind : "");
    t.setAttribute("role", "status");
    const m = document.createElement("span"); m.textContent = msg; t.appendChild(m);
    const gone = () => { t.classList.remove("is-in"); setTimeout(() => t.remove(), 600); };   // fades out, then goes
    const addBtn = (label, fn) => { const b = document.createElement("button"); b.type = "button"; b.className = "toast__undo"; b.textContent = label; b.addEventListener("click", () => { fn(); gone(); }); t.appendChild(b); };
    if (o.undo) addBtn("Undo", o.undo);
    if (o.act) addBtn(o.act.label, o.act.fn);
    box.appendChild(t);
    requestAnimationFrame(() => t.classList.add("is-in"));
    setTimeout(gone, o.undo || o.act ? 5000 : 3200);
  }
  let revealObs = null;
  function reveal() {
    const els = $$("[data-reveal]:not(.is-visible)");
    if (reduceMotion || !("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("is-visible")); return; }
    revealObs = revealObs || new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-visible"); revealObs.unobserve(e.target); } }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach(e => revealObs.observe(e));
  }
  function countUp(el, from, to) {
    if (!el) return;
    if (reduceMotion || from === to) { el.textContent = sgd(to); return; }
    const t0 = performance.now(), dur = 520;
    const step = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = sgd(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  const lunches = n => n + (n === 1 ? " lunch" : " lunches");
  const priceTxt = a => a.price == null || a.price === 0 ? "Free" : yen(a.price);
  const lenTxt = a => a.u === 2 ? "Full day" : a.u === 1 ? (a.w === "am" ? "Morning" : a.w === "pm" ? "Afternoon" : "Half day") : a.slot === "eve" ? "Evening" : "Short stop";
  const MON = { 7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct" };
  function runsTxt(a) {
    const m = Object.keys(D.months).map(Number).filter(x => a.months.includes(x));
    if (m.length === 4) return "Jul to Oct";
    if (m.length === 1) return MON[m[0]] + " only";
    return m.every((x, i) => !i || x === m[i - 1] + 1) ? MON[m[0]] + " to " + MON[m[m.length - 1]] : m.map(x => MON[x]).join(", ");
  }
  const isPinned = a => !!a.art;
  const CATS = { water: "Water", walk: "Walks", food: "Food", leaf: "Nature", culture: "Culture", onsen: "Onsen", bike: "Cycling", sky: "Views", craft: "Crafts" };
  const WALK_LABEL = { 3: "Flat & short", 4: "Some hills", 5: "Active days" };
  const thumb = a => a.img ? `assets/thumb/${a.img}.jpg` : null;
  const SLOT_NAME = { am: "morning", pm: "afternoon", x: "" };
  const dateLabel = i => { const d = P.dateAt(S, i); return d ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : `Day ${i + 1}`; };
  const dayShort = i => { const d = P.dateAt(S, i); return d ? d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : `Day ${i + 1}`; };
  const dayLong = i => { const d = P.dateAt(S, i); return d ? d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : `Day ${i + 1}`; };
  const where = pl => pl ? `Day ${pl.day + 1}${pl.slot === "am" ? " morning" : pl.slot === "pm" ? " afternoon" : ""}` : "";
  const avail = a => P.availability(a, S);            // hard blocks only (closed, not a day-by-day activity)
  const caution = (a, day) => P.caution(a, S, day);   // soft notes: more walking than chosen, outside the listed season

  /* ---------- planning actions (used by every part of the interface) ---------- */
  function sentence(r, a) {
    let s = `Added ${a.name} to ${where(r.placed)}`;
    if (r.retargeted) s += " (the day you chose didn't suit it)";
    if (r.extended) s = `Added a day to fit ${a.name} (${r.days} days now). It's on ${where(r.placed)}`;
    if (r.caution) s += `. Note: ${r.caution.charAt(0).toLowerCase() + r.caution.slice(1)}`;
    if (r.moved && r.moved.length) {
      const m = r.moved.map(x => `${D.byId[x.id].name} to ${where(x.to)}`);
      s += `. Moved ${m.length > 2 ? m.length + " activities" : m.join(" and ")} to make room`;
    }
    return s;
  }
  /* Add a place. Returns the planner result; on failure nothing changes and result.options says what could help. */
  function addPlace(id, o) {
    o = o || {};
    const a = D.byId[id]; if (!a) return { ok: false, why: "Unknown activity", options: [] };
    if (S.sel.has(id) && !o.auto) return { ok: true, already: true };
    const t = o.target === undefined ? S.target : o.target;
    const before = snap();
    const r=o.auto?P.add(S,id,{targetDay:null,lock:false}):P.direct(S,id,t);
    if(!r.ok){requestPlacement(id,t,r.why);return r;}
    S.sel.add(id); S.placements = r.placements; S.days = r.days || S.days; S.removed = [];
    S.focusNew = id;
    changed({ added: id, moved: (r.moved || []).map(m => m.id), before });
    if (!(currentView === "build" && MD.studio)) toast(sentence(r, a), { undo: () => restore(before) });
    return r;
  }
  function requestPlacement(id,target,why){
    const a=D.byId[id];if(!a)return;
    let dlg=document.getElementById('placementDialog');if(!dlg){dlg=document.createElement('dialog');dlg.id='placementDialog';dlg.className='plan-conflict';dlg.setAttribute('aria-labelledby','conflictTitle');document.body.appendChild(dlg);}
    const choices=[],seen=new Set();
    const offer=(label,r,removed=[])=>{if(!r?.ok)return;const key=JSON.stringify([r.placements,removed]);if(seen.has(key))return;seen.add(key);choices.push({label,r,removed});};
    const temp={...S,sel:new Set([...S.sel,id])};
    P.candidates(a,S).forEach(c=>offer(`${S.sel.has(id)?'Move':'Add'} ${a.name} to Day ${c.day+1} ${c.slot==='am'?'morning':'afternoon'}${P.isLong(a)?' · full day':''}`,P.direct(temp,id,{day:c.day,slot:c.slot})));
    const occupied=target?Object.entries(S.placements).filter(([key,p])=>key!==id&&p.day===target.day&&(P.isLong(a)||P.isLong(D.byId[key])||!target.slot||p.slot===target.slot)).map(([key])=>key):[...S.sel].filter(x=>x!==id);
    occupied.forEach(other=>{
      const without={...temp,sel:new Set([...temp.sel].filter(x=>x!==other)),placements:{...temp.placements}};delete without.placements[other];
      const replaced=P.direct(without,id,target);
      offer(`Remove ${D.byId[other].name}; ${S.sel.has(id)?'move':'add'} ${a.name}${replaced?.placed?' to '+where(replaced.placed):''}`,replaced,[other]);
      if(target){
        for(const c of P.candidates(D.byId[other],S)){
          if(c.day===target.day&&(!target.slot||c.slot===target.slot))continue;
          const moved=P.direct(temp,other,{day:c.day,slot:c.slot});if(!moved.ok)continue;
          const placed=P.direct({...temp,placements:moved.placements},id,target);
          if(placed.ok){offer(`Move ${D.byId[other].name} to ${where(moved.placed)}; place ${a.name} here`,placed);break;}
        }
      }
    });
    if(target&&occupied.length>1){const cleared={...temp,sel:new Set([...temp.sel].filter(x=>!occupied.includes(x))),placements:{...temp.placements}};occupied.forEach(x=>delete cleared.placements[x]);offer(`Remove ${occupied.map(x=>D.byId[x].name).join(' and ')}; place ${a.name} here`,P.direct(cleared,id,target),occupied);}
    if(S.days<MAX_DAYS&&!choices.some(c=>!c.removed.length)){const r=P.direct({...temp,days:S.days+1},id,null);offer(`Extend the trip to ${S.days+1} days; place ${a.name}${r.placed?' on '+where(r.placed):''}`,r);}
    dlg.innerHTML=`<p class="label">Your itinerary · your choice</p><h2 id="conflictTitle">Make room for ${esc(a.name)}</h2><p>${esc(why||'Choose a new block or remove this activity.')} Nothing will change until you choose.</p><div class="plan-conflict__choices">${choices.map((c,i)=>`<button type="button" data-placement-choice="${i}">${esc(c.label)}</button>`).join('')}${S.sel.has(id)?`<button type="button" data-placement-remove>Remove ${esc(a.name)} from my trip</button>`:''}</div><button type="button" class="plan-conflict__cancel" data-placement-cancel>Keep my plan unchanged</button>`;
    dlg.onclick=e=>{
      if(e.target===dlg||e.target.closest('[data-placement-cancel]')){dlg.close();return;}
      if(e.target.closest('[data-placement-remove]')){dlg.close();removePlace(id);return;}
      const b=e.target.closest('[data-placement-choice]');if(!b)return;const c=choices[Number(b.dataset.placementChoice)],before=snap();
      c.removed.forEach(key=>S.sel.delete(key));S.sel.add(id);S.placements=c.r.placements;S.days=c.r.days||S.days;dlg.close();changed({added:id,moved:[id],before});if(currentView!=="build")toast(c.label,{undo:()=>restore(before)});
    };
    if(!dlg.open)dlg.showModal();
  }
  function removePlace(id) {
    const a = D.byId[id]; if (!a || !S.sel.has(id)) return;
    const before = snap();
    S.sel.delete(id); delete S.placements[id]; S.removed = [];
    if (S.focus === id && !S.keepFocusOnRemove) { /* keep the card open so the visitor can re-add */ }
    changed({ removed: id });
    toast(`Removed ${a.name}`, { undo: () => restore(before) });
  }
  function togglePlace(id) { return S.sel.has(id) ? (removePlace(id), { ok: true }) : addPlace(id); }
  function placeManual(id, day, slot) {
    const before = snap();
    const isNew = !S.sel.has(id);
    const tmp = isNew ? { ...S, sel: new Set([...S.sel, id]) } : S;
    const r = P.place(tmp, id, day, slot);
    if (!r.ok) { requestPlacement(id,{day,slot},r.why); return r; }
    if (isNew) S.sel.add(id);
    S.placements = r.placements; S.days = r.days || S.days;
    changed({ added: isNew ? id : null, moved: [id, ...(r.moved || []).map(m => m.id)] });
    const a = D.byId[id];
    const extra = r.swapped ? ` Swapped with ${D.byId[r.swapped].name}.` : (r.moved && r.moved.length ? ` Moved ${D.byId[r.moved[0].id].name} to ${where(r.moved[0].to)}.` : "");
    const cn = caution(a, r.placed && r.placed.day);
    toast(`${a.name} is on ${where(r.placed)}.${extra}${cn ? ` Note: ${cn.charAt(0).toLowerCase() + cn.slice(1)}.` : ""}${r.extended ? ` Added a day (${S.days} days now).` : ""}`, { undo: () => restore(before) });
    return r;
  }
  function moveToDay(id, day) {
    const before = snap();
    const r = P.move(S, id, day);
    if (!r.ok) { requestPlacement(id,{day},r.why); return r; }
    S.placements = r.placements; S.days = r.days || S.days;
    changed({ moved: [id] });
    toast(day === -1 ? "Taken out of your days" : `${D.byId[id].name} moved to ${where(r.placed)}`, { undo: () => restore(before) });
    return r;
  }
  /* After any setting changes: drop what can no longer happen, re-fit the rest. Returns the names that were taken out. */
  function reconcile(){
    // Keep the visitor's choices and exact placements. Invalid/overfull items remain visibly unresolved.
    const overflow=P.schedule(S).overflow;
    if(S.target&&S.target.day>=S.days)S.target=null;
    S.removed=overflow.map(a=>({name:a.name,why:'Choose a new block or remove this activity'}));
    return S.removed;
  }
  function changeSetting(k, v) {
    const before = snap();
    S[k] = v;
    if (k === "month") { const d = new Date(S.date + "T12:00:00"); d.setDate(1); d.setMonth(v - 1); if (localDate(d) < today()) d.setFullYear(d.getFullYear() + 1); S.date = localDate(d); }
    const gone = reconcile();
    changed({ settings: true });
    toast(gone.length ? `Kept your choices. ${gone.length} need a new block; choose where to move them in Build.` : "Updated. Your activities stay where you placed them.", { kind: gone.length ? "warn" : "", undo: () => restore(before) });
    return gone;
  }
  /* the stay: one of the three PCG properties, or "own" (activities only). It never touches the days. */
  const stayName = k => MD.stay.OPTIONS[k].name;
  function setStay(k, quiet) {
    if (!MD.stay.OPTIONS[k] || k === S.stay) return;
    const before = snap();
    S.stay = k;
    changed({ settings: true, stay: true });
    if (!quiet) toast(k === "own" ? "Activities only. Your days start from Myoko-Kogen Station." : "Staying at " + stayName(k) + ".", { undo: () => restore(before) });
  }
  function setDate(value) {
    if (!P.validDate(value) || value < today() || !D.months[Number(value.slice(5, 7))]) {
      toast("Choose a first day from today onwards, between July and October", { kind: "warn" });
      changed({ settings: true }); return false;
    }
    const before = snap();
    S.date = value; S.month = Number(value.slice(5, 7));
    const gone = reconcile();
    changed({ settings: true });
    toast(gone.length ? `New dates. ${gone.length} choices need a new block; nothing was removed.` : "New dates. Your activity order is unchanged.", { kind: gone.length ? "warn" : "", undo: () => restore(before) });
    return true;
  }
  /* Start from a sample itinerary or a blank page */
  function coursePreview(key) {
    const c = D.courses[key];
    const ids = c.ids.filter(id => !avail(D.byId[id]) && !caution(D.byId[id]));   // a ready-made trip respects your settings; adding by hand never does
    const tmp = { ...S, sel: new Set(ids), placements: {} };
    const r = P.fit(tmp), fitted = ids.filter(id => !r.dropped.includes(id));
    return { ids: fitted, placements: r.placements, yen: fitted.reduce((n, id) => n + (D.byId[id].price || 0), 0), tbc: 0, dropped: c.ids.length - fitted.length };
  }
  function startCourse(key) {
    const pv = coursePreview(key);
    S.course = key; S.removed = []; S.focus = null; S.target = null;
    S.sel = new Set(pv.ids); S.placements = pv.placements;
    return pv.dropped ? [`${pv.dropped} left out to respect your settings`] : [];
  }
  function startBlank() { S.course = "blank"; S.sel = new Set(); S.placements = {}; S.removed = []; S.focus = null; S.target = null; }
  function pickCourse(v) {
    const before = snap();
    const note = v === "blank" ? (startBlank(), []) : startCourse(v);
    changed({ restart: true });
    toast(v === "blank" ? "Started with a blank map" : "Started from " + D.courses[v].name + (note.length ? ", " + note.join(", ") : ""), { undo: () => restore(before) });
  }
  function clearTrip() { const before = snap(); startBlank(); changed({ restart: true }); toast("Cleared your trip", { undo: () => restore(before) }); }

  /* ---------- home ---------- */
  function recWhy() {
    if (S.walk >= 5) return "You chose active days.";
    if (S.who === "friends") return "You're travelling with friends.";
    if (S.who === "family") return "A starting point to adapt to your group; walking limits are kept.";
    return S.walk <= 3 ? "You prefer flat, short walks." : "You're comfortable with some hills and steps.";
  }
  function courseCard(key, i, rec) {
    const c = D.courses[key], pv = coursePreview(key), sq = MD.stay.quote(S);
    const ef = Math.max(0, ...pv.ids.map(id => D.byId[id].ef));
    return `<article class="shape${rec ? " is-rec" : ""}" data-reveal style="--d:${(i * 0.1).toFixed(1)}s">
      <div class="shape__img">${c.img ? `<img src="assets/img/${esc(c.img)}.jpg" alt="Team fieldwork · ${esc(c.ph)}" loading="lazy" decoding="async">` : ""}<span class="shape__n">0${i + 1}</span>${rec ? '<span class="shape__flag">Suggested</span>' : ""}</div>
      <div class="shape__body">
        <p class="label">${esc(c.for)}</p>
        <h3 class="shape__title">${esc(c.name)}</h3>
        <p class="shape__promise">${esc(c.promise)}</p>
        ${rec ? `<p class="shape__why">${esc(recWhy())}</p>` : ""}
        <p class="shape__meta">${S.days} days · ${D.effort[ef] || "Choose your pace"} walking · ${lunches(pv.ids.filter(id => D.byId[id].lunch).length)}</p>
        <ul class="shape__list">${pv.ids.map(id => `<li>${esc(D.byId[id].name)}</li>`).join("")}</ul>
        <p class="shape__drop">${pv.ids.length} ${pv.ids.length === 1 ? "stop" : "stops"} across your days.${pv.dropped ? ` ${pv.dropped} left out to respect your settings.` : ""}</p>
        <div class="shape__foot">
          <div class="shape__price"><small>Activities</small><b>${pv.yen ? yen(pv.yen) : "Free"}</b>${sq.stay ? `<span class="shape__with">With ${esc(sq.option.name)}: <span class="shape__with-n">${sgd(pv.yen + sq.perPerson)}</span> per person</span>` : ""}</div>
          <button type="button" class="link-arrow" data-course="${key}">Start this itinerary ${ARROW}</button>
        </div>
      </div></article>`;
  }
  function renderHome() {
    $("#homeCourses").innerHTML = ["restore", "discover", "active"].map((k, i) => courseCard(k, i)).join("");
    $("#homeHosts").innerHTML = D.hosts.map((h, i) => `<li class="host" data-reveal style="--d:${(i * 0.06).toFixed(2)}s"><span class="host__n">0${i + 1}</span><span class="host__name">${esc(h[0])}</span><span class="host__org">${esc(h[1])}</span><span class="host__role">${esc(h[2])}</span></li>`).join("");
    $("#fieldworkJournal").innerHTML = ["coffee", "apple", "sake"].map(id => `<button type="button" data-gallery="${id}"><img src="${MD.mediaLibrary[id].photos[0].src}" alt="" loading="lazy"><span><small>From our fieldwork</small>${esc(MD.mediaLibrary[id].name)} <i aria-hidden="true">↗</i></span></button>`).join("");
    $("#homeStrip").innerHTML = [["naena", 0, "Naena Falls"], ["winery", 0, "St Cousair vineyard"], ["sup", 0, "Lake Nojiri · paddling"], ["soba", 0, "Soba, made by hand"], ["daruma", 0, "Daruma painting"], ["ebike", 1, "Kurohime rice fields"]].map(([id, n, cap]) => `<figure><button type="button" data-gallery="${id}" aria-label="View ${esc(MD.mediaLibrary[id].name)} photos and films"><img src="${MD.mediaLibrary[id].photos[n].src}" alt="${esc(MD.mediaLibrary[id].photos[n].caption)}" loading="lazy" decoding="async"><figcaption>${esc(cap)}<span aria-hidden="true"> ↗</span></figcaption></button></figure>`).join("");
  }

  /* ---------- day-first date control: three selects, so 7/9 can never be read as 9 July, and no past or out-of-season date can be picked ---------- */
  const MONTH_NAMES = { 7: "July", 8: "August", 9: "September", 10: "October" };
  const dim = (y, m) => new Date(y, m, 0).getDate();
  function dateAllowed() {
    const [ty, tm, td] = today().split("-").map(Number);
    const monthsFor = y => [7, 8, 9, 10].filter(m => y > ty || (y === ty && m >= tm));
    const years = []; for (let y = ty; y <= ty + 2; y++) if (monthsFor(y).length) years.push(y);
    const minDay = (y, m) => (y === ty && m === tm ? td : 1);
    return { years, monthsFor, minDay };
  }
  function snapDate(y, m, d) {
    const A_ = dateAllowed();
    if (!A_.years.includes(y)) y = A_.years[0];
    const ms = A_.monthsFor(y); if (!ms.includes(m)) m = ms.find(x => x >= m) || ms[ms.length - 1];
    d = Math.max(A_.minDay(y, m), Math.min(dim(y, m), d));
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  function dateControl(id, value) {
    return MD.calendar.render(id,value);
  }

  function readDate(el) {
    const g = k => Number(el.querySelector(`[data-dpart="${k}"]`).value);
    return snapDate(g("y"), g("m"), g("d"));
  }

  /* ---------- plan ---------- */
  /* ---------- the stay: three PCG properties priced for your dates, or somewhere else ---------- */
  const PEAKS = n => `<svg class="stay-card__peaks" viewBox="0 0 48 22" width="40" height="18" aria-hidden="true" focusable="false"><path d="${["M4 20 24 4l20 16", "M2 20 15 6l9 9 8-11 14 16", "M1 20 11 9l6 6 7-12 8 11 5-5 9 11"][Math.max(0, n - 1)]}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  const nightsWord = n => n + (n === 1 ? " night" : " nights");
  const dayTag = iso => { const d = new Date(MD.stay.parse(iso)); return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }); };
  function shiftAllowed(date) { return P.validDate(date) && date >= today() && !!D.months[Number(date.slice(5, 7))]; }
  function stayCards() {
    return MD.stay.ORDER.map(k => {
      const o = MD.stay.OPTIONS[k], q = MD.stay.quote({ ...S, stay: k }), on = S.stay === k;
      const price = o.pcg ? `<span class="stay-card__price"><b>${yen(q.avgRoom)}</b><small>a night</small></span>` : `<span class="stay-card__price"><small>Activities only</small></span>`;
      return `<button type="button" class="stay-card${o.pcg ? "" : " stay-card--own"}" data-stay="${k}" aria-pressed="${on}" title="${esc(o.blurb)}">
        ${o.pcg ? PEAKS(o.tier) : `<svg class="stay-card__peaks" viewBox="0 0 48 22" width="40" height="18" aria-hidden="true" focusable="false"><path d="M6 17h36M12 17V9l12-5 12 5v8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`}
        <span class="stay-card__line">${o.pcg ? esc(o.line) : "Your own stay"}</span>
        <span class="stay-card__name">${esc(o.name)}</span>
        ${price}
        <span class="stay-card__mark" aria-hidden="true">${on ? "Selected" : ""}</span></button>`;
    }).join("");
  }
  function stayDetail() {
    const q = MD.stay.quote(S);
    if (!q.stay) return `<p class="stay-note">You are arranging your own stay. Activities, the van and the rail fare are priced as usual, and you can add one of the three properties at any time.</p>`;
    const chips = q.nights.map(n => `<li class="night${n.tags.length ? " night--peak" : ""}"><span class="night__d">${esc(dayTag(n.date))}</span><b class="night__r">${yen(n.rate)}</b>${n.tags.length ? `<i class="night__t">${esc(n.tags.join(" · "))}</i>` : `<i class="night__t night__t--quiet">Midweek</i>`}</li>`).join("");
    const hint = MD.stay.shiftHint(S, shiftAllowed);
    return `<div class="stay-nights"><p class="stay-nights__h">Your ${nightsWord(q.nights.length)} at ${esc(q.option.name)}</p><ul class="nights">${chips}</ul>
      <p class="stay-nights__sum"><span>${q.rooms === 1 ? "1 room" : q.rooms + " rooms"} · ${yen(q.total)}</span><b>${sgd(q.perPerson)} <small>per person</small></b></p>
      ${hint ? `<p class="stay-hint">Start on ${esc(dayTag(hint.date))} instead and save about ${sgd(hint.perPerson)} per person. <button type="button" class="linkbtn" data-shift="${hint.date}">Move my dates</button></p>` : ""}</div>`;
  }
  function stayQuestion() {
    return `<div class="q q--stay"><span class="q__n">05</span><span class="q__t">Where will you stay?</span>
      <p class="stay-lede">Three Patience Capital Group properties, priced for your dates, or stay elsewhere and book the activities only.</p>
      <div class="stay-cards" role="group" aria-label="Where will you stay?">${stayCards()}</div><div class="stay-detail" id="stayDetail" aria-live="polite">${stayDetail()}</div></div>`;
  }
  function renderPlan() {
    const ownLink=$("#blankStart");if(ownLink)ownLink.firstChild.textContent=S.sel.size?"Continue planning my trip ":"Choose my own activities ";
    const q = (n, title, name, list, cur) => `<div class="q"><span class="q__n">0${n}</span><span class="q__t">${title}</span><div class="opts" role="group" aria-label="${esc(title)}">${list.map(([v, l]) => `<button type="button" class="opt" data-q="${name}" data-v="${v}" aria-pressed="${String(cur) === String(v)}">${esc(l)}</button>`).join("")}</div></div>`;
    const range = P.validDate(S.date) ? `${dayLong(0)} to ${dayLong(S.days - 1)}` : "";
    $("#questions").innerHTML =
      q(1, "Who's coming?", "who", D.who, S.who) +
      q(2, "How much walking is comfortable?", "walk", D.walk, S.walk) +
      q(3, "How long?", "days", [3, 4, 5, 6, 7].map(n => [n, n + " days"]), S.days) +
      `<div class="q q--date"><span class="q__n">04</span><span class="q__t" id="plan-date-l">First day</span>${dateControl("plan-date", S.date)}<p class="date-echo" aria-live="polite">${esc(range)}</p><p class="small date-guidance">Green season runs July to October.</p></div>` +
      stayQuestion();
    const r = P.recommended(S);
    $("#planRec").innerHTML = `<span class="rec__k">A starting idea</span><span class="rec__name">${esc(D.courses[r].name)}</span><span class="rec__why">${esc(recWhy())}<span>In ${D.months[S.month]}: ${esc(D.events[S.month])}</span></span>`;
    $("#planCourses").innerHTML = ["restore", "discover", "active"].map((k, i) => courseCard(k, i, k === r)).join("");
    reveal();
  }

  /* ---------- review & save ---------- */
  function slotTitle(d, a) { return d.am === a && d.pm === a ? "" : d.am === a ? "Morning" : "Afternoon"; }
  /* ---------- getting around ----------
     Public transport in the valley is thin, so the plan assumes PCG's chartered bus/van for every day with something on.
     A day's ride = base -> each area in order -> base. The daily rate is set in js/assumptions.js. */
  const VAN_PER_DAY = MD.assume.v.vanPerDay;   // ¥ per day for the group's nine-seat van with driver (ASSUMPTIONS.md, A-T1)
  const PARTY = MD.assume.v.party;
  function getAround(plan) {
    const home = MD.stay.OPTIONS[S.stay].zone;
    const days = plan.days.map(d => {
      const stops = [d.am, d.pm].filter(Boolean).filter((a, i, arr) => arr.indexOf(a) === i).map(a => a.zone);
      const route = [home, ...stops.filter((z, i) => z !== (i ? stops[i - 1] : home)), home].filter((z, i, arr) => i === 0 || z !== arr[i - 1]);
      let km = 0; for (let i = 1; i < route.length; i++) km += P.zoneKm(route[i - 1], route[i]);
      const needs = d.items.length > 0 || d.extras.length > 0;
      return { i: d.i, needs, route: needs ? route : [], km: Math.round(km), hops: Math.max(0, route.length - 1), away: stops.some(z => z !== home) };
    });
    const rideDays = days.filter(x => x.needs).length;
    // a saving worth mentioning: two light days both heading to the same area could share one charter day
    const light = plan.days.filter(d => d.items.length === 1 && !d.edge);
    let tip = "";
    for (let a = 0; a < light.length && !tip; a++) for (let b = a + 1; b < light.length; b++) if (light[a].items[0].zone === light[b].items[0].zone) { tip = `Day ${light[a].i + 1} and Day ${light[b].i + 1} both head to ${D.zones[light[a].items[0].zone].short}. Putting them on one day would free a charter day.`; break; }
    const perDay = VAN_PER_DAY, party = PARTY[S.who] || 2, total = perDay * rideDays;
    return { days, rideDays, perDay, total, party, share: Math.round(total / party), tip, home };
  }
  function dayNote(d) {
    if (d.edge === "arrival" && d.items.length) return "Arrival day: keep it light and leave room for the journey from Tokyo.";
    if (d.edge === "departure" && d.items.length) return "Departure day: finish in good time for your train.";
    if (d.zones.length === 2) return `Two areas today, about ${d.km} km apart in a straight line. Allow time for the transfer.`;
    if (d.long) return "A long outing. Keep the rest of the day light.";
    return "";
  }
  const EF = { 1: "Very easy", 2: "Easy", 3: "Moderate", 4: "Active", 5: "Strenuous" };
  const KANJI = ["一", "二", "三", "四", "五", "六", "七"];
  const dots = n => `<span class="efdots" title="${EF[n] || ""}" aria-label="${EF[n] || ""}">${[1, 2, 3, 4, 5].map(i => `<i${i <= n ? ' class="on"' : ""}></i>`).join("")}</span>`;
  const MODEL3D = new Set(["imori", "daruma", "picnic", "naena", "soba", "zip", "madarao", "ebike", "sup", "kayak", "cruise", "winery", "culture", "rice", "forest", "train"]);   // activities that have a crafted 3D model
  const bImg = (a, cls) => a.img ? `<img class="${cls}" src="${esc(thumb(a))}" alt="" loading="lazy" decoding="async">` : `<span class="${cls} ${cls}--ico" aria-hidden="true">${esc((CATS[a.cat] || "·").slice(0, 1))}</span>`;
  function renderBook(stayOnly=false) {
    if(!stayOnly)MD.tripFilm?.destroy();
    const plan = P.schedule(S), ids = plan.days.flatMap(d => [...d.items, ...d.extras].map(a => a.id)), t = P.totals({ ...S, sel: new Set(ids) });
    const g = getAround(plan), nights = S.days - 1, nAct = ids.length, sq = MD.stay.quote(S);
    const dayTitle = d => d.zones.length ? d.zones.map(z => esc(D.zones[z].short)).join(" · ") : d.edge === "arrival" ? "Arrival" : d.edge === "departure" ? "Departure" : "A free day";
    const where2 = (d, a) => `${slotTitle(d, a) || "All day"} · Day ${d.i + 1}`;
    const perPerson = t.yen + D.railReturn + g.share + sq.perPerson;
    // the little itinerary beside the film
    const railCell = (d, a, wide) => !a ? `<div class="rail__s rail__s--empty" aria-hidden="true"></div>` : `<div class="rail__s${wide ? " rail__s--wide" : ""}">${MODEL3D.has(a.id) ? `<div class="rail__m" data-model="${a.id}" role="img" aria-label="3D model of ${esc(a.name)}. Drag to turn it."></div>` : `<div class="rail__m rail__m--none" aria-hidden="true"></div>`}<strong title="${esc(a.name)}">${esc(a.name)}</strong></div>`;
    const TRAIN_IN = { id: "train", name: "Arrive by Shinano Railway" }, TRAIN_OUT = { id: "train", name: "Depart by Shinano Railway" };   // the journey itself, drawn like the activities
    const rail = plan.days.map(d => { const am = d.edge === "arrival" && !d.am ? TRAIN_IN : d.am, pm = d.edge === "departure" && !d.pm ? TRAIN_OUT : d.pm; return `<li class="rail__day"><div class="rail__d"><b>Day ${d.i + 1}</b><span>${esc(dayShort(d.i))}</span></div>${am && am === pm ? railCell(d, am, true) : am || pm ? railCell(d, am) + railCell(d, pm) : `<p class="rail__e">${d.edge ? (d.edge === "arrival" ? "Travel to Myoko" : "The journey home") : "A day to rest, or leave open"}</p>`}</li>`; }).join("");
    const cards = plan.days.map(d => {
      const gd = g.days[d.i], note = dayNote(d);
      return `<article class="bday2" id="day-${d.i + 1}"><header class="bday2__h"><span class="bday2__n" lang="ja" aria-hidden="true">${KANJI[d.i] || d.i + 1}</span><div><p class="bday2__k">Day ${d.i + 1} · ${esc(dayShort(d.i))}</p><h3>${dayTitle(d)}</h3></div>${gd.needs && gd.hops ? `<span class="bday2__km" title="Straight-line distance, base to base">${gd.km ? "~" + gd.km + " km" : "In the area"}</span>` : ""}</header>
        <div class="bday2__body">${d.items.length ? `<ul class="bday2__list">${d.items.map(a => `<li>${bImg(a, "bday2__img")}<div class="bday2__b"><span class="bday2__t">${slotTitle(d, a) || "All day"}${a.zone ? " · " + esc(D.zones[a.zone].short) : ""}</span><strong>${esc(a.name)}</strong><span class="bday2__m">${dots(a.ef)}<i>${EF[a.ef] || ""}</i><i>${priceTxt(a)}</i>${a.lunch ? "<i>Lunch included</i>" : ""}</span></div></li>`).join("")}</ul>` : `<p class="bday2__e">${d.edge ? "Leave time for travel." : "Leave time for rest, or something unplanned."}</p>`}
        ${d.extras.length ? `<p class="bday2__x"><b>Also:</b> ${d.extras.map(a => esc(a.name)).join(", ")}</p>` : ""}
        <details class="bday2__details"${!d.items.length && !d.extras.length ? " hidden" : ""}><summary>Day details</summary>
        ${gd.needs && gd.route.length > 1 ? `<p class="bday2__ride"><svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="M3 5h11l3 4v5H3z M3 10h14 M6.5 16.2a1.4 1.4 0 1 0 .01 0 M13.5 16.2a1.4 1.4 0 1 0 .01 0" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg><span>Charter van: ${gd.route.map(z => esc(D.zones[z].short)).join(" → ")}</span></p>` : ""}
        ${note ? `<p class="bday2__note">${esc(note)}</p>` : `<p>No additional travel notes.</p>`}
        </details></div></article>`;
    }).join("");
    const row = (name, sub, val, cls) => `<div class="lrow${cls ? " lrow--" + cls : ""}"><div class="lrow__n">${name}${sub ? `<small>${sub}</small>` : ""}</div><div class="lrow__v">${val}</div></div>`;
    const actRows = plan.days.flatMap(d => d.items.map(a => row(esc(a.name), where2(d, a), priceTxt(a)))).join("") + plan.days.flatMap(d => d.extras.map(a => row(esc(a.name), `Also · Day ${d.i + 1}`, priceTxt(a)))).join("");
    const ledger = `<div class="ledger">
      <h3 class="ledger__h">Activities</h3>${actRows || row("Nothing planned yet", "", "")}
      ${row("Activities subtotal", "", yen(t.yen), "sub")}
      <h3 class="ledger__h">Getting there and around</h3>
      ${row("Tokyo–Nagano return rail", "Reserved seats", yen(D.railReturn))}
      ${row(`Chartered van · ${g.rideDays} day${g.rideDays === 1 ? "" : "s"}`, `${g.rideDays} × ${yen(g.perDay)} = ${yen(g.total)} for the group. Your share, split ${g.party} way${g.party === 1 ? "" : "s"}`, yen(g.share))}
      ${row("Transport subtotal", "", yen(D.railReturn + g.share), "sub")}
      <h3 class="ledger__h">Your stay</h3>
      <div class="ledger__stay" style="min-height:${(nights+1)*88}px">${sq.stay
        ? sq.nights.map(n => row(esc(dayTag(n.date)), `${esc(sq.option.name)}${n.tags.length ? " · " + esc(n.tags.join(" · ")) : ""} · ${yen(n.rate)} a room`, yen(n.rate * sq.rooms / sq.party))).join("") + row("Stay subtotal", `${nights === 1 ? "1 night" : nights + " nights"} · ${sq.rooms === 1 ? "1 room" : sq.rooms + " rooms"} for ${sq.party}`, yen(sq.perPerson), "sub")
        : row("Your own stay", "Arranged by you. Your days start from Myoko-Kogen Station", "Not included", "muted")}</div>
      ${row("Meals and personal extras", "Beyond what an activity includes", "Not included", "muted")}
      <div class="ledger__total"><div><span class="ledger__k">Trip total per person</span><small>Activities, rail, van share${sq.stay ? " and stay" : ""}</small></div><div class="ledger__amt"><b>${yen(perPerson)}</b><span>${sgd(perPerson)}</span></div></div></div>`;
    const stayPanel = `<div class="panel panel--card stay-panel"><div class="panel__head"><h2>Your stay</h2></div>
        <p>${sq.stay ? `${esc(sq.option.name)}, ${esc(sq.option.line.toLowerCase())}. ${nights === 1 ? "1 night" : nights + " nights"} from ${esc(dayShort(0))}.` : "You are arranging your own stay. You can add one of our three properties at any time."}</p>
        <div class="stay-review-grid" role="group" aria-label="Where will you stay?">${MD.stay.ORDER.map(k=>{const o=MD.stay.OPTIONS[k],q=MD.stay.quote({...S,stay:k});return `<button type="button" data-stay-b="${k}" aria-pressed="${S.stay===k}">${o.pcg?PEAKS(o.tier):`<span aria-hidden="true">⌂</span>`}<b>${esc(o.name)}</b><small>${o.pcg?"$".repeat(o.tier)+" · "+yen(q.avgRoom)+" / room / night":"Your own accommodation"}</small></button>`;}).join("")}</div></div>`;
    const bookHTML = `<header class="bk-head"><div class="bk-head__t"><p class="label">03 · Review your trip</p><h1>Your Myoko trip.</h1></div><p class="bk-head__meta">Prepared for<br><b>Patience Capital Group</b></p><p class="bk-head__p">${dayLong(0)} to ${dayLong(S.days - 1)} · ${S.days} days, ${nights} nights.</p></header>
      <section class="bk-hero" aria-label="Your trip film and itinerary">
        <div class="bk-hero__film"><section class="trip-film" id="tripFilm" aria-label="Your trip film"></section></div>
        <aside class="bk-rail" aria-label="Your days at a glance"><div class="rail__cols" aria-hidden="true"><span></span><span>Morning</span><span>Afternoon</span></div><ol class="rail">${rail}</ol>${plan.overflow.length ? `<div class="notice"><b>Not in this itinerary:</b> ${plan.overflow.map(a => esc(a.name)).join(", ")}. Excluded from the subtotal.</div>` : ""}<div class="bk-rail__f"><a class="linkbtn" href="#build">Edit days</a><a class="linkbtn" href="#day-1" data-jump="day-1">Day-by-day details ↓</a></div></aside>
      </section>
      <p class="bk-hero__note" id="filmNote"></p>
      <section class="bk-stats" aria-label="Trip at a glance">
        <div class="stat"><span class="stat__k">The trip</span><b>${S.days}<small> days</small></b><span class="stat__s">${nights} night${nights === 1 ? "" : "s"}</span></div>
        <div class="stat"><span class="stat__k">Activities</span><b>${nAct}</b><span class="stat__s">planned</span></div>
        <div class="stat"><span class="stat__k">${sq.stay ? "Your stay" : "Stay"}</span><b>${sq.stay ? sgd(sq.perPerson) : "Own"}</b><span class="stat__s">${sq.stay ? esc(sq.option.name) + " · per person" : "Not included"}</span></div>
        <div class="stat stat--total"><span class="stat__k">Trip total</span><b>${sgd(perPerson)}</b><span class="stat__s">${yen(perPerson)} per person</span></div>
      </section>
      <section class="bk-main"><div class="panel panel--days"><div class="panel__head"><h2>Day by day</h2><a href="#build" class="linkbtn">Edit days</a></div><div class="bdays">${cards}</div></div>
        <div class="panel panel--cost"><div class="panel__head"><h2>Your cost checklist</h2><span class="panel__aside">Per person · yen</span></div><p class="cost-note">Per person, tax included. Meals and personal extras are not included.</p>${ledger}
          </div></section>
      <section class="bk-cards" aria-label="Next steps">
        ${stayPanel}
        <div class="panel panel--card"><div class="panel__head"><h2>Plan your rail journey</h2></div><p>Tokyo → Nagano by Hokuriku Shinkansen, then the Kita-Shinano Line to Myoko-Kogen.</p><div class="panel__act"><a class="btn btn--sm" href="https://www.eki-net.com/en/jreast-train-reservation/Top/Index" target="_blank" rel="noopener">JR East reservations ↗</a><a class="linkbtn" href="https://www.shinanorailway.co.jp/rail-info/time-table/" target="_blank" rel="noopener">Kita-Shinano timetables (Japanese) ↗</a></div></div>
        <div class="panel panel--card save-panel"><div class="panel__head"><h2>Keep your plan</h2></div><p>Save your dates, days and costs. No name or email is needed.</p><div class="panel__act"><button type="button" class="btn" id="downloadPlan">Download plan</button><button type="button" class="btn btn--ghost" id="copyPlan">Copy plan</button></div><p id="copyMsg" class="small" aria-live="polite"></p></div></section>`;
    if(stayOnly){
      const oldPanelTop=$('#bookRoot .stay-panel')?.getBoundingClientRect().top;
      const draft=document.createElement('div');draft.innerHTML=bookHTML;
      for(const selector of ['.stay-panel','.ledger','.bk-stats']){const old=$("#bookRoot "+selector),fresh=draft.querySelector(selector);if(old&&fresh)old.replaceWith(fresh);}
      document.querySelectorAll('#bookRoot .bday2').forEach(card=>{
        const fresh=draft.querySelector('#'+card.id);if(!fresh)return;
        for(const cls of ['.bday2__ride','.bday2__km']){const old=card.querySelector(cls),next=fresh.querySelector(cls);if(old&&next)old.replaceWith(next);else if(old)old.remove();else if(next)(cls==='.bday2__km'?card.querySelector('.bday2__h'):card.querySelector('.bday2__body')).appendChild(next);}
      });
      if(oldPanelTop!=null){const delta=$('#bookRoot .stay-panel').getBoundingClientRect().top-oldPanelTop;window.scrollBy({top:delta,behavior:'instant'});}
      return;
    }
    $("#bookRoot").innerHTML=bookHTML;
    MD.tripFilm.mount($("#tripFilm"), plan.days);
    if (MD.tiles) MD.tiles.mount($("#bookRoot"));
    const fn = $("#tripFilm .trip-film__note"), slot = $("#filmNote"); if (fn && slot) slot.replaceWith(fn); else if (slot) slot.remove();
  }
  function planText() {
    const p = P.schedule(S), ids = p.days.flatMap(d => [...d.items, ...d.extras].map(a => a.id)), t = P.totals({ ...S, sel: new Set(ids) });
    const g = getAround(p), sq = MD.stay.quote(S), nights = S.days - 1;
    const line = d => {
      const parts = [];
      if (d.am) parts.push(`Morning: ${d.am.name} [${priceTxt(d.am)}]`);
      if (d.pm) parts.push(`Afternoon: ${d.pm.name} [${priceTxt(d.pm)}]`);
      d.extras.forEach(a => parts.push(`Also: ${a.name} [${priceTxt(a)}]`));
      return `Day ${d.i + 1} (${dateLabel(d.i)}): ${parts.join("; ") || (d.edge === "arrival" ? "Arrival / settle in" : d.edge === "departure" ? "Departure / travel" : "Free day")}`;
    };
    const total = t.yen + D.railReturn + g.share + sq.perPerson, both = v => `${yen(v)} (${sgd(v)})`;
    const stayLines = sq.stay
      ? [`Stay: ${sq.option.name}, ${nights} night${nights === 1 ? "" : "s"}, ${sq.rooms} room${sq.rooms === 1 ? "" : "s"} for ${sq.party}`, ...sq.nights.map(n => `  ${dayTag(n.date)}: ${yen(n.rate)} a room${n.tags.length ? " · " + n.tags.join(" · ") : ""}`)]
      : ["Stay: your own arrangement. Days start from Myoko-Kogen Station."];
    return [`MYOKO DAYS — YOUR TRIP`, `${S.date} · ${S.days} days / ${nights} nights`, ...stayLines, "", ...p.days.map(line), "",
      `Not in this itinerary: ${p.overflow.map(a => a.name).join("; ") || "None"}`, "",
      `COST PER PERSON`, `Activities: ${both(t.yen)}`, `Tokyo–Nagano return rail: ${both(D.railReturn)}`,
      `Chartered van, ${g.rideDays} day${g.rideDays === 1 ? "" : "s"} (${yen(g.total)} for the group of ${g.party}): ${both(g.share)}`,
      sq.stay ? `Stay: ${both(sq.perPerson)}` : `Stay: not included`, `Trip total: ${both(total)}`, `Meals and personal extras are not included.`, "",
      `JR East: https://www.eki-net.com/en/jreast-train-reservation/Top/Index`, `Shinano Railway: https://www.shinanorailway.co.jp/rail-info/time-table/`].join("\n");
  }

  /* ---------- events (home, plan, review) ---------- */
  function onClick(e) {
    const t = e.target;
    if (t.closest("#heroVideoToggle")) { const dialog = $("#filmDialog"); dialog.showModal(); const play = $("#fullFilm").play(); if (play?.catch) play.catch(() => {}); return; }
    if (t.closest("#heroPause")) { const v = $("#heroVideo"); if (v.paused) v.play().catch(() => {}); else v.pause(); return; }
    if (t.closest("#filmClose")) { $("#filmDialog").close(); return; }
    const q = t.closest("[data-q]");
    if (q) {
      const k = q.dataset.q, v = k === "who" ? q.dataset.v : Number(q.dataset.v), before = snap();
      S[k] = v; reconcile(); changed({ settings: true }); renderPlan();
      if (S.removed.length) toast(`Kept all choices. ${S.removed.length} need a new block in Build.`, { kind: "warn", undo: () => { restore(before); renderPlan(); } });
      return;
    }
    const st = t.closest("[data-stay]");
    if (st) { setStay(st.dataset.stay, true); const k = st.dataset.stay; renderPlan(); const again = document.querySelector(`[data-stay="${k}"]`); if (again) again.focus({ preventScroll: true }); return; }
    const sb = t.closest("[data-stay-b]");
    if (sb) { const anchor=document.querySelector('.stay-panel').getBoundingClientRect().top;document.documentElement.style.overflowAnchor='none';setStay(sb.dataset.stayB, true); renderBook(true);const keep=()=>window.scrollBy({top:document.querySelector('.stay-panel').getBoundingClientRect().top-anchor,behavior:'instant'});keep();requestAnimationFrame(()=>{keep();requestAnimationFrame(()=>{keep();document.documentElement.style.overflowAnchor='';});}); const again = document.querySelector(`[data-stay-b="${sb.dataset.stayB}"]`); if (again) again.focus({ preventScroll: true }); return; }
    const sh = t.closest("[data-shift]");
    if (sh) { setDate(sh.dataset.shift); renderPlan(); return; }
    const c = t.closest("[data-course]");
    if (c) {
      const before = snap(), note = startCourse(c.dataset.course);
      changed({ restart: true });
      location.hash = "#build";
      toast("Started from " + D.courses[c.dataset.course].name + (note.length ? ", " + note.join(", ") : ""), { undo: () => restore(before) });
      return;
    }
    if (t.closest("#blankStart")) { S.focus = null; S.target = null; changed({ restart: true }); return; }
    const aj=t.closest('[data-area-jump]');if(aj){e.preventDefault();const el=document.getElementById(aj.dataset.areaJump);if(el){el.scrollIntoView({behavior:smooth,block:'start'});el.focus({preventScroll:true});}return;}
  }
  document.addEventListener("click", onClick);
  document.addEventListener("change", e => {
    const id = e.target.id, v = e.target.value;
    { const ds = e.target.closest && e.target.closest("[data-dsel]"); if (ds) { setDate(readDate(ds)); if (currentView === "plan") renderPlan(); return; } }
  });
  $("#bookRoot").addEventListener("click", e => {
    const jump = e.target.closest("[data-jump]"); if (jump) { e.preventDefault(); const el = document.getElementById(jump.dataset.jump); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: smooth }); return; }
    if (e.target.closest("#downloadPlan")) { const blob = new Blob([planText()], { type: "text/plain;charset=utf-8" }), url = URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = `myoko-draft-${S.date}.txt`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); $("#copyMsg").textContent = "Plan downloaded."; }
    if (e.target.closest("#copyPlan")) { const txt = planText(), msg = $("#copyMsg"); if (navigator.clipboard?.writeText) navigator.clipboard.writeText(txt).then(() => msg.textContent = "Plan copied.", () => msg.textContent = txt); else msg.textContent = txt; }
  });

  /* ---------- scroll: solid header after the hero, gentle parallax ---------- */
  const header = $("#siteHeader");
  const PARALLAX = [["#heroMedia", 0.22, "top"], ["#mapfeatImg", 0.10, "mid"], ["#closingImg", 0.10, "mid"], ["#aboutImg", 0.08, "mid"]];
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const home = document.body.classList.contains("on-home"), hero = $(".hero");
      header.classList.toggle("is-solid", !home || window.scrollY > (hero ? hero.offsetHeight - header.offsetHeight - 8 : 40));
      if (reduceMotion) return;
      const vh = window.innerHeight;
      PARALLAX.forEach(([sel, k, mode]) => {
        const el = $(sel); if (!el || !el.offsetParent) return;
        if (mode === "top") { el.style.transform = `translate3d(0, ${Math.min(window.scrollY, vh) * k}px, 0)`; return; }
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        el.style.transform = `translate3d(0, ${((r.top + r.height / 2 - vh / 2) * -k).toFixed(1)}px, 0)`;
      });
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  function heroPlay(on) {
    const img = $("#heroImg"), video = $("#heroVideo");
    if (on) img.classList.add("is-loaded");
    if (!on) { video.pause(); return; }
    const playing = video.play(); if (playing?.catch) playing.catch(() => {});
  }
  $("#heroVideo").addEventListener("playing", () => $("#heroVideo").classList.add("is-on"));
  ["play", "pause"].forEach(event => $("#heroVideo").addEventListener(event, () => { const b = $("#heroPause"), p = $("#heroVideo").paused; b.textContent = p ? "Play motion" : "Pause motion"; b.setAttribute("aria-label", p ? "Play background video" : "Pause background video"); }));
  $("#filmDialog").addEventListener("close", () => { $("#fullFilm").pause(); $("#heroVideoToggle").focus({ preventScroll: true }); });

  /* warm the map's files while the visitor is reading, so Build opens quickly */
  function warmMap() { if (MD.map && MD.map.prefetch) MD.map.prefetch(); }

  /* ---------- router ---------- */
  const VIEWS = ["home", "about", "plan", "build", "book"];
  const TITLES = { home: "Green season in the mountains", about: "The area", plan: "Plan your trip", build: "Build your trip", book: "Review your trip" };
  let currentView = null, blankDefaults = false;   // blankDefaults: the visitor has not been through Plan yet
  function route() {
    const raw = (location.hash || "#home").slice(1);
    const view = VIEWS.includes(raw) ? raw : "home";
    const prev = currentView; currentView = view;
    if (view === "plan") { const tb = $("#toasts"); if (tb) tb.innerHTML = ""; if (blankDefaults) { blankDefaults = false; S.stay = "madarao"; S.days = 4; S.placements = {}; save(); } }   // arriving on Plan gives it its own starting answers
    VIEWS.forEach(x => { const el = $("#v-" + x); const on = x === view; el.hidden = !on; if (on) { el.classList.remove("view-in"); void el.offsetWidth; el.classList.add("view-in"); } });
    $$("[data-nav]").forEach(a => { if (a.dataset.nav === view) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    document.body.classList.toggle("on-home", view === "home");
    document.body.classList.toggle("on-build", view === "build");
    document.title = view === "home" ? "Myoko Days · " + TITLES.home : TITLES[view] + " · Myoko Days";
    setCount();
    if (view === "home" || view === "about") renderHome();
    heroPlay(view === "home");
    if (view === "plan") renderPlan();
    if (view === "build") MD.studio && MD.studio.enter(prev !== "build"); else MD.studio && MD.studio.leave();
    if (view !== "book") MD.tripFilm?.destroy();
    if (view === "book") renderBook();
    if (raw === "courses") requestAnimationFrame(() => { const c = $("#courses"); if (c) window.scrollTo({ top: c.getBoundingClientRect().top + window.scrollY - 40, behavior: smooth }); });
    else { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" })); }   // twice: #book is also the id of the Review section, so the browser's own anchor jump would otherwise hide the page head
    onScroll(); reveal();
    const main = $("#main"); if (main && view !== "home") main.focus({ preventScroll: true });
    if (view === "home" || view === "plan") (window.requestIdleCallback || (f => setTimeout(f, 1800)))(warmMap);
  }
  window.addEventListener("hashchange", route);

  /* ---------- public surface for studio.js and the tests ---------- */
  MD.app = {
    S, D, P, $, $$, esc, yen, sgd, ARROW, dateControl, readDate, reduceMotion, smooth, CATS, WALK_LABEL, MIN_DAYS, MAX_DAYS,
    save, snap, restore, changed, toast, countUp, reveal, thumb, today, localDate,
    priceTxt, lenTxt, runsTxt, isPinned, dateLabel, dayShort, dayLong, where, avail, caution, dayNote,
    getAround, setStay, stayName, dayTag, nightsWord, addPlace, removePlace, togglePlace, placeManual, moveToDay, requestPlacement, reconcile, changeSetting, setDate, pickCourse, clearTrip, startCourse, startBlank, coursePreview,
    onChange: fn => listeners.push(fn), planText, renderPlan, renderBook, route,
    start() {
      if (!hasSavedTrip) { startBlank(); S.stay = "own"; S.days = 3; blankDefaults = true; }   // v17.4: nothing is chosen until the visitor picks a course (or a blank map) on the Plan page, so going straight to Build gives an empty map: no places, 3 days, and "somewhere else" as the stay (no PCG base is chosen for them)
      reconcile(); setCount(); route();
    }
  };
})();

/* Review film: landscape clips fill the whole frame; portrait clips stay whole on the blurred backdrop */
["loadedmetadata", "loadeddata", "playing"].forEach(ev => document.addEventListener(ev, e => {
  const v = e.target;
  if (v && v.classList && v.classList.contains("trip-film__video")) if (v.videoWidth) v.style.objectFit = v.videoWidth >= v.videoHeight ? "cover" : "contain";
}, true));
