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
    <div className="min-h-svh bg-background">
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 right-4 z-[60] md:hidden h-8 w-8"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="פתח תפריט"
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div
        className={cn(
          "fixed right-0 top-0 z-50 h-svh transition-transform duration-300 md:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full md:translate-x-0",
        )}
        role="dialog"
        aria-modal="true"
      >
        <DashboardSidebar onNavigate={() => setIsMobileMenuOpen(false)} />
      </div>

      <div className="md:mr-64">
        <DashboardHeader title={title} />
        <main className="p-3 md:p-6">{children}</main>
      </div>
    </div>
  );
};
