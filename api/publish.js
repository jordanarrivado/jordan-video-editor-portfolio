/*
 * One-click publish for manager.html (Vercel serverless function).
 *
 *   GET  /api/publish  -> { configured: boolean }
 *   POST /api/publish  -> commits projects.js to GitHub; Vercel then redeploys.
 *
 * Required environment variables (Vercel → Project → Settings → Environment Variables):
 *   ADMIN_PASSWORD  the password you type in the manager
 *   GITHUB_TOKEN    fine-grained GitHub token, this repository only,
 *                   permission "Contents: Read and write"
 * Optional:
 *   GITHUB_REPO     owner/name   (default: jordanarrivado/jordan-video-editor-portfolio)
 *   GITHUB_BRANCH   branch name  (default: main)
 */
const crypto = require("crypto");

const REPO = process.env.GITHUB_REPO || "jordanarrivado/jordan-video-editor-portfolio";
const BRANCH = process.env.GITHUB_BRANCH || "main";
const FILE = "projects.js";
const MAX_PROJECTS = 300;
const MAX_CATEGORIES = 30;

const HEADER =
  "/* Portfolio data — edit with manager.html (recommended) or by hand.\n" +
  "   Videos live in assets/video/, posters in assets/images/web/. */\n";

/* ---------- helpers ---------- */
function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function passwordOk(given) {
  const real = process.env.ADMIN_PASSWORD || "";
  if (!real || typeof given !== "string") return false;
  const a = crypto.createHash("sha256").update(given).digest();
  const b = crypto.createHash("sha256").update(real).digest();
  return crypto.timingSafeEqual(a, b);
}

/* Small in-memory throttle against password guessing (per warm instance). */
const attempts = new Map();
function throttled(ip) {
  const now = Date.now();
  const rec = attempts.get(ip) || { n: 0, t: now };
  if (now - rec.t > 15 * 60 * 1000) {
    rec.n = 0;
    rec.t = now;
  }
  attempts.set(ip, rec);
  return rec;
}

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const fileName = (v) => {
  const s = str(v, 200);
  /* plain file names only: no folders, no "..", no URLs */
  return /^[^\\/:*?"<>|]+\.[A-Za-z0-9]{2,5}$/.test(s) && !s.includes("..") ? s : "";
};
const idOf = (v) => str(v, 60).toLowerCase().replace(/[^a-z0-9-]/g, "");

/* Rebuild the data from scratch so only known, safe fields are written. */
function sanitize(input) {
  if (!input || typeof input !== "object") throw new Error("Missing portfolio data");
  if (!Array.isArray(input.projects)) throw new Error("projects must be a list");
  if (input.projects.length > MAX_PROJECTS) throw new Error("Too many projects");

  const categories = (Array.isArray(input.categories) ? input.categories : [])
    .slice(0, MAX_CATEGORIES)
    .map((c) => ({ id: idOf(c && c.id), label: str(c && c.label, 60) }))
    .filter((c) => c.id && c.label);
  const catIds = new Set(categories.map((c) => c.id));

  const seen = new Set();
  const projects = input.projects.map((p, i) => {
    p = p || {};
    const out = {
      id: idOf(p.id),
      cat: idOf(p.cat),
      title: str(p.title, 120),
      type: str(p.type, 120),
      src: fileName(p.src),
    };
    const n = "Video #" + (i + 1);
    if (!out.id) throw new Error(n + ": missing ID");
    if (seen.has(out.id)) throw new Error(n + ': ID "' + out.id + '" is used twice');
    seen.add(out.id);
    if (!out.title) throw new Error(n + ": missing title");
    if (!out.src) throw new Error(n + ": invalid or missing video file name");
    if (!catIds.has(out.cat)) throw new Error(n + ': unknown category "' + out.cat + '"');
    if (!out.type) delete out.type;
    const poster = fileName(p.poster);
    if (poster) out.poster = poster;
    const lang = str(p.lang, 4).toUpperCase().replace(/[^A-Z]/g, "");
    if (lang) out.lang = lang;
    if (p.wide === true) out.wide = true;
    if (p.hidden === true) out.hidden = true;
    return out;
  });

  const intro = {};
  const i = input.intro || {};
  if (str(i.title, 120)) intro.title = str(i.title, 120);
  if (str(i.type, 120)) intro.type = str(i.type, 120);
  if (fileName(i.src)) intro.src = fileName(i.src);
  if (fileName(i.poster)) intro.poster = fileName(i.poster);

  return { version: 1, categories, intro, projects };
}

const serialize = (data) => HEADER + "window.PORTFOLIO = " + JSON.stringify(data, null, 2) + ";\n";

async function gh(path, init = {}) {
  const r = await fetch("https://api.github.com/repos/" + REPO + path, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: "Bearer " + process.env.GITHUB_TOKEN,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "portfolio-manager",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  const body = await r.json().catch(() => ({}));
  return { status: r.status, body };
}

/* ---------- handler ---------- */
module.exports = async function handler(req, res) {
  const configured = !!(process.env.ADMIN_PASSWORD && process.env.GITHUB_TOKEN);

  if (req.method === "GET") return send(res, 200, { configured });
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return send(res, 405, { error: "Method not allowed" });
  }
  if (!configured) {
    return send(res, 503, { error: "One-click publish isn't set up yet (ADMIN_PASSWORD / GITHUB_TOKEN missing in Vercel)." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return send(res, 400, { error: "Invalid JSON" });
    }
  }
  body = body || {};

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  const rec = throttled(ip);
  if (rec.n >= 10) return send(res, 429, { error: "Too many wrong passwords. Try again in 15 minutes." });
  if (!passwordOk(body.password)) {
    rec.n++;
    return send(res, 401, { error: "Wrong password" });
  }
  rec.n = 0;

  let data;
  try {
    data = sanitize(body.data);
  } catch (e) {
    return send(res, 422, { error: e.message });
  }
  const content = serialize(data);

  /* current file (for its sha, and to detect edits made elsewhere) */
  const cur = await gh("/contents/" + FILE + "?ref=" + encodeURIComponent(BRANCH));
  if (cur.status === 401 || cur.status === 403) {
    return send(res, 502, { error: "GitHub rejected the token. Check GITHUB_TOKEN has Contents: Read and write on this repo." });
  }
  if (cur.status !== 200 && cur.status !== 404) {
    return send(res, 502, { error: "Couldn't read projects.js from GitHub (" + cur.status + ")." });
  }
  const sha = cur.status === 200 ? cur.body.sha : undefined;
  const currentText = sha ? Buffer.from(cur.body.content || "", "base64").toString("utf8") : "";

  /* body.base = the data the manager started from; refuse if GitHub moved on since */
  if (body.base && sha && body.force !== true) {
    let same = false;
    try {
      const live = JSON.parse(currentText.slice(currentText.indexOf("{"), currentText.lastIndexOf("}") + 1));
      same = serialize(sanitize(live)) === serialize(sanitize(body.base));
    } catch (e) {
      same = false;
    }
    if (!same) {
      return send(res, 409, {
        error: "projects.js was changed on GitHub since you opened the manager. Publishing will overwrite that change.",
        conflict: true,
      });
    }
  }

  if (currentText === content) return send(res, 200, { ok: true, unchanged: true, content });

  const n = data.projects.filter((p) => !p.hidden).length;
  const put = await gh("/contents/" + FILE, {
    method: "PUT",
    body: JSON.stringify({
      message: "Update portfolio videos via Portfolio Manager (" + n + " live)",
      content: Buffer.from(content, "utf8").toString("base64"),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
  if (put.status === 409) {
    return send(res, 409, { error: "Someone else published at the same moment. Try again.", conflict: true });
  }
  if (put.status !== 200 && put.status !== 201) {
    const why = put.status === 403 || put.status === 404 ? " Check the token's repository access and Contents: Read and write permission." : "";
    return send(res, 502, { error: "GitHub didn't accept the commit (" + put.status + ")." + why });
  }

  return send(res, 200, {
    ok: true,
    content,
    commit: put.body.commit && put.body.commit.sha,
    url: put.body.commit && put.body.commit.html_url,
  });
};

module.exports.sanitize = sanitize;
module.exports.serialize = serialize;
