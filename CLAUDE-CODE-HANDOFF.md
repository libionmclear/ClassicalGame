# HEGEMON v2 — Claude Code Handoff

## File placement
| File | Destination |
|---|---|
| HEGEMON-CIVS-CARDS-v2.md | docs/ |
| HEGEMON-TECHTREE-v2.md | docs/ |
| HEGEMON-VISUALS-v2.md | docs/ |
| HEGEMON-TECHTREE-UI-SPEC.md | docs/ |
| HEGEMON-UI-SPEC.md | docs/ |
| card-art-prompts.md | docs/ |
| cards-data-v2.js | src/ |
| techs-v2.js | src/ |
| units-v2.js | src/ |
| cityModels.js | src/render3d/ |

## Paste this prompt into Claude Code (run per phase, not all at once)

---
Read docs/HEGEMON-CIVS-CARDS-v2.md, docs/HEGEMON-TECHTREE-v2.md,
docs/HEGEMON-VISUALS-v2.md, docs/HEGEMON-TECHTREE-UI-SPEC.md and the four data
files (src/cards-data-v2.js, src/techs-v2.js, src/units-v2.js,
src/render3d/cityModels.js). These are the new design of record. Implement in
FIVE PHASES, committing and verifying (typecheck + npm test + Playwright smoke)
after each. Answer/ask before anything ambiguous; do not assume scope.

PHASE 1 — Cards migration (HEGEMON-CIVS-CARDS-v2.md §7): generals→legends,
add edicts, loadout = exactly 1 Legend + 1 Edict + 1 Event (civ-matched),
Greece display name → Athens (keep id), apply the edict RENAMES listed in
HEGEMON-TECHTREE-v2.md §3.3. Stub stability effects per the substitution rule.

PHASE 2 — Tech tree data (HEGEMON-TECHTREE-v2.md §3): merge UNIQUE_TECHS,
preserve absorbed-tech ids and old-save loading, move phalanx-wall to sparta /
add wooden-walls to greece, extend the tech test suite per §3.10, make the AI
branch-aware per §3.8.

PHASE 3 — Units (units-v2.js): add the 34 non-existing units with stats derived
from basedOn+mods, wire unlockedBy (incl. civLocked trunk unlocks), enforce
caps (praetorian/spartiate), model each per UNIT_SILHOUETTES +
HEGEMON-VISUALS-v2.md §2 using the shared rigs. New hooks that are large
(camel-train aura, scythed-chariot terrain conditionality) may ship stubbed —
list what you stub.

PHASE 4 — Cities (HEGEMON-VISUALS-v2.md §1): raise city tiers to 10 with the
listed pop thresholds, swap the old city builder for
buildCity(THREE,{tier,style,seed,accent}) with seed from hex coords, add the
12-style × tier-slider row to gallery.html, then screenshot tiers 1/5/10 for
three civs via the Playwright flow and report.

PHASE 5 — Stability phase 1 (HEGEMON-VISUALS-v2.md §3): per-city stat, sources
+ yield modifier only, laurel UI on the city panel, then un-stub the Phase 1–3
stability placeholders.

After each phase: update PROJECT-MEMORY.md §5/§8. Cards remain strictly not
pay-to-win. Keep science yields unchanged. Commit messages as the changelog,
co-authored per convention.
---

## Later / optional
- PHASE 6 — Menu/HUD restyle per docs/HEGEMON-UI-SPEC.md (§7 gives the
  step-by-step migration order; each step is independently shippable)
- PHASE 7 — Tech tree UI build per docs/HEGEMON-TECHTREE-UI-SPEC.md
- Generate card art from docs/card-art-prompts.md (68 prompts, style bible in
  HEGEMON-VISUALS-v2.md §4); wire images into the existing art slot; rarity
  frames per the bible.
