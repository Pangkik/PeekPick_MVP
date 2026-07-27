// Print your users and their activity as CSV so you can actually use it —
// paste into Google Sheets, mail your beta list, or keep an off-site copy.
// Run in Railway → Console tab: `npm run export`
// Passwords are never exported (they're one-way hashes and useless to you anyway).
import db from "./db.js";

const csv = (rows) => {
  if (!rows.length) return "(none)";
  const cols = Object.keys(rows[0]);
  const esc = (v) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
};

const users = db
  .prepare(
    `SELECT u.id, u.email, u.name, u.location, u.created_at,
            (SELECT COUNT(*) FROM items i WHERE i.user_id = u.id) AS items_listed,
            (SELECT COUNT(*) FROM trades t WHERE (t.user1_id = u.id OR t.user2_id = u.id)
               AND t.status = 'completed') AS trades_completed,
            p.items_reused, p.co2_saved_kg
       FROM users u LEFT JOIN passports p ON p.user_id = u.id
      ORDER BY u.created_at`
  )
  .all();

const items = db
  .prepare(
    `SELECT i.id, i.title, i.category, i.condition, i.available, i.created_at, u.email AS owner_email
       FROM items i JOIN users u ON u.id = i.user_id ORDER BY i.created_at`
  )
  .all();

const counts = {
  users: users.length,
  items: items.length,
  matches: db.prepare("SELECT COUNT(*) c FROM trades").get().c,
  completed: db.prepare("SELECT COUNT(*) c FROM trades WHERE status = 'completed'").get().c,
  messages: db.prepare("SELECT COUNT(*) c FROM messages").get().c,
};

console.log("=== SUMMARY ===");
for (const [k, v] of Object.entries(counts)) console.log(`${k}: ${v}`);
console.log("\n=== USERS (csv) ===");
console.log(csv(users));
console.log("\n=== ITEMS (csv) ===");
console.log(csv(items));
console.log(
  "\nTip: copy a csv block, paste into Google Sheets, then Data > Split text to columns."
);
