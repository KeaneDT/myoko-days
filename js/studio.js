/* Myoko Days — the build workspace: the map on the left, "Your days" docked on the right, one screen, no scrolling between them.
   Adding a place from anywhere (pin, card, list, a day's suggestion) goes through MD.app.addPlace, which asks the planner for the
   best free block without moving anything else. Auto-arrange dragging explicitly enables automatic sorting. */
(function () {
  "use strict";
  const A = MD.app, S = A.S, D = A.D, P = A.P;
  const { $, $$, esc, yen, sgd, ARROW } = A;
  S.zoneFilter = S.zoneFilter || "";
  S.coachSeen = (() => { try { return localStorage.getItem("md_coach12") === "1"; } catch (e) { return false; } })();

  const ui = { drawer: false, settings: false, menu: null, active: false, dirty: true, lastTotal: null, placing: null, receipt: null, filterOpen: false };
  const SLOT = { am: "Morning", pm: "Afternoon" };
  const JA = ["一", "二", "三", "四", "五", "六", "七"];
  const narrowQ = matchMedia("(max-width: 860px)");
  const coarseQ = matchMedia("(pointer: coarse)");
  ui.drawer = false;   // desktop: true = the Places pane is showing (false = Your days). Phones: the Places bottom sheet is open. Set on first entry (see enter()).

  /* ---------- small helpers ---------- */
  const whereOf = (a, pl) => !pl ? "" : pl.slot === "x" ? `Day ${pl.day + 1}${a && a.slot === "eve" ? " evening" : ""}` : A.where(pl);
  const zoneLine = d => d.zones.length ? d.zones.map(z => D.zones[z].short).join(" · ") + (d.zones.length === 2 ? ` · ${d.km} km apart` : "") : "";
  function rangeLabel() {
    const a = P.dateAt(S, 0), b = P.dateAt(S, S.days - 1);
    if (!a || !b) return "Your trip";
    if (a.getMonth() === b.getMonth()) return `${a.getDate()} – ${b.getDate()} ${b.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`;
    return `${a.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${b.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
  }
  const matches = (a, skipCat) => (skipCat || !S.catFilter.length || S.catFilter.includes(a.cat)) && (!S.zoneFilter || a.zone === S.zoneFilter) && (!S.fitsOnly || !A.caution(a)) && (S.showExtras || a.src !== "desk") && queryOk(a);
  function queryOk(a) { const q = S.query.trim().toLowerCase(); if (!q) return true; return (a.name + " " + a.desc + " " + D.zones[a.zone].name + " " + (A.CATS[a.cat] || "") + " " + a.host).toLowerCase().includes(q); }
  const iconOf = a => (MD.pinArt && MD.pinArt[a.id] && MD.pinArt[a.id].icon) || null;
  const picture = (a, cls) => { const t = A.thumb(a); return t ? `<img class="${cls}" src="${esc(t)}" alt="" loading="lazy" decoding="async">` : `<span class="${cls} ${cls}--ico" aria-hidden="true">${MD.svg(a.cat, 22)}</span>`; };

  /* ---------- the day plan, drawn ---------- */
  function itemRow(a, d) {
    const long = P.isLong(a), pinned = A.isPinned(a);
    const isNew = S.focusNew === a.id;
    return `<div class="item${S.focus === a.id ? " is-focus" : ""}${isNew ? " is-new" : ""}" data-drag="${a.id}" data-flip="${a.id}" data-hover="${a.id}">
      <button type="button" class="item__grip" data-grab="${a.id}" aria-label="Drag ${esc(a.name)} to another block" title="Drag to move">⠿</button>
      <button type="button" class="item__pic" data-focus="${a.id}" tabindex="-1" aria-hidden="true">${picture(a, "item__img")}</button>
      <div class="item__txt"><button type="button" class="item__name" data-focus="${a.id}">${esc(a.name)}</button>
        <span class="item__meta">${esc(D.zones[a.zone].short)} · ${A.priceTxt(a)}</span></div>
      <div class="item__acts"><button type="button" class="item__btn" data-menu="${a.id}" aria-label="Move ${esc(a.name)}" aria-expanded="${ui.menu === a.id}">⋯</button><button type="button" class="item__btn item__btn--x" data-remove="${a.id}" aria-label="Remove ${esc(a.name)}">×</button></div>
      ${ui.menu === a.id ? moveMenu(a) : ""}</div>`;
  }
  function moveMenu(a) {
    const isAdd = P.isAddon(a), plan = P.schedule(S), cur = P.slotOf(plan, a.id);
    let opts = "";
    plan.days.forEach(d => {
      if (isAdd) {
        const r = P.move(S, a.id, d.i);
        opts += `<option value="${d.i}:x"${cur && cur.day === d.i ? " selected" : ""}${r.ok ? "" : " disabled"}>Day ${d.i + 1} · ${A.dayShort(d.i)}${r.ok ? "" : " · " + esc(r.why)}</option>`;
      } else ["am", "pm"].forEach(sl => {
        const r = P.place(S, a.id, d.i, sl), here = cur && cur.day === d.i && cur.slot === sl;
        if (!r.ok && /travelling|journey home/.test(r.why)) return;
        opts += `<option value="${d.i}:${sl}"${here ? " selected" : ""}${r.ok || here ? "" : " disabled"}>Day ${d.i + 1} · ${SLOT[sl]}${here ? " · here now" : r.ok ? (r.swapped ? " · swaps with " + esc(D.byId[r.swapped].name) : "") : " · " + esc(r.why)}</option>`;
      });
    });
    return `<div class="item__menu"><label><span>Move to</span><select data-moveto="${a.id}" aria-label="Move ${esc(a.name)} to">${opts}</select></label></div>`;
  }
  let SUG = {};
  function suggestions(d, slot) {
    return (SUG[d.i + ":" + slot] || []).map(({ a, why }) => `<button type="button" class="sug" data-sug="${a.id}" data-day="${d.i}" data-slot="${slot}" title="Add ${esc(a.name)} to Day ${d.i + 1} ${SLOT[slot].toLowerCase()}">${picture(a, "sug__img")}<span class="sug__b"><span class="sug__k">Suggested</span><span class="sug__t">${esc(a.name)}</span><span class="sug__w">${esc(why)}</span></span><i aria-hidden="true">＋</i></button>`).join("");
  }
  function slotRow(d, slot) {
    const a = d[slot], usable = slot === "am" ? d.canAM : d.canPM;
    const t = SLOT[slot];
    if(slot==='pm'&&a&&a===d.am)return `<div class="slot slot--continuation"><span class="slot__t">Afternoon</span><p>Reserved for ${esc(a.name)} · full-day outing</p></div>`;
    if (!usable) return `<div class="slot slot--travel"><span class="slot__t">${t}</span><p class="slot__travel"><svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="M3 5h11l3 4v5H3z M3 10h14 M6.5 16.2a1.4 1.4 0 1 0 .01 0 M13.5 16.2a1.4 1.4 0 1 0 .01 0" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>${d.edge === "arrival" ? "Travelling to Myoko. Nothing to add here." : "Travelling home. Nothing to add here."}</p></div>`;
    const light = d.edge && !a ? `<span class="slot__light">${d.edge === "arrival" ? "Arriving by lunchtime? Choose something easy." : "Choose something easy, back in good time."}</span>` : "";
    if (a) return `<div class="slot" data-drop="${d.i}" data-slot="${slot}"><span class="slot__t">${t}</span>${itemRow(a, d)}</div>`;
    return `<div class="slot slot--empty" data-drop="${d.i}" data-slot="${slot}"><span class="slot__t">${t}</span><div class="slot__empty"><div class="slot__sugs">${suggestions(d, slot)}</div><div class="slot__row"><button type="button" class="linkbtn" data-browse="${d.i}:${slot}">Browse places</button>${light}</div></div></div>`;
  }
  function dayCard(d) {
    const tgt = S.target && S.target.day === d.i;
    const note = A.dayNote(d);
    return `<section class="dayc${tgt ? " is-target" : ""}${d.edge ? " dayc--edge" : ""}" data-day="${d.i}">
      <header class="dayc__head"><button type="button" class="dayc__pick" data-pickday="${d.i}" aria-pressed="${!!tgt}" title="${tgt ? "Adding here. Click to let Myoko Days choose" : "Add new places to this day"}"><span class="dayc__n"><b>Day ${d.i + 1}</b><i lang="ja" aria-hidden="true">${JA[d.i] || ""}日目</i></span><span class="dayc__date">${esc(A.dayShort(d.i))}</span></button>
        <span class="dayc__zone">${esc(zoneLine(d) || (d.edge ? (d.edge === "arrival" ? "Arrival" : "Departure") : "An open day"))}</span>
        ${tgt ? '<span class="dayc__tag">Adding here</span>' : ""}</header>
      ${slotRow(d, "am")}${slotRow(d, "pm")}
      ${d.extras.length ? `<div class="extras" data-dropextra="${d.i}"><span class="slot__t">Also</span><div class="extras__list">${d.extras.map(a => `<span class="chip2" data-flip="${a.id}" data-hover="${a.id}"><button type="button" data-focus="${a.id}">${esc(a.name)}</button><button type="button" data-remove="${a.id}" aria-label="Remove ${esc(a.name)}">×</button></span>`).join("")}</div></div>` : ""}
      ${note && d.items.length ? `<p class="dayc__note">${esc(note)}</p>` : ""}</section>`;
  }
  function renderDays(plan) {
    SUG = P.suggestPlan(S, 1);
    const box = $("#dockDays"), top = box.scrollTop;
    const tip = "";
    const empty = !S.sel.size ? `<div class="starter"><p><b>Your days are empty.</b> Add places from the Places tab, or start from a ready-made trip:</p><div class="starter__row"><button type="button" class="btn btn--sm" data-pane="places">Browse places</button>${["restore", "discover", "active"].map(k => `<button type="button" class="linkbtn" data-restart="${k}">${esc(D.courses[k].name)}</button>`).join("")}</div></div>` : "";
    const over = plan.overflow.length ? `<div class="attn"><b>${plan.overflow.length === 1 ? "One choice needs a block" : plan.overflow.length + " choices need a block"}.</b> ${plan.overflow.map(a => esc(a.name)).join(", ")}. ${plan.overflow.map(a=>`<button type="button" class="linkbtn" data-resolve="${a.id}">Move or remove ${esc(a.name)}</button>`).join(" ")}</div>` : "";
    box.innerHTML = tip + empty + over + plan.days.map(dayCard).join("") +
      `<div class="dock__more">${S.days < A.MAX_DAYS ? '<button type="button" class="linkbtn" data-addday>Add a day +</button>' : ""}${S.days > A.MIN_DAYS ? '<button type="button" class="linkbtn" data-dropday>Remove last day</button>' : ""}${S.sel.size ? '<button type="button" class="linkbtn" data-clear>Clear all</button>' : ""}</div>`;
    box.scrollTop = top;
  }
  function renderTabs(plan) {
    const box = $("#dockTabs"); if (!box) return;
    const nIn = plan.days.reduce((n, d) => n + d.items.length + d.extras.length, 0) + plan.overflow.length;
    const nPl = D.activities.filter(a => S.showExtras || a.src !== "desk").length;
    const bump = ui.lastIn != null && ui.lastIn !== nIn;
    ui.lastIn = nIn;
    box.innerHTML = `<button type="button" role="tab" id="tab-places" data-pane="places" aria-selected="${ui.drawer}" aria-controls="drawer">Places <b>${nPl}</b></button><button type="button" role="tab" id="tab-days" data-pane="days" aria-selected="${!ui.drawer}" aria-controls="dockDays">Your days <b${bump ? ' class="is-bump"' : ""}>${nIn}</b></button>`;
  }
  function renderHead() {
    const a0 = P.dateAt(S, 0), a1 = P.dateAt(S, S.days - 1), wd = x => x ? x.toLocaleDateString("en-GB", { weekday: "long" }) : "";
    $("#dockHead").innerHTML = `<div class="dk-trip">
      <svg class="dk-trip__art" viewBox="0 0 240 120" aria-hidden="true" focusable="false"><path d="M0 120 L48 62 L72 86 L120 22 L166 80 L190 56 L240 120Z" fill="rgba(196,162,94,.16)"/><path d="M0 120 L40 82 L66 100 L120 44 L170 104 L204 78 L240 120Z" fill="rgba(196,162,94,.12)"/><circle cx="196" cy="26" r="11" fill="none" stroke="rgba(196,162,94,.55)" stroke-width="1.2"/></svg>
      <div class="dk-trip__top"><p class="dk-trip__eyebrow"><span class="hanko" lang="ja" aria-hidden="true">旅</span>Your trip</p><button type="button" class="dk-help" data-example-open aria-label="Watch a planning example">How to plan</button><button type="button" class="dk-edit" id="tripEdit" aria-expanded="${ui.settings}" aria-controls="tripSet">${ui.settings ? "Done" : "Edit trip"}</button></div>
      <h2 class="dk-trip__dates">${esc(rangeLabel())}</h2>
      <p class="dk-trip__meta">${esc(wd(a0))} to ${esc(wd(a1))} · ${S.days - 1} night${S.days - 1 === 1 ? "" : "s"} · ${esc(S.stay === "own" ? "Staying elsewhere" : D.bases[S.stay].name)}</p>
    </div>`;
  }
  function renderSettings() {
    const box = $("#tripSet"); box.hidden = !ui.settings;
    $("#dock").classList.toggle("is-settings", ui.settings);
    if (!ui.settings) { box.innerHTML = ""; return; }
    const seg = (key, list, cur) => `<div class="seg" role="group">${list.map(([v, l]) => `<button type="button" data-set="${key}" data-v="${v}" aria-pressed="${String(cur) === String(v)}">${esc(l)}</button>`).join("")}</div>`;
    box.innerHTML = `<div class="ts"><div class="ts__row ts__row--col ts__row--date"><span id="ts-date-l">First day</span>${A.dateControl("ts-date", S.date)}</div><p class="ts__echo">${esc(A.dayLong(0))} to ${esc(A.dayLong(S.days - 1))}</p>
      <div class="ts__row"><span>Length</span>${seg("days", [3, 4, 5, 6, 7].map(n => [n, n]), S.days)}</div>
      <p class="small">Manual additions stay where you choose. Only a drop on Auto-arrange can rearrange activities or extend the trip.</p>
      <div class="ts__row"><span>Walking</span>${seg("walk", [[3, "Flat & short"], [4, "Some hills"], [5, "Active"]], S.walk)}</div>
      <div class="ts__row ts__row--col"><span>Where you stay</span><div class="ts__stay" role="group" aria-label="Where you stay">${MD.stay.ORDER.map(k => `<button type="button" class="ts__stayb" data-stayset="${k}" aria-pressed="${S.stay === k}"><b>${esc(MD.stay.OPTIONS[k].pcg ? MD.stay.OPTIONS[k].name : "Somewhere else")}</b><small>${esc(MD.stay.OPTIONS[k].line)}</small></button>`).join("")}</div></div>
      <div class="ts__row ts__row--col"><span>Start again from</span><div class="ts__starts">${["restore", "discover", "active"].map(k => `<button type="button" class="linkbtn" data-restart="${k}">${esc(D.courses[k].name)}</button>`).join("")}<button type="button" class="linkbtn" data-restart="blank">Start a new trip</button></div></div></div>`;
  }
  function renderFoot(plan) {
    const ids = plan.days.flatMap(d => [...d.items, ...d.extras].map(a => a.id)), t = P.totals({ ...S, sel: new Set(ids) });
    const g = A.getAround(plan), sq = MD.stay.quote(S), all = t.yen + sq.perPerson;
    const prevAll = ui.lastTotal == null ? all : ui.lastTotal;
    $("#dockFoot").innerHTML = `<div class="dk-total"><span class="label">Per person</span><b id="dkTotal">${A.sgd(all)}</b><small>${sq.stay ? `Activities ${A.sgd(t.yen)} · Stay ${A.sgd(sq.perPerson)}` : `${yen(t.yen)} · ${ids.length} ${ids.length === 1 ? "activity" : "activities"}`}</small></div><button type="button" class="btn" id="toBook">Review trip ${ARROW}</button>
      <p class="dk-ride" title="Public transport in the valley is limited, so the plan assumes a chartered van on days with something on. This is a group cost for the whole van, not per person."><span class="dk-ride__t"><svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="M3 5h11l3 4v5H3z M3 10h14 M6.5 16.2a1.4 1.4 0 1 0 .01 0 M13.5 16.2a1.4 1.4 0 1 0 .01 0" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>Van · ${g.rideDays} day${g.rideDays === 1 ? "" : "s"}</span><b>${yen(g.total)}</b><small class="dk-ride__n">whole group</small></p>
      <p class="dk-scope">${sq.stay ? "Activities and stay, per person. The van is a group cost; rail is extra." : "Activities, per person. The van is a group cost; rail and stay are extra."}</p>`;
    A.countUp($("#dkTotal"), prevAll, all); ui.lastTotal = all;
    $("#daysN") && ($("#daysN").textContent = "");
  }

  /* ---------- map filters, places drawer ---------- */
  const catCount = c => D.activities.filter(a => a.cat === c && matches(a, true)).length;
  /* the type filter: ONE dropdown of checkboxes (tick several), used in the Places pane and on the phone's map bar */
  function typeDropdown(where) {
    const k = S.catFilter.length;
    const label = k === 0 ? "All types" : k === 1 ? A.CATS[S.catFilter[0]] : k + " types";
    const opts = Object.entries(A.CATS).map(([c, l]) => `<label class="tmenu__opt"><input type="checkbox" data-catbox="${c}"${S.catFilter.includes(c) ? " checked" : ""}><span>${esc(l)}</span><sup>${catCount(c)}</sup></label>`).join("");
    return `<div class="tmenu tmenu--${where}"><button type="button" class="tbtn${k ? " is-on" : ""}" data-typemenu aria-haspopup="true" aria-expanded="${!!ui.typeMenu}" title="Choose which types of place to show"><span>${esc(label)}</span><i aria-hidden="true">▾</i></button>${ui.typeMenu ? `<div class="tmenu__pop" role="group" aria-label="Show these types of place">${opts}<div class="tmenu__foot"><button type="button" class="linkbtn" data-catclear>Show all types</button><button type="button" class="btn btn--sm" data-typeclose>Done</button></div></div>` : ""}</div>`;
  }
  function renderFilters() {
    const n = c => D.activities.filter(a => (!c || a.cat === c) && matches(a, true)).length;
    const total = D.activities.filter(a => matches(a)).length;
    const listIcon = `<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M2 4h12M2 8h12M2 12h12"/></svg>`;
    if (!narrowQ.matches) { $("#mapFilters").innerHTML = ""; return; }   // desktop: search, types and switches live in the Places pane, so the map stays clear
    $("#mapFilters").innerHTML = ""; // Search and filters live in the one planning dock on every screen.

  }
  function renderDrawer(plan) {
    const box = $("#drawer");
    $("#dock").classList.toggle("has-tray", ui.drawer);
    $("#studio").classList.toggle("has-drawer", ui.drawer);
    box.inert = !ui.drawer; box.setAttribute("aria-hidden", ui.drawer ? "false" : "true");
    if (!ui.drawer) return;   // closed: the last content stays put while the tray slides away
    const prevTop = (box.querySelector(".drawer__list") || {}).scrollTop || 0, fa = document.activeElement;
    const keepQ = fa && fa.id === "q", keepId = fa && box.contains(fa) && (fa.dataset.add || fa.dataset.remove) || null;
    const list = D.activities.filter(a => matches(a));
    const di = P.dayIndex(plan);
    const zoneOrder = Object.keys(D.zones);
    list.sort((a, b) => zoneOrder.indexOf(a.zone) - zoneOrder.indexOf(b.zone) || (a.src === "desk") - (b.src === "desk") || a.name.localeCompare(b.name));
    const n = c => D.activities.filter(a => (!c || a.cat === c) && matches(a, true)).length;
    const strip = `<div class="dstrip" id="dayStrip" role="group" aria-label="Where new places go"><span class="dstrip__l">Add to</span><button type="button" class="dchip" data-cleartarget data-dropchip="auto" aria-pressed="${!S.target}" title="Let Myoko Days choose the best free block. You can also drop a card here.">Auto-arrange</button>${plan.days.map(d => { const n = d.items.length + d.extras.length, on = !!S.target && S.target.day === d.i; return `<button type="button" class="dchip" data-pickday="${d.i}" data-dropchip="${d.i}" aria-pressed="${on}" aria-label="Day ${d.i + 1}" title="Add new places to Day ${d.i + 1}. You can also drop a card here.">D${d.i + 1}${on && S.target.slot ? " · " + SLOT[S.target.slot].toLowerCase() : ""}${n ? `<i>${n}</i>` : ""}</button>`; }).join("")}</div>`;
    const tgtLine = S.target ? `Adding to <b>Day ${S.target.day + 1}${S.target.slot ? " · " + SLOT[S.target.slot].toLowerCase() : ""}</b>.` : "";
    const card = a => {
      const inT = S.sel.has(a.id), off = A.avail(a), day = di[a.id];   // off = hard blocks only (none in the data now); walking and season are only a note
      const act = inT ? `<button type="button" class="pl__add is-in" data-focus="${a.id}" aria-label="View ${esc(a.name)} in your trip" title="View in your trip"><span class="pl__tick" aria-hidden="true">✓</span><span class="pl__x" aria-hidden="true">×</span></button>`
        : off ? `<span class="pl__add is-off" title="${esc(off)}" aria-hidden="true">+</span>`
        : `<button type="button" class="pl__add" data-prepare="${a.id}" aria-label="Add ${esc(a.name)} to your trip" title="Add to your trip">+</button>`;
      return `<li class="pl${inT ? " is-in" : ""}${off && !inT ? " is-off" : ""}${S.focus === a.id ? " is-focus" : ""}" data-hover="${a.id}"${off && !inT ? "" : ` data-grabplace="${a.id}"`}>
        <div class="pl__pic"><button type="button" class="pl__open" data-focus="${a.id}" aria-label="Details: ${esc(a.name)}" tabindex="-1">${picture(a, "pl__img")}</button>${inT && day ? `<span class="pl__day">Day ${day}</span>` : ""}${act}</div>
        <div class="pl__body"><button type="button" class="pl__name" data-focus="${a.id}">${esc(a.name)}</button><p class="pl__meta"><span>${A.lenTxt(a)}</span><span>${A.priceTxt(a)}</span></p>${off && !inT ? `<p class="pl__why">${esc(off)}</p>` : ""}</div></li>`;
    };
    let body = "", lastZone = null;
    list.forEach(a => {
      if (a.zone !== lastZone) { lastZone = a.zone; body += `<li class="drawer__grp" role="presentation"><span>${esc(D.zones[a.zone].name)}</span><b>${list.filter(x => x.zone === a.zone).length}</b></li>`; }
      body += card(a);
    });
    const tgl = (k, on, label, tip) => `<button type="button" class="tchip tchip--tgl" data-tgl="${k}" aria-pressed="${on}" title="${esc(tip)}">${on ? "✓ " : ""}${esc(label)}</button>`;
    const hint = narrowQ.matches ? "Press + to add a place to your days." : "Press + to add a place, or drag a card onto a day.";
    const tg2 = `<div class="drawer__tgls">${tgl("fits", S.fitsOnly, "Fits my dates", "Only show places that suit your dates and walking level")}${tgl("extra", S.showExtras, "Extra ideas", "A few more ideas nearby, without a 3D model")}</div>`;
    const fine = `<li class="drawer__note" role="presentation">${narrowQ.matches ? tg2 : ""}<p><b>${narrowQ.matches ? "Press + to add a place." : "Press + to add a place, or drag a card onto a day above."}</b> Some places may involve more walking than you chose, or fall outside the listed season for your dates. You can still add them.</p></li>`;
    box.innerHTML = `<header class="drawer__head"><div class="drawer__t"><h2>Places <span class="drawer__n">${list.length}</span></h2><p class="drawer__hint">${hint}</p></div>
        <input id="q" type="search" placeholder="Search places" value="${esc(S.query)}" autocomplete="off" aria-label="Search places">
        <button type="button" class="quiet-filter" data-filter-toggle aria-expanded="${ui.filterOpen}">Filters${S.catFilter.length || S.fitsOnly || S.showExtras ? " · on" : ""}</button>${ui.filterOpen ? `<div class="quiet-filter-options">${typeDropdown("drawer")}${tg2}</div>` : ""}<button type="button" class="drawer__x" data-drawer-close aria-label="Hide the list">×</button></header>
      ${strip}${S.sel.size || ui.receipt ? "" : intro()}
      <ul class="drawer__list">${list.length ? body : `<li class="drawer__empty"><b>Nothing matches.</b><p>Try another type, or <button type="button" class="linkbtn" data-clearfilters>clear the filters</button>.</p></li>`}</ul>`;
    const ul = box.querySelector(".drawer__list"); if (ul) ul.scrollTop = prevTop;
    if (keepQ) { const q = $("#q"); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } }
    else if (keepId) { const b = box.querySelector(`[data-add="${keepId}"],[data-remove="${keepId}"]`); if (b) b.focus({ preventScroll: true }); }
  }

  /* ---------- the card that opens from a pin or a row ---------- */
  function addState(a) {
    if (S.sel.has(a.id)) return { kind: "in" };
    const r=P.direct(S,a.id,S.target);
    return r.ok?{kind:'ok',r}:{kind:'blocked',r};
  }

  function intro() {
    return `<div class="quiet-intro"><div class="quiet-intro__path" aria-hidden="true"><span><svg viewBox="0 0 32 32"><path d="M22 13c0 5-6 11-6 11S10 18 10 13a6 6 0 1 1 12 0Z"/><circle cx="16" cy="13" r="2"/><path d="m9 21-4 2v6l11-3 11 3v-6l-4-2"/></svg></span><i><svg viewBox="0 0 24 16"><path d="M2 8h19m-5-5 5 5-5 5"/></svg></i><span><svg viewBox="0 0 32 32"><rect x="4" y="5" width="21" height="22" rx="2"/><path d="M4 18h15M8 14l4-5 6 7M9 22h7"/><circle cx="21" cy="22" r="7" class="quiet-icon-paper"/><path d="M21 18v8m-4-4h8"/></svg></span><i><svg viewBox="0 0 24 16"><path d="M2 8h19m-5-5 5 5-5 5"/></svg></i><span><svg viewBox="0 0 32 32"><rect x="5" y="7" width="23" height="21" rx="2"/><path d="M5 13h23M11 4v6m11-6v6m-11 10 4 4 7-7"/></svg></span></div><b>What would you like to do?</b><p>Choose a place on the map, or browse below.</p><button type="button" class="linkbtn" data-example-open>▷ Watch an example</button></div>`;
  }
  function placementUI(a, r) {
    if(ui.placing !== a.id)return `<button type="button" class="btn pc__add" data-prepare="${a.id}">Add to my trip ${ARROW}</button>`;
    const candidates=P.isAddon(a)?Array.from({length:S.days},(_,day)=>({day,slot:'x'})):P.candidates(a,S);
    const chosen=ui.proposed || (r.ok && r.placed) || candidates[0];
    ui.proposed=chosen;
    const opts=candidates.map(c=>{const v=c.day+':'+c.slot, rr=P.direct(S,a.id,c);return `<option value="${v}"${chosen&&v===chosen.day+':'+chosen.slot?' selected':''}>Day ${c.day+1} · ${A.dayShort(c.day)} · ${P.isLong(a)?'Full day':SLOT[c.slot]||'Short stop'}${rr.ok?'':' · occupied'}</option>`;}).join('');
    return `<div class="quiet-placement"><label for="placeDestination">Add to a day</label>${opts?`<select id="placeDestination">${opts}</select><button type="button" class="btn" data-confirm-add="${a.id}">Confirm activity ${ARROW}</button>`:`<p>No free block is available.</p><button type="button" class="btn" data-resolve="${a.id}">Choose another arrangement</button>`}<button type="button" class="linkbtn" data-placement-back>Cancel</button></div>`;
  }
  function renderReceipt(plan, meta) {
    if(meta.added){ui.receipt={id:meta.added,before:meta.before};ui.placing=null;ui.proposed=null;}
    if(ui.receipt&&!S.sel.has(ui.receipt.id))ui.receipt=null;
    const box=$('#buildReceipt'),r=ui.receipt;
    box.hidden=!r;
    if(r){const pl=P.slotOf(plan,r.id);box.innerHTML=`<span><b>${esc(D.byId[r.id].name)}</b>${pl?'Added to '+esc(whereOf(D.byId[r.id],pl)):'Choose a block to finish adding'}</span><div><button type="button" data-receipt-view>View day</button>${r.before?'<button type="button" data-receipt-undo>Undo</button>':''}<button type="button" data-receipt-close aria-label="Dismiss confirmation">×</button></div>`;}
  }
  const REQ = { zip: "Safety briefing language, age and weight limits apply.", sup: "Swimming ability is required; equipment and the safety briefing are provided.", kayak: "Water confidence is required; equipment and the safety briefing are provided.", ebike: "Riding ability and route conditions matter; the briefing and equipment are provided." };
  function blockedUI(a, r) {
    if(r.code==='conflict')return `<p class="pc__why">${esc(r.why)}</p><button type="button" class="btn btn--sm" data-resolve="${a.id}">Choose where it goes</button>`;
    let h = `<p class="pc__why">${esc(r.why)}.</p>`;
    const btns = [];
    if (r.code === "walk") btns.push(`<button type="button" class="btn btn--sm" data-fix="walk">Raise walking to “${esc(A.WALK_LABEL[a.ef] || "Active days")}” and add</button>`);
    if (r.code === "season") btns.push(`<button type="button" class="btn btn--sm btn--ghost" data-fix="dates">Change my dates</button>`);
    (r.options || []).forEach(o => {
      if (o.type === "extend") btns.push(`<button type="button" class="btn btn--sm" data-fix="extend">Add a day and place it</button>`);
      if (o.type === "swap") btns.push(`<button type="button" class="btn btn--sm btn--ghost" data-fix="swap:${o.id}">Swap with ${esc(D.byId[o.id].name)}</button>`);
    });
    if (r.code === "full" && !(r.options || []).length) btns.push(`<span class="small">Remove something, or change your dates.</span>`);
    return h + (btns.length ? `<div class="pc__opts">${btns.join("")}</div>` : "");
  }
  function renderDetail() {
    const box = $("#detail"), a = S.focus && D.byId[S.focus];
    box.hidden = !a;
    $("#studio").classList.toggle("has-card", !!a);
    if (!a) { box.innerHTML = ""; return; }
    const st = addState(a), inT = st.kind === "in";
    const plan = P.schedule(S), pl = inT ? P.slotOf(plan, a.id) : null;
    const price = a.price == null || a.price === 0 ? "Free" : yen(a.price);
    let action;
    if (inT) action = `<div class="pc__in"><span class="pc__seal" aria-hidden="true">${pl ? pl.day + 1 : "?"}</span><div><b>In your plan</b><span>${esc(whereOf(a, pl) || "Not placed yet")}</span></div></div><div class="pc__row"><button type="button" class="btn btn--ghost btn--sm" data-remove="${a.id}">Remove</button><button type="button" class="linkbtn" data-showrow="${a.id}">Show in your days</button></div>`;
    else action = placementUI(a, st.r);

    box.innerHTML = `<div class="pc__closebar"><button type="button" class="detail-back" data-close>← Back to ${ui.drawer?"places":"your days"}</button><button type="button" class="pc__x" data-close aria-label="Close details">×</button></div><div class="pc__media">${picture(a, "pc__img")}${MD.mediaLibrary[a.id] ? `<button type="button" class="gallery-open" data-gallery="${a.id}">${MD.mediaLibrary[a.id].photos.length} photos · ${MD.mediaLibrary[a.id].videos.length} films <span aria-hidden="true">↗</span></button>` : (a.img ? '<span class="image-caption">Illustrative image</span>' : "")}</div>
      <div class="pc__body"><p class="label">${esc(D.zones[a.zone].short)} · ${esc(A.CATS[a.cat] || "")}${a.src === "desk" ? " · More in the area" : ""}</p><h3>${esc(a.name)}</h3>${a.stops && a.stops.length > 1 && ui.stop != null && a.stops[ui.stop] ? `<p class="pc__stop"><span>Stop ${ui.stop + 1} of ${a.stops.length}</span> ${esc(a.stops[ui.stop].name)}</p>` : ""}<p class="pc__desc">${esc(a.desc)}</p>${a.stops && a.stops.length > 1 ? `<ol class="stops stops--tour" aria-label="Stops, in order">${a.stops.map((st, i) => `<li${ui.stop === i ? ' class="is-here"' : ""}><button type="button" data-stop="${i}" data-stopof="${a.id}">${esc(st.name)}</button></li>`).join("")}</ol>` : ""}
        <p class="pc__line"><span>${P.isLong(a) ? "Full day" : A.lenTxt(a)}</span><span>${price}</span><span>${esc(D.effort[a.ef])}</span></p>
        ${P.isLong(a) ? `<p class="pc__long">A full-day outing reserves both morning and afternoon.</p>` : ""}
        <div class="pc__action">${action}</div>
        <details class="pc__more"><summary>Details &amp; checks</summary><p class="pc__season"><b>Season</b> ${A.runsTxt(a)}</p>${REQ[a.id] ? `<p class="detail__check">${REQ[a.id]}</p>` : ""}<p class="detail__check">Host: ${esc(a.host)}. Lunch: ${a.lunch ? "included" : "not included"}.</p></details></div>`;
  }

  /* ---------- drawing everything ---------- */
  function flipRender(fn) {
    const first = new Map();
    $$("#dockDays [data-flip]").forEach(e => first.set(e.dataset.flip, e.getBoundingClientRect()));
    fn();
    if (A.reduceMotion) return;
    $$("#dockDays [data-flip]").forEach(e => {
      const f = first.get(e.dataset.flip), l = e.getBoundingClientRect();
      if (!f) return;
      const dx = f.left - l.left, dy = f.top - l.top;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) e.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: "none" }], { duration: 380, easing: "cubic-bezier(.2,.7,.2,1)" });
    });
  }
  function render(meta) {
    meta = meta || {};
    if (!ui.active) { if (meta.restart && !narrowQ.matches) { ui.paneSet = true; ui.drawer = !S.sel.size; } ui.dirty = true; return; }   // a trip just chosen on the Plan page opens on its days; a blank start opens on the places
    ui.dirty = false;
    if (S.focus && !D.byId[S.focus]) S.focus = null;
    if (S.target && S.target.day >= S.days) S.target = null;
    const plan = P.schedule(S);
    flipRender(() => { renderHead(); renderTabs(plan); renderSettings(); renderDays(plan); renderFoot(plan); });
    document.body.classList.toggle("drawer-open", ui.drawer);
    renderFilters(); renderDrawer(plan); renderDetail(); renderReceipt(plan,meta);
    const focusPanel=!!S.focus, example=false;
    $('#dock').classList.toggle('has-detail',focusPanel);
    $('#dock').classList.toggle('has-example',example);
    $('#drawer').inert=focusPanel||example||!ui.drawer;
    $('#dockDays').inert=focusPanel||example||ui.drawer;
    placeInsets();
    syncMap(plan);
    if (meta.added && !S.coachSeen) dismissCoach();
    if (meta.added || meta.moved) {
      const id = meta.added || (meta.moved && meta.moved[0]);
      const row = id && $$("#dockDays [data-flip]").find(e => e.dataset.flip === id);
      if (row && !ui.drawer && !S.focus) { row.scrollIntoView({ block: "nearest", behavior: A.smooth }); }
      if (meta.added && MD.map.isReady() && MD.map.pulse) MD.map.pulse(meta.added);
    }
    S.focusNew = null;
    if (meta.restart && MD.map.isReady()) MD.map.overview();
  }
  function syncMap(plan) { if (MD.map.isReady()) MD.map.update(S, plan || P.schedule(S)); }
  A.onChange(render);

  /* ---------- the map ---------- */
  let mapStarted = false;
  function ensureMap() {
    if (mapStarted && MD.map.isReady()) { MD.map.resize(); syncMap(); return; }
    mapStarted = true;
    requestAnimationFrame(() => {
      MD.map.init($("#map"), {
        onPin: (id, o) => openDetail(id, { stop: o && o.stop, focusCard: !!(document.activeElement && document.activeElement.matches && document.activeElement.matches(":focus-visible")) }),
        onToggle: id => openDetail(id),
        onHover: id => hoverRow(id),
        onNotice: m => A.toast(m, { kind: "warn" }),
        onReady: () => { syncMap(); placeInsets(); MD.mapExample?.maybeOpen(); }
      });
      MD.map.resize(); syncMap();
    });
  }
  function placeInsets() {
    if (!MD.map.isReady()) return;
    const insets = {}, card = $("#detail");
    insets.top = 12; // Detail and example panels never overlay the map.
    MD.map.setInsets(insets);
  }
  function openDetail(id, o) {
    o = o || {};
    ui.stop = o.stop == null ? null : o.stop;
    MD.mapExample?.close(false);
    ui.placing=null;ui.proposed=null; S.focus = id; render();
    placeInsets();
    const a = D.byId[id];
    if (MD.map.isReady() && o.stop != null && a.stops) MD.map.focusStop(id, o.stop);
    else if (MD.map.isReady() && A.isPinned(a)) MD.map.focus(id);
    const row = $$("#dockDays [data-flip]").find(e => e.dataset.flip === id); if (row && !narrowQ.matches) row.scrollIntoView({ block: "nearest", behavior: A.smooth });
    if (o.focusCard) { const c = $("#detail .pc__x"); if (c) c.focus({ preventScroll: true }); }
  }
  function closeDetail() { if (!S.focus) return; const id=S.focus;ui.placing=null; ui.proposed=null; S.focus = null; ui.stop = null; render();const b=document.querySelector(ui.drawer?'#drawer [data-focus="'+id+'"]':'#dockDays [data-focus="'+id+'"]');b?.focus({preventScroll:true}); if (MD.map.isReady()) { placeInsets(); } }
  function hoverRow(id) {
    $$("#dockDays .item.is-hot, #drawer .pl.is-hot").forEach(e => e.classList.remove("is-hot"));
    if (!id) return;
    $$(`#dockDays [data-hover="${id}"], #drawer [data-hover="${id}"]`).forEach(e => e.classList.add("is-hot"));
  }

  /* ---------- fixes offered when a place can't simply be added ---------- */
  function applyFix(id, fix) {
    const a = D.byId[id]; if (!a) return;
    if (fix === "walk") { A.changeSetting("walk", Math.max(3, a.ef)); A.addPlace(id); return; }
    if (fix === "dates") { ui.settings = true; render(); const d = $("#ts-date select"); if (d) d.focus(); return; }
    if (fix === "extend") { S.days = Math.min(A.MAX_DAYS, S.days + 1); const r = A.addPlace(id); if (!r.ok) { S.days -= 1; } return; }
    if (fix.startsWith("swap:")) {
      const out = fix.slice(5), before = A.snap();
      S.sel.delete(out); delete S.placements[out];
      const r = P.add(S, id, { lock: false });
      if (!r.ok) { A.restore(before); A.toast(r.why, { kind: "warn" }); return; }
      S.sel.add(id); S.placements = r.placements; S.days = r.days || S.days; S.focusNew = id;
      A.changed({ added: id });
      A.toast(`Swapped ${D.byId[out].name} for ${a.name}`, { undo: () => A.restore(before) });
    }
  }

  /* ---------- events ---------- */
  function setTab() { /* the dock only holds the days now */ }
  document.addEventListener("click", e => {
    if (!ui.active) return;
    const t = e.target;
    if(t.closest('[data-expand-panel]')){const expanded=$('#studio').classList.toggle('is-expanded');const b=t.closest('[data-expand-panel]');b.textContent=expanded?'Show more map ↓':'Expand panel ↑';b.setAttribute('aria-expanded',String(expanded));return;}
    if(t.closest('[data-example-open]')){MD.mapExample.open();return;}
    if(t.closest('[data-filter-toggle]')){ui.filterOpen=!ui.filterOpen;render();return;}
    if(t.closest('[data-receipt-close]')){ui.receipt=null;render();return;}
    if(t.closest('[data-receipt-undo]')){const b=ui.receipt?.before;ui.receipt=null;if(b)A.restore(b);return;}
    if(t.closest('[data-receipt-view]')){const id=ui.receipt?.id;S.focus=null;ui.drawer=false;render();const row=id&&$('#dockDays [data-flip="'+id+'"]');row?.scrollIntoView({block:'center',behavior:A.smooth});return;}
    const prep=t.closest('[data-prepare]');if(prep){const id=prep.dataset.prepare;if(S.focus!==id)openDetail(id);ui.placing=id;ui.proposed=null;render();$('#placeDestination')?.focus({preventScroll:true});return;}
    if(t.closest('[data-placement-back]')){ui.placing=null;ui.proposed=null;render();return;}
    const confirm=t.closest('[data-confirm-add]');if(confirm){A.addPlace(confirm.dataset.confirmAdd,{target:ui.proposed});return;}

    if (ui.menu && !t.closest(".item__menu, [data-menu]")) { ui.menu = null; render(); }
    if (t.closest("#tripEdit")) { MD.mapExample?.close(false);S.focus=null; ui.settings = !ui.settings; render(); return; }   // the settings take the whole panel while they are open
    const ss = t.closest("#tripSet [data-stayset]");
    if (ss) { A.setStay(ss.dataset.stayset); return; }
    const set = t.closest("#tripSet [data-set]");
    if (set) { A.changeSetting(set.dataset.set, Number(set.dataset.v)); return; }
    const rs = t.closest("[data-restart]");
    if (rs) { A.pickCourse(rs.dataset.restart); return; }
    const pane = t.closest("[data-pane]");
    if (pane) { MD.mapExample?.close(false);S.focus=null;ui.placing=null; ui.drawer = pane.dataset.pane === "places"; ui.settings = false; render(); placeInsets(); if (ui.drawer && !coarseQ.matches) { const q = $("#q"); if (q && !q.value) q.focus({ preventScroll: true }); } return; }
    const tab = t.closest("[data-drawer-toggle]");
    if (tab) { ui.drawer = !ui.drawer; render(); placeInsets(); if (ui.drawer && !narrowQ.matches) { /* keep the map framed in the clear part */ } return; }
    if (t.closest("[data-drawer-close]")) { ui.drawer = false; render(); placeInsets(); return; }
    const tg = t.closest("[data-tgl]");
    if (tg) { if (tg.dataset.tgl === "fits") S.fitsOnly = !S.fitsOnly; else S.showExtras = !S.showExtras; render(); return; }
    if (t.closest("[data-catclear]")) { S.catFilter = []; render(); return; }
    if (t.closest("[data-typeclose]")) { ui.typeMenu = false; render(); return; }
    if (t.closest("[data-typemenu]")) { ui.typeMenu = !ui.typeMenu; render(); return; }
    if (ui.typeMenu && !t.closest(".tmenu")) { ui.typeMenu = false; render(); }
    if (t.closest("[data-clearfilters]")) { S.catFilter = []; S.zoneFilter = ""; S.fitsOnly = false; S.showExtras = false; S.query = ""; render(); return; }
    const resolve=t.closest('[data-resolve]');if(resolve){const r=P.direct(S,resolve.dataset.resolve,S.target);A.requestPlacement(resolve.dataset.resolve,S.target,r.ok?'Choose a free block or remove this activity.':r.why);return;}
    if (t.closest("[data-coachclose]")) { dismissCoach(); return; }
    if (t.closest("[data-cleartarget]")) { S.target = null; A.changed(); return; }
    const pick = t.closest("[data-pickday]");
    if (pick) {
      const day = Number(pick.dataset.pickday);
      S.target = S.target && S.target.day === day && !S.target.slot ? null : { day, slot: null };
      if (S.target && !narrowQ.matches && !pick.closest("#dayStrip")) { ui.drawer = true; ui.settings = false; }   // choosing a day from Your days opens Places, ready to add to it
      A.changed();
      if (S.target && MD.map.isReady()) MD.map.showDay(P.schedule(S).days[day]);
      return;
    }
    const br = t.closest("[data-browse]");
    if (br) { const [d, s] = br.dataset.browse.split(":"); S.target = { day: Number(d), slot: s }; ui.drawer = true; A.changed(); placeInsets(); const q = $("#q"); if (q) q.focus({ preventScroll: true }); return; }
    const sug = t.closest("[data-sug]");
    if (sug) { const r = A.addPlace(sug.dataset.sug, { target: { day: Number(sug.dataset.day), slot: sug.dataset.slot } }); if (!r.ok) A.toast(r.why, { kind: "warn" }); return; }
    const add = t.closest("[data-add]");
    if (add) { const r = A.addPlace(add.dataset.add); if (!r.ok) { A.toast(r.why, { kind: "warn" }); if (S.focus !== add.dataset.add) openDetail(add.dataset.add); } return; }
    const fix = t.closest("[data-fix]");
    if (fix && S.focus) { applyFix(S.focus, fix.dataset.fix); return; }
    const rm = t.closest("[data-remove]");
    if (rm) { A.removePlace(rm.dataset.remove); return; }
    const menu = t.closest("[data-menu]");
    if (menu) { ui.menu = ui.menu === menu.dataset.menu ? null : menu.dataset.menu; render(); const sel = $("#dockDays .item__menu select"); if (sel) sel.focus({ preventScroll: true }); return; }
    const foc = t.closest("[data-focus]");
    if (foc) { openDetail(foc.dataset.focus); return; }
    const stp = t.closest("[data-stop]");
    if (stp) { const sid = stp.dataset.stopof, si = +stp.dataset.stop; ui.stop = si; render(); if (MD.map.isReady()) MD.map.focusStop(sid, si); return; }
    if (t.closest("[data-close]")) { closeDetail(); return; }
    const sr = t.closest("[data-showrow]");
    if (sr) { S.focus=null;ui.drawer=false;render(); const row = $$("#dockDays [data-flip]").find(x => x.dataset.flip === sr.dataset.showrow); if (row) { row.scrollIntoView({ block: "center", behavior: A.smooth }); row.classList.add("is-new"); setTimeout(() => row.classList.remove("is-new"), 1600); } return; }
    if (t.closest("[data-addday]")) { A.changeSetting("days", Math.min(A.MAX_DAYS, S.days + 1)); return; }
    if (t.closest("[data-dropday]")) { A.changeSetting("days", Math.max(A.MIN_DAYS, S.days - 1)); return; }
    if (t.closest("[data-clear]")) { A.clearTrip(); return; }
    if (t.closest("[data-refit]")) { const before = A.snap(); A.reconcile(); A.changed(); A.toast("Fitted what could be fitted", { undo: () => A.restore(before) }); return; }
    if (t.closest("#toBook")) { location.hash = "#book"; return; }
  });
  document.addEventListener("change", e => {
    if (!ui.active) return;
    const id = e.target.id, v = e.target.value;
    if(id==="placeDestination"){const [day,slot]=v.split(":");ui.proposed={day:Number(day),slot};return;}
    if (e.target.dataset.catbox) {
      const c = e.target.dataset.catbox, on = e.target.checked;
      S.catFilter = on ? [...new Set([...S.catFilter, c])] : S.catFilter.filter(x => x !== c);
      render();
      const nb = document.querySelector(`.tmenu__pop [data-catbox="${c}"]`); if (nb) nb.focus({ preventScroll: true });
      return;
    }
    if (e.target.dataset.moveto) {
      const [d, s] = v.split(":"), a = D.byId[e.target.dataset.moveto]; ui.menu = null;
      if (s === "x") A.moveToDay(a.id, Number(d)); else A.placeManual(a.id, Number(d), s);
      return;
    }
    if (id === "ts-flex") { S.flex = e.target.checked; A.changed(); return; }
    if (id === "f-avail") { S.fitsOnly = e.target.checked; render(); return; }
    if (id === "f-extra") { S.showExtras = e.target.checked; render(); return; }
  });
  document.addEventListener("input", e => { if (ui.active && e.target.id === "q") { S.query = e.target.value; render(); } });
  document.addEventListener("keydown", e => {
    if (!ui.active) return;
    if (e.key === "Escape") {
      if (drag) { clearDrag(); return; }
      if (ui.typeMenu) { ui.typeMenu = false; render(); return; }
      if (ui.menu) { ui.menu = null; render(); return; }
      if (ui.settings) { ui.settings = false; render(); return; }
      const tag = (e.target.tagName || "").toLowerCase();
      if (S.focus && tag !== "select" && tag !== "input") { closeDetail(); return; }
      if (ui.drawer && narrowQ.matches) { ui.drawer = false; render(); placeInsets(); }
    }
  });
  document.addEventListener("mouseover", e => { if (!ui.active) return; const h = e.target.closest && e.target.closest("[data-hover]"); if (h && MD.map.isReady()) MD.map.hover(h.dataset.hover); });
  document.addEventListener("mouseout", e => { if (!ui.active) return; const h = e.target.closest && e.target.closest("[data-hover]"); if (h && MD.map.isReady()) MD.map.hover(null); });

  /* ---------- drag and drop: from a day, or from the places list into a day ---------- */
  let drag = null;
  function slotFits(a, el) {
    if (el.dataset.dropchip === "auto") return true;   // Auto-arrange takes any place not yet in the trip and picks its block
    if (el.dataset.dropchip != null) return true;   // a day chip always accepts: the planner finds the best block that day
    if (el.dataset.dropextra != null) return P.isAddon(a);
    const day = Number(el.dataset.drop), slot = el.dataset.slot;
    if (P.isAddon(a)) return false;
    return !P.availability(a, S, day) && !P.slotWhy(a, S, day, slot);
  }
  function clearDrag() {
    if (drag && drag.ghost) drag.ghost.remove();
    $$(".is-drop-target,.is-drop-bad,.can-drop,.is-drag-origin").forEach(x => x.classList.remove("is-drop-target", "is-drop-bad", "can-drop", "is-drag-origin"));
    document.body.classList.remove("dragging-block");
    const b = $("#dropHint"); if (b) b.remove();
    drag = null;
  }
  function dropEval(a, el) {
    if (!el) return null;
    if (el.dataset.dropchip === "auto") {
      const r = P.add(S, a.id, { lock: false });
      return { ...r, day: null, slot: null, chip: true, hint: r.ok ? (r.extended ? "Adds a day" : "Add to the Auto-arrange") : "" };
    }
    if (el.dataset.dropchip != null) {
      const day = Number(el.dataset.dropchip), inT = S.sel.has(a.id);
      const r = inT ? P.move(S, a.id, day) : P.direct(S,a.id,{day});
      return { ...r, day, slot: null, chip: true, hint: r.ok ? (r.extended ? "Adds a day" : r.retargeted ? "Goes to the Auto-arrange" : (inT ? "Move to Day " : "Add to Day ") + (day + 1)) : "" };
    }
    if (el.dataset.dropextra != null) { const day = Number(el.dataset.dropextra); return P.isAddon(a) ? { ok: true, day, slot: "x" } : { ok: false, why: "Add-ons only" }; }
    const day = Number(el.dataset.drop), slot = el.dataset.slot;
    const tmp = S.sel.has(a.id) ? S : { ...S, sel: new Set([...S.sel, a.id]) };
    const r = P.place(tmp, a.id, day, slot);
    return { ...r, day, slot };
  }
  function dropHint(text, bad, x, y) {
    let b = $("#dropHint");
    if (!b) { b = document.createElement("div"); b.id = "dropHint"; b.className = "drop-hint"; document.body.appendChild(b); }
    b.textContent = text; b.classList.toggle("is-bad", !!bad); b.style.transform = `translate3d(${x + 18}px,${y - 34}px,0)`;
  }
  document.addEventListener("mousedown", e => { if (ui.active && e.target.closest("[data-grab]")) e.preventDefault(); });
  let swallow = false;   // a drag that ends over the card it began on must not also count as a click on it
  document.addEventListener("click", e => { if (swallow) { swallow = false; e.stopPropagation(); e.preventDefault(); } }, true);
  document.addEventListener("dragstart", e => { if (ui.active && e.target.closest && e.target.closest("#dock, #drawer")) e.preventDefault(); });
  document.addEventListener("pointerdown", e => {
    if (!ui.active) return;
    if(!e.target.closest('#coach'))dismissCoach();
    const h = e.target.closest("[data-grab],[data-grabplace]"); if (!h || e.button !== 0) return;
    const card = !!h.dataset.grabplace;
    if (card && (coarseQ.matches || narrowQ.matches || e.target.closest(".pl__add"))) return;   // on touch, + is the way to add; the + button itself never starts a drag
    const id = h.dataset.grab || h.dataset.grabplace;
    drag = { id, kind: card ? "place" : "item", x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, pid: e.pointerId, src: h.closest("[data-drag],.pl") };
    if (!card) { h.setPointerCapture && h.setPointerCapture(e.pointerId); e.preventDefault(); }
  });
  function dragScroll() {
    const d = drag; if (!d || !d.ghost) return;
    const box = $("#dockDays"), r = box.getBoundingClientRect();
    if (d.x > r.left && d.x < r.right) { if (d.y < r.top + 60) box.scrollTop -= 10; else if (d.y > r.bottom - 60) box.scrollTop += 10; }
    requestAnimationFrame(dragScroll);
  }
  document.addEventListener("pointermove", e => {
    const d = drag; if (!d || d.pid !== e.pointerId) return;
    d.x = e.clientX; d.y = e.clientY;
    const a = D.byId[d.id];
    if (!d.ghost && Math.hypot(d.x - d.sx, d.y - d.sy) > 5) {
      d.ghost = document.createElement("div"); d.ghost.className = "drag-ghost";
      d.ghost.innerHTML = `${picture(a, "drag-ghost__img")}<span>${esc(a.name)}</span>`;
      document.body.appendChild(d.ghost); d.src && d.src.classList.add("is-drag-origin"); document.body.classList.add("dragging-block");
      $$("#dockDays [data-drop], #dockDays [data-dropextra], #dayStrip [data-dropchip]").forEach(el => { if (slotFits(a, el)) el.classList.add("can-drop"); });
      dragScroll();
    }
    if (!d.ghost) return;
    e.preventDefault();
    d.ghost.style.transform = `translate3d(${d.x + 14}px,${d.y + 10}px,0)`;
    const el = document.elementFromPoint(d.x, d.y), tgt = el && el.closest("[data-drop],[data-dropextra],[data-dropchip]");
    $$(".is-drop-target,.is-drop-bad").forEach(x => x.classList.remove("is-drop-target", "is-drop-bad"));
    if (tgt && tgt.closest("#dockDays, #dayStrip")) {
      const r = dropEval(a, tgt);
      if (r && r.ok) { tgt.classList.add("is-drop-target"); const m = r.chip ? r.hint : r.swapped ? `Swaps with ${D.byId[r.swapped].name}` : r.moved && r.moved.length ? `Moves ${D.byId[r.moved[0].id].name}` : r.extended ? "Adds a day" : "Drop here"; dropHint(m, false, d.x, d.y); }
      else if (r) { tgt.classList.add("is-drop-bad"); dropHint(r.code==="conflict"?"Release to choose what moves or is removed":r.why || "Can't go here", r.code!=="conflict", d.x, d.y); }
    } else { const b = $("#dropHint"); if (b) b.remove(); }
  });
  document.addEventListener("pointerup", e => {
    const d = drag; if (!d) return;
    let target = null;
    if (d.ghost) { const el = document.elementFromPoint(e.clientX, e.clientY); target = el && el.closest("#dockDays [data-drop], #dockDays [data-dropextra], #dayStrip [data-dropchip]"); }
    const id = d.id, dragged = !!d.ghost; clearDrag();
    if (dragged) { swallow = true; setTimeout(() => { swallow = false; }, 80); }
    if (!target) return;
    if (target.dataset.dropchip === "auto") { { const r = A.addPlace(id, { target: null, auto:true }); if (!r.ok) A.toast(r.why, { kind: "warn" }); } return; }
    if (target.dataset.dropchip != null) { const day = Number(target.dataset.dropchip); if (S.sel.has(id)) A.moveToDay(id, day); else { const r = A.addPlace(id, { target: { day, slot: null } }); if (!r.ok) A.toast(r.why, { kind: "warn" }); } return; }
    if (target.dataset.dropextra != null) A.moveToDay(id, Number(target.dataset.dropextra)); else A.placeManual(id, Number(target.dataset.drop), target.dataset.slot);
  });
  document.addEventListener("pointercancel", () => clearDrag());

  /* ---------- first-visit coach: three short steps, shown once on the map ---------- */
  function renderCoach() {
    $('#coach')?.remove();
  }

  function dismissCoach() { S.coachSeen = true; try { localStorage.setItem("md_coach12", "1"); } catch (err) { /* ignore */ } const c = $("#coach"); if (c) c.remove(); }

  document.addEventListener('pointerdown',e=>{if(ui.active&&!e.target.closest('#coach'))dismissCoach();},true);
  document.addEventListener('wheel',e=>{if(ui.active&&e.target.closest('#mapWrap'))dismissCoach();},{passive:true,capture:true});
  /* ---------- enter / leave ---------- */
  function enter() {
    ui.active = true;
    if (!ui.paneSet) { ui.paneSet = true; ui.drawer = !S.sel.size; }   // a first visit opens on the list of places (the map is never bare); a trip chosen on the Plan page opens on its days
    document.body.classList.add("on-build");
    render();
    renderCoach();
    ensureMap();
    requestAnimationFrame(() => { if (MD.map.isReady()) { MD.map.resize(); syncMap(); MD.mapExample?.maybeOpen(); } });
  }
  narrowQ.addEventListener && narrowQ.addEventListener("change", () => { ui.drawer = !narrowQ.matches; ui.typeMenu = false; if (ui.active) { render(); placeInsets(); } });   // rotating a tablet or resizing across the phone breakpoint
  function leave() { MD.mapExample?.close(false);ui.active = false; document.body.classList.remove("drawer-open"); if (MD.map.isReady()) MD.map.setInsets({}); }
  if ("ResizeObserver" in window) {
    let raf = 0;
    new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { if (ui.active && MD.map.isReady()) { MD.map.resize(); placeInsets(); } }); }).observe($("#mapWrap"));
  }

  MD.studio = { enter, leave, render, openDetail, closeDetail, ui, addState, matches };
  A.start();
})();
