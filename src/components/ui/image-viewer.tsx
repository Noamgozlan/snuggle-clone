import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ZoomIn, X, ZoomOut, RotateCw } from "lucide-react";
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

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.5, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  const handleClose = () => {
    setIsOpen(false);
    handleReset();
  };

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
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              className="bg-white/10 hover:bg-white/20 text-white rounded-full"
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            <span className="text-white text-sm font-medium min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              className="bg-white/10 hover:bg-white/20 text-white rounded-full"
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRotate}
              className="bg-white/10 hover:bg-white/20 text-white rounded-full"
            >
              <RotateCw className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="bg-white/10 hover:bg-white/20 text-white rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Image Container */}
          <div
            className="w-full h-full min-h-[50vh] flex items-center justify-center p-8 overflow-auto cursor-move"
            onClick={(e) => {
              if (e.target === e.currentTarget) handleClose();
            }}
          >
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-[85vh] object-contain transition-transform duration-300 ease-out select-none"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
              }}
              draggable={false}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
