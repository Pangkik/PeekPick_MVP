// Plain-node self-check for the PeekPick API. Boots the app in-process on a throwaway
// db + port, drives the full signup -> match -> chat -> complete flow, asserts along the way.
// ponytail: no test framework — one linear script is enough for a backend this size.
import fs from "fs";
import path from "path";
import os from "os";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";

const dbPath = path.join(os.tmpdir(), `peekpick-test-${Date.now()}.db`);
for (const suffix of ["", "-wal", "-shm"]) {
  try {
    fs.unlinkSync(dbPath + suffix);
  } catch {}
}
process.env.PEEKPICK_DB_PATH = dbPath;
// ponytail: point Resend at a dead port so every signup/login in this run exercises the
// "provider unreachable -> fall back to console.log" path (see sendVerificationCode).
process.env.RESEND_API_KEY = "test-key";
process.env.RESEND_API_URL = "http://127.0.0.1:58239/dead-resend-endpoint";
// ponytail: small daily swipe limit so the test doesn't need 50 items to hit it
process.env.DAILY_SWIPE_LIMIT = "5";

// dynamic import so the env var above is set before db.js opens its connection
const { default: db } = await import("./db.js");
const { default: app } = await import("./index.js");

const PORT = 3999;
const BASE = `http://localhost:${PORT}`;

function assert(cond, message) {
  if (!cond) throw new Error(`FAIL: ${message}`);
}

async function api(method, urlPath, { token, json, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let body;
  if (json) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  } else if (form) {
    body = form; // FormData sets its own content-type/boundary
  }
  const res = await fetch(`${BASE}${urlPath}`, { method, headers, body });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  return { status: res.status, data };
}

function verifyCodeFor(email) {
  return db.prepare("SELECT verify_code FROM users WHERE email = ?").get(email).verify_code;
}

async function signupAndVerify(email, password, name) {
  const signup = await api("POST", "/api/auth/signup", { json: { email, password, name } });
  assert(signup.status === 201, `signup status 201, got ${signup.status} ${JSON.stringify(signup.data)}`);
  assert(signup.data.needsVerification === true, "signup needsVerification true");

  const code = verifyCodeFor(email);
  assert(code, `verify code stored for ${email}`);

  const verify = await api("POST", "/api/auth/verify", { json: { email, code } });
  assert(verify.status === 200, `verify status 200, got ${verify.status} ${JSON.stringify(verify.data)}`);
  assert(verify.data.token, "verify returns token");

  const login = await api("POST", "/api/auth/login", { json: { email, password } });
  assert(login.status === 200, `login status 200, got ${login.status} ${JSON.stringify(login.data)}`);
  assert(login.data.token, "login returns token");
  assert(login.data.user.email === email, "login user email matches");
  return login.data.token;
}

async function createItem(token, { title, category, condition, description, wants }) {
  const form = new FormData();
  form.append("title", title);
  form.append("category", category);
  form.append("condition", condition);
  form.append("description", description);
  form.append("wants", JSON.stringify(wants));
  const res = await api("POST", "/api/items", { token, form });
  assert(res.status === 201, `create item status 201, got ${res.status} ${JSON.stringify(res.data)}`);
  return res.data.item;
}

async function main() {
  const server = await new Promise((resolve, reject) => {
    const s = app.listen(PORT, (err) => (err ? reject(err) : resolve(s)));
  });

  try {
    // --- signup, verify, login for two users ---
    const tokenA = await signupAndVerify("alice@test.dev", "password123", "Alice");
    const tokenB = await signupAndVerify("bob@test.dev", "password123", "Bob");

    const meA = await api("GET", "/api/me", { token: tokenA });
    const meB = await api("GET", "/api/me", { token: tokenB });
    assert(meA.status === 200 && meB.status === 200, "GET /api/me works for both users");

    // --- preferences ---
    const prefA = await api("POST", "/api/me/preferences", {
      token: tokenA,
      json: { haveCategories: ["books"], wantCategories: ["electronics"], condition: "good", radius: "city", tradeStyle: "one-for-one" },
    });
    assert(prefA.status === 200 && prefA.data.ok === true, "set preferences for A");

    const prefB = await api("POST", "/api/me/preferences", {
      token: tokenB,
      json: { haveCategories: ["electronics"], wantCategories: ["books"], condition: "good", radius: "city", tradeStyle: "one-for-one" },
    });
    assert(prefB.status === 200 && prefB.data.ok === true, "set preferences for B");

    // --- create one item per user ---
    const itemA = await createItem(tokenA, {
      title: "Fantasy Novel Set",
      category: "books",
      condition: "good",
      description: "Trilogy, good shape.",
      wants: ["electronics"],
    });
    const itemB = await createItem(tokenB, {
      title: "Bluetooth Speaker",
      category: "electronics",
      condition: "good",
      description: "Works great.",
      wants: ["books"],
    });

    // discovery sanity: A should see B's item ranked (wants electronics -> +2)
    const discoveryA = await api("GET", "/api/discovery", { token: tokenA });
    assert(discoveryA.status === 200, "discovery status 200");
    assert(discoveryA.data.items.some((i) => i.id === itemB.id), "A's discovery includes B's item");

    // --- swipes: A right-swipes B's item first (no match yet) ---
    const swipe1 = await api("POST", "/api/swipes", { token: tokenA, json: { itemId: itemB.id, direction: "right" } });
    assert(swipe1.status === 200, `swipe1 status 200, got ${swipe1.status} ${JSON.stringify(swipe1.data)}`);
    assert(swipe1.data.matched === false, "A swiping B's item first is not yet a match");

    // --- B right-swipes A's item -> mutual match ---
    const swipe2 = await api("POST", "/api/swipes", { token: tokenB, json: { itemId: itemA.id, direction: "right" } });
    assert(swipe2.status === 200, `swipe2 status 200, got ${swipe2.status} ${JSON.stringify(swipe2.data)}`);
    assert(swipe2.data.matched === true, "B swiping A's item completes the match");
    assert(swipe2.data.conversationId, "match response has conversationId");
    assert(swipe2.data.trade && swipe2.data.trade.id, "match response has trade");
    assert(swipe2.data.myItem.id === itemB.id, "matched myItem (for B) is itemB");
    assert(swipe2.data.theirItem.id === itemA.id, "matched theirItem (for B) is itemA");
    assert(swipe2.data.otherUser.id === meA.data.user.id, "matched otherUser is Alice");

    const conversationId = swipe2.data.conversationId;
    const tradeId = swipe2.data.trade.id;

    // --- matches list shows up for both ---
    const matchesA = await api("GET", "/api/matches", { token: tokenA });
    const matchesB = await api("GET", "/api/matches", { token: tokenB });
    assert(matchesA.data.matches.length === 1, "A has one match");
    assert(matchesB.data.matches.length === 1, "B has one match");

    // --- chat: B sends a message, A polls for it ---
    const send = await api("POST", `/api/conversations/${conversationId}/messages`, {
      token: tokenB,
      json: { content: "Hey, want to trade?" },
    });
    assert(send.status === 201, `send message status 201, got ${send.status} ${JSON.stringify(send.data)}`);

    const poll = await api("GET", `/api/conversations/${conversationId}/messages?after=0`, { token: tokenA });
    assert(poll.status === 200, "poll messages status 200");
    assert(poll.data.messages.length === 1, "A sees B's message via polling");
    assert(poll.data.messages[0].content === "Hey, want to trade?", "message content matches");

    // --- complete the trade, check passports for both sides ---
    const complete = await api("POST", `/api/trades/${tradeId}/complete`, { token: tokenA });
    assert(complete.status === 200, `complete status 200, got ${complete.status} ${JSON.stringify(complete.data)}`);
    assert(complete.data.trade.status === "completed", "trade status completed");

    const passportA = await api("GET", "/api/me", { token: tokenA });
    const passportB = await api("GET", "/api/me", { token: tokenB });
    assert(passportA.data.passport.itemsReused === 1, `A itemsReused should be 1, got ${passportA.data.passport.itemsReused}`);
    assert(passportB.data.passport.itemsReused === 1, `B itemsReused should be 1, got ${passportB.data.passport.itemsReused}`);
    assert(passportA.data.passport.badges.includes("first-swap"), "A earned first-swap badge");

    // idempotency: completing again must not double-count
    const completeAgain = await api("POST", `/api/trades/${tradeId}/complete`, { token: tokenB });
    assert(completeAgain.status === 200, "complete again status 200");
    const passportA2 = await api("GET", "/api/me", { token: tokenA });
    assert(passportA2.data.passport.itemsReused === 1, "completing twice does not double-count");

    // --- third user for reports & blocks ---
    const tokenC = await signupAndVerify("carol@test.dev", "password123", "Carol");
    const meC = await api("GET", "/api/me", { token: tokenC });
    await api("POST", "/api/me/preferences", {
      token: tokenC,
      json: { haveCategories: ["plants"], wantCategories: ["books"], condition: "good", radius: "city", tradeStyle: "one-for-one" },
    });
    const itemC = await createItem(tokenC, {
      title: "Succulent Pot",
      category: "plants",
      condition: "good",
      description: "Small and cheerful.",
      wants: ["books"],
    });

    // --- report ---
    const badReport = await api("POST", "/api/reports", { token: tokenA, json: { targetType: "item", targetId: itemC.id } });
    assert(badReport.status === 400, "report without reason is rejected");

    const report = await api("POST", "/api/reports", {
      token: tokenA,
      json: { targetType: "item", targetId: itemC.id, reason: "suspicious listing" },
    });
    assert(report.status === 201 && report.data.id, "report created");
    const reportRow = db.prepare("SELECT * FROM reports WHERE id = ?").get(report.data.id);
    assert(reportRow && reportRow.reporter_id === meA.data.user.id && reportRow.target_id === itemC.id, "report row stored correctly");

    // --- block hides discovery ---
    const discoveryBeforeBlock = await api("GET", "/api/discovery", { token: tokenA });
    assert(discoveryBeforeBlock.data.items.some((i) => i.id === itemC.id), "carol's item visible to A before block");

    const block = await api("POST", "/api/blocks", { token: tokenA, json: { userId: meC.data.user.id } });
    assert(block.status === 201, `block status 201, got ${block.status} ${JSON.stringify(block.data)}`);

    const discoveryAfterBlock = await api("GET", "/api/discovery", { token: tokenA });
    assert(!discoveryAfterBlock.data.items.some((i) => i.id === itemC.id), "carol's item hidden from A's discovery after block");

    // --- block prevents new matches (either direction) ---
    const blockedSwipe1 = await api("POST", "/api/swipes", { token: tokenA, json: { itemId: itemC.id, direction: "right" } });
    assert(blockedSwipe1.status === 403, `blocked swipe by blocker rejected, got ${blockedSwipe1.status}`);
    const blockedSwipe2 = await api("POST", "/api/swipes", { token: tokenC, json: { itemId: itemA.id, direction: "right" } });
    assert(blockedSwipe2.status === 403, `blocked swipe by blocked user rejected, got ${blockedSwipe2.status}`);

    const matchesAWhileBlocked = await api("GET", "/api/matches", { token: tokenA });
    assert(!matchesAWhileBlocked.data.matches.some((m) => m.otherUser && m.otherUser.id === meC.data.user.id), "no match formed with blocked user");

    // --- unblock restores normal behavior ---
    const unblock = await api("DELETE", `/api/blocks/${meC.data.user.id}`, { token: tokenA });
    assert(unblock.status === 200, "unblock status 200");

    const swipeAfterUnblock1 = await api("POST", "/api/swipes", { token: tokenA, json: { itemId: itemC.id, direction: "right" } });
    assert(swipeAfterUnblock1.status === 200 && swipeAfterUnblock1.data.matched === false, "A can swipe carol's item again after unblock");
    const swipeAfterUnblock2 = await api("POST", "/api/swipes", { token: tokenC, json: { itemId: itemA.id, direction: "right" } });
    assert(swipeAfterUnblock2.status === 200 && swipeAfterUnblock2.data.matched === true, "match forms normally after unblock");

    // --- block soft-hides an existing conversation without deleting it ---
    const matchesBBefore = await api("GET", "/api/matches", { token: tokenB });
    assert(matchesBBefore.data.matches.length === 1, "B still sees the alice<->bob match before the new block");
    const matchesABeforeBobBlock = await api("GET", "/api/matches", { token: tokenA });
    const countABeforeBobBlock = matchesABeforeBobBlock.data.matches.length; // alice<->bob and alice<->carol by now

    const bobBlocksAlice = await api("POST", "/api/blocks", { token: tokenB, json: { userId: meA.data.user.id } });
    assert(bobBlocksAlice.status === 201, "bob blocks alice");

    const matchesBAfter = await api("GET", "/api/matches", { token: tokenB });
    assert(matchesBAfter.data.matches.length === 0, "existing match hidden from B's /api/matches after blocking A");
    const matchesAAfterBobBlock = await api("GET", "/api/matches", { token: tokenA });
    assert(
      matchesAAfterBobBlock.data.matches.length === countABeforeBobBlock - 1 &&
        !matchesAAfterBobBlock.data.matches.some((m) => m.otherUser && m.otherUser.id === meB.data.user.id),
      "alice<->bob match hidden from A's /api/matches too (block is mutual), other matches unaffected"
    );

    const chatBlocked = await api("GET", `/api/conversations/${conversationId}/messages`, { token: tokenA });
    assert(chatBlocked.status === 404, "chat endpoint hides conversation once blocked");

    const bobUnblocksAlice = await api("DELETE", `/api/blocks/${meA.data.user.id}`, { token: tokenB });
    assert(bobUnblocksAlice.status === 200, "bob unblocks alice");
    const matchesBRestored = await api("GET", "/api/matches", { token: tokenB });
    assert(matchesBRestored.data.matches.length === 1, "unblocking restores the match — data was hidden, not deleted");

    // --- counteroffers with optional cash ---
    const itemA2 = await createItem(tokenA, { title: "Chess Set", category: "games", condition: "good", description: "", wants: ["electronics"] });
    const itemB2 = await createItem(tokenB, { title: "Wireless Mouse", category: "electronics", condition: "good", description: "", wants: ["games"] });
    const offerSwipe1 = await api("POST", "/api/swipes", { token: tokenA, json: { itemId: itemB2.id, direction: "right" } });
    assert(offerSwipe1.status === 200, `offer-setup swipe1 status 200, got ${offerSwipe1.status} ${JSON.stringify(offerSwipe1.data)}`);
    const offerSwipe2 = await api("POST", "/api/swipes", { token: tokenB, json: { itemId: itemA2.id, direction: "right" } });
    assert(offerSwipe2.status === 200 && offerSwipe2.data.matched === true, "second alice<->bob match formed for offer testing");
    const conversationId2 = offerSwipe2.data.conversationId;
    const tradeId2 = offerSwipe2.data.trade.id;

    const itemA3 = await createItem(tokenA, { title: "Vinyl Record", category: "art", condition: "good", description: "", wants: [] });

    const nonParticipantOffer = await api("POST", `/api/conversations/${conversationId2}/offers`, { token: tokenC, json: { cashAmount: 10 } });
    assert(nonParticipantOffer.status === 404, "non-participant cannot propose an offer");

    const badOwnerOffer = await api("POST", `/api/conversations/${conversationId2}/offers`, { token: tokenB, json: { offerItemId: itemA3.id } });
    assert(badOwnerOffer.status === 400, "offering an item you don't own is rejected");

    const badCashOffer = await api("POST", `/api/conversations/${conversationId2}/offers`, { token: tokenA, json: { cashAmount: -5 } });
    assert(badCashOffer.status === 400, "negative cash amount is rejected");

    const proposeOffer = await api("POST", `/api/conversations/${conversationId2}/offers`, {
      token: tokenA,
      json: { offerItemId: itemA3.id, cashAmount: 100, note: "throwing in some cash" },
    });
    assert(proposeOffer.status === 201, `propose offer status 201, got ${proposeOffer.status} ${JSON.stringify(proposeOffer.data)}`);
    assert(proposeOffer.data.offer.status === "pending", "offer starts pending");
    assert(proposeOffer.data.offer.offerItem.id === itemA3.id, "offer carries the proposed item");
    assert(proposeOffer.data.offer.cashAmount === 100, "offer carries the cash amount");

    // a second offer from the same sender auto-declines the first (one live offer per side)
    const proposeOfferAgain = await api("POST", `/api/conversations/${conversationId2}/offers`, {
      token: tokenA,
      json: { cashAmount: 200, note: "actually, more cash" },
    });
    assert(proposeOfferAgain.status === 201, "second offer from same sender created");
    const firstOfferRow = db.prepare("SELECT * FROM offers WHERE id = ?").get(proposeOffer.data.offer.id);
    assert(firstOfferRow.status === "declined", "earlier pending offer from the same sender is auto-declined");

    const offersList = await api("GET", `/api/conversations/${conversationId2}/offers`, { token: tokenB });
    assert(offersList.status === 200 && offersList.data.offers.length === 2, "offers list shows both offers, newest first");
    assert(offersList.data.offers[0].id === proposeOfferAgain.data.offer.id, "offers list is newest first");

    const liveOfferId = proposeOfferAgain.data.offer.id;
    const acceptByProposer = await api("POST", `/api/offers/${liveOfferId}/accept`, { token: tokenA });
    assert(acceptByProposer.status === 403, `proposer cannot accept their own offer, got ${acceptByProposer.status}`);

    const accept = await api("POST", `/api/offers/${liveOfferId}/accept`, { token: tokenB });
    assert(accept.status === 200, `accept offer status 200, got ${accept.status} ${JSON.stringify(accept.data)}`);
    assert(accept.data.offer.status === "accepted", "offer marked accepted");
    assert(accept.data.trade.status === "confirmed", "trade status set to confirmed after accept");

    // this offer had no offerItemId, so alice's side of the trade should be unchanged (still itemA2)
    const tradeAfterCashOnly = db.prepare("SELECT * FROM trades WHERE id = ?").get(tradeId2);
    const aliceIsUser1_2 = tradeAfterCashOnly.user1_id === meA.data.user.id;
    assert(
      (aliceIsUser1_2 ? tradeAfterCashOnly.item1_id : tradeAfterCashOnly.item2_id) === itemA2.id,
      "cash-only offer does not change the trade's item"
    );

    // idempotent accept: accepting again returns the same result without reapplying
    const acceptAgain = await api("POST", `/api/offers/${liveOfferId}/accept`, { token: tokenB });
    assert(acceptAgain.status === 200 && acceptAgain.data.offer.status === "accepted", "accepting an already-accepted offer is idempotent");

    // decline path
    const proposeOffer2 = await api("POST", `/api/conversations/${conversationId2}/offers`, {
      token: tokenB,
      json: { offerItemId: itemB2.id, cashAmount: 0, note: "counter" },
    });
    assert(proposeOffer2.status === 201, "bob proposes a counteroffer");
    const declineByProposer = await api("POST", `/api/offers/${proposeOffer2.data.offer.id}/decline`, { token: tokenB });
    assert(declineByProposer.status === 403, "proposer cannot decline their own offer");
    const decline = await api("POST", `/api/offers/${proposeOffer2.data.offer.id}/decline`, { token: tokenA });
    assert(decline.status === 200 && decline.data.offer.status === "declined", "recipient can decline an offer");

    // --- ratings after a completed trade ---
    const rateNotCompleted = await api("POST", `/api/trades/${tradeId2}/rate`, { token: tokenA, json: { stars: 5 } });
    assert(rateNotCompleted.status === 400, `rating a non-completed trade should 400, got ${rateNotCompleted.status}`);

    const rate1 = await api("POST", `/api/trades/${tradeId}/rate`, { token: tokenA, json: { stars: 5, comment: "Great trade!" } });
    assert(rate1.status === 201, `rate trade status 201, got ${rate1.status} ${JSON.stringify(rate1.data)}`);
    assert(rate1.data.rating.stars === 5, "rating stars stored");

    const rateTwice = await api("POST", `/api/trades/${tradeId}/rate`, { token: tokenA, json: { stars: 3 } });
    assert(rateTwice.status === 409, `rating the same trade twice should 409, got ${rateTwice.status}`);

    const badStars = await api("POST", `/api/trades/${tradeId}/rate`, { token: tokenB, json: { stars: 7 } });
    assert(badStars.status === 400, "stars out of range is rejected");

    const rate2 = await api("POST", `/api/trades/${tradeId}/rate`, { token: tokenB, json: { stars: 4, comment: "Smooth swap" } });
    assert(rate2.status === 201, `bob rates alice for the same trade, got ${rate2.status} ${JSON.stringify(rate2.data)}`);

    const bobRatings = await api("GET", `/api/users/${meB.data.user.id}/ratings`, { token: tokenA });
    assert(bobRatings.status === 200, "get user ratings status 200");
    assert(
      bobRatings.data.count === 1 && bobRatings.data.average === 5,
      `bob's rating aggregate wrong: ${JSON.stringify(bobRatings.data)}`
    );
    assert(bobRatings.data.ratings[0].rater.id === meA.data.user.id, "rating entry includes rater info");

    const meAAfterRating = await api("GET", "/api/me", { token: tokenA });
    assert(
      meAAfterRating.data.user.rating.average === 4 && meAAfterRating.data.user.rating.count === 1,
      `alice's rating should surface on her publicUser: ${JSON.stringify(meAAfterRating.data.user.rating)}`
    );

    const matchesAWithRating = await api("GET", "/api/matches", { token: tokenA });
    const matchForTrade = matchesAWithRating.data.matches.find((m) => m.trade.id === tradeId);
    assert(matchForTrade && matchForTrade.myRating && matchForTrade.myRating.stars === 5, "myRating surfaces on the matches list");

    // --- daily swipe limit (DAILY_SWIPE_LIMIT=5 for this run; run last among swipe tests since it
    // deliberately exhausts alice's daily quota). Reuses carol (tokenC) as the item owner instead of
    // signing up a fresh user — the auth rate limiter's budget is shared across this whole script and
    // is exercised deliberately at the very end, so extra signups here would trip it early. ---
    const beforeLimitMe = await api("GET", "/api/me", { token: tokenA });
    assert(typeof beforeLimitMe.data.swipesRemaining === "number", "swipesRemaining present on GET /api/me");
    const startRemaining = beforeLimitMe.data.swipesRemaining;

    const baitItems = [];
    for (let i = 0; i < startRemaining + 3; i++) {
      baitItems.push(await createItem(tokenC, { title: `Bait ${i}`, category: "books", condition: "good", description: "", wants: [] }));
    }

    let swipedCount = 0;
    let limitRes = null;
    for (const it of baitItems) {
      limitRes = await api("POST", "/api/swipes", { token: tokenA, json: { itemId: it.id, direction: "right" } });
      if (limitRes.status === 429) break;
      assert(limitRes.status === 200, `swipe under the limit should succeed, got ${limitRes.status} ${JSON.stringify(limitRes.data)}`);
      assert(typeof limitRes.data.swipesRemaining === "number", "swipesRemaining present on swipe response");
      swipedCount++;
    }
    assert(limitRes.status === 429, `expected 429 once the daily swipe limit is reached, got ${limitRes.status}`);
    assert(limitRes.data.limitReached === true, "limitReached true in 429 body");
    assert(limitRes.data.swipesRemaining === 0, "swipesRemaining 0 in 429 body");
    assert(swipedCount === startRemaining, `expected exactly ${startRemaining} swipes to succeed before the block, got ${swipedCount}`);

    // re-swiping an item already swiped today must not consume quota or trip the limit
    const reswipe = await api("POST", "/api/swipes", { token: tokenA, json: { itemId: baitItems[0].id, direction: "right" } });
    assert(reswipe.status === 200, `re-swiping an already-swiped item should not 429, got ${reswipe.status} ${JSON.stringify(reswipe.data)}`);
    assert(reswipe.data.swipesRemaining === 0, "re-swipe leaves swipesRemaining unchanged at 0");

    const afterLimitMe = await api("GET", "/api/me", { token: tokenA });
    assert(afterLimitMe.data.swipesRemaining === 0, "GET /api/me reflects 0 swipes remaining after hitting the limit");

    // --- web push ---
    const pushKey = await api("GET", "/api/push/key");
    assert(pushKey.status === 200 && pushKey.data.publicKey, "push public key endpoint responds without auth");

    const subscribe = await api("POST", "/api/push/subscribe", {
      token: tokenA,
      json: { endpoint: "https://example.test/push/abc123", keys: { p256dh: "test-p256dh", auth: "test-auth" } },
    });
    assert(subscribe.status === 200 && subscribe.data.ok === true, "push subscribe responds ok");
    const subRow = db.prepare("SELECT * FROM push_subscriptions WHERE endpoint = ?").get("https://example.test/push/abc123");
    assert(subRow && subRow.user_id === meA.data.user.id, "subscription stored for alice");

    const unsubscribe = await api("POST", "/api/push/unsubscribe", { token: tokenA, json: { endpoint: "https://example.test/push/abc123" } });
    assert(unsubscribe.status === 200 && unsubscribe.data.ok === true, "push unsubscribe responds ok");
    const subRowGone = db.prepare("SELECT * FROM push_subscriptions WHERE endpoint = ?").get("https://example.test/push/abc123");
    assert(!subRowGone, "subscription removed after unsubscribe");

    // --- SKIP_EMAIL_VERIFICATION beta flag: separate process, the flag is read once at module load ---
    const skipVerifyScript = path.join(path.dirname(fileURLToPath(import.meta.url)), "test-skip-verify.js");
    const skipVerifyOut = execFileSync(process.execPath, [skipVerifyScript], { encoding: "utf8" });
    assert(skipVerifyOut.includes("SKIP_EMAIL_VERIFICATION PASS"), `skip-verify subprocess failed:\n${skipVerifyOut}`);

    // --- rate limiting: strict auth limiter trips under repeated hits (run last: shares the IP budget) ---
    let sawRateLimit = false;
    let lastAuthAttempt = null;
    for (let i = 0; i < 8; i++) {
      lastAuthAttempt = await api("POST", "/api/auth/login", { json: { email: "nobody@test.dev", password: "wrongpassword" } });
      if (lastAuthAttempt.status === 429) {
        sawRateLimit = true;
        break;
      }
    }
    assert(sawRateLimit, `expected a 429 from the auth rate limiter, got ${JSON.stringify(lastAuthAttempt)}`);

    console.log("ALL PASS");
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
