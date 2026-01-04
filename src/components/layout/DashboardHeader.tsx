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
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
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
      <header className="h-14 md:h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center justify-between h-full px-3 md:px-6">
          <div className="flex items-center gap-4">
            {/* Install App Button - Always visible */}
            {!isInstalled && (
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={handleInstallClick}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">התקן אפליקציה</span>
              </Button>
            )}
          </div>
          
          {title && (
            <h1 className="text-lg md:text-xl font-semibold text-foreground hidden md:block">{title}</h1>
          )}

          <div className="flex items-center gap-2 md:gap-3 mr-auto md:mr-0">
            <div className="hidden sm:block">
              <PortfolioSelector />
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10">
              <Bell className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10" onClick={toggleTheme}>
              {theme === "dark" ? (
                <Sun className="h-4 w-4 md:h-5 md:w-5" />
              ) : (
                <Moon className="h-4 w-4 md:h-5 md:w-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Install App Dialog */}
      <AlertDialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>התקנת האפליקציה</AlertDialogTitle>
            <AlertDialogDescription>
              האם ברצונך להתקין את GozlanJournal כאפליקציה על המכשיר שלך? 
              תוכל לגשת אליה מהמסך הראשי ללא צורך בדפדפן.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmInstall}>
              התקן
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
