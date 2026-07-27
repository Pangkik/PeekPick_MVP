import { useRef, useState } from "react";
import { Share2, Download, Copy, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Passport } from "@/lib/types";

// Captions from marketing/social/passport-share.md — the sharer should look good,
// not the app. Numbers are always the user's real figures, never rounded up.
function captionFor(p: Passport, name: string) {
  void name;
  if (p.itemsReused >= 10) return "10 swaps down. At this point, swapping is just how I get stuff now.";
  if (p.itemsReused >= 3)
    return `${p.itemsReused} swaps in. Getting rid of stuff I don't need, getting stuff I actually want — no cash involved.`;
  if (p.itemsReused >= 1)
    return "Just made my first swap on PeekPick. One less thing bought new, one less thing thrown out.";
  return "Starting my swap journey on PeekPick. Trading instead of buying new.";
}

const W = 1080;
const H = 1080;

// ponytail: canvas is both the preview and the shared file — one source of truth,
// no DOM-to-image dependency (html2canvas et al) and no preview/output drift.
function draw(canvas: HTMLCanvasElement, p: Passport, name: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#04140d");
  bg.addColorStop(1, "#0a2318");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#4ade80";
  ctx.beginPath();
  ctx.arc(W / 2, 210, 54, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#04140d";
  ctx.font = "900 58px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("P", W / 2, 214);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 62px system-ui, -apple-system, sans-serif";
  ctx.fillText("Circular Passport", W / 2, 330);

  ctx.fillStyle = "#7dd3a8";
  ctx.font = "500 34px system-ui, -apple-system, sans-serif";
  ctx.fillText(name, W / 2, 388);

  const stats: [string, string][] = [
    [String(p.itemsReused), "items reused"],
    [String(p.co2SavedKg), "kg CO₂ saved*"],
    [String(p.wasteDivertedKg), "kg waste diverted*"],
  ];
  const boxW = 300;
  const gap = 30;
  const totalW = boxW * 3 + gap * 2;
  let x = (W - totalW) / 2;
  for (const [value, label] of stats) {
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.beginPath();
    ctx.roundRect(x, 470, boxW, 240, 32);
    ctx.fill();
    ctx.fillStyle = "#4ade80";
    ctx.font = "900 76px system-ui, -apple-system, sans-serif";
    ctx.fillText(value, x + boxW / 2, 560);
    ctx.fillStyle = "#9fb8ab";
    ctx.font = "500 26px system-ui, -apple-system, sans-serif";
    ctx.fillText(label, x + boxW / 2, 650);
    x += boxW + gap;
  }

  if (p.badges.length) {
    ctx.fillStyle = "#7dd3a8";
    ctx.font = "600 30px system-ui, -apple-system, sans-serif";
    ctx.fillText(p.badges.map((b) => b.replace(/-/g, " ")).join("  ·  "), W / 2, 800);
  }

  ctx.fillStyle = "#5f7a6d";
  ctx.font = "400 22px system-ui, -apple-system, sans-serif";
  ctx.fillText("*estimated — see how we calculate this in the app", W / 2, 930);
  ctx.fillStyle = "#4ade80";
  ctx.font = "700 30px system-ui, -apple-system, sans-serif";
  ctx.fillText("peekpick — swap, don't shop", W / 2, 985);
}

export default function PassportShare({ passport, name }: { passport: Passport; name: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const caption = captionFor(passport, name);

  // Callback ref, not an effect: the dialog content mounts inside a portal, so
  // drawing when the node actually attaches is the only reliable moment.
  const attachCanvas = (node: HTMLCanvasElement | null) => {
    canvasRef.current = node;
    if (node) draw(node, passport, name);
  };

  const toBlob = () =>
    new Promise<Blob | null>((resolve) => canvasRef.current?.toBlob(resolve, "image/png"));

  const handleShare = async () => {
    setBusy(true);
    try {
      const blob = await toBlob();
      if (!blob) throw new Error("Could not render the image");
      const file = new File([blob], "peekpick-passport.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: caption });
      } else {
        handleDownload(blob);
        toast.success("Image saved — caption copied, ready to paste.");
        await navigator.clipboard?.writeText(caption).catch(() => {});
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        toast.error("Couldn't share that. Try downloading instead.");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = (existing?: Blob) => {
    const save = (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "peekpick-passport.png";
      a.click();
      URL.revokeObjectURL(url);
    };
    if (existing) return save(existing);
    toBlob().then((b) => b && save(b));
  };

  const handleCopy = async () => {
    await navigator.clipboard?.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="w-full mt-5 flex items-center justify-center gap-2 min-h-[44px] rounded-full border border-primary/40 text-primary font-bold text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <Share2 className="w-4 h-4" /> Share my Passport
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Share your Passport</DialogTitle>
          <DialogDescription>
            Your real numbers, ready to post. Nothing is rounded up.
          </DialogDescription>
        </DialogHeader>

        <canvas
          ref={attachCanvas}
          width={W}
          height={H}
          className="w-full rounded-2xl border border-border"
          aria-label={`Circular Passport card: ${passport.itemsReused} items reused, ${passport.co2SavedKg} kilograms of CO2 saved, ${passport.wasteDivertedKg} kilograms of waste diverted`}
        />

        <div className="rounded-xl bg-surface-elevated border border-border p-3">
          <p className="text-sm text-foreground">{caption}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleShare}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-2 min-h-[44px] rounded-full bg-primary text-primary-foreground font-bold text-sm disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
            Share
          </button>
          <button
            onClick={() => handleDownload()}
            aria-label="Download image"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full border border-border hover:bg-surface-elevated transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopy}
            aria-label="Copy caption"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full border border-border hover:bg-surface-elevated transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
