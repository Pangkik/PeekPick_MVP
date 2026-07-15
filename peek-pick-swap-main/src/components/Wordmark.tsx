import { cn } from "@/lib/utils";

const SIZES = {
  sm: { badge: "w-6 h-6 text-xs", text: "text-base" },
  md: { badge: "w-8 h-8 text-sm", text: "text-lg" },
};

// Brand wordmark: the circle-P badge doubles as the first letter — (P)eekPick.
export default function Wordmark({
  rest = "eekPick",
  size = "md",
  className,
}: {
  rest?: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <span className={cn("inline-flex items-center", className)} aria-label={`P${rest}`}>
      <span
        aria-hidden="true"
        className={cn(
          "rounded-full bg-primary flex items-center justify-center font-black text-primary-foreground",
          s.badge
        )}
      >
        P
      </span>
      <span aria-hidden="true" className={cn("font-black tracking-tight ml-0.5", s.text)}>
        {rest}
      </span>
    </span>
  );
}
