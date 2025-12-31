import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Share2, Copy, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";

interface ShareStatsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: {
    totalPnl: number;
    totalPoints: number;
    winRate: number;
    avgRR: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
  };
  displayMode: "money" | "points";
}

export function ShareStatsDialog({
  open,
  onOpenChange,
  stats,
  displayMode,
}: ShareStatsDialogProps) {
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const totalDisplay = displayMode === "money" ? stats.totalPnl : stats.totalPoints;

  const generateImage = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    
    setGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, "image/png");
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    const blob = await generateImage();
    if (!blob) return;
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trading-stats-${new Date().toISOString().split("T")[0]}.png`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "התמונה הורדה בהצלחה",
    });
  };

  const handleShare = async () => {
    const blob = await generateImage();
    if (!blob) return;
    
    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([blob], "trading-stats.png", { type: "image/png" });
        await navigator.share({
          files: [file],
          title: "הביצועים שלי",
          text: "הנה הסטטיסטיקות שלי מהמסחר!",
        });
      } catch (error) {
        // User cancelled or share failed, fallback to download
        handleDownload();
      }
    } else {
      handleDownload();
    }
  };

  const handleCopyImage = async () => {
    const blob = await generateImage();
    if (!blob) return;
    
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopied(true);
      toast({
        title: "התמונה הועתקה ללוח",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "לא ניתן להעתיק",
        description: "נסה להוריד את התמונה במקום",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>שתף את הביצועים שלך</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview Card */}
          <div
            ref={cardRef}
            className="relative overflow-hidden rounded-2xl p-6"
            style={{
              background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
            }}
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-success/20 rounded-full blur-2xl" />
            
            <div className="relative">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">TJ</span>
                  </div>
                  <span className="text-white/80 font-medium">Trading Journal</span>
                </div>
                <span className="text-white/50 text-sm">
                  {new Date().toLocaleDateString("he-IL")}
                </span>
              </div>

              {/* Main Stat */}
              <div className="text-center mb-6">
                <p className="text-white/60 text-sm mb-1">סה״כ רווח/הפסד</p>
                <p className={`text-4xl font-bold ${totalDisplay >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {totalDisplay >= 0 ? "+" : ""}
                  {displayMode === "money" ? `$${totalDisplay.toFixed(2)}` : `${totalDisplay.toFixed(1)} נק׳`}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                  <p className="text-white/60 text-xs mb-1">אחוז הצלחה</p>
                  <p className="text-white font-bold text-lg">{stats.winRate.toFixed(1)}%</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                  <p className="text-white/60 text-xs mb-1">Avg RR</p>
                  <p className="text-white font-bold text-lg">{stats.avgRR.toFixed(2)}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                  <p className="text-white/60 text-xs mb-1">עסקאות</p>
                  <p className="text-white font-bold text-lg">{stats.totalTrades}</p>
                </div>
              </div>

              {/* Win/Loss */}
              <div className="flex items-center justify-center gap-4 mt-4">
                <span className="text-emerald-400 text-sm">✓ {stats.winningTrades} רווחיות</span>
                <span className="text-white/30">|</span>
                <span className="text-red-400 text-sm">✗ {stats.losingTrades} הפסדיות</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              className="flex-1 gap-2"
              onClick={handleShare}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              שתף
            </Button>
            <Button
              variant="secondary"
              className="flex-1 gap-2"
              onClick={handleDownload}
              disabled={generating}
            >
              <Download className="h-4 w-4" />
              הורד
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyImage}
              disabled={generating}
            >
              {copied ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
