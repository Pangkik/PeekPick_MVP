export const CATEGORIES = [
  { id: "electronics", icon: "📱", label: "Electronics & Gadgets" },
  { id: "clothing", icon: "👕", label: "Clothing & Accessories" },
  { id: "books", icon: "📚", label: "Books & Stationery" },
  { id: "home", icon: "🏠", label: "Home & Kitchen" },
  { id: "games", icon: "🎮", label: "Toys & Games" },
  { id: "plants", icon: "🌱", label: "Plants & Garden" },
  { id: "art", icon: "🎨", label: "Art & Handmade Crafts" },
  { id: "tools", icon: "🔧", label: "Tools & Equipment" },
  { id: "food", icon: "🍳", label: "Homemade Food & Produce" },
  { id: "sports", icon: "🏋️", label: "Sports & Fitness Gear" },
  { id: "baby", icon: "👶", label: "Baby & Kids Items" },
  { id: "beauty", icon: "💄", label: "Beauty & Personal Care" },
];

export const CONDITIONS = [
  { id: "brand-new", label: "Brand New", desc: "Never used, original packaging" },
  { id: "like-new", label: "Like New", desc: "Barely used, no visible wear" },
  { id: "gently-used", label: "Gently Used", desc: "Minor signs of use, fully functional" },
  { id: "well-loved", label: "Well-Loved", desc: "Noticeable wear but works great" },
];

export function labelFor(list: { id: string; label: string }[], id: string) {
  return list.find((entry) => entry.id === id)?.label ?? id;
}
