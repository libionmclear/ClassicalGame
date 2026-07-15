// HEGEMON — client networking (Phase 1: accounts · friends · admin).
// Talks to the self-contained backend (server/hegemon-server.mjs) over the same
// origin. When the server is NOT reachable (e.g. the client opened as a static
// file), window.HGNet.isOnline() stays false and game.js falls back to its
// offline localStorage accounts, so solo play always works.
(function () {
  "use strict";
  var TOKEN_KEY = "hegemon_net_token";
  var online = false;

  function token() { try { return window.localStorage.getItem(TOKEN_KEY) || ""; } catch (e) { return ""; } }
  function setToken(t) { try { if (t) window.localStorage.setItem(TOKEN_KEY, t); else window.localStorage.removeItem(TOKEN_KEY); } catch (e) {} }

  async function api(method, path, body) {
    var headers = { "Content-Type": "application/json" };
    var tk = token(); if (tk) headers["Authorization"] = "Bearer " + tk;
    var res = await fetch(path, { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined });
    var data = null; try { data = await res.json(); } catch (e) { data = {}; }
    if (!res.ok) { var err = new Error((data && data.error) || ("HTTP " + res.status)); err.status = res.status; throw err; }
    return data;
  }

  window.HGNet = {
    isOnline: function () { return online; },
    hasToken: function () { return !!token(); },
    clearToken: function () { setToken(""); },

    // Is the backend reachable at all? (200 or 401 both count as "server is up".)
    probe: async function () {
      try {
        var tk = token();
        var res = await fetch("/api/me", { headers: tk ? { Authorization: "Bearer " + tk } : {} });
        online = res.status < 500;
      } catch (e) { online = false; }
      return online;
    },

    register: async function (username, password, displayName, email) {
      var r = await api("POST", "/api/register", { username: username, password: password, displayName: displayName, email: email });
      setToken(r.token); online = true; return r.user;
    },
    login: async function (username, password) {
      var r = await api("POST", "/api/login", { username: username, password: password });
      setToken(r.token); online = true; return r.user;
    },
    logout: async function () { try { await api("POST", "/api/logout"); } catch (e) {} setToken(""); },
    me: async function () { var r = await api("GET", "/api/me"); return r.user; },

    search: async function (q) { return (await api("GET", "/api/users/search?q=" + encodeURIComponent(q))).users; },
    friends: async function () { return api("GET", "/api/friends"); },
    friendRequest: async function (username) { return api("POST", "/api/friends/request", { username: username }); },
    friendRequestId: async function (userId) { return api("POST", "/api/friends/request", { userId: userId }); },
    friendRespond: async function (userId, accept) { return api("POST", "/api/friends/respond", { userId: userId, accept: accept }); },
    friendRemove: async function (userId) { return api("POST", "/api/friends/remove", { userId: userId }); },
    reportStats: async function (result, civ) { try { return await api("POST", "/api/stats/report", { result: result, civ: civ }); } catch (e) { return null; } },

    adminUsers: async function () { return (await api("GET", "/api/admin/users")).users; },
    adminKick: async function (userId) { return api("POST", "/api/admin/kick", { userId: userId }); },
    adminBan: async function (userId, banned) { return api("POST", "/api/admin/ban", { userId: userId, banned: banned }); }
  };
})();
