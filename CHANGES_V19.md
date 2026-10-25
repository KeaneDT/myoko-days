# Myoko Days v19 — Kurohime snake and fox haze

25 October 2026. Continues the working v18 site and retains the sea repair. Planning was written before implementation in `CRITTER_PLAN_V19.md`.

The snake now has one closed 2,324-triangle skin, a smoothly tapered tail, flattened head, small eyes and fine forked tongue. Its subdued charcoal/olive colours fit the diorama. It moves along a gently sinuous, prevalidated circuit at Kurohime's southeast foot. Every section follows the same path by distance. Slow travel eases into short rests or modest head-lift/tongue inspections; the former bead segments, random summit roaming, wriggling, darts and teleporting respawns are removed.

The route is checked across its full width before use. A small foothill habitat, 2,600-unit summit exclusion, slope limit and elevation ceiling confine it to low ground. Water, rivers and model-pad exclusions apply to the complete route. If a safe route cannot be built, the snake is omitted.

All 34 fox meshes use private material clones with the terrain's exact `pAerial` shader and live camera uniforms. Its shadow softens at distance. Existing mist overlays, fox behaviour and the reduced-motion exclusion are preserved. Shared kit materials are not changed.

## Verification

- `verification/verify-critters.cjs`: passed 18,000 irregularly timed frames, about 998 seconds. Roughly 33,352 world units travelled over repeated circuits. Full-body samples remained on low foothill ground, clear of water, rivers and activity pads. Verified terrain contact, fixed body spacing, no wrap jumps, stationary rest poses, closed welded skin topology, finite normals and isolated fox haze uniforms/materials. Maximum frame displacement was 6.081 units at the longest 0.1-second test frame.
- Existing `verification/verify-v10.cjs`: all 20 checks passed, including 400 random planner trips.
- In-app browser: inspected the actual snake on the full map and in a close-up viewer of the production mesh. Inspected the fox at its background location; browser logs showed no shader errors. This does not establish real-device or cross-browser validation.

The full local site runs at http://127.0.0.1:8790/#build while its server is running. `verification/critter-review.html` is a supplementary close-up viewer; it uses the same production code and actual heightfield, with a camera following the snake for inspection. It does not change the site's camera or enlarge the creature in the map.

Only critter code, scene integration, two cache keys and documentation/verification files changed from the v18 working folder. No hosted deployment was attempted in this revision.
