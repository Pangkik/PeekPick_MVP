import type { Item } from "./types";

/**
 * Demo deck shown to logged-out visitors so "/" is fully browsable before
 * signup ("browse first, gate on action" — see decisions doc).
 *
 * TODO(dev): this is a static, frontend-only fallback. Once /api/discovery
 * supports unauthenticated requests, replace the DEMO_ITEMS branch in
 * SwipeInterface.tsx / Search.tsx with real data, or keep this as an
 * offline/empty-state fallback — your call.
 *
 * photoUrls are intentionally empty: no real image URLs were verified for
 * this dataset, so items render through <ItemVisual> (gradient + Lucide
 * icon) instead of guessing at stock photos. A dev can attach real
 * photoUrls per item once available.
 */
export const DEMO_ITEMS: Item[] = [
  {
    id: "demo-1",
    title: "Sony A6000 Mirrorless Camera",
    category: "electronics",
    condition: "like-new",
    description:
      "Barely used mirrorless camera with kit lens. Perfect for someone getting into photography. Comes with original box and charger.",
    photoUrls: [],
    wants: ["books", "art"],
    available: true,
    createdAt: new Date().toISOString(),
    owner: { id: "demo-owner-1", name: "Maya Chen", location: "Cebu City, PH" },
  },
  {
    id: "demo-2",
    title: "Vintage Leather Jacket (M)",
    category: "clothing",
    condition: "gently-used",
    description: "Genuine leather, broken in just right. A few character marks but no damage. Smoke-free home.",
    photoUrls: [],
    wants: ["electronics"],
    available: true,
    createdAt: new Date().toISOString(),
    owner: { id: "demo-owner-2", name: "Jordan Reyes", location: "Manila, PH" },
  },
  {
    id: "demo-3",
    title: "Complete Harry Potter Box Set",
    category: "books",
    condition: "like-new",
    description: "All 7 hardcovers, read once and kept on a shelf since. No creases on the spines.",
    photoUrls: [],
    wants: ["games", "home"],
    available: true,
    createdAt: new Date().toISOString(),
    owner: { id: "demo-owner-3", name: "Priya Santos", location: "Quezon City, PH" },
  },
  {
    id: "demo-4",
    title: "Stand Mixer, 5-Quart",
    category: "home",
    condition: "gently-used",
    description: "Great for bread and cake batters. Comes with the whisk, dough hook, and paddle attachments.",
    photoUrls: [],
    wants: ["plants", "tools"],
    available: true,
    createdAt: new Date().toISOString(),
    owner: { id: "demo-owner-4", name: "Alex Kim", location: "Davao City, PH" },
  },
  {
    id: "demo-5",
    title: "Nintendo Switch + 3 Games",
    category: "games",
    condition: "like-new",
    description: "Console, dock, both Joy-Cons, and three physical game cartridges. Screen protector already applied.",
    photoUrls: [],
    wants: ["sports", "electronics"],
    available: true,
    createdAt: new Date().toISOString(),
    owner: { id: "demo-owner-5", name: "Ben Cruz", location: "Iloilo City, PH" },
  },
  {
    id: "demo-6",
    title: "Monstera Deliciosa Cutting, Rooted",
    category: "plants",
    condition: "brand-new",
    description: "Healthy rooted cutting with two leaves, ready to pot. Easy care, thrives indoors.",
    photoUrls: [],
    wants: ["art", "books"],
    available: true,
    createdAt: new Date().toISOString(),
    owner: { id: "demo-owner-6", name: "Isla Fernandez", location: "Baguio City, PH" },
  },
  {
    id: "demo-7",
    title: "Handmade Ceramic Vase Set (3pc)",
    category: "art",
    condition: "brand-new",
    description: "Hand-thrown stoneware vases in three sizes, unglazed matte finish. Never displayed.",
    photoUrls: [],
    wants: ["clothing", "home"],
    available: true,
    createdAt: new Date().toISOString(),
    owner: { id: "demo-owner-7", name: "Noah Villanueva", location: "Bacolod City, PH" },
  },
  {
    id: "demo-8",
    title: "Cordless Drill + Bit Set",
    category: "tools",
    condition: "well-loved",
    description: "18V drill with charger and a 40-piece bit set. Well used but fully functional, holds a charge fine.",
    photoUrls: [],
    wants: ["food", "plants"],
    available: true,
    createdAt: new Date().toISOString(),
    owner: { id: "demo-owner-8", name: "Sam Torres", location: "Cagayan de Oro, PH" },
  },
];
