import { execSync } from "node:child_process";

function run(cmd, options = {}) {
  return execSync(cmd, {
    stdio: "pipe",
    encoding: "utf8",
    ...options
  });
}

const rawMessage = process.argv.slice(2).join(" ").trim();
const fallbackMessage = `chore: auto publish ${new Date().toISOString()}`;
const message = rawMessage || fallbackMessage;

const status = run("git status --porcelain").trim();
if (!status) {
  console.log("No changes to publish.");
  process.exit(0);
}

run("git add -A", { stdio: "inherit" });
run(`git commit -m \"${message.replace(/\"/g, '\\\"')}\"`, { stdio: "inherit" });
run("git push origin main", { stdio: "inherit" });

console.log("Published to GitHub. Vercel will auto-deploy from the connected repo.");
