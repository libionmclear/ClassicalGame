// Three.js renderer for the hex board — a real 3D scene with terrain elevation,
// a sun that casts shadows, a tilt/zoom/orbit camera, fog of war, territory
// borders, tile highlights and billboarded unit/city sprites. Driven by game.js
// through a small view object, so all game logic stays in the DOM app.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { createInitialGameState } from "../engine/index";
import { generateMap } from "../engine/mapgen";
import { loadScenario } from "../engine/scenarios";
import type { GameState } from "../engine/types";
import { buildCity as buildCityV2 } from "./cityModels.js";
import { buildTerrainSurface, sampleSurface, elevationOf, mountainnessOf, type TileSample, type TileAt } from "./terrain";
import { buildWaterSurface } from "./water";
import { pickScatter, type Climate } from "./scatter";
import { buildDistrict } from "./districtModels.js";

// City visual tier (1..10) from population — HEGEMON-VISUALS-v2.md §1 thresholds.
const CITY_TIER_POP = [1, 3, 6, 10, 15, 21, 28, 36, 45, 55];
function cityTierForPop(pop: number): number {
  let tier = 1;
  for (let i = 0; i < CITY_TIER_POP.length; i += 1) if (pop >= CITY_TIER_POP[i]) tier = i + 1;
  return tier;
}
function cityStyleFor(civ?: string): string {
  // Civ ids map 1:1 to cityModels styles (greece = Athens); civs without their own
  // architecture borrow the nearest one (Britons → Gallic, Kush → Egyptian).
  const alias: Record<string, string> = { britons: "gaul", kush: "egypt" };
  return (civ && alias[civ]) || civ || "rome";
}

const TERRAIN_COLOR: Record<string, number> = {
  plains: 0x7c8a4f,
  valley: 0x8aa354,
  forest: 0x33553a,
  hills: 0x86744f,
  highlands: 0x7d7258,
  mountains: 0x746a5b,
  desert: 0xc6a86a,
  coast: 0x3f7f9c,
  sea: 0x2f5177
};
// Five terraced elevation levels (~0.2 apart) so the land reads as an even staircase
// you can climb to a peak: L1 plains → L2 forest → L3 hills → L4 highlands → L5
// mountains. Water stays flat and low. The peak's snow spikes add a modest amount on
// top (see buildPeak) — much shorter than before, so a summit is tall but reachable.
// This is the render half of the elevation system; movement rules follow the tiers.
const TERRAIN_ELEV: Record<string, number> = {
  sea: -0.12, coast: -0.04, plains: 0.14, valley: 0.18, forest: 0.34, hills: 0.54, highlands: 0.74, mountains: 0.96, desert: 0.14
};
const FLOOR = -0.6;
const SIZE = 1;
// The sea is rendered as ONE FLAT surface: coast and open water sit at a single
// level (depth is shown by colour, not elevation), and as thin slabs so there are
// no tall prism sides — those sides caught the warm sun on dark-blue water and
// read as purple. See paintTiles.
const WATER = new Set(["sea", "coast"]);
const SEA_TOP = -0.1;

function axialToWorld(q: number, r: number): { x: number; z: number } {
  return { x: SIZE * Math.sqrt(3) * (q + r / 2), z: SIZE * 1.5 * r };
}
const topOf = (t: string): number => (WATER.has(t) ? SEA_TOP : (TERRAIN_ELEV[t] ?? 0.08));

// World point -> the hex under it (inverse of axialToWorld, with proper cube rounding
// so the nearest hex wins at the edges). Lets the open ocean — which renders as bare
// water with no tint hexes — still be clicked, by hit-testing the sea plane.
function worldToAxial(x: number, z: number): { q: number; r: number } {
  const rf = z / (1.5 * SIZE);
  const qf = x / (SIZE * Math.sqrt(3)) - rf / 2;
  const cx = qf, cz = rf, cy = -cx - cz;
  let rx = Math.round(cx), ry = Math.round(cy), rz = Math.round(cz);
  const dx = Math.abs(rx - cx), dy = Math.abs(ry - cy), dz = Math.abs(rz - cz);
  if (dx > dy && dx > dz) rx = -ry - rz;
  else if (dy > dz) ry = -rx - rz;
  else rz = -rx - ry;
  return { q: rx, r: rz };
}

// A tile descriptor from game.js. v: 0 hidden, 1 discovered (dim), 2 visible.
// h: 0 none, 1 reachable, 2 attackable, 3 selected, 4 tile-selected, 5 path, 6 flash.
export interface TileView { q: number; r: number; t: string; v: number; o: string | null; h: number; road?: boolean; imp?: string; res?: string | null; wx?: string; ruin?: number; village?: string | null; /** Hexes past the map's border (the open-ocean belt); 0/absent on the playable map. */ open?: number; }
export interface SpriteView { civ: string; kind: "unit" | "city"; name: string; q: number; r: number; id?: string; badge?: string; color?: string; t?: string; form?: string; utype?: string; pop?: number; tier?: number; hpFrac?: number; garrison?: number; gForm?: string | null; gColor?: string; }
export interface BorderView { q: number; r: number; nq: number; nr: number; color: string; }
// A district built on a hex adjacent to a city (Cities v3 §5). t = the hex's
// terrain (for surface height); style = the owning civ; work = Great Work id.
export interface DistrictView { q: number; r: number; type: string; style: string; t?: string; accent?: string; pillaged?: boolean; work?: string; cq?: number; cr?: number; }
// A segment between two tiles: rivers run along the shared edge, roads along the
// centre line (from tile q,r to neighbour nq,nr).
export interface EdgeView { q: number; r: number; nq: number; nr: number; }
export interface BoardView {
  tiles: TileView[];
  sprites: SpriteView[];
  borders: BorderView[];
  districts?: DistrictView[];
  civColors: Record<string, string>;
  rivers?: EdgeView[];
  roads?: EdgeView[];
  focus?: { q: number; r: number };
  /** Game turn — drives the day/night cycle (the sun rises, peaks, sets over a span
   *  of turns; night falls; weather dims on top). */
  turn?: number;
  weather?: string; // overall sky mood: clear | rain | storm | fog | heat
}

export interface BoardController {
  render(view: BoardView): void;
  onPick(fn: (key: string | null) => void): void;
  onHover(fn: (key: string | null) => void): void;
  strike(q: number, r: number): void;
  resize(): void;
  /** Tilt the camera by `delta` radians of polar angle (+ = toward the horizon). */
  nudgeTilt(delta: number): void;
  /** Reframe the board at the default inclination and clear the saved tilt preset. */
  resetCamera(): void;
  /** Current camera inclination (polar angle, radians). */
  getTilt(): number;
  /** Move the camera to frame tile (q,r), keeping the current angle + distance. */
  focusTile(q: number, r: number): void;
  /** Dev diagnostics: relief/scatter/texture state for the checkpoint screenshots. */
  reliefDebug(): Record<string, unknown>;
  dispose(): void;
}

const GOLD = new THREE.Color(0xf2cc69);
const GREEN = new THREE.Color(0x7ed957);
const SELGREEN = new THREE.Color(0x7cd682);
const RED = new THREE.Color(0xe0533d);
const PATH = new THREE.Color(0x7dd3fc);
const WHITE = new THREE.Color(0xffffff);
// Unexplored land reads as an aged papyrus map (sepia), not black — and lies flat
// (no hex relief) so it's truly undiscovered until you scout it.
const HIDDEN = new THREE.Color(0xcbb794);
const HIDDEN_ELEV = 0.04;

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
  peakSpike: new THREE.ConeGeometry(0.4, 1.0, 5),
  peakSnow: new THREE.ConeGeometry(0.2, 0.4, 5),
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
function addHelmet(g: THREE.Group, y: number, civ?: string, big = false): void {
  const c = civ || "rome";
  const helmCol = c === "gaul" ? 0xc0894a : c === "egypt" ? 0xcaa85a : STEEL; // bronze Gaul, gilt Egypt, else steel
  const helm = meshOf(GEO.helmet, helmCol); helm.position.set(0, y, 0); g.add(helm);
  const crest = meshOf(GEO.crest, CREST[c] ?? 0xb0392b, false);
  if (big) crest.scale.set(1.4, 2.1, 1.2); // taller plume for the legionary
  crest.position.set(0, y + (big ? 0.09 : 0.05), 0);
  if (c === "rome") crest.rotation.y = Math.PI / 2; // transverse Roman crest
  g.add(crest);
}
function buildFigure(form: string, color: string, civ?: string, utype?: string): THREE.Group {
  const g = new THREE.Group();
  const armor = shade(color, 0);
  const legCol = shade(color, -0.3);
  // Gauls (Celts) fight bare-chested, daubed with blue woad; Roman legionaries get
  // heavier armour and a taller crest; hoplites wear a tall Corinthian crest.
  const bareChest = civ === "gaul";
  const legionary = utype === "legionary";
  const bigCrest = legionary || utype === "hoplite";
  // A little person: two legs, a torso, two arms, a head — helmeted for soldiers.
  const figure = (lift = 0, helmeted = true) => {
    for (const lx of [0.05, -0.05]) { const leg = meshOf(GEO.legThin, legCol); leg.position.set(lx, 0.09 + lift, 0); g.add(leg); }
    const t = meshOf(GEO.torso, bareChest ? SKIN : armor); t.position.set(0, 0.3 + lift, 0); g.add(t);
    for (const ax of [0.11, -0.11]) { const a = meshOf(GEO.arm, bareChest ? SKIN : armor); a.position.set(ax, 0.3 + lift, 0); g.add(a); }
    if (bareChest) {
      // Blue woad tattoos on the chest.
      for (const [tx, ty] of [[0.03, 0.34], [-0.03, 0.28], [0.0, 0.4]]) { const w = meshOf(GEO.crest, 0x2f6ea5, false); w.scale.set(0.5, 0.4, 0.16); w.position.set(tx, ty + lift, 0.09); g.add(w); }
    }
    if (legionary) {
      // Extra armour: shoulder pauldrons + a chest plate.
      for (const ax of [0.12, -0.12]) { const pa = meshOf(GEO.slab, STEEL); pa.scale.set(0.28, 1.4, 0.5); pa.position.set(ax, 0.4 + lift, 0); g.add(pa); }
      const plate = meshOf(GEO.torso, STEEL); plate.scale.set(1.08, 0.6, 1.08); plate.position.set(0, 0.33 + lift, 0.02); g.add(plate);
    }
    const h = meshOf(GEO.head, SKIN); h.position.set(0, 0.47 + lift, 0); g.add(h);
    if (helmeted) addHelmet(g, 0.5 + lift, civ, bigCrest);
  };
  if (form === "spear") {
    figure();
    const spear = meshOf(GEO.pole, WOOD); spear.position.set(0.14, 0.36, 0.02); g.add(spear);
    if (utype === "hoplite") {
      // The big round bronze aspis — the shield-wall of the phalanx.
      const aspis = meshOf(GEO.dome, 0xb08d3a); aspis.scale.set(1.5, 0.45, 1.5); aspis.rotation.z = Math.PI / 2; aspis.position.set(-0.17, 0.3, 0.03); g.add(aspis);
      const boss = meshOf(GEO.dome, 0x8a6a2a); boss.scale.set(0.5, 0.4, 0.5); boss.rotation.z = Math.PI / 2; boss.position.set(-0.2, 0.3, 0.03); g.add(boss);
    } else {
      const sh = meshOf(GEO.shield, shade(color, -0.15)); sh.position.set(-0.13, 0.26, 0.03); g.add(sh);
    }
  } else if (form === "ranged") {
    figure();
    // A bent-stick bow held out front, with a straight string across it.
    const bow = meshOf(GEO.bow, DARKWOOD, false); bow.scale.set(1.35, 1.6, 1.35); bow.position.set(0.17, 0.33, 0.05); bow.rotation.z = Math.PI / 2; g.add(bow);
    const string = meshOf(GEO.pole, 0xd8c9a8, false); string.scale.set(0.5, 0.6, 0.5); string.position.set(0.19, 0.33, 0.05); g.add(string);
  } else if (form === "mounted" && utype === "war-chariot") {
    // Egypt — the war chariot: two horses abreast pulling a light cart + archer.
    for (const hz of [0.15, -0.15]) {
      const horse = meshOf(GEO.horse, WOOD); horse.scale.set(0.95, 0.85, 0.6); horse.position.set(0.16, 0.24, hz); g.add(horse);
      for (const lx of [0.12, -0.12]) { const leg = meshOf(GEO.leg, DARKWOOD, false); leg.position.set(0.16 + lx, 0.12, hz); g.add(leg); }
      const hh = meshOf(GEO.horse, WOOD); hh.scale.set(0.42, 0.4, 0.28); hh.position.set(0.46, 0.33, hz); hh.rotation.z = -0.3; g.add(hh);
    }
    const pole = meshOf(GEO.pole, WOOD, false); pole.scale.set(1, 0.55, 1); pole.rotation.z = Math.PI / 2; pole.position.set(0.14, 0.2, 0); g.add(pole);
    const cart = meshOf(GEO.building, armor); cart.scale.set(1.9, 0.55, 1.35); cart.position.set(-0.22, 0.25, 0); g.add(cart);
    for (const wz of [0.22, -0.22]) { const wheel = meshOf(GEO.column, DARKWOOD, false); wheel.scale.set(3.8, 0.14, 3.8); wheel.rotation.x = Math.PI / 2; wheel.position.set(-0.24, 0.12, wz); g.add(wheel); }
    const ct = meshOf(GEO.torso, armor); ct.scale.set(0.9, 0.9, 0.9); ct.position.set(-0.24, 0.46, 0); g.add(ct);
    const ch = meshOf(GEO.head, SKIN); ch.scale.setScalar(0.9); ch.position.set(-0.24, 0.62, 0); g.add(ch);
    addHelmet(g, 0.65, civ);
    const cbow = meshOf(GEO.bow, DARKWOOD, false); cbow.scale.set(1.3, 1.5, 1.3); cbow.rotation.z = Math.PI / 2; cbow.position.set(-0.1, 0.48, 0.05); g.add(cbow);
  } else if (form === "mounted") {
    const hy = 0.26; // horse back height
    const cataphract = utype === "cataphract";
    const horseArcher = utype === "horse-archer";
    const horse = meshOf(GEO.horse, WOOD); horse.position.set(0, hy, 0); g.add(horse);
    for (const [lx, lz] of [[0.17, 0.07], [0.17, -0.07], [-0.17, 0.07], [-0.17, -0.07]]) {
      const leg = meshOf(GEO.leg, DARKWOOD, false); leg.position.set(lx, 0.13, lz); g.add(leg);
    }
    // Neck up to an ELONGATED head/muzzle (angled down), with ears and a tail.
    const neck = meshOf(GEO.arm, WOOD); neck.scale.set(1.8, 1.05, 1.8); neck.position.set(0.24, hy + 0.11, 0); neck.rotation.z = -0.7; g.add(neck);
    const headM = meshOf(GEO.horse, WOOD); headM.scale.set(0.62, 0.5, 0.42); headM.position.set(0.38, hy + 0.19, 0); headM.rotation.z = -0.35; g.add(headM);
    for (const ez of [0.05, -0.05]) { const ear = meshOf(GEO.tusk, WOOD, false); ear.scale.set(0.55, 0.55, 0.55); ear.position.set(0.31, hy + 0.3, ez); g.add(ear); }
    const tail = meshOf(GEO.arm, WOOD); tail.scale.set(0.9, 0.9, 0.9); tail.position.set(-0.25, hy + 0.02, 0); tail.rotation.z = 0.9; g.add(tail);
    // Cataphract: full barding (armour) draped over the horse.
    if (cataphract) { const barding = meshOf(GEO.building, 0x9198a2); barding.scale.set(1.85, 0.55, 0.95); barding.position.set(0, hy + 0.01, 0); g.add(barding); }
    // Rider astride and FACING FORWARD (+x, toward the head).
    const seatY = hy + 0.06;
    const riderCol = cataphract ? STEEL : armor;
    const torso = meshOf(GEO.torso, riderCol); torso.scale.set(0.92, 0.9, 0.92); torso.position.set(-0.02, seatY + 0.14, 0); g.add(torso);
    const rh = meshOf(GEO.head, SKIN); rh.scale.set(0.92, 0.92, 0.92); rh.position.set(0.0, seatY + 0.32, 0); g.add(rh);
    addHelmet(g, seatY + 0.35, civ, cataphract);
    if (horseArcher) {
      // The Parthian shot: a drawn bow instead of reins.
      const bow = meshOf(GEO.bow, DARKWOOD, false); bow.scale.set(1.25, 1.4, 1.25); bow.rotation.z = Math.PI / 2; bow.position.set(0.08, seatY + 0.16, 0.07); g.add(bow);
      for (const az of [0.06, -0.06]) { const a = meshOf(GEO.arm, riderCol); a.scale.set(0.8, 0.8, 0.8); a.position.set(0.08, seatY + 0.15, az); a.rotation.z = 1.2; g.add(a); }
    } else {
      for (const az of [0.08, -0.08]) { const a = meshOf(GEO.arm, riderCol); a.scale.set(0.8, 0.8, 0.8); a.position.set(0.13, seatY + 0.12, az); a.rotation.z = 1.05; g.add(a); }
    }
    for (const side of [1, -1]) { const leg = meshOf(GEO.legThin, cataphract ? STEEL : legCol); leg.scale.set(1, 1.15, 1); leg.position.set(0.02, seatY, side * 0.11); leg.rotation.x = side * 0.6; g.add(leg); }
  } else if (form === "elephant") {
    const body = meshOf(GEO.bigBody, GREY); body.position.set(0, 0.3, 0); g.add(body);
    for (const [lx, lz] of [[0.2, 0.11], [0.2, -0.11], [-0.2, 0.11], [-0.2, -0.11]]) {
      const leg = meshOf(GEO.leg, GREY); leg.position.set(lx, 0.11, lz); g.add(leg);
    }
    const head = meshOf(GEO.head, GREY); head.scale.setScalar(1.5); head.position.set(0.3, 0.36, 0); g.add(head);
    const tr = meshOf(GEO.trunk, GREY); tr.position.set(0.4, 0.24, 0); tr.rotation.z = 0.7; g.add(tr);
    for (const tz of [0.07, -0.07]) { const tk = meshOf(GEO.tusk, IVORY); tk.position.set(0.4, 0.26, tz); tk.rotation.z = 2.0; g.add(tk); }
    // Carthage's war beast carries a crenellated fighting-tower with a crew.
    const howdah = meshOf(GEO.building, shade(color, 0)); howdah.scale.set(0.55, 0.6, 0.75); howdah.position.set(-0.05, 0.58, 0); g.add(howdah);
    for (const cz of [0.13, 0, -0.13]) { const cr = meshOf(GEO.building, shade(color, -0.12)); cr.scale.set(0.13, 0.28, 0.13); cr.position.set(-0.05, 0.74, cz); g.add(cr); }
    const crewT = meshOf(GEO.torso, armor); crewT.scale.set(0.68, 0.68, 0.68); crewT.position.set(-0.05, 0.82, 0); g.add(crewT);
    const crewH = meshOf(GEO.head, SKIN); crewH.scale.setScalar(0.68); crewH.position.set(-0.05, 0.94, 0); g.add(crewH);
  } else if (form === "siege") {
    const b = meshOf(GEO.siegeBase, WOOD); b.position.set(0, 0.1, 0); g.add(b);
    const arm = meshOf(GEO.pole, DARKWOOD); arm.scale.set(1, 0.55, 1); arm.position.set(0, 0.3, 0); arm.rotation.z = -0.7; g.add(arm);
    for (const wz of [0.13, -0.13]) { const wl = meshOf(GEO.leg, DARKWOOD, false); wl.rotation.x = Math.PI / 2; wl.position.set(0.12, 0.07, wz); g.add(wl); const wr = meshOf(GEO.leg, DARKWOOD, false); wr.rotation.x = Math.PI / 2; wr.position.set(-0.12, 0.07, wz); g.add(wr); }
  } else if (form === "naval") {
    // A long, low galley (not a log): hull + deck, a raised pointed prow with a
    // bronze ram, oars along the sides, and a sail.
    const hullCol = 0x6b4a2b, deckCol = 0x8a6a44;
    const hull = meshOf(GEO.building, hullCol); hull.scale.set(2.4, 0.4, 1.05); hull.position.set(0, 0.14, 0); g.add(hull);
    const deck = meshOf(GEO.slab, deckCol); deck.scale.set(2.0, 1, 0.85); deck.position.set(0, 0.23, 0); g.add(deck);
    const prow = meshOf(GEO.roof, hullCol); prow.scale.set(0.75, 1.0, 1.05); prow.rotation.z = -Math.PI / 2; prow.position.set(0.37, 0.16, 0); g.add(prow);
    const ram = meshOf(GEO.tusk, STEEL, false); ram.scale.set(1.3, 1.3, 1.3); ram.rotation.z = -Math.PI / 2; ram.position.set(0.46, 0.11, 0); g.add(ram);
    for (const oz of [0.16, -0.16]) for (const ox of [-0.16, 0, 0.16]) {
      const oar = meshOf(GEO.mast, DARKWOOD, false); oar.scale.set(1, 0.7, 1); oar.rotation.x = Math.PI / 2; oar.rotation.z = 0.35; oar.position.set(ox, 0.11, oz * 1.25); g.add(oar);
    }
    const mast = meshOf(GEO.mast, DARKWOOD); mast.position.set(-0.04, 0.42, 0); g.add(mast);
    const sail = meshOf(GEO.sail, shade(color, 0.12)); sail.position.set(-0.04, 0.4, 0); g.add(sail);
  } else if (form === "civilian") {
    figure(0, false); // bare-headed worker
    const pack = meshOf(GEO.building, WOOD); pack.scale.set(0.5, 0.4, 0.45); pack.position.set(-0.15, 0.28, 0); g.add(pack);
  } else {
    // infantry / heavy
    figure();
    const gaesatae = utype === "gaesatae";
    if (!gaesatae) { const sh = meshOf(GEO.shield, shade(color, -0.15)); sh.position.set(-0.13, 0.26, 0.04); g.add(sh); }
    // Gaesatae wield the long Celtic sword (and a gold torc) instead of a shield.
    const sword = meshOf(GEO.pole, STEEL); sword.scale.set(1, gaesatae ? 0.78 : 0.42, 1); sword.position.set(0.15, gaesatae ? 0.38 : 0.3, 0); g.add(sword);
    if (gaesatae) { const torc = meshOf(GEO.bow, 0xd9b45a, false); torc.scale.set(0.55, 0.55, 0.55); torc.rotation.x = Math.PI / 2; torc.position.set(0, 0.44, 0.02); g.add(torc); }
  }
  return g;
}
// Small formation offsets so N figures cluster neatly, centred on the tile.
function squadPositions(n: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  const cols = Math.max(1, Math.ceil(Math.sqrt(n)));
  const rows = Math.ceil(n / cols);
  const sp = 0.17; // tighter, so a dozen small men still sit within the hex
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
function buildUnit(form: string, color: string, hpFrac: number, q: number, r: number, civ?: string, utype?: string): THREE.Group {
  const frac = hpFrac == null ? 1 : Math.max(0.05, Math.min(1, hpFrac));
  const single = form === "siege" || form === "naval";
  // Smaller men, MORE of them: a unit reads as a real company, not a handful of
  // giants dwarfing the houses. (Elephants/ships stay single; civilians are a few.)
  const base = form === "elephant" ? 2 : form === "mounted" ? 6 : form === "civilian" ? 2 : form === "ranged" ? 9 : 12;
  const g = new THREE.Group();
  if (single) {
    const fig = buildFigure(form, color, civ, utype);
    fig.scale.setScalar(0.9 + 0.1 * frac);
    g.add(fig);
    return g;
  }
  const count = Math.max(1, Math.round(base * frac));
  const pos = squadPositions(count);
  for (let i = 0; i < count; i += 1) {
    const fig = buildFigure(form, color, civ, utype);
    fig.scale.setScalar(0.42);
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
    const colH = 0.32 * k;
    for (let i = 0; i < 4; i += 1) {
      const tx = (i / 3 - 0.5) * pw * 0.82;
      for (const zz of [pd * 0.42, -pd * 0.42]) {
        const col = meshOf(GEO.column, 0xeae3d0); col.scale.set(1.15, colH / 0.34, 1.15); col.position.set(tx, ph + colH * 0.5, zz); g.add(col);
      }
    }
    const entab = meshOf(GEO.beam, s.roofColor); entab.scale.set(pw * 0.9, 1, pd * 1.02 / 0.14); entab.position.y = ph + colH; g.add(entab);
    // Temple at one end (walls + pitched roof rest flush) and the aqueduct behind.
    addBuilding(g, s, pw * 0.34, 0, 0.34 * k, 0.34 * k);
    addAqueduct(g, s, -pw * 0.05, -pd * 0.85, k);
    // At the grandest stage, a small columned temple crowns the forum's entablature.
    if (tier >= 5) {
      const ty = ph + colH + 0.02 * k;
      const temple = new THREE.Group();
      addColonnadeTemple(temple, s, 0.9 * k, 0, 0); // a proper big temple crowns the forum
      temple.position.set(0, ty, 0);
      g.add(temple);
    }
  } else if (L === "pyramid") {
    const ps = k * 1.2; // Egypt's pyramid grows grander at the higher stages
    const p = meshOf(GEO.pyramid, s.wall); p.scale.setScalar(ps); p.position.y = 0.5 * ps * 0.5; g.add(p);
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
// A primitive round thatched hut — the very first stage of a settlement, and the
// building block of a Minor-People village marker.
function buildHut(wallColor: number): THREE.Group {
  const g = new THREE.Group();
  const wall = meshOf(GEO.roundWall, wallColor); wall.scale.set(0.52, 0.5, 0.52); wall.position.y = 0.075; g.add(wall);
  const roof = meshOf(GEO.thatch, 0x9a7238); roof.scale.set(0.6, 0.55, 0.6); roof.position.y = 0.17; g.add(roof);
  return g;
}
// A weathered ruin — a broken plinth, standing & toppled columns, a fallen block.
// Sits ON the hex so an Ancient Ruin reads as ruins, not a floating icon (§10.2).
function buildRuinModel(): THREE.Group {
  const g = new THREE.Group();
  const stone = 0xc3bca9;
  const plinth = meshOf(GEO.slab, 0xb4ad9a); plinth.scale.set(0.7, 0.5, 0.7); plinth.position.y = 0.02; g.add(plinth);
  const cols: [number, number][] = [[0.30, 0.4], [0.19, 1.7], [0.28, 3.0], [0.12, 4.6], [0.24, 5.5]];
  for (let i = 0; i < cols.length; i += 1) {
    const [ch, a] = cols[i];
    const col = meshOf(GEO.column, i % 2 ? shade("#c3bca9", -0.07) : stone);
    col.scale.set(1.1, ch / 0.34, 1.1);
    col.position.set(Math.cos(a) * 0.17, ch * 0.5, Math.sin(a) * 0.17);
    if (i === 1) { col.rotation.z = 0.55; col.position.y = ch * 0.3; } // one toppling over
    g.add(col);
  }
  const fallen = meshOf(GEO.building, stone); fallen.scale.set(0.26, 0.12, 0.46); fallen.position.set(0.15, 0.05, -0.15); fallen.rotation.y = 0.6; g.add(fallen);
  return g;
}
// A little marble colonnaded temple — Rome's signature, shown even before the forum.
function addColonnadeTemple(g: THREE.Group, s: CivStyle, k: number, cx = 0, cz = 0): void {
  const marble = 0xeae3d0;
  const w = 0.44 * k, d = 0.3 * k, bh = 0.06 * k;
  const podium = meshOf(GEO.building, marble); podium.scale.set(w / 0.28, bh / 0.4, d / 0.28); podium.position.set(cx, bh * 0.5, cz); g.add(podium);
  const colH = 0.3 * k;
  for (let i = 0; i < 4; i += 1) {
    const tx = (i / 3 - 0.5) * w * 0.82;
    for (const zz of [d * 0.42, -d * 0.42]) {
      const col = meshOf(GEO.column, marble); col.scale.set(1.15, colH / 0.34, 1.15); col.position.set(cx + tx, bh + colH * 0.5, cz + zz); g.add(col);
    }
  }
  const roof = meshOf(GEO.roof, s.roofColor); roof.scale.set(w / 0.24 * 0.92, 0.62, d / 0.24 * 1.1); roof.rotation.y = Math.PI / 4; roof.position.set(cx, bh + colH + 0.04 * k, cz); g.add(roof);
}
// Stage 1 signature: a wooden palisade ring — a defended hamlet.
function addPalisade(g: THREE.Group): void {
  const n = 14, r = 0.5;
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2;
    const stake = meshOf(GEO.column, 0x6b4a2b, false);
    stake.scale.set(1.15, 0.62, 1.15);
    stake.position.set(Math.cos(a) * r, 0.1, Math.sin(a) * r);
    g.add(stake);
  }
}
// Stage 2 signature: a market stall (posts + striped awning) — trade arrives.
function addMarket(g: THREE.Group, cx: number, cz: number): void {
  for (const [x, z] of [[0.07, 0.07], [0.07, -0.07], [-0.07, 0.07], [-0.07, -0.07]]) {
    const post = meshOf(GEO.column, 0x8a6a44, false); post.scale.set(1, 0.55, 1); post.position.set(cx + x, 0.09, cz + z); g.add(post);
  }
  const awning = meshOf(GEO.slab, 0xb0603a); awning.scale.set(0.62, 1.2, 0.62); awning.position.set(cx, 0.22, cz); g.add(awning);
  const crate = meshOf(GEO.building, 0x8a6a44); crate.scale.set(0.32, 0.3, 0.32); crate.position.set(cx + 0.14, 0.05, cz + 0.02); g.add(crate);
}
// Stage 4+ signature: stone walls with corner towers (+ banners at stage 5).
function addWalls(g: THREE.Group, s: CivStyle, tier: number, banner: number): void {
  const wr = 0.76;
  const wc = shade("#" + s.wall.toString(16).padStart(6, "0"), -0.14);
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2;
    const seg = meshOf(GEO.wallSeg, wc);
    seg.position.set(Math.cos(a) * wr, 0.11, Math.sin(a) * wr);
    seg.rotation.y = a + Math.PI / 2;
    g.add(seg);
    const ta = a + Math.PI / 6, tx = Math.cos(ta) * wr, tz = Math.sin(ta) * wr;
    const tower = meshOf(GEO.building, wc); tower.scale.set(0.5, 0.95, 0.5); tower.position.set(tx, 0.19, tz); g.add(tower);
    if (tier >= 5) {
      const pole = meshOf(GEO.mast, 0x3a2a15, false); pole.scale.set(1, 1.3, 1); pole.position.set(tx, 0.52, tz); g.add(pole);
      const flag = meshOf(GEO.sail, banner); flag.scale.set(1, 0.5, 0.55); flag.position.set(tx + 0.06, 0.56, tz); g.add(flag);
    }
  }
}
// Stage 5 signature: a tall marble victory column with a gilded cap.
function addMonument(g: THREE.Group, s: CivStyle, cx: number, cz: number): void {
  const h = 0.9;
  const col = meshOf(GEO.pole, 0xeae3d0); col.scale.set(3.4, h / 0.72, 3.4); col.position.set(cx, h * 0.5, cz); g.add(col);
  const cap = meshOf(GEO.building, s.roofColor); cap.scale.set(0.5, 0.5, 0.5); cap.position.set(cx, h + 0.05, cz); g.add(cap);
}
function buildCity(pop: number, civ: string, color?: string): THREE.Group {
  const g = new THREE.Group();
  const s = CIV_STYLE[civ] || CIV_STYLE.rome;
  const banner = color ? new THREE.Color(color).getHex() : s.roofColor;
  // Six growth stages: 0 huts · 1 hamlet · 2 village · 3 town · 4 city · 5 metropolis.
  // Cities are FOUNDED as huts (stage 0) — capitals start at pop 2, so stage 0 spans pop 1–2.
  const tier = pop <= 2 ? 0 : pop <= 3 ? 1 : pop <= 5 ? 2 : pop <= 7 ? 3 : pop <= 9 ? 4 : 5;

  // Stage 0 (ground level): just a ring of primitive huts.
  if (tier === 0) {
    for (let i = 0; i < 3; i += 1) {
      const a = (i / 3) * Math.PI * 2 + 0.4;
      const hut = buildHut(s.wall);
      hut.position.set(Math.cos(a) * 0.17, 0, Math.sin(a) * 0.17);
      g.add(hut);
    }
    return g;
  }

  // Each stage gets a distinct signature so the six read apart at a glance.
  if (tier === 1) addPalisade(g);                                  // hamlet: palisade
  if (tier === 2) addMarket(g, 0, 0);                              // village: market
  if (tier >= 3) addLandmark(g, s, tier);                          // town+: the civ landmark
  if (civ === "rome" && tier < 3) addColonnadeTemple(g, s, 0.65 + tier * 0.12);
  if (tier >= 4) addWalls(g, s, tier, banner);                     // city+: walls + towers (+banners at 5)
  // Metropolis victory column — Rome's grandeur is its forum temple instead.
  if (tier >= 5 && civ !== "rome") addMonument(g, s, -0.24, -0.24);

  const houses = tier === 1 ? 3 : tier === 2 ? 5 : 2 + tier * 2;   // 3 / 5 / 8 / 10 / 12
  const rad = tier <= 1 ? 0.34 : tier === 2 ? 0.42 : 0.56;
  for (let i = 0; i < houses; i += 1) {
    const a = (i / houses) * Math.PI * 2 + 0.35;
    const h = 0.2 + (i % 3) * 0.06 + tier * 0.03;                  // taller buildings as the city grows
    const w = 0.14 + (i % 2) * 0.03 + tier * 0.006;
    addBuilding(g, s, Math.cos(a) * rad, Math.sin(a) * rad, w, h);
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
// A level-5 mountain: two rocky spikes of uneven height, each snow-capped. Placed
// on mountain tiles (which tower above everything else) so peaks read as the
// impassable summits of the elevation system.
function buildPeak(): THREE.Group {
  const g = new THREE.Group();
  // Modest twin spikes (was ~1.0/1.45 — too spire-like); a summit should cap the
  // L5 terrace, not tower over it.
  const spikes = [
    { x: -0.22, z: 0.12, h: 0.5, r: 0.44 },
    { x: 0.2, z: -0.14, h: 0.78, r: 0.52 }
  ];
  for (const s of spikes) {
    const rock = new THREE.Mesh(GEO.peakSpike, mat(0x6f685c));
    rock.castShadow = true;
    rock.scale.set(s.r / 0.4, s.h, s.r / 0.4);
    rock.position.set(s.x, s.h / 2, s.z);
    g.add(rock);
    const snowH = s.h * 0.34, snowR = s.r * 0.36;
    const snow = new THREE.Mesh(GEO.peakSnow, mat(0xeef2f6));
    snow.castShadow = true;
    snow.scale.set(snowR / 0.2, snowH / 0.4, snowR / 0.2);
    snow.position.set(s.x, s.h - snowH / 2, s.z);
    g.add(snow);
  }
  return g;
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
// Tile improvements, drawn as a small distinct structure on the ground.
function buildImprovement(imp: string): THREE.Group {
  const g = new THREE.Group();
  if (imp === "farm") {
    for (let i = 0; i < 4; i += 1) {
      const row = meshOf(GEO.beam, i % 2 ? 0xc9b061 : 0x8f9c4c, false);
      row.scale.set(0.46, 0.5, 0.85); row.position.set(-0.18 + i * 0.12, 0.03, 0); g.add(row);
    }
  } else if (imp === "vineyard") {
    for (let i = 0; i < 3; i += 1) for (let j = 0; j < 3; j += 1) {
      const v = meshOf(GEO.treeCone, 0x3f6b3a, false); v.scale.set(0.26, 0.55, 0.26);
      v.position.set(-0.16 + i * 0.16, 0.05, -0.16 + j * 0.16); g.add(v);
    }
  } else if (imp === "lumber-camp") {
    for (let i = 0; i < 3; i += 1) {
      const log = meshOf(GEO.trunk, i % 2 ? 0x6b4a2b : 0x7a5636); log.scale.set(2.2, 2.2, 2.2);
      log.rotation.x = Math.PI / 2; log.position.set(-0.08, 0.06 + i * 0.055, -0.12 + (i % 2) * 0.03); g.add(log);
    }
    const stump = meshOf(GEO.treeTrunk, 0x5a3d22); stump.scale.set(1.3, 0.9, 1.3); stump.position.set(0.15, 0.06, 0.12); g.add(stump);
  } else if (imp === "quarry") {
    const mound = meshOf(GEO.rock, 0xcabf9b); mound.scale.set(1.5, 1.0, 1.5); mound.position.set(-0.08, 0.07, -0.02); g.add(mound);
    for (let i = 0; i < 3; i += 1) { const b = meshOf(GEO.building, 0xd6cca6); b.scale.set(0.42, 0.4, 0.42); b.position.set(0.12 - i * 0.02, 0.06 + i * 0.07, 0.1); g.add(b); }
  } else if (imp === "mine") {
    const mound = meshOf(GEO.rock, 0x7d746a); mound.scale.set(1.7, 1.3, 1.7); mound.position.set(-0.04, 0.08, 0); g.add(mound);
    const adit = meshOf(GEO.building, 0x241f1b, false); adit.scale.set(0.34, 0.5, 0.3); adit.position.set(0.12, 0.09, 0); g.add(adit);
    const beam = meshOf(GEO.column, 0x4a331f, false); beam.scale.set(1, 0.7, 1); beam.position.set(0.12, 0.13, 0); g.add(beam);
  } else if (imp === "pasture") {
    const cow = buildAnimal(0x8a6a44); cow.scale.setScalar(0.9); g.add(cow);
    for (let i = 0; i < 5; i += 1) { const a = (i / 5) * Math.PI * 2; const post = meshOf(GEO.column, 0x6b4a2b, false); post.scale.set(0.8, 0.5, 0.8); post.position.set(Math.cos(a) * 0.24, 0.05, Math.sin(a) * 0.24); g.add(post); }
  } else if (imp === "trade-post") {
    const tent = meshOf(GEO.thatch, 0xd6b678); tent.scale.set(0.95, 0.85, 0.95); tent.position.set(0, 0.1, 0); g.add(tent);
    const crate = meshOf(GEO.building, 0x8a6a44); crate.scale.set(0.4, 0.4, 0.4); crate.position.set(0.16, 0.05, 0.1); g.add(crate);
  } else if (imp === "fishery") {
    // A little fishing boat and a line of stake-nets in the shallows.
    const hull = meshOf(GEO.building, 0x6b4a2b); hull.scale.set(0.5, 0.14, 0.24); hull.position.set(-0.05, 0.06, 0); g.add(hull);
    const mast = meshOf(GEO.column, 0x8a6a44, false); mast.scale.set(0.7, 1.0, 0.7); mast.position.set(-0.05, 0.14, 0); g.add(mast);
    for (let i = 0; i < 3; i += 1) { const p = meshOf(GEO.column, 0x5a3d22, false); p.scale.set(0.5, 0.7, 0.5); p.position.set(0.06 + i * 0.11, 0.09, 0.16 - i * 0.05); g.add(p); }
  } else if (imp === "harbour") {
    // A stone quay with a warehouse and mooring posts.
    const pier = meshOf(GEO.beam, 0xb7a483); pier.scale.set(0.8, 0.7, 0.34); pier.position.set(0, 0.05, 0); g.add(pier);
    const house = meshOf(GEO.building, 0xd0bb90); house.scale.set(0.36, 0.42, 0.34); house.position.set(-0.16, 0.13, 0); g.add(house);
    const boat = meshOf(GEO.building, 0x6b4a2b); boat.scale.set(0.42, 0.12, 0.2); boat.position.set(0.18, 0.06, 0.08); g.add(boat);
    for (let i = 0; i < 2; i += 1) { const post = meshOf(GEO.column, 0x5a3d22, false); post.scale.set(0.6, 0.8, 0.6); post.position.set(0.1 + i * 0.14, 0.1, -0.14); g.add(post); }
  } else if (imp !== "road") {
    const m = meshOf(GEO.building, 0x9a8f7a); m.scale.set(0.4, 0.4, 0.4); m.position.set(0, 0.06, 0); g.add(m);
  }
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

// A perfectly TILEABLE tangent-space normal map from layered simplex noise (sampled
// on a torus via noise4d so the edges wrap seamlessly). Procedural, no image assets —
// used for terrain micro-relief and the water surface. `octaves` = [frequency, amp].
function makeNoiseNormalMap(size: number, octaves: Array<[number, number]>, strength: number): THREE.CanvasTexture {
  const simplex = new SimplexNoise();
  const TAU = Math.PI * 2;
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y += 1) {
    const a2 = (y / size) * TAU;
    for (let x = 0; x < size; x += 1) {
      const a1 = (x / size) * TAU;
      let v = 0, amp = 0;
      for (const [f, a] of octaves) {
        v += a * simplex.noise4d(Math.cos(a1) * f, Math.sin(a1) * f, Math.cos(a2) * f, Math.sin(a2) * f);
        amp += a;
      }
      h[y * size + x] = v / amp;
    }
  }
  const at = (x: number, y: number) => h[(((y % size) + size) % size) * size + (((x % size) + size) % size)];
  const cv = document.createElement("canvas"); cv.width = cv.height = size;
  const ctx = cv.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const nx = -dx, ny = -dy, nz = 1;
      const len = Math.hypot(nx, ny, nz) || 1;
      const i = (y * size + x) * 4;
      img.data[i] = ((nx / len) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      img.data[i + 2] = ((nz / len) * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

// A tileable GRAYSCALE noise map in [lo, hi] (torus-sampled so it wraps). Used for
// terrain micro-roughness and faint albedo mottling — procedural, no assets.
function makeNoiseGrayMap(size: number, octaves: Array<[number, number]>, lo: number, hi: number, srgb = false): THREE.CanvasTexture {
  const simplex = new SimplexNoise();
  const TAU = Math.PI * 2;
  const cv = document.createElement("canvas"); cv.width = cv.height = size;
  const ctx = cv.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y += 1) {
    const a2 = (y / size) * TAU;
    for (let x = 0; x < size; x += 1) {
      const a1 = (x / size) * TAU;
      let v = 0, amp = 0;
      for (const [f, a] of octaves) {
        v += a * simplex.noise4d(Math.cos(a1) * f, Math.sin(a1) * f, Math.cos(a2) * f, Math.sin(a2) * f);
        amp += a;
      }
      const c = Math.max(0, Math.min(255, (lo + ((v / amp) * 0.5 + 0.5) * (hi - lo)) * 255));
      const i = (y * size + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = c; img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
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

  // Graphics quality (localStorage "hegemon_gfx": "high" default | "low"). HIGH runs
  // the full pipeline (ambient occlusion + antialiasing + env reflections + procedural
  // terrain/water textures); LOW drops the costly bits so it stays smooth on weak GPUs.
  const GFX = (() => { try { return window.localStorage.getItem("hegemon_gfx") || "high"; } catch { return "high"; } })();
  const HIGH = GFX !== "low";

  // Atmosphere (sky, clouds, mist, sun, rain) renders on its own layer so the AMBIENT
  // OCCLUSION pass can ignore it — otherwise GTAO treats the cloud/mist sprites as
  // solid occluders and smears big black quads across an overcast sky. The MAIN camera
  // sees both layers; the AO camera (built with the composer) sees only the default.
  const ATMO_LAYER = 2;
  const toAtmosphere = (o: THREE.Object3D) => o.traverse((x) => x.layers.set(ATMO_LAYER));

  const scene = new THREE.Scene();
  // A sky-dome gradient: light blue overhead fading to a deep-blue horizon (the
  // "not played" floor stays dark). Fog blends distant terrain into the horizon.
  scene.fog = new THREE.Fog(0x3f6fa3, 130, 420); // gentle — big maps shouldn't wash out
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(0xbfe0f7) },
      bottomColor: { value: new THREE.Color(0x0a1626) },
      offset: { value: 150 },
      exponent: { value: 0.5 }
    },
    vertexShader: "varying vec3 vWorld; void main(){ vWorld = (modelMatrix * vec4(position,1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: "uniform vec3 topColor; uniform vec3 bottomColor; uniform float offset; uniform float exponent; varying vec3 vWorld; void main(){ float h = normalize(vWorld + vec3(0.0, offset, 0.0)).y; gl_FragColor = vec4(mix(bottomColor, topColor, pow(clamp(h,0.0,1.0), exponent)), 1.0); }"
  });
  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(400, 24, 16), skyMat);
  scene.add(skyDome);
  toAtmosphere(skyDome);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 800);
  camera.layers.enable(ATMO_LAYER); // the main view shows the atmosphere; AO won't
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  // Orbit freely: drag to spin around the board and set the inclination yourself;
  // right-drag pans, wheel zooms. Bounded so you can't roll under the map or go
  // fully flat.
  controls.enableRotate = true;
  controls.minPolarAngle = 0.12; // near top-down
  controls.maxPolarAngle = 1.46; // low, near the horizon — lets the weather sky show
  controls.minDistance = 5;
  controls.maxDistance = 200;
  // Pan across the GROUND plane (XZ), not the tilted screen plane — otherwise a
  // right-drag while inclined would slide the focus below y=0 and dip the camera
  // under the board (you'd see the underside of the hexes). The loop also pins
  // the target to y=0 as a hard guarantee.
  controls.screenSpacePanning = false;
  controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

  // ---- Camera inclination (tilt) ----------------------------------------------
  // Tilt = the polar angle (small = top-down, large = toward the horizon). Dragging
  // already changes it; this adds a keyboard control ([ / ]) and a reset (Home), and
  // PERSISTS your chosen tilt as a lasting preset (localStorage) that survives new
  // maps and reloads. The API exposes these so a HUD button can drive them too.
  const TILT_KEY = "hegemon_cam_tilt";
  function clampPolar(p: number): number { return Math.max(controls.minPolarAngle + 0.02, Math.min(controls.maxPolarAngle - 0.02, p)); }
  function getTilt(): number { return new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target)).phi; }
  function setTilt(polar: number): void {
    const sph = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    sph.phi = clampPolar(polar);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sph));
    camera.lookAt(controls.target);
    controls.update();
  }
  function saveTilt(p: number): void { try { window.localStorage.setItem(TILT_KEY, p.toFixed(4)); } catch { /* ignore */ } }
  function loadTilt(): number | null { try { const v = parseFloat(window.localStorage.getItem(TILT_KEY) || ""); return Number.isFinite(v) ? v : null; } catch { return null; } }
  function nudgeTilt(delta: number): void { setTilt(getTilt() + delta); saveTilt(getTilt()); }
  function resetCamera(): void {
    if (boardBounds) {
      const cx = (boardBounds.minX + boardBounds.maxX) / 2, cz = (boardBounds.minZ + boardBounds.maxZ) / 2;
      const span = Math.max(boardBounds.maxX - boardBounds.minX, boardBounds.maxZ - boardBounds.minZ) || 20;
      controls.target.set(cx, 0, cz);
      camera.position.set(cx, span * 0.8, cz + span * 0.62);
      camera.lookAt(cx, 0, cz);
      controls.update();
    }
    try { window.localStorage.removeItem(TILT_KEY); } catch { /* ignore */ }
  }

  // Keyboard roaming (WASD / arrows) — glide the focus across the ground plane,
  // relative to where the camera is facing, at a speed that scales with zoom.
  const UP = new THREE.Vector3(0, 1, 0);
  const panKeys = new Set<string>();
  const PAN_VEC: Record<string, [number, number]> = { w: [0, 1], s: [0, -1], a: [-1, 0], d: [1, 0], arrowup: [0, 1], arrowdown: [0, -1], arrowleft: [-1, 0], arrowright: [1, 0] };
  const isTyping = () => { const el = document.activeElement as HTMLElement | null; return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable); };
  const onKeyDown = (e: KeyboardEvent) => {
    if (isTyping()) return;
    const k = e.key.toLowerCase();
    if (PAN_VEC[k]) { panKeys.add(k); if (k.startsWith("arrow")) e.preventDefault(); return; }
    if (k === "[") { nudgeTilt(-0.09); e.preventDefault(); }       // tilt toward top-down
    else if (k === "]") { nudgeTilt(0.09); e.preventDefault(); }   // tilt toward the horizon
    else if (k === "home") { resetCamera(); e.preventDefault(); }  // reset the framing
  };
  const onKeyUp = (e: KeyboardEvent) => { panKeys.delete(e.key.toLowerCase()); };
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  const ambLight = new THREE.AmbientLight(0xbfd4ff, 0.62);
  const hemiLight = new THREE.HemisphereLight(0xcfe4ff, 0x36342f, 0.5);
  scene.add(ambLight, hemiLight);
  const sun = new THREE.DirectionalLight(0xfff0d4, 1.15);
  sun.position.set(-26, 44, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(HIGH ? 4096 : 2048, HIGH ? 4096 : 2048); // sharper on HIGH
  Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 1, far: 220 });
  // Soften the PCF shadow edge and lift the acne/peter-panning off contact points.
  sun.shadow.radius = HIGH ? 3.5 : 2;
  sun.shadow.bias = -0.00035;
  sun.shadow.normalBias = 0.025;
  scene.add(sun, sun.target);

  const seaMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(6000, 6000),
    new THREE.MeshStandardMaterial({ color: 0x24446a, roughness: 0.35, metalness: 0.15 })
  );
  seaMesh.rotation.x = -Math.PI / 2;
  // THE sea surface. It sits at sea level (a hair under the tint hexes) and runs
  // unbroken across the board AND out past the edge, so there is exactly ONE water
  // level: the reflective, rippling plane. Discovered sea hexes only tint it for
  // depth; land and undiscovered tiles stand above it and hide it.
  seaMesh.position.y = SEA_TOP - 0.012;
  seaMesh.receiveShadow = true;
  scene.add(seaMesh);
  const seaMat = seaMesh.material as THREE.MeshStandardMaterial;
  // Living water: a tileable ripple normal map (scrolled each frame in the loop) plus
  // lower roughness + stronger env reflection so the sea catches the sky instead of
  // reading as a dead flat slab. HIGH only.
  let waterNormal: THREE.CanvasTexture | null = null;
  if (HIGH) {
    waterNormal = makeNoiseNormalMap(256, [[3, 1], [7, 0.55], [15, 0.28]], 1.7);
    waterNormal.repeat.set(220, 220);
    seaMat.normalMap = waterNormal;
    seaMat.normalScale = new THREE.Vector2(0.32, 0.32);
    seaMat.roughness = 0.22;
    seaMat.metalness = 0.1;
    seaMat.envMapIntensity = 1.4;
  }

  // ---- Sky weather: a soft radial texture reused for the sun disc and clouds ---
  function radialTexture(r: number, g: number, b: number, softness: number): THREE.CanvasTexture {
    const S = 128, cv = document.createElement("canvas"); cv.width = cv.height = S;
    const cx = cv.getContext("2d")!;
    const grad = cx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
    grad.addColorStop(softness, `rgba(${r},${g},${b},0.85)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    cx.fillStyle = grad; cx.fillRect(0, 0, S, S);
    const tex = new THREE.CanvasTexture(cv); tex.needsUpdate = true; return tex;
  }
  // The sun: a small bright disc inside a big soft warm glow, parked over the
  // northern horizon (positioned/sized to the board in buildTiles).
  const sunDisc = new THREE.Group();
  const sunGlowMat = new THREE.SpriteMaterial({ map: radialTexture(255, 234, 184, 0.12), transparent: true, opacity: 0, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending });
  const sunGlow = new THREE.Sprite(sunGlowMat); sunGlow.scale.set(2.8, 2.8, 1);
  const sunCoreMat = new THREE.SpriteMaterial({ map: radialTexture(255, 252, 235, 0.78), transparent: true, opacity: 0, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending });
  const sunCore = new THREE.Sprite(sunCoreMat); sunCore.scale.set(1.15, 1.15, 1);
  sunDisc.add(sunGlow, sunCore);
  sunDisc.position.set(-150, 150, -180);
  scene.add(sunDisc);
  toAtmosphere(sunDisc);
  // An overcast cloud deck: soft puffs drifting high over the board, faded in for
  // rain / storm / fog and hidden when it's clear.
  const cloudTex = radialTexture(240, 240, 244, 0.35);
  const cloudDeck = new THREE.Group();
  for (let i = 0; i < 14; i += 1) {
    const c = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: 0, depthWrite: false, color: 0xdfe4ea }));
    const a = (i / 14) * Math.PI * 2;
    c.position.set(Math.cos(a) * (40 + (i % 5) * 14), 60 + (i % 3) * 8, Math.sin(a) * (40 + (i % 4) * 16));
    const s = 42 + (i % 4) * 12; c.scale.set(s, s * 0.6, 1);
    cloudDeck.add(c);
  }
  scene.add(cloudDeck);
  toAtmosphere(cloudDeck);

  // A low GROUND MIST for fog weather — wide, soft, near-white sheets drifting just
  // above the surface so fog reads as more than a grey sky.
  const mistTex = radialTexture(214, 222, 226, 0.5);
  const mistDeck = new THREE.Group();
  for (let i = 0; i < 12; i += 1) {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: mistTex, transparent: true, opacity: 0, depthWrite: false, depthTest: false, color: 0xd2dade }));
    const a = (i / 12) * Math.PI * 2;
    m.position.set(Math.cos(a) * (16 + (i % 4) * 12), 1.3 + (i % 3) * 0.6, Math.sin(a) * (16 + (i % 3) * 12));
    const s = 30 + (i % 4) * 10; m.scale.set(s, s * 0.4, 1);
    mistDeck.add(m);
  }
  scene.add(mistDeck);
  toAtmosphere(mistDeck);
  let curMist = 0, lightningT = 4, lightningFlash = 0;

  // Per-weather scene mood. Colours are lerped toward these each frame so weather
  // transitions glide rather than snap.
  // `sea` is the colour of the ONE water surface — which, outside the border, is the
  // infinite OPEN OCEAN. That is deep water, so it must be the DARK of the two sea
  // tones (matching colorFor's deep 0x224d78), never the lighter coastal one; the
  // coast tint then lifts the shallows above it. Rain/storm/fog darken/grey it further.
  interface SkyMood { top: number; bottom: number; fog: number; fogNear: number; fogFar: number; sun: number; sunI: number; ambI: number; hemiI: number; sea: number; disc: number; cloud: number; }
  const WEATHER_SKY: Record<string, SkyMood> = {
    clear: { top: 0x9ad2f5, bottom: 0x0a1626, fog: 0xaed4ee, fogNear: 160, fogFar: 470, sun: 0xfff3dc, sunI: 1.65, ambI: 0.78, hemiI: 0.62, sea: 0x224d78, disc: 0.95, cloud: 0.0 },
    heat:  { top: 0xd6c294, bottom: 0x2a2415, fog: 0xe0d0a4, fogNear: 130, fogFar: 400, sun: 0xffe6b6, sunI: 1.7, ambI: 0.82, hemiI: 0.56, sea: 0x235069, disc: 0.85, cloud: 0.10 },
    fog:   { top: 0xaeb8bd, bottom: 0x4b535a, fog: 0xb4bdc2, fogNear: 40, fogFar: 190, sun: 0xd6dce0, sunI: 0.65, ambI: 0.78, hemiI: 0.6, sea: 0x46545e, disc: 0.0, cloud: 0.55 },
    rain:  { top: 0x5c6b79, bottom: 0x272f38, fog: 0x59636e, fogNear: 90, fogFar: 300, sun: 0xb9c4cf, sunI: 0.5, ambI: 0.55, hemiI: 0.5, sea: 0x2c4150, disc: 0.0, cloud: 0.85 },
    storm: { top: 0x3d4650, bottom: 0x1a1f26, fog: 0x39424c, fogNear: 70, fogFar: 250, sun: 0x9aa6b2, sunI: 0.34, ambI: 0.46, hemiI: 0.42, sea: 0x233040, disc: 0.0, cloud: 1.0 }
  };
  // Live colour objects we lerp; start at "clear".
  const skyTopC = new THREE.Color(WEATHER_SKY.clear.top);
  const skyBotC = new THREE.Color(WEATHER_SKY.clear.bottom);
  const fogC = new THREE.Color(WEATHER_SKY.clear.fog);
  const sunC = new THREE.Color(WEATHER_SKY.clear.sun);
  const seaC = new THREE.Color(WEATHER_SKY.clear.sea);
  let curSunI = WEATHER_SKY.clear.sunI, curAmbI = WEATHER_SKY.clear.ambI, curHemiI = WEATHER_SKY.clear.hemiI;
  let curFogNear = WEATHER_SKY.clear.fogNear, curFogFar = WEATHER_SKY.clear.fogFar;
  let curDisc = WEATHER_SKY.clear.disc, curCloud = 0;
  let moodTarget: SkyMood = WEATHER_SKY.clear;
  let moodName = "clear";
  // DAYLIGHT ONLY — no night, no moon (by request). `day` is held at full; the sun sits
  // at a steady, bright daytime elevation. (The machinery below still eases these, so a
  // night cycle can be restored just by animating the targets in render().) Weather
  // still dims/greys on top.
  let curDay = 1, dayTarget = 1;              // daylight (held at full)
  let curElev = 0.6, elevTarget = 0.6;        // sun elevation (radians) — bright mid-day
  let curAz = 0.3, azTarget = 0.3;            // sun azimuth offset from north (radians)
  const NIGHT_TOP = new THREE.Color(0x0b1b36), NIGHT_BOT = new THREE.Color(0x03060e);
  const MOON_TINT = new THREE.Color(0xbcc9e6), DUSK_TINT = new THREE.Color(0xffb163);

  // Rain/storm: a dense volume of falling STREAKS that follows the view, shown
  // only when a visible region is wet. Storm makes it heavier + darker. Each drop
  // is a vertical streak (a tall point sprite) and there are enough of them that
  // the fall reads as one continuous sheet rather than sparse flickering dots.
  const RAIN_N = 9000, RAIN_SPREAD = 80, RAIN_TOP = 42;
  const rainArr = new Float32Array(RAIN_N * 3);
  // Lay the drops on a JITTERED GRID (one per cell, randomised within the cell)
  // rather than pure random — pure random clumps into visible dense/sparse patches
  // that read as "intermittent". A grid gives an even, steady veil.
  const RAIN_COLS = Math.ceil(Math.sqrt(RAIN_N));
  for (let i = 0; i < RAIN_N; i += 1) {
    const gx = i % RAIN_COLS, gz = Math.floor(i / RAIN_COLS);
    rainArr[i * 3] = ((gx + Math.random()) / RAIN_COLS - 0.5) * RAIN_SPREAD;
    rainArr[i * 3 + 1] = Math.random() * RAIN_TOP;
    rainArr[i * 3 + 2] = ((gz + Math.random()) / RAIN_COLS - 0.5) * RAIN_SPREAD;
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute("position", new THREE.BufferAttribute(rainArr, 3));
  // A vertical streak texture so each "drop" is a thin falling line, not a dot.
  const rainStreak = (() => {
    const cv = document.createElement("canvas"); cv.width = 8; cv.height = 32;
    const g = cv.getContext("2d")!;
    const grad = g.createLinearGradient(0, 0, 0, 32);
    grad.addColorStop(0, "rgba(255,255,255,0)");
    grad.addColorStop(0.5, "rgba(255,255,255,0.9)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad; g.fillRect(3, 0, 2, 32);
    const t = new THREE.CanvasTexture(cv); t.needsUpdate = true; return t;
  })();
  const rainMat = new THREE.PointsMaterial({ map: rainStreak, color: 0xbcd0e4, size: 0.55, transparent: true, opacity: 0.5, depthWrite: false });
  const rain = new THREE.Points(rainGeo, rainMat);
  rain.visible = false;
  scene.add(rain);
  toAtmosphere(rain);
  let rainOn = false;
  let rainCX = 0, rainCZ = 0, rainS = 1; // wet-region centre + one uniform scale

  // A pointy-top hex prism. CylinderGeometry(...,6) is already pointy-top (a
  // vertex faces +Z), which matches axialToWorld — so do NOT rotate it, or the
  // tiles turn flat-top and no longer interlock. Circumradius ~= SIZE so hexes
  // nest edge-to-edge (a hair under, plus a slight base taper, for clean seams).
  const hexGeo = new THREE.CylinderGeometry(SIZE * 0.998, SIZE * 0.95, 1, 6);
  const hexMat = new THREE.MeshStandardMaterial({ roughness: 0.94, metalness: 0.02, flatShading: true });
  // Micro-detail on the land so tile tops read as GROUND, not painted card: a tileable
  // normal map (relief) + a roughness map (dry/damp patches catch light differently) +
  // a faint albedo mottle over the per-tile tint. All procedural, kept subtle.
  if (HIGH) {
    hexMat.normalMap = makeNoiseNormalMap(256, [[4, 1], [9, 0.5], [18, 0.25]], 2.4);
    hexMat.normalScale = new THREE.Vector2(0.5, 0.5);
    hexMat.roughnessMap = makeNoiseGrayMap(256, [[3, 1], [7, 0.5], [16, 0.3]], 0.72, 1.0);
    hexMat.map = makeNoiseGrayMap(256, [[5, 1], [11, 0.5]], 0.86, 1.0, true); // faint mottle × instance tint
  }
  // The sea is ONE reflective, rippling surface (the seaMesh plane at sea level). A
  // discovered sea hex is just a thin, semi-transparent TINT laid on that surface —
  // so the water is continuous and at a single level, and the hexes only carry DEPTH
  // (coast lighter, open sea darker) and fog. No second, stepped sea.
  const waterTintMat = new THREE.MeshStandardMaterial({
    transparent: true, opacity: 0.38, roughness: 0.3, metalness: 0.05,
    depthWrite: false, flatShading: true,
  });

  let tileMesh: THREE.InstancedMesh | null = null;
  // Continuous-landscape preview (docs/TERRAIN-RELIEF-SPEC.md). Behind a flag while it
  // matures: ?terrain=relief in the URL, or window.HG_TERRAIN = "relief". When on, the
  // hex prisms hide and one flowing displaced surface renders in their place.
  const RELIEF = (() => {
    try {
      // Continuous-landscape relief is the DEFAULT board now. Opt OUT with
      // ?terrain=flat (or classic/off/prisms), or window.HG_TERRAIN = "flat".
      const off = /(?:[?&])terrain=(flat|classic|off|prisms)\b/;
      if (typeof location !== "undefined" && off.test(location.search)) return false;
      const hg = typeof window !== "undefined" ? (window as unknown as { HG_TERRAIN?: string }).HG_TERRAIN : undefined;
      if (hg === "flat" || hg === "classic" || hg === "off") return false;
    } catch { /* headless → default on */ }
    return true;
  })();
  // Dev-only: ?scatter=off skips the instanced prop dressing (for clean terrain-shading
  // checkpoints — a full-map reveal would otherwise place thousands of instances).
  const NO_SCATTER = (() => {
    try { return typeof location !== "undefined" && /(?:[?&])scatter=off\b/.test(location.search); } catch { return false; }
  })();
  let terrainMesh: THREE.Mesh | null = null;
  let terrainSig = "";
  // The live surface sampler, set by buildTerrain — lets units/cities/improvements sit
  // ON the displaced ground instead of the old flat hex-prism tops.
  let reliefTileAt: TileAt | null = null;
  let waterSurface: THREE.Mesh | null = null;
  let waterTick: ((t: number) => void) | null = null;
  let waterTime = 0;
  // §6 climate-aware scatter on the relief: promoted prop models, instanced per tile.
  const reliefScatter = new THREE.Group();
  scene.add(reliefScatter);
  const propModels = new Map<string, { geo: THREE.BufferGeometry; mat: THREE.Material | THREE.Material[] }>();
  let propsTried = false;
  // Target heights so a stone pine reads tall and a wildflower low (world units).
  const PROP_H: Record<string, number> = {
    "scatter/olive": 0.85, "scatter/cypress": 1.1, "scatter/stone-pine": 1.0, "scatter/oak": 0.95,
    "scatter/beech": 0.95, "scatter/birch": 1.0, "scatter/fir": 1.05, "scatter/date-palm": 1.0,
    "scatter/dry-grass": 0.26, "scatter/wildflowers": 0.24, "scatter/heather-gorse": 0.3,
    "scatter/desert-scrub": 0.34, "scatter/reeds": 0.5, "scatter/papyrus": 0.7, "scatter/fallen-trunk": 0.3,
    "scatter/driftwood": 0.28, "scatter/rock-cluster": 0.34, "scatter/limestone-boulder": 0.4,
    "scatter/mossy-boulder": 0.42, "scatter/rock-shard": 0.5
  };
  const _pbox = new THREE.Box3(), _psz = new THREE.Vector3();
  function normalizeProp(scene0: THREE.Object3D, key: string): { geo: THREE.BufferGeometry; mat: THREE.Material | THREE.Material[] } | null {
    let mesh: THREE.Mesh | null = null;
    scene0.updateMatrixWorld(true);
    scene0.traverse((o) => { if (!mesh && (o as THREE.Mesh).isMesh) mesh = o as THREE.Mesh; });
    if (!mesh) return null;
    const src = mesh as THREE.Mesh;
    const geo = src.geometry.clone();
    geo.applyMatrix4(src.matrixWorld);          // bake the glTF transform into the geometry
    _pbox.setFromBufferAttribute(geo.getAttribute("position") as THREE.BufferAttribute);
    _pbox.getSize(_psz);
    const s = (PROP_H[key] ?? 0.4) / (_psz.y || 1);
    geo.translate(-(_pbox.min.x + _pbox.max.x) / 2, -_pbox.min.y, -(_pbox.min.z + _pbox.max.z) / 2); // centre XZ, feet to y=0
    geo.scale(s, s, s);
    return { geo, mat: src.material };
  }
  function ensurePropModels(): void {
    if (propsTried || typeof fetch === "undefined") return;
    propsTried = true;
    fetch("assets/approved/manifest.json").then((r) => (r.ok ? r.json() : null)).then((m) => {
      if (!m || !m.assets) return;
      const keys = Object.keys(m.assets).filter((k) => k.startsWith("scatter/"));
      for (const key of keys) {
        const rel = m.assets[key].path;
        gltfLoader.load(rel, (gltf) => {
          const norm = normalizeProp(gltf.scene, key);
          if (norm) { propModels.set(key, norm); terrainSig = ""; if (lastView) buildTerrain(lastView); }
        }, undefined, () => { /* not yet optimized — skip */ });
      }
    }).catch(() => {});
  }
  const _im = new THREE.Matrix4(), _iq = new THREE.Quaternion(), _iv = new THREE.Vector3(), _isc = new THREE.Vector3();
  const _scUp = new THREE.Vector3(0, 1, 0);
  const SCATTER_WATER = new Set(["sea", "coast"]);
  function placeReliefScatter(view: BoardView, tileAt: TileAt): void {
    reliefScatter.clear();
    reliefScatter.visible = true;
    if (NO_SCATTER) return;
    ensurePropModels();
    if (!propModels.size) return;
    const density = 1.0; // §6 global density (mobile tier ~0.4 — a quality-tier setting later)
    // Nile signature (§6): tiles touching a river carry papyrus / date-palms.
    const riverTiles = new Set<string>();
    for (const e of view.rivers || []) { riverTiles.add(e.q + "," + e.r); riverTiles.add(e.nq + "," + e.nr); }
    const byKey = new Map<string, Array<{ x: number; z: number; yaw: number; scale: number }>>();
    for (const tv of view.tiles) {
      if (tv.v === 0 || SCATTER_WATER.has(tv.t) || tv.open) continue; // no dressing on water/fog
      const places = pickScatter(tv.t, tv.q, tv.r, "mediterranean" as Climate, density, riverTiles.has(tv.q + "," + tv.r));
      if (!places.length) continue;
      const c = axialToWorld(tv.q, tv.r);
      for (const p of places) {
        let arr = byKey.get(p.key); if (!arr) { arr = []; byKey.set(p.key, arr); }
        arr.push({ x: c.x + p.dx, z: c.z + p.dz, yaw: p.yaw, scale: p.scale });
      }
    }
    for (const [key, places] of byKey) {
      const model = propModels.get(key);
      if (!model) continue;
      const inst = new THREE.InstancedMesh(model.geo, model.mat, places.length);
      inst.castShadow = true; inst.receiveShadow = true;
      for (let i = 0; i < places.length; i += 1) {
        const p = places[i];
        const y = sampleSurface(p.x, p.z, tileAt).y; // sink to the DISPLACED surface height
        _iq.setFromAxisAngle(_scUp, p.yaw);
        _iv.set(p.x, y, p.z); _isc.setScalar(p.scale);
        inst.setMatrixAt(i, _im.compose(_iv, _iq, _isc));
      }
      inst.instanceMatrix.needsUpdate = true;
      reliefScatter.add(inst);
    }
  }
  // Promoted terrain textures (slope-rock, alpine-snow, cliff-strata, mountain-scree),
  // loaded once from the asset manifest — swappable via the import pipeline, no code
  // change. Feed the §5 slope / §2b snow+scree / §2c cliff shader. Until they arrive the
  // surface is plain biome-coloured relief.
  let terrainRock: THREE.Texture | null = null;
  let terrainSnow: THREE.Texture | null = null;
  let terrainCliff: THREE.Texture | null = null;
  let terrainScree: THREE.Texture | null = null;
  let terrainTexTried = false;
  function ensureTerrainTextures(): void {
    if (terrainTexTried || typeof fetch === "undefined") return;
    terrainTexTried = true;
    fetch("assets/approved/manifest.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => {
        if (!m || !m.assets) return;
        const load = (key: string, set: (t: THREE.Texture) => void): void => {
          const rel = m.assets[key] && m.assets[key].path;
          if (!rel) return;
          new THREE.TextureLoader().load(rel, (tex) => {
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.colorSpace = THREE.SRGBColorSpace;
            set(tex);
            terrainSig = ""; // force a rebuild with the new texture
            if (lastView) buildTerrain(lastView);
          });
        };
        load("terrain/slope-rock", (t) => (terrainRock = t));
        load("terrain/alpine-snow", (t) => (terrainSnow = t));
        load("terrain/cliff-strata", (t) => (terrainCliff = t));
        load("terrain/mountain-scree", (t) => (terrainScree = t));
      })
      .catch(() => { /* manifest not present — stay procedural */ });
  }
  // Discovered sea hexes live in their OWN mesh: thin, semi-transparent tints that sit
  // ON the single reflective water surface (see waterTintMat) rather than opaque slabs
  // floating above it. Land + undiscovered tiles stay in tileMesh.
  let waterMesh: THREE.InstancedMesh | null = null;
  let indexByKey: Record<string, number> = {};
  let builtSig = "";
  // World-space extent of the current board (set in buildTiles). The loop clamps
  // the pan target to this box + a margin so you can't scroll off into the void.
  let boardBounds: { minX: number; maxX: number; minZ: number; maxZ: number } | null = null;

  const spriteGroup = new THREE.Group();
  scene.add(spriteGroup);
  const scatterGroup = new THREE.Group();
  scene.add(scatterGroup);
  const districtGroup = new THREE.Group();
  scene.add(districtGroup);
  const markerGroup = new THREE.Group(); // ruin / village discovery markers (§10)
  scene.add(markerGroup);
  const borderGroup = new THREE.Group();
  scene.add(borderGroup);

  // Districts (Cities v3 §5): a small procedural urban scene on each built hex
  // adjacent to a city. Rebuilt on each render() (not per-frame). buildDistrict
  // allocates fresh geometry/materials, so dispose the previous batch first.
  function placeDistricts(view: BoardView): void {
    districtGroup.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.geometry?.dispose();
        const mm = m.material as THREE.Material | THREE.Material[];
        if (Array.isArray(mm)) mm.forEach((x) => x.dispose()); else mm?.dispose();
      }
    });
    districtGroup.clear();
    for (const d of view.districts ?? []) {
      const w = axialToWorld(d.q, d.r);
      const top = groundY(d.t || "plains", w.x, w.z);
      // Attach the district to its city: shift it onto the city-facing edge of its
      // hex and lay a short paved path back toward the centre so the two read as one
      // growing settlement, not an isolated build.
      let px = w.x, pz = w.z; let ux = 0, uz = 0;
      if (d.cq != null && d.cr != null) {
        const cw = axialToWorld(d.cq, d.cr);
        const dx = cw.x - w.x, dz = cw.z - w.z, len = Math.hypot(dx, dz) || 1;
        ux = dx / len; uz = dz / len;
        px = w.x + ux * SIZE * 0.18; // a slight lean toward the city — the district still fills its hex
        pz = w.z + uz * SIZE * 0.18;
      }
      const seed = (((d.q * 73856093) ^ (d.r * 19349663)) >>> 0) % 100000;
      const model = buildDistrict(THREE, {
        type: d.type, style: cityStyleFor(d.style), seed, accent: d.accent, pillaged: d.pillaged, work: d.work
      }) as THREE.Group;
      model.scale.setScalar(1.5);       // fill the hex
      model.position.set(px, top + 0.01, pz);
      if (model.rotation) model.rotation.y = Math.atan2(-uz, ux); // face the approach
      districtGroup.add(model);
      if (ux || uz) {
        const plen = SIZE * 0.5;
        const path = new THREE.Mesh(new THREE.BoxGeometry(plen, 0.02, SIZE * 0.13), new THREE.MeshStandardMaterial({ color: 0xbdae8c, roughness: 0.96, metalness: 0, flatShading: true }));
        path.rotation.y = Math.atan2(-uz, ux);
        path.position.set(px + ux * plen * 0.5, top + 0.02, pz + uz * plen * 0.5);
        path.receiveShadow = true;
        districtGroup.add(path);
      }
    }
  }

  // Discovery markers (§10): a real MODEL on the hex for each un-excavated Ruin
  // (broken columns) and each Minor-People village (a cluster of thatched huts),
  // instead of a floating icon that read as a UI element. Rebuilt each render.
  function placeMarkers(view: BoardView): void {
    markerGroup.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && m.material) { const mm = m.material as THREE.Material | THREE.Material[]; if (Array.isArray(mm)) mm.forEach((x) => x.dispose()); else mm.dispose(); }
    });
    markerGroup.clear();
    for (const tv of view.tiles) {
      if (!tv.ruin && !tv.village) continue;
      const w = axialToWorld(tv.q, tv.r);
      const top = groundY(tv.t, w.x, w.z);
      let model: THREE.Group;
      if (tv.ruin) {
        model = buildRuinModel();
        model.scale.setScalar(1.7);
      } else {
        // A small cluster of huts — the village of a minor people.
        model = new THREE.Group();
        const h1 = buildHut(0xcaa06a); h1.position.set(-0.16, 0, 0.07); h1.scale.setScalar(1.05); model.add(h1);
        const h2 = buildHut(0xbf9560); h2.position.set(0.18, 0, -0.1); h2.scale.setScalar(0.85); model.add(h2);
        const h3 = buildHut(0xd0a878); h3.position.set(0.02, 0, 0.22); h3.scale.setScalar(0.7); model.add(h3);
        model.scale.setScalar(1.75);
      }
      model.position.set(w.x, top + 0.01, w.z);
      model.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      markerGroup.add(model);
    }
  }

  // Surface height for anything that sits ON the ground (units, cities, improvements,
  // flavour props). In relief mode this samples the displaced heightfield; otherwise
  // it's the flat hex-prism top.
  function groundY(t: string, wx: number, wz: number): number {
    return RELIEF && reliefTileAt ? sampleSurface(wx, wz, reliefTileAt).y : topOf(t);
  }

  // Trees on forests, rocks on hills/mountains, denser on timber/ore deposits —
  // only on fully-visible tiles (bounded by vision) and not where a unit/city sits.
  // In relief mode the decorative NATURE scatter (peaks/trees/rocks) is replaced by the
  // climate-aware relief scatter (placeReliefScatter); improvements + resource-flavour
  // props still render here, seated on the displaced surface.
  function placeScatter(view: BoardView): void {
    scatterGroup.clear();
    const occupied = new Set(view.sprites.map((s) => s.q + "," + s.r));
    for (const tv of view.tiles) {
      const w = axialToWorld(tv.q, tv.r);
      const top = groundY(tv.t, w.x, w.z);
      // Improvements are ground works — show them on any discovered tile, even
      // under a unit, so a farm/mine/vineyard is always visible.
      if (tv.imp && tv.imp !== "road" && tv.v >= 1) {
        const im = buildImprovement(tv.imp);
        im.position.set(w.x, top + 0.01, w.z);
        scatterGroup.add(im);
      }
      if (tv.v !== 2 || occupied.has(tv.q + "," + tv.r)) continue;
      if (!RELIEF) {
        // A mountain wears a snow-capped twin-spike peak instead of loose rocks.
        if (tv.t === "mountains") {
          const pk = buildPeak();
          pk.scale.setScalar(0.85 + rnd(tv.q, tv.r, 5) * 0.4);
          pk.rotation.y = rnd(tv.q, tv.r, 7) * Math.PI * 2;
          pk.position.set(w.x, top, w.z);
          scatterGroup.add(pk);
        }
        let trees = tv.t === "forest" ? 3 : 0;
        let rocks = tv.t === "highlands" ? 2 : tv.t === "hills" ? 1 : 0;
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
    // Re-origin the figure inside a WRAPPER whose (0,0,0) is at its FEET, centred
    // horizontally. Callers can then scale/position the wrapper freely without burying
    // it — a squad member set to y=0 keeps its feet on the tile, not its waist (the
    // Meshy models pivot at their centre, which used to sink them "into a swamp").
    obj.position.x -= (_box.min.x + _box.max.x) / 2;
    obj.position.y -= _box.min.y;
    obj.position.z -= (_box.min.z + _box.max.z) / 2;
    const wrap = new THREE.Group();
    wrap.add(obj);
    if (animate && entry.animations.length) {
      const mixer = new THREE.AnimationMixer(obj);
      mixer.clipAction(entry.animations[0]).play();
      mixers.push(mixer);
    }
    return wrap;
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
    if (waterMesh) {
      scene.remove(waterMesh);
      waterMesh.dispose();
    }
    const n = view.tiles.length;
    const mesh = new THREE.InstancedMesh(hexGeo, hexMat, n);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
    // Parallel mesh for the sea tints (same indices); paintTiles shows each tile in
    // exactly one of the two and collapses it (scale 0) in the other.
    const wmesh = new THREE.InstancedMesh(hexGeo, waterTintMat, n);
    wmesh.receiveShadow = true;
    wmesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
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
      wmesh.setMatrixAt(i, m); // paintTiles gives it the real (or collapsed) transform
      const key = tv.q + "," + tv.r;
      indexByKey[key] = i;
      keyByIndex.push(key);
      // Frame (and clamp panning to) the PLAYABLE map only — the open-ocean belt
      // around it would otherwise drag the camera out to fit thousands of empty hexes.
      if (!tv.open) {
        minX = Math.min(minX, w.x); maxX = Math.max(maxX, w.x);
        minZ = Math.min(minZ, w.z); maxZ = Math.max(maxZ, w.z);
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
    wmesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);
    scene.add(wmesh);
    tileMesh = mesh;
    waterMesh = wmesh;
    boardBounds = { minX, maxX, minZ, maxZ };
    // Frame the board once, on first build — start at a moderate inclination
    // (~38° off vertical), square-on. Drag to spin/tilt from here to taste.
    const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
    const span = Math.max(maxX - minX, maxZ - minZ) || 20;
    controls.target.set(cx, 0, cz);
    camera.position.set(cx, span * 0.8, cz + span * 0.62);
    // ONE bearing for both the sun's LIGHT and its visible DISC, relative to the board.
    // Previously the light sat at a fixed world point (so its angle drifted with the
    // map's size/position) while the disc was pinned due north regardless — you saw the
    // sun in one half of the sky and the glitter it should be casting in the other.
    // Anchoring both to the same vector means the reflection always falls beneath it.
    // Fit the shadow frustum to the board (a fixed +/-90 / far 220 missed big maps).
    // The sun's POSITION + the disc are driven every frame by the day/night arc in the
    // loop; here we only size the shadow camera and the disc to the board.
    const shadowHalf = Math.max(20, span * 0.85);
    Object.assign(sun.shadow.camera, { left: -shadowHalf, right: shadowHalf, top: shadowHalf, bottom: -shadowHalf, near: 1, far: Math.max(220, span * 6) });
    sun.shadow.camera.updateProjectionMatrix();
    // Size the disc like a sun, not a wall: it rides ~span*3 away, so span*0.12 puts the
    // glow near ~6° and the core ~2.5°, which bloom lifts into a real sun/moon.
    sunDisc.scale.setScalar(Math.max(2, span * 0.12));
    controls.update();
    // Restore the player's saved tilt preset over the default framing (once per map).
    const savedTilt = loadTilt();
    if (savedTilt != null) setTilt(savedTilt);
  }

  // Continuous-landscape surface (spec §2-3, step 1). Builds one displaced, biome-
  // coloured mesh from the view's tiles and swaps out the hex prisms. Rebuilds only
  // when the tile set changes. Painted biome textures blend in later via the same UVs.
  const _tc = new THREE.Color();
  function buildTerrain(view: BoardView): void {
    if (!RELIEF) return;
    const sig = view.tiles.length + ":" + (view.tiles[0] ? view.tiles[0].q + "," + view.tiles[0].r + "," + view.tiles[0].t : "");
    if (terrainMesh && sig === terrainSig) return;
    terrainSig = sig;
    if (terrainMesh) { scene.remove(terrainMesh); terrainMesh.geometry.dispose(); (terrainMesh.material as THREE.Material).dispose(); terrainMesh = null; }

    const byKey = new Map<string, TileView>();
    for (const t of view.tiles) byKey.set(t.q + "," + t.r, t);
    const tileAt = (q: number, r: number): TileSample | undefined => {
      const tv = byKey.get(q + "," + r);
      if (!tv) return undefined;
      _tc.copy(colorFor(tv, view.civColors));
      return { elev: elevationOf(tv.t), r: _tc.r, g: _tc.g, b: _tc.b, mtn: mountainnessOf(tv.t) };
    };
    reliefTileAt = tileAt; // units/cities/improvements now sample this for their height
    ensureTerrainTextures();
    terrainMesh = buildTerrainSurface(view.tiles, tileAt, { rock: terrainRock, snow: terrainSnow, cliff: terrainCliff, scree: terrainScree });
    scene.add(terrainMesh);
    // Hide the hex prisms + their sea tints; the reflective sea plane stays. scatterGroup
    // stays VISIBLE — in relief it now holds only improvements + resource-flavour props
    // (seated on the displaced surface via groundY); its decorative nature scatter is
    // skipped in placeScatter and replaced by the climate-aware relief scatter.
    if (tileMesh) tileMesh.visible = false;
    if (waterMesh) waterMesh.visible = false;
    scatterGroup.visible = true;

    // Water per WATER-SPEC (§2 depth gradient + §4 foam): replace the reflective sea
    // plane with the reference-driven shader surface over the terrain's flat sea.
    if (waterSurface) { scene.remove(waterSurface); waterSurface.geometry.dispose(); (waterSurface.material as THREE.Material).dispose(); }
    const landAt = (q: number, r: number): boolean => { const tv = byKey.get(q + "," + r); return !!tv && tv.t !== "sea" && tv.t !== "coast" && !tv.open; };
    const openAt = (q: number, r: number): number => { const tv = byKey.get(q + "," + r); return tv && tv.open ? tv.open : 0; };
    const wx = view.weather === "storm" ? 1 : view.weather === "rain" ? 0.5 : view.weather === "fog" ? 0.2 : 0;
    const water = buildWaterSurface({ tiles: view.tiles, landAt, openAt, seaLevel: SEA_TOP + 0.006, weather: wx });
    waterSurface = water.mesh; waterTick = water.tick;
    scene.add(waterSurface);
    if (seaMesh) seaMesh.visible = false;

    // §6 climate-aware scatter, instanced on the displaced surface (replaces the old
    // procedural scatter we hid above).
    placeReliefScatter(view, tileAt);
  }

  function colorFor(tv: TileView, civColors: Record<string, string>): THREE.Color {
    if (tv.v === 0) return HIDDEN.clone();
    // WATER is handled up front and kept unambiguously BLUE: no warm ownership
    // wash, no muddy dim, only a faint cool weather cast. (Territory over water is
    // shown by the coloured border, not a tint — a warm civ colour on blue read as
    // purple.) Depth/visibility change the shade, never the hue.
    if (tv.t === "sea" || tv.t === "coast") {
      // TWO depths, and the water surface underneath is already the DARK deep tone —
      // so open sea needs no lift (it matches the surface, in-map and out), while the
      // coast tint has to be bright enough to read as shallow through 38% opacity.
      const c = new THREE.Color(tv.t === "coast" ? 0x3f8bc0 : 0x224d78);
      if (tv.v === 1) c.multiplyScalar(0.72); // out of sight — darker, still blue
      if (tv.wx === "storm") c.lerp(new THREE.Color(0x1f2c3a), 0.3);
      else if (tv.wx === "rain") c.lerp(new THREE.Color(0x274661), 0.2);
      else if (tv.wx === "fog") c.lerp(new THREE.Color(0x5a6f7e), 0.18);
      return c;
    }
    const jitter = (((tv.q * 928371 + tv.r * 12547) % 17) / 17 - 0.5) * 0.06;
    const c = new THREE.Color(TERRAIN_COLOR[tv.t] ?? 0x808080).offsetHSL(0, 0, jitter);
    // Ownership tint. Over WATER it's kept very light — a strong wash of a warm
    // civ colour (Rome red, Carthage violet) over blue sea reads as purple/pink,
    // and the coloured border already shows who controls the water.
    if (tv.o && civColors[tv.o]) {
      const isWater = tv.t === "sea" || tv.t === "coast";
      c.lerp(new THREE.Color(civColors[tv.o]), isWater ? 0.05 : 0.17);
    }
    // Seen-but-not-visible keeps its DISCOVERED terrain colour, only dimmed.
    // Water dims toward a deep BLUE (multiplying it toward black went muddy-purple
    // once the warm ground-light hit the hex sides); land keeps the plain dim.
    if (tv.v === 1) {
      if (tv.t === "sea" || tv.t === "coast") c.lerp(new THREE.Color(0x16324f), 0.5);
      else c.multiplyScalar(0.62);
    }
    if (tv.h === 3) c.lerp(GOLD, 0.55);
    else if (tv.h === 4) c.lerp(SELGREEN, 0.5);
    else if (tv.h === 2) c.lerp(RED, 0.5);
    else if (tv.h === 7) c.lerp(GOLD, 0.6); // trade destination
    else if (tv.h === 1) c.lerp(GREEN, 0.4);
    else if (tv.h === 5) c.lerp(PATH, 0.4);
    if (tv.h === 6) c.lerp(WHITE, 0.55);
    // Weather gives a SUBTLE atmospheric cast — never enough to wash a visible
    // tile out to the pale "undiscovered" look.
    if (tv.wx === "rain") c.lerp(new THREE.Color(0x4a5a6e), 0.15);
    else if (tv.wx === "storm") c.lerp(new THREE.Color(0x2f3742), 0.26);
    else if (tv.wx === "fog") c.lerp(new THREE.Color(0xaab4bc), 0.18);
    else if (tv.wx === "heat") c.lerp(new THREE.Color(0xd88a3a), 0.11);
    return c;
  }

  const _pm = new THREE.Matrix4(), _pp = new THREE.Vector3(), _ps = new THREE.Vector3(), _pq = new THREE.Quaternion();
  function paintTiles(view: BoardView): void {
    if (!tileMesh) return;
    for (const tv of view.tiles) {
      const idx = indexByKey[tv.q + "," + tv.r];
      if (idx == null) continue;
      const w = axialToWorld(tv.q, tv.r);
      const col = colorFor(tv, view.civColors);
      // DISCOVERED SEA is not a slab at all: the reflective plane below IS the water,
      // and this hex is only a thin translucent tint on it carrying depth + fog. It
      // therefore renders in waterMesh and is collapsed in the opaque tileMesh.
      // Everything else (land, and undiscovered tiles lying FLAT as a blank map)
      // renders in tileMesh and is collapsed in waterMesh.
      const water = tv.v !== 0 && WATER.has(tv.t);
      if (water && waterMesh) {
        // The OPEN OCEAN beyond the border carries no depth to show, so it wears no
        // tint at all — you just see the bare reflective, rippling water, exactly as
        // it looked before the belt existed. It only appears when highlighted (a
        // reachable/attack hex for a fleet). Clicks out there hit the sea plane
        // instead (see pickIndex), so ships stay selectable on blank ocean.
        const bare = !!tv.open && !tv.h;
        waterMesh.setColorAt(idx, col);
        _pp.set(w.x, SEA_TOP, w.z);
        _ps.set(bare ? 0 : 1, bare ? 0 : 0.02, bare ? 0 : 1); // a wafer laid on the water
        _pm.compose(_pp, _pq, _ps);
        waterMesh.setMatrixAt(idx, _pm);
        _ps.set(0, 0, 0); // collapse in the land mesh
        _pm.compose(_pp, _pq, _ps);
        tileMesh.setMatrixAt(idx, _pm);
      } else {
        tileMesh.setColorAt(idx, col);
        const top = tv.v === 0 ? HIDDEN_ELEV : topOf(tv.t);
        const height = Math.max(0.12, top - FLOOR);
        _pp.set(w.x, top - height / 2, w.z);
        _ps.set(1, height, 1);
        _pm.compose(_pp, _pq, _ps);
        tileMesh.setMatrixAt(idx, _pm);
        if (waterMesh) { _ps.set(0, 0, 0); _pm.compose(_pp, _pq, _ps); waterMesh.setMatrixAt(idx, _pm); }
      }
    }
    if (tileMesh.instanceColor) tileMesh.instanceColor.needsUpdate = true;
    tileMesh.instanceMatrix.needsUpdate = true;
    if (waterMesh) {
      if (waterMesh.instanceColor) waterMesh.instanceColor.needsUpdate = true;
      waterMesh.instanceMatrix.needsUpdate = true;
    }
  }

  const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false });
  // A slim floating health bar drawn as ONE camera-facing sprite: the whole bar
  // (dark backing + coloured fill) is painted on a cached canvas texture, so the
  // backing and the fill can never drift apart into two separate lines. Textures
  // and materials are cached per ~5% HP bucket to avoid per-frame allocation.
  const hpBarMatCache: Record<number, THREE.SpriteMaterial> = {};
  function hpBarMaterial(frac: number): THREE.SpriteMaterial {
    const bucket = Math.round(Math.max(0, Math.min(1, frac)) * 20);
    if (hpBarMatCache[bucket]) return hpBarMatCache[bucket];
    const W = 64, H = 12, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const cx = cv.getContext("2d")!;
    cx.fillStyle = "rgba(8,6,2,0.92)"; cx.fillRect(0, 0, W, H); // dark backing + border
    const f = bucket / 20;
    cx.fillStyle = f > 0.6 ? "#5cc94f" : f > 0.3 ? "#e3a12b" : "#d23f2c";
    const pad = 2;
    cx.fillRect(pad, pad, Math.max(0, (W - pad * 2) * f), H - pad * 2); // fill
    const tex = new THREE.CanvasTexture(cv); tex.needsUpdate = true;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false });
    hpBarMatCache[bucket] = mat;
    return mat;
  }
  function makeHpBar(frac: number, width: number): THREE.Sprite {
    const spr = new THREE.Sprite(hpBarMaterial(frac));
    spr.scale.set(width, width * (12 / 64), 1);
    spr.renderOrder = 997;
    return spr;
  }

  // Movement gliding that survives back-to-back re-renders. render() often runs
  // twice in a row (the human's move, then the AI turn) with no frame in between,
  // which used to wipe the tween before it drew. So motion lives in a PERSISTENT
  // per-unit record: each render just re-points it at the freshly rebuilt holder
  // and updates the target tile, and the loop keeps chasing the target each frame.
  interface Motion { cx: number; cz: number; tx: number; tz: number; holder: THREE.Object3D; model: THREE.Object3D; baseY: number; }
  let unitMotion: Record<string, Motion> = {};
  function placeSprites(view: BoardView): void {
    spriteGroup.clear();
    mixers = [];
    const liveIds = new Set<string>();
    // Fan out units that share a tile so a stacked "army" reads as a cluster.
    const tileUnitCount: Record<string, number> = {};
    for (const s of view.sprites) if (s.kind !== "city") { const tk = s.q + "," + s.r; tileUnitCount[tk] = (tileUnitCount[tk] || 0) + 1; }
    const tileUnitOrd: Record<string, number> = {};
    for (const sv of view.sprites) {
      const w = axialToWorld(sv.q, sv.r);
      const top = groundY(sv.t || "plains", w.x, w.z); // seat on the (displaced) surface
      const color = sv.color || "#cccccc";
      const isCity = sv.kind === "city";
      const frac = sv.hpFrac == null ? 1 : sv.hpFrac;
      const holder = new THREE.Group(); // moves as one; model pieces are LOCAL to it
      // Where this unit sits within its tile (fanned out if it shares an army).
      let ox = 0, oz = 0, stackN = 1;
      if (!isCity) {
        const tk = sv.q + "," + sv.r;
        stackN = tileUnitCount[tk] || 1;
        const ord = tileUnitOrd[tk] = (tileUnitOrd[tk] || 0);
        tileUnitOrd[tk] = ord + 1;
        if (stackN > 1) { const p = squadPositions(stackN)[ord] || [0, 0]; ox = p[0] * 2.4; oz = p[1] * 2.4; }
      }

      // Prefer real glTF art if the conventional file exists; else the procedural
      // low-poly placeholder. Either way it sits ON the tile and casts a shadow.
      let model: THREE.Object3D;
      let scale: number;
      if (isCity) {
        const glb = getGLB("assets/models/cities/" + sv.civ + ".glb");
        if (glb) { model = glbInstance(glb, 1.4, false); scale = 1; }
        else {
          // v2 procedural city: 10 tiers, 12 styles, seeded by hex so it's stable.
          const tier = sv.tier != null ? sv.tier : cityTierForPop(sv.pop || 1);
          const seed = (((sv.q * 73856093) ^ (sv.r * 19349663)) >>> 0) % 100000;
          model = buildCityV2(THREE, { tier, style: cityStyleFor(sv.civ), seed, accent: sv.color }) as THREE.Group;
          scale = 1.15; // fill the hex
        }
      } else {
        const form = sv.form || "infantry";
        // Prefer a model for the SPECIFIC unit type (warrior.glb, legionary.glb, …);
        // fall back to the generic form model (infantry.glb, elephant.glb, …). Missing
        // files are cached and cost nothing after the first 404.
        const glb = (sv.utype ? getGLB("assets/models/units/" + sv.utype + ".glb") : null)
          || getGLB("assets/models/units/" + form + ".glb");
        if (glb) {
          const single = form === "siege" || form === "naval";
          // More, smaller figures so a unit reads as a formation (and leaves room for
          // the terrain and the buildings to come). Height is the FINAL size — the
          // feet-anchored wrapper means no extra scaling is needed.
          const base = form === "elephant" ? 2 : form === "mounted" ? 4 : form === "civilian" ? 2 : 9;
          const memberH = single ? 0.85 : form === "elephant" ? 0.6 : form === "mounted" ? 0.5 : 0.4;
          const count = single ? 1 : Math.max(1, Math.round(base * Math.max(0.05, Math.min(1, frac))));
          const grp = new THREE.Group();
          const pos = squadPositions(count);
          for (let i = 0; i < count; i += 1) {
            const f = glbInstance(glb, memberH, true);
            if (!single) { f.position.set(pos[i][0], 0, pos[i][1]); f.rotation.y = (rnd(sv.q, sv.r, i) - 0.5) * 0.6; }
            grp.add(f);
          }
          model = grp; scale = 1;
        } else { model = buildUnit(form, color, frac, sv.q, sv.r, sv.civ, sv.utype); scale = 1.35; }
      }
      model.scale.setScalar(scale);
      model.position.set(ox, top + 0.01, oz);
      holder.add(model);

      const shadow = new THREE.Mesh(shadowGeo, shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(ox, top + 0.02, oz);
      const sh = isCity ? 1.7 : 1.0;
      shadow.scale.set(sh, sh, 1);
      holder.add(shadow);

      if (isCity && sv.garrison && sv.garrison > 0) {
        const gfig = buildFigure(sv.gForm || "infantry", sv.gColor || color, sv.civ);
        gfig.scale.setScalar(0.85);
        gfig.position.set(SIZE * 0.34, top + 0.01, SIZE * 0.5);
        holder.add(gfig);
        if (sv.garrison > 1) {
          const gb = new THREE.Sprite(new THREE.SpriteMaterial({ map: glyphTexture("×" + sv.garrison), transparent: true, depthWrite: false, depthTest: false }));
          gb.center.set(0.5, 0); gb.scale.set(0.5, 0.5, 0.5); gb.position.set(SIZE * 0.34, top + 0.62, SIZE * 0.5); gb.renderOrder = 999;
          holder.add(gb);
        }
      }

      if (sv.badge) {
        const b = new THREE.Sprite(new THREE.SpriteMaterial({ map: glyphTexture(sv.badge), transparent: true, depthWrite: false, depthTest: false }));
        b.center.set(0.5, 0); b.scale.set(0.5, 0.5, 0.5); b.position.set(ox, top + (isCity ? 1.5 : 1.05), oz); b.renderOrder = 999;
        holder.add(b);
      }

      // Health bar over every unit and city (sits over each unit in a stack).
      if (sv.hpFrac != null) {
        const bar = makeHpBar(sv.hpFrac, isCity ? 1.5 : 0.95);
        bar.position.set(ox, top + (isCity ? 1.28 : 0.86), oz);
        holder.add(bar);
      }

      // Army count over a stacked tile (once, on the first unit, at tile centre).
      if (stackN > 1 && (tileUnitOrd[sv.q + "," + sv.r] === 1)) {
        const cb = new THREE.Sprite(new THREE.SpriteMaterial({ map: glyphTexture("⚔" + stackN), transparent: true, depthWrite: false, depthTest: false }));
        cb.center.set(0.5, 0); cb.scale.set(0.6, 0.6, 0.6); cb.position.set(0, top + 1.5, 0); cb.renderOrder = 999;
        holder.add(cb);
      }

      // Position the holder, gliding from wherever it currently sits toward its new
      // tile (cities never glide — they don't move).
      const id = sv.id || (sv.kind.charAt(0) + ":" + sv.q + "," + sv.r);
      liveIds.add(id);
      const m = unitMotion[id];
      if (!isCity && m) {
        m.tx = w.x; m.tz = w.z; m.holder = holder; m.model = model; m.baseY = model.position.y;
        holder.position.set(m.cx, 0, m.cz);
      } else {
        holder.position.set(w.x, 0, w.z);
        if (!isCity) unitMotion[id] = { cx: w.x, cz: w.z, tx: w.x, tz: w.z, holder, model, baseY: model.position.y };
      }
      spriteGroup.add(holder);
    }
    // Drop motion records for units that died or left view (keep the map bounded).
    for (const id in unitMotion) if (!liveIds.has(id)) delete unitMotion[id];
  }

  // ---- Combat strike effect: an expanding ring + flash at the target tile ----
  const fxGroup = new THREE.Group();
  scene.add(fxGroup);
  const strikeRingGeo = new THREE.TorusGeometry(0.4, 0.09, 6, 20);
  const strikeCoreGeo = new THREE.IcosahedronGeometry(0.34, 0);
  interface Strike { objs: THREE.Object3D[]; mats: THREE.MeshBasicMaterial[]; t: number; dur: number; }
  let strikes: Strike[] = [];
  function strike(q: number, r: number): void {
    const w = axialToWorld(q, r);
    let top = 0.1;
    if (lastView) { const tv = lastView.tiles.find((t) => t.q === q && t.r === r); if (tv) top = groundY(tv.t, w.x, w.z); }
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffc247, transparent: true, opacity: 0.95, depthWrite: false, depthTest: false });
    const ring = new THREE.Mesh(strikeRingGeo, ringMat); ring.rotation.x = -Math.PI / 2; ring.position.set(w.x, top + 0.45, w.z); ring.scale.setScalar(0.4); ring.renderOrder = 998;
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 1, depthWrite: false, depthTest: false });
    const core = new THREE.Mesh(strikeCoreGeo, coreMat); core.position.set(w.x, top + 0.5, w.z); core.renderOrder = 998;
    fxGroup.add(ring, core);
    strikes.push({ objs: [ring, core], mats: [ringMat, coreMat], t: 0, dur: 0.5 });
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
  const riverGeo = new THREE.BoxGeometry(1, 0.06, 0.17);
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
    const heightOf = (q: number, r: number): number => { const t = terrainByKey[q + "," + r] || "plains"; const w = axialToWorld(q, r); return groundY(t, w.x, w.z); };
    roadMesh = drawEdges(view.roads, roadGeo, roadMat, 0.05, true, heightOf, roadMesh);
    // Rivers flow ALONG the path (centre to centre) like roads, so consecutive
    // segments join into one continuous waterway instead of disjoint edge-bars.
    riverMesh = drawEdges(view.rivers, riverGeo, riverMat, 0.04, true, heightOf, riverMesh);
  }

  function pickIndex(cx: number, cy: number): number {
    if (!tileMesh) return -1;
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((cx - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((cy - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    // Land lives in tileMesh and discovered sea in waterMesh — hit-test BOTH (they
    // share instance indices) so the sea stays clickable for ship orders.
    const hit = raycaster.intersectObjects(waterMesh ? [tileMesh, waterMesh] : [tileMesh], false);
    if (hit.length && hit[0].instanceId != null) return hit[0].instanceId as number;
    // Nothing solid under the cursor: the OPEN OCEAN wears no tint hexes, so fall back
    // to the water surface itself and work out which hex was clicked from the point.
    const sea = raycaster.intersectObject(seaMesh, false);
    if (sea.length) {
      const a = worldToAxial(sea[0].point.x, sea[0].point.z);
      const idx = indexByKey[a.q + "," + a.r];
      if (idx != null) return idx;
    }
    return -1;
  }

  let dX = 0, dY = 0, pointerDown = false;
  // Suppress the browser context menu so a right-drag PAN isn't interrupted
  // (an interrupted right-drag was leaving the camera controls stuck).
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  canvas.addEventListener("mousemove", (e) => {
    if (!hoverFn || pointerDown) return; // don't recompute hover mid-drag
    const id = pickIndex(e.clientX, e.clientY);
    hoverFn(id >= 0 ? keyByIndex[id] : null);
  });
  canvas.addEventListener("mousedown", (e) => { dX = e.clientX; dY = e.clientY; pointerDown = true; });
  canvas.addEventListener("mouseleave", () => { pointerDown = false; });
  canvas.addEventListener("mouseup", (e) => {
    pointerDown = false;
    if (e.button !== 0) return; // only the LEFT button selects (right-drag pans)
    if (!pickFn || Math.abs(e.clientX - dX) + Math.abs(e.clientY - dY) > 5) return;
    const id = pickIndex(e.clientX, e.clientY);
    pickFn(id >= 0 ? keyByIndex[id] : null);
  });

  // SKY-DERIVED reflections: PMREM an equirect gradient (zenith blue → horizon →
  // darker ground) so marble, bronze, water and metal reflect the SKY rather than a
  // neutral studio — cohesive with the board's daylight. Procedural, no HDRI asset.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const gradCv = document.createElement("canvas"); gradCv.width = 8; gradCv.height = 128;
  const gctx = gradCv.getContext("2d")!;
  const grad = gctx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, "#c6e4fb"); grad.addColorStop(0.47, "#84b3de");
  grad.addColorStop(0.53, "#5f7788"); grad.addColorStop(1, "#39434e");
  gctx.fillStyle = grad; gctx.fillRect(0, 0, 8, 128);
  const gradTex = new THREE.CanvasTexture(gradCv);
  gradTex.mapping = THREE.EquirectangularReflectionMapping;
  gradTex.colorSpace = THREE.SRGBColorSpace; gradTex.needsUpdate = true;
  const envMap = pmrem.fromEquirectangular(gradTex).texture;
  gradTex.dispose();
  scene.environment = envMap;
  scene.environmentIntensity = HIGH ? 0.6 : 0.4; // a sheen, not a mirror

  const cw = () => canvas.clientWidth || 800;
  const ch = () => canvas.clientHeight || 600;

  // Post-processing chain: render -> ground-truth ambient occlusion (contact shadows
  // where models meet the land, walls meet towers — the biggest "reads as 3D" lift) ->
  // subtle bloom -> antialiasing (SMAA) -> tone-mapped output. AO + SMAA are HIGH-only.
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  // The AO pass renders the scene through THIS camera, which never enables the
  // atmosphere layer — so sky/clouds/mist never become AO occluders. Kept in sync
  // with the real camera each frame (below).
  let aoCam: THREE.PerspectiveCamera | null = null;
  if (HIGH) {
    const gtao = new GTAOPass(scene, camera, cw(), ch());
    gtao.output = GTAOPass.OUTPUT.Default;
    gtao.blendIntensity = 0.85;
    gtao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.0, thickness: 1.0, scale: 1.0, samples: 16 });
    aoCam = new THREE.PerspectiveCamera(camera.fov, camera.aspect, camera.near, camera.far);
    gtao.camera = aoCam; // default layers = layer 0 only (no atmosphere)
    composer.addPass(gtao);
  }
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.32, 0.6, 0.85);
  composer.addPass(bloom);
  if (HIGH) composer.addPass(new SMAAPass());
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
  let stormy = false;
  const loop = () => {
    if (!running) return;
    // WASD / arrow-key roaming: slide target + camera together across the ground.
    if (panKeys.size && !isTyping()) {
      const fwd = new THREE.Vector3();
      camera.getWorldDirection(fwd); fwd.y = 0;
      if (fwd.lengthSq() > 1e-6) {
        fwd.normalize();
        const right = new THREE.Vector3().crossVectors(fwd, UP).normalize();
        const move = new THREE.Vector3();
        for (const k of panKeys) { const v = PAN_VEC[k]; move.addScaledVector(right, v[0]); move.addScaledVector(fwd, v[1]); }
        if (move.lengthSq() > 1e-6) {
          move.normalize().multiplyScalar(camera.position.distanceTo(controls.target) * 0.016);
          controls.target.add(move); camera.position.add(move);
        }
      }
    }
    controls.update();
    // Keep the focus on the ground plane and inside the map. With the target
    // pinned to y=0 and the polar angle bounded below the horizon, the eye stays
    // above the board (camera.y = dist·cos(polar) > 0) — you can't scroll under
    // the hexes — and the XZ clamp stops you panning off into empty space.
    controls.target.y = 0;
    if (boardBounds) {
      const margin = 8; // a little breathing room past the edge tiles
      controls.target.x = Math.min(Math.max(controls.target.x, boardBounds.minX - margin), boardBounds.maxX + margin);
      controls.target.z = Math.min(Math.max(controls.target.z, boardBounds.minZ - margin), boardBounds.maxZ + margin);
    }
    const dt = animClock.getDelta();
    for (const m of mixers) m.update(dt);
    if (waterTick) { waterTime += dt; waterTick(waterTime); } // animate §2/§4 water
    // Glide moving units toward their target tile at a steady march pace, with a
    // little up-down bounce. Chasing a persistent target (not a one-shot tween)
    // means the glide survives the double render() that a turn triggers.
    const MARCH = 7.0; // world units / second
    for (const id in unitMotion) {
      const mo = unitMotion[id];
      const dx = mo.tx - mo.cx, dz = mo.tz - mo.cz;
      const d = Math.hypot(dx, dz);
      if (d < 0.002) {
        if (mo.cx !== mo.tx || mo.cz !== mo.tz) { mo.cx = mo.tx; mo.cz = mo.tz; mo.holder.position.set(mo.cx, 0, mo.cz); }
        if (mo.model.position.y !== mo.baseY) mo.model.position.y = mo.baseY;
        continue;
      }
      const step = Math.min(d, MARCH * dt);
      mo.cx += (dx / d) * step;
      mo.cz += (dz / d) * step;
      mo.holder.position.x = mo.cx;
      mo.holder.position.z = mo.cz;
      mo.model.position.y = mo.baseY + Math.abs(Math.sin((mo.cx + mo.cz) * 2.6)) * 0.06;
    }
    // Combat strikes: the ring expands and everything fades out, then is disposed.
    for (let i = strikes.length - 1; i >= 0; i -= 1) {
      const s = strikes[i];
      s.t += dt / s.dur;
      const k = s.t < 1 ? s.t : 1;
      s.objs[0].scale.setScalar(0.4 + k * 2.2);
      s.objs[1].scale.setScalar(Math.max(0.05, 1 - k * 0.9));
      s.objs[1].position.y += dt * 0.5;
      for (const m of s.mats) m.opacity = 0.95 * (1 - k);
      if (k >= 1) { for (const o of s.objs) fxGroup.remove(o); for (const m of s.mats) m.dispose(); strikes.splice(i, 1); }
    }
    if (rainOn) {
      // Rain falls ONLY over the wet region's footprint (not the whole board).
      rain.position.set(rainCX, 0, rainCZ);
      rain.scale.set(rainS, 1, rainS);
      const pos = rainGeo.getAttribute("position") as THREE.BufferAttribute;
      const fall = (stormy ? 46 : 30) * dt;
      const arr = pos.array as Float32Array;
      for (let i = 1; i < arr.length; i += 3) {
        arr[i] -= fall;
        if (arr[i] < 0) arr[i] = RAIN_TOP;
      }
      pos.needsUpdate = true;
    }
    // Ease the whole scene toward the current weather mood (sky, sun, sea, fog).
    const kw = Math.min(1, dt * 1.4);
    skyTopC.lerp(new THREE.Color(moodTarget.top), kw);
    skyBotC.lerp(new THREE.Color(moodTarget.bottom), kw);
    fogC.lerp(new THREE.Color(moodTarget.fog), kw);
    sunC.lerp(new THREE.Color(moodTarget.sun), kw);
    seaC.lerp(new THREE.Color(moodTarget.sea), kw);
    curSunI += (moodTarget.sunI - curSunI) * kw;
    curAmbI += (moodTarget.ambI - curAmbI) * kw;
    curHemiI += (moodTarget.hemiI - curHemiI) * kw;
    curFogNear += (moodTarget.fogNear - curFogNear) * kw;
    curFogFar += (moodTarget.fogFar - curFogFar) * kw;
    curDisc += (moodTarget.disc - curDisc) * kw;
    curCloud += (moodTarget.cloud - curCloud) * kw;
    // Ease the day/night factor + the sun's arc alongside the weather.
    curDay += (dayTarget - curDay) * kw;
    curElev += (elevTarget - curElev) * kw;
    curAz += (azTarget - curAz) * kw;
    const warm = Math.max(0, 1 - curElev / 0.55) * Math.min(1, curDay * 2); // golden near the horizon

    // Weather sets the palette; DAY/NIGHT scales the light and sinks the sky to night.
    skyMat.uniforms.topColor.value.copy(NIGHT_TOP).lerp(skyTopC, curDay);
    skyMat.uniforms.bottomColor.value.copy(NIGHT_BOT).lerp(skyBotC, 0.25 + 0.75 * curDay);
    if (scene.fog) { (scene.fog as THREE.Fog).color.copy(NIGHT_BOT).lerp(fogC, 0.35 + 0.65 * curDay); (scene.fog as THREE.Fog).near = curFogNear; (scene.fog as THREE.Fog).far = curFogFar; }
    // Sun light: warm near the horizon, cool moonlight at night; intensity follows the
    // daylight with a faint moon floor so night is dark but never pitch black.
    sun.color.copy(sunC).lerp(DUSK_TINT, warm * 0.55).lerp(MOON_TINT, 1 - Math.min(1, curDay * 1.6));
    sun.intensity = curSunI * (0.05 + curDay);
    ambLight.intensity = 0.15 + curAmbI * (0.3 + 0.7 * curDay);
    hemiLight.intensity = curHemiI * (0.28 + 0.72 * curDay);
    seaMat.color.copy(seaC).multiplyScalar(0.32 + 0.68 * curDay); // the sea goes dark at night
    if (waterNormal) { waterNormal.offset.x = (waterNormal.offset.x + dt * 0.018) % 1; waterNormal.offset.y = (waterNormal.offset.y + dt * 0.011) % 1; } // drifting ripples

    // Place the sun (light + disc) on its arc: azimuth swings around north, elevation
    // rises to noon. The disc rides the SAME vector, so it always sits over its glitter.
    if (boardBounds) {
      const scx = (boardBounds.minX + boardBounds.maxX) / 2, scz = (boardBounds.minZ + boardBounds.maxZ) / 2;
      const sspan = Math.max(boardBounds.maxX - boardBounds.minX, boardBounds.maxZ - boardBounds.minZ) || 30;
      const ce = Math.cos(curElev), se = Math.sin(curElev);
      const dx = Math.sin(curAz) * ce, dy = se, dz = -Math.cos(curAz) * ce; // north = -z
      sun.position.set(scx + dx * sspan * 1.4, dy * sspan * 1.4, scz + dz * sspan * 1.4);
      sun.target.position.set(scx, 0, scz); sun.target.updateMatrixWorld();
      sunDisc.position.set(scx + dx * sspan * 3, Math.max(sspan * 0.05, dy * sspan * 3), scz + dz * sspan * 3);
    }
    // The disc is the SUN by day, a pale MOON by night (same sprite, retinted). Weather
    // still hides it (rain/fog/storm have disc 0).
    sunCoreMat.color.copy(MOON_TINT).lerp(new THREE.Color(0xfff6e0), curDay);
    sunGlowMat.color.copy(new THREE.Color(0x9fb8e0)).lerp(new THREE.Color(0xffe4ad), curDay);
    sunGlowMat.opacity = curDisc * (0.3 + 0.55 * curDay); sunCoreMat.opacity = curDisc * (0.55 + 0.45 * curDay);
    sunDisc.visible = curDisc > 0.02;
    cloudDeck.visible = curCloud > 0.02;
    for (const c of cloudDeck.children) {
      (c as THREE.Sprite).position.x += dt * 1.2; // slow drift
      if ((c as THREE.Sprite).position.x > 110) (c as THREE.Sprite).position.x -= 220;
      ((c as THREE.Sprite).material as THREE.SpriteMaterial).opacity = curCloud * 0.75;
    }
    // Ground mist for fog weather.
    curMist += ((moodName === "fog" ? 0.6 : 0) - curMist) * kw;
    mistDeck.visible = curMist > 0.02;
    for (const m of mistDeck.children) {
      (m as THREE.Sprite).position.x += dt * 0.6;
      if ((m as THREE.Sprite).position.x > 80) (m as THREE.Sprite).position.x -= 160;
      ((m as THREE.Sprite).material as THREE.SpriteMaterial).opacity = curMist;
    }
    // Storm lightning: an occasional bright flash across the whole scene.
    if (moodName === "storm") {
      lightningT -= dt;
      if (lightningT <= 0) { lightningFlash = 1; lightningT = 3 + Math.random() * 7; }
    }
    if (lightningFlash > 0.001) {
      lightningFlash = Math.max(0, lightningFlash - dt * 4);
      const boost = lightningFlash * lightningFlash; // sharp falloff
      ambLight.intensity += boost * 1.8; // add onto the day/night-modulated base
      sun.intensity += boost * 1.4;
      skyMat.uniforms.topColor.value.lerp(new THREE.Color(0xe6ecf2), boost);
    }
    if (aoCam) { // keep the AO camera exactly on the real camera (minus the atmosphere layer)
      aoCam.fov = camera.fov; aoCam.aspect = camera.aspect; aoCam.near = camera.near; aoCam.far = camera.far;
      aoCam.updateProjectionMatrix();
      aoCam.position.copy(camera.position); aoCam.quaternion.copy(camera.quaternion);
      aoCam.updateMatrixWorld(true);
    }
    composer.render();
    requestAnimationFrame(loop);
  };
  loop();

  return {
    render(view) {
      lastView = view;
      buildTiles(view);
      paintTiles(view);
      buildTerrain(view); // continuous-landscape surface (flagged) — after paint, so colours are current
      placeSprites(view);
      placeScatter(view);
      placeDistricts(view);
      placeMarkers(view);
      drawBorders(view);
      drawWaterways(view);
      // Rain over the wet region's footprint — but only when a real part of the
      // ON-SCREEN map is actually under the front. A single wet tile at the edge
      // used to trigger a full downpour every few turns ("intermittent rain"); now
      // the drops show only if a meaningful fraction of visible tiles are wet.
      stormy = false;
      let wetCount = 0, visCount = 0;
      let mnX = Infinity, mxX = -Infinity, mnZ = Infinity, mxZ = -Infinity;
      for (const t of view.tiles) {
        // Count the PLAYABLE visible map only. The open-ocean belt is thousands of
        // always-visible tiles; letting it into the denominator sank the wet fraction
        // below the threshold and brought back the on/off "intermittent" rain.
        if (t.v !== 2 || t.open) continue;
        visCount += 1;
        if (t.wx !== "rain" && t.wx !== "storm") continue;
        wetCount += 1;
        if (t.wx === "storm") stormy = true;
        const w = axialToWorld(t.q, t.r);
        if (w.x < mnX) mnX = w.x; if (w.x > mxX) mxX = w.x;
        if (w.z < mnZ) mnZ = w.z; if (w.z > mxZ) mxZ = w.z;
      }
      const wet = wetCount > 0 && wetCount / Math.max(1, visCount) >= 0.34;
      stormy = wet && stormy;
      rainOn = wet;
      rain.visible = wet;
      if (wet) {
        rainCX = (mnX + mxX) / 2; rainCZ = (mnZ + mxZ) / 2;
        // ONE uniform scale (square) so the veil is never stretched thin on one
        // axis — a square field over the wet footprint keeps the density even.
        const ext = Math.max(mxX - mnX, mxZ - mnZ) + SIZE * 4;
        rainS = Math.max(0.7, Math.min(1.4, ext / RAIN_SPREAD));
      }
      rainMat.opacity = stormy ? 0.75 : 0.5;
      rainMat.color.set(stormy ? 0x8fa4bc : 0xaec4dc);
      // Overall sky mood — sunny is bright with a sun disc; overcast greys it out.
      moodName = view.weather || "clear";
      moodTarget = WEATHER_SKY[moodName] || WEATHER_SKY.clear;
      // DAY ONLY: full daylight, a steady bright sun kept high enough to read as day
      // and low enough to stay visible above its own glitter. No night, no moon.
      dayTarget = 1;
      elevTarget = 0.6;
      azTarget = 0.3;
      if (view.focus) {
        const w = axialToWorld(view.focus.q, view.focus.r);
        controls.target.set(w.x, 0, w.z);
      }
    },
    onPick(fn) { pickFn = fn; },
    onHover(fn) { hoverFn = fn; },
    strike,
    resize,
    nudgeTilt,
    resetCamera,
    getTilt,
    // Move the camera to frame a tile, preserving the current angle + distance.
    focusTile(q: number, r: number): void {
      const w = axialToWorld(q, r);
      const off = camera.position.clone().sub(controls.target);
      controls.target.set(w.x, 0, w.z);
      camera.position.copy(controls.target).add(off);
      camera.lookAt(controls.target);
      controls.update();
    },
    // Diagnostics for the relief/scatter checkpoint screenshots (dev only).
    reliefDebug(): Record<string, unknown> {
      let instances = 0;
      reliefScatter.traverse((o) => { const im = o as THREE.InstancedMesh; if (im.isInstancedMesh) instances += im.count; });
      return {
        relief: RELIEF,
        terrainMesh: !!terrainMesh,
        textures: { rock: !!terrainRock, snow: !!terrainSnow, cliff: !!terrainCliff, scree: !!terrainScree },
        propModels: propModels.size,
        scatterMeshes: reliefScatter.children.length,
        scatterInstances: instances,
        camTarget: { x: +controls.target.x.toFixed(2), z: +controls.target.z.toFixed(2) },
        camPos: { x: +camera.position.x.toFixed(2), y: +camera.position.y.toFixed(2), z: +camera.position.z.toFixed(2) }
      };
    },
    dispose() { running = false; window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); renderer.dispose(); }
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
