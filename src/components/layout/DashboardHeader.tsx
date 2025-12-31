import { Bell, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useTheme } from "@/contexts/ThemeContext";
import { PortfolioSelector } from "@/components/portfolio/PortfolioSelector";

interface DashboardHeaderProps {
  title?: string;
}

export const DashboardHeader = ({ title }: DashboardHeaderProps) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-14 md:h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center justify-between h-full px-3 md:px-6">
        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <Logo size="sm" />
          </div>
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
  );
};
