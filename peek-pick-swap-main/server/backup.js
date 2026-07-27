// Snapshot the SQLite db with VACUUM INTO (atomic, safe alongside WAL-mode writers)
// and the uploads dir as a tar.gz, then prune each to the 7 most recent files.
// Run manually: `npm run backup`. Scheduled automatically from index.js on boot.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.PEEKPICK_DB_PATH || path.join(__dirname, "peekpick.db");
const uploadDir = process.env.PEEKPICK_UPLOADS_DIR || path.join(__dirname, "uploads");
// Default next to the db so on Railway (PEEKPICK_DB_PATH=/data/peekpick.db) backups
// land on the persistent volume instead of the ephemeral container filesystem.
const backupDir = process.env.PEEKPICK_BACKUP_DIR || path.join(path.dirname(dbPath), "backups");
const KEEP = 7;
const STALE_MS = 20 * 60 * 60 * 1000; // back up if the newest is older than this

function prune(prefix, suffix) {
  const files = fs
    .readdirSync(backupDir)
    .filter((f) => f.startsWith(prefix) && f.endsWith(suffix))
    .sort(); // ISO timestamps in the filename sort chronologically as strings
  for (const old of files.slice(0, -KEEP)) {
    fs.unlinkSync(path.join(backupDir, old));
    console.log(`[backup] pruned ${old}`);
  }
}

export function runBackup() {
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dest = path.join(backupDir, `peekpick-${stamp}.db`);

  const db = new Database(dbPath, { readonly: true });
  db.exec(`VACUUM INTO '${dest.replace(/'/g, "''")}'`);
  db.close();
  console.log(`[backup] wrote ${dest}`);
  prune("peekpick-", ".db");

  const hasUploads = fs.existsSync(uploadDir) && fs.readdirSync(uploadDir).length > 0;
  if (hasUploads) {
    const uploadsDest = path.join(backupDir, `uploads-${stamp}.tar.gz`);
    // ponytail: system tar via child_process, no archiver dependency for one directory
    execFileSync("tar", ["-czf", uploadsDest, "-C", path.dirname(uploadDir), path.basename(uploadDir)]);
    console.log(`[backup] wrote ${uploadsDest}`);
    prune("uploads-", ".tar.gz");
  } else {
    console.log("[backup] uploads dir empty or missing, skipped");
  }
}

// Only back up if the newest one is stale. Called on boot and on a timer, so a
// process restart (redeploy, crash) triggers a backup instead of losing the
// schedule, while frequent restarts don't churn out seven backups in an hour.
export function maybeBackup() {
  try {
    fs.mkdirSync(backupDir, { recursive: true });
    const newest = fs
      .readdirSync(backupDir)
      .filter((f) => f.startsWith("peekpick-") && f.endsWith(".db"))
      .sort()
      .pop();
    if (newest) {
      const age = Date.now() - fs.statSync(path.join(backupDir, newest)).mtimeMs;
      if (age < STALE_MS) return;
    }
    runBackup();
  } catch (err) {
    // never take the API down over a failed backup
    console.error("[backup] failed:", err.message);
  }
}

// ponytail: in-process schedule, not a Railway Cron Job. A cron service is tidier but
// needs setup the (non-technical) owner would have to do, and "no backups at all" is
// the realistic alternative. Boot-time + staleness check covers the restart case.
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) runBackup();
