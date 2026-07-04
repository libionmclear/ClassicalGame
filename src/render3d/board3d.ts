// Three.js renderer for the hex board — a real 3D scene with terrain elevation,
// a sun that casts shadows, a tilt/zoom/orbit camera, fog of war, territory
// borders, tile highlights and billboarded unit/city sprites. Driven by game.js
// through a small view object, so all game logic stays in the DOM app.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
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
export interface SpriteView { civ: string; kind: "unit" | "city"; name: string; q: number; r: number; badge?: string; color?: string; }
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

export function createBoard(canvas: HTMLCanvasElement): BoardController {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a1a2f);
  scene.fog = new THREE.Fog(0x0a1a2f, 55, 120);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 800);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.maxPolarAngle = 1.32;
  controls.minPolarAngle = 0.1;
  controls.minDistance = 5;
  controls.maxDistance = 200;
  controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
  controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };

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
  seaMesh.position.y = -0.17;
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
  function tex(url: string): THREE.Texture {
    let t = texCache.get(url);
    if (!t) {
      t = loader.load(url);
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
    // Frame the board once, on first build.
    const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
    const span = Math.max(maxX - minX, maxZ - minZ) || 20;
    controls.target.set(cx, 0, cz);
    camera.position.set(cx, span * 0.6, cz + span * 0.66);
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

  function placeSprites(view: BoardView): void {
    spriteGroup.clear();
    for (const sv of view.sprites) {
      const w = axialToWorld(sv.q, sv.r);
      const top = topOf("plains"); // sprites float just over the land plane
      const scale = sv.kind === "city" ? 1.85 : 1.2;
      const map = sv.name
        ? tex("assets/sprites/" + sv.civ + "/" + sv.kind + "-" + sv.name + ".png")
        : markerTexture(sv.color || "#cccccc", sv.kind); // civ without art -> coloured marker
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false }));
      sp.scale.set(scale, scale, scale);
      sp.position.set(w.x, top + scale * 0.45, w.z);
      spriteGroup.add(sp);
      if (sv.badge) {
        const b = new THREE.Sprite(new THREE.SpriteMaterial({ map: glyphTexture(sv.badge), transparent: true, depthWrite: false, depthTest: false }));
        b.scale.set(0.5, 0.5, 0.5);
        b.position.set(w.x, top + scale * 0.9 + 0.35, w.z);
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

  function resize(): void {
    const w = canvas.clientWidth || 800;
    const h = canvas.clientHeight || 600;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();

  let running = true;
  const loop = () => {
    if (!running) return;
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  };
  loop();

  return {
    render(view) {
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
