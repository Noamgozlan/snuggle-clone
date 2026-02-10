import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Shield, AlertTriangle, Zap, Target, Flame, Heart,
  Frown, HandCoins, Clock, Brain, X
} from "lucide-react";

export const MENTAL_STATES = [
  { value: "confident", label: "Confident", icon: Shield, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" },
  { value: "anxious", label: "Anxious", icon: AlertTriangle, color: "text-amber-500 bg-amber-500/10 border-amber-500/30" },
  { value: "fomo", label: "FOMO", icon: Zap, color: "text-red-500 bg-red-500/10 border-red-500/30" },
  { value: "disciplined", label: "Disciplined", icon: Target, color: "text-blue-500 bg-blue-500/10 border-blue-500/30" },
  { value: "revenge", label: "Revenge", icon: Flame, color: "text-rose-700 bg-rose-700/10 border-rose-700/30" },
  { value: "calm", label: "Calm", icon: Heart, color: "text-teal-400 bg-teal-400/10 border-teal-400/30" },
  { value: "frustrated", label: "Frustrated", icon: Frown, color: "text-orange-500 bg-orange-500/10 border-orange-500/30" },
  { value: "greedy", label: "Greedy", icon: HandCoins, color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/30" },
  { value: "patient", label: "Patient", icon: Clock, color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/30" },
  { value: "fearful", label: "Fearful", icon: Brain, color: "text-purple-400 bg-purple-400/10 border-purple-400/30" },
] as const;

export const MISTAKES = [
  "Moved Stop Loss",
  "No Stop Loss",
  "Over-leveraged",
  "Chased Entry",
  "Exited Too Early",
  "Held Too Long",
  "Wrong Size",
  "Ignored Plan",
] as const;

export const SETUP_TYPES = [
  "Breakout",
  "Pullback",
  "Reversal",
  "Range",
  "Trend Following",
  "Scalp",
  "Swing",
  "News Play",
] as const;

interface TradeTagsSectionProps {
  mentalState: string;
  onMentalStateChange: (value: string) => void;
  mistakes: string[];
  onMistakesChange: (value: string[]) => void;
  setupType: string;
  onSetupTypeChange: (value: string) => void;
}

export const TradeTagsSection = ({
  mentalState,
  onMentalStateChange,
  mistakes,
  onMistakesChange,
  setupType,
  onSetupTypeChange,
}: TradeTagsSectionProps) => {
  const toggleMistake = (mistake: string) => {
    onMistakesChange(
      mistakes.includes(mistake)
        ? mistakes.filter((m) => m !== mistake)
        : [...mistakes, mistake]
    );
  };

  return (
    <div className="space-y-4 p-4 bg-secondary/20 rounded-xl border border-border/50">
      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
        🏷️ תגיות
      </h4>

      {/* Mental State */}
      <div className="space-y-2">
        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Mental State</Label>
        <div className="flex flex-wrap gap-1.5">
          {MENTAL_STATES.map((state) => {
            const Icon = state.icon;
            const isSelected = mentalState === state.value;
            return (
              <button
                key={state.value}
                type="button"
                onClick={() => onMentalStateChange(isSelected ? "" : state.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200",
                  isSelected
                    ? `${state.color} scale-105 shadow-sm`
                    : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {state.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Setup Type */}
      <div className="space-y-2">
        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Setup Type</Label>
        <div className="flex flex-wrap gap-1.5">
          {SETUP_TYPES.map((setup) => {
            const isSelected = setupType === setup;
            return (
              <button
                key={setup}
                type="button"
                onClick={() => onSetupTypeChange(isSelected ? "" : setup)}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200",
                  isSelected
                    ? "bg-violet-500/10 text-violet-400 border-violet-500/30 scale-105 shadow-sm"
                    : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50"
                )}
              >
                {setup}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mistakes */}
      <div className="space-y-2">
        <Label className="text-muted-foreground text-xs uppercase tracking-wider">
          Mistakes {mistakes.length > 0 && `(${mistakes.length})`}
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {MISTAKES.map((mistake) => {
            const isSelected = mistakes.includes(mistake);
            return (
              <button
                key={mistake}
                type="button"
                onClick={() => toggleMistake(mistake)}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200",
                  isSelected
                    ? "bg-orange-500/10 text-orange-400 border-orange-500/30 scale-105 shadow-sm"
                    : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50"
                )}
              >
                {mistake}
                {isSelected && <X className="h-3 w-3 ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Helper to get mental state display info
export const getMentalStateInfo = (value: string) => {
  return MENTAL_STATES.find((s) => s.value === value);
};
