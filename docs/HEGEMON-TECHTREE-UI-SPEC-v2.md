# HEGEMON — Tech Tree UI v2.1 (REVISION: swimlanes + era gates)

> Supersedes the layout portion of HEGEMON-TECHTREE-UI-SPEC.md. Fixes the
> shipped v1 problems: free-floating nodes per column, connector spaghetti
> crossing cards, fully-rendered locked techs, parchment background.
> Approved mockup: swimlane layout with era-gate badges (in chat, July 8).

## 1. Track model (the core fix)

Every TRUNK tech gets a `track`. Layout becomes a strict grid:
**columns = age sub-columns, rows = tracks.** Node order is deterministic;
prerequisite lines within a track are short horizontal arrows.

```js
export const TRACKS = ["military","construction","economy","civic","naval"];
export const TECH_TRACKS = {
  // military
  "bronze-working":"military","archery":"military","iron-working":"military",
  "horseback-riding":"military","siegecraft":"military","combined-arms":"military",
  // construction
  "masonry":"construction","engineering":"construction","mountain-paths":"construction",
  "roads-logistics":"construction","aqueducts":"construction",
  // economy
  "pottery":"economy","animal-husbandry":"economy","irrigation":"economy",
  "currency-reform":"economy","trade-routes":"economy",
  // civic & knowledge
  "writing":"civic","philosophy":"civic","republic":"civic",
  "law-administration":"civic","rhetoric":"civic","medicine":"civic",
  // naval
  "sailing":"naval","open-sea-sailing":"naval","navigation":"naval",
};
// Any trunk tech not listed: assign to the nearest theme (Claude Code judgment,
// log the mapping in the commit message). Doctrine forks stay in their
// parent's track. The CIV BRANCH BAND is unchanged: full-width row below the
// lanes, in civ color, per the original spec.
```

Each age gets 1–2 sub-columns (by prereq depth within the age) so long tracks
don't overlap. Grid rows have fixed heights; empty track/age cells collapse.

## 2. Hard prerequisites (AND, not OR)

`canResearch(t)` requires **every** id in `prereq[]` researched. Tighten the
trunk so ages interlock (suggested — keep existing where already stricter):

| Tech | prereq (ALL required) |
|---|---|
| iron-working | bronze-working, masonry |
| siegecraft | iron-working, engineering |
| engineering | masonry |
| open-sea-sailing | sailing, writing |
| horseback-riding | animal-husbandry |
| currency-reform | writing, masonry |
| medicine | philosophy |
| law-administration | writing, republic |
| rhetoric | philosophy |
| roads-logistics | engineering |

## 3. Era gates (progress-based age locking)

```js
export const AGE_GATES = { 2: { requiredPrevAgeTechs: 5 },
                           3: { requiredPrevAgeTechs: 6 } };
```
- Engine: a tech of age N is researchable only if its prereqs are met AND the
  player has researched `requiredPrevAgeTechs` of age N−1. Branch techs count
  toward gates and are gated the same way.
- AI: same rule (it already researches legally; just include the gate in its
  candidate filter, weighted per HEGEMON-TECHTREE-v2.md §3.8).
- UI: amber circular badge between era column groups showing `3/5`; tooltip
  lists which researched techs counted. Badge pulses softly when one tech from
  opening the gate. Gold flash + toast ("The age of Kingdoms begins") on open.

## 3b. Cost tiers within an age (cheap foundations, expensive capstones)

Flat 20/46/82 per age is replaced by **depth-tiered pricing**:

```js
// cost = AGE_BASE[age] × TIER_MULT[tier] × costScale   (round to int)
export const AGE_BASE  = { 1: 16, 2: 40, 3: 78 };  // averages ≈ old values
export const TIER_MULT = { 1: 0.8, 2: 1.0, 3: 1.3, capstone: 1.6 };
// tier = 1 + longest SAME-AGE prereq chain above the tech.
// Explicit overrides allowed via tech.costMod (e.g. cheap utility side-techs
// at 0.7, luxury conveniences at 1.2) — data wins over formula.
```

Resulting texture (Age II example): foundations like Iron Working ≈ 32,
developed techs like Siegecraft ≈ 52, a doctrine capstone ≈ 64. Entering a
new track is cheap; going DEEP in a track is the expensive commitment. Science
yields remain untouched — this re-prices the sinks, not the income.

## 3c. Limited frontier (choice pressure)

The available-to-research list must stay SMALL — that is what makes each pick
feel like a decision:
- Design target: **3–6 researchable techs at any moment** (prereqs + era gates
  naturally enforce this once §2's AND-prereqs land; every age's tier-1 layer
  should have at most 4–5 entry techs across all tracks).
- Each track's entry tech is the only same-age tech with no same-age prereq;
  everything else in the track chains behind it.
- Add a sim test: scripted 30-tech playthrough asserting the frontier never
  exceeds 7 and never drops to 0 before victory-relevant techs are done.
- AI weighting: cost-efficiency term (value ÷ cost) so it grabs cheap
  foundations early and commits to one expensive line — mirroring good human
  play, and reinforcing §3.8's branch awareness.

## 4. Progressive disclosure (kill the noise)

- Techs behind a CLOSED gate render as **chips**: name-only dashed pills, 30px
  tall, no icon, no effect text, no connectors drawn to or from them.
- Gate opens → chips expand to full cards (150ms), connectors appear.
- Full cards show: icon, name, one-line effect, cost pill. Long effect text
  truncates at one line — full text lives in the hover tooltip, not the card.

## 5. Connector rules

- Only draw prereq edges where BOTH ends are expanded (post-gate).
- Same-track edge: straight horizontal arrow, node edge to node edge.
- Cross-track edge: **coral, dashed**, orthogonal (H-V-H) routed through the
  column gutter between age groups — never across a card. Max ~1 bend pair.
- Default link opacity 0.35; hover a node → its full prereq chain (nodes +
  links) lights to 1.0, everything else dims to 0.4 (keep v1's hover feature).
- Researched-to-researched links render in the teal researched color at 0.5.

## 6. Skin correction

The screen must sit on the dark tokens (HEGEMON-UI-SPEC.md §1): `--ink`
background, `--panel` cards, gold era headers — NOT parchment. The parchment
v1 shipped with contradicts the HUD; one `background` swap plus token classes.

## 7. Verify

Playwright: (a) zero connector path segments intersect any .tt-node bounding
box (compute in-page); (b) Age II techs un-researchable at 4 Age I techs,
researchable at 5 with prereqs met; (c) chips have no drawn edges; (d) iron-
working blocked with bronze-working researched but masonry not; (e) every
card's cost pill equals the §3b formula (or its costMod override); (f) the
§3c sim: frontier size stays in 1..7 across a 30-tech scripted run;
(g) screenshot lanes at game start / gate open / 10 techs in.

## 8. Paste-ready Claude Code prompt

---
Read docs/HEGEMON-TECHTREE-UI-SPEC-v2.md. It revises the research screen and
research economy: (1) track assignments + grid swimlane layout per §1,
(2) AND-prereqs and the tightened trunk prereqs per §2, (3) era gates per §3
in engine + AI + UI, (4) depth-tiered tech costs per §3b — compute tier from
same-age prereq depth, show the real cost on each card's pill, (5) limited
frontier per §3c including the 30-tech sim test, (6) collapse gated techs to
chips per §4, (7) re-route connectors per §5, (8) dark tokens per §6. Then run
the §7 checks and show me the three screenshots plus the frontier-size sim
output. Answer/ask first if any existing trunk prereq conflicts with the §2
table, and report the full recomputed cost list for my review before
committing balance.
---
