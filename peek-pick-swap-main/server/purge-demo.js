// Remove the seeded demo accounts (@peekpick.demo) and everything attached to them.
// Run before inviting real users: `npm run purge-demo`
// Real users matching a fake account that never replies is worse than an empty deck.
import db from "./db.js";

const demo = db.prepare("SELECT id, email FROM users WHERE email LIKE '%@peekpick.demo'").all();
if (!demo.length) {
  console.log("[purge-demo] no demo accounts found, nothing to do");
  process.exit(0);
}

const ids = demo.map((u) => u.id);
const list = ids.map(() => "?").join(",");

const purge = db.transaction(() => {
  const tradeIds = db
    .prepare(`SELECT id FROM trades WHERE user1_id IN (${list}) OR user2_id IN (${list})`)
    .all(...ids, ...ids)
    .map((t) => t.id);

  if (tradeIds.length) {
    const tl = tradeIds.map(() => "?").join(",");
    const convIds = db
      .prepare(`SELECT id FROM conversations WHERE trade_id IN (${tl})`)
      .all(...tradeIds)
      .map((c) => c.id);
    if (convIds.length) {
      const cl = convIds.map(() => "?").join(",");
      db.prepare(`DELETE FROM messages WHERE conversation_id IN (${cl})`).run(...convIds);
      db.prepare(`DELETE FROM offers WHERE conversation_id IN (${cl})`).run(...convIds);
      db.prepare(`DELETE FROM conversations WHERE id IN (${cl})`).run(...convIds);
    }
    db.prepare(`DELETE FROM ratings WHERE trade_id IN (${tl})`).run(...tradeIds);
    db.prepare(`DELETE FROM trades WHERE id IN (${tl})`).run(...tradeIds);
  }

  const itemIds = db
    .prepare(`SELECT id FROM items WHERE user_id IN (${list})`)
    .all(...ids)
    .map((i) => i.id);
  if (itemIds.length) {
    const il = itemIds.map(() => "?").join(",");
    db.prepare(`DELETE FROM swipes WHERE item_id IN (${il})`).run(...itemIds);
    db.prepare(`DELETE FROM items WHERE id IN (${il})`).run(...itemIds);
  }

  for (const table of ["swipes", "preferences", "passports", "push_subscriptions"]) {
    db.prepare(`DELETE FROM ${table} WHERE user_id IN (${list})`).run(...ids);
  }
  db.prepare(`DELETE FROM ratings WHERE rater_id IN (${list}) OR ratee_id IN (${list})`).run(...ids, ...ids);
  db.prepare(`DELETE FROM blocks WHERE blocker_id IN (${list}) OR blocked_id IN (${list})`).run(...ids, ...ids);
  db.prepare(`DELETE FROM reports WHERE reporter_id IN (${list})`).run(...ids);
  db.prepare(`DELETE FROM reports WHERE target_type = 'user' AND target_id IN (${list})`).run(...ids);
  db.prepare(`DELETE FROM users WHERE id IN (${list})`).run(...ids);
});

purge();
console.log(`[purge-demo] removed ${demo.length} demo accounts and their data:`);
for (const u of demo) console.log(`  - ${u.email}`);
console.log("[purge-demo] set SEED_DEMO_DATA=0 (or remove it) so they don't come back on the next deploy");
