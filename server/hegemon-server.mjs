// HEGEMON — self-contained backend (Phase 1: accounts · friends · admin).
//
// One Node process, no external services: built-in http + node:sqlite + crypto.
// It serves the static client (so client + API share one origin — no CORS) and
// exposes a small JSON API under /api/*. Data lives in a single SQLite file
// (server/hegemon.db). Realtime multiplayer (lobby/matchmaking) is Phase 2 and
// will add a WebSocket layer to this same server.
//
//   npm run server            # http://localhost:8787
//   HEGEMON_PORT=9000 HEGEMON_ADMIN_PW=secret npm run server
//
import http from "node:http";
import { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const PORT = parseInt(process.env.HEGEMON_PORT || "8787", 10);
const DB_PATH = process.env.HEGEMON_DB || path.join(__dirname, "hegemon.db");
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ---------------------------------------------------------------- database
const db = new DatabaseSync(DB_PATH);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS users (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    username     TEXT UNIQUE NOT NULL,
    email        TEXT,
    display_name TEXT,
    salt         TEXT NOT NULL,
    pw_hash      TEXT NOT NULL,
    is_admin     INTEGER NOT NULL DEFAULT 0,
    banned       INTEGER NOT NULL DEFAULT 0,
    stats        TEXT NOT NULL DEFAULT '{}',
    created_at   INTEGER NOT NULL,
    last_seen    INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS friendships (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_id INTEGER NOT NULL,
    addressee_id INTEGER NOT NULL,
    status       TEXT NOT NULL,
    created_at   INTEGER NOT NULL,
    UNIQUE(requester_id, addressee_id)
  );
`);

// ---------------------------------------------------------------- crypto
function hashPassword(password, salt) {
  return crypto.scryptSync(String(password), salt, 32).toString("hex");
}
function verifyPassword(password, salt, hash) {
  const a = Buffer.from(hashPassword(password, salt), "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function newToken() { return crypto.randomBytes(24).toString("hex"); }
const now = () => Date.now();

// ---------------------------------------------------------------- seed admin
(function seedAdmin() {
  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get("admin");
  if (existing) return;
  const salt = crypto.randomBytes(16).toString("hex");
  const pw = process.env.HEGEMON_ADMIN_PW || "1234567";
  db.prepare(
    "INSERT INTO users (username, email, display_name, salt, pw_hash, is_admin, stats, created_at) VALUES (?,?,?,?,?,?,?,?)"
  ).run("admin", "admin@hegemon.local", "Admin", salt, hashPassword(pw, salt), 1, "{}", now());
  console.log(`[seed] admin account created (password: ${process.env.HEGEMON_ADMIN_PW ? "from HEGEMON_ADMIN_PW" : "1234567 — change it!"})`);
})();

// ---------------------------------------------------------------- helpers
function publicUser(u) {
  if (!u) return null;
  let stats = {};
  try { stats = JSON.parse(u.stats || "{}"); } catch { stats = {}; }
  return {
    id: u.id, username: u.username, displayName: u.display_name || u.username,
    isAdmin: !!u.is_admin, banned: !!u.banned, stats,
    createdAt: u.created_at, lastSeen: u.last_seen,
  };
}
function userById(id) { return db.prepare("SELECT * FROM users WHERE id = ?").get(id); }
function userByName(name) { return db.prepare("SELECT * FROM users WHERE username = ?").get(String(name || "").toLowerCase()); }

function userFromToken(token) {
  if (!token) return null;
  const s = db.prepare("SELECT * FROM sessions WHERE token = ?").get(token);
  if (!s || s.expires_at < now()) { if (s) db.prepare("DELETE FROM sessions WHERE token = ?").run(token); return null; }
  const u = userById(s.user_id);
  if (u && !u.banned) db.prepare("UPDATE users SET last_seen = ? WHERE id = ?").run(now(), u.id);
  return u && !u.banned ? u : null;
}

// friendship status between viewer a and other b, from a's point of view.
function friendState(aId, bId) {
  const row = db.prepare(
    "SELECT * FROM friendships WHERE (requester_id=? AND addressee_id=?) OR (requester_id=? AND addressee_id=?)"
  ).get(aId, bId, bId, aId);
  if (!row) return "none";
  if (row.status === "accepted") return "friends";
  return row.requester_id === aId ? "pending_out" : "pending_in";
}

// ---------------------------------------------------------------- http utils
function send(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve) => {
    let data = ""; req.on("data", (c) => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on("end", () => { try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); } });
  });
}
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".glb": "model/gltf-binary", ".webmanifest": "application/manifest+json", ".ico": "image/x-icon" };
function serveStatic(req, res) {
  let p = decodeURIComponent((req.url || "/").split("?")[0]);
  if (p === "/") p = "/game.html";
  const file = path.join(PUBLIC, path.normalize(p));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); res.end("forbidden"); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); res.end("not found"); return; }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(buf);
  });
}
function bearer(req) {
  const h = req.headers["authorization"] || "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
}

// ---------------------------------------------------------------- routes
const routes = {}; // "METHOD /api/path": (ctx) => void
function route(key, handler) { routes[key] = handler; }

// --- auth ---
route("POST /api/register", async ({ res, body }) => {
  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!/^[a-z0-9_]{3,20}$/.test(username)) return send(res, 400, { error: "Username must be 3–20 chars (letters, numbers, _)." });
  if (password.length < 6) return send(res, 400, { error: "Password must be at least 6 characters." });
  if (userByName(username)) return send(res, 409, { error: "That username is taken." });
  const salt = crypto.randomBytes(16).toString("hex");
  const info = db.prepare(
    "INSERT INTO users (username, email, display_name, salt, pw_hash, created_at) VALUES (?,?,?,?,?,?)"
  ).run(username, String(body.email || ""), String(body.displayName || username), salt, hashPassword(password, salt), now());
  const u = userById(Number(info.lastInsertRowid));
  const token = newToken();
  db.prepare("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?,?,?,?)").run(token, u.id, now(), now() + SESSION_TTL_MS);
  send(res, 200, { token, user: publicUser(u) });
});

route("POST /api/login", async ({ res, body }) => {
  const u = userByName(body.username);
  if (!u || !verifyPassword(String(body.password || ""), u.salt, u.pw_hash)) return send(res, 401, { error: "Wrong username or password." });
  if (u.banned) return send(res, 403, { error: "This account is banned." });
  const token = newToken();
  db.prepare("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?,?,?,?)").run(token, u.id, now(), now() + SESSION_TTL_MS);
  db.prepare("UPDATE users SET last_seen = ? WHERE id = ?").run(now(), u.id);
  send(res, 200, { token, user: publicUser(u) });
});

route("POST /api/logout", async ({ res, token }) => {
  if (token) db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  send(res, 200, { ok: true });
});

route("GET /api/me", async ({ res, user }) => {
  if (!user) return send(res, 401, { error: "Not signed in." });
  send(res, 200, { user: publicUser(user) });
});

// --- users / search ---
route("GET /api/users/search", async ({ res, user, query }) => {
  if (!user) return send(res, 401, { error: "Not signed in." });
  const q = String(query.q || "").trim().toLowerCase();
  if (q.length < 2) return send(res, 200, { users: [] });
  const rows = db.prepare("SELECT * FROM users WHERE username LIKE ? AND id != ? LIMIT 20").all(q + "%", user.id);
  send(res, 200, { users: rows.map((r) => ({ ...publicUser(r), friendState: friendState(user.id, r.id) })) });
});

// --- friends ---
route("GET /api/friends", async ({ res, user }) => {
  if (!user) return send(res, 401, { error: "Not signed in." });
  const rows = db.prepare("SELECT * FROM friendships WHERE requester_id = ? OR addressee_id = ?").all(user.id, user.id);
  const friends = [], incoming = [], outgoing = [];
  for (const f of rows) {
    const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
    const other = publicUser(userById(otherId));
    if (!other) continue;
    if (f.status === "accepted") friends.push(other);
    else if (f.requester_id === user.id) outgoing.push(other);
    else incoming.push(other);
  }
  send(res, 200, { friends, incoming, outgoing });
});

route("POST /api/friends/request", async ({ res, user, body }) => {
  if (!user) return send(res, 401, { error: "Not signed in." });
  const other = body.userId ? userById(Number(body.userId)) : userByName(body.username);
  if (!other) return send(res, 404, { error: "No such user." });
  if (other.id === user.id) return send(res, 400, { error: "You can't befriend yourself." });
  const st = friendState(user.id, other.id);
  if (st === "friends") return send(res, 409, { error: "Already friends." });
  if (st === "pending_out") return send(res, 409, { error: "Request already sent." });
  if (st === "pending_in") { // they already asked you — accept it
    db.prepare("UPDATE friendships SET status='accepted' WHERE requester_id=? AND addressee_id=?").run(other.id, user.id);
    return send(res, 200, { ok: true, state: "friends" });
  }
  db.prepare("INSERT INTO friendships (requester_id, addressee_id, status, created_at) VALUES (?,?,?,?)").run(user.id, other.id, "pending", now());
  send(res, 200, { ok: true, state: "pending_out" });
});

route("POST /api/friends/respond", async ({ res, user, body }) => {
  if (!user) return send(res, 401, { error: "Not signed in." });
  const otherId = Number(body.userId);
  const accept = !!body.accept;
  const row = db.prepare("SELECT * FROM friendships WHERE requester_id=? AND addressee_id=? AND status='pending'").get(otherId, user.id);
  if (!row) return send(res, 404, { error: "No pending request from them." });
  if (accept) db.prepare("UPDATE friendships SET status='accepted' WHERE id=?").run(row.id);
  else db.prepare("DELETE FROM friendships WHERE id=?").run(row.id);
  send(res, 200, { ok: true, state: accept ? "friends" : "none" });
});

route("POST /api/friends/remove", async ({ res, user, body }) => {
  if (!user) return send(res, 401, { error: "Not signed in." });
  const otherId = Number(body.userId);
  db.prepare("DELETE FROM friendships WHERE (requester_id=? AND addressee_id=?) OR (requester_id=? AND addressee_id=?)").run(user.id, otherId, otherId, user.id);
  send(res, 200, { ok: true, state: "none" });
});

// --- stats (client reports a finished game) ---
route("POST /api/stats/report", async ({ res, user, body }) => {
  if (!user) return send(res, 401, { error: "Not signed in." });
  let stats = {}; try { stats = JSON.parse(user.stats || "{}"); } catch { stats = {}; }
  stats.games = (stats.games || 0) + 1;
  if (body.result === "win") stats.wins = (stats.wins || 0) + 1;
  else if (body.result === "loss") stats.losses = (stats.losses || 0) + 1;
  if (body.civ) { stats.byCiv = stats.byCiv || {}; stats.byCiv[body.civ] = (stats.byCiv[body.civ] || 0) + 1; }
  db.prepare("UPDATE users SET stats = ? WHERE id = ?").run(JSON.stringify(stats), user.id);
  send(res, 200, { stats });
});

// --- admin ---
function requireAdmin(user, res) {
  if (!user) { send(res, 401, { error: "Not signed in." }); return false; }
  if (!user.is_admin) { send(res, 403, { error: "Admins only." }); return false; }
  return true;
}
route("GET /api/admin/users", async ({ res, user }) => {
  if (!requireAdmin(user, res)) return;
  const rows = db.prepare("SELECT * FROM users ORDER BY last_seen DESC").all();
  const online = now() - 5 * 60 * 1000; // "online" = seen in the last 5 min
  send(res, 200, { users: rows.map((r) => ({ ...publicUser(r), online: r.last_seen >= online, sessions: db.prepare("SELECT COUNT(*) c FROM sessions WHERE user_id=? AND expires_at>?").get(r.id, now()).c })) });
});
route("POST /api/admin/kick", async ({ res, user, body }) => {
  if (!requireAdmin(user, res)) return;
  const id = Number(body.userId);
  const n = db.prepare("DELETE FROM sessions WHERE user_id = ?").run(id).changes;
  send(res, 200, { ok: true, endedSessions: n });
});
route("POST /api/admin/ban", async ({ res, user, body }) => {
  if (!requireAdmin(user, res)) return;
  const id = Number(body.userId);
  const target = userById(id);
  if (!target) return send(res, 404, { error: "No such user." });
  if (target.is_admin) return send(res, 400, { error: "You can't ban an admin." });
  const banned = body.banned ? 1 : 0;
  db.prepare("UPDATE users SET banned = ? WHERE id = ?").run(banned, id);
  if (banned) db.prepare("DELETE FROM sessions WHERE user_id = ?").run(id); // kick on ban
  send(res, 200, { ok: true, banned: !!banned });
});

// ---------------------------------------------------------------- server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://x");
  const pathName = url.pathname;
  if (!pathName.startsWith("/api/")) return serveStatic(req, res);

  const key = `${req.method} ${pathName}`;
  const handler = routes[key];
  if (!handler) return send(res, 404, { error: "Unknown endpoint." });
  try {
    const token = bearer(req);
    const user = userFromToken(token);
    const body = req.method === "POST" ? await readBody(req) : {};
    const query = Object.fromEntries(url.searchParams.entries());
    await handler({ req, res, token, user, body, query });
  } catch (e) {
    console.error("API error", key, e);
    if (!res.headersSent) send(res, 500, { error: "Server error." });
  }
});

server.listen(PORT, () => {
  console.log(`HEGEMON server on http://localhost:${PORT}  (client + /api, db: ${path.basename(DB_PATH)})`);
});
