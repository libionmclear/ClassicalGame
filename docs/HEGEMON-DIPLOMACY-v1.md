# HEGEMON — Diplomacy & Alliances v1 (Design of Record)

> Scope: between Polytopia (nothing) and Civ (bureaucracy). Few rules, real
> teeth. Diplomacy must interact with what exists: stability, tribute-style
> techs, cards, and the pop-based war economy (wars now cost people — peace
> finally has a price tag).

## 1. Relations

Per civ-pair score, −100..+100, visible as five bands:
Hostile (≤−50) · Wary (−49..−10) · Neutral · Cordial (+10..+49) · Friendly (≥+50).
Drivers per turn (examples, tunable): shared war vs common enemy +2 ·
active trade pact +1 · gift of gold +1 per 25g (diminishing) · border friction
−1 per adjacent contested hex cluster · you razed a city −20 with everyone ·
broke a pact −40 with victim, −15 with all others · long peace +0.5.

## 2. Agreement ladder (each step requires the band, unlocks the next)

| Agreement | Requires | Effect |
|---|---|---|
| Peace | default | — |
| Trade Pact | Neutral+ | 1 extra trade route between you; +1 gold each side per route |
| Non-Aggression Pact | Cordial | neither may declare war for 30 turns; breaking = Oathbreaker (§3) |
| Passage Rights | Cordial | units may cross each other's land (no city entry) |
| Defensive Alliance | Friendly + NAP held 15 turns | if one is DECLARED ON, the other auto-joins |
| Full Alliance | Friendly + Def. Alliance 15 turns | shared vision, joint war declarations, allied victory eligible (§6) |

Cancelling an agreement requires **Denounce** first (public, −10 relations),
then a 5-turn cooldown before hostilities — no pact-to-backstab in one turn.

## 3. War & reputation

- Declaring war requires a formal declaration; the defender gets a 1-turn
  alert (units inside your borders are escorted out, not deleted).
- **Surprise war** (attacking without declaration, or during NAP): allowed,
  but brands you **OATHBREAKER (25 turns)**: −40 relations with victim, −15
  with everyone, all cities −1 stability, mercenary prices +25% (sell-swords
  distrust contract-breakers — the pop economy makes this bite), AI will not
  sign anything above Trade Pact with you.
- **War weariness** already flows through stability (−1 per 15 war turns);
  diplomacy adds: white-peace offer button, and peace treaties may include
  gold, cities, or vassalage terms.

## 4. Tribute & vassalage

- **Tribute**: one-way gold/turn for guaranteed peace (10–25 turns). The
  Scythian and Han doctrines already monetise this (§5).
- **Vassalage** (offered in peace deals, or demanded at ≥2:1 military score):
  vassal pays 25% gold income, grants passage, joins your defensive wars,
  cannot ally others. Vassal cities count as CONTROLLED for domination —
  **you can now win as a hegemon without razing the world**, which is the
  historically accurate Roman/Persian path and the payoff of this system.
- Vassals can rebel if your military score halves or their stability ≥+3
  while relations Hostile.

## 5. Civ diplomatic personalities (AI) + tech ties

The branch techs already planted diplomacy hooks — wire them:

| Civ | AI personality | Tech tie |
|---|---|---|
| Rome | Lawful expansionist: honors pacts, punishes Oathbreakers, demands vassalage | — |
| Carthage | Mercantile: seeks Trade Pacts with all, buys peace, rarely declares first | Mercenary levies |
| Athens | League-builder: wants Defensive Alliances with coastal civs | Delian League tech → +1 gold per allied city (already in data) |
| Egypt | Defensive: NAPs eagerly, tributes when outmatched, fights on the Nile | — |
| Gaul | Feud-prone: short wars, accepts white peace easily, hates passage denials | — |
| Parthia | Opportunist: strikes Oathbreakers and overextended empires | — |
| Sparta | Isolationist: rejects Passage Rights, allies only when invaded | Peloponnesian League tech |
| Macedon | Hegemonic: offers alliances, then demands joint wars; drifts to vassalizing allies | League of Corinth tech |
| Persia | Tributary empire: generously offers vassalage terms, tolerant to vassals (+relations while vassal) | King of Kings capstone |
| Han | Tributary system: unique action — neighbors may accept TRIBUTARY status (soft vassal: small gold to Han, trade + defensive pact back) | Tributary System capstone (already grants gold/civ at peace) |
| Maurya | Dhamma diplomat: post-first-war becomes peace-seeking, spends on gifts | Ashoka legend synergy |
| Scythia | Raider: demands tribute, honors paid peace scrupulously (bought Scythians stayed bought) | Steppe Tribute tech |

## 6. Alliance victory

Toggle at game setup (default ON): two civs in FULL ALLIANCE for 30+ turns may
win jointly if together they meet a victory condition. Prevents the endgame
ally-backstab from being mandatory; turning it off makes Full Alliance a
late-game trap by design — both are legitimate metas.

## 7. UI (per HEGEMON-UI-SPEC tokens)

Diplomacy screen: one row per known civ — leader/civ tile (civ color edge),
relation band meter, active agreement chips, action buttons (Gift · Propose ·
Denounce · Declare). Proposals arrive as Crossroads-style event cards.
Oathbreaker brand = small broken-laurel icon by the civ name, tooltip shows
turns remaining. Everything reuses panel/pill/button components.

## 8. Engine & AI notes

State per pair: `{relation, agreements:[{type,expires}], denouncedAt,
oathbreakerUntil, tribute:{to,amount,expires}, vassalOf}`. Evaluate AI
proposals on a simple utility: relation band + military ratio + personality
weights (§5 table as data). Vassal/tributary income enters the normal economy.
Phase 1 ship: relations, Trade Pact, NAP, tribute, declaration+Oathbreaker.
Phase 2: alliances, passage, vassalage, alliance victory, personalities.

## 9. Tests

NAP blocks declaration until expiry · surprise war sets all Oathbreaker
penalties incl. mercenary +25% · denounce-then-cooldown enforced · vassal gold
flows and counts toward domination · Han tributary action gated by capstone ·
alliance auto-join triggers on DECLARED wars only (not on the ally's own
aggression — no dragging friends into your crimes).
