import { useEffect, useRef, useState, FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Send, Loader2, X, Package, ShieldAlert } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useMe } from "@/hooks/useAuth";
import type { Match, Message, Passport, Trade } from "@/lib/types";

const POLL_INTERVAL_MS = 4000;

export default function Chat() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { data: me } = useMe();

  const { data: matchesData } = useQuery<{ matches: Match[] }>({
    queryKey: ["matches"],
    queryFn: () => api.get<{ matches: Match[] }>("/api/matches"),
  });
  const match = matchesData?.matches.find((m) => String(m.conversationId) === conversationId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

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

    fetchMessages();
    const interval = setInterval(() => fetchMessages(lastIdRef.current), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

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

  const handleComplete = async () => {
    if (!match) return;
    setCompleting(true);
    try {
      const data = await api.post<{ trade: Trade; passport: Passport }>(`/api/trades/${match.trade.id}/complete`);
      toast.success(`Trade complete! You've saved ${data.passport.co2SavedKg}kg CO₂ so far.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't complete trade");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <button
          onClick={() => navigate("/matches")}
          aria-label="Back to matches"
          className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center hover:bg-surface-hover transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-black truncate">{match?.otherUser.name ?? "Chat"}</p>
          {match && (
            <p className="text-xs text-muted-foreground truncate">
              {match.theirItem.title} ⇄ {match.myItem.title}
            </p>
          )}
        </div>

        {match && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                disabled={completing}
                className="text-xs font-bold text-primary bg-primary/10 border border-primary/30 rounded-full px-3 py-2 hover:bg-primary/20 transition-colors disabled:opacity-50 min-h-11 flex-shrink-0"
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
      </div>

      {/* Safety banner */}
      {!bannerDismissed && (
        <div className="flex items-start gap-2 px-4 py-2.5 bg-swipe-super/10 border-b border-swipe-super/20 text-xs text-foreground/90">
          <ShieldAlert className="w-4 h-4 text-swipe-super flex-shrink-0 mt-0.5" />
          <p className="flex-1">Meet in public places. Never send money.</p>
          <button
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss safety reminder"
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
        {loadingHistory ? (
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className={cn("h-10 rounded-2xl bg-surface-elevated animate-pulse", i % 2 ? "w-1/2 ml-auto" : "w-2/3")} />
            ))}
          </div>
        ) : historyError ? (
          <p className="text-center text-sm text-muted-foreground pt-10">{historyError}</p>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center gap-2 pt-16">
            <Package className="w-10 h-10 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">No messages yet. Say hi and plan your swap!</p>
          </div>
        ) : (
          messages.map((m) => {
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
          className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
}
