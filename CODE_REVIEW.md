# Myoko Days code review — 25 October 2026

Scope: the static v19/v20 application, planner and saved-trip handling, map loading, animation integration and user-facing cost presentation. Targeted source inspection and reproducible cases, not a penetration test, browser matrix or operator-availability audit. The animal changes are implemented in v20; the four findings below remain recommendations. No account system, payment processing, public upload or remote trip-import feature was found in the reviewed site. I did not establish a remotely exploitable injection path. Do not interpret that as a security guarantee.

## 1. [P1] The planner accepts a full-day summit climb and afternoon kayaking on the same day

Evidence: `js/planner.js:4`, `:54`, `:119`, `:243`; activity definitions in `js/data.js`. Long outings (`u === 2`) occupy only one AM slot; pairing them with another activity adds a soft penalty instead of blocking the other half of the day. `verification/audit-cases.cjs` reproduces a four-day plan with Guided Mt Myoko Summit Hike in Day 2 AM and Kayaking in Day 2 PM; both survive `schedule`, with only `day.long = true`. This is a confirmed engine acceptance, not an assertion about an operator's actual timetable.

Impact: an apparently complete, priced itinerary can be impractical before travel time is considered. This is an intentional simplification in the current engine rather than a new regression, but it is a major visitor-experience problem if treated as a usable day plan. The current regression suite explicitly allows the simplification, so its passing result does not test real-world feasibility.

Recommendation: full-day outings reserve AM and PM, with explicit exceptions for independently verified short evening add-ons. Add transition/return-time allowances before displaying compatible combinations. Test the summit-hike/kayak counterexample as a rejected or conflicting day. This requires a product decision about the existing half-day model.

## 2. [P1] Calculated costs are presented with more commercial certainty than their inputs support

Evidence: `js/assumptions.js:11` onward hard-codes hotel base rates, seasonal multipliers, weekday multipliers, van cost and exchange rate. `js/stay.js` computes quotes from them, without a live rate/availability request. `js/app.js` renders the properties as priced for the visitor's dates; `index.html:260` describes tax-inclusive prices subject to availability. The separate assumptions document identifies modelled inputs, but it is removed from the point where the price is chosen.

Impact: users may interpret an exact room/night total as an available operator quote and make travel decisions on it. Editing a local price cannot alter a real booking because there is no transaction backend here; the risk is misleading presentation and trust, not payment theft.

Recommendation: show the planning/modelled status beside the amount and provide verified operator links; use a real quoting integration before implying available rates. If the current polished wording is retained for a course demonstration, explicitly keep it as a demonstration rather than operational booking guidance. Do not silently change the team's modelled figures or invent verified tariffs.

## 3. [P2] A failed idle preload can prevent map startup until a reload

Evidence: `js/map.js:149` stores `loadBase().catch(() => null)` in `basePromise`. `start` at `:158` reuses any truthy promise. If a required script fails during warm-up, the promise resolves to null while its failure state is lost. Opening Build subsequently reuses it and can reach the fallback without a fresh load. A missing required style script is also silently ignored. The fallback at `:193` attributes every startup error to WebGL even when the cause was a failed asset request.

Impact: a transient loading failure can become a session-long broken map, and the message sends users toward the wrong repair.

Recommendation: clear `basePromise` on rejection; preserve failure information; allow a visible Retry action that rebuilds the load attempt. Distinguish WebGL support/context loss from asset/network errors. Add a test that fails the first script request and permits the second, then verifies successful Build startup without page reload. The present audit confirms the promise-control-flow defect from source; it does not claim a network-fault browser test was performed.

## 4. [P2] Saved-state membership checks accept inherited object keys

Evidence: `js/app.js:39`, `:40`, `:44`, `:46` use truthiness checks such as `D.courses[o.course]` and `D.byId[id]` on ordinary JavaScript objects. `constructor`, `toString` and `__proto__` are not valid content identifiers but can resolve to inherited values. The executable audit restores `course: "constructor"`; it is accepted, and requesting that course's preview throws `Cannot read properties of undefined (reading 'filter')`.

Impact: corrupted or deliberately edited same-origin storage can reach code that expects a real course/activity and crash. The JSON parse try/catch does not protect subsequent renders. I found no link, URL parameter or public import path that lets another visitor inject such a save, so this should not be described as confirmed remote XSS or cross-user prototype pollution.

Recommendation: validate all identifier fields with own-property checks and explicit types; restore only schema-approved values into fresh state; optionally use null-prototype dictionaries. Bound the serialized save size and selection length, and recover malformed saves without losing unrelated valid preferences. Add cases for inherited keys in course, stay, selections and placements, malformed objects and storage denial.

## Animal issue corrected in this revision

The former route validated terrain, water and attraction pads but ignored procedural rice plots and village-house instances. V20 takes the exact plot footprints from the production fields generator, applies a 55-unit plot setback, excludes conservative full-roof circles for all 209 houses, and validates the snake's complete width. The route is shifted slightly uphill and scaled to the safe patch. Both residents are posed immediately and remain present at every zoom; reduced motion leaves them visible and still.

`verification/verify-critters.cjs` passed 18,000 irregularly timed frames (998 seconds), checking visibility throughout, full-body obstacle clearances, ground contact, fixed spacing, rest poses and closed skin topology. The existing 20 planner checks, including 400 random trips, also pass. Audit reproductions are saved in `verification/audit-results.json`. These results cover the stated checks, not all possible browser or business risks.
