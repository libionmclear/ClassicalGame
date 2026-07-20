# HEGEMON — Direction Update & Review Response
*From the product owner (Marco) after external review. This supersedes any conflicting
guidance in earlier docs. Read fully before acting; the Decisions section is final,
the Actions section is the work queue.*

---

## 1. DECISIONS (final — update all docs/code to match)

### 1.1 Positioning
HEGEMON is a **commercial game with authentic history as its differentiator** — not an
education-first product. History is the flavor, the depth, and the marketing hook;
monetization is a first-class design goal. Update any doc language that frames the
game as "education-first." The in-game Codex stays and grows (it is content value and
brand identity), but it serves the game, not the other way around.

### 1.2 Monetization model (confirmed)
- **Rarity stays.** Common / rare / epic / legendary card tiers, packs, and the thrill
  of the pull are core to the meta-game. Do not flatten rarity.
- **Founding rule (Marco's formulation):** *pay to get there faster; never pay for
  what time cannot earn.* Everything — every civ, Legend, Edict — must be earnable
  through play in reasonable time. Money compresses time. That is the whole rule.
- **Legend perks in ranked are permitted.** The earlier reviewer suggestion to
  normalize/disable equip perks in ranked is REJECTED. Perks stay as designed.
- **Odds disclosure is mandatory** (Apple 3.1.1 / Google Play policy for purchasable
  randomized items — coins bought with money that buy packs are covered). Weights are
  already published; ensure they render **in the pack-purchase UI itself**, per pack,
  before purchase. Ship this if not already in the store screen.
- **Deterministic acquisition path:** verify shards can craft **every** card type,
  including civ cards and legendaries (rarity-scaled shard prices are fine and should
  be steep for legendaries). Pity timer stays. This is both the strongest regulatory
  posture (Belgium et al.) and the strongest player-goodwill answer while keeping
  rarity fully intact.
- **Launch-country config:** add a config flag to disable pack *purchase* (earn-only
  packs still fine) per storefront country, so the Belgium question is an ops
  decision, not a code change.

### 1.3 Scope
The 20–40 minute quick-game pillar from the original brief is **retired**. The game
has legitimately evolved into a deeper product; docs should state the new identity
confidently rather than track drift against the old brief. (A fast-onboarding preset
remains *desirable* as a new-player funnel — see Actions §3.4 — but as a feature, not
a pillar.)

---

## 2. SOFT GUARDRAILS (implement as data, not restrictions)

- **Ranked telemetry:** log per-match: equipped Legends/Edicts, ranked flag, outcome.
  Produce a recurring report of win-rate delta between equipped and unequipped players
  at similar rating. The model is healthy while the delta stays small; if it drifts,
  we tune perk numbers — the data protects the monetization model from itself.
- **Earn-rate documentation:** compute and record the expected hours-of-play to earn
  each pack tier and to craft a legendary via shards. "Earnable in reasonable time"
  should be a number we know, not a hope.

---

## 3. ACTIONS (the accepted review findings — work queue)

### 3.1 Engine hardening
1. **Lint the determinism invariant:** ESLint `no-restricted-syntax` (or equivalent)
   banning `Math.random`, `Date.now`, and unsorted object-key iteration used for
   decisions inside `src/engine/**`. Turn the load-bearing convention into a build
   failure.
2. **Golden replay-hash test:** N seeded full games (mixed civs/maps), hash state
   every turn, commit the hashes. Any nondeterminism or unintended rules change fails
   CI. Review flagged `scheduleRaid` target selection, `beltTileNear`, and
   `figureContext` as the first places to audit for object-key-order dependence.
3. **Lockstep fuzz:** extend `mp-lockstep.test.ts` — random seeds, two simulated
   clients with different `humanPlayerId`, assert byte-identical state every turn for
   the full match.
4. **Pending-decision revalidation:** every `applyResolve*` re-validates its context
   at resolution time and no-ops gracefully (raid on captured/vanished city, tribute
   no longer affordable, figure whose condition flipped). One test per edge case.
5. **Unify the decision queue:** fold `pendingRaid` into the same
   one-card-at-a-time slot as `pendingEvent`/`pendingFigure` so a bad turn never
   stacks modals.

### 3.2 Codebase health
6. **Split `src/engine/index.ts`** into per-domain reducer modules (combat, cities,
   end-turn, raiders, figures) composed by the dispatch switch. It is becoming a
   god-file.
7. **Begin migrating `game.js`** (large IIFE) to TypeScript modules incrementally —
   MP session code first, then modals, then view-build.
8. **Measure deep-clone cost** on the largest map; if material, adopt Immer
   (structural sharing preserves the pure-reducer contract).
9. **Evict the leftover Personal Assistant app** to an archive branch. The repo
   should not need a "please ignore half of this" paragraph.
10. **Scale the balance sim:** 200+ games nightly in CI with win-rate confidence
    intervals per civ; attach sim output to any balance-tuning PR. Then actually tune
    the known Britons/Gaul-strong, Athens/Egypt-weak spread.

### 3.3 Content & accuracy
11. **Imhotep fix:** he lived ~2650 BC — an anachronism as a figure you *meet*.
    Rename the Egypt figure to **"Priests of Imhotep"** (his healing cult was
    genuinely active and growing in the Late Period). Same boon, now accurate. The
    rest of the figure roster passed historical review.
12. **Restore three cut ruins** to `discovery.ts` (they were in the design pool and
    are strong content): **Frescoes of Akrotiri** (Thera — culture + unlocks a free
    fresco cosmetic, tying discovery to the cosmetics economy), **Alignments of
    Carnac** (Armorica — faith), **Pile-Dwellings of the Garda Moraine** (N. Italy,
    Polada culture — food + irrigation knowledge).
13. **Codex growth path:** extend Codex entries beyond ruins to figures met and
    Legends collected (entry unlocked on first acquisition). History content doubles
    as collection value — this is the positioning of §1.1 made concrete.

### 3.4 Player experience
14. **Fast-onboarding preset** (feature, not pillar): a small-map, reduced-system
    ruleset (districts off, diplomacy minimal, one raid max) as the new-player funnel
    into the full game. Retention tool for the monetization model — more players
    reaching the meta-game.

### 3.5 Graphics
15. **Reclaim the classical identity** on top of the procedural 3D render (which
    stays): a color-grading LUT in the existing post-FX chain (terracotta / ochre /
    Egyptian-blue palette), UI reskin as aged plaster with meander borders and a
    Trajan-adjacent display face, mosaic-styled faction banners, and fresco-style 2D
    card art for Codex/figure/pack screens. The board is modern; the frame must be
    unmistakably classical.
16. **Mobile perf gate:** profile the full GTAO + SMAA + Bloom chain on a mid-range
    Android device before any installable-app milestone; the quality toggle should
    auto-select from a first-launch device benchmark.

---

## 4. DIFFERENTIATION SLATE (new features — approved for production)

**Positioning line (for all store/marketing copy):** *"Other games make you a god.
HEGEMON makes you a Roman."* The player is a person climbing through history, not an
immortal abstraction. Every feature below cashes in that identity — and every one is
downstream of the deterministic engine + action log we already have.

**Trademark hygiene (hard rules):** never use the word "Civilization"/"Civ" in the
title, subtitle, store copy, or ads, including comparatives ("like Civ but…").
No imitation of any competitor's tech-quote narration style, leader-dialogue framing,
or distinctive UI trade dress. Game *mechanics* are not protectable — hexes, tech
trees, and turn-based empire play are free to all — so originality of expression
(names, text, art, voice) is the entire legal surface. We are already clean; stay clean.

### 4.1 The Daily Campaign  **(highest priority of the slate)**
One seed per day, one scenario — every player on Earth plays the identical map,
weather, raids, and figures; scores rank on a global + friends leaderboard.
- Engine cost ≈ zero: determinism guarantees fairness; the server verifies any
  submitted score by replaying its action log (cheat-proof by construction).
- Retention engine for the whole monetization model: a daily reason to return, daily
  pack synergy, streak rewards paid in coins.
- Ship with: seed-of-the-day service, score submit + replay-verify endpoint,
  leaderboard UI, streak counter, share button.

### 4.2 The Chronicle
At match end, generate an illustrated match history written in the voice of an
ancient historian ("In the third year, the Carthaginian fleet burned off Sicily…"),
composed from the action log. Shareable as an image/page stamped with the classical
art identity — every share is organic marketing. v1: template-based generation from
log events (wars, cities founded, ruins found, figures met, title moments); LLM polish
pass optional later.

### 4.3 Ghost Campaigns
Share a seed with a friend; they play the same world; both then view a divergence
report ("your empires split at turn 14"). Asynchronous rivalry with no scheduling —
pure replay-system dividend.

### 4.4 Counterfactual Cards
Post-match screen for key decisions: "You abandoned Sicily in year 12. In 241 BC
Carthage did the same — it cost them the war." History as scoring commentary; our
accuracy investment turned into the game's most screenshot-able feature. Author ~30
counterfactuals keyed to detectable action-log patterns; grow the library over time.

### 4.5 Period Voice
Units acknowledge orders with short recorded phrases in Latin, Attic Greek, Punic,
Gaulish (reconstructed), Middle Iranian, and Meroitic-flavored lines where attested —
a dozen lines per civ. Small cost, outsized scholarly-alive atmosphere. Requires a
one-time linguistic consultation pass for accuracy; placeholder text-to-speech is
acceptable in dev, never in release.

---

## 5. TITLE LADDERS — "Slave to Consul" (full specification)

The career ladder is the game's soul made systemic: each civ's ladder uses **only
historically attested ranks**, ends at that civ's **real supreme office** — so a Rome
player becomes Consul, a Briton becomes High King, a Parthian becomes King of Kings —
and each civ carries a **real historical validator**: a documented person who actually
made this climb (Codex anchor, cited on the capstone entry).

### 5.1 Mechanics
- **Laurels** are earned per civ: match wins, achievements, Crossroads outcomes,
  Daily Campaign placement. Rank thresholds are config data (tunable), roughly
  doubling per rank.
- Current title displays on profile, MP lobbies, Daily Campaign leaderboard, and the
  Chronicle byline ("…as recorded under Consul Marcus").
- **Every promotion unlocks a Codex entry** explaining the real office — its powers,
  its limits, who held it.
- Capstone rank unlocks a matching **cosmetic crown/emblem** (ties the ladder into the
  existing cosmetics economy).
- Where history records women in the supreme office, the capstone offers the choice
  (Kush: Qore/Kandake; Britons: High King/High Queen; Scythia: King/Queen).
- Authoring rules for future civs: 6–10 ranks; attested titles only (native-language
  names preferred, glossed in English); capstone = the civ's real supreme office; one
  named historical validator per ladder.

### 5.2 The eight playable ladders

**ROME — the cursus honorum**
Servus (slave) → Libertus (freedman) → Civis (citizen) → Eques (knight) → Quaestor →
Aedilis → Praetor → **Consul** → Censor → Princeps.
*Codex anchors:* freedmen rising to wealth and influence was real and resented
(Trimalchio satirizes it); minimum ages of the offices (quaestor 30, consul 42 under
Sulla's law) become promotion flavor text.

**ATHENS — the Solonian climb**
Thes (laborer class) → Zeugites (yeoman-hoplite class) → Hoplite → Choregos (festival
sponsor) → Trierarch (funds and commands a trireme) → Strategos (one of the ten
elected generals) → **Archon Eponymos** → Hegemon of the League.
*Codex anchors:* Solon's four property classes; the liturgy system — Athens taxed its
rich by making them fund plays and warships; Themistocles, of modest birth, rose to
Strategos and saved Greece at Salamis.

**EGYPT — the scribal path**
Fellah (peasant) → Scribe → Wab-Priest → Overseer of Works → Nomarch (province
governor) → High Priest of Amun → **Vizier (Tjaty)** → Regent of the Two Lands.
*Codex anchors:* the scribal school was antiquity's great social ladder ("Be a scribe,
that your limbs stay smooth" — real school text); Horemheb rose from commoner-officer
to Pharaoh, proof the summit was truly reachable.

**CARTHAGE — the merchant's ascent**
Deckhand → Merchant → Shipmaster → Rab (magistrate) → Judge of the Hundred and Four →
Elder of the Adirim (council) → **Shophet**.
*Codex anchors:* two Shophets elected annually — Carthage ran a republic that Aristotle
himself analyzed and praised in the *Politics*; wealth, not birth, was the explicit
qualification for office.

**GAUL — the warband's honor**
Client Farmer → Warrior → Ambactus (sworn companion) → Eques (noble horseman, per
Caesar's account) → Chieftain → **Vergobret**.
*Codex anchors:* "ambactus" is one of the few Gaulish words to survive into Latin; the
Vergobret was the Aedui's annually elected chief magistrate, forbidden to leave the
territory during office — an elected, term-limited Gallic executive most players will
never have heard of.

**BRITONS — the chariot path**
Herdsman → Charioteer → Clan Champion → Noble → Chieftain → **High King / High Queen
(Rix)**.
*Codex anchors:* Cassivellaunus, elected supreme war leader against Caesar's invasion;
Boudica and Cartimandua, historical proof of women in supreme power in Britain.

**PARTHIA — the rider's road**
Herdsman → Horse Archer → Azat (free knight) → Marzban (march-warden) → Satrap →
Spahbed (general of the army) → **King of Kings (Šāhanšāh)**.
*Codex anchors:* the Azat free-nobility class is attested in Iranian sources; Surena,
the Spahbed who destroyed Crassus at Carrhae at ~30 years old — and was executed for
being too successful, a lesson in Parthian court politics.

**KUSH — the iron and the bow**
Farmer of the Cataracts → Bowman of Ta-Seti → Master Smelter of Meroë → Priest of
Apedemak → Viceroy of the South → **Qore (King) / Kandake (Queen)**.
*Codex anchors:* Ta-Seti, "Land of the Bow," is what Egypt itself called Nubia;
Kandake Amanirenas fought Augustus's Rome to a negotiated peace (~24–21 BC) and is
said to have taken a bronze head of the emperor home as a doorstep trophy — a
one-eyed warrior queen who beat Rome at the table.

### 5.3 Flagship locked-civ ladders (author on unlock; pattern for the rest)
- **Sparta:** Mothax (agoge outsider) → Eiren (youth leader) → Homoios ("Equal") →
  Lochagos → Ephor → **King of Sparta**. *Validator:* Lysander — born a poor mothax,
  died the most powerful Greek of his generation.
- **Macedon:** Shepherd → Pezhetairos (Foot Companion) → Hypaspist → Hetairos
  (Companion) → Somatophylax (one of seven royal bodyguards) → **Basileus**.
- **Achaemenid Persia:** Subject of the King → Soldier of the Spada → Immortal →
  Hazarapatish (Commander of a Thousand) → Satrap → **King of Kings**.
- **Han China:** Peasant → Recommended Scholar (xiaolian, "filial and incorrupt") →
  Clerk → Magistrate → Governor → Chancellor → **Son of Heaven**. *Validator:* Liu
  Bang — a peasant patrol officer who founded the Han dynasty; history's strongest
  proof of the ladder.
- **Scythia:** Herder → Rider → Warrior → Chieftain → Royal Scythian → **King /
  Queen**. *Validator:* Tomyris, the queen who defeated and killed Cyrus the Great.
- **Maurya India:** Villager → Soldier → Officer → Amatya (minister) → Mahamatra
  (high officer, Ashoka's own term) → **Chakravartin**. *Validator:* Chandragupta,
  who rose from obscurity to found the empire.
- Remaining locked civs: apply the §5.1 authoring rules at content time.

---

## 6. GRAPHICS PRODUCTION PLAN

Graphics are the acquisition lever; budget is near-zero. Strategy: maximize
code-driven beauty (Claude Code), fill 2D art via AI generation with one locked
style, solve 3D per the pipeline below. **No purchased asset packs** — generic packs
can't differentiate eight-plus civs; our look must be ours alone. (App icon: owner
produces it directly with AI tools; excluded from this plan.)

### 6.1 Tier 1 — code-driven beauty (Claude Code, cost $0) — build first
Everything here is shader/CSS/procedural work on the existing render:
1. **Stylization shader pass** over the board: toon-ramp or painterly-edge treatment
   + the classical color-grading LUT (terracotta / ochre / Egyptian blue / verdigris)
   in the existing post-FX chain. Goal: screenshots read as *a style*, not as
   default-3D.
2. **UI as the polish flagship:** aged-plaster panels, meander (Greek key) borders,
   gilded interactive elements, Trajan-adjacent display face, smooth animated
   transitions. Players judge quality by the interface first; this is pure
   HTML/CSS/JS and must look premium.
3. **Ambient life, all procedural:** hearth-smoke over cities, circling birds,
   wind-swayed instanced grass/trees, animated faction banners on city centers,
   harbor water traffic, weather made visible (driving rain streaks, rolling fog
   banks, storm chop on the sea).
4. **Per-civ procedural architecture kits** (the differentiation core): parameterized
   building generators per civ, assembled from primitives, using the existing
   material-progression system —
   Rome/Athens: colonnades, pediments, red-tile roofs (Doric vs. Corinthian details
   distinguish them); Egypt: pylons, obelisks, flat-roof mudbrick; Carthage: dense
   courtyard houses + the circular Cothon harbor; Gaul: timber oppida with palisades;
   Britons: thatched roundhouses in ring-forts; Parthia: iwan arches, squinch domes,
   mudbrick; Kush: Meroitic pylons and the steep-sided pyramid silhouette.
   Real geometry → rotates perfectly; generated → owned by no one but us.

### 6.2 Tier 2 — AI-generated 2D art (~$10–30/month during production)
- **Primary tool: Midjourney**, using `--sref` (style reference) locked to one
  approved fresco reference set, so every image lands in the same visual family.
  Standing style prompt: *"ancient Roman fresco style, Pompeii palette, aged plaster
  texture, muted terracotta and ochre, no photorealism."*
- **Alternative/budget: Leonardo.ai** (game-asset-tuned models, style consistency
  features). **Later optimization:** local Flux + a custom LoRA trained on our ~20
  best approved outputs for zero-marginal-cost generation at full style lock.
- **Coverage:** 26 figure portraits, 68 Legend cards, civ cards, Edict/Event card
  art, Codex illustrations, pack/store art, loading screens, all §7 cosmetics.
- **Process:** keep generation records + license tier verification; every approved
  image enters a style bible folder that future sessions reference.

### 6.3 The 3D problem (rotating board — flat images won't do)
- **Buildings/props: procedural** (§6.1.4). Closed.
- **Units — primary pipeline: AI 3D generation.** Tier 2 fresco concept image →
  **Meshy** or **Tripo3D** (image-to-3D, stylized low-poly glTF; feeding our own 2D
  art makes the 3D inherit our style) → auto-rig (Meshy built-in, or **Mixamo** —
  a free rigging/animation service for our own models, not an asset pack) →
  idle/walk/attack clips → glTF drop-in. Budget ~$20–40/month during the unit
  production push only.
- **Fallback (pure Claude Code, $0): multi-angle sprite sheets** — render each unit
  from 8 bearings, swap by camera azimuth (the classic RTS technique; fully
  acceptable at strategy zoom). Ship this if the AI-3D pipeline output disappoints.
- Acceptance bar for any unit asset: silhouette readable at gameplay zoom,
  civ-identifiable at a glance, ≤ a few-thousand triangles, one draw-call-friendly
  material.

---

## 7. COSMETICS EXPANSION — fill the deck

Cosmetics are the volume layer of the card economy: **many easy pulls, a few epics,
a couple of near-mythic chases.** All fresco-styled (Tier 2 pipeline), all data-driven
(catalog as config), all profile/vanity — zero power, consistent with §1.2. Target:
**~150 cosmetic cards** across five slots shown on the profile and MP lobby card:
crown, portrait, banner, emblem, epithet.

### 7.1 Crowns (~25) — anchored by Rome's REAL military crown hierarchy
Rome ran an actual tiered cosmetic-honor system; we adopt it verbatim as rarity:
- **Corona Graminea (Grass Crown)** — *the* ultra-legendary: awarded in all of Roman
  history perhaps eight times, only by acclamation of the army a commander had saved.
  Hardest pull in the game; its Codex entry alone will get screenshotted.
- **Corona Civica** (oak leaves, for saving a citizen's life) — legendary.
- **Corona Muralis** (gold, first over the enemy wall), **Corona Navalis** (gold,
  first to board an enemy ship), **Corona Vallaris** (first into the enemy camp) —
  epics.
- Laurel Wreath, Gold Diadem, Iron Crown — rares; simple wreaths/fillets — commons.
- **Civ crowns:** Egyptian Pschent (the Double Crown), Kushite skullcap with double
  uraeus, Hellenistic diadem band, Phrygian cap, Parthian tiara, Celtic war-helm with
  crest, Carthaginian priestly headdress — mid-to-high rarity, civ-flavored.

### 7.2 Profile portraits (~50)
Fresco-bust portraits: per civ × gender × station (a farmer, an artisan, a soldier, a
priest/priestess, a noble, a ruler — commons through epics), plus a small legendary
set of allegorical portraits (Victory, Fortuna, the Muse of History). Ladder tie-in:
reaching a civ's capstone title (§5) unlocks that civ's ruler portrait frame variant.

### 7.3 Banners / nameplates (~35)
The strip under the player's name: meander key, wave-crest, mosaic tessera, vine
scroll (commons); legion vexillum, hoplite shield-band, Nile lotus frieze, La Tène
swirl, Meroitic frieze (rares); animated variants — rippling vexillum, flowing wave
(epics).

### 7.4 Emblems (~25)
Sigil next to the name: the Eagle (aquila), the Wolf, the Owl of Athena, the Trireme,
the War Elephant, the Sun of Egypt, the Ankh, the Triskelion, the Lion of Apedemak,
the Parthian Bow, the Punic Sign of Tanit, the Faravahar, the Han Dragon, the Mauryan
Lion Capital, the Scythian Stag — commons through epics by visual elaborateness.

### 7.5 Epithets (~20) — historical honorifics appended to the display name
"the Bold", "the Wise" (commons) → real classical epithets as higher tiers:
*Soter* (Savior), *Euergetes* (Benefactor), *Philadelphus*, *Epiphanes*, *Magnus*,
*Pius*, *Felix*, *Invictus*, *Africanus* (epic — earned-only via a Carthage-war
achievement, mirroring Scipio), *Parthicus*, *Britannicus* (conquest-achievement
earned-only). A couple of epithets are **achievement-locked, never pullable** — chase
by deed, exactly as Rome awarded them.

### 7.6 Economy notes
- Distribution target within cosmetics: ~55% common / 30% rare / 12% epic / 3%
  legendary; Grass Crown sits at a special mythic weight below standard legendary.
- Duplicates → shards (existing system); every cosmetic craftable; a couple of
  epithets and the capstone portrait frames are deed-locked (earnable only, not
  craftable) — prestige needs a non-purchasable summit.
- Catalog is pure data (`cosmetics-data.js` pattern): art lands via the §6.2 pipeline
  on a rolling basis; ship cards in waves to pace the pull economy.

---

## 8. Priority order (updated)
1. §1.2 monetization verifications (odds-in-UI, shards-craft-everything, country flag)
2. §3.1 engine hardening (items 1–5)
3. **§6.1 Tier 1 graphics pass** — stylization shader + LUT, UI flagship, ambient
   life, then per-civ architecture kits (this multiplies the value of every
   screenshot every later feature produces)
4. **§4.1 Daily Campaign**
5. **§5 Title ladders** + **§7 cosmetics catalog schema** (ship the data structure;
   art fills in waves via §6.2)
6. §3.3 item 11 (Imhotep fix) and §2 telemetry
7. §6.3 unit-asset pipeline experiment (Meshy/Tripo spike → go/no-go vs. sprite
   fallback)
8. §4.2 Chronicle, then §4.3–4.5, then remaining §3 items.

*— End of direction update.*
