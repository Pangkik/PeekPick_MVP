import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { X, Heart, MapPin, ChevronLeft, Info, Zap, Search, RefreshCcw, Package, User, PlusCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { CATEGORIES, CONDITIONS } from "@/lib/categories";
import MatchScreen from "@/components/MatchScreen";
import BottomNav from "@/components/BottomNav";
import type { Item, MatchOtherUser, SwipeResult } from "@/lib/types";

const CARD_GRADIENTS = [
  "from-blue-900/40 to-slate-900/40",
  "from-amber-900/40 to-stone-900/40",
  "from-slate-900/40 to-zinc-900/40",
  "from-emerald-900/40 to-teal-900/40",
  "from-violet-900/40 to-purple-900/40",
];

function labelFor(list: { id: string; label: string }[], id: string) {
  return list.find((entry) => entry.id === id)?.label ?? id;
}

interface MatchData {
  myItem: Item;
  theirItem: Item;
  otherUser: MatchOtherUser;
  conversationId: string;
}

type SwipeDirection = "left" | "right" | "super";

export default function SwipeInterface() {
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<{ items: Item[] }>({
    queryKey: ["discovery"],
    queryFn: () => api.get<{ items: Item[] }>("/api/discovery"),
    refetchOnWindowFocus: false,
  });
  const items = data?.items ?? [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeAnim, setSwipeAnim] = useState<"left" | "right" | null>(null);
  const [showMatch, setShowMatch] = useState(false);
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [expandInfo, setExpandInfo] = useState(false);
  const [superSwapsLeft, setSuperSwapsLeft] = useState(3);
  const dragStartX = useRef(0);

  const currentItem = items[currentIndex];
  const nextItem = items[currentIndex + 1];

  const swipeLikeThreshold = 80;
  const rotation = Math.min(Math.max(dragX / 15, -12), 12);

  const handleSwipe = (direction: SwipeDirection) => {
    if (!currentItem || swipeAnim) return;

    setExpandInfo(false);
    setSwipeAnim(direction === "super" ? "right" : direction);

    const swipePromise = api
      .post<SwipeResult>("/api/swipes", { itemId: currentItem.id, direction })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Couldn't record swipe");
        return { matched: false } as SwipeResult;
      });

    setTimeout(async () => {
      const result = await swipePromise;
      if (result.matched && result.myItem && result.theirItem && result.otherUser && result.conversationId) {
        setMatchData({
          myItem: result.myItem,
          theirItem: result.theirItem,
          otherUser: result.otherUser,
          conversationId: result.conversationId,
        });
        setShowMatch(true);
      }
      setCurrentIndex((i) => i + 1);
      setSwipeAnim(null);
      setDragX(0);
    }, 350);
  };

  const handleSuperSwap = () => {
    if (superSwapsLeft > 0 && !swipeAnim) {
      setSuperSwapsLeft((n) => n - 1);
      handleSwipe("super");
    }
  };

  const handleStartOver = async () => {
    setCurrentIndex(0);
    await refetch();
  };

  // Touch/mouse drag handlers
  const onDragStart = (clientX: number) => {
    if (swipeAnim) return;
    dragStartX.current = clientX;
    setIsDragging(true);
  };

  const onDragMove = (clientX: number) => {
    if (!isDragging) return;
    setDragX(clientX - dragStartX.current);
  };

  const onDragEnd = () => {
    setIsDragging(false);
    if (Math.abs(dragX) > swipeLikeThreshold) {
      handleSwipe(dragX > 0 ? "right" : "left");
    } else {
      setDragX(0);
    }
  };

  if (showMatch && matchData) {
    return (
      <MatchScreen
        myItem={{ title: matchData.myItem.title, photoUrl: matchData.myItem.photoUrls[0] }}
        theirItem={{
          title: matchData.theirItem.title,
          photoUrl: matchData.theirItem.photoUrls[0],
          owner: matchData.otherUser.name,
        }}
        onContinue={() => {
          setShowMatch(false);
          setMatchData(null);
        }}
        onMessage={() => {
          const conversationId = matchData.conversationId;
          setShowMatch(false);
          setMatchData(null);
          navigate(`/chat/${conversationId}`);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <button
          onClick={() => navigate("/")}
          aria-label="Back home"
          className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-black text-primary-foreground">P</div>
          <span className="font-black">Discover</span>
        </div>

        <button aria-label="Search" className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center">
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* Card stack area */}
      <div className="flex-1 flex flex-col items-center px-5 pb-4">
        {isLoading ? (
          <div className="w-full flex-1 flex items-center justify-center" style={{ height: "460px" }}>
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <p className="text-muted-foreground">{error instanceof Error ? error.message : "Couldn't load items"}</p>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 bg-surface-elevated border border-primary/40 text-primary font-bold px-6 py-3 rounded-full hover:bg-primary hover:text-primary-foreground transition-all min-h-11"
            >
              <RefreshCcw className={isFetching ? "w-4 h-4 animate-spin" : "w-4 h-4"} /> Try again
            </button>
          </div>
        ) : currentIndex < items.length ? (
          <>
            {/* Card stack */}
            <div className="relative w-full" style={{ height: "460px" }}>
              {/* Back card (next item preview) */}
              {nextItem && (
                <div className="absolute inset-0 rounded-3xl overflow-hidden bg-surface-elevated border border-border scale-[0.95] translate-y-2 opacity-60 pointer-events-none" />
              )}

              {/* Main swipe card */}
              <div
                className={cn(
                  "absolute inset-0 rounded-3xl overflow-hidden border-2 cursor-grab active:cursor-grabbing select-none transition-shadow",
                  swipeAnim === "right" ? "animate-swipe-right" : "",
                  swipeAnim === "left" ? "animate-swipe-left" : "",
                  dragX > swipeLikeThreshold ? "border-swipe-like shadow-green" : "",
                  dragX < -swipeLikeThreshold ? "border-swipe-pass" : "",
                  Math.abs(dragX) <= swipeLikeThreshold ? "border-border" : ""
                )}
                style={{
                  transform: !swipeAnim ? `rotate(${rotation}deg) translateX(${dragX}px)` : undefined,
                  transition: isDragging ? "none" : "transform 0.2s ease-out, border-color 0.15s",
                }}
                onMouseDown={(e) => onDragStart(e.clientX)}
                onMouseMove={(e) => onDragMove(e.clientX)}
                onMouseUp={onDragEnd}
                onMouseLeave={onDragEnd}
                onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
                onTouchMove={(e) => onDragMove(e.touches[0].clientX)}
                onTouchEnd={onDragEnd}
              >
                {/* Item background */}
                <div className={cn("absolute inset-0 bg-gradient-to-br", CARD_GRADIENTS[currentIndex % CARD_GRADIENTS.length])} />
                <div className="absolute inset-0 bg-surface-elevated/60" />

                {/* Photo or fallback icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {currentItem.photoUrls[0] ? (
                    <img
                      src={currentItem.photoUrls[0]}
                      alt={currentItem.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-24 h-24 text-white/30 animate-float" />
                  )}
                </div>

                {/* Like / Pass overlays */}
                <div
                  className="absolute top-8 left-6 bg-swipe-like/90 text-white font-black text-xl px-5 py-2 rounded-xl border-2 border-swipe-like rotate-[-15deg] transition-opacity duration-100"
                  style={{ opacity: dragX > 20 ? Math.min((dragX - 20) / 60, 1) : 0 }}
                >
                  TRADE 💚
                </div>
                <div
                  className="absolute top-8 right-6 bg-swipe-pass/90 text-white font-black text-xl px-5 py-2 rounded-xl border-2 border-swipe-pass rotate-[15deg] transition-opacity duration-100"
                  style={{ opacity: dragX < -20 ? Math.min((-dragX - 20) / 60, 1) : 0 }}
                >
                  PASS ✕
                </div>

                {/* Item info overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-primary bg-primary/15 rounded-full px-3 py-1 border border-primary/30">
                      {labelFor(CATEGORIES, currentItem.category)}
                    </span>
                    <span className="text-xs bg-surface-elevated rounded-full px-3 py-1 text-muted-foreground">
                      {labelFor(CONDITIONS, currentItem.condition)}
                    </span>
                  </div>

                  <h2 className="text-2xl font-black text-white mb-1">{currentItem.title}</h2>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1.5">
                      {currentItem.owner.avatarUrl ? (
                        <img src={currentItem.owner.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-white/70" />
                      )}
                      <span className="text-sm font-semibold text-white/90">{currentItem.owner.name}</span>
                    </div>
                    {currentItem.owner.location && (
                      <div className="flex items-center gap-1 text-xs text-white/60">
                        <MapPin className="w-3 h-3" /> {currentItem.owner.location}
                      </div>
                    )}
                  </div>

                  {currentItem.wants.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs text-white/50">Wants:</span>
                      {currentItem.wants.map((w) => (
                        <span key={w} className="text-xs bg-white/10 rounded-full px-2.5 py-0.5 text-white/80 font-medium">
                          {labelFor(CATEGORIES, w)}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Expand info */}
                  <button
                    onClick={() => setExpandInfo(!expandInfo)}
                    className="mt-3 flex items-center gap-1.5 text-xs text-white/60 hover:text-white/90 transition-colors"
                  >
                    <Info className="w-3.5 h-3.5" />
                    {expandInfo ? "Hide details" : "More info"}
                  </button>

                  {expandInfo && (
                    <p className="text-sm text-white/70 mt-2 leading-relaxed">{currentItem.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-5 mt-6 w-full">
              {/* Pass */}
              <button
                onClick={() => handleSwipe("left")}
                aria-label="Pass"
                className="w-16 h-16 rounded-full bg-surface-elevated border-2 border-swipe-pass/40 flex items-center justify-center hover:bg-swipe-pass/10 hover:border-swipe-pass hover:scale-110 transition-all duration-200 shadow-elevated"
              >
                <X className="w-7 h-7 text-swipe-pass" />
              </button>

              {/* Super Swap */}
              <button
                onClick={handleSuperSwap}
                disabled={superSwapsLeft === 0}
                aria-label="Super swap"
                className={cn(
                  "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                  superSwapsLeft > 0
                    ? "bg-surface-elevated border-swipe-super/40 hover:bg-swipe-super/10 hover:border-swipe-super hover:scale-110 shadow-elevated"
                    : "bg-surface border-border opacity-40 cursor-not-allowed"
                )}
              >
                <Zap className="w-5 h-5 text-swipe-super" />
              </button>

              {/* Like */}
              <button
                onClick={() => handleSwipe("right")}
                aria-label="Trade"
                className="w-16 h-16 rounded-full bg-primary flex items-center justify-center hover:bg-primary-glow hover:scale-110 transition-all duration-200 shadow-green pulse-green"
              >
                <Heart className="w-7 h-7 text-primary-foreground fill-primary-foreground" />
              </button>
            </div>

            {/* Super swap count */}
            <div className="mt-4 text-xs text-muted-foreground text-center">
              <span className="text-swipe-super font-bold">{superSwapsLeft}</span> Super Swaps remaining today
            </div>

            {/* Stack counter */}
            <div className="mt-2 flex gap-1.5">
              {items.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    i === currentIndex ? "w-6 bg-primary" : i < currentIndex ? "w-3 bg-surface-hover" : "w-3 bg-surface-elevated"
                  )}
                />
              ))}
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
            <div className="text-7xl animate-bounce-in">🎉</div>
            <div>
              <h2 className="text-2xl font-black mb-2">
                {items.length === 0 ? "Nothing to discover yet" : "You've seen everything!"}
              </h2>
              <p className="text-muted-foreground">
                {items.length === 0
                  ? "Be the first to list an item, or check back soon."
                  : "New items are added daily. Come back tomorrow for fresh finds!"}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleStartOver}
                disabled={isFetching}
                className="flex items-center gap-2 bg-surface-elevated border border-primary/40 text-primary font-bold px-6 py-3 rounded-full hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-50 min-h-11"
              >
                {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />} Start Over
              </button>
              <button
                onClick={() => navigate("/add-item")}
                className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-full shadow-green hover:bg-primary-glow transition-all min-h-11"
              >
                <PlusCircle className="w-4 h-4" /> List an item
              </button>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
