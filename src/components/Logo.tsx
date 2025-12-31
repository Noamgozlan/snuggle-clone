import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const Logo = ({ className, size = "md" }: LogoProps) => {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <div className={cn("font-heebo font-bold", sizeClasses[size], className)}>
      <span className="text-gradient">Gozlan</span>
      <span className="text-foreground">Journal</span>
    </div>
  );
};
