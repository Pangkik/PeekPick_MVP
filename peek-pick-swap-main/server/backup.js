// Snapshot the SQLite db with VACUUM INTO (atomic, safe alongside WAL-mode writers)
// into server/backups/, then prune to the 7 most recent files.
// Run manually: `npm run backup` / `node server/backup.js`.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.PEEKPICK_DB_PATH || path.join(__dirname, "peekpick.db");
const backupDir = path.join(__dirname, "backups");
fs.mkdirSync(backupDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const dest = path.join(backupDir, `peekpick-${stamp}.db`);

const db = new Database(dbPath, { readonly: true });
db.exec(`VACUUM INTO '${dest.replace(/'/g, "''")}'`);
db.close();
console.log(`[backup] wrote ${dest}`);

const KEEP = 7;
const files = fs
  .readdirSync(backupDir)
  .filter((f) => f.startsWith("peekpick-") && f.endsWith(".db"))
  .sort(); // ISO timestamps in the filename sort chronologically as strings
for (const old of files.slice(0, -KEEP)) {
  fs.unlinkSync(path.join(backupDir, old));
  console.log(`[backup] pruned ${old}`);
}

// ponytail: scheduling on Railway is an ops task, not code — not configured here.
// Options: a Railway Cron Job (or a second minimal service on a cron trigger) that
// runs `node server/backup.js` daily against the same volume the API's SQLite file
// lives on, so backups/ persists between runs. A plain `setInterval` inside index.js
// was skipped: it would die whenever the API process restarts/redeploys, which is
// exactly when you'd want a backup to have already happened.
