import { useState } from "react";
import { MessageCircle, X, Share2, Package, ArrowLeftRight } from "lucide-react";

interface MatchItem {
  title: string;
  photoUrl?: string;
}

interface MatchScreenProps {
  myItem: MatchItem;
  theirItem: MatchItem & { owner: string };
  onContinue: () => void;
  onMessage: () => void;
}

function ItemVisual({ photoUrl, title }: MatchItem) {
  if (photoUrl) {
    return <img src={photoUrl} alt={title} className="w-16 h-16 rounded-xl object-cover" />;
  }
  return (
    <div className="w-16 h-16 rounded-xl bg-surface flex items-center justify-center">
      <Package className="w-7 h-7 text-muted-foreground" />
    </div>
  );
}

export default function MatchScreen({ myItem, theirItem, onContinue, onMessage }: MatchScreenProps) {
  const [visible] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />
      
      {/* Confetti particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-bounce"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor: i % 3 === 0 ? "hsl(var(--primary))" : i % 3 === 1 ? "hsl(var(--secondary))" : "hsl(var(--swipe-super))",
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${1 + Math.random() * 2}s`,
            opacity: 0.6,
          }}
        />
      ))}

      {/* Close button */}
      <button
        onClick={onContinue}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="relative z-10 flex flex-col items-center text-center px-8 max-w-sm mx-auto">
        {/* Match badge */}
        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-6 shadow-green animate-bounce-in">
          <ArrowLeftRight className="w-9 h-9 text-primary-foreground" />
        </div>

        <h1 className="text-5xl font-black mb-2 gradient-text animate-match-pop">
          It's a Trade!
        </h1>
        <p className="text-muted-foreground mb-10 text-lg">
          You and <span className="text-foreground font-bold">{theirItem.owner}</span> both want to swap!
        </p>

        {/* Items side by side */}
        <div className="flex items-center gap-4 mb-10 w-full">
          {/* My item */}
          <div className="flex-1 bg-surface-elevated border-2 border-primary/40 rounded-2xl p-5 flex flex-col items-center gap-3 animate-bounce-in shadow-green">
            <ItemVisual photoUrl={myItem.photoUrl} title={myItem.title} />
            <div className="text-sm font-bold text-center leading-tight">{myItem.title}</div>
            <div className="text-xs text-muted-foreground">Your item</div>
          </div>

          {/* Exchange icon */}
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-green animate-pulse">
            <ArrowLeftRight className="w-5 h-5 text-primary-foreground" />
          </div>

          {/* Their item */}
          <div className="flex-1 bg-surface-elevated border-2 border-primary/40 rounded-2xl p-5 flex flex-col items-center gap-3 animate-bounce-in shadow-green" style={{ animationDelay: "0.1s" }}>
            <ItemVisual photoUrl={theirItem.photoUrl} title={theirItem.title} />
            <div className="text-sm font-bold text-center leading-tight">{theirItem.title}</div>
            <div className="text-xs text-muted-foreground">Their item</div>
          </div>
        </div>

        {/* Trade status */}
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8 text-sm">
          <span className="w-2 h-2 rounded-full bg-primary pulse-green" />
          <span className="text-primary font-semibold">Trade request sent to {theirItem.owner}</span>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onMessage}
            className="flex items-center justify-center gap-3 bg-primary text-primary-foreground font-bold py-4 rounded-full shadow-green hover:bg-primary-glow hover:scale-[1.02] transition-all duration-200"
          >
            <MessageCircle className="w-5 h-5" />
            Message {theirItem.owner}
          </button>
          <button
            onClick={onContinue}
            className="flex items-center justify-center gap-3 bg-surface-elevated border border-border text-foreground font-bold py-4 rounded-full hover:border-primary/40 transition-all duration-200"
          >
            Keep Swiping
          </button>
        </div>

        {/* Share */}
        <button className="mt-4 flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground transition-colors">
          <Share2 className="w-4 h-4" />
          Share this trade
        </button>
      </div>
    </div>
  );
}
