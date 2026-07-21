# HEGEMON — Water Spec (WATER-SPEC.md)
*Reference-driven rebuild of the water rendering. The approved gouache paintings
(coastal water, deep sea) in `/art/style-bible/` are the visual targets: the live,
rotating, engine-lit water must produce the same feeling those static paintings do.
The paintings are NEVER applied as textures — they are decomposed into the shader
ingredients below.*

**ASSET VERSION RULE (applies to this spec and all art integration):** when
multiple versions of any reference image or asset exist in the style bible or
uploads, **always use the latest version** (by filename suffix or file date).
Older versions are superseded — do not mix elements from older generations.

---

## 1. Why the reference can't be a texture (context for implementation)
The coastal painting has a baked directional sand→deep gradient, fixed foam
lines, and fixed seagrass shadows. Real coastlines curve in every direction and
must not repeat. Therefore every element is rebuilt dynamically:

| In the painting | In the engine |
|---|---|
| Sand→turquoise→blue gradient | Computed per-pixel from water depth / distance-to-shore |
| White foam line at the shore | Generated along the true shore edge, animated, noise-broken |
| Seagrass shadow patches | Seeded scatter on the shallow seabed (unique per coast) |
| Painterly sparkle/brush feel | Ripple normal maps + subtle painterly noise overlay |
| The colors themselves | Sampled from the painting as shader color constants |

## 2. Depth gradient (highest impact)
- Three sampled color anchors from the coastal reference: **wet-sand gold**,
  **shallow green-turquoise**, **mid aquamarine**; deep anchor from the deep-sea
  reference: **lapis / Egyptian blue**.
- Blend by true depth or distance-to-shore with a **curved** (non-linear) ramp:
  most color change happens near the coast, long calm deep zones stay stable.
- The off-map raider belt (`Tile.open`) sits one step darker and less saturated
  than deep sea — permanently moodier.

## 3. Surface motion
- **Two normal-map scales:** large slow swell + small fast ripple, scrolling in
  slightly different directions; amplitudes low in calm weather.
- **Painterly overlay:** a faint tileable brushstroke-noise layer (very low
  contrast, slowly drifting) so the surface reads gouache, not plastic. This is
  the only texture asset water uses; keep strength subtle (config).

## 4. Foam
- **Shoreline foam:** soft animated white line hugging every land/water edge,
  driven by distance-to-shore, broken by noise so it wanders and gaps naturally;
  gentle pulse (waves arriving), never a uniform outline.
- **Deep-sea whitecaps:** sparse small foam dabs on swell crests, frequency
  scaling with weather (rare in calm, common in storm).
- Foam color: the soft warm white of the reference, not pure #FFFFFF.

## 5. Shore transparency & seabed
- Water becomes translucent over the §6b beach band: sand visible through it,
  wet-sand darkening at the waterline.
- **Seabed layer in shallows:** pale sand tone with seeded **seagrass patches**
  (soft dark olive blobs, per-tile-coordinate seed — deterministic per map, no
  two coasts identical, replay-stable).

## 6. Sun glitter
- Specular sparkle concentrated in a lane along the shared sun bearing —
  directional, stretched, denser near the sun-facing angle; never uniform
  confetti across the whole sea.

## 7. Weather coupling (systems already exist — drive them into water)
- **Calm/clear:** long lazy swells, minimal whitecaps, full glitter.
- **Rain:** desaturate slightly, fine ring-noise on the surface, softer glitter.
- **Fog:** flatten contrast, hide glitter, shorten visible swell distance.
- **Storm:** larger/faster normal amplitudes, frequent whitecaps, darker deep
  tone, foam lines wider at shores; ships visually pitch slightly more.
- **Heat:** faint shimmer at the horizon-most zoom only (subtle; skip on mobile).

## 8. Rivers & lakes
- Rivers reuse the shallow palette (greener, fully translucent bed), faster thin
  ripple scale, thin foam at banks per §6b riverbank treatment; Nile fertile
  strip contrast per TERRAIN-RELIEF-SPEC §6b applies.

## 9. Quality tiers
- Mobile/low: single normal scale, no painterly overlay, foam simplified to the
  shoreline line only, glitter cheap. Visual identity must survive: gradient +
  shoreline foam are the two non-negotiables at every tier.

## 10. Acceptance tests
1. Screenshot a curved bay at default camera next to the coastal reference:
   same felt palette and mood, gradient follows the bay's actual curve.
2. Rotate 360° over a coastline: no direction-dependent artifacts; foam hugs
   the shore at every bearing.
3. Two different coasts side by side: seagrass/foam patterns visibly differ
   (no wallpaper repetition).
4. Toggle calm → storm: the sea visibly changes state in under 2 seconds of
   observation, without reading as a different art style.
5. Same map seed twice: identical seabed scatter (determinism/replay-safe).
6. Mobile tier screenshot still reads as "the same sea," just simpler.

