# Myoko Days v11 changes

1. Places panel: opening it slides the 3D board into the clear gap at the same zoom; closing returns it (scene.slideTo, a screen-space slide).
2. Zoomed-out board is centred (SHIFT_X = 0).
3. Smart crops: tools/focal.py finds a focal point per photo (detail + colour, sky penalised) -> js/focus-data.js. js/focus.js sets object-position from each box's shape. Thumbnails are rebuilt uncropped.
4. Suggestions: P.suggestPlan() fills every open block once, with a reason (course, same area, effort balance, variety, last-day winery).
5. "Your trip" header: moss band, hanko seal, half-day progress blocks, charter-days chip.
6. Getting around: A.getAround(plan). Public transport is limited, so the plan assumes PCG's chartered bus/van on days with something on. The per-day rate is NOT in the project files. Enter it in Edit > Charter bus / van or on Review & Save. Until then it shows as TBC.
7. Review & Save: wide header; film top-left with "Your days at a glance" beside it; stat strip; accented day cards with charter routes; Getting around panel; cost table with charter row; print button.
8. Plan page shows no pop-ups; changes apply quietly.
Run: node verification/verify-v10.cjs (18 checks).
9. Photos: the gallery no longer overflows on portrait pictures (the church photo used to show only sky). Hand-set focal points for portrait and tricky photos. Page photos web-sized (22.6 -> 9.7 MB) and thumbnails 480 px; thumbnails are pre-fetched while idle.
10. Map: place-name boxes removed; hover tooltip names a place.
11. Review & Save: film enlarged (16:9, about 2.5x the width of the day list); the clip strip under it is removed so it no longer repeats the day list.

## Round 2 (Review & save, charter, dock)
- Review & save: film is the hero (3fr) beside a "days at a glance" rail; film and rail share top and bottom edges. Page margins reduced (max 1680px wide).
- Cost checklist rebuilt as a ledger: aligned name / detail / amount rows, subtotals, section labels, heading style matches "Day by day".
- Rail journey, "Before making bookings" and "Keep your plan" sit in their own row of three equal cards.
- Charter van: planning estimate of ¥30,000 per day (lowered from ¥55,000: day trips are about 5 hours of hire, not a 10-hour charter) (`CHARTER_EST` in js/app.js). It is an assumption, not a PCG figure. Replace it from Edit panel > charter rate (values under ¥1,000 are ignored as typos). Cost is shown as a group cost, with the per-person share split by party size.
- "Getting around" panel and Print button removed (Artifact blocks printing).
- Dock "Your trip" header shortened (no half-day visual); charter day cost moved to the dock footer.
- Plan page raises no pop-ups.

## Round 3 (v12: the team's feedback and a full usability pass)
Team feedback (Mae): the first look at Build was bare; a list would be more organised; dragging from the list to the days crossed the whole map.
- **Build opens with the Places list**, grouped by area, with type chips, search and two switches. It sits **beside the days** (wide screens), so a drag is a short move; the map pane shrinks to make room. Mid-width it overlays next to the days; on phones it is a bottom sheet and + is the way to add.
- **Cards are small and two to a row.** The wide ADD button is now a round **+**; it becomes a red tick with the day (and an x on hover) once added. The whole card drags (mouse); no ⋮⋮ handle. Cards for places with no map pin say so.
- **Pins:** every activity is a white disc with its type icon on a leader line to its model; selected = red with its day number; faded = outside dates or walking. Overlapping discs fan out so none hide each other. Key text updated.
- **First-visit coach** (three steps, once) replaces the old "Tap a place" tip, which described the wrong action.
- **Dates:** the first day is three day-first selects (day, month, year), so 7/9 cannot be read as 9 July, and a past or out-of-season date cannot be chosen.
- **Plan page:** shorter hero, clear "Choose a starting point" step, cards show 4 stops + "N more" so the button is on screen, "Discover" no longer reads TBC ("Price to confirm"), the empty-map option is its own row.
- **Naming and wording:** step 3 is "Review" everywhere; "Build 6" now reads "6 places"; "class estimates" -> "indicative prices"; "Show prototype notes" -> "Show research notes"; arrival/departure blocks read as fixed travel notes, not empty slots; "Let Myoko Days choose" -> "Choose for me"; "Edit" -> "Edit trip".
- **Contrast and size:** secondary grey text darkened to AA, nothing below 11px.
- **Bug fixed:** opening "The area" directly left its gallery, hosts and cards blank.
- Checks: `verification/verify-v10.cjs` (18) and the new `verification/verify-v12.py` (18, browser).

## Round 4 (v12.1: tray above the trip, lower van estimate)
- **The Places list is now a tray above "Your trip" in the right-hand panel, not a column beside it.** "Show the list" slides the tray open and the trip moves down (smooth height animation); "Hide the list" slides it back. A card now has only a short drag to a day.
- **Days are tiles, two to a row** in the panel (one per row on narrower screens), so a whole 4-day trip fits without scrolling when the tray is closed. The footer is one line: per person, the van, Review.
- The tray holds the search, type chips and two toggle chips ("Fits my dates", "Extra ideas"). Opening trip settings tucks the tray away to give them room.
- Wide screens (1180px+, 720px+ tall) open the tray on arrival; narrower or shorter screens start with it closed; phones keep the bottom sheet.
- **Chartered van estimate lowered from ¥55,000 to ¥30,000 a day** (about 5 hours of hire for a 9-seat van with driver, fuel and tolls; day trips here are short circuits in one valley). Still an assumption, replace with PCG's quote.
- verify-v12.py now has 22 checks (tray position, two-per-row days, the slide, the lowered estimate).

## Round 5 (v12.3: 60/40 layout, rings, zoom cap, no blocking, Earth image)
**Build layout: map 60% on the left, everything else in the 40% on the right.** The top/bottom tray was dropped as messy.
Design reasoning: a narrow side panel works best as *one pane at a time* (progressive disclosure, master-detail), not two stacked panes fighting for height. So the panel is: slim trip header, a **Places | Your days** switch (with live counts), one pane, and a slim footer (per-person total, Review trip, van estimate).
- **Places pane:** a "Types" dropdown of checkboxes (tick several) sits left of the search box, with "Fits my dates" and "Extra ideas" beside it. Under that, an **Add to** strip of day chips (Best day, Day 1..N). Press + on a card, or **drag a card onto a day chip**: source and target sit side by side. Cards are two to a row. The small note about walking and season is at the end of the list.
- **Your days pane:** one column of days; empty blocks offer a suggestion or Browse places (which opens the list aimed at that block).
- A first visit opens on Places; a trip chosen on the Plan page opens on its days. Edit trip takes the whole panel while open. Phones keep the map-on-top layout with the bottom sheet (type dropdown and day chips there too).
- **Pins:** the white disc now sits **on the activity's ring, at its bottom centre**: no floating pin, no leader line. It scales with the ring so zoomed-out rings are not crowded.
- **Zoom cap:** you cannot zoom out past the point where the board's two bottom corners have just left the view. Solved numerically for the pane's own size (scene.js `solveMinZoom`), so it holds at any window size.
- **Nothing is blocked any more.** Walking level and season only add a small note (planner `caution()`); `availability()` is now only for genuinely impossible things (closed, not a day-by-day activity). Automatic suggestions and ready-made trips still respect your settings. Changing settings no longer removes places you chose.
- **Extra ideas pruned (14 -> 7):** removed the closed gondola, overnight camping (cannot be planned), the second SUP/kayak, the second e-bike ride, Shin-etsu Trail, the mushroom hike and the museum (pins within 500 m of a main activity, or duplicates).
- **Names:** one Title Case style everywhere ("Lake Cruise & Island Shrine", "St Cousair Winery & Orchard", "Local Culture Tour", "Soba Making (Lunch included)").
- **Home page:** your Google Earth image replaces the painted map (assets/map/myoko-earth.jpg). Section numbers on The area page and home are now **A B C D**, so they no longer clash with the nav's 01 02 03.
- **Review page:** the "Before making bookings" panel is removed (the prototype is the booking site PCG will use); the two columns scroll together (the cost checklist used to stay put while Day by day slid up).
- Checks: `verify-v12.py` is now 41 browser checks; `verify-v10.cjs` has 20 (new: no blocking, pruned extras, Title Case).

## Round 6 (v12.3 polish: alignment and tighter home)
- **One left edge:** header, hero controls, the map band and the Review page now share the 1320 px content column with the A/B/C/D labels at any screen width (`--edge`). Lettered labels have a fixed-width letter so titles start on the same x.
- **Home:** section heads sit left across the full row (label above, heading and intro below); rows are ~30% shorter (hero 760 px max, calmer padding, smaller cards, gallery and closing band). Fixed the intro line "Time to follow your curiosity" which was dark on dark.
- **Build footer:** the van's group cost sits beside the per-person price ("Van · 4 days  ¥120,000 est. · whole group"); stacks under the total on narrow docks and phones.
- **Notices:** appear inside the right panel just above the total bar, not over the map.
- **Place cards:** text under each photo starts on the photo's left edge (was centred in a flex column); the "No map pin yet" note is no longer right-aligned.
- **Map base:** the four strata layers are level bands with one gentle swell (was a noisy wobble that read as misaligned steps).
- **One map band:** the Google Earth image now fills the whole band with a dark left-to-right gradient (top-to-bottom on phones) so the white text stays readable.
- **How it works:** step labels now mirror the nav: 01 Plan, 02 Build, 03 Review.
- **Build footer:** per-person total and van cost now share one layout (small caps label, serif value, grey note).
- **Review:** the days-at-a-glance card's footer no longer spills past the card; price and "Day-by-day details" stack left-aligned at every width (the rail is also slightly wider).

## Round 7 (v12.4: the prototype as PCG's booking tool)
- **Copy:** removed the "prototype / makes no reservations / check each provider / confirm before booking" wording from the Review header, FAQ, footer, film dialog, activity details, Review cards and the downloaded plan. "Your Myoko draft" is now "Your Myoko trip". The Review header shows the dates only.
- **Review layout:** the film runs the full row (landscape clips fill the frame, portrait clips stay whole); the days-at-a-glance sit beneath it in one row of columns, with the price on its own row. The Day-by-day and cost columns always end on the same line and the shorter one spreads its content. The summary strip is four facts: trip length, activities, per person, van. "Prepared for Patience Capital Group" is top right.
- **Less empty space** above the footer on Review, Plan and The area.
- **Home:** "How it works" labelled 01 Plan / 02 Build / 03 Review, "One map" band uses the Earth image full-bleed, tighter rows.
- Open for PCG: payment, cancellation and confirmation steps are not described anywhere on the site (the "Do I pay now?" FAQ was removed) because the real process is PCG's to define.

## Round 8

- **Review film:** controls sit bottom-right over the film; the film is taller (46vh, up to 600px) and the day-by-day activities start inside the first screen at 1366×768 and 1440×900. The header is slimmer and the gap under the line is removed.
- **Hash fix:** the Review element id is now `bookRoot`, so the `#book` hash no longer triggers a native anchor scroll that hid the header. The router also resets scroll twice on route change.
- **One base only:** Akakura Onsen removed; Madarao is the only base. The base selector and the "Your base" section are removed from Review and Edit trip.
- **The area page:** header, photo band, A–D row padding, timeline, tick lists and FAQ tightened. Desktop page height 2,877px → about 1,890px. Labels and headings stay on the 1320px column edge. Phone layout stacked and tightened.
- Still open for PCG: payment, confirmation and cancellation process; van rate (¥30,000/day is a placeholder).

## Round 9

- Day chips in the Places pane read D1–D5; the first chip is "Best Day" and accepts dropped cards (auto-places in the best free block).
- Review hero re-arranged: tall film (left, 68vh, 440–760px) with "Your days at a glance" as a text-only list beside it; price removed from that list (it is in the stats strip). Stacks on tablet and phone.
- 3D models in Review "Your days at a glance": each activity that has a crafted model (13 of 22) shows it on the right of its row, slowly spinning; drag or arrow keys to turn. Activities without a model show no tile. One shared WebGL renderer (`js/tiles.js`); still under reduced motion.
- Review hero: the film now stays in view (sticky) while the days list scrolls, which fixes the controls floating below the film on long trips.
- Review "Your days at a glance" is now one row per day with Morning and Afternoon columns (model + title in each). Models have no circle or background. Rows spread to the film's height; phone stacks model above title.
- Hero film replaced with the 20 s montage (1080p, ~9 MB). The vertical SUP clip was cut and replaced by 2.9 s of the landscape SUP clip, with the same dissolves, so the length is unchanged. Poster is its first frame. Old hero kept out of the build.
- Review days panel: the "Your days at a glance" heading and its line are removed; "Edit days" moved to the panel footer beside "Day-by-day details".
- Hero colour grade: each clip was balanced to a common look (saturation eased on the oversaturated e-bike, soba meal, daruma and SUP clips; exposure evened, dark e-bike/meal/zip lifted, bright dough/lake eased; fog clip given a little more colour), blended smoothly across the dissolves. Mean chroma now 0.09–0.18 (was 0.09–0.27). Poster regraded.
- Hero grade: the opening lake clip was too pale; saturation, contrast and exposure raised so it sits level with the SUP and e-bike clips.

## Round 10 — video stabilisation, soba photo, final grade
- **Stabilised clips** (hero): soba dough, soba meal and daruma are motion-stabilised (optical-flow camera path, Gaussian-smoothed, small zoom to hide borders). The natural pan is kept; only hand-shake is removed. Daruma shake −70 %, dough −40 %, meal −35 %.
- **Colour grade rebuilt on a correct footing.** The clips mix SDR and HLG/HDR phone footage; they are now all converted to the same Rec.709 basis (HLG tone-mapped, tags corrected to bt709) and then graded clip-by-clip to one look: similar saturation, warm-neutral whites, gentle contrast. The first lake clip is no longer washed out; the soba-meal pinkish cast and the over-saturated clips are pulled in.
- **Lake sky blocking fixed**: the source clip had macroblocks in the smooth sky that the grade exposed; the first 2.6 s are now debanded, lightly denoised and given fine grain.
- Hero re-encoded to ~9.9 MB (H.264, faststart, 1920×1080, 20 s), new poster from frame 1.
- **Soba gallery photo** ("Soba making with lunch", `fieldwork/soba-1`) replaced by the kneading photo, brightened to match the site; focal point set to `[0.56,0.52]` so the bowl and hands sit in the centre of the home-strip preview and cards.

## Round 11 — hero quality, richer grade, film viewer, review overlap
- **Review bug fixed**: the sticky film could slide ~30 px past its row and cover the note under it when scrolling. The note now sits outside the hero grid (`.bk-hero` has a single row), so nothing can overlap.
- **Hero video, smoother**: the source footage had visible compression blocks. The whole film is now deblocked, lightly denoised and debanded before grading, then re-encoded (H.264, ~11.7 MB).
- **Hero video, richer but natural**: saturation raised ~28% across clips plus a gentle vibrance lift (protects skin and neutrals). The old `saturate(.82)` CSS filter that dulled the video on the page is gone.
- **How the hero is displayed**: a hair of softness (`blur .55px`), slightly lower contrast, a fine still film-grain layer (`.hero__media::after`, soft-light) that reads as texture and breaks up any remaining blocking, a 3.5% overscan so the blur never shows edges, and a very slow push-in (38 s, off under reduced motion).
- **"Watch the film" viewer**: no frame, panel or border. A dark, softly blurred backdrop; the picture at its own 16:9 shape; one translucent control bar (play/pause, seek, time) and a round translucent close button. Controls fade out after ~2.6 s while playing and return on movement; click the picture to play/pause, click the dark room or press Esc to close; the film rewinds on close. New file `js/filmplayer.js`.

## Round 12 — hero reverted
- The hero video is back to the earlier "graded3" version, with its original poster and the original on-page look (the softening, grain, push-in and saturation CSS from Round 11 were removed). The Review overlap fix and the borderless "Watch the film" viewer stay.

## Round 13 — trains, forest, rice, new media
- **Shinano Railway on the map.** A two-car train now runs on the real rail line, stops at a new station (stone platform, canopy, timber building, travellers), waits ~9 s, leaves; 20–30 s later a train arrives from the other direction. Cars are scaled up so they read at map zoom; tracks are a single well-scaled ballast/sleeper/rail strip. Trains fade in/out at the edges, are **not selectable** (no pin, no ring), and park one train when the visitor prefers reduced motion. Station sits on the straightest dry stretch (~2.7 km from the real Myoko-Kogen point, chosen so the track is clean, not cramped by the river bends). New files: `assets/diorama/kit/trains.js`, `attractions/train.js`.
- **Review "arrive / depart".** Day-1 morning and last-day afternoon now show a 3D train-at-station tile ("Arrive by Shinano Railway", "Depart by Shinano Railway") in the same style as the activities.
- **Forest Therapy Walk** (near Nojiri): Elephant Trail lakeside clearing, bay, trail board, km posts, circle of walkers. **Rice Harvest & Sasa-zushi** (between Kiminoi and the rail line): gold and cut paddies, hasa rack, kei truck, harvesters, tray of sasa-zushi. Both are map-selectable with models, and in Review.
- **Media.** Lake cruise: 6 photos + 2 clips (landscape first). Rice harvest & sasa-zushi: 4 photos + 3 clips. Forest therapy: 3 photos + 4 clips short-listed from five. All graded to the site look, with 1200×900 photos, 480×360 thumbs, focal points and hero-card images; the trip film uses them.
- "Meeting point" wording is now "Indicative map spot · meeting point to confirm".
- Home hero text redesigned; Review film now matches the days panel height.
- Still open for PCG: payment/cancellation process, van rate placeholder.

## Round 14 — railway terminus, graded track bed, town hub, activity footprints, darker hero
- **Myoko-Kogen is the end of the line.** One track only, running in from Kurohime (south-west) and ending at the station with a buffer stop (concrete plinth, red beam with yellow-and-white bands, two black buffers, white "end of line" board) and a squared-off embankment. The train arrives from the south-west, waits at the platform, then reverses out the way it came (it no longer turns round or drives off the far end); the next one arrives 20–30 s after it has gone.
- **Where it is.** The line follows the surveyed rail points and the terminus is as close to the real station as dry ground allows: the river crosses the line within ~200 m of the real spot, so the buffer stop is ~0.5 km up-line and the platform ~1.2 km from the station point. Track, platform and the ground behind the buffer stop all stand on dry land (≥ 200 m from any river edge). Where the old data ran out over Lake Nojiri the line now follows the north shore instead.
- **Track no longer sinks into hills.** The bed is lifted to clear the ground across its whole width (checked every 20 m: zero clipping), with an embankment on both sides that slopes down and ends exactly where it meets the terrain.
- **Town at the station.** The hub now has ~60 more houses (two-storey shops, inns, storehouses, sheds) in streets behind the station building and beyond the end of the line, placed on dry gentle ground clear of the track, river, attractions and each other. The old 560 m exclusion round the station is gone; only the platform footprint and track are kept clear.
- **Activities no longer clip the terrain.** Every land attraction's ground is now flattened to its model rim (the relief height map is edited under each; blends are kept clear of neighbouring pads). Measured at 0.5 / 0.8 / 0.9 / 1.0 of each model's radius: terrain within ±1 m of the model base for all 17. Forest Therapy Walk moved ~1.2 km east (to -3909, 4669) onto gentler ground so its pad does not reach the lake; Rice Harvest keeps its spot. Boat models (cruise, SUP, kayak) float on the lake and are unchanged.
- **Hero video darkened a little** (uniform 22 % scrim plus a stronger left scrim) so the headline and copy read over bright footage.

## Round 15 — the line runs to Kurohime
- The railway no longer trails off to the map edge. It now follows the real route from Myoko-Kogen (the terminus) south-west to **Kurohime**, where it ends just past the platform with a second buffer stop and a squared-off bank, so nothing hangs over the terrain edge.
- Kurohime station and its small cluster sit on the line (≈1.6 km from the real point, because the e-bike model occupies it); the line is routed around the e-bike pad and kept off water.
- Trains appear at Kurohime, run to Myoko-Kogen, dwell ~9.5 s and reverse back to Kurohime, fading out there. Reduced-motion still parks one train at the platform.
- Checked: 0 of 3,495 bed/terrain samples clip; 41/41 + 20/20 checks pass; no console errors. Cache versions: trains.js 13.17, map.js 13.7.
