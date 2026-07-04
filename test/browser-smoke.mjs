// Real-browser smoke test (Playwright + system Edge, headless).
// Catches interaction/CSS regressions that the DOM-stub tests cannot see —
// e.g. a 3D transform or an overlay that stops tiles receiving clicks.
//
// Run with: npm run test:browser  (builds public/ first)
import { chromium } from "playwright";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Force the classic 2D board — this test drives DOM tiles (the 3D board is
// verified separately with WebGL flags).
const fileUrl = pathToFileURL(path.resolve("public/game.html")).href + "?board=2d";
const fail = (msg) => {
  console.error("FAIL:", msg);
  process.exitCode = 1;
};

let browser;
try {
  browser = await chromium.launch({ channel: "msedge", headless: true });
} catch (e) {
  console.log("SKIP: could not launch a browser (msedge):", e.message);
  process.exit(0); // don't fail the suite if no browser is available
}

const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push("console.error: " + m.text());
});

await page.goto(fileUrl);
await page.waitForSelector(".tile", { timeout: 5000 });

// Use the authored Italia scenario for a deterministic start (units with room
// to move), so the interaction checks below aren't at the mercy of the RNG map.
await page.selectOption("#map-size-select", "italia");
await page.click("#new-game-btn");
await page.waitForTimeout(300);

// A new game opens with a campaign briefing — dismiss it before interacting.
const briefBtn = page.locator("#brief-begin-btn");
if (await briefBtn.isVisible()) {
  await briefBtn.click();
  await page.waitForTimeout(150);
}

// 1) The result overlay must be hidden on a fresh game.
const modalVisible = await page
  .locator("#result-modal")
  .evaluate((el) => getComputedStyle(el).display !== "none");
if (modalVisible) fail("result modal is covering the board on a fresh game");

// 1b) A fresh game auto-selects the capital, so the build menu is live immediately.
const startSel = await page.locator("#selection-line").textContent();
if (/Nothing selected/.test(startSel || "")) fail("capital was not auto-selected on new game: " + startSel);
const startBuild = await page.locator("#build-menu .build-item:not([disabled])").count();
if (startBuild < 1) fail("build menu has no enabled options on a fresh game");

// 2) Clicking one of the human's own tiles must select something.
// 2) Clicking a unit tile selects that unit.
const owned = page.locator(".tile.owner-rome");
if ((await owned.count()) === 0) fail("no owner-rome tiles rendered");
// A unit tile shows either the figure-cluster fallback or a civ unit sprite.
const unitTiles = owned.filter({ has: page.locator(".figures, .unit-sprite") });
if ((await unitTiles.count()) === 0) fail("no rome unit tiles rendered");
await unitTiles.first().scrollIntoViewIfNeeded();
await unitTiles.first().click({ timeout: 3000 });
let sel = await page.locator("#selection-line").textContent();
if (!/Move /.test(sel || "")) fail("clicking a unit tile did not select a unit: " + sel);

// 3) With a unit selected, clicking a reachable tile issues a move (which
//    deselects the unit — the selection line changes).
let moved = false;
const reachable = page.locator(".tile.reachable");
async function tryMove() {
  if ((await reachable.count()) === 0) return false;
  const selBefore = await page.locator("#selection-line").textContent();
  await reachable.first().click();
  await page.waitForTimeout(100);
  const selAfter = await page.locator("#selection-line").textContent();
  return selBefore !== selAfter;
}
moved = await tryMove();
if (!moved) {
  const n = await unitTiles.count();
  for (let i = 1; i < n && !moved; i += 1) {
    await unitTiles.nth(i).click();
    moved = await tryMove();
  }
}
if (!moved) fail("could not move a unit to a reachable tile");

if (errors.length) fail("page errors: " + errors.slice(0, 3).join(" || "));

await browser.close();

if (process.exitCode) {
  console.log("BROWSER SMOKE FAILED");
} else {
  console.log("BROWSER SMOKE PASSED — modal hidden, tiles selectable, unit moves");
}
