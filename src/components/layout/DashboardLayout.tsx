import { ReactNode, useState } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Menu Button - positioned in header area, left side */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-4 z-[60] md:hidden h-8 w-8"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile, shown on desktop */}
      <div className={cn(
        "fixed right-0 top-0 z-50 transition-transform duration-300 md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
      )}>
        <DashboardSidebar onNavigate={() => setIsMobileMenuOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="md:mr-64">
        <DashboardHeader title={title} />
        <main className="p-3 md:p-6">{children}</main>
      </div>
    </div>
  );
};
