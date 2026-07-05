# HEGEMON — known issues & what's not perfect

A running log of rough edges, partial fixes, and deferred work. Planned *features*
live in [ROADMAP.md](ROADMAP.md); this file is for what's imperfect *today*.
(Last swept: 2026-07 session.)

## Balance
- **Last-seat lag (3+ players), partially fixed.** Rotating initiative lifted the
  last seat from ~1.8 to ~2.2 cities (vs ~3.5/3.9), but it still draws the
  "pincered middle" starting position. A room-based capital-placement fix was
  tried and did **not** help (reverted). Fully closing it likely needs smarter,
  more symmetric capital placement (avoid the squeezed middle) — not just room.
- **Civ imbalance, untuned.** Across seats, Carthage under-performs (~2.3 cities /
  ~340 score) while Rome/Egypt/Parthia sit higher. Needs a civ-balance pass.
- **Sim per-civ sample is skewed.** `orderRoster` seats the chosen civ first then
  the rest in historic order, so for playerCount < 6 the early-historic civs
  (Rome, Carthage) are over-sampled. For a clean per-civ read, fully shuffle the
  seat→civ mapping in the sim.
- **Bigger armies since resources phase 2.** Build discounts pushed units/civ from
  ~6.6 to ~12 (max seen 100+ in a runaway game). Watch that food upkeep is a
  strong enough brake; may need tuning.

## UI / UX
- **In-play panel still blocks a tile under a button.** For a selected unit the
  panel is click-through except its buttons, so a move-target directly under a
  button (e.g. Found City) is still blocked. Rare, but real.
- **Human no longer always moves first** in 3+ player games (rotating initiative).
  Intended for fairness, but it is a feel change; no opt-out.
- **3D camera inclination is a fixed default (~38°).** You can drag to change it,
  but there's no in-game control/preset. Default may not suit everyone.
- **Headless city-selection is awkward to test** (the capital starts unit-stacked,
  so scripts must clear it first) — verification friction, not a game bug.

## Graphics (the biggest gap — see ROADMAP + graphics plan)
- **Units are flat billboard sprites** (placeholder). Plan: animated low-poly glTF
  units + stylized hex terrain + post-processing (AO/HDRI/water). Deferred.
- **Carthage & Parthia have no sprite art** — they render as coloured markers.
- **No animation** (unit movement / combat), **no roads/rivers in 3D**, **no
  terrain textures** on tile tops.

## Economy / features (deferred)
- **Resources phase 3 not built:** no spendable stockpile (wood/ore/stone
  consumption) — we chose the discount model instead. Improving a resource tile
  does not yet increase its yield.

## Deploy
- **App packaging not set up.** Goal is online + app; only the web/Vercel build
  exists. Mobile (Capacitor/PWA) and desktop (Tauri/Electron) wrappers are TODO.
