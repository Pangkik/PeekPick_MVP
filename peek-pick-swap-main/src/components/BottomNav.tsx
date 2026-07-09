import { useLocation, useNavigate } from "react-router-dom";
import { RefreshCcw, Heart, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/swipe", icon: RefreshCcw, label: "Discover" },
  { to: "/matches", icon: Heart, label: "Matches" },
  { to: "/add-item", icon: Plus, label: "Add item", center: true },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="border-t border-border bg-surface">
      <div className="flex items-center justify-around px-6 py-3">
        {NAV_ITEMS.map(({ to, icon: Icon, label, center }) => {
          const active = location.pathname === to;

          if (center) {
            return (
              <button
                key={to}
                onClick={() => navigate(to)}
                aria-label={label}
                className="w-12 h-12 -mt-1 rounded-full bg-primary flex items-center justify-center shadow-green hover:bg-primary-glow hover:scale-110 transition-all duration-200"
              >
                <Icon className="w-6 h-6 text-primary-foreground" />
              </button>
            );
          }

          return (
            <button
              key={to}
              onClick={() => navigate(to)}
              aria-label={label}
              className={cn(
                "flex flex-col items-center gap-1 py-1 px-3 min-h-11 rounded-xl transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
