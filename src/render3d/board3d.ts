// Three.js renderer for the hex board — a real 3D scene with terrain elevation,
// a sun that casts shadows, a tilt/zoom/orbit camera, fog of war, territory
// borders, tile highlights and billboarded unit/city sprites. Driven by game.js
// through a small view object, so all game logic stays in the DOM app.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { createInitialGameState } from "../engine/index";
import { generateMap } from "../engine/mapgen";
import { loadScenario } from "../engine/scenarios";
import type { GameState } from "../engine/types";

const TERRAIN_COLOR: Record<string, number> = {
  plains: 0x7c8a4f,
  valley: 0x8aa354,
  forest: 0x33553a,
  hills: 0x86744f,
  mountains: 0x746a5b,
  desert: 0xc6a86a,
  coast: 0x3f7f9c,
  sea: 0x2f5177
};
const TERRAIN_ELEV: Record<string, number> = {
  sea: -0.18, coast: -0.05, plains: 0.08, valley: 0.1, forest: 0.16, hills: 0.34, mountains: 0.85, desert: 0.08
};
const FLOOR = -0.6;
const SIZE = 1;

function axialToWorld(q: number, r: number): { x: number; z: number } {
  return { x: SIZE * Math.sqrt(3) * (q + r / 2), z: SIZE * 1.5 * r };
}
const topOf = (t: string): number => TERRAIN_ELEV[t] ?? 0.08;

// A tile descriptor from game.js. v: 0 hidden, 1 discovered (dim), 2 visible.
// h: 0 none, 1 reachable, 2 attackable, 3 selected, 4 tile-selected, 5 path, 6 flash.
export interface TileView { q: number; r: number; t: string; v: number; o: string | null; h: number; road?: boolean; imp?: string; res?: string | null; }
export interface SpriteView { civ: string; kind: "unit" | "city"; name: string; q: number; r: number; badge?: string; color?: string; t?: string; form?: string; pop?: number; hpFrac?: number; garrison?: number; gForm?: string | null; gColor?: string; }
export interface BorderView { q: number; r: number; nq: number; nr: number; color: string; }
// A segment between two tiles: rivers run along the shared edge, roads along the
// centre line (from tile q,r to neighbour nq,nr).
export interface EdgeView { q: number; r: number; nq: number; nr: number; }
export interface BoardView {
  tiles: TileView[];
  sprites: SpriteView[];
  borders: BorderView[];
  civColors: Record<string, string>;
  rivers?: EdgeView[];
  roads?: EdgeView[];
  focus?: { q: number; r: number };
}

export interface BoardController {
  render(view: BoardView): void;
  onPick(fn: (key: string | null) => void): void;
  onHover(fn: (key: string | null) => void): void;
  resize(): void;
  dispose(): void;
}

const GOLD = new THREE.Color(0xf2cc69);
const GREEN = new THREE.Color(0x7ed957);
const SELGREEN = new THREE.Color(0x7cd682);
const RED = new THREE.Color(0xe0533d);
const PATH = new THREE.Color(0x7dd3fc);
const WHITE = new THREE.Color(0xffffff);
const HIDDEN = new THREE.Color(0x0d1420);

// A coloured banner marker for civs that have no sprite art yet.
const markerTextures = new Map<string, THREE.Texture>();
function markerTexture(color: string, kind: "unit" | "city"): THREE.Texture {
  const cacheKey = kind + color;
  let tex = markerTextures.get(cacheKey);
  if (!tex) {
    const cv = document.createElement("canvas");
    cv.width = 64;
    cv.height = 64;
    const ctx = cv.getContext("2d")!;
    ctx.fillStyle = color;
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.lineWidth = 4;
    if (kind === "city") {
      ctx.beginPath();
      ctx.moveTo(32, 8); ctx.lineTo(58, 26); ctx.lineTo(48, 58); ctx.lineTo(16, 58); ctx.lineTo(6, 26);
      ctx.closePath();
    } else {
      ctx.beginPath();
      ctx.arc(32, 34, 22, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.stroke();
    tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    markerTextures.set(cacheKey, tex);
  }
  return tex;
}

const glyphTextures = new Map<string, THREE.Texture>();
function glyphTexture(glyph: string): THREE.Texture {
  let tex = glyphTextures.get(glyph);
  if (!tex) {
    const cv = document.createElement("canvas");
    cv.width = 64;
    cv.height = 64;
    const ctx = cv.getContext("2d")!;
    ctx.fillStyle = "rgba(8,12,20,0.86)";
    ctx.beginPath();
    // rounded chip
    const r = 14;
    ctx.moveTo(6 + r, 8);
    ctx.arcTo(58, 8, 58, 56, r);
    ctx.arcTo(58, 56, 6, 56, r);
    ctx.arcTo(6, 56, 6, 8, r);
    ctx.arcTo(6, 8, 58, 8, r);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = "34px system-ui, 'Segoe UI Emoji', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(glyph, 32, 34);
    tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    glyphTextures.set(glyph, tex);
  }
  return tex;
}

// A soft round contact shadow — laid flat on the tile under a sprite so the
// figure reads as standing ON the ground instead of floating above it.
let shadowTex: THREE.Texture | null = null;
function shadowTexture(): THREE.Texture {
  if (shadowTex) return shadowTex;
  const cv = document.createElement("canvas");
  cv.width = 64;
  cv.height = 64;
  const ctx = cv.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  g.addColorStop(0, "rgba(0,0,0,0.5)");
  g.addColorStop(0.55, "rgba(0,0,0,0.26)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  shadowTex = new THREE.CanvasTexture(cv);
  shadowTex.colorSpace = THREE.SRGBColorSpace;
  return shadowTex;
}
const shadowGeo = new THREE.PlaneGeometry(1, 1);

// ---- Procedural low-poly models (placeholders until real glTF art arrives) ----
// Shared geometries (created once) — meshes are cheap, geometries/materials reused.
const GEO = {
  torso: new THREE.CylinderGeometry(0.076, 0.1, 0.22, 6),
  legThin: new THREE.CylinderGeometry(0.036, 0.03, 0.18, 5),
  arm: new THREE.CylinderGeometry(0.026, 0.022, 0.22, 5),
  helmet: new THREE.SphereGeometry(0.082, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.62),
  crest: new THREE.BoxGeometry(0.02, 0.075, 0.12),
  head: new THREE.IcosahedronGeometry(0.09, 0),
  shield: new THREE.BoxGeometry(0.04, 0.22, 0.18),
  pole: new THREE.CylinderGeometry(0.016, 0.016, 0.72, 5),
  bow: new THREE.TorusGeometry(0.13, 0.016, 4, 8, Math.PI),
  horse: new THREE.BoxGeometry(0.48, 0.18, 0.2),
  leg: new THREE.CylinderGeometry(0.03, 0.03, 0.2, 4),
  hull: new THREE.CylinderGeometry(0.12, 0.22, 0.68, 6),
  mast: new THREE.CylinderGeometry(0.015, 0.015, 0.4, 4),
  sail: new THREE.BoxGeometry(0.02, 0.3, 0.3),
  building: new THREE.BoxGeometry(0.28, 0.4, 0.28),
  roof: new THREE.ConeGeometry(0.24, 0.22, 4),
  bigBody: new THREE.BoxGeometry(0.5, 0.34, 0.34),
  tusk: new THREE.ConeGeometry(0.028, 0.16, 4),
  trunk: new THREE.CylinderGeometry(0.04, 0.02, 0.24, 4),
  siegeBase: new THREE.BoxGeometry(0.36, 0.14, 0.28),
  treeCone: new THREE.ConeGeometry(0.19, 0.44, 6),
  treeTrunk: new THREE.CylinderGeometry(0.045, 0.055, 0.16, 4),
  rock: new THREE.IcosahedronGeometry(0.15, 0),
  // City architecture
  dome: new THREE.SphereGeometry(0.2, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2),
  column: new THREE.CylinderGeometry(0.028, 0.028, 0.34, 6),
  roundWall: new THREE.CylinderGeometry(0.16, 0.18, 0.3, 7),
  thatch: new THREE.ConeGeometry(0.22, 0.32, 7),
  wallSeg: new THREE.BoxGeometry(0.42, 0.2, 0.08),
  slab: new THREE.BoxGeometry(0.34, 0.05, 0.34),
  pyramid: new THREE.ConeGeometry(0.34, 0.5, 4),
  arch: new THREE.TorusGeometry(0.11, 0.03, 5, 10, Math.PI), // aqueduct arch (semicircle)
  beam: new THREE.BoxGeometry(1, 0.06, 0.14)
};
const SKIN = 0xe0b088, WOOD = 0x6b4a2b, DARKWOOD = 0x4a331f, STEEL = 0x9aa3ad, STONE = 0xcdbb91, GREY = 0x8a8a86, IVORY = 0xeee6d0;
const matCache = new Map<string, THREE.MeshStandardMaterial>();
function mat(color: string | number): THREE.MeshStandardMaterial {
  const key = String(color);
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color: new THREE.Color(color as never), roughness: 0.85, metalness: 0.04, flatShading: true });
    matCache.set(key, m);
  }
  return m;
}
function shade(color: string, amt: number): number {
  const c = new THREE.Color(color);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l + amt)));
  return c.getHex();
}
function meshOf(geo: THREE.BufferGeometry, color: number, cast = true): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat(color));
  m.castShadow = cast;
  return m;
}
// Per-civ helmet crest colour + metal, so soldiers read differently by people.
const CREST: Record<string, number> = {
  rome: 0xb0392b, greece: 0xdfe6ee, egypt: 0x2f6ea5, carthage: 0x9b6bd0, gaul: 0x7fa23a, parthia: 0xd98a3a
};
function addHelmet(g: THREE.Group, y: number, civ?: string): void {
  const c = civ || "rome";
  const helmCol = c === "gaul" ? 0xc0894a : c === "egypt" ? 0xcaa85a : STEEL; // bronze Gaul, gilt Egypt, else steel
  const helm = meshOf(GEO.helmet, helmCol); helm.position.set(0, y, 0); g.add(helm);
  const crest = meshOf(GEO.crest, CREST[c] ?? 0xb0392b, false); crest.position.set(0, y + 0.05, 0);
  if (c === "rome") crest.rotation.y = Math.PI / 2; // transverse Roman crest
  g.add(crest);
}
function buildFigure(form: string, color: string, civ?: string): THREE.Group {
  const g = new THREE.Group();
  const armor = shade(color, 0);
  const legCol = shade(color, -0.3);
  // A little person: two legs, a torso, two arms, a head — helmeted for soldiers.
  const figure = (lift = 0, helmeted = true) => {
    for (const lx of [0.05, -0.05]) { const leg = meshOf(GEO.legThin, legCol); leg.position.set(lx, 0.09 + lift, 0); g.add(leg); }
    const t = meshOf(GEO.torso, armor); t.position.set(0, 0.3 + lift, 0); g.add(t);
    for (const ax of [0.11, -0.11]) { const a = meshOf(GEO.arm, armor); a.position.set(ax, 0.3 + lift, 0); g.add(a); }
    const h = meshOf(GEO.head, SKIN); h.position.set(0, 0.47 + lift, 0); g.add(h);
    if (helmeted) addHelmet(g, 0.5 + lift, civ);
  };
  if (form === "spear") {
    figure();
    const spear = meshOf(GEO.pole, WOOD); spear.position.set(0.14, 0.34, 0.02); g.add(spear);
    const sh = meshOf(GEO.shield, shade(color, -0.15)); sh.position.set(-0.13, 0.26, 0.03); g.add(sh);
  } else if (form === "ranged") {
    figure();
    const bow = meshOf(GEO.bow, WOOD); bow.position.set(0.14, 0.3, 0); bow.rotation.z = Math.PI / 2; g.add(bow);
  } else if (form === "mounted") {
    const horse = meshOf(GEO.horse, WOOD); horse.position.set(0, 0.24, 0); g.add(horse);
    for (const [lx, lz] of [[0.17, 0.07], [0.17, -0.07], [-0.17, 0.07], [-0.17, -0.07]]) {
      const leg = meshOf(GEO.leg, DARKWOOD, false); leg.position.set(lx, 0.11, lz); g.add(leg);
    }
    const neck = meshOf(GEO.head, WOOD); neck.position.set(0.24, 0.36, 0); g.add(neck);
    figure(0.26);
  } else if (form === "elephant") {
    const body = meshOf(GEO.bigBody, GREY); body.position.set(0, 0.3, 0); g.add(body);
    for (const [lx, lz] of [[0.2, 0.11], [0.2, -0.11], [-0.2, 0.11], [-0.2, -0.11]]) {
      const leg = meshOf(GEO.leg, GREY); leg.position.set(lx, 0.11, lz); g.add(leg);
    }
    const head = meshOf(GEO.head, GREY); head.scale.setScalar(1.5); head.position.set(0.3, 0.36, 0); g.add(head);
    const tr = meshOf(GEO.trunk, GREY); tr.position.set(0.4, 0.24, 0); tr.rotation.z = 0.7; g.add(tr);
    for (const tz of [0.07, -0.07]) { const tk = meshOf(GEO.tusk, IVORY); tk.position.set(0.4, 0.26, tz); tk.rotation.z = 2.0; g.add(tk); }
    const howdah = meshOf(GEO.building, shade(color, 0)); howdah.scale.set(0.5, 0.4, 0.7); howdah.position.set(-0.05, 0.56, 0); g.add(howdah);
  } else if (form === "siege") {
    const b = meshOf(GEO.siegeBase, WOOD); b.position.set(0, 0.1, 0); g.add(b);
    const arm = meshOf(GEO.pole, DARKWOOD); arm.scale.set(1, 0.55, 1); arm.position.set(0, 0.3, 0); arm.rotation.z = -0.7; g.add(arm);
    for (const wz of [0.13, -0.13]) { const wl = meshOf(GEO.leg, DARKWOOD, false); wl.rotation.x = Math.PI / 2; wl.position.set(0.12, 0.07, wz); g.add(wl); const wr = meshOf(GEO.leg, DARKWOOD, false); wr.rotation.x = Math.PI / 2; wr.position.set(-0.12, 0.07, wz); g.add(wr); }
  } else if (form === "naval") {
    const hull = meshOf(GEO.hull, WOOD); hull.rotation.z = Math.PI / 2; hull.scale.set(1, 1.5, 0.62); hull.position.set(0, 0.14, 0); g.add(hull);
    const mast = meshOf(GEO.mast, DARKWOOD); mast.position.set(0, 0.36, 0); g.add(mast);
    const sail = meshOf(GEO.sail, shade(color, 0.12)); sail.position.set(0, 0.34, 0); g.add(sail);
  } else if (form === "civilian") {
    figure(0, false); // bare-headed worker
    const pack = meshOf(GEO.building, WOOD); pack.scale.set(0.5, 0.4, 0.45); pack.position.set(-0.15, 0.28, 0); g.add(pack);
  } else {
    // infantry / heavy
    figure();
    const sh = meshOf(GEO.shield, shade(color, -0.15)); sh.position.set(-0.13, 0.26, 0.04); g.add(sh);
    const sword = meshOf(GEO.pole, STEEL); sword.scale.set(1, 0.42, 1); sword.position.set(0.14, 0.3, 0); g.add(sword);
  }
  return g;
}
// Small formation offsets so N figures cluster neatly, centred on the tile.
function squadPositions(n: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  const cols = Math.max(1, Math.ceil(Math.sqrt(n)));
  const rows = Math.ceil(n / cols);
  const sp = 0.26;
  let i = 0;
  for (let row = 0; row < rows && i < n; row += 1) {
    const inRow = Math.min(cols, n - i);
    for (let c = 0; c < inRow; c += 1) {
      out.push([(c - (inRow - 1) / 2) * sp, (row - (rows - 1) / 2) * sp]);
      i += 1;
    }
  }
  return out;
}
// A unit is drawn as a SQUAD of small figures — the count shows its strength, so
// a wounded unit fields fewer and a healed one more. Big single things (elephant,
// siege, ship) stay as one, scaled a touch by health.
function buildUnit(form: string, color: string, hpFrac: number, q: number, r: number, civ?: string): THREE.Group {
  const frac = hpFrac == null ? 1 : Math.max(0.05, Math.min(1, hpFrac));
  const single = form === "siege" || form === "naval";
  const base = form === "elephant" ? 2 : form === "mounted" ? 3 : form === "civilian" ? 3 : 6;
  const g = new THREE.Group();
  if (single) {
    const fig = buildFigure(form, color, civ);
    fig.scale.setScalar(0.9 + 0.1 * frac);
    g.add(fig);
    return g;
  }
  const count = Math.max(1, Math.round(base * frac));
  const pos = squadPositions(count);
  for (let i = 0; i < count; i += 1) {
    const fig = buildFigure(form, color, civ);
    fig.scale.setScalar(0.6);
    fig.position.set(pos[i][0], 0, pos[i][1]);
    fig.rotation.y = (rnd(q, r, i) - 0.5) * 0.6; // slight facing variation
    g.add(fig);
  }
  return g;
}
// Historical architecture per civ: wall material, house-roof style, and a
// signature central landmark.
interface CivStyle { wall: number; roof: "pitch" | "flat" | "dome" | "cone"; roofColor: number; landmark: string; }
const CIV_STYLE: Record<string, CivStyle> = {
  rome: { wall: 0xd8cba0, roof: "pitch", roofColor: 0xb0392b, landmark: "forum" }, // red tiles, forum + aqueduct
  greece: { wall: 0xeae3d0, roof: "flat", roofColor: 0xdfe6ee, landmark: "columns" }, // white marble, colonnade
  egypt: { wall: 0xd9c07a, roof: "flat", roofColor: 0xcaa85a, landmark: "pyramid" }, // sandstone, pyramid
  carthage: { wall: 0xcbb98f, roof: "flat", roofColor: 0x9b6bd0, landmark: "obelisk" }, // Punic, obelisk
  gaul: { wall: 0x8a6a44, roof: "cone", roofColor: 0x6b5a34, landmark: "roundhouse" }, // timber roundhouses + thatch
  parthia: { wall: 0xcaa46a, roof: "dome", roofColor: 0xd98a3a, landmark: "iwan" } // mudbrick, domed iwan
};
function addBuilding(g: THREE.Group, s: CivStyle, x: number, z: number, w: number, h: number): void {
  if (s.roof === "cone") {
    const wall = meshOf(GEO.roundWall, s.wall); wall.scale.set(w / 0.16, h / 0.3, w / 0.16); wall.position.set(x, h * 0.5, z); g.add(wall);
    const th = meshOf(GEO.thatch, s.roofColor); th.scale.set(w / 0.2 * 1.1, h / 0.3, w / 0.2 * 1.1); th.position.set(x, h + 0.08, z); g.add(th);
    return;
  }
  const wall = meshOf(GEO.building, s.wall); wall.scale.set(w / 0.28, h / 0.4, w / 0.28); wall.position.set(x, h * 0.5, z); g.add(wall);
  if (s.roof === "pitch") {
    const roof = meshOf(GEO.roof, s.roofColor); roof.scale.set(w / 0.24 * 0.95, 0.7, w / 0.24 * 0.95); roof.position.set(x, h + 0.07, z); roof.rotation.y = Math.PI / 4; g.add(roof);
  } else if (s.roof === "dome") {
    const dm = meshOf(GEO.dome, s.roofColor); dm.scale.set(w / 0.2 * 0.8, h * 0.5, w / 0.2 * 0.8); dm.position.set(x, h, z); g.add(dm);
  } else {
    const slab = meshOf(GEO.slab, s.roofColor); slab.scale.set(w / 0.34, 1, w / 0.34); slab.position.set(x, h + 0.02, z); g.add(slab);
  }
}
// A Roman aqueduct arcade: a row of piers linked by arches, carrying a channel.
function addAqueduct(g: THREE.Group, s: CivStyle, cx: number, cz: number, k: number): void {
  const bays = 4;
  const bw = 0.19 * k;          // bay spacing
  const pierH = 0.34 * k;
  const startX = cx - (bays * bw) / 2;
  for (let i = 0; i <= bays; i += 1) {
    const px = startX + i * bw;
    const pier = meshOf(GEO.building, s.wall);
    pier.scale.set(0.05 * k / 0.28, pierH / 0.4, 0.13 / 0.28);
    pier.position.set(px, pierH * 0.5, cz);
    g.add(pier);
  }
  const springs = pierH * 0.62;
  for (let i = 0; i < bays; i += 1) {
    const ax = startX + (i + 0.5) * bw;
    const a = meshOf(GEO.arch, s.wall, false);
    a.scale.set(bw / (2 * 0.11), (pierH - springs) / 0.11, 1); // span the bay, reach the top
    a.position.set(ax, springs, cz);
    g.add(a);
  }
  const channel = meshOf(GEO.beam, s.wall);
  channel.scale.set(bays * bw + 0.06 * k, 1, 1);
  channel.position.set(cx, pierH + 0.03 * k, cz);
  g.add(channel);
}
function addLandmark(g: THREE.Group, s: CivStyle, tier: number): void {
  const k = 0.7 + tier * 0.12;
  const L = s.landmark;
  if (L === "forum") {
    // A forum: a low paved podium ringed by columns carrying a flat entablature
    // (which rests ON the columns), a pedimented temple at one end, and an
    // aqueduct arcade behind. Nothing overhangs its base.
    const pw = 1.02 * k, pd = 0.6 * k, ph = 0.07 * k;
    const podium = meshOf(GEO.building, s.wall); podium.scale.set(pw / 0.28, ph / 0.4, pd / 0.28); podium.position.y = ph * 0.5; g.add(podium);
    const colH = 0.28 * k;
    for (let i = 0; i < 4; i += 1) {
      const tx = (i / 3 - 0.5) * pw * 0.82;
      for (const zz of [pd * 0.42, -pd * 0.42]) {
        const col = meshOf(GEO.column, s.wall); col.scale.set(1, colH / 0.34, 1); col.position.set(tx, ph + colH * 0.5, zz); g.add(col);
      }
    }
    const entab = meshOf(GEO.beam, s.roofColor); entab.scale.set(pw * 0.9, 1, pd * 1.02 / 0.14); entab.position.y = ph + colH; g.add(entab);
    // Temple at one end (walls + pitched roof rest flush) and the aqueduct behind.
    addBuilding(g, s, pw * 0.34, 0, 0.34 * k, 0.34 * k);
    addAqueduct(g, s, -pw * 0.05, -pd * 0.85, k);
  } else if (L === "pyramid") {
    const p = meshOf(GEO.pyramid, s.wall); p.scale.setScalar(k * 0.85); p.position.y = 0.5 * k * 0.85 * 0.5; g.add(p);
  } else if (L === "columns") {
    const bh = 0.42 * k;
    const base = meshOf(GEO.building, s.wall); base.scale.set(1.5 * k, bh / 0.4, 1.2 * k); base.position.y = bh * 0.5; g.add(base);
    for (let i = 0; i < 8; i += 1) { const a = (i / 8) * Math.PI * 2; const col = meshOf(GEO.column, s.wall); col.scale.set(1, k, 1); col.position.set(Math.cos(a) * 0.19 * k, bh + 0.17 * k, Math.sin(a) * 0.15 * k); g.add(col); }
    const roof = meshOf(GEO.slab, s.roofColor); roof.scale.set(1.6 * k, 1, 1.3 * k); roof.position.y = bh + 0.34 * k; g.add(roof);
  } else if (L === "dome" || L === "iwan") {
    const hh = 0.5 * k;
    const hall = meshOf(GEO.building, s.wall); hall.scale.set(1.3 * k, hh / 0.4, 1.2 * k); hall.position.y = hh * 0.5; g.add(hall);
    // Dome rests ON the hall — its footprint matches the walls (no mushroom cap).
    const dw = (L === "iwan" ? 0.62 : 0.9) * k;
    const dm = meshOf(GEO.dome, s.roofColor); dm.scale.set(dw, (L === "iwan" ? 1.5 : 1.0) * k, dw); dm.position.y = hh; g.add(dm);
  } else if (L === "obelisk") {
    const oh = 0.72 * k;
    const ob = meshOf(GEO.pole, s.wall); ob.scale.set(2.4, oh / 0.72, 2.4); ob.position.y = oh * 0.5; g.add(ob);
    const cap = meshOf(GEO.roof, s.roofColor); cap.scale.set(0.4, 0.4, 0.4); cap.position.y = oh; g.add(cap);
  } else {
    const rh = 0.5 * k;
    const wall = meshOf(GEO.roundWall, s.wall); wall.scale.set(1.7 * k, rh / 0.3, 1.7 * k); wall.position.y = rh * 0.5; g.add(wall);
    const th = meshOf(GEO.thatch, s.roofColor); th.scale.set(1.8 * k, 1.1 * k, 1.8 * k); th.position.y = rh + 0.06; g.add(th);
  }
}
function buildCity(pop: number, civ: string): THREE.Group {
  const g = new THREE.Group();
  const s = CIV_STYLE[civ] || CIV_STYLE.rome;
  const tier = pop <= 2 ? 1 : pop <= 4 ? 2 : pop <= 6 ? 3 : 4; // settlement/town/city/metropolis

  if (tier >= 2) addLandmark(g, s, tier);

  const houses = tier === 1 ? 3 : 2 + tier * 2; // 3 / 6 / 8 / 10
  const rad = tier === 1 ? 0.26 : 0.52; // ring the houses OUTSIDE the central landmark
  for (let i = 0; i < houses; i += 1) {
    const a = (i / houses) * Math.PI * 2 + 0.35;
    const h = 0.22 + (i % 3) * 0.06 + tier * 0.02;
    const w = 0.15 + (i % 2) * 0.03;
    addBuilding(g, s, Math.cos(a) * rad, Math.sin(a) * rad, w, h);
  }

  // City walls appear once it's a proper city.
  if (tier >= 3) {
    const wr = 0.72;
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2;
      const seg = meshOf(GEO.wallSeg, shade("#" + s.wall.toString(16).padStart(6, "0"), -0.12));
      seg.position.set(Math.cos(a) * wr, 0.1, Math.sin(a) * wr);
      seg.rotation.y = a + Math.PI / 2;
      g.add(seg);
    }
  }
  return g;
}

function buildTree(): THREE.Group {
  const g = new THREE.Group();
  const trunk = meshOf(GEO.treeTrunk, 0x5a3d22); trunk.position.y = 0.08; g.add(trunk);
  const crown = meshOf(GEO.treeCone, 0x3f6b3a); crown.position.y = 0.34; g.add(crown);
  return g;
}
function buildRock(): THREE.Mesh {
  return meshOf(GEO.rock, 0x7d746a);
}
function buildAnimal(color: number): THREE.Group {
  const g = new THREE.Group();
  const body = meshOf(GEO.horse, color); body.scale.set(0.5, 0.7, 0.7); body.position.y = 0.12; g.add(body);
  for (const [lx, lz] of [[0.08, 0.05], [0.08, -0.05], [-0.08, 0.05], [-0.08, -0.05]]) {
    const leg = meshOf(GEO.leg, color, false); leg.scale.set(0.6, 0.5, 0.6); leg.position.set(lx, 0.05, lz); g.add(leg);
  }
  const head = meshOf(GEO.head, color); head.scale.setScalar(0.7); head.position.set(0.14, 0.17, 0); g.add(head);
  return g;
}
// A small coloured cone prop (wheat sheaf, vine bush, reed, …).
function buildTuft(color: number, h: number, wide = 0.5): THREE.Mesh {
  const m = meshOf(GEO.treeCone, color, false);
  m.scale.set(wide, h, wide);
  return m;
}
// A little fish breaking the surface (body + tail fin), tilted as if leaping.
function buildFish(color: number): THREE.Group {
  const g = new THREE.Group();
  const body = meshOf(GEO.head, color); body.scale.set(1.15, 0.55, 0.5); body.position.y = 0.09; g.add(body);
  const tail = meshOf(GEO.treeCone, color, false); tail.scale.set(0.42, 0.5, 0.42); tail.rotation.z = -Math.PI / 2; tail.position.set(-0.13, 0.09, 0); g.add(tail);
  g.rotation.z = 0.55; // arc up out of the water
  return g;
}
// Stable pseudo-random in [0,1) from tile coords + a salt, so scatter never jumps.
function rnd(q: number, r: number, i: number): number {
  const s = Math.sin(q * 127.1 + r * 311.7 + i * 74.7) * 43758.5453;
  return s - Math.floor(s);
}

export function createBoard(canvas: HTMLCanvasElement): BoardController {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Filmic tone mapping for richer, less-flat colour (applied by the OutputPass
  // at the end of the post-processing chain).
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a1a2f);
  scene.fog = new THREE.Fog(0x0a1a2f, 55, 120);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 800);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  // Orbit freely: drag to spin around the board and set the inclination yourself;
  // right-drag pans, wheel zooms. Bounded so you can't roll under the map or go
  // fully flat.
  controls.enableRotate = true;
  controls.minPolarAngle = 0.12; // near top-down
  controls.maxPolarAngle = 1.32; // near horizon
  controls.minDistance = 5;
  controls.maxDistance = 200;
  controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

  scene.add(new THREE.AmbientLight(0xbfd4ff, 0.62));
  scene.add(new THREE.HemisphereLight(0xcfe4ff, 0x3a3326, 0.5));
  const sun = new THREE.DirectionalLight(0xfff0d4, 1.15);
  sun.position.set(-26, 44, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 1, far: 220 });
  scene.add(sun, sun.target);

  const seaMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(6000, 6000),
    new THREE.MeshStandardMaterial({ color: 0x24446a, roughness: 0.35, metalness: 0.15 })
  );
  seaMesh.rotation.x = -Math.PI / 2;
  // Sit the water backdrop clearly BELOW the sea tiles (tops at -0.18) so the two
  // are no longer at the same depth — that coplanarity was the dark-area flicker
  // (z-fighting between the ocean plane and the deep/undiscovered sea tiles).
  seaMesh.position.y = -0.3;
  seaMesh.receiveShadow = true;
  scene.add(seaMesh);

  // A pointy-top hex prism. CylinderGeometry(...,6) is already pointy-top (a
  // vertex faces +Z), which matches axialToWorld — so do NOT rotate it, or the
  // tiles turn flat-top and no longer interlock. Circumradius ~= SIZE so hexes
  // nest edge-to-edge (a hair under, plus a slight base taper, for clean seams).
  const hexGeo = new THREE.CylinderGeometry(SIZE * 0.998, SIZE * 0.95, 1, 6);
  const hexMat = new THREE.MeshStandardMaterial({ roughness: 0.94, metalness: 0.02, flatShading: true });

  let tileMesh: THREE.InstancedMesh | null = null;
  let indexByKey: Record<string, number> = {};
  let builtSig = "";

  const spriteGroup = new THREE.Group();
  scene.add(spriteGroup);
  const scatterGroup = new THREE.Group();
  scene.add(scatterGroup);
  const borderGroup = new THREE.Group();
  scene.add(borderGroup);

  // Trees on forests, rocks on hills/mountains, denser on timber/ore deposits —
  // only on fully-visible tiles (bounded by vision) and not where a unit/city sits.
  function placeScatter(view: BoardView): void {
    scatterGroup.clear();
    const occupied = new Set(view.sprites.map((s) => s.q + "," + s.r));
    for (const tv of view.tiles) {
      if (tv.v !== 2 || occupied.has(tv.q + "," + tv.r)) continue;
      const w = axialToWorld(tv.q, tv.r);
      const top = topOf(tv.t);
      let trees = tv.t === "forest" ? 3 : 0;
      let rocks = tv.t === "mountains" ? 3 : tv.t === "hills" ? 1 : 0;
      if (tv.res === "timber") trees = Math.max(trees, 4);
      else if (tv.res === "iron" || tv.res === "stone" || tv.res === "silver") rocks = Math.max(rocks, 3);
      for (let i = 0; i < trees; i += 1) {
        const a = rnd(tv.q, tv.r, i) * Math.PI * 2;
        const d = 0.2 + rnd(tv.q, tv.r, i + 10) * 0.5;
        const t = buildTree();
        t.scale.setScalar(0.7 + rnd(tv.q, tv.r, i + 20) * 0.5);
        t.position.set(w.x + Math.cos(a) * d, top, w.z + Math.sin(a) * d);
        scatterGroup.add(t);
      }
      for (let i = 0; i < rocks; i += 1) {
        const a = rnd(tv.q, tv.r, i + 30) * Math.PI * 2;
        const d = 0.15 + rnd(tv.q, tv.r, i + 40) * 0.5;
        const s = 0.6 + rnd(tv.q, tv.r, i + 50) * 0.7;
        const rk = buildRock();
        rk.scale.setScalar(s);
        rk.position.set(w.x + Math.cos(a) * d, top + 0.04 * s, w.z + Math.sin(a) * d);
        scatterGroup.add(rk);
      }
      // Resource-specific props: grain sheaves, grazing animals, vine bushes,
      // leaping fish. Plus a little terrain flavour (reeds on coast, desert scrub).
      let props: THREE.Object3D[] = [];
      if (tv.res === "grain") props = [buildTuft(0xd9c05a, 0.5), buildTuft(0xd9c05a, 0.45), buildTuft(0xcdb44a, 0.5)];
      else if (tv.res === "horses") props = [buildAnimal(0x8a6a44), buildAnimal(0x6b4a2b)];
      else if (tv.res === "wine") props = [buildTuft(0x3f6b3a, 0.4), buildTuft(0x315a2e, 0.4)];
      else if (tv.res === "fish") props = [buildFish(0x9fb8c8), buildFish(0x8fa8bc), buildFish(0x9fb8c8)];
      if (tv.t === "coast" && rnd(tv.q, tv.r, 3) < 0.5) props.push(buildTuft(0x5f8f4a, 0.85, 0.16), buildTuft(0x568345, 0.7, 0.16));
      else if (tv.t === "desert" && rnd(tv.q, tv.r, 3) < 0.4) props.push(buildTuft(0x9a8a4a, 0.35, 0.4));
      for (let i = 0; i < props.length; i += 1) {
        const a = rnd(tv.q, tv.r, i + 60) * Math.PI * 2;
        const d = 0.18 + rnd(tv.q, tv.r, i + 70) * 0.45;
        props[i].position.set(w.x + Math.cos(a) * d, top, w.z + Math.sin(a) * d);
        props[i].rotation.y = rnd(tv.q, tv.r, i + 80) * Math.PI * 2;
        scatterGroup.add(props[i]);
      }
    }
  }
  const texCache = new Map<string, THREE.Texture>();
  const loader = new THREE.TextureLoader();
  let lastView: BoardView | null = null;
  function tex(url: string): THREE.Texture {
    let t = texCache.get(url);
    if (!t) {
      // Re-place sprites once the art loads so we can size to its true aspect.
      t = loader.load(url, () => { if (lastView) placeSprites(lastView); });
      t.colorSpace = THREE.SRGBColorSpace;
      texCache.set(url, t);
    }
    return t;
  }

  // ---- Optional real glTF art. Drop a file at the conventional path and it
  // replaces the procedural placeholder; missing files just stay procedural.
  //   units:  assets/models/units/<form>.glb   (one soldier — cloned into a squad)
  //   cities: assets/models/cities/<civ>.glb    (a whole town)
  const gltfLoader = new GLTFLoader();
  type GLBEntry = { scene: THREE.Object3D; animations: THREE.AnimationClip[] };
  const modelCache = new Map<string, GLBEntry | "loading" | "missing">();
  let mixers: THREE.AnimationMixer[] = [];
  const animClock = new THREE.Clock();
  const _box = new THREE.Box3(), _sz = new THREE.Vector3();
  function getGLB(path: string): GLBEntry | null {
    const c = modelCache.get(path);
    if (c === "loading" || c === "missing") return null;
    if (c) return c;
    modelCache.set(path, "loading");
    gltfLoader.load(
      path,
      (gltf) => { modelCache.set(path, { scene: gltf.scene, animations: gltf.animations || [] }); if (lastView) placeSprites(lastView); },
      undefined,
      () => modelCache.set(path, "missing")
    );
    return null;
  }
  // A clone normalized to a target height with feet at y=0, whatever the source
  // scale/orientation; plays its first animation clip if asked.
  function glbInstance(entry: GLBEntry, targetH: number, animate: boolean): THREE.Object3D {
    const obj = cloneSkinned(entry.scene);
    obj.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
    _box.setFromObject(obj); _box.getSize(_sz);
    obj.scale.setScalar(targetH / (_sz.y || 1));
    _box.setFromObject(obj);
    obj.position.y -= _box.min.y;
    if (animate && entry.animations.length) {
      const mixer = new THREE.AnimationMixer(obj);
      mixer.clipAction(entry.animations[0]).play();
      mixers.push(mixer);
    }
    return obj;
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pickFn: ((key: string | null) => void) | null = null;
  let hoverFn: ((key: string | null) => void) | null = null;
  let keyByIndex: string[] = [];

  function buildTiles(view: BoardView): void {
    const sig = view.tiles.length + ":" + (view.tiles[0] ? view.tiles[0].q + "," + view.tiles[0].r : "");
    if (tileMesh && sig === builtSig) return;
    builtSig = sig;
    if (tileMesh) {
      scene.remove(tileMesh);
      tileMesh.dispose();
    }
    const n = view.tiles.length;
    const mesh = new THREE.InstancedMesh(hexGeo, hexMat, n);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    const qt = new THREE.Quaternion();
    indexByKey = {};
    keyByIndex = [];
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    view.tiles.forEach((tv, i) => {
      const w = axialToWorld(tv.q, tv.r);
      const top = topOf(tv.t);
      const height = Math.max(0.12, top - FLOOR);
      p.set(w.x, (top + FLOOR) / 2, w.z);
      s.set(1, height, 1);
      m.compose(p, qt, s);
      mesh.setMatrixAt(i, m);
      const key = tv.q + "," + tv.r;
      indexByKey[key] = i;
      keyByIndex.push(key);
      minX = Math.min(minX, w.x); maxX = Math.max(maxX, w.x);
      minZ = Math.min(minZ, w.z); maxZ = Math.max(maxZ, w.z);
    });
    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);
    tileMesh = mesh;
    // Frame the board once, on first build — start at a moderate inclination
    // (~38° off vertical), square-on. Drag to spin/tilt from here to taste.
    const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
    const span = Math.max(maxX - minX, maxZ - minZ) || 20;
    controls.target.set(cx, 0, cz);
    camera.position.set(cx, span * 0.8, cz + span * 0.62);
    sun.target.position.set(cx, 0, cz);
    controls.update();
  }

  function colorFor(tv: TileView, civColors: Record<string, string>): THREE.Color {
    if (tv.v === 0) return HIDDEN.clone();
    const jitter = (((tv.q * 928371 + tv.r * 12547) % 17) / 17 - 0.5) * 0.06;
    const c = new THREE.Color(TERRAIN_COLOR[tv.t] ?? 0x808080).offsetHSL(0, 0, jitter);
    if (tv.o && civColors[tv.o]) c.lerp(new THREE.Color(civColors[tv.o]), 0.17);
    if (tv.v === 1) c.multiplyScalar(0.5);
    if (tv.h === 3) c.lerp(GOLD, 0.55);
    else if (tv.h === 4) c.lerp(SELGREEN, 0.5);
    else if (tv.h === 2) c.lerp(RED, 0.5);
    else if (tv.h === 1) c.lerp(GREEN, 0.4);
    else if (tv.h === 5) c.lerp(PATH, 0.4);
    if (tv.h === 6) c.lerp(WHITE, 0.55);
    return c;
  }

  function paintTiles(view: BoardView): void {
    if (!tileMesh) return;
    for (const tv of view.tiles) {
      const idx = indexByKey[tv.q + "," + tv.r];
      if (idx == null) continue;
      tileMesh.setColorAt(idx, colorFor(tv, view.civColors));
    }
    if (tileMesh.instanceColor) tileMesh.instanceColor.needsUpdate = true;
  }

  const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false });
  function placeSprites(view: BoardView): void {
    spriteGroup.clear();
    mixers = [];
    for (const sv of view.sprites) {
      const w = axialToWorld(sv.q, sv.r);
      const top = topOf(sv.t || "plains"); // the tile's real surface height
      const color = sv.color || "#cccccc";
      const isCity = sv.kind === "city";
      const frac = sv.hpFrac == null ? 1 : sv.hpFrac;

      // Prefer real glTF art if the conventional file exists; else the procedural
      // low-poly placeholder. Either way it sits ON the tile and casts a shadow.
      let model: THREE.Object3D;
      let scale: number;
      if (isCity) {
        const glb = getGLB("assets/models/cities/" + sv.civ + ".glb");
        if (glb) { model = glbInstance(glb, 1.4, false); scale = 1; }
        else { model = buildCity(sv.pop || 1, sv.civ); scale = 1.2; }
      } else {
        const form = sv.form || "infantry";
        const glb = getGLB("assets/models/units/" + form + ".glb");
        if (glb) {
          // Clone the one soldier into a squad — count still shows strength.
          const single = form === "siege" || form === "naval";
          const base = form === "elephant" ? 2 : form === "mounted" ? 3 : form === "civilian" ? 3 : 6;
          const count = single ? 1 : Math.max(1, Math.round(base * Math.max(0.05, Math.min(1, frac))));
          const grp = new THREE.Group();
          const pos = squadPositions(count);
          for (let i = 0; i < count; i += 1) {
            const f = glbInstance(glb, single ? 1.0 : 0.85, true);
            if (!single) { f.scale.multiplyScalar(0.6); f.position.set(pos[i][0], 0, pos[i][1]); f.rotation.y = (rnd(sv.q, sv.r, i) - 0.5) * 0.6; }
            grp.add(f);
          }
          model = grp; scale = 1;
        } else { model = buildUnit(form, color, frac, sv.q, sv.r, sv.civ); scale = 1.35; }
      }
      model.scale.setScalar(scale);
      model.position.set(w.x, top + 0.01, w.z);
      spriteGroup.add(model);

      // A faint contact shadow disc under the model for extra grounding.
      const shadow = new THREE.Mesh(shadowGeo, shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(w.x, top + 0.02, w.z);
      const sh = isCity ? 1.7 : 1.0;
      shadow.scale.set(sh, sh, 1);
      spriteGroup.add(shadow);

      // Garrison: a small soldier standing at the city gate, so a defended city
      // reads at a glance; a count chip shows how many are inside.
      if (isCity && sv.garrison && sv.garrison > 0) {
        const gfig = buildFigure(sv.gForm || "infantry", sv.gColor || color, sv.civ);
        gfig.scale.setScalar(0.85);
        gfig.position.set(w.x + SIZE * 0.34, top + 0.01, w.z + SIZE * 0.5);
        spriteGroup.add(gfig);
        if (sv.garrison > 1) {
          const gb = new THREE.Sprite(new THREE.SpriteMaterial({ map: glyphTexture("×" + sv.garrison), transparent: true, depthWrite: false, depthTest: false }));
          gb.center.set(0.5, 0);
          gb.scale.set(0.5, 0.5, 0.5);
          gb.position.set(w.x + SIZE * 0.34, top + 0.62, w.z + SIZE * 0.5);
          gb.renderOrder = 999;
          spriteGroup.add(gb);
        }
      }

      // Type glyph badge floating above so units stay identifiable.
      if (sv.badge) {
        const b = new THREE.Sprite(new THREE.SpriteMaterial({ map: glyphTexture(sv.badge), transparent: true, depthWrite: false, depthTest: false }));
        b.center.set(0.5, 0);
        b.scale.set(0.5, 0.5, 0.5);
        b.position.set(w.x, top + (isCity ? 1.5 : 1.05), w.z);
        b.renderOrder = 999;
        spriteGroup.add(b);
      }
    }
  }

  const borderGeo = new THREE.BoxGeometry(SIZE * 1.03, 0.1, 0.14);
  const borderMat = new THREE.MeshBasicMaterial();
  let borderMesh: THREE.InstancedMesh | null = null;
  function drawBorders(view: BoardView): void {
    if (borderMesh) {
      borderGroup.remove(borderMesh);
      borderMesh.dispose();
      borderMesh = null;
    }
    if (!view.borders.length) return;
    const mesh = new THREE.InstancedMesh(borderGeo, borderMat, view.borders.length);
    mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(view.borders.length * 3), 3);
    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3(1, 1, 1);
    const qt = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    view.borders.forEach((b, i) => {
      const a = axialToWorld(b.q, b.r);
      const c = axialToWorld(b.nq, b.nr);
      const mx = (a.x + c.x) / 2, mz = (a.z + c.z) / 2;
      const dx = c.x - a.x, dz = c.z - a.z;
      const ang = Math.atan2(dz, dx);
      // The border runs ALONG the shared edge — perpendicular to the centre line.
      qt.setFromAxisAngle(up, -ang - Math.PI / 2);
      p.set(mx, 0.16, mz);
      m.compose(p, qt, s);
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, new THREE.Color(b.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    borderGroup.add(mesh);
    borderMesh = mesh;
  }

  // Rivers: a blue ribbon along the shared edge between two tiles.
  const riverGeo = new THREE.BoxGeometry(SIZE * 1.02, 0.06, 0.13);
  const riverMat = new THREE.MeshStandardMaterial({ color: 0x3f7fd0, roughness: 0.5, metalness: 0.1, emissive: 0x0c2a55, emissiveIntensity: 0.3 });
  let riverMesh: THREE.InstancedMesh | null = null;
  // Roads: a dirt ribbon along the centre line joining two adjacent tiles/cities.
  const roadGeo = new THREE.BoxGeometry(1, 0.05, 0.16);
  const roadMat = new THREE.MeshStandardMaterial({ color: 0xa07d4c, roughness: 0.95 });
  let roadMesh: THREE.InstancedMesh | null = null;
  const _xAxis = new THREE.Vector3(1, 0, 0);
  const _up = new THREE.Vector3(0, 1, 0);
  const _dir = new THREE.Vector3();
  function drawEdges(
    segments: EdgeView[] | undefined,
    geo: THREE.BoxGeometry,
    mat: THREE.Material,
    off: number,
    along: boolean,
    heightOf: (q: number, r: number) => number,
    prev: THREE.InstancedMesh | null
  ): THREE.InstancedMesh | null {
    if (prev) { borderGroup.remove(prev); prev.dispose(); }
    if (!segments || !segments.length) return null;
    const mesh = new THREE.InstancedMesh(geo, mat, segments.length);
    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3(1, 1, 1);
    const qt = new THREE.Quaternion();
    segments.forEach((seg, i) => {
      const a = axialToWorld(seg.q, seg.r);
      const c = axialToWorld(seg.nq, seg.nr);
      const ha = heightOf(seg.q, seg.r);
      const hb = heightOf(seg.nq, seg.nr);
      if (along) {
        // Road: a ribbon spanning the two tile centres AT THEIR SURFACE HEIGHTS,
        // so it climbs and drops with the terrain instead of sinking through it.
        const sx = a.x, sy = ha + off, sz = a.z;
        const ex = c.x, ey = hb + off, ez = c.z;
        _dir.set(ex - sx, ey - sy, ez - sz);
        const len = _dir.length() || 1;
        _dir.divideScalar(len);
        qt.setFromUnitVectors(_xAxis, _dir);
        s.set(len, 1, 1);
        p.set((sx + ex) / 2, (sy + ey) / 2, (sz + ez) / 2);
      } else {
        // River: perpendicular ribbon along the shared edge, sitting on the lower
        // of the two banks (water runs in the channel between them).
        const dx = c.x - a.x, dz = c.z - a.z;
        const ang = Math.atan2(dz, dx);
        qt.setFromAxisAngle(_up, -ang - Math.PI / 2);
        s.set(1, 1, 1);
        p.set((a.x + c.x) / 2, Math.min(ha, hb) + off, (a.z + c.z) / 2);
      }
      m.compose(p, qt, s);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    borderGroup.add(mesh);
    return mesh;
  }
  function drawWaterways(view: BoardView): void {
    const terrainByKey: Record<string, string> = {};
    for (const tv of view.tiles) terrainByKey[tv.q + "," + tv.r] = tv.t;
    const heightOf = (q: number, r: number): number => topOf(terrainByKey[q + "," + r] || "plains");
    roadMesh = drawEdges(view.roads, roadGeo, roadMat, 0.05, true, heightOf, roadMesh);
    riverMesh = drawEdges(view.rivers, riverGeo, riverMat, 0.04, false, heightOf, riverMesh);
  }

  function pickIndex(cx: number, cy: number): number {
    if (!tileMesh) return -1;
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((cx - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((cy - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(tileMesh);
    return hit.length && hit[0].instanceId != null ? (hit[0].instanceId as number) : -1;
  }

  canvas.addEventListener("mousemove", (e) => {
    if (!hoverFn) return;
    const id = pickIndex(e.clientX, e.clientY);
    hoverFn(id >= 0 ? keyByIndex[id] : null);
  });
  let dX = 0, dY = 0;
  canvas.addEventListener("mousedown", (e) => { dX = e.clientX; dY = e.clientY; });
  canvas.addEventListener("mouseup", (e) => {
    if (!pickFn || Math.abs(e.clientX - dX) + Math.abs(e.clientY - dY) > 5) return;
    const id = pickIndex(e.clientX, e.clientY);
    pickFn(id >= 0 ? keyByIndex[id] : null);
  });

  // Post-processing chain: render -> subtle bloom (only the brightest pixels
  // bleed) -> tone-mapped output. Adds sheen and depth without new assets.
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.32, 0.6, 0.85);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  function resize(): void {
    const w = canvas.clientWidth || 800;
    const h = canvas.clientHeight || 600;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();

  let running = true;
  const loop = () => {
    if (!running) return;
    controls.update();
    const dt = animClock.getDelta();
    for (const m of mixers) m.update(dt);
    composer.render();
    requestAnimationFrame(loop);
  };
  loop();

  return {
    render(view) {
      lastView = view;
      buildTiles(view);
      paintTiles(view);
      placeSprites(view);
      placeScatter(view);
      drawBorders(view);
      drawWaterways(view);
      if (view.focus) {
        const w = axialToWorld(view.focus.q, view.focus.r);
        controls.target.set(w.x, 0, w.z);
      }
    },
    onPick(fn) { pickFn = fn; },
    onHover(fn) { hoverFn = fn; },
    resize,
    dispose() { running = false; renderer.dispose(); }
  };
}

// ---- Standalone demo for board3d.html (reveals the whole map) ---------------
export function initDemo(canvas: HTMLCanvasElement, which: string): void {
  const manifest = ((globalThis as { HEGEMON_SPRITES?: Record<string, { unit?: string[]; city?: string[] }> }).HEGEMON_SPRITES) || {};
  const roster: Record<string, string> = { rome: "#c0392b", carthage: "#8e44ad", greece: "#2e86de", egypt: "#d4ac0d", gaul: "#27ae60", parthia: "#e67e22" };
  let state: GameState;
  if (["oikoumene", "italia", "hellas", "oldworld"].includes(which)) {
    state = createInitialGameState(loadScenario(which as never).config);
  } else {
    state = createInitialGameState(generateMap({ size: (which as never) || "large", seed: "board3d-demo", playerCount: 4 }));
  }
  const board = createBoard(canvas);
  const tiles: TileView[] = Object.keys(state.map.tiles).map((k) => {
    const [q, r] = k.split(",").map(Number);
    return { q, r, t: state.map.tiles[k].terrain, v: 2, o: null, h: 0 };
  });
  const sprites: SpriteView[] = [];
  for (const c of Object.values(state.map.cities)) {
    const man = manifest[c.ownerId];
    if (man && man.city && man.city.length) sprites.push({ civ: c.ownerId, kind: "city", name: man.city[0], q: c.position.q, r: c.position.r });
  }
  for (const u of Object.values(state.map.units)) {
    const man = manifest[u.ownerId];
    if (man && man.unit && man.unit.length) sprites.push({ civ: u.ownerId, kind: "unit", name: man.unit[2] || man.unit[0], q: u.position.q, r: u.position.r, badge: "⚔️" });
  }
  board.render({ tiles, sprites, borders: [], civColors: roster });
  board.onPick((key) => {
    const el = document.getElementById("pick");
    if (el) el.textContent = key ? "tile " + key + " — " + (state.map.tiles[key]?.terrain || "") : "—";
  });
  window.addEventListener("resize", () => board.resize());
}

(globalThis as unknown as { Board3D: { createBoard: typeof createBoard; initDemo: typeof initDemo } }).Board3D = { createBoard, initDemo };
