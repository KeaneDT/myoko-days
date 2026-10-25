# Myoko Days v16: stays, dated rates, assumptions, railway

## What changed
**Stay choice (Plan, question 05).** Four cards: Madarao Kogen Hotel (Mountain comfort), Lime Resort Myoko (Wellness resort), Six Senses Myoko (Luxury retreat) and Somewhere else (Activities only). Choosing a property adds the stay to the total; choosing Somewhere else leaves a complete activities-only trip. The choice can be changed on Plan, in Build (Edit trip) and on Review. The course cards on Plan show the activities price and, when a stay is chosen, the total with it.

**Rates move with the dates.** `js/stay.js` prices each night by its arrival date: base rate × season × the larger of day-of-week and long-weekend factors, rounded to ¥500, per room, two guests a room. Japanese public holidays are computed by rule (Marine Day, Mountain Day, Respect for the Aged Day, the equinoxes, Sports Day, substitute and citizens' holidays). Obon and the autumn-colour weeks are dearer. The nights strip on Plan lists every night with its rate; a one-line hint appears when moving the start a day would save real money.

**Assumptions in one place.** Every invented number is in `js/assumptions.js`. `ASSUMPTIONS.md` is generated from it (`node tools/gen-assumptions.js`), linked from the footer, and checked by `verification/test-assumptions.cjs`. All temporary notes, "to confirm" labels and the notes toggle are gone; every activity now has a price or reads Free.

**Railway.** One continuous line runs from the north edge (towards Takada) through Arai, Nihongi, Sekiyama, Myoko-Kogen and Kurohime to the south edge (towards Nagano, the left of the screen). Myoko-Kogen is where the Shinano Railway (Kita-Shinano Line) meets the Echigo Tokimeki Railway (Myoko Haneuma Line). Two trains take turns at the platform, a red Shinano train from Kurohime and a white-and-pink Echigo Tokimeki train from Sekiyama. The platform sits on dry ground, about 850 m south-west of the surveyed station point, where the river runs under the exact point.

**Map.** Six Senses Myoko is modelled and placed. The three PCG properties show no label until you stay there: the property you choose carries one name tag and a highlight ring, and the other two stay plain. The railway stations carry no labels.

**Properties placed from their real coordinates.** Madarao Kogen Hotel (36.8515 N, 138.2909 E) and Lime Resort Myoko (2251-2 Sekigawa, 36.8640 N, 138.1772 E) come from published listing coordinates; Six Senses Myoko has no published site, so it is placed at the Suginohara gondola base (about 36.8567 N, 138.1550 E), accurate to a few hundred metres. All three go through the same conversion as the activity pins. To make room for Lime Resort Myoko, the Imori-ike and Daruma pins sit about 1.9 km and 1.3 km from their true points. The map is illustrated, not to scale. See A-S10 in ASSUMPTIONS.md.

**Three properties, three tiers.** The Madarao hotel ($) keeps its cream walls, slate hip roofs and clock tower. Lime Resort Myoko ($$) is the same house grown: four storeys, two corner turrets, a taller clock tower, a double-width porte-cochère, a fountain court and an onsen garden. Six Senses Myoko ($$$) is the grandest: stepped terraces under deep slate eaves, a timber lattice across each tier, a crown tower with a gold finial, two angled wings, three private-onsen villas, a large onsen pool and a lantern avenue.

**Lake Nojiri.** The top-right of the lake was lost under raised ground; it is carved back so the whole lake shows.

**Rivers.** The river lines are joined and smoothed, no longer run through the middle of property models, stay clear of the stations, and share one trunk where three lines had overlapped. Lake Nojiri now has its outlet, the Ikejiri River, which runs north to meet the Seki River beside Myoko-Kogen Station. The Kurohime river now passes south of the station and the e-bike model.

**Hero film.** One forest-walk shot is added between the stand-up paddling and Naena Falls shots, graded to the same look; the film is now about 21 seconds.

**Theme name.** The third theme is now called **Move** (was “Active”), so the three read Restore · Discover · Move. It changes on the home cards, plan cards, studio and intro copy. The walking-comfort option “Active days” is a different setting and is unchanged.

## Verification
`node verification/test-stay.cjs`, `test-assumptions.cjs`, `verify-v10.cjs` (20); `python3 verification/verify-v12.py` (41) and `verify-v16.py` (29) with the preview server on :8770. Track clipping test: 10,255 samples across the line, zero below ground.

## v17 — map layout, rivers, track, hero
- **Lake Nojiri** moved about 1.8 km (1.0 km south, 1.5 km east: down and left on screen) so the railway never crosses it (rail clearance about 1 km). The old basin is filled and becomes rice fields. The cruise, paddling and kayak models move with the lake.
- **Rivers** re-checked against the original DEM-derived rivers (22 polylines from D8 flow accumulation on the 10 m GSI DEM): 19 of 22 stay within 13–71 m on average (max 188 m), inside the drawn width. The Kurohime river runs through the e-bike model's own channel; the Seki River runs through the Sekigawa checkpoint and leaves Naena Falls by its stream; the Seki and Imori rivers now pass around and below the Visitor Centre instead of disappearing under its pad. Lake Nojiri shows one outflow (Ikejiri River, joining the Seki); the inflow stream was removed on request. Headwaters taper to a point and no river is drawn thinner than 100 m, so nothing ends in a blunt cap or a pale scratch when zoomed in. Proof figure: river_proof.png (project docs).
- **Pins**: Lime Resort Myoko right (+0.8 km along the foot of Mt Myoko); Six Senses Myoko back and up to the base of Mt Myoko with its pad cut into the slope (no cliff next to Daruma); Daruma beside the Visitor Centre, with the river below both; Soba making and the winery down-left (winery then nudged right); Madarao Kogen Hotel slightly down; Sekiyama Shrine and the rice harvest moved left; e-bike ride east so its channel meets the river. Displacements recorded in ASSUMPTIONS A-S10.
- **Activity circles**: Daruma's ring had been warped by the Six Senses pad overlapping it. Pads no longer overlap; Daruma uses a tight pad edge.
- **Track**: re-aligned to keep 0.9 km from the lake and clear of every model; a smooth long profile (max 5.5 % grade) with the terrain graded along the corridor, so the line is flat instead of rising and falling.
- **Hero video**: one spider (about 1.9 s, no repeat), Naena Falls for about 3 s, crossfade back to the opening so the loop is clean. 21.8 s, 11.8 MB.
- Tests: verify-v10 20/20, verify-v12 41/41, verify-v16 29/29, test-stay and test-assumptions pass.

## v17.2
- Sasagamine highland picnic moved left and slightly up (about 1.5 km), on its own plateau pad.
- Foliage reduced by 20% (grove tree density 35% -> 28%).
- The "Base · name" tag no longer stays on the map: the chosen stay keeps its glow and the tag shows only while the pointer is over it.
- Mt Madarao's label sits on the summit (the offset that dodged the old lake position is gone).
- Lake Nojiri and the sea: the white lines now move subtly. Wave strokes fade in and out on their own beat and sway; the shoreline glimmers; sea swells brighten and dim as they roll in and the surf line breathes. Reduced-motion settings keep them still.
- Open item: the Local Culture Tour stops (Sekigawa, Sekiyama Shrine, Kiminoi, Kanzuri) still show only the gateway icon; a numbered shrine badge on every stop is proposed (see conversation) and not yet built.

## v17.3 · phones, livelier water, Nojiri's south shore, winery
- **Phones.** The Build filter bar fits one row from 320 px up ("List 15 · All types · Extras", wrapping only if it must); the map opens framed on the valley's places instead of as a thin band of the whole board (Fit returns to that view); on touch screens nav links, footer links, text buttons, day pickers, grips, map controls, stay buttons and the film controls have a 44 px touch area. No page scrolls sideways at 320, 360 or 390 px.
- **Water.** Nojiri's wave strokes are denser, wider, travel across the lake at a visible pace and sway and fade faster; long pale ripple crests roll across the lake and the open sea; sea swell lines move about three times faster, the surf washes up and back, and the shoreline glimmer is quicker. All of it still stops under reduced motion.
- **Nojiri, south shore.** The e-bike pad's terrain blend had raised a crescent of land inside the lake's south edge, hiding the water there. The lake is now re-carved after every pad; rivers and rail were rebuilt on the result.
- **Winery.** Scaled 1.2× (size 3300 → 3960 m); position unchanged.
- **Sea lines.** The white horizontal lines across the sea were surf and shore lines drawn along the two segments that close the coast polygon at the board's edge; they are no longer drawn.
- **Hero film, re-storyboarded.** 13 clips of 1.75 s each (19 s), soft dissolves, ending on a dissolve back to the first frame so it loops: lake reflection, lake cruise, rice field (the opening wide view, before the close zoom), e-bike through the paddies, vineyard, zip line, kayak, sake tasting, soba rolling, soba meal, daruma painting, spider on its web, Naena Falls. Arc: arrive, place, harvest, move, make and taste, quiet.
- **Hero buttons.** "Watch the film" now sits beside "Pause motion" in the same text style (on phones the coordinates are hidden so both fit on one row).
- **Hero continuity.** Montage clips carried about 0.15 s of the editor's own dissolve at their ends, which ghosted into my dissolves: every clip is now cut to clean frames only (1.55 s each, 13 clips, 16.6 s). The page poster was a different lake shot than the video's first frame and also drifted from 106 % to 100 % for six seconds under the fading-in video, which read as a zoom at the start: the poster is now the video's own first frame, does not move, and the video fades in over 0.5 s.
- **Hero loop and lake stutter.** Analysis: the lake shot pans about 31 px per frame at 1080p, which strobes at 30 fps, and the loop ended 0.35 s further into that pan than it began, so every restart jumped (frame difference at the seam 26 against 11 between normal frames). The lake shot is now slowed to half speed with motion-interpolated frames (pan about 15 px per frame), and its first 0.35 s is the dissolve-in at the end of the film, so the last frame leads straight into the first (seam difference 11.4 against 10.7 normal). The poster is the new first frame. Film is 16.3 s.
- **Blank start on Build.** A first-time visitor who goes straight to Build (no saved trip, Plan not visited) now gets a blank map configuration: no places chosen, 3 days (7–9 September), and "Somewhere else" as the stay, so no PCG base is chosen or tagged. Opening Plan gives it its own starting answers (Madarao Kogen Hotel, 4 days); picking a course there, or "Open an empty map", works as before. A saved trip is never overwritten.

## v17.9 – v17.11 (trains, badges, Local Culture Tour)
- **Two trains at once.** The Shinano train comes in from the left border (south edge, towards Nagano), stops at Myoko-Kogen, waits, then keeps running left and disappears at the border. The Echigo Tokimeki train pulls out of Myoko-Kogen towards Arai and disappears at the right-hand (north) border. Echigo leaves while Shinano is still arriving, so the platform is clear. (`kit/trains.js`)
- **Badges are a zoom-in detail.** Activity badges fade out below 1.6× zoom (`BADGE_ZOOM` in `js/map.js`, class `badges-off`) and fade in as you zoom. Trip-numbered badges and a hovered badge stay. Badges are also see-through (72 % white) so names such as Lake Nojiri read behind them. verify-v12 now expects a translucent white disc.
- **Local Culture Tour is one numbered route.** The four stops (Sekigawa gate = 1, Sekiyama Shrine = 2, Kiminoi = 3, Kanzuri = 4) all wear the ordinary torii badge with a small number. Hovering or opening the tour joins them with a dotted line; the tooltip names the stop ("Stop 2 of 4 · Local Culture Tour"); clicking a stop opens the tour card with that stop highlighted, and the card lists the stops in order (click one to fly to it).

## v17.12 – v17.14 (birds, stations, badge zoom)
- **Birds.** `kit/birds.js`: nine small dark gulls glide in slow loops (a flock of four over Lake Nojiri, three round the Mt Myoko ridges, two lone birds towards Arai and over the south ridge). They flap in short bursts, then glide; never picked, no label, not drawn with reduced motion.
- **Trains stop at every station on their run.** Shinano: Kurohime, Myoko-Kogen (turns round), Kurohime again, off the left border. Echigo: Myoko-Kogen, Sekiyama, Nihongi, Arai, off the right-hand border. One timetable cycle is about 85 s.
- **Badges appear later.** The activity badges now need about 2.4× zoom (`BADGE_ZOOM`), so the default view and the first couple of zoom steps stay clean.

## v17.15 – v17.18 (birds out, sea band, boat, rice flicker, two easter eggs)
- **Birds removed** everywhere, including the old skein over the lake (`kit/birds.js` deleted).
- **Sea artifact fixed.** The long pale stripe across the sea was the v17.4 ripple crests lining up into one straight band; each crest is now chopped into short dashes by its own noise (`style/water.js`).
- **Floating boat fixed.** The fishing boats are placed a set fraction of the way from the shore to the board edge; one had been placed past the edge.
- **Rice-field flicker fixed.** Plot tops sat within a few metres of the ground and fought it for depth as the camera range changed while zooming. Tops now ride 3.2 m above the highest corner, and the plots are biased slightly towards the camera (`style/fields.js`).
- **Two easter eggs** (`kit/critters.js`): a small white fox trots round the foot of Mt Iizuna (the tengu Iizuna Saburo rides a white fox), and a small black snake slithers round the foot of Mt Kurohime (the serpent of the Kurohime tale). Each pops out of the ground at a random moment, 35 to 85 seconds apart, walks an arc of the mountain's foot (kept clear of the lakes, the sea and the models), looks about once (the fox) and pops away. They are drawn only once the map is zoomed in, are never clickable or labelled, and are not made at all with reduced motion.

## v17.19 (the two creatures, reworked)
- **Zones, not arcs.** Each creature now wanders freely inside its own zone and never leaves it: the fox in the gentle meadow behind Mt Iizuna (about 3.3 km across, kept off the board edge), the snake within about 2.4 km of Mt Kurohime. A step is refused if it would enter a lake, the sea, an attraction model, the steep ground, or come within 280 m (plus half the width) of any river, so neither can cross a river or wander towards the activities.
- **Fox, remodelled and animated** (`kit/critters.js`): white body with cream back, tapered muzzle, cheek fluff, pointed ears with dark inner, dark socks, a four-lump brush tail and the small red cord of a shrine fox; a soft ground shadow. It trots, settles, sits and looks about (ears twitching), sniffs the grass, crouches and wiggles before a pounce, hops three or four times in a row, and now and then dashes in a gallop. It pops in and out in a puff of mist, and stays about a minute.
- **Snake, livelier**: the body follows the head's own track, so it bends round curves; it slithers, stops to raise its head and flick a red tongue, wriggles in place, coils, and now and then rears and darts. Same mist puff on appearing and leaving.
- Both pause every few seconds, so there is always something to watch.
