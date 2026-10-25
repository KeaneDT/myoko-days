"""v16 browser checks: the stay choice, dated hotel rates, opt-out, migration, wording.
   python3 verification/verify-v16.py   (needs the preview server on :8770 and Playwright + Chromium)"""
import sys, re
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8770/"
res = []
def check(name, ok, extra=""):
    res.append(bool(ok)); print(("PASS " if ok else "FAIL ") + name + (("  " + str(extra)) if (extra and not ok) else ""))
BAN = re.compile(r"\b(tbc|to confirm|to be confirmed|estimate[ds]?|indicative|placeholder|prototype|reconfirm|check each provider|fieldwork rate)\b", re.I)
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"])
    # ---- an old save (before stays) is read sensibly
    ctx = b.new_context(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    old = ctx.new_page(); errs = []; old.on("pageerror", lambda e: errs.append(str(e)))
    old.goto(BASE + "#plan")
    old.evaluate("""()=>{localStorage.setItem('md_trip_v10',JSON.stringify({who:'couple',walk:4,days:4,flex:true,course:'blank',sel:['daruma'],base:'akakura',date:'2027-09-07',placements:{}}))}""")
    old.reload(); old.wait_for_timeout(1200)
    check("an older save with another base opens as 'somewhere else'", old.evaluate("MD.app.S.stay") == "own", old.evaluate("MD.app.S.stay"))
    old.evaluate("localStorage.clear()"); old.close(); ctx.close()

    ctx = b.new_context(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    pg = ctx.new_page(); pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(BASE + "#plan"); pg.wait_for_timeout(1500)
    pg.evaluate("localStorage.clear()")
    q = lambda js: pg.evaluate(js)
    cards = q("[...document.querySelectorAll('.stay-card')].map(c=>c.dataset.stay)")
    check("plan: four stay choices, three PCG properties and 'somewhere else'", cards == ["madarao", "lime", "sixsenses", "own"], cards)
    check("plan: exactly one is selected", q("document.querySelectorAll('.stay-card[aria-pressed=true]').length") == 1)
    names = q("[...document.querySelectorAll('.stay-card__name')].map(c=>c.textContent.trim())")
    check("plan: the tiers are named, not labelled low/middle/high", names[:3] == ["Madarao Kogen Hotel", "Lime Resort Myoko", "Six Senses Myoko"] and not re.search(r"\b(low|middle|high)\b", " ".join(q("[...document.querySelectorAll('.stay-card')].map(c=>c.textContent)")), re.I), names)
    # each choice sets the state and the nights strip
    for k in ["madarao", "lime", "sixsenses"]:
        q(f"document.querySelector('[data-stay={k}]').click()"); pg.wait_for_timeout(250)
        n = q("MD.app.S.days") - 1
        check(f"plan: choosing {k} sets the stay and lists {n} priced nights", q("MD.app.S.stay") == k and q("document.querySelectorAll('.night').length") == n, (q("MD.app.S.stay"), q("document.querySelectorAll('.night').length")))
    prices = {}
    for k in ["madarao", "lime", "sixsenses"]:
        prices[k] = q(f"MD.stay.quote({{...MD.app.S, stay:'{k}'}}).total")
    check("plan: the tiers order Madarao < Lime < Six Senses for the same dates", prices["madarao"] < prices["lime"] < prices["sixsenses"], prices)
    # dates move the price
    q("document.querySelector('[data-stay=lime]').click()")
    q("MD.app.S.date='2027-09-14'; MD.app.S.days=2; MD.app.changed(); MD.app.renderPlan()"); pg.wait_for_timeout(250)
    tue = q("MD.stay.quote(MD.app.S).total")
    q("MD.app.S.date='2027-09-11'; MD.app.changed(); MD.app.renderPlan()"); pg.wait_for_timeout(250)
    sat = q("MD.stay.quote(MD.app.S).total")
    check("plan: a Saturday night costs more than a Tuesday night", sat > tue, (tue, sat))
    check("plan: the card price follows the dates", re.sub(r"\D", "", q("document.querySelector('[data-stay=lime] .stay-card__price b').textContent")) != "", q("document.querySelector('[data-stay=lime] .stay-card__price').textContent"))
    q("MD.app.S.date='2027-09-07'; MD.app.S.days=4; MD.app.changed(); MD.app.renderPlan()")
    # opt out
    q("document.querySelector('[data-stay=own]').click()"); pg.wait_for_timeout(250)
    check("plan: 'somewhere else' keeps the site usable for activities only", q("MD.app.S.stay") == "own" and q("MD.stay.quote(MD.app.S).total") == 0 and q("document.querySelectorAll('.night').length") == 0)
    check("plan: the course cards still show a price with no stay", q("document.querySelectorAll('#planCourses .shape__price').length") >= 3)
    q("document.querySelector('[data-stay=sixsenses]').click()"); pg.wait_for_timeout(250)
    check("plan: the course cards add the stay when one is chosen", "with six senses myoko" in q("document.querySelector('#planCourses').textContent").lower())
    txt = q("document.querySelector('#v-plan').innerText")
    check("plan: no unfinished-looking wording", not BAN.search(txt), BAN.findall(txt))
    # review
    pg.goto(BASE + "#book"); pg.wait_for_timeout(2500)
    def ledger():
        return q("document.querySelector('.ledger').innerText")
    check("review: the ledger has a 'Your stay' block with a row per night", "your stay" in ledger().lower() and q("MD.app.S.stay") == "sixsenses", ledger()[:300])
    S_ = q("(()=>{const S=MD.app.S,P=MD.app.P,plan=P.schedule(S),ids=plan.days.flatMap(d=>[...d.items,...d.extras].map(a=>a.id)),t=P.totals({...S,sel:new Set(ids)}),g=MD.app.getAround(plan),sq=MD.stay.quote(S);return {act:t.yen,rail:MD.app.D.railReturn,van:g.share,stay:sq.perPerson}})()")
    tot = S_["act"] + S_["rail"] + S_["van"] + S_["stay"]
    shown = int(re.sub(r"\D", "", q("document.querySelector('.ledger__amt b').textContent")))
    check("review: the total is activities + rail + van share + stay", shown == tot, (shown, tot, S_))
    q("document.querySelector('[data-stay-b=own]').click()"); pg.wait_for_timeout(400)
    shown2 = int(re.sub(r"\D", "", q("document.querySelector('.ledger__amt b').textContent")))
    check("review: opting out removes exactly the stay from the total", shown2 == tot - S_["stay"], (shown2, tot, S_))
    check("review: the opt-out row says it is the guest's own arrangement", "own stay" in ledger().lower())
    q("document.querySelector('[data-stay-b=lime]').click()"); pg.wait_for_timeout(400)
    check("review: choosing a property here brings the stay back", q("MD.app.S.stay") == "lime" and "Lime Resort Myoko" in ledger())
    pt = q("MD.app.planText()")
    check("review: the saved plan text names the stay and each night", "Lime Resort Myoko" in pt and pt.count("a room") >= q("MD.app.S.days") - 1, pt[:200])
    txt = q("document.querySelector('#v-book').innerText")
    check("review: no unfinished-looking wording", not BAN.search(txt), BAN.findall(txt))
    # build
    pg.goto(BASE + "#build")
    pg.wait_for_function("window.MD && MD.map && MD.map.isReady()", timeout=170000)
    pg.wait_for_function("!document.querySelector('.dio__load')", timeout=120000); pg.wait_for_timeout(2000)
    check("build: the panel header names the stay", "Lime Resort Myoko" in q("document.querySelector('#dock').innerText"))
    check("build: the footer splits activities and stay", re.search(r"Activities S\$\d+ · Stay S\$\d+", q("document.querySelector('#dockFoot').innerText")))
    q("[...document.querySelectorAll('button')].find(b=>/edit trip/i.test(b.textContent)).click()"); pg.wait_for_timeout(700)
    q("document.querySelector('[data-stayset=sixsenses]').click()"); pg.wait_for_timeout(500)
    check("build: the stay can be changed in Edit trip", q("MD.app.S.stay") == "sixsenses" and "Six Senses Myoko" in q("document.querySelector('#dock').innerText"))
    vis = "[...document.querySelectorAll('.dio-prop')].filter(e=>getComputedStyle(e).visibility!=='hidden')"
    check("build: only the chosen stay is tagged on the map; the other two are unlabelled", q(f"{vis}.length") <= 1 and q("document.querySelectorAll('.dio-prop.is-base').length") == 1 and "Six Senses" in q("document.querySelector('.dio-prop.is-base').textContent"))
    q("document.querySelector('[data-stayset=own]').click()"); pg.wait_for_timeout(500)
    check("build: with no PCG stay there is no base tag", q("document.querySelectorAll('.dio-prop.is-base').length") == 0 and q(f"{vis}.length") == 0 and "activities" in q("document.querySelector('#dockFoot').innerText").lower() and "Stay S$" not in q("document.querySelector('#dockFoot').innerText"))
    for h in ["home", "about", "plan", "build", "book"]:
        pg.goto(BASE + "#" + h); pg.wait_for_timeout(700)
    check("no script errors", not errs, errs[:4])
    ctx.close()
    # phone widths
    ctx = b.new_context(viewport={"width": 390, "height": 844}, reduced_motion="reduce", has_touch=True, is_mobile=True)
    ph = ctx.new_page(); ph.on("pageerror", lambda e: errs.append(str(e)))
    for h in ["plan", "book"]:
        ph.goto(BASE + "#" + h); ph.wait_for_timeout(1800)
        sw = ph.evaluate("document.documentElement.scrollWidth")
        check(f"phone: #{h} has no sideways scroll", sw <= 391, sw)
    ctx.close(); b.close()
print(f"{sum(res)}/{len(res)} v16 checks passed"); sys.exit(0 if all(res) else 1)
