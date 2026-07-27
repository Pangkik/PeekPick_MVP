import { useEffect, useRef, useState, FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Send,
  Loader2,
  X,
  Package,
  ShieldAlert,
  ArrowLeftRight,
  MoreVertical,
  Flag,
  UserX,
  HandCoins,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ReportDialog from "@/components/ReportDialog";
import RatingDialog from "@/components/RatingDialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useMe } from "@/hooks/useAuth";
import type { Match, Message, Offer, Passport, Trade, Item } from "@/lib/types";

const POLL_INTERVAL_MS = 4000;

type TimelineEntry = { kind: "message"; createdAt: string; message: Message } | { kind: "offer"; createdAt: string; offer: Offer };

function OfferCard({
  offer,
  mine,
  otherName,
  onAccept,
  onDecline,
  acting,
}: {
  offer: Offer;
  mine: boolean;
  otherName: string;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  acting: boolean;
}) {
  return (
    <div className="flex justify-center px-1">
      <div className="w-full max-w-[90%] rounded-2xl border-2 border-primary/30 bg-surface-elevated p-3.5 space-y-2.5 shadow-elevated">
        <div className="flex items-center gap-1.5 text-xs font-black text-primary">
          <HandCoins className="w-3.5 h-3.5" /> {mine ? "Your offer" : `${otherName}'s offer`}
        </div>

        {offer.offerItem && (
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-hover flex items-center justify-center flex-shrink-0">
              {offer.offerItem.photoUrls[0] ? (
                <img
                  src={offer.offerItem.photoUrls[0]}
                  alt={offer.offerItem.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <span className="text-sm font-semibold truncate">{offer.offerItem.title}</span>
          </div>
        )}

        {offer.cashAmount > 0 && (
          <p className="text-sm font-black text-primary">+₱{offer.cashAmount.toLocaleString()}</p>
        )}

        {offer.note && <p className="text-sm text-foreground/80 leading-relaxed">{offer.note}</p>}

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span
            className={cn(
              "text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 font-bold flex-shrink-0",
              offer.status === "accepted"
                ? "bg-primary/10 text-primary border border-primary/30"
                : offer.status === "declined"
                ? "bg-muted text-muted-foreground border border-border"
                : "bg-swipe-super/10 text-swipe-super border border-swipe-super/30"
            )}
          >
            {offer.status}
          </span>

          {offer.status === "pending" && !mine && (
            <div className="flex gap-2">
              <button
                onClick={() => onDecline(offer.id)}
                disabled={acting}
                className="text-xs font-bold px-3 min-h-11 rounded-full bg-surface border border-border hover:bg-surface-hover transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Decline
              </button>
              <button
                onClick={() => onAccept(offer.id)}
                disabled={acting}
                className="text-xs font-bold px-3 min-h-11 rounded-full bg-primary text-primary-foreground hover:bg-primary-glow transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Accept
              </button>
            </div>
          )}
          {offer.status === "pending" && mine && (
            <span className="text-xs text-muted-foreground">Waiting for {otherName} to respond</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: me } = useMe();

  const { data: matchesData } = useQuery<{ matches: Match[] }>({
    queryKey: ["matches"],
    queryFn: () => api.get<{ matches: Match[] }>("/api/matches"),
  });
  const match = matchesData?.matches.find((m) => String(m.conversationId) === conversationId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [actingOfferId, setActingOfferId] = useState<string | null>(null);

  // Offer composer dialog
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [offerItemId, setOfferItemId] = useState<string>("none");
  const [cashAmount, setCashAmount] = useState("");
  const [offerNote, setOfferNote] = useState("");
  const [offerFormError, setOfferFormError] = useState("");
  const [submittingOffer, setSubmittingOffer] = useState(false);

  const { data: myItemsData } = useQuery<{ items: Item[] }>({
    queryKey: ["items", "mine"],
    queryFn: () => api.get<{ items: Item[] }>("/api/items/mine"),
    enabled: offerDialogOpen,
  });
  const myAvailableItems = (myItemsData?.items ?? []).filter((i) => i.available);

  const lastIdRef = useRef<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;

    async function fetchMessages(after?: string) {
      try {
        const query = after ? `?after=${encodeURIComponent(after)}` : "";
        const data = await api.get<{ messages: Message[] }>(`/api/conversations/${conversationId}/messages${query}`);
        if (cancelled) return;
        if (data.messages.length > 0) {
          setMessages((prev) => (after ? [...prev, ...data.messages] : data.messages));
          lastIdRef.current = data.messages[data.messages.length - 1].id;
        }
        setHistoryError("");
      } catch (err) {
        if (!cancelled && !after) {
          setHistoryError(err instanceof Error ? err.message : "Couldn't load messages");
        }
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    }

    async function fetchOffers() {
      try {
        const data = await api.get<{ offers: Offer[] }>(`/api/conversations/${conversationId}/offers`);
        if (!cancelled) setOffers(data.offers);
      } catch {
        // offers are secondary to the message thread — a transient failure here shouldn't crash the chat
      }
    }

    fetchMessages();
    fetchOffers();
    const interval = setInterval(() => {
      fetchMessages(lastIdRef.current);
      fetchOffers();
    }, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, offers]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !conversationId) return;
    setSending(true);
    try {
      const data = await api.post<{ message: Message }>(`/api/conversations/${conversationId}/messages`, {
        content: content.trim(),
      });
      setMessages((prev) => [...prev, data.message]);
      lastIdRef.current = data.message.id;
      setContent("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send message");
    } finally {
      setSending(false);
    }
  };

  const handleBlock = async () => {
    if (!match) return;
    setBlocking(true);
    try {
      await api.post("/api/blocks", { userId: match.otherUser.id });
      toast.success(`${match.otherUser.name} is blocked`);
      navigate("/matches");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't block user");
    } finally {
      setBlocking(false);
    }
  };

  const handleComplete = async () => {
    if (!match) return;
    setCompleting(true);
    try {
      const data = await api.post<{ trade: Trade; passport: Passport }>(`/api/trades/${match.trade.id}/complete`);
      toast.success(`Trade complete! You've saved ${data.passport.co2SavedKg}kg CO₂ so far.`);
      await queryClient.invalidateQueries({ queryKey: ["matches"] });
      setRatingOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't complete trade");
    } finally {
      setCompleting(false);
    }
  };

  const refreshOffers = async () => {
    if (!conversationId) return;
    try {
      const data = await api.get<{ offers: Offer[] }>(`/api/conversations/${conversationId}/offers`);
      setOffers(data.offers);
    } catch {
      // next poll will pick it up
    }
  };

  const handleSubmitOffer = async (e: FormEvent) => {
    e.preventDefault();
    if (!conversationId) return;
    const trimmedCash = cashAmount.trim();
    const cashNum = trimmedCash ? Number(trimmedCash) : 0;
    if (trimmedCash && (Number.isNaN(cashNum) || cashNum < 0)) {
      setOfferFormError("Enter a valid cash amount");
      return;
    }
    setOfferFormError("");
    setSubmittingOffer(true);
    try {
      await api.post(`/api/conversations/${conversationId}/offers`, {
        offerItemId: offerItemId === "none" ? null : offerItemId,
        cashAmount: cashNum,
        note: offerNote.trim(),
      });
      toast.success("Offer sent");
      setOfferDialogOpen(false);
      setOfferItemId("none");
      setCashAmount("");
      setOfferNote("");
      await refreshOffers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send offer");
    } finally {
      setSubmittingOffer(false);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    setActingOfferId(offerId);
    try {
      await api.post(`/api/offers/${offerId}/accept`);
      toast.success("Offer accepted");
      await refreshOffers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't accept offer");
    } finally {
      setActingOfferId(null);
    }
  };

  const handleDeclineOffer = async (offerId: string) => {
    setActingOfferId(offerId);
    try {
      await api.post(`/api/offers/${offerId}/decline`);
      toast.success("Offer declined");
      await refreshOffers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't decline offer");
    } finally {
      setActingOfferId(null);
    }
  };

  const timeline: TimelineEntry[] = [
    ...messages.map((m) => ({ kind: "message" as const, createdAt: m.createdAt, message: m })),
    ...offers.map((o) => ({ kind: "offer" as const, createdAt: o.createdAt, offer: o })),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div className="min-h-dvh bg-background flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
        <button
          onClick={() => navigate("/matches")}
          aria-label="Back to matches"
          className="w-11 h-11 rounded-full bg-surface-elevated border border-border flex items-center justify-center hover:bg-surface-hover transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-black truncate">{match?.otherUser.name ?? "Chat"}</p>
          {match && (
            <p className="text-xs text-muted-foreground truncate">
              {match.theirItem.title} <ArrowLeftRight className="w-3 h-3 inline mx-1" aria-hidden="true" /> {match.myItem.title}
            </p>
          )}
        </div>

        {match && (
          <button
            onClick={() => setOfferDialogOpen(true)}
            className="text-xs font-bold text-primary bg-primary/10 border border-primary/30 rounded-full px-3 py-2 hover:bg-primary/20 transition-colors min-h-11 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Make an offer
          </button>
        )}

        {match && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                disabled={completing}
                className="text-xs font-bold text-primary bg-primary/10 border border-primary/30 rounded-full px-3 py-2 hover:bg-primary/20 transition-colors disabled:opacity-50 min-h-11 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mark complete"}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Mark this trade as complete?</AlertDialogTitle>
                <AlertDialogDescription>
                  Confirm only after you've both exchanged items in person. This updates your PeekPick Passport.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleComplete}>Confirm trade</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {match && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Chat options"
                className="w-11 h-11 rounded-full bg-surface-elevated border border-border flex items-center justify-center hover:bg-surface-hover transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setReportOpen(true)}>
                <Flag className="w-4 h-4 mr-2" /> Report user
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setBlockOpen(true)} className="text-destructive focus:text-destructive">
                <UserX className="w-4 h-4 mr-2" /> Block user
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {match && (
        <>
          <AlertDialog open={blockOpen} onOpenChange={setBlockOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Block {match.otherUser.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  They won't be able to message you and this conversation will be hidden. This can't be undone from
                  here.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleBlock}
                  disabled={blocking}
                  className={cn(buttonVariants({ variant: "destructive" }))}
                >
                  {blocking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Block"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <ReportDialog
            open={reportOpen}
            onOpenChange={setReportOpen}
            targetType="user"
            targetId={match.otherUser.id}
            title={`Report ${match.otherUser.name}`}
          />
          <RatingDialog
            open={ratingOpen}
            onOpenChange={setRatingOpen}
            tradeId={match.trade.id}
            otherUserName={match.otherUser.name}
            onRated={() => queryClient.invalidateQueries({ queryKey: ["matches"] })}
          />

          {/* Make an offer dialog */}
          <Dialog
            open={offerDialogOpen}
            onOpenChange={(next) => {
              setOfferDialogOpen(next);
              if (!next) {
                setOfferItemId("none");
                setCashAmount("");
                setOfferNote("");
                setOfferFormError("");
              }
            }}
          >
            <DialogContent className="max-w-sm rounded-3xl">
              <DialogHeader>
                <DialogTitle>Make an offer to {match.otherUser.name}</DialogTitle>
                <DialogDescription>Sweeten the swap with a different item, some cash, or both.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitOffer} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="offer-item">Swap a different item instead (optional)</Label>
                  <Select value={offerItemId} onValueChange={setOfferItemId}>
                    <SelectTrigger id="offer-item">
                      <SelectValue placeholder="Keep my current item" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Keep my current item</SelectItem>
                      {myAvailableItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="offer-cash">Add cash (₱, optional)</Label>
                  <input
                    id="offer-cash"
                    type="number"
                    min="0"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    placeholder="0"
                    aria-invalid={!!offerFormError}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Barter is the heart of PeekPick — cash is just a sweetener.
                  </p>
                  {offerFormError && (
                    <p role="alert" className="text-sm text-destructive">
                      {offerFormError}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="offer-note">Note (optional)</Label>
                  <Textarea
                    id="offer-note"
                    value={offerNote}
                    onChange={(e) => setOfferNote(e.target.value)}
                    rows={3}
                    placeholder="Any details about the offer?"
                  />
                </div>

                <DialogFooter>
                  <DialogClose asChild>
                    <button type="button" className={cn(buttonVariants({ variant: "outline" }), "min-h-11")}>
                      Cancel
                    </button>
                  </DialogClose>
                  <button type="submit" disabled={submittingOffer} className={cn(buttonVariants(), "min-h-11")}>
                    {submittingOffer && <Loader2 className="w-4 h-4 animate-spin" />}
                    Send offer
                  </button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* Safety banner */}
      {!bannerDismissed && (
        <div className="flex items-center gap-2 pl-4 pr-2 py-1 bg-swipe-super/10 border-b border-swipe-super/20 text-xs text-foreground/90">
          <ShieldAlert className="w-4 h-4 text-swipe-super flex-shrink-0" />
          <p className="flex-1">Meet in public places. Never send money.</p>
          <button
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss safety reminder"
            className="min-w-11 min-h-11 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Messages + offers */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
        {loadingHistory ? (
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className={cn("h-10 rounded-2xl bg-surface-elevated animate-pulse", i % 2 ? "w-1/2 ml-auto" : "w-2/3")} />
            ))}
          </div>
        ) : historyError ? (
          <p className="text-center text-sm text-muted-foreground pt-10">{historyError}</p>
        ) : timeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center gap-2 pt-16">
            <Package className="w-10 h-10 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">No messages yet. Say hi and plan your swap!</p>
          </div>
        ) : (
          timeline.map((entry) => {
            if (entry.kind === "offer") {
              return (
                <OfferCard
                  key={`offer-${entry.offer.id}`}
                  offer={entry.offer}
                  mine={entry.offer.fromUserId === me?.user.id}
                  otherName={match?.otherUser.name ?? "them"}
                  onAccept={handleAcceptOffer}
                  onDecline={handleDeclineOffer}
                  acting={actingOfferId === entry.offer.id}
                />
              );
            }
            const m = entry.message;
            const mine = m.senderId === me?.user.id;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    mine
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-surface-elevated border border-border rounded-bl-sm"
                  )}
                >
                  {m.content}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t border-border">
        <label htmlFor="chat-message" className="sr-only">
          Message
        </label>
        <input
          id="chat-message"
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 h-11 rounded-full bg-surface-elevated border border-border px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          disabled={sending || !content.trim()}
          aria-label="Send message"
          className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
}
