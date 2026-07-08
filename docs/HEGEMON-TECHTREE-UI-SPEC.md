# HEGEMON — Tech Tree UI Implementation Spec

> Builds the approved layout (era columns / trunk rows / unique-branch band /
> four states) in the existing DOM client. No framework — plain HTML/CSS/JS in
> game.js + game.css, connectors in one inline SVG layer.

## 1. Structure

```html
<div id="techtree" class="tt">
  <svg class="tt-links"></svg>          <!-- absolutely positioned connector layer -->
  <div class="tt-era" data-age="1"><h3>Age I · Villages</h3></div>
  <div class="tt-era" data-age="2"><h3>Age II · Kingdoms</h3></div>
  <div class="tt-era" data-age="3"><h3>Age III · Empires</h3></div>
  <div class="tt-band">                  <!-- unique branch -->
    <h3 class="tt-band-title">Via Romana</h3>
    <!-- branch nodes, also laid out by age columns -->
  </div>
</div>
```

- `#techtree` is a horizontal scroll container (`overflow-x:auto`), CSS grid:
  3 equal era columns × N trunk rows, band as a full-width grid row at bottom.
- Each tech = `.tt-node` button: `<button class="tt-node" data-tech="writing"
  data-state="researched">` with icon, name, one-line effect. Reuse existing
  per-tech icon + EFFECT description strings.
- Node layout: assign each trunk tech a (row, age) slot at data level — add a
  `row` field to TECHS or a small layout map in game.js; the grid does the rest.
  Branch nodes only need `age`; they flow left-to-right inside the band.

## 2. Skin (match the dark editorial 3D-era aesthetic, not the wireframe)

```css
.tt { background:#0d1420; padding:24px; gap:14px 28px; }
.tt-era h3 { font:600 13px/1 var(--serif, Georgia); letter-spacing:.14em;
  text-transform:uppercase; color:#c9a84c; border-bottom:1px solid #c9a84c33;
  padding-bottom:8px; }
.tt-node { background:#16202f; border:1px solid #2a3648; border-radius:8px;
  padding:10px 12px; text-align:left; color:#e8e2d4; cursor:pointer;
  transition:border-color .15s, transform .15s; }
.tt-node:hover { border-color:#c9a84c; transform:translateY(-1px); }
.tt-node .fx { font-size:11.5px; color:#9aa4b2; }
.tt-node[data-state=researched] { border-color:#3f7a5f; background:#14231d; }
.tt-node[data-state=available]  { border-color:#c9a84c88; }
.tt-node[data-state=locked]     { opacity:.45; filter:grayscale(.4); }
.tt-band { border:1px dashed var(--civ, #c0392b); border-radius:12px;
  background:color-mix(in srgb, var(--civ) 8%, transparent); padding:16px; }
.tt-band-title { color:var(--civ); font-family:var(--serif, Georgia); }
.tt-node[data-unique] { border-color:var(--civ); }
.tt-node[data-capstone] { box-shadow:0 0 0 1px var(--civ) inset; }
```
Set `--civ` on `.tt-band` from the player's civ color. Costs render in the
node corner as a small pill (existing cost text).

## 3. Connectors (the part that sells it)

One `<svg class="tt-links">` absolutely covering the scroll content. After
layout (and on resize/scroll-container size change):

```js
function drawLinks(){
  const svg = qs('.tt-links'); svg.innerHTML='';
  const cRect = qs('#techtree').getBoundingClientRect();
  for (const t of allTechs()) for (const p of t.prereq||[]) {
    const a = nodeEl(p).getBoundingClientRect(), b = nodeEl(t.id).getBoundingClientRect();
    const x1=a.right-cRect.x+scrollX0, y1=a.top+a.height/2-cRect.y;
    const x2=b.left -cRect.x+scrollX0, y2=b.top+b.height/2-cRect.y;
    const mid=(x1+x2)/2;
    path(svg, `M${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`,
         cls(t,p)); // curved bezier: reads far better than elbows here
  }
}
```
Link classes: `.done` (both researched, #3f7a5f), `.next` (into an available
tech, gold #c9a84c, 1.5px), default #2a3648 1px. Trunk→branch links use the
civ color at 60% opacity.

## 4. Interactions

- **Hover a node** → add `.lit` to its full prereq chain (walk prereqs
  recursively) and to the connecting paths; everything else dims to .5. This is
  the "how do I get there" feature and costs ~15 lines.
- **Click available** → existing research-select action, unchanged.
- **Click locked** → tooltip lists missing prereqs (names, gold if next).
- **Rival branches**: simply not rendered (extends current hidden-uniques rule).
- **Capstone**: crown icon + `data-capstone`; the band title bar shows a small
  progress "7 / 11" counter for branch completion.
- Mobile/PWA: the same grid, nodes min-width 148px, horizontal pan; pinch-zoom
  optional later.

## 5. Verify

Playwright smoke: open research panel as admin on a fresh game and after
`reveal map` + free-tech debug; assert node counts per age, one capstone
visible, zero rival-branch nodes, connector `<path>` count ==
sum(prereq edges among visible techs). Screenshot t=turn1 and after 5 techs.
