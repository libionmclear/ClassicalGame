// HEGEMON — cityModels.js : procedural city meshes, v2
// 10 tiers × 12 civ styles. Pure geometry — no assets, no DOM. Drop-in for
// board3d.ts: import { buildCity } and call in place of the old city builder.
//   buildCity(THREE, { tier: 1..10, style: 'rome'|..., seed, accent })
// Returns THREE.Group centred at origin, ground at y=0, footprint ~radius 1.0
// (scale to hex size at call site, as before).
//
// AESTHETIC RULES THAT MAKE IT "LESS UGLY" (see HEGEMON-VISUALS-v2.md §1):
//  - flatShading everywhere: crisp low-poly facets instead of smeared smooth normals
//  - hue/size/rotation JITTER per building: no two houses identical
//  - roofs are a different, warmer material than walls: instant readability
//  - buildings cluster around a PLAZA and radial lanes, not a random scatter
//  - landmark first: the eye needs one tall thing to anchor the silhouette
//  - walls follow a ring with a real GATE; towers on the ring, not floating

export function buildCity(THREE, opts = {}) {
  const tier = Math.max(1, Math.min(10, opts.tier || 1));
  const style = STYLES[opts.style] ? opts.style : "rome";
  const S = STYLES[style];
  const rng = mulberry32(opts.seed ?? 1234);
  const g = new THREE.Group();
  g.name = `city-${style}-t${tier}`;

  const mat = (hex, jitter = 0) =>
    new THREE.MeshStandardMaterial({
      color: jitterColor(THREE, hex, rng, jitter),
      flatShading: true, roughness: 0.9, metalness: 0.0,
    });

  // ---- ground plaza (slightly raised disc, avoids z-fighting with terrain)
  const plazaR = 0.28 + tier * 0.02;
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(plazaR, plazaR, 0.02, 12), mat(S.plaza));
  plaza.position.y = 0.01;
  g.add(plaza);

  // ---- building budget & scale by tier
  const nBuildings = [3, 5, 7, 9, 12, 14, 17, 20, 23, 26][tier - 1];
  const hBase = 0.10 + tier * 0.012;          // base wall height grows with tier
  const ringMin = plazaR + 0.06, ringMax = 0.62 + tier * 0.03;

  // ---- houses in radial clusters with lanes
  const lanes = 3 + Math.floor(tier / 3);      // gaps the eye reads as streets
  // Paved streets radiating from the plaza — turns a scatter of huts into a town.
  for (let i = 0; i < lanes; i++) {
    const a = (i / lanes) * Math.PI * 2;
    const len = ringMax - plazaR * 0.4;
    const street = new THREE.Mesh(new THREE.BoxGeometry(len, 0.012, 0.05 + tier * 0.004), mat(S.plaza, 0.25));
    const mid = plazaR * 0.4 + len / 2;
    street.position.set(Math.cos(a) * mid, 0.012, Math.sin(a) * mid);
    street.rotation.y = -a;
    g.add(street);
  }
  for (let i = 0; i < nBuildings; i++) {
    const lane = Math.floor(rng() * lanes);
    const a = (lane / lanes) * Math.PI * 2 + (0.25 + rng() * 0.5) * ((Math.PI * 2) / lanes);
    const r = ringMin + rng() * (ringMax - ringMin);
    const w = 0.07 + rng() * 0.06, d = 0.07 + rng() * 0.06;
    const h = hBase * (0.7 + rng() * 0.7);
    const house = makeHouse(THREE, S, rng, w, h, d, mat);
    house.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    house.rotation.y = a + Math.PI / 2 + (rng() - 0.5) * 0.4;
    g.add(house);
  }

  // ---- shrine from tier 3 (small landmark near plaza edge)
  if (tier >= 3) {
    const shrine = S.shrine(THREE, rng, mat);
    shrine.position.set(plazaR * 0.7, 0, -plazaR * 0.5);
    g.add(shrine);
  }

  // ---- monumental centre from tier 6 (temple/palace on the plaza)
  if (tier >= 6) {
    const monument = S.monument(THREE, rng, mat, tier);
    monument.position.set(-plazaR * 0.25, 0, plazaR * 0.15);
    g.add(monument);
  }

  // ---- civ landmark from tier 8 (the postcard building)
  if (tier >= 8) {
    const landmark = S.landmark(THREE, rng, mat, tier);
    landmark.position.set(plazaR * 0.55, 0, plazaR * 0.55);
    g.add(landmark);
  }

  // ---- walls from tier 4 (Sparta: none until t8 — its men are its walls;
  //      Scythia: never — a wagon ring instead)
  const wantsWalls = style === "scythia" ? false : style === "sparta" ? tier >= 8 : tier >= 4;
  if (wantsWalls) {
    g.add(makeWallRing(THREE, S, rng, mat, ringMax + 0.10, tier));
  } else if (style === "scythia" && tier >= 4) {
    g.add(makeWagonRing(THREE, S, rng, mat, ringMax + 0.08, tier));
  }

  // ---- banner at the gate from tier 5 (accent = player colour)
  if (tier >= 5 && opts.accent) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 5), mat(0x6b5a44));
    pole.position.set(ringMax + 0.10, 0.15, 0.02);
    const flagM = new THREE.MeshStandardMaterial({ color: opts.accent, flatShading: true, side: THREE.DoubleSide });
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.10, 0.06), flagM);
    flag.position.set(ringMax + 0.155, 0.26, 0.02);
    g.add(pole, flag);
  }

  // ---- tier 10: gilded accents on the landmark & monument (the imperial city)
  if (tier === 10) {
    const gild = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.34, 6), mat(S.gold));
    gild.position.set(-plazaR * 0.25, 0.17, plazaR * 0.15);
    g.add(gild);
  }

  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

// ============================================================ helpers

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function jitterColor(THREE, hex, rng, amt) {
  const c = new THREE.Color(hex);
  if (amt > 0) {
    const hsl = {}; c.getHSL(hsl);
    c.setHSL(hsl.h + (rng() - 0.5) * amt * 0.05,
             Math.max(0, hsl.s + (rng() - 0.5) * amt * 0.2),
             Math.max(0, Math.min(1, hsl.l + (rng() - 0.5) * amt * 0.25)));
  }
  return c;
}

// A house = walls + a style-appropriate roof. The roof/wall material split is
// what makes tiny buildings readable at board distance.
function makeHouse(THREE, S, rng, w, h, d, mat) {
  const grp = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(S.wall, 1));
  body.position.y = h / 2;
  grp.add(body);
  // Doorway + a window or two so the little houses read at board distance.
  const door = new THREE.Mesh(new THREE.BoxGeometry(w * 0.26, h * 0.5, 0.006), mat(0x2b2018));
  door.position.set((rng() - 0.5) * w * 0.4, h * 0.25, d / 2 + 0.003);
  grp.add(door);
  const nWin = rng() < 0.7 ? 1 + Math.floor(rng() * 2) : 0;
  for (let i = 0; i < nWin; i++) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(w * 0.16, h * 0.18, 0.005), mat(0x3a4650));
    win.position.set(-w * 0.3 + rng() * w * 0.6, h * (0.45 + rng() * 0.35), d / 2 + 0.003);
    grp.add(win);
  }
  const roofH = h * (0.5 + rng() * 0.3);
  let roof;
  switch (S.roof) {
    case "gable":  roof = prism(THREE, w * 1.12, roofH, d * 1.12); break;
    case "flat":   roof = new THREE.BoxGeometry(w * 1.06, roofH * 0.25, d * 1.06); break;
    case "thatch": roof = new THREE.ConeGeometry(Math.max(w, d) * 0.78, roofH * 1.3, 7); break;
    case "eaves": { // Han: oversized slab roof with a hint of lift
      roof = new THREE.BoxGeometry(w * 1.5, roofH * 0.22, d * 1.5); break;
    }
    default:       roof = prism(THREE, w * 1.1, roofH, d * 1.1);
  }
  const roofMesh = new THREE.Mesh(roof, mat(S.roofColor, 1));
  roofMesh.position.y = h + (S.roof === "flat" || S.roof === "eaves" ? roofH * 0.12 : roofH / 2);
  grp.add(roofMesh);
  if (S.roof === "eaves") { // second smaller eave = pagoda feel without cost
    const top = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, roofH * 0.18, d * 0.9), mat(S.roofColor, 1));
    top.position.y = h + roofH * 0.5;
    grp.add(top);
  }
  return grp;
}

// Gable prism (triangular cross-section) as BufferGeometry
export function prism(THREE, w, h, d) {
  const g = new THREE.BufferGeometry();
  const x = w / 2, z = d / 2;
  const v = new Float32Array([
    -x,0,-z,  x,0,-z,  0,h,-z,          // back tri
    -x,0, z,  0,h, z,  x,0, z,          // front tri
    -x,0,-z,  0,h,-z,  0,h, z,  -x,0,-z, 0,h, z, -x,0, z,  // left slope
     x,0,-z,  x,0, z,  0,h, z,   x,0,-z, 0,h, z,  0,h,-z,  // right slope
    -x,0,-z, -x,0, z,  x,0, z,  -x,0,-z, x,0, z,  x,0,-z,  // bottom
  ]);
  g.setAttribute("position", new THREE.BufferAttribute(v, 3));
  g.computeVertexNormals();
  return g;
}

export function colonnade(THREE, S, mat, w, d, colH, nx, nz) {
  const grp = new THREE.Group();
  const col = new THREE.CylinderGeometry(0.012, 0.014, colH, 6);
  for (let i = 0; i < nx; i++) for (const zz of [-d / 2, d / 2]) {
    const m = new THREE.Mesh(col, mat(S.stone));
    m.position.set(-w / 2 + (i / (nx - 1)) * w, colH / 2, zz);
    grp.add(m);
  }
  for (let j = 1; j < nz - 1; j++) for (const xx of [-w / 2, w / 2]) {
    const m = new THREE.Mesh(col, mat(S.stone));
    m.position.set(xx, colH / 2, -d / 2 + (j / (nz - 1)) * d);
    grp.add(m);
  }
  return grp;
}

export function classicalTemple(THREE, S, mat, scale = 1) {
  const grp = new THREE.Group();
  const w = 0.26 * scale, d = 0.16 * scale, colH = 0.14 * scale;
  const podium = new THREE.Mesh(new THREE.BoxGeometry(w * 1.15, 0.03, d * 1.15), mat(S.stone));
  podium.position.y = 0.015; grp.add(podium);
  grp.add(colonnade(THREE, S, mat, w, d, colH, 6, 4)).children.slice(-1);
  const entab = new THREE.Mesh(new THREE.BoxGeometry(w * 1.1, 0.025, d * 1.1), mat(S.stone));
  entab.position.y = 0.03 + colH; grp.add(entab);
  const roof = new THREE.Mesh(prism(THREE, w * 1.14, 0.07 * scale, d * 1.14), mat(S.roofColor));
  roof.position.y = 0.055 + colH; grp.add(roof);
  return grp;
}

function makeWallRing(THREE, S, rng, mat, R, tier) {
  const grp = new THREE.Group();
  const segs = 14, gapAt = Math.floor(rng() * segs); // gate
  const wallH = 0.07 + tier * 0.008, wallT = 0.035;
  for (let i = 0; i < segs; i++) {
    if (i === gapAt) continue;
    const a0 = (i / segs) * Math.PI * 2, a1 = ((i + 0.92) / segs) * Math.PI * 2;
    const mx = Math.cos((a0 + a1) / 2) * R, mz = Math.sin((a0 + a1) / 2) * R;
    const len = 2 * R * Math.sin((a1 - a0) / 2);
    const seg = new THREE.Mesh(new THREE.BoxGeometry(len, wallH, wallT), mat(S.wallRing, 0.5));
    seg.position.set(mx, wallH / 2, mz);
    seg.rotation.y = -((a0 + a1) / 2) + Math.PI / 2;
    grp.add(seg);
  }
  // towers every ~3rd joint, plus two flanking the gate
  const nTow = 4 + Math.floor(tier / 3);
  for (let i = 0; i < nTow; i++) {
    const a = ((i / nTow) + 0.02) * Math.PI * 2;
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, wallH * 1.8, 6), mat(S.wallRing, 0.5));
    t.position.set(Math.cos(a) * R, wallH * 0.9, Math.sin(a) * R);
    grp.add(t);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.03, 6), mat(S.roofColor));
    cap.position.set(Math.cos(a) * R, wallH * 1.8 + 0.015, Math.sin(a) * R);
    grp.add(cap);
  }
  return grp;
}

function makeWagonRing(THREE, S, rng, mat, R, tier) {
  const grp = new THREE.Group();
  const n = 8 + tier;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rng() * 0.1;
    const wagon = new THREE.Group();
    const bed = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.03, 0.05), mat(0x7a5b3a, 1));
    bed.position.y = 0.035; wagon.add(bed);
    const tent = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.085, 7, 1, false, 0, Math.PI), mat(S.roofColor, 1));
    tent.rotation.z = Math.PI / 2; tent.position.y = 0.06; wagon.add(tent);
    for (const dx of [-0.03, 0.03]) for (const dz of [-0.028, 0.028]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.008, 8), mat(0x4a3826));
      wheel.rotation.x = Math.PI / 2; wheel.position.set(dx, 0.016, dz);
      wagon.add(wheel);
    }
    wagon.position.set(Math.cos(a) * R, 0, Math.sin(a) * R);
    wagon.rotation.y = -a;
    grp.add(wagon);
  }
  return grp;
}

// ============================================================ styles
// wall = house walls · roofColor · roof type · stone = monumental stone
// plaza · wallRing = city wall colour · gold = gilded accent

export const STYLES = {
  rome: sty(0xd9c9a8, 0xa8503c, "gable", 0xe8e0cf, 0x9c9483, 0xb8a888, {
    shrine: (T,r,m)=>classicalTemple(T,STYLES.rome,m,0.5),
    monument:(T,r,m)=>classicalTemple(T,STYLES.rome,m,1),
    landmark:(T,r,m,tier)=>{ // amphitheatre: ring of arch piers
      const g=new T.Group(); const R=0.16,n=14,h=0.10+tier*0.004;
      for(let i=0;i<n;i++){const a=i/n*Math.PI*2;
        const p=new T.Mesh(new T.BoxGeometry(0.03,h,0.02),m(0xe0d6c0,0.5));
        p.position.set(Math.cos(a)*R,h/2,Math.sin(a)*R);p.rotation.y=-a;g.add(p);}
      const rim=new T.Mesh(new T.CylinderGeometry(R+0.02,R+0.02,0.02,n),m(0xe0d6c0));
      rim.position.y=h+0.01; g.add(rim); return g;},
  }),
  carthage: sty(0xe6dfd0, 0xcbb27a, "flat", 0xd8cdb8, 0x9aa5a0, 0xb08c5a, {
    shrine:(T,r,m)=>{const g=new T.Group();
      const t=new T.Mesh(new T.BoxGeometry(0.06,0.14,0.06),m(0xd8cdb8));t.position.y=0.07;g.add(t);
      const c=new T.Mesh(new T.ConeGeometry(0.045,0.05,4),m(0xcbb27a));c.position.y=0.165;g.add(c);return g;},
    monument:(T,r,m)=>{const g=new T.Group(); // cothon: ring pool + inner isle
      const ring=new T.Mesh(new T.CylinderGeometry(0.15,0.15,0.012,20),m(0x3f6d8a));ring.position.y=0.008;g.add(ring);
      const isle=new T.Mesh(new T.CylinderGeometry(0.06,0.06,0.03,10),m(0xd8cdb8));isle.position.y=0.02;g.add(isle);
      const hq=new T.Mesh(new T.CylinderGeometry(0.03,0.035,0.08,8),m(0xe6dfd0));hq.position.y=0.075;g.add(hq);return g;},
    landmark:(T,r,m)=>{const g=new T.Group(); // harbour light tower
      const t=new T.Mesh(new T.CylinderGeometry(0.03,0.05,0.22,6),m(0xd8cdb8));t.position.y=0.11;g.add(t);
      const f=new T.Mesh(new T.ConeGeometry(0.02,0.04,5),m(0xe0a13a));f.position.y=0.24;g.add(f);return g;},
  }),
  greece: sty(0xece6d8, 0xb56546, "gable", 0xf0ead9, 0xa9a294, 0xc4b06a, {
    shrine:(T,r,m)=>classicalTemple(T,STYLES.greece,m,0.5),
    monument:(T,r,m)=>classicalTemple(T,STYLES.greece,m,1.1),
    landmark:(T,r,m)=>{const g=new T.Group(); // theatre: stepped half-ring
      for(let s=0;s<4;s++){const R=0.06+s*0.03;
        const step=new T.Mesh(new T.CylinderGeometry(R,R,0.02,12,1,false,0,Math.PI),m(0xf0ead9,0.3));
        step.position.y=0.01+s*0.02; g.add(step);} return g;},
  }),
  egypt: sty(0xe3d2a8, 0xd8c79a, "flat", 0xd9c493, 0xb99e5e, 0xd7a93c, {
    shrine:(T,r,m)=>{const g=new T.Group(); // obelisk (tapered 4-side)
      const o=new T.Mesh(new T.CylinderGeometry(0.008,0.02,0.18,4),m(0xd9c493));o.position.y=0.09;g.add(o);
      const tip=new T.Mesh(new T.ConeGeometry(0.012,0.02,4),m(0xd7a93c));tip.position.y=0.19;g.add(tip);return g;},
    monument:(T,r,m)=>{const g=new T.Group(); // pylon gate pair + lintel
      for(const dx of[-0.07,0.07]){const p=new T.Mesh(new T.CylinderGeometry(0.028,0.045,0.16,4),m(0xd9c493));
        p.position.set(dx,0.08,0);g.add(p);}
      const lin=new T.Mesh(new T.BoxGeometry(0.17,0.025,0.05),m(0xb99e5e));lin.position.y=0.15;g.add(lin);return g;},
    landmark:(T,r,m)=>{const g=new T.Group(); // great temple: pylon + court + obelisks
      const base=new T.Mesh(new T.BoxGeometry(0.2,0.05,0.14),m(0xd9c493));base.position.y=0.025;g.add(base);
      for(const dx of[-0.11,0.11]){const o=new T.Mesh(new T.CylinderGeometry(0.006,0.016,0.15,4),m(0xd9c493));
        o.position.set(dx,0.075,0.09);g.add(o);} return g;},
  }),
  gaul: sty(0xc9b090, 0xb9a15f, "thatch", 0x9d9584, 0x8a795c, 0xc59a3a, {
    shrine:(T,r,m)=>{const g=new T.Group(); // carved pillar
      const p=new T.Mesh(new T.CylinderGeometry(0.015,0.02,0.12,6),m(0x9d9584));p.position.y=0.06;g.add(p);return g;},
    monument:(T,r,m)=>{const g=new T.Group(); // great roundhouse
      const w=new T.Mesh(new T.CylinderGeometry(0.09,0.09,0.07,9),m(0xc9b090,1));w.position.y=0.035;g.add(w);
      const rf=new T.Mesh(new T.ConeGeometry(0.115,0.10,9),m(0xb9a15f,1));rf.position.y=0.12;g.add(rf);return g;},
    landmark:(T,r,m,tier)=>{const g=new T.Group(); // hill oppidum keep
      const mound=new T.Mesh(new T.CylinderGeometry(0.10,0.14,0.05,8),m(0x7a8a5a));mound.position.y=0.025;g.add(mound);
      const keep=new T.Mesh(new T.CylinderGeometry(0.05,0.05,0.08,8),m(0xc9b090));keep.position.y=0.09;g.add(keep);
      const rf=new T.Mesh(new T.ConeGeometry(0.062,0.05,8),m(0xb9a15f));rf.position.y=0.155;g.add(rf);return g;},
  }),
  parthia: sty(0xd6b78e, 0xc09a63, "flat", 0xcfa871, 0xb08d5c, 0xd0a13a, {
    shrine:(T,r,m)=>{const g=new T.Group(); // fire altar
      const a=new T.Mesh(new T.CylinderGeometry(0.03,0.04,0.08,6),m(0xcfa871));a.position.y=0.04;g.add(a);
      const f=new T.Mesh(new T.ConeGeometry(0.015,0.03,5),m(0xe0842a));f.position.y=0.095;g.add(f);return g;},
    monument:(T,r,m)=>{const g=new T.Group(); // iwan: two piers + tall lintel + half-dome hint
      for(const dx of[-0.06,0.06]){const p=new T.Mesh(new T.BoxGeometry(0.04,0.14,0.06),m(0xd6b78e));
        p.position.set(dx,0.07,0);g.add(p);}
      const arch=new T.Mesh(new T.CylinderGeometry(0.06,0.06,0.06,10,1,false,0,Math.PI),m(0xc09a63));
      arch.rotation.z=Math.PI/2; arch.rotation.y=Math.PI/2; arch.position.y=0.14; g.add(arch); return g;},
    landmark:(T,r,m)=>{const g=new T.Group(); // round city palace + dome
      const w=new T.Mesh(new T.CylinderGeometry(0.10,0.11,0.09,10),m(0xd6b78e));w.position.y=0.045;g.add(w);
      const dome=new T.Mesh(new T.SphereGeometry(0.07,10,6,0,Math.PI*2,0,Math.PI/2),m(0xc09a63));
      dome.position.y=0.09;g.add(dome);return g;},
  }),
  sparta: sty(0xcfc6b2, 0x8f5a48, "gable", 0xd8d0be, 0x9a9284, 0xa88f4a, {
    shrine:(T,r,m)=>classicalTemple(T,STYLES.sparta,m,0.45),
    monument:(T,r,m)=>{const g=new T.Group(); // stark stoa: long low colonnade
      g.add(colonnade(T,STYLES.sparta,m,0.24,0.08,0.10,7,2));
      const roof=new T.Mesh(prism(T,0.27,0.05,0.11),m(0x8f5a48));roof.position.y=0.10;g.add(roof);return g;},
    landmark:(T,r,m)=>{const g=new T.Group(); // warrior column (Leonidas)
      const col=new T.Mesh(new T.CylinderGeometry(0.02,0.025,0.16,6),m(0xd8d0be));col.position.y=0.08;g.add(col);
      const fig=new T.Mesh(new T.BoxGeometry(0.03,0.06,0.02),m(0x8f5a48));fig.position.y=0.19;g.add(fig);
      const crest=new T.Mesh(new T.ConeGeometry(0.012,0.025,4),m(0xa03028));crest.position.y=0.235;g.add(crest);return g;},
  }),
  macedon: sty(0xe0d7c2, 0x9d5a42, "gable", 0xe6ddc8, 0xa39a88, 0xc0a050, {
    shrine:(T,r,m)=>classicalTemple(T,STYLES.macedon,m,0.5),
    monument:(T,r,m)=>{const g=new T.Group(); // palace: wide two-storey block + colonnade front
      const b=new T.Mesh(new T.BoxGeometry(0.22,0.09,0.13),m(0xe0d7c2));b.position.y=0.045;g.add(b);
      g.add(colonnade(T,STYLES.macedon,m,0.20,0.02,0.06,6,2)).children;
      const roof=new T.Mesh(prism(T,0.24,0.05,0.15),m(0x9d5a42));roof.position.y=0.09;g.add(roof);return g;},
    landmark:(T,r,m)=>{const g=new T.Group(); // royal tumulus (Vergina)
      const mound=new T.Mesh(new T.SphereGeometry(0.11,10,6,0,Math.PI*2,0,Math.PI/2),m(0x8a9a6a));g.add(mound);
      const door=new T.Mesh(new T.BoxGeometry(0.04,0.045,0.02),m(0xe6ddc8));door.position.set(0,0.022,0.105);g.add(door);return g;},
  }),
  persia: sty(0xdcc39a, 0xb8874f, "flat", 0xd6bb8a, 0xa8926a, 0xd7a93c, {
    shrine:(T,r,m)=>{const g=new T.Group(); // fire altar (twin of Naqsh-e Rostam)
      const a=new T.Mesh(new T.CylinderGeometry(0.025,0.035,0.09,4),m(0xd6bb8a));a.position.y=0.045;g.add(a);
      const f=new T.Mesh(new T.ConeGeometry(0.014,0.028,5),m(0xe0842a));f.position.y=0.105;g.add(f);return g;},
    monument:(T,r,m)=>{const g=new T.Group(); // apadana: grid of very tall columns + slab
      for(let i=0;i<3;i++)for(let j=0;j<3;j++){
        const c=new T.Mesh(new T.CylinderGeometry(0.011,0.013,0.17,6),m(0xd6bb8a));
        c.position.set(-0.07+i*0.07,0.085,-0.07+j*0.07);g.add(c);
        const cap=new T.Mesh(new T.BoxGeometry(0.03,0.014,0.014),m(0xa8926a));
        cap.position.set(-0.07+i*0.07,0.177,-0.07+j*0.07);g.add(cap);}
      const slab=new T.Mesh(new T.BoxGeometry(0.2,0.02,0.2),m(0xb8874f));slab.position.y=0.195;g.add(slab);return g;},
    landmark:(T,r,m)=>{const g=new T.Group(); // terrace stair + gate of nations
      const terrace=new T.Mesh(new T.BoxGeometry(0.22,0.04,0.16),m(0xd6bb8a));terrace.position.y=0.02;g.add(terrace);
      for(const dx of[-0.05,0.05]){const bull=new T.Mesh(new T.BoxGeometry(0.035,0.10,0.035),m(0xa8926a));
        bull.position.set(dx,0.09,0);g.add(bull);}
      const lin=new T.Mesh(new T.BoxGeometry(0.14,0.02,0.045),m(0xb8874f));lin.position.y=0.15;g.add(lin);return g;},
  }),
  han: sty(0xd8cbb2, 0x6e7d5a, "eaves", 0xcabfa6, 0xb9a98a, 0xc9a83a, {
    shrine:(T,r,m)=>{const g=new T.Group(); // small que gate pillar
      const p=new T.Mesh(new T.BoxGeometry(0.03,0.10,0.03),m(0xcabfa6));p.position.y=0.05;g.add(p);
      const rf=new T.Mesh(new T.BoxGeometry(0.06,0.012,0.06),m(0x6e7d5a));rf.position.y=0.106;g.add(rf);return g;},
    monument:(T,r,m)=>{const g=new T.Group(); // watchtower: 3 shrinking storeys, wide eaves
      let y=0; const ws=[0.12,0.095,0.07];
      ws.forEach((w,i)=>{const h=0.06;
        const b=new T.Mesh(new T.BoxGeometry(w,h,w),m(0xd8cbb2,0.5));b.position.y=y+h/2;g.add(b);
        const e=new T.Mesh(new T.BoxGeometry(w*1.5,0.012,w*1.5),m(0x6e7d5a));e.position.y=y+h+0.006;g.add(e);
        y+=h+0.012;});
      return g;},
    landmark:(T,r,m)=>{const g=new T.Group(); // palace hall on terrace
      const ter=new T.Mesh(new T.BoxGeometry(0.24,0.03,0.16),m(0xcabfa6));ter.position.y=0.015;g.add(ter);
      const hall=new T.Mesh(new T.BoxGeometry(0.19,0.08,0.11),m(0xd8cbb2));hall.position.y=0.07;g.add(hall);
      const e1=new T.Mesh(new T.BoxGeometry(0.26,0.014,0.16),m(0x6e7d5a));e1.position.y=0.117;g.add(e1);
      const up=new T.Mesh(new T.BoxGeometry(0.13,0.05,0.08),m(0xd8cbb2));up.position.y=0.149;g.add(up);
      const e2=new T.Mesh(new T.BoxGeometry(0.18,0.013,0.11),m(0x6e7d5a));e2.position.y=0.181;g.add(e2);return g;},
  }),
  maurya: sty(0xd9c49c, 0xb98a4f, "flat", 0xcdb182, 0xb08d5c, 0xd0a13a, {
    shrine:(T,r,m)=>{const g=new T.Group(); // Ashokan pillar: polished shaft + capital
      const p=new T.Mesh(new T.CylinderGeometry(0.012,0.014,0.15,8),m(0xcdb182));p.position.y=0.075;g.add(p);
      const cap=new T.Mesh(new T.CylinderGeometry(0.02,0.016,0.02,8),m(0xb98a4f));cap.position.y=0.16;g.add(cap);
      const lions=new T.Mesh(new T.BoxGeometry(0.022,0.02,0.022),m(0xb98a4f));lions.position.y=0.18;g.add(lions);return g;},
    monument:(T,r,m)=>{const g=new T.Group(); // stupa: hemisphere + harmika + spire
      const dome=new T.Mesh(new T.SphereGeometry(0.09,10,6,0,Math.PI*2,0,Math.PI/2),m(0xd9c49c));g.add(dome);
      const harm=new T.Mesh(new T.BoxGeometry(0.03,0.02,0.03),m(0xb98a4f));harm.position.y=0.095;g.add(harm);
      const spire=new T.Mesh(new T.CylinderGeometry(0.004,0.004,0.05,5),m(0xd0a13a));spire.position.y=0.13;g.add(spire);
      const chattra=new T.Mesh(new T.CylinderGeometry(0.018,0.018,0.004,8),m(0xd0a13a));chattra.position.y=0.155;g.add(chattra);
      return g;},
    landmark:(T,r,m)=>{const g=new T.Group(); // palace of Pataliputra: hall on pillars
      for(let i=0;i<4;i++)for(let j=0;j<3;j++){
        const c=new T.Mesh(new T.CylinderGeometry(0.01,0.012,0.09,6),m(0xcdb182));
        c.position.set(-0.075+i*0.05,0.045,-0.04+j*0.04);g.add(c);}
      const hall=new T.Mesh(new T.BoxGeometry(0.2,0.05,0.12),m(0xd9c49c));hall.position.y=0.115;g.add(hall);
      const rf=new T.Mesh(new T.BoxGeometry(0.22,0.012,0.14),m(0xb98a4f));rf.position.y=0.146;g.add(rf);return g;},
  }),
  scythia: sty(0xc4a878, 0xa88a5a, "thatch", 0x9a8a6a, 0x8a795c, 0xd0a13a, {
    shrine:(T,r,m)=>{const g=new T.Group(); // stag standard
      const p=new T.Mesh(new T.CylinderGeometry(0.006,0.008,0.11,5),m(0x7a5b3a));p.position.y=0.055;g.add(p);
      const stag=new T.Mesh(new T.BoxGeometry(0.03,0.018,0.008),m(0xd0a13a));stag.position.y=0.12;g.add(stag);return g;},
    monument:(T,r,m)=>{const g=new T.Group(); // great yurt
      const w=new T.Mesh(new T.CylinderGeometry(0.08,0.085,0.05,10),m(0xc4a878,1));w.position.y=0.025;g.add(w);
      const rf=new T.Mesh(new T.ConeGeometry(0.09,0.06,10),m(0xa88a5a,1));rf.position.y=0.08;g.add(rf);return g;},
    landmark:(T,r,m)=>{const g=new T.Group(); // royal kurgan trio
      [[0,0,0.11],[ -0.12,0,0.07],[0.11,-0.02,0.06]].forEach(([x,z,R])=>{
        const k=new T.Mesh(new T.SphereGeometry(R,9,5,0,Math.PI*2,0,Math.PI/2),m(0x8a9a6a,0.5));
        k.position.set(x,0,z*0); k.position.z=z; g.add(k);});
      return g;},
  }),
};

function sty(wall, roofColor, roof, stone, wallRing, plaza, fns) {
  return { wall, roofColor, roof, stone, wallRing, plaza, gold: 0xd7a93c, ...fns };
}
