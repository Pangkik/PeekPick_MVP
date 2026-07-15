import { useNavigate } from "react-router-dom";
import { Heart, Shuffle } from "lucide-react";
import BottomNav from "@/components/BottomNav";

/**
 * TODO(dev): there's no backend endpoint yet for "items I've swiped right
 * on" as distinct from mutual matches (/api/matches already covers mutual
 * matches and powers the "Chat" tab). Wire this page to a real "my likes"
 * endpoint once one exists, and swap the empty state below for a real list
 * (reuse the item-tile pattern from Search.tsx / the swipe card's
 * <ItemVisual> for photos).
 */
export default function Likes() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-background flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4">
        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-black text-primary-foreground">
          P
        </div>
        <span className="font-black">Likes</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-8">
        <div className="w-16 h-16 rounded-full bg-primary-dim flex items-center justify-center">
          <Heart className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-black mb-1">Nothing here yet</h2>
          <p className="text-muted-foreground text-sm">
            Items you swipe right on will show up here. Once someone likes something back, it becomes a match in Chat.
          </p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-full shadow-green hover:bg-primary-glow transition-all min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Shuffle className="w-4 h-4" /> Start swiping
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
