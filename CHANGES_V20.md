# V20 — permanent residents, field/house avoidance and code review

25 October 2026. User requested a critique of major exploitable or user-experience problems; continuous fox/snake presence; no snake movement in rice fields or houses; and researched animation options for Madarao and Myoko.

Both animals are posed at construction and remain spawned at all zoom levels. The fox no longer disappears after a lifetime timer. Reduced-motion users see the still poses, while the scene's existing animation gate prevents movement.

The snake's circuit now uses the **actual generated rice-plot footprints** supplied by `fields.js`. It checks the oriented plot rectangles with a 55-unit setback, as well as conservative full-roof exclusion circles for every house in `layout.json`. Full-width validation remains in place, and the circuit was shifted slightly uphill and scaled to the accepted safe patch. There are 2,005 generated plots and 209 houses in the supplied map. Fields still render with the same geometry, colours and layout.

Tests: 18,000 irregular frames / 998 seconds passed, checking both residents' visibility at overview and close zoom, every sampled body section and side against the new field/house exclusions, previous water/terrain/model restrictions, stable spacing, rest poses and closed skin. Existing 20 planner checks including 400 random trips passed. The full map rendered in the in-app browser with no console errors observed. These are targeted checks, not a cross-browser or real-device audit.

`CODE_REVIEW.md` ranks four remaining findings and provides code locations, impact and remedies. `verification/audit-cases.cjs` reproduces inherited-key saved-state acceptance and a full-day hike paired with afternoon kayaking, and records the failed-preload promise-control-flow issue. Those planner, pricing and saved-state policies were reviewed, not silently changed in this animal revision.

`ANIMATION_OPTIONS.md` contains sources and five proposed animations. None has been implemented. Local preview: http://127.0.0.1:8791/#build. V19 remains preserved; no hosted upload was attempted.
