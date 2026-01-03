import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const ENTRY_REASON_TEMPLATES = [
  "פריצת רמת התנגדות",
  "פריצת רמת תמיכה",
  "ריטסט לאזור ביקוש",
  "ריטסט לאזור היצע",
  "אישור נר יפני",
  "דיברגנס RSI",
  "כניסה עם המגמה",
  "פריצת קו מגמה",
  "חזרה לממוצע נע",
  "אות מ-VWAP",
  "תבנית דאבל בוטום",
  "תבנית דאבל טופ",
  "מומנטום חזק",
  "הודעה כלכלית",
];

const CONCLUSIONS_TEMPLATES = [
  "ביצוע מדויק לפי התוכנית",
  "יציאה מוקדמת מדי - לשפר סבלנות",
  "יציאה מאוחרת מדי - לכבד את הטייק",
  "הסטופ היה רחוק מדי",
  "הסטופ היה קרוב מדי",
  "ניהול סיכונים טוב",
  "לא המתנתי לאישור",
  "נכנסתי באימפולס",
  "נכנסתי נגד המגמה",
  "עסקה לפי התוכנית - תוצאה לא רלוונטית",
  "צריך לשפר את הכניסה",
  "תזמון מעולה",
  "לא עקבתי אחרי הכללים",
  "עבודה טובה על ניהול הפוזיציה",
];

interface TemplateSelectorProps {
  type: "entry" | "conclusions";
  onSelect: (template: string) => void;
  className?: string;
}

export const TemplateSelector = ({ type, onSelect, className }: TemplateSelectorProps) => {
  const templates = type === "entry" ? ENTRY_REASON_TEMPLATES : CONCLUSIONS_TEMPLATES;
  const title = type === "entry" ? "תבניות סיבות כניסה" : "תבניות מסקנות";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 text-muted-foreground hover:text-primary", className)}
          title={title}
        >
          <FileText className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-2 bg-popover border-border max-h-64 overflow-y-auto" 
        align="start"
        side="top"
      >
        <p className="text-xs text-muted-foreground mb-2 px-2">{title}</p>
        <div className="space-y-1">
          {templates.map((template, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onSelect(template)}
              className="w-full text-right px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors"
            >
              {template}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
