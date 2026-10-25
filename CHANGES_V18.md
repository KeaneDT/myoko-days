# Myoko Days v18 — sea rendering repair

25 October 2026. Based on the user's `myoko-days-v17.zip`; its internal folder was named `v10`.

Only `assets/diorama/style/water.js`, the style cache key in `js/map.js`, and the map cache key in `index.html` change application behavior. Existing site content, models, lakes, planner and media are retained.

The sea's two competing procedural wave fields were replaced by sparse, finite strokes with soft endpoints, continuous motion and pixel-aware fading. Previous `floor(phase)` identifiers changed abruptly during animation and the periodic bands created conspicuous repeated marks. The surf width is now always positive (the old sum could reach -8), preventing reversed smoothstep bounds. The first coastline segment is correctly included; only the final artificial board-edge segment is excluded.

Verification: rendered the original and corrected map in the in-app browser; checked overview, intermediate zoom and sea close-up. Corrected view retains coastline and three boats, without the prior dense ruled/dashed patterns. Browser checked adding Daruma Painting and its day placement, Review itinerary and totals, and Plan page. Existing `verification/verify-v10.cjs` passes all 20 checks, including 400 random planner trips. These checks are not a cross-browser or real-device audit.

Run `python preview.py --port 8789`, then open http://127.0.0.1:8789/#home. Use HTTP rather than opening index.html directly; the map fetches its local data and media use byte ranges.

Hosted publication is incomplete. Site identity was registered, but automated review rejected credentialed terminal Git upload. No deployed version or public URL is claimed. The working local preview and full source ZIP are the deliverables.
