import { ReactNode } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="mr-64">
        <DashboardHeader title={title} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};
