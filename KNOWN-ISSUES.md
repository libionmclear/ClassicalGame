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
- **Civ balance — mostly fixed; one residual.** With a clean full-seat-shuffle
  read (36 large 6-civ games), five civs cluster tightly and win distribution is
  ~uniform (5/6/6/6/6/7). Carthage was the outlier (2 wins); cutting the War
  Elephant's cost (tech 44→36, unit 32→24, upkeep 3→2, + a grain build discount)
  brought it to a fair win share (6). **Residual:** Carthage's avg score/cities
  still trail ~15–20% — a "fewer cities, fiercer army" identity, not clearly
  underpowered. Closing that gap needs a non-military lever (a Carthage economy
  bonus) and risks over-buffing its win rate, so it's left as flavour for now.
- ~~Sim per-civ sample skewed~~ — FIXED: the sim now fully shuffles seat→civ each
  game (`civOrder`), so per-civ and per-seat signals are both clean.
- **Bigger armies since resources phase 2.** Build discounts pushed units/civ from
  ~6.6 to ~12 (max seen 100+ in a runaway game). Watch that food upkeep is a
  strong enough brake; may need tuning.

## UI / UX
- **In-play panel can block a tile under a button — reduced.** A selected unit
  shows only a small toggle by default (no occlusion); opening the actions panel now
  **left-docks** it (`.cp-clickthrough`), so its buttons cover left-edge tiles
  instead of the right — and a unit + its reachable ring usually sit toward your own
  territory. A move-target directly under a button is still blocked in that opened
  state (regression-guarded by the UI smoke's left-dock check). Full fix = a
  bottom-center action footer (deferred).
- ~~**Human no longer always moves first** — no opt-out~~ — FIXED: a setup toggle
  **"I always take the first turn"** turns off rotating initiative (engine
  `rotateInitiative`, default on). Online games always rotate (fixed for
  determinism); solo players can opt to always open the round.
- **3D camera inclination is a fixed default (~38°).** You can drag to change it,
  but there's no in-game control/preset. Default may not suit everyone.
- ~~**Headless UI testing is awkward**~~ — FIXED: `game.js` exposes a tiny test hook
  `window.HGTest` (`snapshot()`, board-agnostic `clickTile(q,r)`, `endTurn()`), and
  `test/browser-smoke.mjs` now drives the **default 3D board** through it against the
  served backend (signed in as admin) — no canvas pixel-picking or 2D DOM classes.
  Verifies boot / render / unit-selection / turn-loop; benign asset 404s (optional
  `.glb` models, sprite-less civs) are reported but don't fail. `npm run test:browser`.

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
- **PWA done; native wrappers TODO.** The web build is now an installable PWA
  (manifest + service worker + icons; offline-capable, network-first). That covers
  "install to home screen" on mobile/desktop. A store-grade native shell
  (Capacitor for iOS/Android, Tauri/Electron for desktop) is still TODO if wanted.
