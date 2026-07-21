// HEGEMON — isolated prop viewer. Loads ONE promoted prop GLB, runs it through the exact
// same normalizeGLB path the board uses, and displays it turning on a plain grid. This is
// the isolation test from the render-defect report: proves a prop parses + renders as a
// real 3D model (not a striped extrusion), independent of the terrain/scatter system.
//
//   proptest.html?prop=scatter/olive     (key from the runtime manifest)
//   proptest.html?path=assets/approved/props/olive.glb&h=0.9
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { normalizeGLB } from "./propnorm";

type W = Window & { __propOK?: boolean; __propInfo?: Record<string, unknown> };

async function main(): Promise<void> {
  const canvas = document.getElementById("stage") as HTMLCanvasElement;
  const params = new URLSearchParams(location.search);
  const key = params.get("prop") || "scatter/olive";
  const explicit = params.get("path");
  const targetH = parseFloat(params.get("h") || "0.9");

  const W = window.innerWidth, H = window.innerHeight;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(W, H); renderer.setPixelRatio(1);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x17324c);
  const cam = new THREE.PerspectiveCamera(42, W / H, 0.01, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a4a60, 1.15));
  const dir = new THREE.DirectionalLight(0xffffff, 1.5); dir.position.set(2.5, 4, 3); scene.add(dir);
  const grid = new THREE.GridHelper(3, 12, 0x6688aa, 0x33506e); scene.add(grid);

  // Resolve the GLB path from the runtime manifest (unless ?path= given).
  let url = explicit || "";
  if (!url) {
    try { const m = await (await fetch("assets/approved/manifest.json")).json(); url = m.assets?.[key]?.path || ""; } catch { /* none */ }
  }
  const label = document.getElementById("label");
  if (!url) { if (label) label.textContent = "no such prop: " + key; (window as W).__propOK = false; return; }

  new GLTFLoader().load(url, (gltf) => {
    const norm = normalizeGLB(gltf.scene, targetH);
    if (!norm) { if (label) label.textContent = "normalize failed: " + url; (window as W).__propOK = false; return; }
    const mesh = new THREE.Mesh(norm.geo, norm.mat);
    mesh.castShadow = true; scene.add(mesh);
    const pos = norm.geo.getAttribute("position");
    (window as W).__propInfo = { url, verts: pos.count, targetH };
    (window as W).__propOK = true;
    if (label) label.textContent = `${key}  —  ${pos.count.toLocaleString()} verts, ${targetH} units tall`;
  }, undefined, () => { if (label) label.textContent = "GLB load failed: " + url; (window as W).__propOK = false; });

  let a = 0.6;
  function loop(): void {
    a += 0.008;
    cam.position.set(Math.cos(a) * 2.0, targetH * 1.15, Math.sin(a) * 2.0);
    cam.lookAt(0, targetH * 0.45, 0);
    renderer.render(scene, cam);
    requestAnimationFrame(loop);
  }
  loop();
}
main();
