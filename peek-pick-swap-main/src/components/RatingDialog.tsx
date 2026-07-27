import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { RatingSummary } from "@/lib/types";

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tradeId: string;
  otherUserName?: string;
  onRated?: () => void;
}

export default function RatingDialog({ open, onOpenChange, tradeId, otherUserName, onRated }: RatingDialogProps) {
  const [stars, setStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setStars(0);
      setHoverStars(0);
      setComment("");
    }
  };

  const handleSubmit = async () => {
    if (stars === 0) return;
    setSubmitting(true);
    try {
      await api.post(`/api/trades/${tradeId}/rate`, { stars, comment: comment.trim() || undefined });
      toast.success("Thanks for rating your trade");
      onRated?.();
      handleOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  const displayStars = hoverStars || stars;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle>Rate your trade{otherUserName ? ` with ${otherUserName}` : ""}</DialogTitle>
          <DialogDescription>How did it go? Your rating helps keep PeekPick trustworthy.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-1.5 py-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setStars(n)}
              onMouseEnter={() => setHoverStars(n)}
              onMouseLeave={() => setHoverStars(0)}
              onFocus={() => setHoverStars(n)}
              onBlur={() => setHoverStars(0)}
              aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
              aria-pressed={stars >= n}
              className="w-11 h-11 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-full"
            >
              <Star
                className={cn(
                  "w-7 h-7 transition-colors",
                  n <= displayStars ? "fill-primary text-primary" : "text-muted-foreground"
                )}
              />
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rating-comment">Comment (optional)</Label>
          <Textarea
            id="rating-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="How was the swap?"
          />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <button type="button" className={cn(buttonVariants({ variant: "outline" }), "min-h-11")}>
              Skip for now
            </button>
          </DialogClose>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || stars === 0}
            className={cn(buttonVariants(), "min-h-11")}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Small inline rating readout — stars + average + count — reused on Profile and the
 * swipe card. `className` sets the text color/size so it can sit on both light cards
 * and the dark photo overlay; the star icon itself always stays brand-green.
 */
export function RatingStars({
  rating,
  className = "text-muted-foreground",
}: {
  rating?: RatingSummary;
  className?: string;
}) {
  if (!rating || rating.count === 0) {
    return <span className={cn("text-xs", className)}>No ratings yet</span>;
  }
  return (
    <span className={cn("flex items-center gap-1 text-xs", className)}>
      <Star className="w-3.5 h-3.5 fill-primary text-primary flex-shrink-0" />
      <span className="font-semibold">{rating.average.toFixed(1)}</span>
      <span className="opacity-70">({rating.count})</span>
    </span>
  );
}
