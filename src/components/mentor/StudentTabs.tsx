import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  MessageCircle, 
  Target, 
  Wallet, 
  MessageSquare, 
  FileText 
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface StudentTabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

export const StudentTabs = ({ value, onValueChange, children }: StudentTabsProps) => {
  const isMobile = useIsMobile();

  const tabs = [
    { value: "trades", icon: TrendingUp, label: "עסקאות", color: "text-blue-500" },
    { value: "chat", icon: MessageCircle, label: "צ'אט", color: "text-green-500" },
    { value: "strategies", icon: Target, label: "אסטרטגיות", color: "text-purple-500" },
    { value: "portfolios", icon: Wallet, label: "תיקים", color: "text-amber-500" },
    { value: "feedback", icon: MessageSquare, label: "משוב", color: "text-pink-500" },
    { value: "notes", icon: FileText, label: "הערות", color: "text-cyan-500" },
  ];

  return (
    <Tabs value={value} onValueChange={onValueChange} dir="rtl">
      <div className="relative">
        <TabsList className={`
          ${isMobile 
            ? 'flex overflow-x-auto scrollbar-hide gap-1.5 w-full justify-start pb-1 px-1' 
            : 'grid w-full grid-cols-6 gap-1'
          } 
          h-auto min-h-[52px] bg-muted/30 p-1.5 rounded-2xl border border-border/50 backdrop-blur-sm
        `}>
          {tabs.map((tab) => {
            const isActive = value === tab.value;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={`
                  flex items-center gap-2 whitespace-nowrap relative
                  ${isMobile ? 'flex-shrink-0 px-4 py-2.5' : 'py-3 px-2'}
                  ${isActive 
                    ? 'bg-card shadow-lg border border-border text-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }
                  rounded-xl transition-all duration-300
                  data-[state=active]:shadow-md
                `}
              >
                <tab.icon className={`h-4 w-4 transition-colors ${isActive ? tab.color : ''}`} />
                <span className={`${isMobile ? 'text-xs font-medium' : 'text-sm font-medium'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>
      {children}
    </Tabs>
  );
};