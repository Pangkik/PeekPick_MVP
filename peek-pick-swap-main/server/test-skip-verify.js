// Child-process helper: proves the SKIP_EMAIL_VERIFICATION beta flag lets a new user
// sign up and log in with zero verification steps. Runs as its own process because
// index.js reads the flag once at module load, so it can't be toggled mid-run inside
// the main test.js process (which always runs with the flag off).
// Invoked by test.js via child_process; also runnable standalone:
//   SKIP_EMAIL_VERIFICATION=1 node server/test-skip-verify.js
import fs from "fs";
import path from "path";
import os from "os";

const dbPath = path.join(os.tmpdir(), `peekpick-test-skipverify-${Date.now()}.db`);
for (const suffix of ["", "-wal", "-shm"]) {
  try {
    fs.unlinkSync(dbPath + suffix);
  } catch {}
}
process.env.PEEKPICK_DB_PATH = dbPath;
process.env.SKIP_EMAIL_VERIFICATION = "1";
process.env.RESEND_API_KEY = "test-key";
process.env.RESEND_API_URL = "http://127.0.0.1:58239/dead-resend-endpoint";

const { default: db } = await import("./db.js");
const { default: app } = await import("./index.js");

const PORT = 3998;
const BASE = `http://localhost:${PORT}`;

function assert(cond, message) {
  if (!cond) throw new Error(`FAIL: ${message}`);
}

async function api(method, urlPath, { json } = {}) {
  const headers = {};
  let body;
  if (json) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  }
  const res = await fetch(`${BASE}${urlPath}`, { method, headers, body });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  return { status: res.status, data };
}

async function main() {
  const server = await new Promise((resolve, reject) => {
    const s = app.listen(PORT, (err) => (err ? reject(err) : resolve(s)));
  });

  try {
    const email = "skipflag@test.dev";
    const password = "password123";

    const signup = await api("POST", "/api/auth/signup", { json: { email, password, name: "Skip Flag" } });
    assert(signup.status === 201, `signup status 201, got ${signup.status} ${JSON.stringify(signup.data)}`);
    assert(signup.data.needsVerification === false, "signup needsVerification false with the flag on");

    const row = db.prepare("SELECT verified, verify_code FROM users WHERE email = ?").get(email);
    assert(row && row.verified === 1, "user is verified immediately with the flag on");
    assert(!row.verify_code, "no verify code generated with the flag on");

    // straight to login — no call to /api/auth/verify anywhere in this test
    const login = await api("POST", "/api/auth/login", { json: { email, password } });
    assert(login.status === 200, `login status 200, got ${login.status} ${JSON.stringify(login.data)}`);
    assert(login.data.token, "login returns a token with no verification step");
    assert(login.data.user.verified === true, "logged-in user is verified");

    console.log("SKIP_EMAIL_VERIFICATION PASS");
    process.exitCode = 0;
  } catch (err) {
    console.error(err.message || err);
    process.exitCode = 1;
  } finally {
    server.close();
    db.close();
    for (const suffix of ["", "-wal", "-shm"]) {
      try {
        fs.unlinkSync(dbPath + suffix);
      } catch {}
    }
  }
}

main();
