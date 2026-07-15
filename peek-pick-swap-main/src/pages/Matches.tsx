import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Package, RefreshCcw, ArrowLeftRight } from "lucide-react";
import { api } from "@/lib/api";
import type { Match } from "@/lib/types";
import BottomNav from "@/components/BottomNav";

function ItemThumb({ photoUrl, alt }: { photoUrl?: string; alt: string }) {
  if (photoUrl) {
    return <img src={photoUrl} alt={alt} className="w-full h-full object-cover" />;
  }
  return (
    <div className="w-full h-full flex items-center justify-center bg-surface-hover">
      <Package className="w-6 h-6 text-muted-foreground" />
    </div>
  );
}

export default function Matches() {
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<{ matches: Match[] }>({
    queryKey: ["matches"],
    queryFn: () => api.get<{ matches: Match[] }>("/api/matches"),
  });

  const matches = data?.matches ?? [];

  return (
    <div className="min-h-dvh bg-background flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-black text-primary-foreground">P</div>
          <span className="font-black">Matches</span>
        </div>
      </div>

      <div className="flex-1 px-5 pb-4 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3 pt-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-surface-elevated animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center text-center gap-4 pt-20">
            <p className="text-muted-foreground">{error instanceof Error ? error.message : "Couldn't load matches"}</p>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 bg-surface-elevated border border-primary/40 text-primary font-bold px-6 py-3 rounded-full hover:bg-primary hover:text-primary-foreground transition-all min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <RefreshCcw className={isFetching ? "w-4 h-4 animate-spin" : "w-4 h-4"} /> Try again
            </button>
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center gap-4 pt-20">
            <ArrowLeftRight className="w-14 h-14 text-muted-foreground" />
            <div>
              <h2 className="text-xl font-black mb-1">No matches yet</h2>
              <p className="text-muted-foreground text-sm">Keep swiping to find your next trade.</p>
            </div>
            <button
              onClick={() => navigate("/swipe")}
              className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-full shadow-green hover:bg-primary-glow transition-all min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Keep Swiping
            </button>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {matches.map((m) => (
              <button
                key={m.conversationId}
                onClick={() => navigate(`/chat/${m.conversationId}`)}
                className="w-full flex items-center gap-3 bg-surface-elevated border border-border rounded-2xl p-3 text-left hover:border-primary/40 transition-all min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <div className="flex -space-x-3 flex-shrink-0">
                  <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-surface-elevated relative z-10">
                    <ItemThumb photoUrl={m.theirItem.photoUrls[0]} alt={m.theirItem.title} />
                  </div>
                  <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-surface-elevated">
                    <ItemThumb photoUrl={m.myItem.photoUrls[0]} alt={m.myItem.title} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm truncate">{m.otherUser.name}</span>
                    {m.trade.status && (
                      <span className="text-[10px] uppercase tracking-wide text-primary bg-primary/10 border border-primary/30 rounded-full px-2 py-0.5 flex-shrink-0">
                        {m.trade.status}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {m.theirItem.title} <ArrowLeftRight className="w-3 h-3 inline mx-1" /> {m.myItem.title}
                  </p>
                  <p className="text-sm text-foreground/80 truncate mt-0.5">
                    {m.lastMessage ? m.lastMessage.content : "Say hi and plan your swap!"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
