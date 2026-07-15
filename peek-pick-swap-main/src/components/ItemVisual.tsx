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
import { cn } from "@/lib/utils";

/**
 * Tasteful gradient + Lucide-icon placeholder for items without a real photo.
 * Used for the demo deck (logged-out browsing) and as a fallback anywhere
 * an item's photoUrls array is empty. No emoji, ever.
 */

export const CARD_GRADIENTS = [
  "from-primary/25 to-accent/20",
  "from-secondary/30 to-primary/20",
  "from-accent/25 to-secondary/20",
  "from-primary/20 to-secondary/25",
  "from-accent/20 to-primary/25",
];

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  electronics: Smartphone,
  clothing: Shirt,
  books: BookOpen,
  home: Sofa,
  games: Gamepad2,
  plants: Leaf,
  art: Palette,
  tools: Wrench,
  food: UtensilsCrossed,
  sports: Dumbbell,
  baby: Baby,
  beauty: Sparkles,
};

export function categoryIcon(category: string): LucideIcon {
  return CATEGORY_ICONS[category] ?? Package;
}

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
    <div className={cn("w-full h-full flex items-center justify-center bg-gradient-to-br", gradient, className)}>
      <Icon className={cn("w-16 h-16 text-foreground/40", iconClassName)} aria-hidden="true" />
    </div>
  );
}
