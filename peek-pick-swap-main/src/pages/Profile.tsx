import { useState, FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Pencil,
  Loader2,
  LogOut,
  Sprout,
  Leaf,
  Award,
  Trophy,
  Package,
  Trash2,
  Recycle,
  Cloud,
} from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Wordmark from "@/components/Wordmark";
import { Textarea } from "@/components/ui/textarea";
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
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useMe, useAuthActions } from "@/hooks/useAuth";
import type { Item } from "@/lib/types";
import BottomNav from "@/components/BottomNav";

const BADGE_META: Record<string, { label: string; icon: typeof Sprout }> = {
  "first-swap": { label: "First Swap", icon: Sprout },
  "eco-starter": { label: "Eco Starter", icon: Leaf },
  "eco-warrior": { label: "Eco Warrior", icon: Award },
  "super-trader": { label: "Super Trader", icon: Trophy },
};

function badgeMeta(id: string) {
  return BADGE_META[id] ?? { label: id.replace(/-/g, " "), icon: Award };
}

export default function Profile() {
  const queryClient = useQueryClient();
  const { data: me, isLoading } = useMe();
  const { logout } = useAuthActions();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const {
    data: itemsData,
    isLoading: itemsLoading,
  } = useQuery<{ items: Item[] }>({
    queryKey: ["items", "mine"],
    queryFn: () => api.get<{ items: Item[] }>("/api/items/mine"),
  });
  const myItems = itemsData?.items ?? [];
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const startEditing = () => {
    if (!me) return;
    setName(me.user.name);
    setBio(me.user.bio ?? "");
    setLocation(me.user.location ?? "");
    setSaveError("");
    setEditing(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaveError("");
    setSaving(true);
    try {
      await api.put("/api/me", { name: name.trim(), bio: bio.trim(), location: location.trim() });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Profile updated");
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Couldn't update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/api/items/${id}`);
      await queryClient.invalidateQueries({ queryKey: ["items", "mine"] });
      toast.success("Item removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't remove item");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <Wordmark size="sm" rest="rofile" />
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors min-h-11 px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
        >
          <LogOut className="w-4 h-4" /> Log out
        </button>
      </div>

      <div className="flex-1 px-5 pb-6 overflow-y-auto space-y-6">
        {isLoading || !me ? (
          <div className="space-y-4 pt-4">
            <div className="h-40 rounded-3xl bg-surface-elevated animate-pulse" />
            <div className="h-24 rounded-2xl bg-surface-elevated animate-pulse" />
          </div>
        ) : (
          <>
            {/* User info */}
            <div className="bg-surface-elevated border border-border rounded-2xl p-5">
              {editing ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-name">Name</Label>
                    <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-location">Location</Label>
                    <Input id="profile-location" value={location} onChange={(e) => setLocation(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-bio">Bio</Label>
                    <Textarea id="profile-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
                  </div>
                  {saveError && (
                    <p role="alert" className="text-sm text-destructive">{saveError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-2.5 rounded-full shadow-green hover:bg-primary-glow transition-all disabled:opacity-50 min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="flex-1 bg-surface border border-border font-bold py-2.5 rounded-full hover:bg-surface-hover transition-all min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="text-xl font-black truncate">{me.user.name}</h1>
                    {me.user.location && <p className="text-sm text-muted-foreground">{me.user.location}</p>}
                    {me.user.bio && <p className="text-sm text-foreground/80 mt-2 leading-relaxed">{me.user.bio}</p>}
                  </div>
                  <button
                    onClick={startEditing}
                    aria-label="Edit profile"
                    className="w-11 h-11 rounded-full bg-surface flex items-center justify-center hover:bg-surface-hover transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Passport hero card */}
            <div className="relative overflow-hidden bg-surface-elevated border border-primary/30 rounded-3xl p-6 shadow-green">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                    <Recycle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-black text-lg leading-none">PeekPick Passport</h2>
                    <p className="text-xs text-muted-foreground mt-1">Your circular impact</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="text-center bg-surface/60 rounded-2xl p-3">
                    <div className="text-2xl font-black gradient-text">{me.passport.itemsReused}</div>
                    <div className="text-[10px] text-muted-foreground mt-1 font-medium leading-tight">Items Reused</div>
                  </div>
                  <div className="text-center bg-surface/60 rounded-2xl p-3">
                    <div className="text-2xl font-black gradient-text">{me.passport.co2SavedKg}</div>
                    <div className="text-[10px] text-muted-foreground mt-1 font-medium leading-tight">kg CO₂ Saved</div>
                  </div>
                  <div className="text-center bg-surface/60 rounded-2xl p-3">
                    <div className="text-2xl font-black gradient-text">{me.passport.wasteDivertedKg}</div>
                    <div className="text-[10px] text-muted-foreground mt-1 font-medium leading-tight">kg Waste Diverted</div>
                  </div>
                </div>

                {me.passport.badges.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {me.passport.badges.map((badgeId) => {
                      const { label, icon: Icon } = badgeMeta(badgeId);
                      return (
                        <span
                          key={badgeId}
                          className="flex items-center gap-1.5 text-xs font-semibold bg-primary/10 border border-primary/30 text-primary rounded-full px-3 py-1.5 capitalize"
                        >
                          <Icon className="w-3.5 h-3.5" /> {label}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5" /> Complete your first trade to earn a badge.
                  </p>
                )}
              </div>
            </div>

            {/* My items */}
            <div>
              <h2 className="font-bold text-lg mb-3">My Items</h2>
              {itemsLoading ? (
                <div className="space-y-2">
                  {[0, 1].map((i) => (
                    <div key={i} className="h-16 rounded-2xl bg-surface-elevated animate-pulse" />
                  ))}
                </div>
              ) : myItems.length === 0 ? (
                <div className="bg-surface-elevated border border-border rounded-2xl p-6 text-center">
                  <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">You haven't listed anything yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {myItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 bg-surface-elevated border border-border rounded-2xl p-3"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-hover flex items-center justify-center flex-shrink-0">
                        {item.photoUrls[0] ? (
                          <img src={item.photoUrls[0]} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.available ? "Available" : "Traded"}</p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            aria-label={`Delete ${item.title}`}
                            disabled={deletingId === item.id}
                            className="w-11 h-11 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove "{item.title}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This takes it out of the swipe deck for everyone. This can't be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(item.id)}
                              className={cn(buttonVariants({ variant: "destructive" }))}
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
