# HEGEMON — UI Design System & Menu Redesign Spec

> Restyles the DOM client (game.html / game.css / game.js panels) to match the
> game world: carved stone, bronze, gold, civ color. Companion mockup approved
> in chat (main menu, HUD bar, city panel). Same skin family as the tech tree
> UI spec — one design language everywhere.

## 1. Design tokens (add to :root in game.css, migrate panels to these)

```css
:root {
  /* ground */
  --ink:#0d1420; --panel:#16202f; --panel-2:#1c2938; --line:#2a3648;
  /* text */
  --parchment:#e8e2d4; --muted:#9aa4b2; --faint:#5f6b7a;
  /* metals */
  --gold:#c9a84c; --gold-dim:#c9a84c55; --bronze:#b98a4f;
  /* semantic */
  --ok:#8fae5a; --bad:#c05545; --sci:#5b9bd4; --food:#8fae5a; --prod:#b98a4f;
  /* civ accent: set per game on <body data-civ> */
  --civ:#c0392b;
  /* type */
  --display:Georgia, 'Times New Roman', serif;
  --body:system-ui, 'Segoe UI', sans-serif;
  /* rhythm */
  --r:6px; --r-lg:10px; --pad:12px 16px;
}
```

Civ accents: rome #c0392b · carthage #8e44ad · greece #2e86de · egypt #d4ac0d
· gaul #27ae60 · parthia #e67e22 (+ wave-2 colors from techs-v2 BRANCHES).

## 2. Type & voice rules

- **Display serif, letterspaced caps** for: game title, screen titles, city
  names, button labels, section headers. `font-family:var(--display);
  letter-spacing:.12–.32em` (wider = more important).
- **Sans** for everything readable: body copy, numbers, tooltips, lists.
- Numbers always get their **resource color** and a +/− delta in small size —
  the HUD teaches the color code, every panel reuses it.
- Copy voice: laconic. "NEW CAMPAIGN", never "Start a new game!". Tooltips may
  quote history (one line, italic, --muted).

## 3. Signature motifs (pure CSS, no assets)

```css
/* meander (Greek key, simplified) — top/bottom of major screens only */
.meander { height:6px; opacity:.55;
  background:repeating-linear-gradient(90deg,
    var(--gold) 0 10px, transparent 10px 14px,
    var(--gold) 14px 16px, transparent 16px 20px); }
/* gold hairline divider */
.rule { width:120px; height:1px; background:var(--gold-dim); margin:16px auto; }
/* civ edge — the ONLY place civ color floods */
.civ-edge { border-left:3px solid var(--civ); }
```
Restraint rule: meander on full screens (menu, victory, pack opening) only;
never on in-game panels. Gold is for interactive/primary; civ color is for
identity edges/pills; everything else stays ink and parchment.

## 4. Components

**Buttons.** Primary (one per screen max): gold fill, ink text
(`#1a1408`), serif caps. Secondary: --panel fill, --line border, parchment
text, hover border --gold. Tertiary/dim: same but --muted text. Destructive:
--bad border. Min hit target 44×44px (PWA).

**Panels.** --ink ground, --line 0.5px border, --r-lg radius. Header: serif
name + small gold letterspaced subtitle, `.civ-edge` when the panel belongs to
a civ/city, ✕ (ti-x) top-right ALWAYS in the same spot. Body rows: --panel
cards with --line borders, 7px gap. Disabled rows: opacity .55 + gold
"needs <tech>" hint instead of hiding — teaches the tech tree.

**Tabs.** Text tabs with 2px gold underline on active (see city panel mockup).
No boxes-as-tabs.

**Pills.** Status info (weather, turn, civ) = bordered pills, 14px radius.
Turn pill gets the civ border. Weather pill shows remaining front turns.

**Tooltips.** --panel-2, gold hairline top border, sans 12.5px; effect line in
resource colors; optional one-line historical note in italic --muted.

**Modals** (confirm, events, pack opening): dim scrim rgba(6,9,14,.7); modal
is a panel with meander top edge for EVENTS/PACKS only (they're theatrical);
plain for confirms. Crossroads event cards keep their card look inside it.

**Toasts** (research done, city grew): slide from top-center, panel style,
resource-colored icon, 3s, max 2 stacked.

## 5. Information architecture (the "intuitive" part)

**Main menu** (was: flat list + hamburger sprawl):
1. CONTINUE — primary gold, shows save summary ("Turn 47, Rome"). Top slot,
   because it is what a returning player wants 90% of the time.
2. NEW CAMPAIGN → civ picker (card-style civ tiles w/ portrait slot, locked
   civs show rarity + "in Collection") → map size/scenario → start.
3. SCENARIOS — italia/hellas/oikoumene/oldworld as illustrated tiles.
4. COLLECTION — cards, packs (badge shows unopened packs), loadout editor.
5. PROFILE / SETTINGS — half-width pair (less traffic, less weight).
Admin tools (map editor, reveal) live under Profile→Admin, not the main flow.

**In-game top bar** (single bar, one row): resources+deltas left · spacer ·
weather pill · civ/turn pill · END TURN gold. Menu (☰) far-left opens the
PAUSE panel: Resume / Save / Load / Settings / Concede / Main menu — vertical,
same button styles, ESC toggles it.

**Right-side context panel** (city/unit/tech): one slot, one panel at a time,
consistent header anatomy (name / subtitle / ✕), tabs inside rather than
stacking panels. Clicking the map swaps content, ✕ or ESC closes.

**Selection footer** (unit selected): slim bottom-center strip — unit name,
HP bar, move pips, action buttons (Move/Attack/Fortify/Disband) as icon+label,
gold highlight on the suggested action.

**Collection screen**: three tabs — Cards (filter by civ/type/rarity chips) ·
Packs (big theatrical open button) · Loadout (three labeled slots: LEGEND /
EDICT / EVENT with civ-match validation inline, per cards-v2).

## 6. Motion & sound

- 120–160ms ease-out on hover/press; panels slide 8px + fade in.
- END TURN pulses gold subtly ONLY when nothing is left to do (units moved,
  research set, queues full) — the classic "your move" affordance.
- Pack opening: card flip 400ms, legendary gets a gold flash + HGAudio chime.
- All motion respects prefers-reduced-motion.

## 7. Migration notes (game.css / game.js)

1. Introduce tokens (§1) and restyle in this order: top bar → pause menu →
   city panel → unit footer → main menu → collection → settings. Each step is
   shippable alone.
2. Kill inline styles in game.js panel builders as encountered; classes only.
3. Replace emoji icons in the HUD with a tiny inline-SVG icon set (wheat,
   hammer, coin, flask, shield, laurel) — one <symbol> sprite in game.html;
   emoji render inconsistently across the PWA targets.
4. Add `<body data-civ="rome">` on game start; a 12-line CSS block maps it to
   --civ. Tech tree band (UI spec) reuses the same var.
5. Safe areas: `env(safe-area-inset-*)` padding on top bar + footer (iOS PWA).
6. Playwright smoke additions: screenshot main menu, pause, city panel; assert
   exactly one .btn-primary per screen; tab through the main menu and confirm
   focus ring visibility (accessibility).
7. Contrast floor: parchment on ink = 12:1, gold on ink = 7:1, muted on ink =
   4.6:1 — keep ≥4.5:1 for any new text color.
