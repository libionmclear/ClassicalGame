# Drop-in 3D models (glTF)

Put `.glb` files here and the 3D board uses them automatically, replacing the
procedural low-poly placeholder. Anything missing just stays procedural — so you
can add models one at a time.

The loader **auto-normalizes** each model (fits it to the right height, feet on
the ground) whatever scale/orientation it was exported at, and plays a unit's
**first animation clip** if it has one (e.g. an idle/march from Mixamo).

## Where files go

**Units** — one soldier per file; the game clones it into a squad (the squad size
still reflects the unit's strength):

    assets/models/units/<form>.glb

where `<form>` is one of:
`infantry`, `spear`, `ranged`, `mounted`, `elephant`, `siege`, `naval`, `civilian`.

**Cities** — a whole town per file, one per civ:

    assets/models/cities/<civ>.glb

where `<civ>` is: `rome`, `greece`, `carthage`, `egypt`, `gaul`, `parthia`.

## Pipeline (see docs/ASSET-LIST.md)
1. Generate/adjust in **Meshy** (or Tripo), export **.glb**.
2. Soldiers: rig + animate on **Mixamo**, export **.glb**.
3. Drop the file at the path above → it appears on the board.

Then run `npm run build:web` (or redeploy) so the file is copied into `public/`.
