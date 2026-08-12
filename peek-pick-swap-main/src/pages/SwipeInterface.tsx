import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  X,
  Heart,
  MapPin,
  Info,
  Zap,
  RefreshCcw,
  Package,
  User,
  PlusCircle,
  Loader2,
  PartyPopper,
  Flag,
  MoonStar,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api, getToken, ApiError } from "@/lib/api";
import { useMe } from "@/hooks/useAuth";
import { CATEGORIES, CONDITIONS, labelFor } from "@/lib/categories";
import { DEMO_ITEMS } from "@/lib/demoItems";
import MatchScreen from "@/components/MatchScreen";
import BottomNav from "@/components/BottomNav";
import Wordmark from "@/components/Wordmark";
import ItemVisual from "@/components/ItemVisual";
import ReportDialog from "@/components/ReportDialog";
import { RatingStars } from "@/components/RatingDialog";
import { pushSupported, isPushEnabled, enablePush } from "@/lib/push";
import type { Item, MatchOtherUser, SwipeResult } from "@/lib/types";

const PUSH_PROMPT_DISMISSED_KEY = "peekpick_push_prompt_dismissed";

interface MatchData {
  myItem: Item;
  theirItem: Item;
  otherUser: MatchOtherUser;
  conversationId: string;
}

type SwipeDirection = "left" | "right" | "super";

export default function SwipeInterface() {
  const navigate = useNavigate();
  const authed = !!getToken();

  const { data: me } = useMe();

  // TODO(dev): /api/discovery currently requires auth, so it's only queried
  // when logged in. Logged-out visitors browse the static DEMO_ITEMS deck
  // below (see decisions doc: "browse first, gate on action"). Once the API
  // supports unauthenticated discovery, drop the `authed` gate and the
  // DEMO_ITEMS fallback and always use live data.
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<{ items: Item[] }>({
    queryKey: ["discovery"],
    queryFn: () => api.get<{ items: Item[] }>("/api/discovery"),
    refetchOnWindowFocus: false,
    enabled: authed,
  });
  const items = authed ? data?.items ?? [] : DEMO_ITEMS;
  const loading = authed && isLoading;
  const errored = authed && isError;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeAnim, setSwipeAnim] = useState<"left" | "right" | null>(null);
  const [showMatch, setShowMatch] = useState(false);
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [expandInfo, setExpandInfo] = useState(false);
  const [superSwapsLeft, setSuperSwapsLeft] = useState(3);
  const [reportOpen, setReportOpen] = useState(false);
  const [swipesRemaining, setSwipesRemaining] = useState<number | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const dragStartX = useRef(0);

  useEffect(() => {
    if (authed && me && typeof me.swipesRemaining === "number") {
      setSwipesRemaining(me.swipesRemaining);
      if (me.swipesRemaining <= 0) setLimitReached(true);
    }
  }, [authed, me]);

  const currentItem = items[currentIndex];
  const nextItem = items[currentIndex + 1];

  const swipeLikeThreshold = 80;
  const rotation = Math.min(Math.max(dragX / 15, -12), 12);

  const handleSwipe = (direction: SwipeDirection) => {
    if (!currentItem || swipeAnim) return;

    const isPositive = direction === "right" || direction === "super";

    // Gate: right-swipe / super-swap requires an account. Pass is free.
    // TODO(dev): swap this redirect-to-login for whatever gated-action UX
    // product settles on (inline modal / bottom sheet), if a hard redirect
    // feels too abrupt. The gating point is intentionally isolated here.
    if (isPositive && !authed) {
      setExpandInfo(false);
      setSwipeAnim(direction === "super" ? "right" : direction);
      window.setTimeout(() => {
        toast.info("Create a free account to start trading");
        navigate("/login");
      }, 300);
      return;
    }

    setExpandInfo(false);
    setSwipeAnim(direction === "super" ? "right" : direction);

    if (!authed) {
      // Logged-out pass: advance the local demo deck only, no API call.
      window.setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        setSwipeAnim(null);
        setDragX(0);
      }, 300);
      return;
    }

    const swipePromise = api
      .post<SwipeResult>("/api/swipes", { itemId: currentItem.id, direction })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 429) {
          const data = err.data as { swipesRemaining?: number; limitReached?: boolean } | null;
          return { matched: false, swipesRemaining: data?.swipesRemaining ?? 0, limitReached: true } as SwipeResult;
        }
        toast.error(err instanceof Error ? err.message : "Couldn't record swipe");
        return { matched: false } as SwipeResult;
      });

    setTimeout(async () => {
      const result = await swipePromise;
      if (typeof result.swipesRemaining === "number") setSwipesRemaining(result.swipesRemaining);

      if (result.limitReached) {
        setLimitReached(true);
        setSwipeAnim(null);
        setDragX(0);
        return;
      }

      if (result.matched && result.myItem && result.theirItem && result.otherUser && result.conversationId) {
        setMatchData({
          myItem: result.myItem,
          theirItem: result.theirItem,
          otherUser: result.otherUser,
          conversationId: result.conversationId,
        });
        setShowMatch(true);
        maybePromptPush();
      }
      setCurrentIndex((i) => i + 1);
      setSwipeAnim(null);
      setDragX(0);
    }, 300);
  };

  const maybePromptPush = async () => {
    if (localStorage.getItem(PUSH_PROMPT_DISMISSED_KEY)) return;
    if (!pushSupported()) return;
    if (await isPushEnabled()) return;
    localStorage.setItem(PUSH_PROMPT_DISMISSED_KEY, "1");
    toast("Get notified about matches and messages?", {
      duration: 8000,
      action: {
        label: "Enable",
        onClick: async () => {
          const ok = await enablePush();
          toast[ok ? "success" : "error"](ok ? "Push notifications enabled" : "Couldn't enable push notifications");
        },
      },
    });
  };

  const handleSuperSwap = () => {
    if (superSwapsLeft > 0 && !swipeAnim) {
      setSuperSwapsLeft((n) => n - 1);
      handleSwipe("super");
    }
  };

  const handleReportClick = () => {
    if (!authed) {
      toast.info("Create a free account to report items");
      navigate("/login");
      return;
    }
    setReportOpen(true);
  };

  const handleStartOver = async () => {
    setCurrentIndex(0);
    if (authed) await refetch();
  };

  // Keyboard support: arrow keys mirror the pass/want buttons.
  useEffect(() => {
    if (showMatch) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleSwipe("right");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleSwipe("left");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItem, swipeAnim, authed, showMatch]);

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
    <div className="min-h-dvh bg-background flex flex-col max-w-md mx-auto">
      {/* Top bar: avatar (left) + wordmark, minimal by design */}
      <header className="flex items-center gap-3 px-5 py-4">
        <button
          onClick={() => navigate(authed ? "/profile" : "/login")}
          aria-label={authed ? "Your profile" : "Sign in"}
          className="w-11 h-11 rounded-full overflow-hidden bg-surface-elevated border border-border flex items-center justify-center flex-shrink-0 hover:border-primary/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {authed && me?.user.avatarUrl ? (
            <img src={me.user.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-foreground/60" />
          )}
        </button>

        <Wordmark />
      </header>

      {/* Compact pitch strip — logged-out orientation only, single line */}
      {!authed && (
        <div className="mx-5 mb-3 rounded-2xl border border-border bg-surface-elevated px-4 py-2.5">
          <p className="text-xs text-muted-foreground leading-snug">
            Browsing as a guest — no money, just swap.{" "}
            <button onClick={() => navigate("/signup")} className="font-semibold text-primary hover:underline">
              Sign up
            </button>{" "}
            to trade and chat.
          </p>
        </div>
      )}

      {/* Card stack area */}
      <div className="flex-1 flex flex-col items-center px-5 pb-4">
        {loading ? (
          <div className="w-full flex-1 flex items-center justify-center" style={{ height: "460px" }}>
            <Loader2 className="w-8 h-8 text-primary animate-spin" aria-label="Loading items" />
          </div>
        ) : errored ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <p className="text-muted-foreground">{error instanceof Error ? error.message : "Couldn't load items"}</p>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 bg-surface-elevated border border-primary/40 text-primary font-bold px-6 py-3 rounded-full hover:bg-primary hover:text-primary-foreground transition-all min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <RefreshCcw className={isFetching ? "w-4 h-4 animate-spin" : "w-4 h-4"} /> Try again
            </button>
          </div>
        ) : authed && limitReached ? (
          /* Daily swipe limit reached — keep the user oriented instead of an empty deck */
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
            <MoonStar className="w-16 h-16 text-primary animate-float" aria-hidden="true" />
            <div>
              <h2 className="text-2xl font-black mb-2">You're out of swipes for today</h2>
              <p className="text-muted-foreground">Come back tomorrow for a fresh deck.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => navigate("/matches")}
                className="flex items-center gap-2 bg-surface-elevated border border-primary/40 text-primary font-bold px-6 py-3 rounded-full hover:bg-primary hover:text-primary-foreground transition-all min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <MessageCircle className="w-4 h-4" /> View matches
              </button>
              <button
                onClick={() => navigate("/add-item")}
                className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-full shadow-green hover:bg-primary-glow transition-all min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <PlusCircle className="w-4 h-4" /> List an item
              </button>
            </div>
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
                  "absolute inset-0 rounded-[20px] overflow-hidden border-2 cursor-grab active:cursor-grabbing select-none shadow-card",
                  swipeAnim === "right" ? "animate-swipe-right" : "",
                  swipeAnim === "left" ? "animate-swipe-left" : "",
                  dragX > swipeLikeThreshold ? "border-swipe-like" : "",
                  dragX < -swipeLikeThreshold ? "border-swipe-pass" : "",
                  Math.abs(dragX) <= swipeLikeThreshold ? "border-transparent" : ""
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
                {/* Photo or gradient+icon placeholder */}
                <div className="absolute inset-0">
                  <ItemVisual
                    category={currentItem.category}
                    index={currentIndex}
                    photoUrl={currentItem.photoUrls[0]}
                    alt={currentItem.title}
                  />
                </div>

                {/* Report item (subtle, top-right, above drag surface) */}
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReportClick();
                  }}
                  aria-label="Report item"
                  className="absolute top-3 right-3 z-10 w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/90 hover:text-white hover:bg-black/60 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  style={{ opacity: isDragging ? 0 : 1 }}
                >
                  <Flag className="w-4 h-4" />
                </button>

                {/* Like / Pass overlays (icons, never emoji) */}
                <div
                  className="absolute top-8 left-6 z-20 flex items-center gap-1.5 bg-primary/90 text-primary-foreground font-black text-lg px-4 py-2 rounded-xl border-2 border-primary rotate-[-15deg] transition-opacity duration-100"
                  style={{ opacity: dragX > 20 ? Math.min((dragX - 20) / 60, 1) : 0 }}
                >
                  <Heart className="w-4 h-4 fill-current" /> WANT
                </div>
                <div
                  className="absolute top-8 right-6 z-20 flex items-center gap-1.5 bg-destructive/90 text-destructive-foreground font-black text-lg px-4 py-2 rounded-xl border-2 border-destructive rotate-[15deg] transition-opacity duration-100"
                  style={{ opacity: dragX < -20 ? Math.min((-dragX - 20) / 60, 1) : 0 }}
                >
                  <X className="w-4 h-4" /> PASS
                </div>

                {/* Scrim spans the whole card so white type clears AA over any
                    photo, not just over the info block's own height. */}
                <div className="absolute inset-0 bg-gradient-card pointer-events-none" />

                {/* Glass pills, top corners */}
                <div className="absolute top-3 left-3 right-16 flex items-start gap-2 pointer-events-none">
                  <span className="glass-pill text-[11px] font-bold leading-none">
                    {labelFor(CATEGORIES, currentItem.category)}
                  </span>
                  <span className="glass-pill text-[11px] font-semibold leading-none">
                    {labelFor(CONDITIONS, currentItem.condition)}
                  </span>
                </div>

                {/* Item info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h2 className="text-[30px] leading-[1.1] font-bold text-white text-display mb-2">
                    {currentItem.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
                    <span className="flex items-center gap-1.5 min-w-0">
                      {currentItem.owner.avatarUrl ? (
                        <img src={currentItem.owner.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <User className="w-4 h-4 text-white/80 flex-shrink-0" aria-hidden="true" />
                      )}
                      <span className="text-sm font-semibold text-white truncate">{currentItem.owner.name}</span>
                    </span>
                    <RatingStars rating={currentItem.owner.rating} className="text-white/80" />
                    {currentItem.owner.location && (
                      <span className="flex items-center gap-1 text-xs text-white/80 min-w-0">
                        <MapPin className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                        <span className="truncate">{currentItem.owner.location}</span>
                      </span>
                    )}
                  </div>

                  {currentItem.wants.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      <span className="text-[11px] uppercase tracking-wider text-white/70 font-semibold">Wants</span>
                      {currentItem.wants.map((w) => (
                        <span key={w} className="text-[11px] bg-white/20 rounded-full px-2.5 py-1 text-white font-medium leading-none">
                          {labelFor(CATEGORIES, w)}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Raised white card for the item's own words — the reference
                      uses this treatment to lift one human detail off the image. */}
                  {currentItem.description && (
                    <div className="bg-surface-elevated rounded-[14px] px-4 py-3 shadow-elevated">
                      <p className="text-eyebrow mb-1">About this item</p>
                      <p
                        className={cn(
                          "text-[13px] leading-[1.45] text-foreground",
                          !expandInfo && "line-clamp-2"
                        )}
                      >
                        {currentItem.description}
                      </p>
                      {currentItem.description.length > 90 && (
                        <button
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandInfo(!expandInfo);
                          }}
                          aria-expanded={expandInfo}
                          className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                        >
                          <Info className="w-3 h-3" aria-hidden="true" />
                          {expandInfo ? "Show less" : "Read more"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            {/* Floating white circular actions — the reference's interaction
                vocabulary: one surface (white), colour carried by the glyph,
                size encoding priority (64 primary / 56 accent / 50 utility). */}
            <div role="group" aria-label="Swipe actions" className="flex items-center justify-center gap-4 mt-6 w-full">
              {/* Pass */}
              <button
                onClick={() => handleSwipe("left")}
                aria-label="Pass"
                className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center shadow-float hover:-translate-y-0.5 active:scale-95 motion-reduce:transform-none transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <X className="w-7 h-7 text-swipe-pass" strokeWidth={2.5} />
              </button>

              {/* Super Swap */}
              <button
                onClick={handleSuperSwap}
                disabled={superSwapsLeft === 0}
                aria-label="Super swap"
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  superSwapsLeft > 0
                    ? "bg-surface-elevated shadow-float hover:-translate-y-0.5 active:scale-95 motion-reduce:transform-none"
                    : "bg-muted opacity-50 cursor-not-allowed"
                )}
              >
                <Zap className="w-6 h-6 text-swipe-super" strokeWidth={2.5} />
              </button>

              {/* Want */}
              <button
                onClick={() => handleSwipe("right")}
                aria-label="Want to trade"
                className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center shadow-float hover:-translate-y-0.5 active:scale-95 motion-reduce:transform-none transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Heart className="w-7 h-7 text-swipe-like fill-swipe-like" />
              </button>
            </div>

            {/* Super swap count */}
            <div className="mt-4 text-xs text-muted-foreground text-center">
              <span className="text-swipe-super font-bold">{superSwapsLeft}</span> Super Swaps remaining today
            </div>
            {authed && swipesRemaining !== null && (
              <div
                className={cn(
                  "mt-1 text-xs text-center",
                  swipesRemaining <= 5 ? "text-destructive font-semibold" : "text-muted-foreground"
                )}
              >
                {swipesRemaining} swipes left today
              </div>
            )}

            {/* Stack counter */}
            <div className="mt-2 flex gap-1.5">
              {items.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    i === currentIndex ? "w-6 bg-primary" : i < currentIndex ? "w-3 bg-surface-hover" : "w-3 bg-border"
                  )}
                />
              ))}
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
            {items.length === 0 ? (
              <Package className="w-16 h-16 text-muted-foreground animate-float" aria-hidden="true" />
            ) : (
              <PartyPopper className="w-16 h-16 text-primary animate-float" aria-hidden="true" />
            )}
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
                className="flex items-center gap-2 bg-surface-elevated border border-primary/40 text-primary font-bold px-6 py-3 rounded-full hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-50 min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />} Start Over
              </button>
              <button
                onClick={() => navigate(authed ? "/add-item" : "/login")}
                className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-full shadow-green hover:bg-primary-glow transition-all min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <PlusCircle className="w-4 h-4" /> List an item
              </button>
            </div>
          </div>
        )}
      </div>

      {currentItem && (
        <ReportDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          targetType="item"
          targetId={currentItem.id}
          title={`Report ${currentItem.title}`}
        />
      )}

      <BottomNav />
    </div>
  );
}
