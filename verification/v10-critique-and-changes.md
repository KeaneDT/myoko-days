# Myoko Days v10: critique, what changed, and what to decide

## Design principle for this pass
Anne's goal: **don't overwhelm the user with information.** Sources checked: LogRocket on progressive disclosure (keep disclosure levels below three; show what's needed to start or decide, hide secondary detail until asked), Helio/Zurb on Hick's law (limit the options shown at once; group and categorise), and Apple's Human Interface Guidelines for maps (cluster, reveal labels and detail with zoom, show custom detail only on selection, pair search with category filters).

Applied as three levels only: **map (pins, numbers) → card (name, one-line facts, one action) → "Details & checks".**

## Critique of v9 (what was wrong)
1. Map and builder were two stacked sections; the wheel only worked after a click, and scrolling hijacked the page.
2. The map was crowded: a legend panel, ten category chips, key, cartouche, mode button, labels, kanji and elevations all at once.
3. Adding a place could be blocked outright; the user had to work out why and fix it themselves.
4. Every activity was fixed to one area per day, and e-bike (and others) took a full day, so the plan felt restrictive.
5. Cards and rows carried 6+ facts each (price, length, walking, season, meeting point, lunch, host).
6. Loader was a generic progress circle; popups stacked three deep in the middle of the map.

## What v10 does
**One workspace.** Map left, "Your days" docked right. The page does not scroll on the build view; the wheel always zooms; no click-to-engage.
**Auto-fit planner** (`js/planner.js`, rewritten). Half-day blocks for everything (e-bike included). Areas can mix in a day, with a "x km apart" note. Add a place and it takes the best free block; unpinned days shuffle to make room; if the trip is full it grows by a day (3–7 days, switchable). If it can't be added, the card says why and offers a one-click fix (raise walking, change dates, add a day, swap). Day 1 morning and the last afternoon are travel; those edges take easy places only. Undo on every change.
**Less at a glance.**
- Map overview shows numbers on pins only. Place labels appear with zoom; peak kanji/elevation and the base tag only when zoomed in.
- Ten category chips became one "Show: everything ▾" menu; the key is a "?"; "Fits my dates" lives in the Places list.
- Card: photo, title, three-line description, one facts line, one action. Season, host, checks sit under "Details & checks".
- Day rows show name, area and price. Empty blocks suggest one place, not two.
- Popups: top-right of the map, two at most, short stay, fade out.
**Loader.** The three-peak Myoko Days mark fills from the base as the 3D map loads (real progress, never frozen).
**Only the 3D map.** The painted fallback and phone "pocket map" are removed. Phones get the same 3D map.
**Premium details.** Tabular numerals, balanced headings, hairlines, vermilion only for "your trip", Japanese day numerals, motion that respects reduced-motion.

## Verification
`node verification/verify-v10.cjs`: 13 checks, including a 400-trip fuzz (no overlaps, season, walking, nothing lost). Browser checks (headless Chromium, software GL): wheel zooms with `scrollY` staying 0; add/auto-fit; drag-and-drop with "Moves X" hint; settings; mobile 390px layout; no console errors.

## Decisions for the team
1. Arrival afternoon and departure morning take easy (effort ≤3) places only. OK?
2. Long outings (Mt Myoko hike, long e-bike) take one block with a "keep the other half light" note. OK?
3. Auto-grow by a day is **on** by default (switch in Edit). OK?
4. Max trip length 7 days.
5. Home page: swap the painted map image for a Google Earth screenshot (needs the image: `assets/map/myoko-earth.jpg`; the slot and a "Google Earth" credit are ready).
6. Old build-view CSS (build.css, editorial.css) still ships for the other pages; a clean-up pass is optional.
