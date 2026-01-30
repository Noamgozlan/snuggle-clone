import { ReactNode, useEffect, useState } from "react";
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

  useEffect(() => {
    const body = document.body;
    body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-svh bg-background overflow-x-hidden">
      {/* Mobile menu button - fixed position with safe area */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-[max(0.75rem,env(safe-area-inset-top))] right-3 z-[60] md:hidden h-10 w-10 bg-card/80 backdrop-blur-sm border border-border shadow-lg"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="פתח תפריט"
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 h-svh transition-transform duration-300 ease-out md:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full md:translate-x-0",
        )}
        role="dialog"
        aria-modal="true"
      >
        <DashboardSidebar onNavigate={() => setIsMobileMenuOpen(false)} />
      </div>

      {/* Main content */}
      <div className="md:mr-64 overflow-x-hidden">
        <DashboardHeader title={title} />
        <main 
          className="px-3 py-4 md:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))] overflow-x-hidden max-w-full"
          style={{ paddingTop: "calc(1rem + env(safe-area-inset-top))" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
