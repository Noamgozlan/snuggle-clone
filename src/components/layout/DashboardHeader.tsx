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
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-4">
          <Logo size="sm" />
        </div>
        
        {title && (
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        )}

        <div className="flex items-center gap-3">
          <PortfolioSelector />
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};
