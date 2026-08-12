import { useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Heart, MessageCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getToken } from "@/lib/api";

interface NavItem {
  to: string;
  icon: typeof Home;
  label: string;
  /** Extra path prefixes that should also light this tab up as active. */
  matchPrefixes?: string[];
  /** Require auth to visit; logged-out taps redirect to /login instead. */
  requiresAuth?: boolean;
  center?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", icon: Home, label: "Home", matchPrefixes: ["/swipe"] },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/add-item", icon: Plus, label: "Add item", requiresAuth: true, center: true },
  { to: "/likes", icon: Heart, label: "Likes", requiresAuth: true },
  { to: "/matches", icon: MessageCircle, label: "Chat", requiresAuth: true, matchPrefixes: ["/chat"] },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const goTo = (item: NavItem) => {
    if (item.requiresAuth && !getToken()) {
      toast.info("Sign in to continue");
      navigate("/login");
      return;
    }
    navigate(item.to);
  };

  return (
    <nav
      aria-label="Primary"
      className="border-t border-border bg-background/90 backdrop-blur-md pb-safe"
    >
      <div className="flex items-center justify-around px-4 py-2">
        {NAV_ITEMS.map((item) => {
          const { to, icon: Icon, label, matchPrefixes, center } = item;
          const active =
            location.pathname === to || (matchPrefixes ?? []).some((p) => location.pathname.startsWith(p));

          if (center) {
            return (
              <button
                key={to}
                onClick={() => goTo(item)}
                aria-label={label}
                className="w-12 h-12 -mt-1 rounded-full bg-primary flex items-center justify-center shadow-green hover:bg-primary-glow hover:-translate-y-0.5 active:scale-95 motion-reduce:transform-none transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Icon className="w-6 h-6 text-primary-foreground" strokeWidth={2.25} />
              </button>
            );
          }

          return (
            <button
              key={to}
              onClick={() => goTo(item)}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1.5 px-3 min-w-11 min-h-11 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-6 h-6" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[11px] font-semibold leading-none">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
