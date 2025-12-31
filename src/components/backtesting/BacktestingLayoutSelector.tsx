import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LayoutGrid, Columns2, Rows2, Square } from "lucide-react";

interface BacktestingLayoutSelectorProps {
  layout: "1" | "2h" | "2v" | "4";
  onLayoutChange: (layout: "1" | "2h" | "2v" | "4") => void;
}

export const BacktestingLayoutSelector = ({
  layout,
  onLayoutChange,
}: BacktestingLayoutSelectorProps) => {
  const layouts = [
    { value: "1" as const, icon: Square, label: "גרף יחיד" },
    { value: "2h" as const, icon: Columns2, label: "2 גרפים אופקי" },
    { value: "2v" as const, icon: Rows2, label: "2 גרפים אנכי" },
    { value: "4" as const, icon: LayoutGrid, label: "4 גרפים" },
  ];

  return (
    <div className="flex items-center gap-1 border rounded-lg p-1">
      {layouts.map(({ value, icon: Icon, label }) => (
        <Tooltip key={value}>
          <TooltipTrigger asChild>
            <Button
              variant={layout === value ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => onLayoutChange(value)}
            >
              <Icon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
};
