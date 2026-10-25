"""v12 browser checks: python3 verification/verify-v12.py  (needs the preview server on :8770 and Playwright + Chromium)"""
import sys
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8770/"
res = []
def check(name, ok, extra=""):
    res.append(ok); print(("PASS " if ok else "FAIL ") + name + (("  " + str(extra)) if (extra and not ok) else ""))
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"])
    pg = b.new_page(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(BASE + "#about"); pg.wait_for_timeout(1500)
    check("The area renders its gallery even when opened directly", pg.evaluate("document.querySelectorAll('#homeStrip figure').length") >= 4)
    nav = pg.evaluate("[...document.querySelectorAll('.hd__nav a')].map(a=>a.textContent.trim())")
    check("step 3 is called Review in the nav", any(t.endswith("Review") or t == "03Review" for t in nav), nav)
    pg.goto(BASE + "#plan"); pg.wait_for_timeout(1500)
    check("plan: first day is three day-first selects, no native date input", pg.evaluate("document.querySelectorAll('#plan-date select').length") == 3 and pg.evaluate("!document.querySelector('input[type=date]')"))
    pg.select_option("#plan-date select[data-dpart=y]", "2026"); pg.wait_for_timeout(300)
    check("plan: a past date cannot be chosen (snaps to today or later)", pg.evaluate("MD.app.S.date >= MD.app.today()"), pg.evaluate("MD.app.S.date"))
    pg.select_option("#plan-date select[data-dpart=y]", "2027"); pg.select_option("#plan-date select[data-dpart=m]", "9"); pg.select_option("#plan-date select[data-dpart=d]", "7"); pg.wait_for_timeout(300)
    check("plan: the echo spells the date out", "7 September 2027" in pg.evaluate("document.querySelector('.date-echo').textContent"))
    check("plan: the starting-point cards show a price or 'to confirm', never a bare TBC", pg.evaluate("![...document.querySelectorAll('#planCourses .shape__price b')].some(b=>b.textContent.trim()==='TBC')"))
    pg.goto(BASE + "#build"); pg.wait_for_timeout(1500); pg.evaluate("MD.app.pickCourse('restore')")   # v17.4: a first visit to Build is blank, so choose a course first
    pg.wait_for_function("window.MD && MD.map && MD.map.isReady()", timeout=90000)
    pg.wait_for_function("!document.querySelector('.dio__load')", timeout=60000); pg.wait_for_timeout(1500)
    R = lambda sel: pg.evaluate("(s)=>{const r=document.querySelector(s).getBoundingClientRect();return [r.left,r.top,r.right,r.bottom,r.width,r.height]}", sel)
    m, d = R("#mapWrap"), R("#dock")
    check("layout: the map takes 60% on the left and the panel 40% on the right", abs(m[4] / 1440 - 0.6) < 0.01 and abs(d[4] / 1440 - 0.4) < 0.01 and m[2] <= d[0] + 1, (m, d))
    check("layout: no top/bottom tray; the header, switch, pane and footer stack inside the panel", pg.evaluate("(()=>{const q=s=>document.querySelector(s).getBoundingClientRect();const h=q('#dockHead'),t=q('#dockTabs'),dr=q('#drawer'),f=q('#dockFoot');return h.bottom<=t.top+1&&t.bottom<=dr.top+1&&dr.bottom<=f.top+1&&dr.height>150})()"))
    check("switch: a first visit opens on the Places list", pg.evaluate("document.querySelector('#tab-places').getAttribute('aria-selected')") == "true" and pg.evaluate("getComputedStyle(document.querySelector('#dockDays')).display") == "none")
    cols = pg.evaluate("getComputedStyle(document.querySelector('.drawer__list')).gridTemplateColumns.split(' ').length")
    check("Places: cards run two to a row", cols == 2, cols)
    pg.click("#tab-days"); pg.wait_for_timeout(500)
    check("switch: Your days replaces the list (one pane at a time)", pg.evaluate("getComputedStyle(document.querySelector('#drawer')).display") == "none" and pg.evaluate("getComputedStyle(document.querySelector('#dockDays')).display") != "none")
    check("Your days: one column of days", pg.evaluate("[...new Set([...document.querySelectorAll('#dockDays .dayc')].map(e=>Math.round(e.getBoundingClientRect().left)))].length") == 1)
    pg.click("#tab-places"); pg.wait_for_timeout(500)
    check("the van rate comes from the assumptions file", pg.evaluate("MD.assume.v.vanPerDay") == 30000)
    check("every card has a round + (or a tick) and no ADD word", pg.evaluate("[...document.querySelectorAll('#drawer .pl')].every(l=>l.querySelector('.pl__add'))") and pg.evaluate("!/\\bAdd\\b/.test([...document.querySelectorAll('#drawer .pl__add')].map(b=>b.textContent).join(' '))"))
    # ---- no activity is ever blocked ----
    r = pg.evaluate("""(()=>{const A=MD.app,P=A.P,D=A.D;const base={...A.S,sel:new Set(),placements:{},walk:3,days:5,date:'2027-07-10',month:7,flex:true};const out=[];
      for(const a of D.activities){const r=P.add(base,a.id,{});out.push([a.id,r.ok,r.caution||'']);}
      return out})()""")
    check("adding is never blocked by walking level or season (every activity can be added)", all(x[1] for x in r), [x for x in r if not x[1]])
    check("...and a note says why (walking / season) instead", any("walking" in x[2] for x in r) and any("season" in x[2] for x in r))
    check("every place card keeps a live + (none greyed out)", pg.evaluate("document.querySelectorAll('#drawer .pl.is-off').length") == 0)
    sug = pg.evaluate("""(()=>{const A=MD.app,P=A.P,D=A.D;const s={...A.S,sel:new Set(),placements:{},walk:3};const o=P.suggestPlan(s,3);return Object.values(o).flat().every(x=>x.a.ef<=3)})()""")
    check("automatic suggestions still respect the walking level", sug)
    check("the right panel carries the small note about walking and season", "more walking" in pg.evaluate("document.querySelector('.drawer__note').textContent"))
    # ---- extras pruned ----
    ex = pg.evaluate("""(()=>{const D=MD.app.D,km=(p,q)=>{const r=x=>x*Math.PI/180,a=r(q[1]-p[1]),o=r(q[0]-p[0]);const h=Math.sin(a/2)**2+Math.cos(r(p[1]))*Math.cos(r(q[1]))*Math.sin(o/2)**2;return 2*6371*Math.asin(Math.sqrt(h))};
      const main=D.activities.filter(a=>a.src!=='desk'),desk=D.activities.filter(a=>a.src==='desk');
      return {n:desk.length,gone:['gondola','camp','museum','mushroom','longebike','lampsup','shinetsu'].every(i=>!D.byId[i]),near:desk.filter(d=>main.some(m=>km(d.ll,m.ll)<0.5)).map(d=>d.id),closed:desk.filter(d=>d.closed).map(d=>d.id)}})()""")
    check("extras: unavailable and overlapping ideas are removed", ex["gone"] and not ex["near"] and not ex["closed"], ex)
    # ---- zoom cap ----
    zc = pg.evaluate("""(()=>{const i=MD.map.instance(),sc=i.scene,L=sc.layout.spanMetres,w=document.querySelector('#map').clientWidth,h=document.querySelector('#map').clientHeight;
      sc.go(0,0,1);const z=sc.view.zoom;const pts=[-L.northSouth/2,L.northSouth/2].map(x=>sc.project(x,sc.heightAt(x,L.eastWest/2)*sc.exaggeration,L.eastWest/2));
      const over=pts.map(p=>Math.max(-p.x,p.x-w,p.y-h));
      sc.zoomAt(w/2,h/2,0.05);const zz=sc.view.zoom;return {min:sc.minZoom,z,zz,over}})()""")
    check("zoom cap: you cannot zoom out past the limit", zc["z"] == zc["min"] and abs(zc["zz"] - zc["min"]) < 1e-6 and zc["min"] > 1.05, zc)
    check("zoom cap: at the limit the bottom corners of the map are just out of view", all(0 < o <= 16 for o in zc["over"]), zc)
    # ---- pins sit on the rings ----
    pins = pg.evaluate("""(()=>{const out=[];document.querySelectorAll('.dio-pin:not(.dio-pin--dot)').forEach(p=>{if(p.hidden||p.style.visibility==='hidden')return;const t=p.querySelector('.dio-pin__tag').getBoundingClientRect(),b=p.getBoundingClientRect();const by=parseFloat(p.style.getPropertyValue('--by'));out.push([Math.abs((t.left+t.width/2)-(b.left+b.width/2)),(t.top+t.height/2)-(b.top+b.height/2),by,getComputedStyle(p.querySelector('.dio-pin__tag'),'::after').display])});return out})()""")
    check("pins: each disc is centred on its ring's bottom centre (no floating pin, no leader line)", pins and all(x[0] < 1.5 and abs(x[1] - x[2]) < 2 and x[1] > 8 and x[3] == "none" for x in pins), pins[:3])
    tags = pg.evaluate("[...document.querySelectorAll('.dio-pin')].filter(e=>!e.hidden).every(e=>e.querySelector('.dio-pin__tag'))")
    check("map: every shown activity has a white disc", tags)
    inpins = pg.evaluate("[...document.querySelectorAll('.dio-pin--in .dio-pin__tag')].map(t=>t.textContent.trim())")
    n = pg.evaluate("[...MD.app.S.sel].filter(id=>MD.app.isPinned(MD.app.D.byId[id])).length")
    check("map: each selected place is a red disc with its day number", len(inpins) == n and all(x.isdigit() or x == '!' for x in inpins), inpins)
    bg = pg.evaluate("getComputedStyle(document.querySelector('.dio-pin--in .dio-pin__tag')).backgroundColor")
    wbg = pg.evaluate("getComputedStyle(document.querySelector('.dio-pin--av .dio-pin__tag')).backgroundColor")
    check("map: selected = red, open = white", bg.startswith("rgb(176, 69, 44)") and wbg.startswith("rgba(255, 255, 255,"), (bg, wbg))
    # ---- adding, targets, drag onto a day chip ----
    ids = pg.evaluate("[...document.querySelectorAll('#drawer [data-add]')].map(b=>b.dataset.add)")
    pg.click(f'#drawer [data-add="{ids[0]}"]'); pg.wait_for_timeout(700)
    check("+ adds the place and the card turns into a tick", pg.evaluate(f"MD.app.S.sel.has('{ids[0]}')") and pg.evaluate(f"!!document.querySelector('#drawer [data-remove=\"{ids[0]}\"]')"))
    check("the Your days count ticks up on the switch", pg.evaluate("+document.querySelector('#tab-days b').textContent") == pg.evaluate("MD.app.S.sel.size"))
    check("the first add retires the coach", pg.evaluate("!document.querySelector('#coach')"))
    pg.click(f'#drawer [data-remove="{ids[0]}"]'); pg.wait_for_timeout(500)
    check("the tick removes it again", pg.evaluate(f"!MD.app.S.sel.has('{ids[0]}')"))
    pg.click('#dayStrip [data-pickday="2"]'); pg.wait_for_timeout(500)
    check("choosing a day chip aims new places at that day", pg.evaluate("MD.app.S.target && MD.app.S.target.day") == 2 and pg.evaluate("document.querySelector('#dayStrip [data-pickday=\"2\"]').getAttribute('aria-pressed')") == "true")
    pg.click('#dayStrip [data-cleartarget]'); pg.wait_for_timeout(300)
    pair = pg.evaluate("""(()=>{const A=MD.app,S=A.S;for(const c of document.querySelectorAll('#drawer .pl[data-grabplace]')){const id=c.dataset.grabplace;if(S.sel.has(id)||A.P.isAddon(A.D.byId[id]))continue;const chip=document.querySelector('#dayStrip [data-dropchip="1"]').getBoundingClientRect(),cr=c.querySelector('.pl__pic').getBoundingClientRect();c.scrollIntoView({block:'center'});const r2=c.querySelector('.pl__pic').getBoundingClientRect();return [id,r2.left+r2.width/2,r2.top+r2.height/2,chip.left+chip.width/2,chip.top+chip.height/2]}return null})()""")
    if pair:
        pg.mouse.move(pair[1], pair[2]); pg.mouse.down(); pg.mouse.move(pair[1] - 20, pair[2] - 8, steps=3); pg.mouse.move(pair[3], pair[4], steps=12)
        hot = pg.evaluate("!!document.querySelector('#dayStrip .is-drop-target')"); pg.mouse.up(); pg.wait_for_timeout(700)
        day = pg.evaluate(f"(()=>{{const p=MD.app.P.schedule(MD.app.S);return (MD.app.P.dayIndex(p)['{pair[0]}']||0)}})()")
        check("dragging a card onto a day chip adds it to that day (source and target side by side)", hot and pg.evaluate(f"MD.app.S.sel.has('{pair[0]}')") and day == 2, (pair[0], hot, day))
    else:
        check("dragging a card onto a day chip (no card found)", False)
    # ---- the days pane, drag inside it, settings, detail card ----
    pg.click("#tab-days"); pg.wait_for_timeout(400)
    check("Your days: an empty block's Browse places opens the list aimed at it", pg.evaluate("(()=>{const b=document.querySelector('#dockDays [data-browse]');if(!b)return true;b.click();return true})()") and pg.evaluate("document.querySelector('#tab-places').getAttribute('aria-selected')") == "true")
    pg.click("#tripEdit"); pg.wait_for_timeout(400)
    check("Edit trip takes the whole panel; Done brings the panes back", pg.evaluate("getComputedStyle(document.querySelector('#tripSet')).display") != "none" and pg.evaluate("getComputedStyle(document.querySelector('#dockTabs')).display") == "none")
    pg.click("#tripEdit"); pg.wait_for_timeout(400)
    check("...and the tabs return", pg.evaluate("getComputedStyle(document.querySelector('#dockTabs')).display") != "none")
    pg.evaluate("MD.app.changeSetting('walk',3)"); pg.wait_for_timeout(300)
    pg.evaluate("MD.studio.openDetail('mtmyoko')"); pg.wait_for_timeout(900)
    dt = pg.evaluate("(()=>{const c=document.querySelector('#detail');return {vis:!c.hidden,add:!!c.querySelector('[data-add]'),note:(c.querySelector('.pc__note--soft')||{}).textContent||''}})()")
    check("detail card: a place beyond your walking level can still be added, with a small note", dt["vis"] and dt["add"] and "walking" in dt["note"].lower(), dt)
    pg.evaluate("MD.studio.closeDetail()")
    pg.keyboard.press("Tab")
    check("no script errors", not errs, errs)
    # ---- smaller windows ----
    pg = b.new_page(viewport={"width": 1000, "height": 760}, reduced_motion="reduce"); pg.goto(BASE + "#build")
    pg.wait_for_function("window.MD && MD.map && MD.map.isReady()", timeout=90000); pg.wait_for_timeout(2000)
    m, d = R("#mapWrap"), R("#dock")
    check("mid-width: still 60/40, side by side", abs(m[4] / 1000 - 0.6) < 0.012 and abs(d[4] / 1000 - 0.4) < 0.012, (m, d))
    check("mid-width: the footer and Review button stay in view", pg.evaluate("(()=>{const r=document.querySelector('#toBook').getBoundingClientRect();return r.bottom<=innerHeight&&r.width>80})()"), pg.evaluate("(()=>{const r=document.querySelector('#toBook').getBoundingClientRect();return [r.top,r.bottom,r.width,innerHeight,MD.studio.ui.settings,document.querySelector('#dock').className]})()"))
    pg = b.new_page(viewport={"width": 390, "height": 844}, reduced_motion="reduce"); pg.goto(BASE + "#build")
    pg.wait_for_function("window.MD && MD.map && MD.map.isReady()", timeout=90000); pg.wait_for_timeout(2000)
    check("phone: no switch, the map sits above the days", pg.evaluate("getComputedStyle(document.querySelector('#dockTabs')).display") == "none" and R("#mapWrap")[3] <= R("#dock")[1] + 2)
    check("phone: the list opens as a sheet from the map", pg.evaluate("(()=>{const b=document.querySelector('[data-drawer-toggle]');if(!b)return false;b.click();return true})()") and (pg.wait_for_timeout(600) or True) and pg.evaluate("getComputedStyle(document.querySelector('#drawer')).position") == "fixed" and pg.evaluate("document.querySelector('#drawer').getBoundingClientRect().height") > 300)
    b.close()
ok = all(res); print(f"\n{sum(res)}/{len(res)} v12 checks passed"); sys.exit(0 if ok else 1)
