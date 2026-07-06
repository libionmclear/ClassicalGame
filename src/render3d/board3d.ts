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
export interface TileView { q: number; r: number; t: string; v: number; o: string | null; h: number; road?: boolean; imp?: string; res?: string | null; wx?: string; }
export interface SpriteView { civ: string; kind: "unit" | "city"; name: string; q: number; r: number; id?: string; badge?: string; color?: string; t?: string; form?: string; utype?: string; pop?: number; hpFrac?: number; garrison?: number; gForm?: string | null; gColor?: string; }
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
  strike(q: number, r: number): void;
  resize(): void;
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
function buildUnit(form: string, color: string, hpFrac: number, q: number, r: number, civ?: string, utype?: string): THREE.Group {
  const frac = hpFrac == null ? 1 : Math.max(0.05, Math.min(1, hpFrac));
  const single = form === "siege" || form === "naval";
  const base = form === "elephant" ? 2 : form === "mounted" ? 3 : form === "civilian" ? 3 : 6;
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
// A primitive round thatched hut — the very first stage of a settlement.
function buildHut(wallColor: number): THREE.Group {
  const g = new THREE.Group();
  const wall = meshOf(GEO.roundWall, wallColor); wall.scale.set(0.52, 0.5, 0.52); wall.position.y = 0.075; g.add(wall);
  const roof = meshOf(GEO.thatch, 0x9a7238); roof.scale.set(0.6, 0.55, 0.6); roof.position.y = 0.17; g.add(roof);
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
  // A sky-dome gradient: light blue overhead fading to a deep-blue horizon (the
  // "not played" floor stays dark). Fog blends distant terrain into the horizon.
  scene.fog = new THREE.Fog(0x3f6fa3, 70, 180);
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

  // Rain/storm: a volume of falling streaks that follows the view, shown only when
  // a visible region is wet. Storm makes it heavier + darker.
  const RAIN_N = 1600, RAIN_SPREAD = 70, RAIN_TOP = 42;
  const rainArr = new Float32Array(RAIN_N * 3);
  for (let i = 0; i < RAIN_N; i += 1) {
    rainArr[i * 3] = (Math.random() - 0.5) * RAIN_SPREAD;
    rainArr[i * 3 + 1] = Math.random() * RAIN_TOP;
    rainArr[i * 3 + 2] = (Math.random() - 0.5) * RAIN_SPREAD;
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute("position", new THREE.BufferAttribute(rainArr, 3));
  const rainMat = new THREE.PointsMaterial({ color: 0xaec4dc, size: 0.16, transparent: true, opacity: 0.55, depthWrite: false });
  const rain = new THREE.Points(rainGeo, rainMat);
  rain.visible = false;
  scene.add(rain);
  let rainOn = false;
  let rainCX = 0, rainCZ = 0, rainSX = 1, rainSZ = 1; // wet-region footprint

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
      // Improvements are ground works — show them on any discovered tile, even
      // under a unit, so a farm/mine/vineyard is always visible.
      if (tv.imp && tv.imp !== "road" && tv.v >= 1) {
        const wp = axialToWorld(tv.q, tv.r);
        const im = buildImprovement(tv.imp);
        im.position.set(wp.x, topOf(tv.t) + 0.01, wp.z);
        scatterGroup.add(im);
      }
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
    // Seen-but-not-visible keeps its DISCOVERED terrain colour, only dimmed.
    if (tv.v === 1) c.multiplyScalar(0.6);
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
      tileMesh.setColorAt(idx, colorFor(tv, view.civColors));
      // Height follows visibility: undiscovered tiles lie FLAT (a blank map, no
      // hex relief); discovered/visible tiles rise to their terrain elevation.
      const w = axialToWorld(tv.q, tv.r);
      const top = tv.v === 0 ? HIDDEN_ELEV : topOf(tv.t);
      const height = Math.max(0.12, top - FLOOR);
      _pp.set(w.x, (top + FLOOR) / 2, w.z);
      _ps.set(1, height, 1);
      _pm.compose(_pp, _pq, _ps);
      tileMesh.setMatrixAt(idx, _pm);
    }
    if (tileMesh.instanceColor) tileMesh.instanceColor.needsUpdate = true;
    tileMesh.instanceMatrix.needsUpdate = true;
  }

  const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false });
  // Movement gliding: each sprite lives in a holder at its tile; when the same id
  // reappears at a new tile we start it at the OLD spot and tween it across.
  let spritePrevPos: Record<string, { x: number; z: number }> = {};
  interface MoveTween { holder: THREE.Object3D; model: THREE.Object3D; baseY: number; fx: number; fz: number; tx: number; tz: number; t: number; dur: number; }
  let moveTweens: MoveTween[] = [];
  function placeSprites(view: BoardView): void {
    spriteGroup.clear();
    mixers = [];
    moveTweens = [];
    const newPos: Record<string, { x: number; z: number }> = {};
    for (const sv of view.sprites) {
      const w = axialToWorld(sv.q, sv.r);
      const top = topOf(sv.t || "plains"); // the tile's real surface height
      const color = sv.color || "#cccccc";
      const isCity = sv.kind === "city";
      const frac = sv.hpFrac == null ? 1 : sv.hpFrac;
      const holder = new THREE.Group(); // moves as one; model pieces are LOCAL to it

      // Prefer real glTF art if the conventional file exists; else the procedural
      // low-poly placeholder. Either way it sits ON the tile and casts a shadow.
      let model: THREE.Object3D;
      let scale: number;
      if (isCity) {
        const glb = getGLB("assets/models/cities/" + sv.civ + ".glb");
        if (glb) { model = glbInstance(glb, 1.4, false); scale = 1; }
        else { model = buildCity(sv.pop || 1, sv.civ, sv.color); scale = 1.2; }
      } else {
        const form = sv.form || "infantry";
        const glb = getGLB("assets/models/units/" + form + ".glb");
        if (glb) {
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
        } else { model = buildUnit(form, color, frac, sv.q, sv.r, sv.civ, sv.utype); scale = 1.35; }
      }
      model.scale.setScalar(scale);
      model.position.set(0, top + 0.01, 0);
      holder.add(model);

      const shadow = new THREE.Mesh(shadowGeo, shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(0, top + 0.02, 0);
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
        b.center.set(0.5, 0); b.scale.set(0.5, 0.5, 0.5); b.position.set(0, top + (isCity ? 1.5 : 1.05), 0); b.renderOrder = 999;
        holder.add(b);
      }

      // Position the holder, gliding from its previous tile if it just moved.
      const id = sv.id || (sv.kind.charAt(0) + ":" + sv.q + "," + sv.r);
      const prev = spritePrevPos[id];
      if (!isCity && prev && (Math.abs(prev.x - w.x) > 0.02 || Math.abs(prev.z - w.z) > 0.02)) {
        holder.position.set(prev.x, 0, prev.z);
        const dist = Math.hypot(w.x - prev.x, w.z - prev.z);
        moveTweens.push({ holder, model, baseY: model.position.y, fx: prev.x, fz: prev.z, tx: w.x, tz: w.z, t: 0, dur: Math.min(0.7, 0.14 + dist * 0.05) });
      } else {
        holder.position.set(w.x, 0, w.z);
      }
      newPos[id] = { x: w.x, z: w.z };
      spriteGroup.add(holder);
    }
    spritePrevPos = newPos;
  }

  // ---- Combat strike effect: an expanding ring + flash at the target tile ----
  const fxGroup = new THREE.Group();
  scene.add(fxGroup);
  const strikeRingGeo = new THREE.TorusGeometry(0.4, 0.09, 6, 20);
  const strikeCoreGeo = new THREE.IcosahedronGeometry(0.34, 0);
  interface Strike { objs: THREE.Object3D[]; mats: THREE.MeshBasicMaterial[]; t: number; dur: number; }
  let strikes: Strike[] = [];
  function strike(q: number, r: number): void {
    let top = 0.1;
    if (lastView) { const tv = lastView.tiles.find((t) => t.q === q && t.r === r); if (tv) top = topOf(tv.t); }
    const w = axialToWorld(q, r);
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
    const heightOf = (q: number, r: number): number => topOf(terrainByKey[q + "," + r] || "plains");
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
    const hit = raycaster.intersectObject(tileMesh);
    return hit.length && hit[0].instanceId != null ? (hit[0].instanceId as number) : -1;
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
  let stormy = false;
  const loop = () => {
    if (!running) return;
    controls.update();
    const dt = animClock.getDelta();
    for (const m of mixers) m.update(dt);
    // Glide moving units between tiles (ease + a little marching bounce).
    for (let i = moveTweens.length - 1; i >= 0; i -= 1) {
      const tw = moveTweens[i];
      tw.t += dt / tw.dur;
      const k = tw.t < 1 ? tw.t : 1;
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      tw.holder.position.x = tw.fx + (tw.tx - tw.fx) * e;
      tw.holder.position.z = tw.fz + (tw.tz - tw.fz) * e;
      tw.model.position.y = tw.baseY + Math.abs(Math.sin(k * Math.PI * 3)) * 0.05;
      if (k >= 1) { tw.model.position.y = tw.baseY; moveTweens.splice(i, 1); }
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
      rain.scale.set(rainSX, 1, rainSZ);
      const pos = rainGeo.getAttribute("position") as THREE.BufferAttribute;
      const fall = (stormy ? 46 : 30) * dt;
      const arr = pos.array as Float32Array;
      for (let i = 1; i < arr.length; i += 3) {
        arr[i] -= fall;
        if (arr[i] < 0) arr[i] = RAIN_TOP;
      }
      pos.needsUpdate = true;
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
      placeSprites(view);
      placeScatter(view);
      drawBorders(view);
      drawWaterways(view);
      // Rain only over the wet region's footprint: measure the bounds of the
      // visible rain/storm tiles and size the drop volume to just cover them.
      let wet = false; stormy = false;
      let mnX = Infinity, mxX = -Infinity, mnZ = Infinity, mxZ = -Infinity;
      for (const t of view.tiles) {
        if (t.v !== 2 || (t.wx !== "rain" && t.wx !== "storm")) continue;
        wet = true;
        if (t.wx === "storm") stormy = true;
        const w = axialToWorld(t.q, t.r);
        if (w.x < mnX) mnX = w.x; if (w.x > mxX) mxX = w.x;
        if (w.z < mnZ) mnZ = w.z; if (w.z > mxZ) mxZ = w.z;
      }
      rainOn = wet;
      rain.visible = wet;
      if (wet) {
        rainCX = (mnX + mxX) / 2; rainCZ = (mnZ + mxZ) / 2;
        rainSX = Math.max(0.12, (mxX - mnX + SIZE * 2) / RAIN_SPREAD);
        rainSZ = Math.max(0.12, (mxZ - mnZ + SIZE * 2) / RAIN_SPREAD);
      }
      rainMat.opacity = stormy ? 0.75 : 0.5;
      rainMat.color.set(stormy ? 0x8fa4bc : 0xaec4dc);
      if (view.focus) {
        const w = axialToWorld(view.focus.q, view.focus.r);
        controls.target.set(w.x, 0, w.z);
      }
    },
    onPick(fn) { pickFn = fn; },
    onHover(fn) { hoverFn = fn; },
    strike,
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
