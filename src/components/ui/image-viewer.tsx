import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ZoomIn, X, ZoomOut, RotateCw, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageViewerProps {
  src: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
}

export const ImageViewer = ({ src, alt = "Image", className, containerClassName }: ImageViewerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.5, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  
  const handleReset = useCallback(() => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    handleReset();
  };

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setScale((prev) => Math.max(0.5, Math.min(5, prev + delta)));
  }, []);

  // Double click to toggle zoom
  const handleDoubleClick = useCallback(() => {
    if (scale === 1) {
      setScale(2.5);
    } else {
      handleReset();
    }
  }, [scale, handleReset]);

  // Mouse drag handlers
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

  // Touch handlers for mobile
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [initialDistance, setInitialDistance] = useState<number | null>(null);

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return null;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
    } else if (e.touches.length === 2) {
      setInitialDistance(getTouchDistance(e.touches));
    }
  }, [position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && touchStart && scale > 1) {
      setPosition({
        x: e.touches[0].clientX - touchStart.x,
        y: e.touches[0].clientY - touchStart.y,
      });
    } else if (e.touches.length === 2 && initialDistance) {
      const newDistance = getTouchDistance(e.touches);
      if (newDistance) {
        const scaleDelta = (newDistance - initialDistance) / 200;
        setScale((prev) => Math.max(0.5, Math.min(5, prev + scaleDelta)));
        setInitialDistance(newDistance);
      }
    }
  }, [touchStart, scale, initialDistance]);

  const handleTouchEnd = useCallback(() => {
    setTouchStart(null);
    setInitialDistance(null);
  }, []);

  // Reset position when scale changes to 1
  useEffect(() => {
    if (scale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  return (
    <>
      <div
        className={cn(
          "relative group cursor-zoom-in overflow-hidden",
          containerClassName
        )}
        onClick={() => setIsOpen(true)}
      >
        <img
          src={src}
          alt={alt}
          className={cn(
            "transition-transform duration-300 group-hover:scale-105",
            className
          )}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
          <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-black/95 border-none overflow-hidden">
          {/* Controls */}
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              className="h-8 w-8 hover:bg-white/20 text-white rounded-full"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-white text-sm font-medium min-w-[50px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              className="h-8 w-8 hover:bg-white/20 text-white rounded-full"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <div className="w-px h-5 bg-white/30" />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRotate}
              className="h-8 w-8 hover:bg-white/20 text-white rounded-full"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className="h-8 w-8 hover:bg-white/20 text-white rounded-full"
              title="איפוס"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <div className="w-px h-5 bg-white/30" />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8 hover:bg-white/20 text-white rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Helper text */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 text-white/60 text-xs bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
            גלגל עכבר לזום • לחיצה כפולה לזום • גרירה להזזה
          </div>

          {/* Image Container */}
          <div
            ref={containerRef}
            className={cn(
              "w-full h-full min-h-[50vh] flex items-center justify-center p-8 overflow-hidden",
              scale > 1 ? "cursor-grab" : "cursor-zoom-in",
              isDragging && "cursor-grabbing"
            )}
            onClick={(e) => {
              if (e.target === e.currentTarget && !isDragging) handleClose();
            }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-[85vh] object-contain select-none pointer-events-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                transition: isDragging ? "none" : "transform 0.2s ease-out",
              }}
              draggable={false}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
