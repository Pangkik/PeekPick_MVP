import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, X, RefreshCcw, Loader2, Shuffle, PackageSearch } from "lucide-react";
import { api, getToken } from "@/lib/api";
import { CATEGORIES, CONDITIONS, labelFor } from "@/lib/categories";
import { DEMO_ITEMS } from "@/lib/demoItems";
import BottomNav from "@/components/BottomNav";
import ItemVisual from "@/components/ItemVisual";
import type { Item } from "@/lib/types";

export default function Search() {
  const navigate = useNavigate();
  const authed = !!getToken();
  const [query, setQuery] = useState("");

  // Shares the "discovery" cache key with SwipeInterface so logged-in users
  // don't trigger a second network fetch for the same pool of items.
  const { data, isLoading, isError, error, refetch } = useQuery<{ items: Item[] }>({
    queryKey: ["discovery"],
    queryFn: () => api.get<{ items: Item[] }>("/api/discovery"),
    refetchOnWindowFocus: false,
    enabled: authed,
  });
  const items = authed ? data?.items ?? [] : DEMO_ITEMS;
  const loading = authed && isLoading;
  const errored = authed && isError;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const categoryLabel = labelFor(CATEGORIES, item.category).toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        categoryLabel.includes(q) ||
        item.wants.some((w) => labelFor(CATEGORIES, w).toLowerCase().includes(q))
      );
    });
  }, [items, query]);

  return (
    <div className="min-h-dvh bg-background flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4">
        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-black text-primary-foreground">
          P
        </div>
        <span className="font-black">Search</span>
      </div>

      {/* Search input */}
      <div className="px-5 pb-3">
        <div className="relative">
          <SearchIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items or categories…"
            aria-label="Search items or categories"
            className="w-full h-11 rounded-full bg-surface-elevated border border-border pl-10 pr-10 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 px-5 pb-4 overflow-y-auto">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 pt-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-square rounded-2xl bg-surface-elevated animate-pulse" />
            ))}
          </div>
        ) : errored ? (
          <div className="flex flex-col items-center justify-center text-center gap-4 pt-16">
            <p className="text-muted-foreground">{error instanceof Error ? error.message : "Couldn't load items"}</p>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 bg-surface-elevated border border-primary/40 text-primary font-bold px-6 py-3 rounded-full hover:bg-primary hover:text-primary-foreground transition-all min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <RefreshCcw className="w-4 h-4" /> Try again
            </button>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center gap-3 pt-16">
            <PackageSearch className="w-12 h-12 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">No items match "{query}". Try another word or category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pt-1">
            {results.map((item, i) => (
              // TODO(dev): wire this tile to a real item-detail view / jump
              // the swipe deck to this item once that flow exists. For now
              // tiles are informational only — the swipe deck is the one
              // primary action surface.
              <div
                key={item.id}
                className="rounded-2xl border border-border bg-surface-elevated overflow-hidden"
              >
                <div className="aspect-square">
                  <ItemVisual category={item.category} index={i} photoUrl={item.photoUrls[0]} alt={item.title} />
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-primary mb-0.5">{labelFor(CONDITIONS, item.condition)}</p>
                  <p className="font-bold text-sm leading-snug line-clamp-2">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Single primary CTA: back into the swipe deck */}
      <div className="px-5 pb-3">
        <button
          onClick={() => navigate("/")}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3 rounded-full shadow-green hover:bg-primary-glow transition-all min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Shuffle className="w-4 h-4" /> Continue swiping
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
