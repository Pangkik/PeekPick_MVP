import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { CATEGORIES, CONDITIONS } from "@/lib/categories";
import Wordmark from "@/components/Wordmark";

const RADIUS_OPTIONS = [
  { id: "neighborhood", label: "Neighborhood", desc: "~5 km" },
  { id: "city", label: "City", desc: "~25 km" },
  { id: "region", label: "Region", desc: "~100 km" },
];

const TRADE_STYLES = [
  { id: "one-for-one", label: "One for One", desc: "Swap single items" },
  { id: "bundle", label: "Bundle Trades", desc: "Multiple items at once" },
  { id: "open", label: "Open to Offers", desc: "Flexible arrangement" },
];

type Step = 1 | 2 | 3;

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [haveCategories, setHaveCategories] = useState<string[]>([]);
  const [wantCategories, setWantCategories] = useState<string[]>([]);
  const [condition, setCondition] = useState<string>("");
  const [radius, setRadius] = useState<string>("city");
  const [tradeStyle, setTradeStyle] = useState<string>("one-for-one");
  const [submitting, setSubmitting] = useState(false);

  const toggleHave = (id: string) => {
    setHaveCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleWant = (id: string) => {
    setWantCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const canProceed = () => {
    if (step === 1) return haveCategories.length >= 3;
    if (step === 2) return wantCategories.length >= 1;
    return true;
  };

  const goNext = async () => {
    if (step === 3) {
      setSubmitting(true);
      try {
        await api.post("/api/me/preferences", {
          haveCategories,
          wantCategories,
          condition,
          radius,
          tradeStyle,
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't save preferences, you can update them later");
      } finally {
        setSubmitting(false);
      }
      navigate("/swipe");
    } else {
      setStep((s) => (s + 1) as Step);
    }
  };

  const stepInfo = {
    1: {
      title: "What do you have to trade?",
      subtitle: "Select at least 3 categories that describe what you'd like to swap away.",
      emoji: "📦",
    },
    2: {
      title: "What are you looking for?",
      subtitle: "Tell us what you'd love to receive in return. More picks = better matches.",
      emoji: "🔍",
    },
    3: {
      title: "Fine-tune your preferences",
      subtitle: "These help us find the most compatible traders near you.",
      emoji: "⚙️",
    },
  }[step];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5">
        <button
          onClick={() => step === 1 ? navigate("/") : setStep((s) => (s - 1) as Step)}
          className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center hover:bg-surface-hover transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <Wordmark size="sm" />

        <button
          onClick={() => navigate("/swipe")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors min-h-11 px-2"
        >
          Skip
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-6 mb-8">
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-500",
                s <= step ? "bg-primary" : "bg-surface-elevated"
              )}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Step {step} of 3</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-32 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="text-4xl mb-3">{stepInfo.emoji}</div>
            <h1 className="text-3xl md:text-4xl font-black mb-3 leading-tight">{stepInfo.title}</h1>
            <p className="text-muted-foreground">{stepInfo.subtitle}</p>
          </div>

          {/* Step 1 & 2 — Category bubbles */}
          {(step === 1 || step === 2) && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {CATEGORIES.map((cat) => {
                  const selected =
                    step === 1
                      ? haveCategories.includes(cat.id)
                      : wantCategories.includes(cat.id);
                  const toggle = step === 1 ? toggleHave : toggleWant;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggle(cat.id)}
                      className={cn(
                        "relative flex items-center gap-3 rounded-2xl p-4 border text-left font-semibold text-sm transition-all duration-200 hover:scale-[1.02]",
                        selected
                          ? "bg-primary border-primary text-primary-foreground shadow-green"
                          : "bg-surface-elevated border-border text-foreground hover:border-primary/50"
                      )}
                    >
                      <span className="text-2xl flex-shrink-0">{cat.icon}</span>
                      <span className="leading-tight">{cat.label}</span>
                      {selected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {step === 1 && (
                <div className={cn(
                  "text-sm font-medium text-center transition-all",
                  haveCategories.length >= 3 ? "text-primary" : "text-muted-foreground"
                )}>
                  {haveCategories.length >= 3
                    ? `✓ ${haveCategories.length} selected — looking good!`
                    : `Select ${3 - haveCategories.length} more to continue`}
                </div>
              )}
            </>
          )}

          {/* Step 3 — Preferences */}
          {step === 3 && (
            <div className="space-y-8">
              {/* Condition */}
              <div>
                <h3 className="font-bold text-lg mb-4">Item Condition</h3>
                <div className="grid grid-cols-2 gap-3">
                  {CONDITIONS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCondition(condition === c.id ? "" : c.id)}
                      className={cn(
                        "rounded-2xl p-4 border text-left transition-all duration-200",
                        condition === c.id
                          ? "bg-primary border-primary text-primary-foreground shadow-green"
                          : "bg-surface-elevated border-border hover:border-primary/40"
                      )}
                    >
                      <div className="font-bold text-sm">{c.label}</div>
                      <div className={cn("text-xs mt-1", condition === c.id ? "text-primary-foreground/70" : "text-muted-foreground")}>{c.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Trade Radius */}
              <div>
                <h3 className="font-bold text-lg mb-4">Trade Radius</h3>
                <div className="grid grid-cols-3 gap-3">
                  {RADIUS_OPTIONS.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setRadius(r.id)}
                      className={cn(
                        "rounded-2xl p-4 border text-center transition-all duration-200",
                        radius === r.id
                          ? "bg-primary border-primary text-primary-foreground shadow-green"
                          : "bg-surface-elevated border-border hover:border-primary/40"
                      )}
                    >
                      <div className="font-bold text-sm">{r.label}</div>
                      <div className={cn("text-xs mt-1", radius === r.id ? "text-primary-foreground/70" : "text-muted-foreground")}>{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Trade Style */}
              <div>
                <h3 className="font-bold text-lg mb-4">Trade Style</h3>
                <div className="space-y-3">
                  {TRADE_STYLES.map((ts) => (
                    <button
                      key={ts.id}
                      onClick={() => setTradeStyle(ts.id)}
                      className={cn(
                        "w-full flex items-center justify-between rounded-2xl p-4 border text-left transition-all duration-200",
                        tradeStyle === ts.id
                          ? "bg-primary border-primary text-primary-foreground shadow-green"
                          : "bg-surface-elevated border-border hover:border-primary/40"
                      )}
                    >
                      <div>
                        <div className="font-bold">{ts.label}</div>
                        <div className={cn("text-sm mt-0.5", tradeStyle === ts.id ? "text-primary-foreground/70" : "text-muted-foreground")}>{ts.desc}</div>
                      </div>
                      {tradeStyle === ts.id && <Check className="w-5 h-5 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-gradient-to-t from-background to-transparent">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={goNext}
            disabled={!canProceed() || submitting}
            className={cn(
              "w-full flex items-center justify-center gap-3 font-bold text-lg py-4 rounded-full transition-all duration-200 min-h-11",
              canProceed() && !submitting
                ? "bg-primary text-primary-foreground shadow-green hover:bg-primary-glow hover:scale-[1.02]"
                : "bg-surface-elevated text-muted-foreground cursor-not-allowed"
            )}
          >
            {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
            {step === 3 ? "Start Swiping" : "Continue"}
            {!submitting && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
