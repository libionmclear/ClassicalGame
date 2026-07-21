// HEGEMON — shared prop-GLB normalization. Used by the board (scatter InstancedMeshes)
// and the isolated prop viewer (proptest.html) so both exercise the SAME code path.
//
// The optimized props are KHR_mesh_quantization (POSITION/NORMAL stored as normalized
// int16, dequantized by the node transform). Baking that transform straight into a
// normalized-int buffer CLAMPS every coordinate past ±1 → the mesh collapses into
// vertical strips (the "extruded cylinder" defect). We de-normalize to Float32 first,
// then the transform is exact.
import * as THREE from "three";

function deNorm(a: THREE.BufferAttribute | THREE.InterleavedBufferAttribute): THREE.BufferAttribute {
  const it = a.itemSize, n = a.count, out = new Float32Array(n * it);
  for (let i = 0; i < n; i += 1) {
    out[i * it] = a.getX(i);
    if (it > 1) out[i * it + 1] = a.getY(i);
    if (it > 2) out[i * it + 2] = a.getZ(i);
    if (it > 3) out[i * it + 3] = a.getW(i);
  }
  return new THREE.BufferAttribute(out, it);
}

export interface NormalizedProp { geo: THREE.BufferGeometry; mat: THREE.Material | THREE.Material[] }

// Take a loaded glTF scene, pick the mesh with the most vertices (the model body), bake
// its world transform into a de-quantized Float32 geometry, centre it in XZ, seat its
// feet at y=0, and scale it to `targetH` world units tall.
export function normalizeGLB(scene0: THREE.Object3D, targetH: number): NormalizedProp | null {
  scene0.updateMatrixWorld(true);
  let src: THREE.Mesh | null = null; let best = -1;
  scene0.traverse((o) => {
    const m = o as THREE.Mesh;
    const pos = m.isMesh && m.geometry ? m.geometry.getAttribute("position") : null;
    if (pos && pos.count > best) { best = pos.count; src = m; }
  });
  if (!src) return null;
  const s0 = src as THREE.Mesh;
  const og = s0.geometry;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", deNorm(og.getAttribute("position") as THREE.BufferAttribute));
  const nrm = og.getAttribute("normal"); if (nrm) geo.setAttribute("normal", deNorm(nrm as THREE.BufferAttribute));
  const uv = og.getAttribute("uv"); if (uv) geo.setAttribute("uv", (uv as THREE.BufferAttribute).clone());
  if (og.index) geo.setIndex(og.index.clone());
  geo.applyMatrix4(s0.matrixWorld);           // safe now: Float32 positions won't clamp
  if (!nrm) geo.computeVertexNormals();
  const box = new THREE.Box3().setFromBufferAttribute(geo.getAttribute("position") as THREE.BufferAttribute);
  const sz = new THREE.Vector3(); box.getSize(sz);
  const s = targetH / (sz.y || 1);
  geo.translate(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
  geo.scale(s, s, s);
  return { geo, mat: s0.material };
}
