# Critter repair plan — before implementation

25 October 2026. User requests: improve the snake model and movement; restrict it to Mount Kurohime's base; apply the background fog effect to the fox. Preserve the v18 sea repair and the rest of the website.

## Diagnosis

The old snake comprises 28 independent low-poly balls. Their radii taper below their 22-unit spacing, visibly separating into beads near the tail. Its body positions receive a second lateral oscillation after trail following, so they do not follow the head's actual track. Random steering, exaggerated wriggling, rearing and darts amplify this. Only the head is checked for boundaries. The old roaming disc is centred on Kurohime's summit, permits a slope of 9, and excludes only 700 units around the peak: it includes steep mountainside rather than just the base.

Fox pieces use unmodified kit materials, whereas terrain shaders call `pAerial`. The fox therefore retains foreground contrast in a hazy background. Materials are shared elsewhere, so a global palette change would be wrong.

## Model

Replace the balls with one connected, smooth, tapered tube: 96 longitudinal spans, 12 radial sides, warm charcoal back, subtle lighter belly, and a fine pointed tail. Give it a modest, flattened head, short rounded snout, small eyes and a fine forked tongue. Keep it a quiet miniature at the map's established scale (roughly 580 world units long), without a large cobra hood or high-contrast alternating segments. Drape each cross-section on the heightfield; lift only the neck gently during inspection.

## Ground and movement

Heightfield inspection (`verification/plan-snake.py`) identifies an open patch at the southeast foot of the rendered mountain, centred about 1,500 units south and 3,200 east of the Kurohime peak. Sampled ground is around 724–800 heightfield units with slopes about 0–0.30; it is clear of the nearby river and activity pads.

Use a small, irregular, smoothly closed circuit within that patch, about 1,100 by 650 units. Add restrained S-curvature to this route, then resample by arc length. Every body section follows the same spatial curve at a fixed distance behind the head. Motion is therefore continuous, length is stable, turns have room, and the body stops when the head stops. Vary travel speed gently; alternate slow travel with short stationary inspection/rest intervals. Remove darts, large vertical rearing, random target pivots and teleporting respawns.

Before accepting a circuit, test its full width against the habitat boundary, terrain slope/elevation, water, rivers and model clearances. Use a conservative fallback scale only if the complete circuit passes. If no safe circuit exists, omit the snake rather than place it outside its habitat. The habitat is a small foothill disc with an additional summit exclusion and elevation ceiling. This is an art-directed area on the stylised map, not a geographic wildlife assertion.

## Fox atmosphere

Clone the fox's unique materials, inject the terrain's exact shared `pAerial` function and live camera uniforms, and apply it after lighting. This progressively desaturates and softens the fox with depth while keeping it opaque and terrain-occluded. Soften its shadow with the same distance factor. Preserve its animation, location and reduced-motion behavior. Apply this before the existing mist overlay; do not add a floating fog card over the animal.

## Acceptance checks

- Connected tube, smoothly tapered tail, no separated beads or mesh holes.
- Long deterministic simulations check the entire snake against its habitat, slope, water and obstacle exclusions, including turns, rests, irregular frame timing and loop wrap.
- Smooth travel/pause transitions; no backward jumps or stationary body oscillation.
- Browser inspect the snake on the actual map at close zoom, fox at its background location, and overall scene. Check shader errors and preserve the existing reduced-motion exclusion.
- Run the existing planner regression checks. Deliver an updated local preview and complete v19 ZIP, preserving v18.
