import { Bell, Sun, Moon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { PortfolioSelector } from "@/components/portfolio/PortfolioSelector";
import { ConsistencyCalculator } from "@/components/portfolio/ConsistencyCalculator";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface DashboardHeaderProps {
  title?: string;
}

export const DashboardHeader = ({ title }: DashboardHeaderProps) => {
  const { theme, toggleTheme } = useTheme();
  const { isInstalled, promptInstall } = usePWAInstall();
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [quote, setQuote] = useState<{ content: string; author: string | null } | null>(null);

  useEffect(() => {
    const fetchQuote = async () => {
      const { data } = await supabase
        .from("admin_quotes" as any)
        .select("content, author")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data && (data as any).content) {
        setQuote({ content: (data as any).content, author: (data as any).author });
      }
    };
    fetchQuote();
  }, []);

  const handleInstallClick = () => {
    setShowInstallDialog(true);
  };

  const handleConfirmInstall = async () => {
    setShowInstallDialog(false);
    const success = await promptInstall();
    if (success) {
      toast.success("האפליקציה הותקנה בהצלחה!");
    }
  };

  return (
    <>
      <header
        className="border-b border-border bg-card/60 backdrop-blur-xl sticky top-0 z-30"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex items-center justify-between h-12 md:h-14 px-3 md:px-6">
          {/* Left side - empty space for mobile menu button */}
          <div className="w-10 md:hidden" />
          
          <div className="flex items-center gap-2 md:gap-3">
            <div className="sm:hidden flex items-center gap-2">
              <PortfolioSelector />
              <ConsistencyCalculator />
            </div>
            {!isInstalled && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 min-h-[36px] px-2.5 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleInstallClick}
                aria-label="התקן אפליקציה"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">התקן</span>
              </Button>
            )}
          </div>

          {/* Quote or title */}
          {quote ? (
            <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground italic max-w-md truncate">
              <span className="opacity-70">"{quote.content}"</span>
              {quote.author && <span className="text-[10px] not-italic opacity-50">— {quote.author}</span>}
            </div>
          ) : (
            title && <h1 className="text-sm md:text-base font-semibold text-foreground hidden md:block tracking-tight">{title}</h1>
          )}

          <div className="flex items-center gap-1 md:gap-2">
            <div className="hidden sm:flex items-center gap-2">
              <PortfolioSelector />
              <ConsistencyCalculator />
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground" 
              aria-label="התראות"
            >
              <Bell className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
              onClick={toggleTheme}
              aria-label="החלף מצב תצוגה"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <AlertDialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>התקנת האפליקציה</AlertDialogTitle>
            <AlertDialogDescription>האם ברצונך להתקין את GozlanJournal כאפליקציה על המכשיר שלך?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmInstall}>התקן</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
