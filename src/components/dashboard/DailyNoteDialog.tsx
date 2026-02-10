import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { DailyNote } from "@/hooks/useDailyNotes";

interface DailyNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  existingNote: DailyNote | null;
  onSave: (date: string, pre: string, post: string, mood: number | null) => Promise<{ success: boolean }>;
}

export const DailyNoteDialog = ({ open, onOpenChange, date, existingNote, onSave }: DailyNoteDialogProps) => {
  const [preNote, setPreNote] = useState("");
  const [postNote, setPostNote] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingNote) {
      setPreNote(existingNote.pre_market_note || "");
      setPostNote(existingNote.post_market_note || "");
      setMood(existingNote.mood_rating);
    } else {
      setPreNote(""); setPostNote(""); setMood(null);
    }
  }, [existingNote, date]);

  const handleSave = async () => {
    setSaving(true);
    const result = await onSave(date, preNote, postNote, mood);
    setSaving(false);
    if (result.success) onOpenChange(false);
  };

  const dateFormatted = date ? format(new Date(date), "EEEE, dd MMMM yyyy", { locale: he }) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>הערת יום - {dateFormatted}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>תכנון לפני מסחר</Label>
            <Textarea value={preNote} onChange={e => setPreNote(e.target.value)} placeholder="מה התוכנית להיום? מה לחפש? מה להימנע?" className="min-h-[80px]" />
          </div>
          <div className="space-y-2">
            <Label>סיכום אחרי מסחר</Label>
            <Textarea value={postNote} onChange={e => setPostNote(e.target.value)} placeholder="איך עבר היום? מה למדתי? מה לשפר?" className="min-h-[80px]" />
          </div>
          <div className="space-y-2">
            <Label>מצב רוח (1-5)</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <button key={i} type="button" onClick={() => setMood(mood === i ? null : i)} className="p-1 transition-transform hover:scale-110">
                  <Star className={`h-6 w-6 ${mood && mood >= i ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "שמור"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
