// HEGEMON — districtModels.js : procedural district meshes (Cities v3 §5)
// A district is a small urban scene that fills one hex ADJACENT to the city
// centre. Pure geometry — no assets, no DOM. Drop-in for board3d.ts:
//   buildDistrict(THREE, { type, style, seed, accent, pillaged, work })
// Returns a THREE.Group centred at origin, ground at y=0, footprint ~radius 0.6
// (scale to hex size at the call site, as with buildCity).
//
// Each district = 1 anchor structure + a few civ-style filler buildings + a
// ground treatment, in the civ's architectural palette (reuses cityModels
// helpers: prism roofs, colonnade, classical temple, the 12 STYLE palettes).
// Pillaged = blackened material swap + two smoke columns.

import { STYLES, prism, colonnade, classicalTemple, mulberry32, jitterColor } from "./cityModels.js";

const WATER = 0x3f6d8a;

export function buildDistrict(THREE, opts = {}) {
  const type = opts.type || "civic";
  const style = STYLES[opts.style] ? opts.style : "rome";
  const S = STYLES[style];
  const rng = mulberry32((opts.seed ?? 4321) >>> 0);
  const pillaged = !!opts.pillaged;
  const accent = opts.accent;
  const g = new THREE.Group();
  g.name = `district-${type}-${style}`;

  // Material factory. Pillaged districts char toward soot — the blackened
  // material swap of §5 (desaturate + darken every colour that flows through).
  const mat = (hex, jitter = 0) => {
    const col = jitterColor(THREE, hex, rng, jitter);
    if (pillaged) {
      const hsl = {}; col.getHSL(hsl);
      col.setHSL(hsl.h, hsl.s * 0.22, Math.max(0.04, hsl.l * 0.26));
    }
    return new THREE.MeshStandardMaterial({ color: col, flatShading: true, roughness: 0.94, metalness: 0.0 });
  };
  const box = (w, h, d, hex, j = 0) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(hex, j));
  const cyl = (rt, rb, h, seg, hex, j = 0) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(hex, j));

  // ---- ground treatment (a slightly raised disc; avoids z-fighting with terrain)
  const R = 0.52;
  const groundHex =
    type === "aqueduct" ? WATER :
    type === "harbour" ? WATER :
    type === "barracks" ? 0xbaa578 :        // beaten-earth drill square
    type === "leisure" ? S.plaza :
    S.stone;                                  // paved forum / precinct
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.02, 14), mat(groundHex, 0.2));
  pad.position.y = 0.01;
  g.add(pad);
  // A leisure/baths court gets a bright pool inset; barracks a marked square.
  if (type === "leisure") { const pool = cyl(0.16, 0.16, 0.021, 12, WATER); pool.position.set(-0.16, 0.012, 0.12); g.add(pool); }

  // ------------------------------------------------------------------ anchors
  switch (type) {
    case "civic": {                           // colonnaded hall — Senate / Agora
      const w = 0.36, d = 0.16, colH = 0.14;
      const podium = box(w * 1.1, 0.03, d * 1.15, S.stone); podium.position.y = 0.015; g.add(podium);
      g.add(colonnade(THREE, S, mat, w, d, colH, 7, 2));
      const entab = box(w * 1.06, 0.024, d * 1.1, S.stone); entab.position.y = 0.03 + colH; g.add(entab);
      const roof = new THREE.Mesh(prism(THREE, w * 1.1, 0.06, d * 1.14), mat(S.roofColor)); roof.position.y = 0.05 + colH; g.add(roof);
      const bema = box(0.08, 0.03, 0.08, S.stone); bema.position.set(0, 0.015, d * 0.9); g.add(bema); // speaker's platform
      break;
    }
    case "market": {                          // stall rows + awning planes
      for (let row = 0; row < 2; row++) for (let i = 0; i < 4; i++) {
        const x = -0.24 + i * 0.16, z = (row ? 0.12 : -0.12);
        const stall = box(0.11, 0.07, 0.09, S.wall, 1); stall.position.set(x, 0.035, z); g.add(stall);
        const awnHex = row ? (accent || S.roofColor) : S.roofColor;
        const awn = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.006, 0.11), new THREE.MeshStandardMaterial({ color: jitterColor(THREE, awnHex, rng, 1), flatShading: true, roughness: 0.8, side: THREE.DoubleSide }));
        awn.position.set(x, 0.10, z + (row ? 0.03 : -0.03)); awn.rotation.x = (row ? 1 : -1) * 0.5; g.add(awn);
      }
      break;
    }
    case "affluent": {                        // villa quarter — a few fine houses + garden
      const garden = cyl(0.13, 0.13, 0.016, 10, 0x6f8a4e); garden.position.set(0.16, 0.012, -0.1); g.add(garden);
      villa(0.02, 0.02); villa(-0.2, 0.08); villa(-0.05, -0.2);
      function villa(x, z) {
        const v = new THREE.Group();
        v.add(fillerHouse(0.15, 0.09, 0.12, 1));
        const porch = colonnade(THREE, S, mat, 0.15, 0.02, 0.06, 4, 2); porch.position.z = 0.07; v.add(porch);
        v.position.set(x, 0, z); v.rotation.y = rng() * 0.6; g.add(v);
      }
      break;
    }
    case "crammed": {                         // insulae — tall thin tenement blocks (TALLER than a domus)
      const cols = [-0.22, -0.08, 0.06, 0.2];
      cols.forEach((x, i) => {
        const h = 0.28 + rng() * 0.1, w = 0.1;
        const blk = box(w, h, 0.1, S.wall, 1); blk.position.set(x, h / 2, (i % 2 ? 0.06 : -0.06)); g.add(blk);
        // window rows — thin dark recesses read as storeys
        for (let s = 1; s <= 3; s++) { const win = box(w * 0.72, 0.02, 0.005, 0x2b2620); win.position.set(x, s * (h / 4), (i % 2 ? 0.06 : -0.06) + 0.051); g.add(win); }
        const roof = box(w * 1.06, 0.02, 0.106, S.roofColor); roof.position.set(x, h + 0.01, (i % 2 ? 0.06 : -0.06)); g.add(roof);
      });
      break;
    }
    case "aqueduct": {                        // the signature: a row of arches marching to the centre
      for (let i = 0; i < 3; i++) { const a = arch(); a.position.x = -0.2 + i * 0.2; g.add(a); }
      const channel = box(0.62, 0.02, 0.05, S.stone); channel.position.set(0, 0.19, 0); g.add(channel); // water conduit on top
      function arch() {
        const grp = new THREE.Group(); const pierH = 0.16, span = 0.09;
        for (const dx of [-span / 2, span / 2]) { const p = box(0.03, pierH, 0.05, S.stone, 0.4); p.position.set(dx, pierH / 2, 0); grp.add(p); }
        const ring = new THREE.Mesh(new THREE.CylinderGeometry(span / 2, span / 2, 0.05, 10, 1, false, 0, Math.PI), mat(S.stone, 0.4));
        ring.rotation.z = Math.PI; ring.rotation.y = Math.PI / 2; ring.position.y = pierH; grp.add(ring);
        const cap = box(0.14, 0.02, 0.055, S.stone, 0.4); cap.position.y = pierH + 0.02; grp.add(cap);
        return grp;
      }
      break;
    }
    case "barracks": {                        // drill hall + palisade + weapon rack + watchtower
      const hall = box(0.3, 0.09, 0.13, S.wall, 0.5); hall.position.set(-0.06, 0.045, -0.12); g.add(hall);
      const hroof = new THREE.Mesh(prism(THREE, 0.32, 0.05, 0.15), mat(S.roofColor)); hroof.position.set(-0.06, 0.115, -0.12); g.add(hroof);
      // palisade ring of stakes around the drill square
      const n = 14; for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2; const stake = cyl(0.008, 0.012, 0.09, 5, 0x6b5334); stake.position.set(Math.cos(t) * 0.44, 0.045, Math.sin(t) * 0.44); g.add(stake); }
      const tower = box(0.06, 0.2, 0.06, S.stone, 0.3); tower.position.set(0.34, 0.1, 0.28); g.add(tower);
      const tcap = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.04, 4), mat(S.roofColor)); tcap.position.set(0.34, 0.22, 0.28); g.add(tcap);
      // weapon rack: crossed spears
      for (const s of [-1, 1]) { const spear = cyl(0.004, 0.004, 0.16, 5, 0x8a6b3a); spear.position.set(0.16, 0.06, -0.02); spear.rotation.z = s * 0.4; g.add(spear); }
      break;
    }
    case "harbour": {                         // breakwater + shipsheds + jetty (coast only)
      // curved breakwater into the water
      for (let i = 0; i < 7; i++) { const t = -0.6 + i * 0.16; const bw = box(0.12, 0.05, 0.08, S.stone, 0.4); bw.position.set(t, 0.025, 0.34 - Math.abs(t) * 0.2); g.add(bw); }
      for (let i = 0; i < 3; i++) {             // shipsheds: open-front gable sheds
        const shed = new THREE.Group();
        const walls = box(0.1, 0.06, 0.16, S.wall, 0.5); walls.position.y = 0.03; shed.add(walls);
        const roof = new THREE.Mesh(prism(THREE, 0.12, 0.05, 0.17), mat(S.roofColor)); roof.position.y = 0.085; shed.add(roof);
        shed.position.set(-0.18 + i * 0.16, 0, -0.14); g.add(shed);
      }
      const jetty = box(0.05, 0.02, 0.3, 0x6b5334); jetty.position.set(0.28, 0.02, 0.1); g.add(jetty);
      break;
    }
    case "leisure": {                         // baths — a domed hall + halls beside the pool
      const hall = box(0.2, 0.1, 0.16, S.wall, 0.4); hall.position.set(0.1, 0.05, -0.08); g.add(hall);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2), mat(S.roofColor)); dome.position.set(0.1, 0.1, -0.08); g.add(dome);
      const side = box(0.1, 0.07, 0.1, S.wall, 0.6); side.position.set(-0.02, 0.035, 0.14); g.add(side);
      const sroof = box(0.11, 0.02, 0.11, S.roofColor); sroof.position.set(-0.02, 0.08, 0.14); g.add(sroof);
      break;
    }
    case "temple": {                          // sacred precinct — enclosure wall + shrine + altar
      // low precinct wall (square enclosure with a gap)
      const seg = 0.5, wh = 0.05;
      for (const [x, z, w, d] of [[0, -seg / 2, seg, 0.02], [0, seg / 2, seg, 0.02], [-seg / 2, 0, 0.02, seg], [seg / 2, 0, 0.02, seg]]) {
        const wall = box(w, wh, d, S.wallRing, 0.4); wall.position.set(x, wh / 2, z); g.add(wall);
      }
      const shrine = classicalTemple(THREE, S, mat, 0.7); shrine.position.set(0, 0, -0.04); g.add(shrine);
      const altar = box(0.06, 0.04, 0.06, S.stone); altar.position.set(0, 0.02, 0.16); g.add(altar);
      break;
    }
    case "greatwork":
      g.add(buildGreatWork(THREE, opts.work || "", S, mat, box, cyl, accent, rng));
      break;
    default: {
      const blk = box(0.16, 0.1, 0.16, S.wall, 1); blk.position.y = 0.05; g.add(blk);
    }
  }

  // ---- civ-style filler buildings around the anchor (skip harbour: it's on water)
  if (type !== "harbour" && type !== "greatwork" && type !== "crammed") {
    const nFill = 3 + Math.floor(rng() * 3);
    for (let i = 0; i < nFill; i++) {
      const a = rng() * Math.PI * 2, r = 0.34 + rng() * 0.14;
      const h = box(0.06 + rng() * 0.05, 0.07 + rng() * 0.05, 0.06 + rng() * 0.05, S.wall, 1);
      const house = fillerHouse(0.08, 0.07, 0.08, 1);
      house.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      house.rotation.y = a; g.add(house); void h;
    }
  }

  // ---- pillaged: two drifting smoke columns rising from the ruin (§5)
  if (pillaged) {
    for (const [sx, sz] of [[-0.1, 0.05], [0.14, -0.08]]) g.add(smokeColumn(THREE, rng, sx, sz));
  }

  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;

  // ---- local: a compact civ-style house (body + style roof) ----
  function fillerHouse(w, h, d, jit) {
    const grp = new THREE.Group();
    const body = box(w, h, d, S.wall, jit); body.position.y = h / 2; grp.add(body);
    const roofH = h * 0.6;
    let roof;
    switch (S.roof) {
      case "gable": roof = new THREE.Mesh(prism(THREE, w * 1.12, roofH, d * 1.12), mat(S.roofColor, jit)); roof.position.y = h + roofH / 2; break;
      case "thatch": roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.78, roofH * 1.3, 7), mat(S.roofColor, jit)); roof.position.y = h + roofH * 0.5; break;
      case "eaves": roof = new THREE.Mesh(new THREE.BoxGeometry(w * 1.5, roofH * 0.25, d * 1.5), mat(S.roofColor, jit)); roof.position.y = h + roofH * 0.12; break;
      default: roof = new THREE.Mesh(new THREE.BoxGeometry(w * 1.06, roofH * 0.3, d * 1.06), mat(S.roofColor, jit)); roof.position.y = h + roofH * 0.12; // flat
    }
    grp.add(roof);
    return grp;
  }
}

// ============================================================ Great Works
// Signature wonders get a bespoke silhouette; everything else gets a dignified
// gilded monument so any card-unlocked Great Work still reads as monumental.
function buildGreatWork(THREE, work, S, mat, box, cyl, accent, rng) {
  const g = new THREE.Group();
  const id = String(work).toLowerCase();
  const GOLD = 0xd7a93c;
  const has = (...k) => k.some((s) => id.includes(s));

  if (has("colosseum", "amphi", "circus", "arena")) {          // amphitheatre ring
    const Rr = 0.28, n = 20, h = 0.16;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const p = box(0.05, h, 0.03, 0xe0d6c0, 0.4); p.position.set(Math.cos(a) * Rr, h / 2, Math.sin(a) * Rr); p.rotation.y = -a; g.add(p); }
    const rim = cyl(Rr + 0.03, Rr + 0.03, 0.03, n, 0xe0d6c0); rim.position.y = h + 0.015; g.add(rim);
    const inner = cyl(Rr - 0.08, Rr - 0.08, 0.02, n, S.stone); inner.position.y = 0.012; g.add(inner);
  } else if (has("pyramid", "sphinx")) {                        // pyramids: 4-sided cones + a sphinx block
    [[0, 0, 0.22], [-0.2, 0.08, 0.14], [0.18, 0.1, 0.11]].forEach(([x, z, s]) => { const py = new THREE.Mesh(new THREE.ConeGeometry(s, s * 1.3, 4), mat(0xe3d2a8, 0.2)); py.rotation.y = Math.PI / 4; py.position.set(x, s * 0.65, z); g.add(py); });
    const sph = box(0.16, 0.06, 0.07, 0xd9c493); sph.position.set(0.16, 0.03, -0.14); g.add(sph);
  } else if (has("stonehenge", "henge", "carnutes", "nemeton")) { // trilithon ring
    const Rr = 0.26, n = 8;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; for (const off of [-0.05, 0.05]) { const up = box(0.05, 0.2, 0.05, 0x9a9490, 0.3); up.position.set(Math.cos(a) * Rr + Math.cos(a + Math.PI / 2) * off, 0.1, Math.sin(a) * Rr + Math.sin(a + Math.PI / 2) * off); g.add(up); } const lint = box(0.15, 0.04, 0.06, 0x9a9490, 0.3); lint.position.set(Math.cos(a) * Rr, 0.22, Math.sin(a) * Rr); lint.rotation.y = -a; g.add(lint); }
  } else if (has("wall", "oppidum")) {                          // great wall segment + towers
    const seg = box(0.6, 0.14, 0.08, S.wallRing, 0.3); seg.position.y = 0.07; g.add(seg);
    for (const x of [-0.28, 0, 0.28]) { const tw = box(0.1, 0.2, 0.11, S.wallRing, 0.3); tw.position.set(x, 0.1, 0); g.add(tw); const cap = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.05, 4), mat(S.roofColor)); cap.position.set(x, 0.22, 0); g.add(cap); }
  } else if (has("pharos", "lighthouse", "cothon", "harbour", "piraeus")) { // lighthouse/harbour tower
    const t1 = cyl(0.06, 0.09, 0.18, 8, S.wall, 0.3); t1.position.y = 0.09; g.add(t1);
    const t2 = cyl(0.04, 0.06, 0.12, 8, S.wall, 0.3); t2.position.y = 0.24; g.add(t2);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.06, 6), mat(0xe0a13a)); flame.position.y = 0.33; g.add(flame);
  } else if (has("stupa", "kurgan", "tumulus", "mound")) {      // great dome/mound
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 9, 0, Math.PI * 2, 0, Math.PI / 2), mat(S.wall, 0.2)); g.add(dome);
    const spire = cyl(0.01, 0.01, 0.1, 6, GOLD); spire.position.y = 0.22; g.add(spire);
  } else {                                                       // Parthenon / Karnak / generic grand temple
    const grand = classicalTemple(THREE, S, mat, 1.6); g.add(grand);
    const gild = cyl(0.02, 0.02, 0.06, 6, GOLD); gild.position.y = 0.3; g.add(gild);
  }
  // A gilded standard marks it as a wonder (accent banner if provided).
  if (accent) { const pole = cyl(0.006, 0.006, 0.34, 5, 0x6b5a44); pole.position.set(0.3, 0.17, 0.24); g.add(pole); const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.06), new THREE.MeshStandardMaterial({ color: accent, flatShading: true, side: THREE.DoubleSide })); flag.position.set(0.35, 0.28, 0.24); g.add(flag); }
  return g;
}

// A drifting soot column for a pillaged district: stacked dark translucent puffs.
function smokeColumn(THREE, rng, x, z) {
  const grp = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const s = 0.03 + i * 0.02;
    const puff = new THREE.Mesh(
      new THREE.IcosahedronGeometry(s, 0),
      new THREE.MeshStandardMaterial({ color: 0x2a2622, flatShading: true, transparent: true, opacity: 0.5 - i * 0.07, roughness: 1 })
    );
    puff.position.set(x + (rng() - 0.5) * 0.06 * i, 0.08 + i * 0.07, z + (rng() - 0.5) * 0.06 * i);
    grp.add(puff);
  }
  return grp;
}
