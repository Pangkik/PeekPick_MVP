// Seeds 8 demo users (password "demo1234", verified) with 1-2 items each. Idempotent.
import bcrypt from "bcryptjs";
import db from "./db.js";

const existing = db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
if (existing > 0) {
  console.log(`[seed] ${existing} users already present, skipping.`);
  process.exit(0);
}

const passwordHash = bcrypt.hashSync("demo1234", 10);

const users = [
  { email: "ava@peekpick.demo", name: "Ava Chen", location: "Iloilo City", bio: "Swap first, ask later." },
  { email: "ben@peekpick.demo", name: "Ben Ortiz", location: "Jaro, Iloilo", bio: "Tools guy, plant curious." },
  { email: "cara@peekpick.demo", name: "Cara Lin", location: "Molo, Iloilo", bio: "Book hoarder in recovery." },
  { email: "dev@peekpick.demo", name: "Dev Patel", location: "Mandurriao, Iloilo", bio: "Gadgets come and go." },
  { email: "ella@peekpick.demo", name: "Ella Novak", location: "La Paz, Iloilo", bio: "Thrifting is a lifestyle." },
  { email: "finn@peekpick.demo", name: "Finn Walsh", location: "Oton, Iloilo", bio: "Outdoor gear rotation." },
  { email: "grace@peekpick.demo", name: "Grace Kim", location: "Pavia, Iloilo", bio: "Baby stuff grows fast, so do I trade fast." },
  { email: "hugo@peekpick.demo", name: "Hugo Reyes", location: "Santa Barbara, Iloilo", bio: "Art supplies and good vibes." },
];

const items = [
  [{ title: "Mechanical Keyboard", category: "electronics", condition: "good", description: "Hot-swappable, barely used.", wants: ["books", "games"] }],
  [{ title: "Cordless Drill", category: "tools", condition: "good", description: "18V, comes with two batteries.", wants: ["plants", "home"] },
   { title: "Monstera Cutting", category: "plants", condition: "new", description: "Rooted and ready to pot.", wants: ["tools"] }],
  [{ title: "Sci-Fi Novel Bundle", category: "books", condition: "good", description: "12 paperbacks, sci-fi classics.", wants: ["clothing"] }],
  [{ title: "Wireless Earbuds", category: "electronics", condition: "like-new", description: "Case has minor scuffs.", wants: ["games", "sports"] },
   { title: "Retro Console", category: "games", condition: "fair", description: "Works great, missing one controller.", wants: ["electronics"] }],
  [{ title: "Denim Jacket", category: "clothing", condition: "good", description: "Size M, vintage wash.", wants: ["beauty", "books"] }],
  [{ title: "Camping Tent", category: "sports", condition: "good", description: "4-person, used twice.", wants: ["tools", "home"] },
   { title: "Trail Running Shoes", category: "sports", condition: "fair", description: "Size 10, still plenty of tread.", wants: ["clothing"] }],
  [{ title: "Baby Carrier", category: "baby", condition: "like-new", description: "Outgrown fast, barely worn.", wants: ["baby", "home"] }],
  [{ title: "Watercolor Set", category: "art", condition: "new", description: "Unopened, gifted twice.", wants: ["books", "plants"] },
   { title: "Skincare Bundle", category: "beauty", condition: "new", description: "Unopened sample sizes.", wants: ["art"] }],
];

const insertUser = db.prepare(
  "INSERT INTO users (email, password_hash, name, bio, location, verified) VALUES (?, ?, ?, ?, ?, 1)"
);
const insertPassport = db.prepare("INSERT INTO passports (user_id) VALUES (?)");
const insertItem = db.prepare(
  `INSERT INTO items (user_id, title, category, condition, description, wants) VALUES (?, ?, ?, ?, ?, ?)`
);

const run = db.transaction(() => {
  users.forEach((u, i) => {
    const info = insertUser.run(u.email, passwordHash, u.name, u.bio, u.location);
    const userId = info.lastInsertRowid;
    insertPassport.run(userId);
    for (const item of items[i]) {
      insertItem.run(userId, item.title, item.category, item.condition, item.description, JSON.stringify(item.wants));
    }
  });
});
run();

console.log(`[seed] created ${users.length} demo users (password: demo1234)`);
