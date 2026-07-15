import { useState, FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: "user" | "item";
  targetId: string | number;
  title: string;
}

export default function ReportDialog({ open, onOpenChange, targetType, targetId, title }: ReportDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setReason("");
      setError("");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Tell us what's wrong");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await api.post("/api/reports", { targetType, targetId, reason: reason.trim() });
      toast.success("Report submitted. Thanks for helping keep PeekPick safe.");
      handleOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Tell us what's wrong. Our team will review it.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="report-reason">Reason</Label>
            <Textarea
              id="report-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="What happened?"
              aria-invalid={!!error}
            />
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <button type="button" className={cn(buttonVariants({ variant: "outline" }), "min-h-11")}>
                Cancel
              </button>
            </DialogClose>
            <button type="submit" disabled={submitting} className={cn(buttonVariants(), "min-h-11")}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit report
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
