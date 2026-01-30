import { Bell, Sun, Moon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { PortfolioSelector } from "@/components/portfolio/PortfolioSelector";
import { usePWAInstall } from "@/hooks/usePWAInstall";
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
import { useState } from "react";
import { toast } from "sonner";

interface DashboardHeaderProps {
  title?: string;
}

export const DashboardHeader = ({ title }: DashboardHeaderProps) => {
  const { theme, toggleTheme } = useTheme();
  const { isInstalled, promptInstall } = usePWAInstall();
  const [showInstallDialog, setShowInstallDialog] = useState(false);

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
        className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex items-center justify-between h-14 md:h-16 px-3 md:px-6">
          {/* Left side - empty space for mobile menu button */}
          <div className="w-10 md:hidden" />
          
          <div className="flex items-center gap-2 md:gap-4">
            <div className="sm:hidden">
              <PortfolioSelector />
            </div>
            {!isInstalled && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 min-h-[40px] px-3 text-xs"
                onClick={handleInstallClick}
                aria-label="התקן אפליקציה"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">התקן אפליקציה</span>
              </Button>
            )}
          </div>

          {title && <h1 className="text-base md:text-xl font-semibold text-foreground hidden md:block">{title}</h1>}

          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden sm:block">
              <PortfolioSelector />
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-full" 
              aria-label="התראות"
            >
              <Bell className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={toggleTheme}
              aria-label="החלף מצב תצוגה"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
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
