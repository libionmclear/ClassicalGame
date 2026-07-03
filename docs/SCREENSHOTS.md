# HEGEMON — mechanics, first rendering

Screenshots captured from the running game (headless Edge) exercising the
systems end to end. Live build: https://classicalgame.vercel.app

## 1. Opening state — `screenshots/01-start.png`
Blue theme, a **3D-tilted** hex board of **cloud/mist fog**, with your start
revealed bottom-left. The HUD shows **population, science, production, gold,
techs** and a **per-region weather** strip (the game's only luck). The capital
is **auto-selected**, so the **Build** menu is live: Warrior/Archer/Settler are
buildable and Spearman/Swordsman/Horseman/Siege are **🔒 locked behind their
techs**.

## 2. Mid-game (turn 13) — `screenshots/02-midgame.png`
After a few turns: **science 0→20**, **2 techs researched**, **population 2→4**,
and the rivals (Carthage, Greece) have each **expanded to 2 cities**. Because
**Bronze Working** is now known, **Spearman is unlocked** in the build menu —
research really does open up the army. More terrain is revealed as units scout.

## 3. Close-up — `screenshots/03-closeup.png`
Units render as **groups of little people** with weapon badges and green HP
bars; the **temple city** shows its growth bar; a **river** flows as a soft
water band (not a stick); **desert** tiles carry cacti; **coast/sea** are blue;
and a **storm cloud** sits over one region.

### Systems shown across these
Movement + fog reveal · fog of war (clouds) · founding/holding cities · city
growth (food → population) · the three-resource economy + **science climb** ·
the **tech tree** with mutually-exclusive forks · **tech-gated unit roster** ·
per-region **weather** · **combat** (AI attacks in the log; struck tiles flash)
· 2–6 rival civs on rectangular Small/Medium/Large/XL maps.
