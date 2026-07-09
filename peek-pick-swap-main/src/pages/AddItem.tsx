import { useState, useRef, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Camera, X as XIcon, Check } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { CATEGORIES, CONDITIONS } from "@/lib/categories";
import type { Item } from "@/lib/types";

const MAX_PHOTOS = 4;

export default function AddItem() {
  const navigate = useNavigate();

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [description, setDescription] = useState("");
  const [wants, setWants] = useState<string[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleWant = (id: string) => {
    setWants((prev) => (prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]));
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files).slice(0, MAX_PHOTOS - photos.length);
    if (incoming.length === 0) return;

    const nextPhotos = [...photos, ...incoming];
    setPhotos(nextPhotos);
    setPhotoPreviews((prev) => [...prev, ...incoming.map((f) => URL.createObjectURL(f))]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Title is required";
    if (!category) next.category = "Pick a category";
    if (!condition) next.condition = "Pick a condition";
    if (!description.trim()) next.description = "Description is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("category", category);
      formData.append("condition", condition);
      formData.append("description", description.trim());
      formData.append("wants", JSON.stringify(wants));
      photos.forEach((file) => formData.append("photos", file));

      await api.post<{ item: Item }>("/api/items", formData);
      toast.success("Item listed! It's now in the swipe deck.");
      navigate("/swipe");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Couldn't list your item");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center hover:bg-surface-hover transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-black text-lg">List an item</h1>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex-1 px-5 pb-10 space-y-7 overflow-y-auto">
        {/* Photos */}
        <div className="space-y-2">
          <Label>Photos (optional, up to {MAX_PHOTOS})</Label>
          <div className="grid grid-cols-4 gap-2">
            {photoPreviews.map((src, i) => (
              <div key={src} className="relative aspect-square rounded-2xl overflow-hidden border border-border">
                <img src={src} alt={`Item photo ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  aria-label={`Remove photo ${i + 1}`}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-black/90 transition-colors"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Add photo"
                className="aspect-square rounded-2xl border border-dashed border-border bg-surface-elevated flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
              >
                <Camera className="w-6 h-6" />
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="item-title">Title</Label>
          <Input
            id="item-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Vintage Film Camera"
            aria-invalid={!!errors.title}
          />
          {errors.title && <p role="alert" className="text-sm text-destructive">{errors.title}</p>}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label>Category</Label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={cn(
                  "flex items-center gap-2 rounded-2xl p-3 border text-left text-sm font-semibold transition-all min-h-11",
                  category === cat.id
                    ? "bg-primary border-primary text-primary-foreground shadow-green"
                    : "bg-surface-elevated border-border text-foreground hover:border-primary/50"
                )}
              >
                <span className="text-lg flex-shrink-0">{cat.icon}</span>
                <span className="leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
          {errors.category && <p role="alert" className="text-sm text-destructive">{errors.category}</p>}
        </div>

        {/* Condition */}
        <div className="space-y-2">
          <Label>Condition</Label>
          <div className="grid grid-cols-2 gap-2">
            {CONDITIONS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCondition(c.id)}
                className={cn(
                  "rounded-2xl p-3 border text-left transition-all min-h-11",
                  condition === c.id
                    ? "bg-primary border-primary text-primary-foreground shadow-green"
                    : "bg-surface-elevated border-border hover:border-primary/40"
                )}
              >
                <div className="font-bold text-sm">{c.label}</div>
                <div className={cn("text-xs mt-0.5", condition === c.id ? "text-primary-foreground/70" : "text-muted-foreground")}>
                  {c.desc}
                </div>
              </button>
            ))}
          </div>
          {errors.condition && <p role="alert" className="text-sm text-destructive">{errors.condition}</p>}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="item-description">Description</Label>
          <Textarea
            id="item-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell traders about its condition, history, and anything they should know."
            rows={4}
            aria-invalid={!!errors.description}
          />
          {errors.description && <p role="alert" className="text-sm text-destructive">{errors.description}</p>}
        </div>

        {/* Wants */}
        <div className="space-y-2">
          <Label>What would you take in return? (optional)</Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const selected = wants.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleWant(cat.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold border transition-all min-h-11",
                    selected
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-surface-elevated border-border text-foreground hover:border-primary/50"
                  )}
                >
                  {selected && <Check className="w-3.5 h-3.5" />}
                  {cat.icon} {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {formError && (
          <p role="alert" className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-xl px-3 py-2">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold text-lg py-4 rounded-full shadow-green hover:bg-primary-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-11"
        >
          {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
          List Item
        </button>
      </form>
    </div>
  );
}
