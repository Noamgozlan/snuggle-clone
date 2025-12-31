import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BacktestingReplayControlsProps {
  onStepForward: (steps?: number) => void;
  onReset: () => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  playSpeed: number;
  setPlaySpeed: (speed: number) => void;
  canStep: boolean;
  currentIndex: number;
  totalCandles: number;
}

const SPEEDS = [
  { value: 1, label: "x1" },
  { value: 2, label: "x2" },
  { value: 5, label: "x5" },
  { value: 10, label: "x10" },
  { value: 20, label: "x20" },
  { value: 50, label: "x50" },
  { value: 100, label: "x100" },
];

export const BacktestingReplayControls = ({
  onStepForward,
  onReset,
  isPlaying,
  setIsPlaying,
  playSpeed,
  setPlaySpeed,
  canStep,
  currentIndex,
  totalCandles,
}: BacktestingReplayControlsProps) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPlaying && canStep) {
      intervalRef.current = setInterval(() => {
        onStepForward(1);
      }, 1000 / playSpeed);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, playSpeed, canStep, onStepForward]);

  useEffect(() => {
    if (!canStep && isPlaying) {
      setIsPlaying(false);
    }
  }, [canStep, isPlaying, setIsPlaying]);

  const progress = totalCandles > 0 ? (currentIndex / totalCandles) * 100 : 0;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onReset}
                title="איפוס"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>איפוס</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={!canStep && !isPlaying}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isPlaying ? "עצור" : "הפעל"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onStepForward(1)}
                disabled={!canStep}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>נר קדימה</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onStepForward(5)}
                disabled={!canStep}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>5 נרות קדימה</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onStepForward(20)}
                disabled={!canStep}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>20 נרות קדימה</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">מהירות:</span>
          <Select
            value={playSpeed.toString()}
            onValueChange={(v) => setPlaySpeed(Number(v))}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPEEDS.map((speed) => (
                <SelectItem key={speed.value} value={speed.value.toString()}>
                  {speed.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 flex items-center gap-4">
          <Progress value={progress} className="flex-1" />
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {currentIndex} / {totalCandles} נרות
          </span>
        </div>
      </div>
    </Card>
  );
};

