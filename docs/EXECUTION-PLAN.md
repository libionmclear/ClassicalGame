# HEGEMON — Execution Plan

Derived from [DIRECTION-UPDATE.md](DIRECTION-UPDATE.md) (the product owner's decisions
+ work queue, which supersedes earlier guidance). This is the ordered, grounded plan;
each item notes **current status** (checked against the code) and **acceptance**.

Legend: ☐ not started · ◐ partially exists · ✔ done · 🔎 needs owner decision

---

## Phase 1 — Monetization verifications (Direction §1.2 / §8.1)

1. **☐ Pack odds in the purchase UI.** *Status:* `PACK_TIERS` weights exist
   (`game.js`), but the **store/purchase screen doesn't render them per pack before
   purchase** (verified: only village/combat odds are surfaced today).
   *Do:* show each pack's common/rare/epic/legendary weights on the pack itself in the
   buy screen. *Accept:* every purchasable pack shows its odds pre-purchase (Apple
   3.1.1 / Google Play compliance).
2. **◐ Shards craft *every* card.** *Status:* `PACK_ECONOMY.duplicates = "shards"` is
   **declared but not implemented** — no craft function/UI found. *Do:* implement
   dup→shard conversion + a craft action for **all** types incl. civ cards and
   legendaries, with steep rarity-scaled prices. *Accept:* any card (civ + legendary
   included) is craftable from shards; pity timer intact.
3. **☐ Launch-country flag.** *Do:* a config flag to disable pack *purchase*
   (earn-only still works) per storefront country. *Accept:* toggling the flag removes
   the buy button without touching earn flows. 🔎 which countries default-off is an ops
   call.

## Phase 2 — Engine hardening (Direction §3.1)

4. **☐ Determinism lint.** No ESLint config exists yet. Add ESLint +
   `no-restricted-syntax` banning `Math.random` / `Date.now` (and flag unsorted
   object-key iteration used for decisions) inside `src/engine/**`. *Accept:* a banned
   call fails the build; wire into `npm test`/CI.
5. **☐ Golden replay-hash test.** N seeded full games (mixed civs/maps), hash state
   each turn, commit hashes; CI fails on any drift. First audit targets (review-named):
   `scheduleRaid` target selection, `beltTileNear`, `figureContext` for key-order
   dependence.
6. **☐ Lockstep fuzz.** Extend `test/mp-lockstep.test.ts`: random seeds, two clients
   with different `humanPlayerId`, assert byte-identical state every turn, full match.
7. **☐ Pending-decision revalidation.** Each `applyResolve*` re-validates at resolution
   time and no-ops gracefully (raid on captured/vanished city — partly handled;
   tribute no longer affordable — handled; figure whose condition flipped). One test
   per edge case.
8. **☐ Unify the decision queue.** Fold `pendingRaid` into the same one-at-a-time slot
   as `pendingEvent`/`pendingFigure` so modals never stack.

## Phase 3 — Tier-1 graphics pass (Direction §6.1) — *high leverage, do early*

9. **☐ Stylization shader + classical LUT** in the existing post-FX chain
   (terracotta / ochre / Egyptian-blue / verdigris; toon-ramp or painterly edges).
10. **☐ UI reskin (the polish flagship):** aged-plaster panels, meander (Greek-key)
    borders, gilded controls, Trajan-adjacent display face, smooth transitions.
11. **☐ Ambient life (procedural):** hearth smoke, birds, wind-swayed grass/trees,
    animated faction banners, harbor traffic, visible weather.
12. **☐ Per-civ procedural architecture kits** (the differentiation core): parameterized
    building generators per civ over the existing wood→mudbrick→stone→marble system.

## Phase 4 — Daily Campaign (Direction §4.1) — highest of the feature slate

13. **☐ Seed-of-the-day service** (identical map/weather/raids/figures for all players).
14. **☐ Score submit + replay-verify endpoint** (server replays the action log →
    cheat-proof by construction — leans on the determinism above).
15. **☐ Leaderboard UI (global + friends), streak counter, share button.**

## Phase 5 — Title ladders + cosmetics schema (Direction §5 / §7)

16. **◐ Title ladders.** *Status:* **already scaffolded** — `src/engine/titles.ts` has
    `TITLE_LADDERS` for the 8 civs + `LAUREL_THRESHOLDS`. *Do (refine to §5 spec):* add
    per-promotion **Codex entries**, capstone **cosmetic crown/emblem** unlock, the
    **historical validator** per ladder, women's-office **choice** at capstone (Kush /
    Britons / Scythia), and reconcile rung names to the §5.2 lists. Author flagship
    locked-civ ladders (§5.3) at unlock.
17. **☐ Cosmetics catalog schema** (`cosmetics-data.js`, pure data): 5 slots (crown,
    portrait, banner, emblem, epithet), ~150 cards, rarity + shard-craft + a few
    deed-locked (Grass Crown, *Africanus*/*Britannicus*, capstone frames). Art fills in
    waves via the §6.2 pipeline.

## Phase 6 — Content, accuracy & telemetry (Direction §3.3 / §2)

18. **☐ Imhotep fix.** Rename the Egypt figure to **"Priests of Imhotep"** (his cult
    was active in the Late Period) — same boon, removes the ~2650 BC anachronism.
    `src/engine/figures.ts` + `test/figures.test.ts` + docs.
19. **☐ Restore three cut ruins** to `src/engine/discovery.ts`: Frescoes of Akrotiri
    (culture + free fresco cosmetic), Alignments of Carnac (faith), Pile-Dwellings of
    the Garda Moraine (food + irrigation).
20. **☐ Codex growth:** unlock Codex entries for **figures met** and **Legends
    collected** (first-acquisition), not just ruins.
21. **☐ Ranked telemetry:** log per match {equipped Legends/Edicts, ranked flag,
    outcome}; report win-rate delta (equipped vs not) at similar rating.
22. **☐ Earn-rate documentation:** compute expected hours-of-play per pack tier and to
    craft a legendary via shards — a known number, not a hope.

## Phase 7 — Codebase health (Direction §3.2)

23. **☐ Split `src/engine/index.ts`** into per-domain reducer modules (combat, cities,
    end-turn, raiders, figures) composed by the dispatch switch.
24. **☐ Migrate `game.js` → TS modules** incrementally (MP session → modals → view-build).
25. **☐ Measure deep-clone cost** on the largest map; adopt Immer if material.
26. **☐ Evict the leftover Personal Assistant app** to an archive branch.
27. **☐ Scale the balance sim** to 200+ games nightly with per-civ CIs; then tune the
    known Britons/Gaul-strong, Athens/Egypt-weak spread.

## Phase 8 — Player experience & remaining slate

28. **☐ Fast-onboarding preset** (small map, districts off, minimal diplomacy, one raid
    max) — new-player funnel (feature, not a pillar).
29. **☐ Mobile perf gate** — profile GTAO+SMAA+Bloom on mid-range Android; quality
    toggle auto-selects from a first-launch benchmark.
30. **☐ Chronicle** (§4.2), then **Ghost Campaigns** (§4.3), **Counterfactual Cards**
    (§4.4), **Period Voice** (§4.5).
31. **☐ Unit-asset pipeline spike** (§6.3): Meshy/Tripo3D image-to-3D → rig → glTF, vs
    the $0 multi-angle sprite-sheet fallback. Go/no-go.

---

## Hard constraints to bake in everywhere
- **Trademark hygiene (Direction §4):** never use "Civilization"/"Civ" in title,
  subtitle, store copy, or ads (incl. comparatives). No imitation of a competitor's
  tech-quote narration, leader-dialogue framing, or UI trade dress. Originality of
  *expression* (names, text, art, voice) is the whole legal surface.
- **Determinism & lockstep** (see REVIEW-HANDOFF §2) — the golden-hash + lint work
  (items 4–6) turns these from convention into enforced invariants.
- **No purchased asset packs** (Direction §6) — the look must be ours; procedural +
  one locked AI style only.

## Owner decisions to confirm 🔎
- Country flag defaults (which storefronts ship purchase-off at launch).
- Art-tooling budget/tool choice for §6.2 (Midjourney vs Leonardo) and §6.3
  (Meshy/Tripo) — the plan assumes the update's stated tools.
- Whether to start at Phase 1 (monetization verifications) per §8 order, or pull the
  Tier-1 graphics pass earlier for its screenshot leverage.

## Recommended start
Per Direction §8: **Phase 1 (monetization verifications)** — small, self-contained,
compliance-relevant, and each is a clear code task. Items 1–2 (odds-in-UI, shards
craft-everything) are the most concrete; item 3 (country flag) needs one ops decision.
