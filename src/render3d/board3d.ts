// A Three.js renderer for the hex board — a real 3D scene with terrain
// elevation, a sun that casts shadows, a tilt/zoom/orbit camera, and unit/city
// sprites billboarded onto the tiles. Built alongside the DOM board; this module
// is a self-contained prototype exposed as window.Board3D for board3d.html.
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
// Top-surface height of each terrain (water sits below the land plane).
const TERRAIN_ELEV: Record<string, number> = {
  sea: -0.18,
  coast: -0.05,
  plains: 0.08,
  valley: 0.1,
  forest: 0.16,
  hills: 0.34,
  mountains: 0.85,
  desert: 0.08
};
const FLOOR = -0.6;
const SIZE = 1; // hex circumradius in world units

// Pointy-top axial -> world (board lies on the XZ plane, Y is up).
function axialToWorld(q: number, r: number): { x: number; z: number } {
  return { x: SIZE * Math.sqrt(3) * (q + r / 2), z: SIZE * 1.5 * r };
}

interface Board {
  update(state: GameState): void;
  frame(): void;
  onResize(): void;
  onPick(handler: (key: string | null) => void): void;
}

function createBoard(canvas: HTMLCanvasElement, spriteManifest: Record<string, { unit?: string[]; city?: string[] }>): Board {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(2, (globalThis as { devicePixelRatio?: number }).devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a1a2f);
  scene.fog = new THREE.Fog(0x0a1a2f, 42, 95);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 600);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = 1.28; // don't let the camera go below the horizon
  controls.minPolarAngle = 0.15;
  controls.minDistance = 6;
  controls.maxDistance = 120;
  controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };

  scene.add(new THREE.AmbientLight(0xbfd4ff, 0.6));
  const hemi = new THREE.HemisphereLight(0xcfe4ff, 0x3a3326, 0.5);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0d4, 1.15);
  sun.position.set(-26, 40, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -70;
  sc.right = 70;
  sc.top = 70;
  sc.bottom = -70;
  sc.near = 1;
  sc.far = 160;
  scene.add(sun);
  scene.add(sun.target);

  // Sea plane under everything, so water reads as a continuous surface.
  const seaGeo = new THREE.PlaneGeometry(4000, 4000);
  const seaMat = new THREE.MeshStandardMaterial({ color: 0x25456b, roughness: 0.4, metalness: 0.1 });
  const seaMesh = new THREE.Mesh(seaGeo, seaMat);
  seaMesh.rotation.x = -Math.PI / 2;
  seaMesh.position.y = -0.16;
  seaMesh.receiveShadow = true;
  scene.add(seaMesh);

  // One hex prism geometry, oriented pointy-top; instanced for every tile.
  const hexGeo = new THREE.CylinderGeometry(SIZE * 0.985, SIZE * 0.94, 1, 6);
  hexGeo.rotateY(Math.PI / 6);
  const hexMat = new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0.02, flatShading: true, vertexColors: false });

  let tiles: InstanceState | null = null;
  const spriteGroup = new THREE.Group();
  scene.add(spriteGroup);
  const textureCache = new Map<string, THREE.Texture>();
  const loader = new THREE.TextureLoader();

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pickHandler: ((key: string | null) => void) | null = null;
  let hoverId = -1;

  interface InstanceState {
    mesh: THREE.InstancedMesh;
    keyByIndex: string[];
    indexByKey: Record<string, number>;
    baseColor: THREE.Color[];
  }

  function textureFor(url: string): THREE.Texture {
    let tex = textureCache.get(url);
    if (!tex) {
      tex = loader.load(url);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.magFilter = THREE.NearestFilter;
      textureCache.set(url, tex);
    }
    return tex;
  }

  function build(state: GameState): void {
    if (tiles) {
      scene.remove(tiles.mesh);
      tiles.mesh.dispose();
    }
    const keys = Object.keys(state.map.tiles);
    const mesh = new THREE.InstancedMesh(hexGeo, hexMat, keys.length);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(keys.length * 3), 3);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    const col = new THREE.Color();
    const keyByIndex: string[] = [];
    const indexByKey: Record<string, number> = {};
    const baseColor: THREE.Color[] = [];

    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    keys.forEach((key, i) => {
      const [qq, rr] = key.split(",").map(Number);
      const tile = state.map.tiles[key];
      const w = axialToWorld(qq, rr);
      const top = TERRAIN_ELEV[tile.terrain] ?? 0.08;
      const height = Math.max(0.1, top - FLOOR);
      p.set(w.x, (top + FLOOR) / 2, w.z);
      s.set(1, height, 1);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
      // A little deterministic per-tile shade so terrain isn't uniform.
      const jitter = ((qq * 928371 + rr * 12547) % 17) / 17 - 0.5;
      col.setHex(TERRAIN_COLOR[tile.terrain] ?? 0x808080).offsetHSL(0, 0, jitter * 0.06);
      mesh.setColorAt(i, col);
      keyByIndex.push(key);
      indexByKey[key] = i;
      baseColor.push(col.clone());
      minX = Math.min(minX, w.x);
      maxX = Math.max(maxX, w.x);
      minZ = Math.min(minZ, w.z);
      maxZ = Math.max(maxZ, w.z);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    scene.add(mesh);
    tiles = { mesh, keyByIndex, indexByKey, baseColor };

    // Frame the whole board.
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    const span = Math.max(maxX - minX, maxZ - minZ);
    controls.target.set(cx, 0, cz);
    camera.position.set(cx, span * 0.62, cz + span * 0.72);
    sun.target.position.set(cx, 0, cz);
    controls.update();
  }

  function placeSprites(state: GameState): void {
    spriteGroup.clear();
    const add = (civ: string, kind: "unit" | "city", name: string, x: number, z: number, top: number, scale: number) => {
      const url = "assets/sprites/" + civ + "/" + kind + "-" + name + ".png";
      const mat = new THREE.SpriteMaterial({ map: textureFor(url), transparent: true });
      const sp = new THREE.Sprite(mat);
      sp.scale.set(scale, scale, scale);
      sp.position.set(x, top + scale * 0.42, z);
      spriteGroup.add(sp);
    };
    for (const city of Object.values(state.map.cities)) {
      const man = spriteManifest[city.ownerId];
      const w = axialToWorld(city.position.q, city.position.r);
      const top = TERRAIN_ELEV[state.map.tiles[`${city.position.q},${city.position.r}`]?.terrain] ?? 0.08;
      if (man && man.city && man.city.length) {
        const pop = city.population || 1;
        const idx = pop <= 2 ? 0 : pop <= 4 ? 1 : pop <= 6 ? 2 : pop <= 8 ? 3 : 4;
        add(city.ownerId, "city", man.city[Math.min(idx, man.city.length - 1)], w.x, w.z, top, 1.9);
      }
    }
    for (const unit of Object.values(state.map.units)) {
      const man = spriteManifest[unit.ownerId];
      const w = axialToWorld(unit.position.q, unit.position.r);
      const top = TERRAIN_ELEV[state.map.tiles[`${unit.position.q},${unit.position.r}`]?.terrain] ?? 0.08;
      const onCity = Object.values(state.map.cities).some((c) => c.position.q === unit.position.q && c.position.r === unit.position.r);
      if (onCity) continue;
      if (man && man.unit && man.unit.length) {
        add(unit.ownerId, "unit", man.unit[Math.min(2, man.unit.length - 1)], w.x, w.z, top, 1.25);
      }
    }
  }

  function highlight(id: number): void {
    if (!tiles) return;
    if (hoverId >= 0 && hoverId < tiles.baseColor.length) tiles.mesh.setColorAt(hoverId, tiles.baseColor[hoverId]);
    if (id >= 0) {
      const c = tiles.baseColor[id].clone().offsetHSL(0, 0.1, 0.22);
      tiles.mesh.setColorAt(id, c);
    }
    hoverId = id;
    if (tiles.mesh.instanceColor) tiles.mesh.instanceColor.needsUpdate = true;
  }

  function pickAt(clientX: number, clientY: number): number {
    if (!tiles) return -1;
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(tiles.mesh);
    return hit.length && hit[0].instanceId != null ? (hit[0].instanceId as number) : -1;
  }

  canvas.addEventListener("mousemove", (e) => highlight(pickAt(e.clientX, e.clientY)));
  let downX = 0;
  let downY = 0;
  canvas.addEventListener("mousedown", (e) => {
    downX = e.clientX;
    downY = e.clientY;
  });
  canvas.addEventListener("mouseup", (e) => {
    if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 4) return; // was a drag
    const id = pickAt(e.clientX, e.clientY);
    if (pickHandler && tiles) pickHandler(id >= 0 ? tiles.keyByIndex[id] : null);
  });

  return {
    update(state) {
      build(state);
      placeSprites(state);
    },
    frame() {
      controls.update();
      renderer.render(scene, camera);
    },
    onResize() {
      const w = canvas.clientWidth || canvas.width;
      const h = canvas.clientHeight || canvas.height;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    },
    onPick(handler) {
      pickHandler = handler;
    }
  };
}

// Demo entry used by board3d.html — build a scenario or random map and run it.
export function initDemo(canvas: HTMLCanvasElement, which: string): void {
  const manifest = ((globalThis as { HEGEMON_SPRITES?: Record<string, { unit?: string[]; city?: string[] }> }).HEGEMON_SPRITES) || {};
  let state: GameState;
  if (which === "oikoumene" || which === "italia" || which === "hellas" || which === "oldworld") {
    state = createInitialGameState(loadScenario(which as never).config);
  } else {
    state = createInitialGameState(generateMap({ size: (which as never) || "large", seed: "board3d-demo", playerCount: 4 }));
  }
  const board = createBoard(canvas, manifest);
  board.onResize();
  board.update(state);
  board.onPick((key) => {
    const el = document.getElementById("pick");
    if (el) el.textContent = key ? "tile " + key + " — " + (state.map.tiles[key]?.terrain || "") : "—";
  });
  window.addEventListener("resize", () => board.onResize());
  const loop = () => {
    board.frame();
    requestAnimationFrame(loop);
  };
  loop();
}

(globalThis as unknown as { Board3D: { initDemo: typeof initDemo } }).Board3D = { initDemo };
