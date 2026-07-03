// Real-browser smoke test (Playwright + system Edge, headless).
// Catches interaction/CSS regressions that the DOM-stub tests cannot see —
// e.g. a 3D transform or an overlay that stops tiles receiving clicks.
//
// Run with: npm run test:browser  (builds public/ first)
import { chromium } from "playwright";
import path from "node:path";
import { pathToFileURL } from "node:url";

const fileUrl = pathToFileURL(path.resolve("public/game.html")).href;
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

// 1) The result overlay must be hidden on a fresh game.
const modalVisible = await page
  .locator("#result-modal")
  .evaluate((el) => getComputedStyle(el).display !== "none");
if (modalVisible) fail("result modal is covering the board on a fresh game");

// 2) Clicking one of the human's own tiles must select something.
const before = await page.locator("#selection-line").textContent();
const owned = page.locator(".tile.owner-rome");
if ((await owned.count()) === 0) fail("no owner-rome tiles rendered");
await owned.first().scrollIntoViewIfNeeded();
await owned.first().click({ timeout: 3000 });
const after = await page.locator("#selection-line").textContent();
if (before === after) fail("clicking an owned tile did not change the selection");

// 3) Selecting a unit and clicking a reachable tile must issue a move.
let moved = false;
const unitTiles = owned;
const n = await unitTiles.count();
for (let i = 0; i < n; i += 1) {
  await unitTiles.nth(i).click();
  const sel = await page.locator("#selection-line").textContent();
  if (sel && sel.includes("Unit selected")) {
    const reachable = page.locator(".tile.reachable");
    if ((await reachable.count()) > 0) {
      const logBefore = await page.locator("#action-log").textContent();
      await reachable.first().click();
      const logAfter = await page.locator("#action-log").textContent();
      moved = logAfter !== logBefore;
    }
    break;
  }
}
if (!moved) fail("could not select a unit and move it to a reachable tile");

if (errors.length) fail("page errors: " + errors.slice(0, 3).join(" || "));

await browser.close();

if (process.exitCode) {
  console.log("BROWSER SMOKE FAILED");
} else {
  console.log("BROWSER SMOKE PASSED — modal hidden, tiles selectable, unit moves");
}
