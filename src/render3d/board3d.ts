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
export interface TileView { q: number; r: number; t: string; v: number; o: string | null; h: number; road?: boolean; imp?: string; }
export interface SpriteView { civ: string; kind: "unit" | "city"; name: string; q: number; r: number; badge?: string; color?: string; t?: string; form?: string; pop?: number; }
export interface BorderView { q: number; r: number; nq: number; nr: number; color: string; }
export interface BoardView {
  tiles: TileView[];
  sprites: SpriteView[];
  borders: BorderView[];
  civColors: Record<string, string>;
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
  torso: new THREE.CylinderGeometry(0.11, 0.16, 0.34, 6),
  head: new THREE.IcosahedronGeometry(0.1, 0),
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
  rock: new THREE.IcosahedronGeometry(0.15, 0)
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
function buildUnit(form: string, color: string): THREE.Group {
  const g = new THREE.Group();
  const armor = shade(color, 0);
  const figure = (lift = 0) => {
    const t = meshOf(GEO.torso, armor); t.position.set(0, 0.2 + lift, 0); g.add(t);
    const h = meshOf(GEO.head, SKIN); h.position.set(0, 0.44 + lift, 0); g.add(h);
  };
  if (form === "spear") {
    figure();
    const spear = meshOf(GEO.pole, WOOD); spear.position.set(0.13, 0.32, 0.02); g.add(spear);
    const sh = meshOf(GEO.shield, shade(color, -0.15)); sh.position.set(-0.12, 0.22, 0.03); g.add(sh);
  } else if (form === "ranged") {
    figure();
    const bow = meshOf(GEO.bow, WOOD); bow.position.set(0.13, 0.28, 0); bow.rotation.z = Math.PI / 2; g.add(bow);
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
    figure();
    const pack = meshOf(GEO.building, WOOD); pack.scale.set(0.5, 0.4, 0.45); pack.position.set(-0.13, 0.24, 0); g.add(pack);
  } else {
    // infantry / heavy
    figure();
    const sh = meshOf(GEO.shield, shade(color, -0.15)); sh.position.set(-0.12, 0.22, 0.04); g.add(sh);
    const sword = meshOf(GEO.pole, STEEL); sword.scale.set(1, 0.42, 1); sword.position.set(0.13, 0.26, 0); g.add(sword);
  }
  return g;
}
function buildCity(pop: number, color: string): THREE.Group {
  const g = new THREE.Group();
  const roofC = shade(color, -0.02), roofD = shade(color, -0.16);
  const keepH = 1.0 + Math.min(6, pop) * 0.08;
  const keep = meshOf(GEO.building, STONE); keep.scale.set(0.95, keepH / 0.4, 0.95); keep.position.y = keepH * 0.5; g.add(keep);
  const kr = meshOf(GEO.roof, roofC); kr.scale.set(1, 1, 1); kr.position.y = keepH + 0.1; kr.rotation.y = Math.PI / 4; g.add(kr);
  const n = Math.min(7, 2 + pop);
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2 + 0.4;
    const rad = 0.36;
    const hx = Math.cos(a) * rad, hz = Math.sin(a) * rad;
    const hgt = 0.26 + (i % 3) * 0.07;
    const house = meshOf(GEO.building, STONE); house.scale.set(0.52, hgt / 0.4, 0.52); house.position.set(hx, hgt * 0.5, hz); g.add(house);
    const hr = meshOf(GEO.roof, i % 2 ? roofC : roofD); hr.scale.set(0.55, 0.7, 0.55); hr.position.set(hx, hgt + 0.06, hz); hr.rotation.y = Math.PI / 4; g.add(hr);
  }
  return g;
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
  const borderGroup = new THREE.Group();
  scene.add(borderGroup);
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
    for (const sv of view.sprites) {
      const w = axialToWorld(sv.q, sv.r);
      const top = topOf(sv.t || "plains"); // the tile's real surface height
      const color = sv.color || "#cccccc";

      // Build a low-poly 3D model that sits ON the tile and casts a real shadow.
      const isCity = sv.kind === "city";
      const model = isCity ? buildCity(sv.pop || 1, color) : buildUnit(sv.form || "infantry", color);
      const scale = isCity ? 1.15 : 1.5;
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
      drawBorders(view);
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
