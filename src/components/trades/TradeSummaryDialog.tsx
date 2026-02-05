import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Star, TrendingUp, TrendingDown, Calendar, Target, 
  Edit, CheckCircle2, ChevronLeft, ChevronRight, Image as ImageIcon,
  ZoomIn, ZoomOut, RotateCw, Maximize2, X, Minus, Plus, Move
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Trade } from "@/hooks/useTrades";
import { useState, useRef, useCallback, useEffect } from "react";

interface TradeScreenshot {
  id: string;
  screenshot_url: string;
  position: number;
}

interface TradeSummaryDialogProps {
  trade: Trade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  confirmations?: string[];
  screenshots?: TradeScreenshot[];
}

export const TradeSummaryDialog = ({ trade, open, onOpenChange, onEdit, confirmations = [], screenshots = [] }: TradeSummaryDialogProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const resetZoom = useCallback(() => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [scale, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setScale((prev) => Math.max(0.5, Math.min(4, prev + delta)));
  }, []);

  const handleDoubleClick = useCallback(() => {
    if (scale === 1) {
      setScale(2);
    } else {
      resetZoom();
    }
  }, [scale, resetZoom]);

  // Reset when scale is 1
  useEffect(() => {
    if (scale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  // Reset on dialog close
  useEffect(() => {
    if (!open) {
      setCurrentImageIndex(0);
      resetZoom();
    }
  }, [open, resetZoom]);

  // Early return after all hooks
  if (!trade) return null;

  // Combine legacy screenshot_url with new screenshots array
  const allScreenshots = screenshots.length > 0 
    ? screenshots.sort((a, b) => a.position - b.position)
    : trade.screenshot_url 
      ? [{ id: 'legacy', screenshot_url: trade.screenshot_url, position: 0 }]
      : [];

  const hasMultipleImages = allScreenshots.length > 1;
  const hasScreenshots = allScreenshots.length > 0;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allScreenshots.length);
    resetZoom();
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allScreenshots.length) % allScreenshots.length);
    resetZoom();
  };

  const handleZoomChange = (value: number[]) => {
    setScale(value[0]);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("he-IL");
  };

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return "—";
    return `$${price.toFixed(2)}`;
  };

  const isWin = (trade.pnl || 0) >= 0;

  // Parse notes
  const [reason, ...rest] = (trade.notes || "").split("\n\n[CONCLUSIONS]\n");
  const conclusions = rest.join("\n\n[CONCLUSIONS]\n");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] max-h-[90vh] h-[85vh] p-0 bg-card border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-semibold animate-scale-in",
                trade.trade_type === "long" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive",
              )}
            >
              {trade.trade_type.toUpperCase()}
            </span>
            <h2 className="text-2xl font-bold text-foreground">{trade.symbol}</h2>
            <span
              className={cn(
                "px-2 py-0.5 rounded text-xs font-medium",
                trade.is_closed ? "bg-success/20 text-success" : "bg-warning/20 text-warning",
              )}
            >
              {trade.is_closed ? "סגורה" : "פתוחה"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onEdit} className="gap-2">
              <Edit className="h-4 w-4" />
              ערוך
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Content - Split Layout */}
        <div className="flex h-[calc(100%-73px)]" dir="rtl">
          {/* Right Side - Trade Details */}
          <ScrollArea className="w-[400px] border-l border-border">
            <div className="p-6 space-y-5">
              {/* Main Stats Cards */}
              <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                {/* PnL Card */}
                <Card
                  className={cn(
                    "p-4 transition-all duration-300 hover:scale-[1.02]",
                    isWin ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isWin ? (
                        <TrendingUp className="h-5 w-5 text-success" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-destructive" />
                      )}
                      <span className="text-sm text-muted-foreground">רווח/הפסד</span>
                    </div>
                    <p className={cn("text-2xl font-bold", isWin ? "text-success" : "text-destructive")}>
                      {isWin ? "+" : ""}{formatPrice(trade.pnl)}
                    </p>
                  </div>
                </Card>

                {/* RR & Points */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-3 bg-secondary/50 transition-all duration-300 hover:bg-secondary/70">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground">RR</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">{trade.rr ? trade.rr.toFixed(2) : "—"}</p>
                  </Card>
                  <Card className="p-3 bg-secondary/50 transition-all duration-300 hover:bg-secondary/70">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground">נקודות</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">{trade.pnl_points ?? "—"}</p>
                  </Card>
                </div>
              </div>

              {/* Trade Details */}
              <Card className="p-4 bg-secondary/30 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">פרטי עסקה</h4>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">מחיר כניסה</span>
                    <span className="font-medium">{trade.entry_price !== 0 ? formatPrice(trade.entry_price) : "—"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">מחיר יציאה</span>
                    <span className="font-medium">{trade.exit_price !== null && trade.exit_price !== 0 ? formatPrice(trade.exit_price) : "—"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">כמות</span>
                    <span className="font-medium">{trade.quantity}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">סיכון</span>
                    <span className="font-medium">{trade.risk ? formatPrice(trade.risk) : "—"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">תאריך</span>
                    <span className="font-medium">{formatDate(trade.entry_date || trade.created_at)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">אסטרטגיה</span>
                    <span className="font-medium">{trade.strategy || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-sm text-muted-foreground">דירוג</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "h-4 w-4 transition-colors",
                            star <= (trade.rating || 0) ? "fill-warning text-warning" : "text-muted-foreground",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Confirmations */}
              {confirmations.length > 0 && (
                <Card className="p-4 bg-secondary/30 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    אישורים ({confirmations.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {confirmations.map((confirmation, index) => (
                      <Badge key={index} variant="secondary" className="bg-primary/20 text-primary">
                        {confirmation}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}

              {/* Entry Reason */}
              {reason && (
                <Card className="p-4 bg-secondary/30 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">סיבת כניסה לעסקה</h4>
                  <p className="text-foreground text-sm whitespace-pre-wrap break-words">{reason}</p>
                </Card>
              )}

              {/* Conclusions */}
              {conclusions && (
                <Card className="p-4 bg-secondary/30 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">מסקנות לאחר העסקה</h4>
                  <p className="text-foreground text-sm whitespace-pre-wrap break-words">{conclusions}</p>
                </Card>
              )}
            </div>
          </ScrollArea>

          {/* Left Side - Chart/Screenshot Area */}
          <div className="flex-1 flex flex-col bg-background/50">
            {hasScreenshots ? (
              <>
                {/* Image Viewer */}
                <div 
                  ref={imageContainerRef}
                  className={cn(
                    "flex-1 relative overflow-hidden flex items-center justify-center",
                    scale > 1 ? "cursor-grab" : "cursor-zoom-in",
                    isDragging && "cursor-grabbing"
                  )}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={handleWheel}
                  onDoubleClick={handleDoubleClick}
                >
                  <img
                    src={allScreenshots[currentImageIndex].screenshot_url}
                    alt={`Trade screenshot ${currentImageIndex + 1}`}
                    className="max-w-full max-h-full object-contain select-none pointer-events-none animate-fade-in"
                    style={{
                      transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                      transition: isDragging ? "none" : "transform 0.2s ease-out",
                    }}
                    draggable={false}
                  />
                  
                  {/* Navigation arrows for multiple images */}
                  {hasMultipleImages && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-background/80 hover:bg-background rounded-full border border-border transition-all hover:scale-110 shadow-lg"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-background/80 hover:bg-background rounded-full border border-border transition-all hover:scale-110 shadow-lg"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Zoom Controls Bar */}
                <div className="p-4 border-t border-border bg-card/80 backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-6">
                    {/* Thumbnails */}
                    {hasMultipleImages && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {allScreenshots.map((ss, index) => (
                          <button
                            key={ss.id}
                            onClick={() => { setCurrentImageIndex(index); resetZoom(); }}
                            className={cn(
                              "flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
                              currentImageIndex === index 
                                ? "border-primary ring-2 ring-primary/30" 
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <img 
                              src={ss.screenshot_url} 
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Zoom Slider */}
                    <div className="flex items-center gap-4 flex-1 max-w-md">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setScale((prev) => Math.max(0.5, prev - 0.25))}
                        className="h-8 w-8 shrink-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex-1 flex items-center gap-3">
                        <ZoomOut className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Slider
                          value={[scale]}
                          onValueChange={handleZoomChange}
                          min={0.5}
                          max={4}
                          step={0.1}
                          className="flex-1"
                        />
                        <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setScale((prev) => Math.min(4, prev + 0.25))}
                        className="h-8 w-8 shrink-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>

                      <span className="text-sm font-medium text-muted-foreground min-w-[50px] text-center">
                        {Math.round(scale * 100)}%
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setRotation((prev) => (prev + 90) % 360)}
                        className="h-8 w-8"
                        title="סובב"
                      >
                        <RotateCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={resetZoom}
                        className="h-8 w-8"
                        title="איפוס"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Helper text */}
                  {scale > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground animate-fade-in">
                      <Move className="h-3 w-3" />
                      <span>גרור להזזה • לחיצה כפולה לאיפוס • גלגל עכבר לזום</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p>אין צילומי מסך לעסקה זו</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
