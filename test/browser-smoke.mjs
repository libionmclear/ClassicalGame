// Real-browser UI smoke (Playwright + system Edge, headless).
//
// Drives the DEFAULT 3D board through the game's test hook (window.HGTest) against
// the real served backend (signed in as admin), so it verifies interaction + state
// without depending on canvas pixel-picking or 2D DOM tile classes. Catches boot,
// render, selection, and turn-loop regressions that the DOM-stub tests cannot see.
//
// Run with: npm run test:browser  (builds public/ first)
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PORT = 8811;
const DB = path.join(process.env.TEMP || ".", "hegemon-uismoke-" + PORT + ".db");
for (const f of [DB, DB + "-wal", DB + "-shm"]) { try { fs.unlinkSync(f); } catch {} }
const base = `http://localhost:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
const check = (name, cond, extra) => {
  if (cond) { console.log("  ✔ " + name); }
  else { failures += 1; console.error("  ✗ FAIL: " + name + (extra !== undefined ? "  -> " + JSON.stringify(extra) : "")); }
};

let srv, browser;
try {
  srv = spawn(process.execPath, ["server/hegemon-server.mjs"], {
    cwd: path.resolve("."), env: { ...process.env, HEGEMON_PORT: String(PORT), HEGEMON_DB: DB }, stdio: ["ignore", "pipe", "pipe"],
  });
  srv.stderr.on("data", (d) => { const s = "" + d; if (!/ExperimentalWarning|trace-warnings/.test(s)) process.stderr.write("[srv] " + s); });
  let up = false;
  for (let i = 0; i < 80 && !up; i++) { try { up = (await fetch(base + "/api/health")).ok; } catch {} if (!up) await sleep(150); }
  if (!up) { console.error("FAIL: server did not start"); process.exit(1); }

  try { browser = await chromium.launch({ channel: "msedge", headless: true }); }
  catch (e) { console.log("SKIP: could not launch a browser (msedge):", e.message); process.exit(0); }

  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const pageErrors = [];   // uncaught JS exceptions — always a failure
  const consoleErrors = []; // console.error text (may include benign asset 404s)
  const resourceFails = []; // network-level load failures (missing optional assets)
  page.on("pageerror", (e) => pageErrors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("requestfailed", (r) => resourceFails.push(r.url()));
  page.on("response", (r) => { if (r.status() === 404) resourceFails.push(r.url()); });

  // Boot on the DEFAULT board, sign in as admin (clears the auth gate), reload.
  await page.goto(base + "/game.html");
  await page.waitForTimeout(700);
  await page.evaluate(async () => { await window.HGNet.login("admin", "1234567"); });
  await page.reload();
  await page.waitForFunction(() => window.HGTest && window.HGTest.ready(), { timeout: 8000 });
  const brief = await page.$("#brief-begin-btn");
  if (brief && await brief.isVisible()) { await brief.click(); await page.waitForTimeout(300); }

  // 1) A game is running, it's the human's turn, and they have starting forces.
  const s0 = await page.evaluate(() => window.HGTest.snapshot());
  check("a game is running (turn >= 1)", s0 && s0.turn >= 1, s0);
  check("it opens on the human's turn", s0 && s0.current === s0.humanId, s0);
  check("the human has starting units", s0 && s0.myUnits >= 1, s0);
  check("the human has a capital", s0 && !!s0.capital, s0);
  check("nothing is selected on a fresh game", s0 && !s0.selectedUnitId && !s0.selectedCityId, s0);

  // 2) The board actually rendered (default 3D canvas is sized and visible).
  const canvasOk = await page.evaluate(() => {
    const c = document.getElementById("board3d-canvas");
    if (!c) return false;
    const r = c.getBoundingClientRect();
    return getComputedStyle(c).display !== "none" && r.width > 200 && r.height > 200;
  });
  check("the 3D board canvas is rendered and sized", canvasOk);

  // 3) The HUD reflects the running game.
  const hud = await page.evaluate(() => ({
    res: (document.getElementById("resource-bar") || {}).textContent || "",
    turn: (document.getElementById("turn-indicator") || {}).textContent || "",
  }));
  check("the resource HUD shows numbers", /\d/.test(hud.res), hud);
  check("the turn indicator shows the turn", /Turn|\d/.test(hud.turn), hud);

  // 4) Selecting a unit (board-agnostic, via the hook) updates the selection.
  const u = s0.firstUnit;
  await page.evaluate(([q, r]) => window.HGTest.clickTile(q, r), [u.q, u.r]);
  const s1 = await page.evaluate(() => window.HGTest.snapshot());
  check("clicking a unit's tile selects that unit", s1 && s1.selectedUnitId === u.id, { want: u.id, got: s1 && s1.selectedUnitId });
  const selLine = await page.locator("#selection-line").textContent();
  check("the selection line reflects the selected unit", /Move|move/.test(selLine || ""), selLine);

  // 5) Ending the turn runs the AI and returns control to the human on a later turn.
  const before = s1.turn;
  await page.evaluate(() => window.HGTest.endTurn());
  await page.waitForTimeout(400);
  const s2 = await page.evaluate(() => window.HGTest.snapshot());
  check("ending the turn advances the game turn", s2 && s2.turn > before, { before, after: s2 && s2.turn });
  check("control returns to the human", s2 && s2.current === s2.humanId, s2);

  // 6) No SCRIPT errors through the whole flow. Benign asset 404s (e.g. civs
  //    without sprite art — see KNOWN-ISSUES) are network-level, not JS errors, so
  //    they're reported for visibility but don't fail the smoke.
  const scriptConsoleErrors = consoleErrors.filter((e) => !/Failed to load resource|status of 404|net::ERR/.test(e));
  check("no uncaught JS exceptions", pageErrors.length === 0, pageErrors.slice(0, 4));
  check("no script console errors", scriptConsoleErrors.length === 0, scriptConsoleErrors.slice(0, 4));
  if (resourceFails.length) {
    const uniq = [...new Set(resourceFails.map((u) => u.replace(base, "")))];
    console.log("  · benign missing assets (404, not failures): " + uniq.slice(0, 8).join(", ") + (uniq.length > 8 ? " …" : ""));
  }

  if (failures) { console.error(`\nBROWSER SMOKE FAILED (${failures} check${failures === 1 ? "" : "s"})`); process.exitCode = 1; }
  else { console.log("\nBROWSER SMOKE PASSED — boots, renders the 3D board, selects a unit, ends the turn, 0 script errors"); }
} catch (e) {
  console.error("BROWSER SMOKE ERROR:", e && e.message);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close().catch(() => {});
  if (srv) srv.kill();
  for (const f of [DB, DB + "-wal", DB + "-shm"]) { try { fs.unlinkSync(f); } catch {} }
}
