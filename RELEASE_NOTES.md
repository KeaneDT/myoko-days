# v1.0.0 — Four mountain residents

The complete Myoko Days static site, including the illustrated 3D map, itinerary planner, local photographs and films, and trip review/export.

- Added a charcoal Haneuma-inspired horse in the Sasagamine meadow: slow walking, ground-aware grazing and jaw motion, attentive pauses, short eased canters, articulated legs with terrain-aware foot placement, mane and tail movement.
- Added a brown-grey rabbit below Madarao: grazing, listening, ear movement and groups of crouch–hop–land movements with planted pauses.
- Both new residents use validated local circuits, conservative full-body collision checks, soft shadows and the map's aerial haze. They remain spawned; reduced-motion preferences retain still poses.
- Preserved the fox, continuous-skinned Kurohime snake, rice-plot/house avoidance, sea repair, planner, photographs and films.
- Included a model-review viewer, readable architecture/run documentation, cultural provenance, known limitations and executable regression checks.

The supplied ZIP is the complete site. Extract it, run `python preview.py --port 8792` in its folder and open http://127.0.0.1:8792/. It requires an HTTP server; opening index.html directly is not supported. No reservation or payment is made by this site.

Known review findings remain documented in `CODE_REVIEW.md`: modelled price certainty, full-day itinerary conflicts, asset-load retry handling and malformed saved-state identifiers. These were not silently changed as part of the animal revision. Fieldwork media has no general public reuse licence. This release is intended to remain in its owner's private repository.
