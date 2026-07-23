// HEGEMON — water rendering (WATER-SPEC §2 depth gradient + §4 foam). Reference-driven
// rebuild: the approved gouache paintings are NEVER applied as textures — they are
// decomposed into shader ingredients. Colours below are SAMPLED from the coastal-water
// and deep-sea references as shader constants (asset-version rule: latest, v2).
import * as THREE from "three";
import { axialToWorld, SIZE } from "./terrain";

// §2 colour anchors, sampled from the reference paintings.
const WET_SAND = new THREE.Color(0xe2c179); // pale warm sand through shallow water
const SHALLOW  = new THREE.Color(0x8fd8b8); // green-turquoise shelf
const AQUA     = new THREE.Color(0x2fb0cf); // mid aquamarine body (richer)
const DEEP     = new THREE.Color(0x2a5bb0); // lapis / Egyptian blue — lifted so it reads blue, not black
const FOAM     = new THREE.Color(0xeef0e6); // §4 soft WARM white — never pure #FFFFFF

export interface WaterOpts {
  tiles: Array<{ q: number; r: number }>;
  landAt: (q: number, r: number) => boolean; // dry ground (not sea/coast/open)
  openAt: (q: number, r: number) => number;  // raider belt ring (0 = on-map)
  seaLevel: number;
  weather?: number; // 0 calm .. 1 storm (whitecap frequency / amplitude)
}

// Distance (world units) from a water point to the nearest dry land — the field the
// §2 gradient and §4 shoreline foam both ride on. Scans the axial neighbourhood.
function shoreDistance(x: number, z: number, landAt: (q: number, r: number) => boolean): number {
  const rf = z / (1.5 * SIZE);
  const qf = x / (SIZE * Math.sqrt(3)) - rf / 2;
  const bq = Math.round(qf), br = Math.round(rf);
  let best = Infinity;
  for (let dr = -4; dr <= 4; dr += 1) {
    for (let dq = -4; dq <= 4; dq += 1) {
      if (!landAt(bq + dq, br + dr)) continue;
      const c = axialToWorld(bq + dq, br + dr);
      const d = Math.hypot(c.x - x, c.z - z);
      if (d < best) best = d;
    }
  }
  return best; // Infinity if no land near — open ocean
}

const VERT = /* glsl */`
  attribute float aShore;
  attribute float aOpen;
  varying float vShore;
  varying float vOpen;
  varying vec2 vXZ;
  void main() {
    vShore = aShore; vOpen = aOpen; vXZ = position.xz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */`
  precision highp float;
  uniform float uTime;
  uniform float uWeather;
  uniform vec3 uWetSand, uShallow, uAqua, uDeep, uFoam;
  varying float vShore;
  varying float vOpen;
  varying vec2 vXZ;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    float s = clamp(vShore, 0.0, 1.0);
    // §2 CURVED depth ramp — most colour change near the coast, calm deep stays stable.
    vec3 col = mix(uWetSand, uShallow, smoothstep(0.0, 0.10, s));
    col = mix(col, uAqua, smoothstep(0.07, 0.36, s));
    // Hold the turquoise body longer; only the FARTHEST water sinks to lapis (and never
    // all the way — keeps the sea reading blue, not black).
    col = mix(col, uDeep, 0.86 * smoothstep(0.45, 0.98, pow(s, 0.95)));
    // Raider belt: one step darker + less saturated — permanently moodier.
    vec3 moody = mix(uDeep, vec3(dot(uDeep, vec3(0.333))), 0.35) * 0.78;
    col = mix(col, moody, vOpen);

    // Two-scale swell for the noise fields (slow + fast, different bearings).
    vec2 swell = vXZ * 0.35 + vec2(uTime * 0.03, -uTime * 0.02);
    vec2 ripple = vXZ * 1.1 + vec2(-uTime * 0.06, uTime * 0.05);

    // §4 SHORELINE FOAM: soft warm-white line hugging the edge, noise-broken so it
    // wanders and gaps, with a gentle arriving-wave pulse. Never a uniform outline.
    float band = 1.0 - smoothstep(0.0, 0.13, s);         // a readable band at the shore
    float pulse = 0.7 + 0.3 * sin(uTime * 1.6 - s * 34.0);
    float broken = smoothstep(0.28, 0.62, vnoise(ripple * 1.7)); // wanders + gaps
    float foam = clamp(band * band * pulse * broken * 1.6, 0.0, 1.0);
    col = mix(col, uFoam, foam);

    // §4 DEEP-SEA WHITECAPS: SMALL sparse dabs on swell crests — near-absent in calm,
    // frequent only in storm. Higher-frequency noise so they're crisp flecks, not blobs.
    float caps = smoothstep(0.88, 0.99, vnoise(swell * 6.5)) * smoothstep(0.4, 0.7, s);
    caps *= (0.03 + 0.55 * uWeather) * (1.0 - vOpen * 0.5);
    col = mix(col, uFoam, clamp(caps, 0.0, 1.0));

    // §5 SHORE TRANSPARENCY: the water is translucent over the beach band so the wet sand
    // shows through and the coastline reads as a soft gradient, not a hard opaque line —
    // ramping to fully opaque by the time it's genuinely deep. Foam stays opaque so the
    // wave line still reads.
    float alpha = mix(0.30, 1.0, smoothstep(0.0, 0.24, s));
    alpha = max(alpha, foam);
    gl_FragColor = vec4(col, alpha);
  }
`;

export function buildWaterSurface(opts: WaterOpts): { mesh: THREE.Mesh; tick: (t: number) => void } {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const t of opts.tiles) {
    const c = axialToWorld(t.q, t.r);
    if (c.x < minX) minX = c.x; if (c.x > maxX) maxX = c.x;
    if (c.z < minZ) minZ = c.z; if (c.z > maxZ) maxZ = c.z;
  }
  if (!isFinite(minX)) { minX = -1; maxX = 1; minZ = -1; maxZ = 1; }
  const margin = 8; // cover the raider belt out past the map edge
  minX -= margin; maxX += margin; minZ -= margin; maxZ += margin;
  const w = maxX - minX, d = maxZ - minZ;
  const segX = Math.max(1, Math.min(300, Math.round(w * 2.2)));
  const segZ = Math.max(1, Math.min(300, Math.round(d * 2.2)));
  const nx = segX + 1, nz = segZ + 1;

  const SHORE_RANGE = 5.0; // world units over which shallow→deep plays out
  const pos = new Float32Array(nx * nz * 3);
  const aShore = new Float32Array(nx * nz);
  const aOpen = new Float32Array(nx * nz);
  for (let iz = 0; iz < nz; iz += 1) {
    for (let ix = 0; ix < nx; ix += 1) {
      const wx = minX + (ix / (nx - 1)) * w;
      const wz = minZ + (iz / (nz - 1)) * d;
      const vi = iz * nx + ix;
      pos[vi * 3] = wx; pos[vi * 3 + 1] = opts.seaLevel; pos[vi * 3 + 2] = wz;
      const sd = shoreDistance(wx, wz, opts.landAt);
      aShore[vi] = isFinite(sd) ? Math.min(1, Math.max(0, (sd - 0.55) / SHORE_RANGE)) : 1;
      // openness of the belt: sample nearest tile
      const rf = wz / (1.5 * SIZE), qf = wx / (SIZE * Math.sqrt(3)) - rf / 2;
      aOpen[vi] = opts.openAt(Math.round(qf), Math.round(rf)) > 0 ? 1 : 0;
    }
  }
  const idx: number[] = [];
  for (let iz = 0; iz < segZ; iz += 1) {
    for (let ix = 0; ix < segX; ix += 1) {
      const a = iz * nx + ix, b = a + 1, c = a + nx, e = c + 1;
      idx.push(a, c, b, b, c, e);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aShore", new THREE.BufferAttribute(aShore, 1));
  geo.setAttribute("aOpen", new THREE.BufferAttribute(aOpen, 1));
  geo.setIndex(idx);

  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    toneMapped: false, // author the painted colours directly; skip the scene tone-map
    transparent: true, // §5 shore transparency — blend over the wet-sand terrain near shore
    depthWrite: false, // don't occlude; the terrain beneath (beach) shows through the shallows
    uniforms: {
      uTime: { value: 0 },
      uWeather: { value: opts.weather ?? 0 },
      uWetSand: { value: WET_SAND }, uShallow: { value: SHALLOW }, uAqua: { value: AQUA },
      uDeep: { value: DEEP }, uFoam: { value: FOAM }
    }
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = "waterSurface";
  mesh.renderOrder = 1; // draw over the terrain surface's flat sea areas
  return { mesh, tick: (t: number) => { mat.uniforms.uTime.value = t; } };
}
