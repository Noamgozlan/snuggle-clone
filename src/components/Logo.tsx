import { cn } from "@/lib/utils";
import logoImage from "@/assets/logo.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const Logo = ({ className, size = "md" }: LogoProps) => {
  const sizeClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-14",
  };

  return (
    <img 
      src={logoImage} 
      alt="GozlanJournal" 
      className={cn(sizeClasses[size], "w-auto object-contain", className)}
    />
  );
};
