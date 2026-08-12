import {
  Package,
  Smartphone,
  Shirt,
  BookOpen,
  Sofa,
  Gamepad2,
  Leaf,
  Palette,
  Wrench,
  UtensilsCrossed,
  Dumbbell,
  Baby,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

/**
 * Canonical category → Lucide icon mapping. This is the single source of
 * truth: ItemVisual.tsx (photo placeholder) and every page that renders a
 * category chip/bubble (Onboarding, AddItem, the swipe card label) resolve
 * icons through CATEGORIES/categoryIcon below. No emoji, ever, and no
 * second mapping living elsewhere.
 */
export const CATEGORIES: { id: string; icon: LucideIcon; label: string }[] = [
  { id: "electronics", icon: Smartphone, label: "Electronics & Gadgets" },
  { id: "clothing", icon: Shirt, label: "Clothing & Accessories" },
  { id: "books", icon: BookOpen, label: "Books & Stationery" },
  { id: "home", icon: Sofa, label: "Home & Kitchen" },
  { id: "games", icon: Gamepad2, label: "Toys & Games" },
  { id: "plants", icon: Leaf, label: "Plants & Garden" },
  { id: "art", icon: Palette, label: "Art & Handmade Crafts" },
  { id: "tools", icon: Wrench, label: "Tools & Equipment" },
  { id: "food", icon: UtensilsCrossed, label: "Homemade Food & Produce" },
  { id: "sports", icon: Dumbbell, label: "Sports & Fitness Gear" },
  { id: "baby", icon: Baby, label: "Baby & Kids Items" },
  { id: "beauty", icon: Sparkles, label: "Beauty & Personal Care" },
];

/** Fallback-safe icon lookup by category id (used by ItemVisual's placeholder). */
export function categoryIcon(category: string): LucideIcon {
  return CATEGORIES.find((c) => c.id === category)?.icon ?? Package;
}

export const CONDITIONS = [
  { id: "brand-new", label: "Brand New", desc: "Never used, original packaging" },
  { id: "like-new", label: "Like New", desc: "Barely used, no visible wear" },
  { id: "gently-used", label: "Gently Used", desc: "Minor signs of use, fully functional" },
  { id: "well-loved", label: "Well-Loved", desc: "Noticeable wear but works great" },
];

export function labelFor(list: { id: string; label: string }[], id: string) {
  const known = list.find((entry) => entry.id === id)?.label;
  if (known) return known;
  // Legacy/seed rows can carry ids that predate the current list ("new",
  // "good"). Humanise rather than leaking a raw slug into the UI.
  return id
    ? id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : id;
}
