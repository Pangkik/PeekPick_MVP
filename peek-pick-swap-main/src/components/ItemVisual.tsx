import { cn } from "@/lib/utils";
import { categoryIcon } from "@/lib/categories";

/**
 * Gradient + Lucide-icon placeholder for items without a real photo.
 * Used for the demo deck (logged-out browsing) and as a fallback anywhere
 * an item's photoUrls array is empty. No emoji, ever. The icon mapping
 * itself lives in src/lib/categories.ts (single source of truth).
 *
 * Ramps follow the reference's editorial three-stop 135° structure: a light
 * warm top, a saturated mid, and a deep bottom. The deep end matters — the
 * card's bottom scrim sits on top of it, and that is what keeps white
 * overlay type above 4.5:1.
 */

export const CARD_GRADIENTS = [
  "linear-gradient(135deg, hsl(11 100% 83%) 0%, hsl(12 53% 65%) 50%, hsl(348 41% 38%) 100%)", // blush → wine
  "linear-gradient(135deg, hsl(28 100% 84%) 0%, hsl(20 55% 60%) 50%, hsl(12 45% 30%) 100%)", // peach → oxblood
  "linear-gradient(135deg, hsl(150 45% 82%) 0%, hsl(158 35% 52%) 50%, hsl(165 55% 22%) 100%)", // mint → forest
  "linear-gradient(135deg, hsl(266 70% 88%) 0%, hsl(258 40% 62%) 50%, hsl(262 45% 30%) 100%)", // lilac → plum
  "linear-gradient(135deg, hsl(40 70% 85%) 0%, hsl(28 40% 58%) 50%, hsl(22 35% 28%) 100%)", // sand → umber
];

interface ItemVisualProps {
  category: string;
  index?: number;
  photoUrl?: string;
  alt: string;
  className?: string;
  iconClassName?: string;
}

export default function ItemVisual({ category, index = 0, photoUrl, alt, className, iconClassName }: ItemVisualProps) {
  if (photoUrl) {
    return <img src={photoUrl} alt={alt} className={cn("w-full h-full object-cover", className)} />;
  }

  const Icon = categoryIcon(category);
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

  return (
    <div
      className={cn("w-full h-full flex items-center justify-center", className)}
      style={{ backgroundImage: gradient }}
    >
      <Icon className={cn("w-16 h-16 text-white/45", iconClassName)} aria-hidden="true" />
    </div>
  );
}
