// PeekPick backend. One file: middleware, routes, matching, passport logic.
// ponytail: everything lives here instead of controllers/models/services — fine at this size, split when it hurts.
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import webpush from "web-push";
import db from "./db.js";
import { maybeBackup } from "./backup.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const JWT_SECRET = process.env.JWT_SECRET || "peekpick-dev-secret-change-me"; // ponytail: set JWT_SECRET in prod
const PORT = process.env.PORT || 3001;

const UPLOAD_DIR = process.env.PEEKPICK_UPLOADS_DIR || path.join(__dirname, "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ponytail: beta-only bypass, one flag read at boot. Off by default, identical to today's behavior.
const SKIP_EMAIL_VERIFICATION = /^(1|true)$/i.test(process.env.SKIP_EMAIL_VERIFICATION || "");

// ponytail: env override lets test.js use a tiny limit instead of swiping 50 times to hit it
const DAILY_SWIPE_LIMIT = Number(process.env.DAILY_SWIPE_LIMIT) || 50;

// Deliberately CONSERVATIVE per-item estimates for reuse instead of buying new.
// These are order-of-magnitude figures, not measurements — always present them to
// users as "estimated". Anchored against published reuse LCA work:
//   - WRAP: ~11 t CO2e saved per tonne of textiles reused → ~5kg for a ~0.5kg garment;
//     UPC/INTEXTER (2022) puts it far higher (~25kg per kg), so 10kg/garment sits low
//     in the published range rather than flattering us.
//   - WRAP: ~1.05 t CO2e per tonne of sofas (~40kg per sofa) — our 8kg "home" figure is
//     well under that, since most home items are far smaller than a sofa.
//   - Consumer electronics manufacturing runs ~55-70kg CO2e for a phone and 200kg+ for
//     a laptop, so 25kg for "electronics" is conservative for the category.
// ponytail: flat per-category constants, not per-item weight/model lookups. If the
// Passport ever needs to withstand external scrutiny (scholarships, CSR reporting),
// replace with a sourced per-category factor table and cite it in-app.
const CATEGORY_IMPACT = {
  electronics: { co2Kg: 25, wasteKg: 2 },
  clothing: { co2Kg: 10, wasteKg: 0.5 },
  books: { co2Kg: 2, wasteKg: 0.8 },
  home: { co2Kg: 8, wasteKg: 3 },
  games: { co2Kg: 5, wasteKg: 1 },
  plants: { co2Kg: 1, wasteKg: 0.5 },
  art: { co2Kg: 3, wasteKg: 0.5 },
  tools: { co2Kg: 12, wasteKg: 4 },
  food: { co2Kg: 1, wasteKg: 0.3 },
  sports: { co2Kg: 8, wasteKg: 2 },
  baby: { co2Kg: 6, wasteKg: 1.5 },
  beauty: { co2Kg: 2, wasteKg: 0.3 },
  default: { co2Kg: 5, wasteKg: 1 },
};
const BADGE_THRESHOLDS = [
  [1, "first-swap"],
  [3, "eco-starter"],
  [10, "eco-warrior"],
  [25, "super-trader"],
];

function getSetting(key) {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row ? row.value : null;
}
function setSetting(key, value) {
  db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(key, value);
}

// ponytail: self-generated VAPID keys stored in db, set env vars to rotate
let VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
let VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  VAPID_PUBLIC_KEY = getSetting("vapid_public_key");
  VAPID_PRIVATE_KEY = getSetting("vapid_private_key");
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    const generated = webpush.generateVAPIDKeys();
    VAPID_PUBLIC_KEY = generated.publicKey;
    VAPID_PRIVATE_KEY = generated.privateKey;
    setSetting("vapid_public_key", VAPID_PUBLIC_KEY);
    setSetting("vapid_private_key", VAPID_PRIVATE_KEY);
  }
}
webpush.setVapidDetails("mailto:support@peekpick.app", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// fire-and-forget push notification; never blocks or fails the calling request
function sendPush(userId, { title, body, url }) {
  const subs = db.prepare("SELECT * FROM push_subscriptions WHERE user_id = ?").all(userId);
  for (const sub of subs) {
    const subscription = { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } };
    try {
      webpush
        .sendNotification(subscription, JSON.stringify({ title, body, url }))
        .catch((err) => {
          if (err && (err.statusCode === 404 || err.statusCode === 410)) {
            db.prepare("DELETE FROM push_subscriptions WHERE id = ?").run(sub.id);
          }
        });
    } catch {
      // never let a push failure affect the caller
    }
  }
}

const app = express();
app.set("trust proxy", 1);
// ponytail: allow-all CORS so a separately hosted frontend (Vercel) can call this API
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.json());
app.use("/uploads", express.static(UPLOAD_DIR));

// moderate rate limit on all writes; auth routes get their own stricter limiter instead (see below)
app.use((req, res, next) => {
  if (req.method === "GET" || req.path.startsWith("/api/auth/")) return next();
  return writeLimiter(req, res, next);
});

// absolute photo URLs so images work when the frontend lives on another domain
let publicBase = "";
app.use((req, res, next) => {
  if (!publicBase) publicBase = `${req.protocol}://${req.get("host")}`;
  next();
});
const absUrl = (u) => (u && u.startsWith("/") ? publicBase + u : u);

// ---------- helpers ----------

// ponytail: per-call aggregate, add a cached column if profile load gets slow
function userRating(userId) {
  const row = db.prepare("SELECT AVG(stars) AS avg, COUNT(*) AS count FROM ratings WHERE ratee_id = ?").get(userId);
  return { average: row.count ? Math.round(row.avg * 10) / 10 : 0, count: row.count };
}

function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    bio: row.bio || "",
    location: row.location || "",
    avatarUrl: absUrl(row.avatar_url || ""),
    verified: !!row.verified,
    rating: userRating(row.id),
  };
}

function publicItem(row) {
  const owner = db.prepare("SELECT * FROM users WHERE id = ?").get(row.user_id);
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    condition: row.condition,
    description: row.description || "",
    photoUrls: JSON.parse(row.photo_urls || "[]").map(absUrl),
    wants: JSON.parse(row.wants || "[]"),
    available: !!row.available,
    createdAt: row.created_at,
    owner: owner
      ? {
          id: owner.id,
          name: owner.name,
          avatarUrl: absUrl(owner.avatar_url || ""),
          location: owner.location || "",
          rating: userRating(owner.id),
        }
      : null,
  };
}

function publicOffer(row) {
  const offerItem = row.offer_item_id ? db.prepare("SELECT * FROM items WHERE id = ?").get(row.offer_item_id) : null;
  return {
    id: row.id,
    conversationId: row.conversation_id,
    fromUserId: row.from_user_id,
    offerItem: offerItem ? publicItem(offerItem) : null,
    cashAmount: row.cash_amount,
    note: row.note || "",
    status: row.status,
    createdAt: row.created_at,
  };
}

function publicPassport(row) {
  if (!row) return { itemsReused: 0, co2SavedKg: 0, wasteDivertedKg: 0, badges: [] };
  return {
    itemsReused: row.items_reused,
    co2SavedKg: row.co2_saved_kg,
    wasteDivertedKg: row.waste_diverted_kg,
    badges: JSON.parse(row.badges || "[]"),
  };
}

function badgesForCount(count) {
  return BADGE_THRESHOLDS.filter(([n]) => count >= n).map(([, name]) => name);
}

// ponytail: UTC day boundary, switch to per-user timezone if users complain
function todaySwipeCount(userId) {
  return db
    .prepare(
      `SELECT COUNT(*) AS c FROM swipes
       WHERE user_id = ? AND direction IN ('right','super') AND date(created_at) = date('now')`
    )
    .get(userId).c;
}
function swipesRemainingFor(userId) {
  return Math.max(0, DAILY_SWIPE_LIMIT - todaySwipeCount(userId));
}

function makeCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ponytail: native fetch + Resend's raw HTTP API, no SDK dependency for one POST.
// Falls back to console.log (local dev, or if Resend is unset/unreachable) so a
// broken email provider never blocks signup/login.
async function sendVerificationCode(email, code) {
  // ponytail: accept either casing — env vars are case-sensitive on Linux and a
  // lowercase key in the host dashboard silently disables all outbound email.
  const apiKey = process.env.RESEND_API_KEY || process.env.resend_api_key;
  if (!apiKey) {
    console.log(`[PeekPick] Verification code for ${email}: ${code}`);
    return;
  }
  const url = process.env.RESEND_API_URL || "https://api.resend.com/emails";
  const from = process.env.EMAIL_FROM || "PeekPick <onboarding@resend.dev>";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: email,
        subject: "Your PeekPick verification code",
        html: `<p>Your PeekPick verification code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:4px">${code}</p><p>Enter it in the app to finish signing up.</p>`,
      }),
    });
    if (!res.ok) throw new Error(`Resend responded with ${res.status}`);
  } catch (err) {
    console.error(`[PeekPick] Failed to send verification email to ${email}:`, err.message || err);
    console.log(`[PeekPick] Verification code for ${email}: ${code}`);
  }
}

function signToken(user) {
  return jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "30d" });
}

// ponytail: hand-rolled fixed-window limiter, one Map per limiter instance keyed by IP.
// No dependency needed for this size. Stale IP keys are never swept; fine until this
// map holds millions of distinct IPs, then add a periodic prune or swap in a real store.
function rateLimiter({ windowMs, max }) {
  const hits = new Map();
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      return res.status(429).json({ error: "Too many requests, please try again later" });
    }
    recent.push(now);
    hits.set(key, recent);
    next();
  };
}

const authLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }); // 10 signup/login/verify per 15min per IP
const writeLimiter = rateLimiter({ windowMs: 60 * 1000, max: 60 }); // 60 writes per minute per IP

// blocking: returns ids of users who have blocked userId or whom userId has blocked (symmetric)
function blockedUserIds(userId) {
  return db
    .prepare(
      `SELECT blocked_id AS id FROM blocks WHERE blocker_id = ?
       UNION
       SELECT blocker_id AS id FROM blocks WHERE blocked_id = ?`
    )
    .all(userId, userId)
    .map((r) => r.id);
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing Authorization header" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(decoded.id);
    if (!user) return res.status(401).json({ error: "Invalid token" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ---------- auth ----------

app.post("/api/auth/signup", authLimiter, async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Valid email is required" });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return res.status(409).json({ error: "Email is already registered" });

  const passwordHash = bcrypt.hashSync(password, 10);

  if (SKIP_EMAIL_VERIFICATION) {
    // beta flag: no code generated, no email sent, account verified on creation
    const info = db
      .prepare("INSERT INTO users (email, password_hash, name, verified) VALUES (?, ?, ?, 1)")
      .run(email, passwordHash, name || "");
    db.prepare("INSERT OR IGNORE INTO passports (user_id) VALUES (?)").run(info.lastInsertRowid);
    return res.status(201).json({ needsVerification: false });
  }

  const code = makeCode();
  db.prepare(
    "INSERT INTO users (email, password_hash, name, verify_code) VALUES (?, ?, ?, ?)"
  ).run(email, passwordHash, name || "", code);

  await sendVerificationCode(email, code);
  res.status(201).json({ needsVerification: true });
});

app.post("/api/auth/verify", authLimiter, (req, res) => {
  const { email, code } = req.body || {};
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || user.verify_code !== String(code)) {
    return res.status(400).json({ error: "Invalid verification code" });
  }
  db.prepare("UPDATE users SET verified = 1, verify_code = NULL WHERE id = ?").run(user.id);
  db.prepare("INSERT OR IGNORE INTO passports (user_id) VALUES (?)").run(user.id);
  const fresh = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
  res.json({ token: signToken(fresh), user: publicUser(fresh) });
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !bcrypt.compareSync(password || "", user.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  if (!user.verified) {
    if (SKIP_EMAIL_VERIFICATION) {
      // beta flag: auto-verify on first login instead of bouncing to the code screen
      db.prepare("UPDATE users SET verified = 1, verify_code = NULL WHERE id = ?").run(user.id);
      db.prepare("INSERT OR IGNORE INTO passports (user_id) VALUES (?)").run(user.id);
      user.verified = 1;
    } else {
      const code = makeCode();
      db.prepare("UPDATE users SET verify_code = ? WHERE id = ?").run(code, user.id);
      await sendVerificationCode(email, code);
      return res.status(403).json({ error: "Account not verified", needsVerification: true });
    }
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

// ---------- me ----------

app.get("/api/me", requireAuth, (req, res) => {
  const prefs = db.prepare("SELECT * FROM preferences WHERE user_id = ?").get(req.user.id);
  const passport = db.prepare("SELECT * FROM passports WHERE user_id = ?").get(req.user.id);
  res.json({
    user: publicUser(req.user),
    preferences: prefs
      ? {
          haveCategories: JSON.parse(prefs.have_categories || "[]"),
          wantCategories: JSON.parse(prefs.want_categories || "[]"),
          condition: prefs.condition || "",
          radius: prefs.radius,
          tradeStyle: prefs.trade_style,
        }
      : null,
    passport: publicPassport(passport),
    swipesRemaining: swipesRemainingFor(req.user.id),
  });
});

app.put("/api/me", requireAuth, (req, res) => {
  const { name, bio, location } = req.body || {};
  const current = req.user;
  db.prepare("UPDATE users SET name = ?, bio = ?, location = ? WHERE id = ?").run(
    name !== undefined ? name : current.name,
    bio !== undefined ? bio : current.bio,
    location !== undefined ? location : current.location,
    current.id
  );
  const fresh = db.prepare("SELECT * FROM users WHERE id = ?").get(current.id);
  res.json({ user: publicUser(fresh) });
});

app.post("/api/me/preferences", requireAuth, (req, res) => {
  const { haveCategories, wantCategories, condition, radius, tradeStyle } = req.body || {};
  db.prepare(
    `INSERT INTO preferences (user_id, have_categories, want_categories, condition, radius, trade_style)
     VALUES (@userId, @have, @want, @condition, @radius, @tradeStyle)
     ON CONFLICT(user_id) DO UPDATE SET
       have_categories = excluded.have_categories,
       want_categories = excluded.want_categories,
       condition = excluded.condition,
       radius = excluded.radius,
       trade_style = excluded.trade_style`
  ).run({
    userId: req.user.id,
    have: JSON.stringify(haveCategories || []),
    want: JSON.stringify(wantCategories || []),
    condition: condition || "",
    radius: radius || "city",
    tradeStyle: tradeStyle || "one-for-one",
  });
  res.json({ ok: true });
});

// ---------- items ----------

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, crypto.randomUUID() + path.extname(file.originalname || "")),
  }),
  limits: { files: 4 },
});

app.post("/api/items", requireAuth, upload.array("photos", 4), (req, res) => {
  const { title, category, condition, description } = req.body || {};
  if (!title || !category) return res.status(400).json({ error: "title and category are required" });

  let wants = [];
  try {
    wants = JSON.parse(req.body.wants || "[]");
  } catch {
    wants = [];
  }
  const photoUrls = (req.files || []).map((f) => `/uploads/${f.filename}`);

  const info = db
    .prepare(
      `INSERT INTO items (user_id, title, category, condition, description, photo_urls, wants)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(req.user.id, title, category, condition || "", description || "", JSON.stringify(photoUrls), JSON.stringify(wants));

  const row = db.prepare("SELECT * FROM items WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json({ item: publicItem(row) });
});

app.get("/api/items/mine", requireAuth, (req, res) => {
  const rows = db.prepare("SELECT * FROM items WHERE user_id = ? ORDER BY id DESC").all(req.user.id);
  res.json({ items: rows.map(publicItem) });
});

app.delete("/api/items/:id", requireAuth, (req, res) => {
  const item = db.prepare("SELECT * FROM items WHERE id = ?").get(req.params.id);
  if (!item || item.user_id !== req.user.id) return res.status(404).json({ error: "Item not found" });
  db.prepare("DELETE FROM items WHERE id = ?").run(item.id);
  res.json({ ok: true });
});

// ---------- discovery & swipes ----------

app.get("/api/discovery", requireAuth, (req, res) => {
  const prefs = db.prepare("SELECT * FROM preferences WHERE user_id = ?").get(req.user.id);
  const blocked = blockedUserIds(req.user.id);
  const rows = db
    .prepare(
      `SELECT * FROM items
       WHERE available = 1 AND user_id != ?
       AND id NOT IN (SELECT item_id FROM swipes WHERE user_id = ?)
       ORDER BY id DESC`
    )
    .all(req.user.id, req.user.id)
    .filter((row) => !blocked.includes(row.user_id));

  let scored = rows.map((row) => ({ row, score: 0 }));
  if (prefs) {
    const wantCategories = JSON.parse(prefs.want_categories || "[]");
    const haveCategories = JSON.parse(prefs.have_categories || "[]");
    scored = scored.map(({ row }) => {
      let score = 0;
      if (wantCategories.includes(row.category)) score += 2;
      const itemWants = JSON.parse(row.wants || "[]");
      score += itemWants.filter((w) => haveCategories.includes(w)).length;
      return { row, score };
    });
    scored.sort((a, b) => b.score - a.score || b.row.id - a.row.id);
  }

  const items = scored.slice(0, 20).map(({ row }) => publicItem(row));
  res.json({ items });
});

function findMutualMatch(requesterId, ownerId, myAvailableItemIds) {
  if (myAvailableItemIds.length === 0) return null;
  const placeholders = myAvailableItemIds.map(() => "?").join(",");
  return db
    .prepare(
      `SELECT * FROM swipes WHERE user_id = ? AND item_id IN (${placeholders})
       AND direction IN ('right','super') LIMIT 1`
    )
    .get(ownerId, ...myAvailableItemIds);
}

app.post("/api/swipes", requireAuth, (req, res) => {
  const { itemId, direction } = req.body || {};
  if (!["left", "right", "super"].includes(direction)) {
    return res.status(400).json({ error: "direction must be left, right, or super" });
  }
  const item = db.prepare("SELECT * FROM items WHERE id = ?").get(itemId);
  if (!item) return res.status(404).json({ error: "Item not found" });
  if (item.user_id === req.user.id) return res.status(400).json({ error: "Cannot swipe your own item" });
  if (blockedUserIds(req.user.id).includes(item.user_id)) {
    return res.status(403).json({ error: "Cannot interact with this user" });
  }

  const isNewSwipe = !db.prepare("SELECT id FROM swipes WHERE user_id = ? AND item_id = ?").get(req.user.id, itemId);
  if (isNewSwipe && direction !== "left" && todaySwipeCount(req.user.id) >= DAILY_SWIPE_LIMIT) {
    return res.status(429).json({
      error: "You're out of swipes for today. Come back tomorrow!",
      swipesRemaining: 0,
      limitReached: true,
    });
  }

  db.prepare(
    `INSERT INTO swipes (user_id, item_id, direction) VALUES (?, ?, ?)
     ON CONFLICT(user_id, item_id) DO UPDATE SET direction = excluded.direction`
  ).run(req.user.id, itemId, direction);

  const swipesRemaining = swipesRemainingFor(req.user.id);

  if (direction === "left") return res.json({ matched: false, swipesRemaining });

  const myAvailableItemIds = db
    .prepare("SELECT id FROM items WHERE user_id = ? AND available = 1")
    .all(req.user.id)
    .map((r) => r.id);

  const priorSwipe = findMutualMatch(req.user.id, item.user_id, myAvailableItemIds);
  if (!priorSwipe) return res.json({ matched: false, swipesRemaining });

  const item1Id = priorSwipe.item_id; // owned by me (requester)
  const item2Id = item.id; // owned by them (owner)

  // avoid duplicate trades if both sides keep swiping right after a match
  let trade = db
    .prepare(
      `SELECT * FROM trades WHERE (item1_id = ? AND item2_id = ?) OR (item1_id = ? AND item2_id = ?)`
    )
    .get(item1Id, item2Id, item2Id, item1Id);

  let isNewTrade = false;
  if (!trade) {
    isNewTrade = true;
    const info = db
      .prepare(
        `INSERT INTO trades (user1_id, user2_id, item1_id, item2_id) VALUES (?, ?, ?, ?)`
      )
      .run(req.user.id, item.user_id, item1Id, item2Id);
    trade = db.prepare("SELECT * FROM trades WHERE id = ?").get(info.lastInsertRowid);
    db.prepare("INSERT INTO conversations (trade_id) VALUES (?)").run(trade.id);
  }
  const conversation = db.prepare("SELECT * FROM conversations WHERE trade_id = ?").get(trade.id);

  const myItemRow = db.prepare("SELECT * FROM items WHERE id = ?").get(
    trade.user1_id === req.user.id ? trade.item1_id : trade.item2_id
  );
  const theirItemRow = db.prepare("SELECT * FROM items WHERE id = ?").get(
    trade.user1_id === req.user.id ? trade.item2_id : trade.item1_id
  );
  const otherUserRow = db.prepare("SELECT * FROM users WHERE id = ?").get(item.user_id);

  if (isNewTrade) {
    sendPush(req.user.id, {
      title: "It's a match! 🎉",
      body: `You and ${otherUserRow.name} both want to swap`,
      url: `/chat/${conversation.id}`,
    });
    sendPush(item.user_id, {
      title: "It's a match! 🎉",
      body: `You and ${req.user.name} both want to swap`,
      url: `/chat/${conversation.id}`,
    });
  }

  res.json({
    matched: true,
    trade: { id: trade.id, status: trade.status, createdAt: trade.created_at },
    conversationId: conversation.id,
    myItem: publicItem(myItemRow),
    theirItem: publicItem(theirItemRow),
    otherUser: publicUser(otherUserRow),
    swipesRemaining,
  });
});

// ---------- matches & chat ----------

app.get("/api/matches", requireAuth, (req, res) => {
  const blocked = blockedUserIds(req.user.id);
  const trades = db
    .prepare("SELECT * FROM trades WHERE user1_id = ? OR user2_id = ? ORDER BY id DESC")
    .all(req.user.id, req.user.id)
    // soft-hide: a block on either side hides the shared match/conversation without deleting it
    .filter((trade) => !blocked.includes(trade.user1_id === req.user.id ? trade.user2_id : trade.user1_id));

  const matches = trades.map((trade) => {
    const iAmUser1 = trade.user1_id === req.user.id;
    const myItemRow = db.prepare("SELECT * FROM items WHERE id = ?").get(iAmUser1 ? trade.item1_id : trade.item2_id);
    const theirItemRow = db.prepare("SELECT * FROM items WHERE id = ?").get(iAmUser1 ? trade.item2_id : trade.item1_id);
    const otherUserRow = db.prepare("SELECT * FROM users WHERE id = ?").get(iAmUser1 ? trade.user2_id : trade.user1_id);
    const conversation = db.prepare("SELECT * FROM conversations WHERE trade_id = ?").get(trade.id);
    const lastMessage = conversation
      ? db
          .prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 1")
          .get(conversation.id)
      : null;
    const myRatingRow = db.prepare("SELECT * FROM ratings WHERE trade_id = ? AND rater_id = ?").get(trade.id, req.user.id);

    return {
      trade: { id: trade.id, status: trade.status, createdAt: trade.created_at },
      myItem: myItemRow ? publicItem(myItemRow) : null,
      theirItem: theirItemRow ? publicItem(theirItemRow) : null,
      otherUser: otherUserRow
        ? {
            id: otherUserRow.id,
            name: otherUserRow.name,
            avatarUrl: otherUserRow.avatar_url || "",
            location: otherUserRow.location || "",
            rating: userRating(otherUserRow.id),
          }
        : null,
      conversationId: conversation ? conversation.id : null,
      lastMessage: lastMessage
        ? { content: lastMessage.content, senderId: lastMessage.sender_id, createdAt: lastMessage.created_at }
        : null,
      myRating: myRatingRow
        ? { id: myRatingRow.id, stars: myRatingRow.stars, comment: myRatingRow.comment, createdAt: myRatingRow.created_at }
        : null,
    };
  });

  res.json({ matches });
});

function conversationForParticipant(conversationId, userId) {
  const conversation = db.prepare("SELECT * FROM conversations WHERE id = ?").get(conversationId);
  if (!conversation) return null;
  const trade = db.prepare("SELECT * FROM trades WHERE id = ?").get(conversation.trade_id);
  if (!trade || (trade.user1_id !== userId && trade.user2_id !== userId)) return null;
  const otherId = trade.user1_id === userId ? trade.user2_id : trade.user1_id;
  if (blockedUserIds(userId).includes(otherId)) return null; // soft-hide, data stays intact
  return conversation;
}

app.get("/api/conversations/:id/messages", requireAuth, (req, res) => {
  const conversation = conversationForParticipant(req.params.id, req.user.id);
  if (!conversation) return res.status(404).json({ error: "Conversation not found" });

  const after = req.query.after ? Number(req.query.after) : 0;
  const rows = db
    .prepare("SELECT * FROM messages WHERE conversation_id = ? AND id > ? ORDER BY id ASC")
    .all(conversation.id, after);

  res.json({
    messages: rows.map((m) => ({ id: m.id, senderId: m.sender_id, content: m.content, createdAt: m.created_at })),
  });
});

app.post("/api/conversations/:id/messages", requireAuth, (req, res) => {
  const conversation = conversationForParticipant(req.params.id, req.user.id);
  if (!conversation) return res.status(404).json({ error: "Conversation not found" });
  const { content } = req.body || {};
  if (!content || !content.trim()) return res.status(400).json({ error: "content is required" });

  const info = db
    .prepare("INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)")
    .run(conversation.id, req.user.id, content);
  const row = db.prepare("SELECT * FROM messages WHERE id = ?").get(info.lastInsertRowid);

  const trade = db.prepare("SELECT * FROM trades WHERE id = ?").get(conversation.trade_id);
  const recipientId = trade.user1_id === req.user.id ? trade.user2_id : trade.user1_id;
  sendPush(recipientId, {
    title: req.user.name,
    body: content.length > 80 ? content.slice(0, 80) : content,
    url: `/chat/${conversation.id}`,
  });

  res.status(201).json({ message: { id: row.id, senderId: row.sender_id, content: row.content, createdAt: row.created_at } });
});

// ---------- counteroffers ----------

app.post("/api/conversations/:id/offers", requireAuth, (req, res) => {
  const conversation = conversationForParticipant(req.params.id, req.user.id);
  if (!conversation) return res.status(404).json({ error: "Conversation not found" });

  const { offerItemId, cashAmount, note } = req.body || {};

  let offerItem = null;
  if (offerItemId !== undefined && offerItemId !== null) {
    offerItem = db.prepare("SELECT * FROM items WHERE id = ?").get(offerItemId);
    if (!offerItem || offerItem.user_id !== req.user.id || !offerItem.available) {
      return res.status(400).json({ error: "offerItemId must be an available item you own" });
    }
  }

  const cash = cashAmount === undefined || cashAmount === null ? 0 : Number(cashAmount);
  if (typeof cash !== "number" || Number.isNaN(cash) || cash < 0 || cash > 1000000) {
    return res.status(400).json({ error: "cashAmount must be a number between 0 and 1000000" });
  }

  // only one live offer per side: auto-decline any other still-pending offer from this sender
  db.prepare(
    "UPDATE offers SET status = 'declined' WHERE conversation_id = ? AND from_user_id = ? AND status = 'pending'"
  ).run(conversation.id, req.user.id);

  const info = db
    .prepare(
      `INSERT INTO offers (conversation_id, from_user_id, offer_item_id, cash_amount, note)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(conversation.id, req.user.id, offerItem ? offerItem.id : null, cash, note || "");

  const row = db.prepare("SELECT * FROM offers WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json({ offer: publicOffer(row) });
});

app.get("/api/conversations/:id/offers", requireAuth, (req, res) => {
  const conversation = conversationForParticipant(req.params.id, req.user.id);
  if (!conversation) return res.status(404).json({ error: "Conversation not found" });
  const rows = db.prepare("SELECT * FROM offers WHERE conversation_id = ? ORDER BY id DESC").all(conversation.id);
  res.json({ offers: rows.map(publicOffer) });
});

app.post("/api/offers/:id/accept", requireAuth, (req, res) => {
  const offer = db.prepare("SELECT * FROM offers WHERE id = ?").get(req.params.id);
  if (!offer) return res.status(404).json({ error: "Offer not found" });
  const conversation = conversationForParticipant(offer.conversation_id, req.user.id);
  if (!conversation) return res.status(404).json({ error: "Offer not found" });
  if (offer.from_user_id === req.user.id) {
    return res.status(403).json({ error: "Only the recipient can accept an offer" });
  }

  const trade = db.prepare("SELECT * FROM trades WHERE id = ?").get(conversation.trade_id);

  if (offer.status !== "accepted") {
    db.prepare("UPDATE offers SET status = 'accepted' WHERE id = ?").run(offer.id);
    db.prepare(
      "UPDATE offers SET status = 'declined' WHERE conversation_id = ? AND id != ? AND status = 'pending'"
    ).run(conversation.id, offer.id);

    if (offer.offer_item_id) {
      if (trade.user1_id === offer.from_user_id) {
        db.prepare("UPDATE trades SET item1_id = ? WHERE id = ?").run(offer.offer_item_id, trade.id);
      } else {
        db.prepare("UPDATE trades SET item2_id = ? WHERE id = ?").run(offer.offer_item_id, trade.id);
      }
    }
    db.prepare("UPDATE trades SET status = 'confirmed' WHERE id = ?").run(trade.id);
  }

  const freshOffer = db.prepare("SELECT * FROM offers WHERE id = ?").get(offer.id);
  const freshTrade = db.prepare("SELECT * FROM trades WHERE id = ?").get(trade.id);
  res.json({
    offer: publicOffer(freshOffer),
    trade: { id: freshTrade.id, status: freshTrade.status, createdAt: freshTrade.created_at },
  });
});

app.post("/api/offers/:id/decline", requireAuth, (req, res) => {
  const offer = db.prepare("SELECT * FROM offers WHERE id = ?").get(req.params.id);
  if (!offer) return res.status(404).json({ error: "Offer not found" });
  const conversation = conversationForParticipant(offer.conversation_id, req.user.id);
  if (!conversation) return res.status(404).json({ error: "Offer not found" });
  if (offer.from_user_id === req.user.id) {
    return res.status(403).json({ error: "Only the recipient can decline an offer" });
  }

  if (offer.status === "pending") {
    db.prepare("UPDATE offers SET status = 'declined' WHERE id = ?").run(offer.id);
  }
  const fresh = db.prepare("SELECT * FROM offers WHERE id = ?").get(offer.id);
  res.json({ offer: publicOffer(fresh) });
});

// ---------- reports & blocks (trust & safety) ----------

// GET endpoint deferred (ponytail: not asked for). Read reports directly:
//   sqlite3 server/peekpick.db "SELECT * FROM reports ORDER BY id DESC;"
app.post("/api/reports", requireAuth, (req, res) => {
  const { targetType, targetId, reason } = req.body || {};
  if (!["user", "item"].includes(targetType)) {
    return res.status(400).json({ error: "targetType must be 'user' or 'item'" });
  }
  if (!Number.isInteger(Number(targetId))) return res.status(400).json({ error: "targetId is required" });
  if (!reason || !String(reason).trim()) return res.status(400).json({ error: "reason is required" });

  const info = db
    .prepare("INSERT INTO reports (reporter_id, target_type, target_id, reason) VALUES (?, ?, ?, ?)")
    .run(req.user.id, targetType, Number(targetId), String(reason).trim());
  res.status(201).json({ id: info.lastInsertRowid });
});

app.post("/api/blocks", requireAuth, (req, res) => {
  const userId = Number(req.body?.userId);
  if (!Number.isInteger(userId)) return res.status(400).json({ error: "userId is required" });
  if (userId === req.user.id) return res.status(400).json({ error: "Cannot block yourself" });
  const target = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
  if (!target) return res.status(404).json({ error: "User not found" });

  db.prepare("INSERT OR IGNORE INTO blocks (blocker_id, blocked_id) VALUES (?, ?)").run(req.user.id, userId);
  res.status(201).json({ ok: true });
});

app.delete("/api/blocks/:userId", requireAuth, (req, res) => {
  db.prepare("DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?").run(req.user.id, Number(req.params.userId));
  res.json({ ok: true });
});

// ---------- trade completion & passport ----------

function applyImpact(userId, categoryReceived) {
  const impact = CATEGORY_IMPACT[categoryReceived] || CATEGORY_IMPACT.default;
  db.prepare("INSERT OR IGNORE INTO passports (user_id) VALUES (?)").run(userId);
  const passport = db.prepare("SELECT * FROM passports WHERE user_id = ?").get(userId);
  const itemsReused = passport.items_reused + 1;
  const co2 = passport.co2_saved_kg + impact.co2Kg;
  const waste = passport.waste_diverted_kg + impact.wasteKg;
  const badges = badgesForCount(itemsReused);
  db.prepare(
    "UPDATE passports SET items_reused = ?, co2_saved_kg = ?, waste_diverted_kg = ?, badges = ? WHERE user_id = ?"
  ).run(itemsReused, co2, waste, JSON.stringify(badges), userId);
}

app.post("/api/trades/:id/complete", requireAuth, (req, res) => {
  const trade = db.prepare("SELECT * FROM trades WHERE id = ?").get(req.params.id);
  if (!trade || (trade.user1_id !== req.user.id && trade.user2_id !== req.user.id)) {
    return res.status(404).json({ error: "Trade not found" });
  }

  if (trade.status !== "completed") {
    const item1 = db.prepare("SELECT * FROM items WHERE id = ?").get(trade.item1_id);
    const item2 = db.prepare("SELECT * FROM items WHERE id = ?").get(trade.item2_id);
    db.prepare("UPDATE trades SET status = 'completed' WHERE id = ?").run(trade.id);
    // user1 gives item1, receives item2; user2 gives item2, receives item1
    applyImpact(trade.user1_id, item2.category);
    applyImpact(trade.user2_id, item1.category);
  }

  const fresh = db.prepare("SELECT * FROM trades WHERE id = ?").get(trade.id);
  const passport = db.prepare("SELECT * FROM passports WHERE user_id = ?").get(req.user.id);
  res.json({
    trade: { id: fresh.id, status: fresh.status, createdAt: fresh.created_at },
    passport: publicPassport(passport),
  });
});

// ---------- ratings ----------

app.post("/api/trades/:id/rate", requireAuth, (req, res) => {
  const trade = db.prepare("SELECT * FROM trades WHERE id = ?").get(req.params.id);
  if (!trade || (trade.user1_id !== req.user.id && trade.user2_id !== req.user.id)) {
    return res.status(404).json({ error: "Trade not found" });
  }
  if (trade.status !== "completed") {
    return res.status(400).json({ error: "You can only rate a completed trade" });
  }

  const { stars, comment } = req.body || {};
  const starsNum = Number(stars);
  if (!Number.isInteger(starsNum) || starsNum < 1 || starsNum > 5) {
    return res.status(400).json({ error: "stars must be an integer from 1 to 5" });
  }

  const existing = db.prepare("SELECT id FROM ratings WHERE trade_id = ? AND rater_id = ?").get(trade.id, req.user.id);
  if (existing) return res.status(409).json({ error: "You already rated this trade" });

  const rateeId = trade.user1_id === req.user.id ? trade.user2_id : trade.user1_id;
  const info = db
    .prepare("INSERT INTO ratings (trade_id, rater_id, ratee_id, stars, comment) VALUES (?, ?, ?, ?, ?)")
    .run(trade.id, req.user.id, rateeId, starsNum, comment || "");
  const row = db.prepare("SELECT * FROM ratings WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json({
    rating: {
      id: row.id,
      tradeId: row.trade_id,
      raterId: row.rater_id,
      rateeId: row.ratee_id,
      stars: row.stars,
      comment: row.comment,
      createdAt: row.created_at,
    },
  });
});

app.get("/api/users/:id/ratings", requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT r.*, u.name AS rater_name, u.avatar_url AS rater_avatar
       FROM ratings r JOIN users u ON u.id = r.rater_id
       WHERE r.ratee_id = ? ORDER BY r.id DESC`
    )
    .all(req.params.id);
  const ratings = rows.map((r) => ({
    id: r.id,
    stars: r.stars,
    comment: r.comment || "",
    createdAt: r.created_at,
    rater: { id: r.rater_id, name: r.rater_name, avatarUrl: absUrl(r.rater_avatar || "") },
  }));
  const agg = userRating(Number(req.params.id));
  res.json({ ratings, average: agg.average, count: agg.count });
});

// ---------- web push ----------

app.get("/api/push/key", (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

app.post("/api/push/subscribe", requireAuth, (req, res) => {
  const { endpoint, keys } = req.body || {};
  if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
    return res.status(400).json({ error: "endpoint and keys.p256dh/auth are required" });
  }
  db.prepare(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth`
  ).run(req.user.id, endpoint, keys.p256dh, keys.auth);
  res.json({ ok: true });
});

app.post("/api/push/unsubscribe", requireAuth, (req, res) => {
  const { endpoint } = req.body || {};
  db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").run(endpoint || "");
  res.json({ ok: true });
});

// ---------- production static hosting ----------

if (process.env.NODE_ENV === "production") {
  const distDir = path.join(__dirname, "..", "dist");
  app.use(express.static(distDir));
  app.get(/^(?!\/api|\/uploads).*/, (req, res) => res.sendFile(path.join(distDir, "index.html")));
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  app.listen(PORT, () => console.log(`[PeekPick] server listening on http://localhost:${PORT}`));
  maybeBackup();
  setInterval(maybeBackup, 6 * 60 * 60 * 1000).unref(); // re-checks staleness; backs up ~daily
}

export default app;
