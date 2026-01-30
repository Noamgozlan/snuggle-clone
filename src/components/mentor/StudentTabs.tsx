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
    { value: "trades", icon: TrendingUp, label: "עסקאות" },
    { value: "chat", icon: MessageCircle, label: "צ'אט" },
    { value: "strategies", icon: Target, label: "אסטרטגיות" },
    { value: "portfolios", icon: Wallet, label: "תיקים" },
    { value: "feedback", icon: MessageSquare, label: "משוב" },
    { value: "notes", icon: FileText, label: "הערות" },
  ];

  return (
    <Tabs value={value} onValueChange={onValueChange} dir="rtl">
      <div className="relative">
        <TabsList className={`
          ${isMobile 
            ? 'flex overflow-x-auto scrollbar-hide gap-1 w-full justify-start pb-1' 
            : 'grid w-full grid-cols-6'
          } 
          h-auto min-h-[44px] bg-muted/50 p-1 rounded-xl
        `}>
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={`
                flex items-center gap-1.5 whitespace-nowrap
                ${isMobile ? 'flex-shrink-0 px-3 py-2' : 'py-2.5'}
                data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                rounded-lg transition-all
              `}
            >
              <tab.icon className="h-4 w-4" />
              <span className={isMobile ? 'text-xs' : 'text-sm hidden sm:inline'}>
                {tab.label}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {children}
    </Tabs>
  );
};
