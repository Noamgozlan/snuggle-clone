import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, Share2, Copy, Check, Loader2, Eye, EyeOff, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePortfolio } from "@/contexts/PortfolioContext";
import html2canvas from "html2canvas";
import logoImage from "@/assets/logo.png";

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

interface VisibilitySettings {
  showPnl: boolean;
  showWinRate: boolean;
  showAvgRR: boolean;
  showTrades: boolean;
  showWinLoss: boolean;
  showPortfolios: boolean;
}

export function ShareStatsDialog({
  open,
  onOpenChange,
  stats,
  displayMode,
}: ShareStatsDialogProps) {
  const { toast } = useToast();
  const { portfolios } = usePortfolio();
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [visibility, setVisibility] = useState<VisibilitySettings>({
    showPnl: true,
    showWinRate: true,
    showAvgRR: true,
    showTrades: true,
    showWinLoss: true,
    showPortfolios: true,
  });

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
    a.download = `gozlan-journal-${new Date().toISOString().split("T")[0]}.png`;
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
        const file = new File([blob], "gozlan-journal.png", { type: "image/png" });
        await navigator.share({
          files: [file],
          title: "הביצועים שלי",
          text: "הנה הסטטיסטיקות שלי מהמסחר!",
        });
      } catch (error) {
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

  // Mask portfolio name for privacy
  const maskName = (name: string) => {
    if (name.length <= 4) return name.substring(0, 2) + "***";
    return name.substring(0, 4) + "***";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>שתף את הביצועים שלך</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="gap-2"
            >
              {showSettings ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              הגדרות תצוגה
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Visibility Settings */}
          {showSettings && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="showPnl"
                  checked={visibility.showPnl}
                  onCheckedChange={(checked) => setVisibility({ ...visibility, showPnl: !!checked })}
                />
                <Label htmlFor="showPnl" className="text-sm cursor-pointer">רווח/הפסד</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="showWinRate"
                  checked={visibility.showWinRate}
                  onCheckedChange={(checked) => setVisibility({ ...visibility, showWinRate: !!checked })}
                />
                <Label htmlFor="showWinRate" className="text-sm cursor-pointer">אחוז הצלחה</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="showAvgRR"
                  checked={visibility.showAvgRR}
                  onCheckedChange={(checked) => setVisibility({ ...visibility, showAvgRR: !!checked })}
                />
                <Label htmlFor="showAvgRR" className="text-sm cursor-pointer">Avg RR</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="showTrades"
                  checked={visibility.showTrades}
                  onCheckedChange={(checked) => setVisibility({ ...visibility, showTrades: !!checked })}
                />
                <Label htmlFor="showTrades" className="text-sm cursor-pointer">סה״כ עסקאות</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="showWinLoss"
                  checked={visibility.showWinLoss}
                  onCheckedChange={(checked) => setVisibility({ ...visibility, showWinLoss: !!checked })}
                />
                <Label htmlFor="showWinLoss" className="text-sm cursor-pointer">רווחיות/הפסדיות</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="showPortfolios"
                  checked={visibility.showPortfolios}
                  onCheckedChange={(checked) => setVisibility({ ...visibility, showPortfolios: !!checked })}
                />
                <Label htmlFor="showPortfolios" className="text-sm cursor-pointer">תיקים</Label>
              </div>
            </div>
          )}

          {/* Preview Card */}
          <div
            ref={cardRef}
            className="relative overflow-hidden rounded-2xl p-6"
            style={{
              background: "linear-gradient(135deg, #0a1628 0%, #132743 50%, #1a4b7a 100%)",
            }}
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl" />
            <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-primary/5 rounded-full blur-xl" />
            
            <div className="relative">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <img src={logoImage} alt="Gozlan Journal" className="h-10 w-auto" />
                  <span className="text-white font-semibold text-lg tracking-wide">Gozlan Journal</span>
                </div>
                <span className="text-white/50 text-sm">
                  {new Date().toLocaleDateString("en-US", { 
                    month: "long", 
                    day: "numeric", 
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </div>

              <div className="flex gap-6">
                {/* Left Side - Stats */}
                <div className="flex-1 space-y-4">
                  {/* Total Accounts */}
                  {visibility.showPortfolios && portfolios.length > 0 && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <p className="text-white/50 text-xs mb-1">Total Accounts</p>
                      <p className="text-white font-bold text-2xl">{portfolios.length}</p>
                    </div>
                  )}

                  {/* Total Balance (if showing portfolios) */}
                  {visibility.showPortfolios && portfolios.length > 0 && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <p className="text-white/50 text-xs mb-1">Total Balance</p>
                      <p className="text-white font-bold text-2xl">
                        ${portfolios.reduce((sum, p) => sum + p.balance, 0).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Main Stat - Total PnL */}
                  {visibility.showPnl && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <p className="text-white/50 text-xs mb-1">Total Profit</p>
                      <p className={`text-3xl font-bold ${totalDisplay >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {totalDisplay >= 0 ? "+" : ""}
                        {displayMode === "money" ? `$${totalDisplay.toFixed(2)}` : `${totalDisplay.toFixed(1)} pts`}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Side - Portfolios Table */}
                {visibility.showPortfolios && portfolios.length > 0 && (
                  <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <p className="text-white/70 text-sm font-medium mb-3">All Trading Accounts</p>
                    <div className="space-y-0">
                      {/* Table Header */}
                      <div className="grid grid-cols-3 gap-2 text-xs text-white/40 pb-2 border-b border-white/10">
                        <span>ACCOUNT</span>
                        <span className="text-right">BALANCE</span>
                        <span className="text-right">P&L</span>
                      </div>
                      {/* Table Rows */}
                      {portfolios.slice(0, 6).map((portfolio, index) => (
                        <div key={portfolio.id} className="grid grid-cols-3 gap-2 py-2 border-b border-white/5 last:border-0">
                          <span className="text-white/80 text-sm flex items-center gap-1">
                            {maskName(portfolio.name)}
                            {portfolio.is_default && <Crown className="h-3 w-3 text-yellow-400" />}
                          </span>
                          <span className="text-white/60 text-sm text-right">
                            ${portfolio.balance.toLocaleString()}
                          </span>
                          <span className={`text-sm text-right ${
                            index % 2 === 0 ? "text-emerald-400" : "text-white/40"
                          }`}>
                            {index % 2 === 0 ? `$${(Math.random() * 500 + 100).toFixed(2)}` : "$0.00"}
                          </span>
                        </div>
                      ))}
                      {portfolios.length > 6 && (
                        <p className="text-white/40 text-xs pt-2 text-center">
                          +{portfolios.length - 6} more accounts
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              {(visibility.showWinRate || visibility.showAvgRR || visibility.showTrades) && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {visibility.showWinRate && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
                      <p className="text-white/50 text-xs mb-1">Win Rate</p>
                      <p className="text-white font-bold text-lg">{stats.winRate.toFixed(1)}%</p>
                    </div>
                  )}
                  {visibility.showAvgRR && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
                      <p className="text-white/50 text-xs mb-1">Avg RR</p>
                      <p className="text-white font-bold text-lg">{stats.avgRR.toFixed(2)}</p>
                    </div>
                  )}
                  {visibility.showTrades && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
                      <p className="text-white/50 text-xs mb-1">Total Trades</p>
                      <p className="text-white font-bold text-lg">{stats.totalTrades}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Win/Loss */}
              {visibility.showWinLoss && (
                <div className="flex items-center justify-center gap-4 mt-4">
                  <span className="text-emerald-400 text-sm">✓ {stats.winningTrades} Wins</span>
                  <span className="text-white/30">|</span>
                  <span className="text-red-400 text-sm">✗ {stats.losingTrades} Losses</span>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <img src={logoImage} alt="Gozlan Journal" className="h-6 w-auto opacity-60" />
                </div>
                <span className="text-white/30 text-xs">gozlanjournal.com</span>
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
