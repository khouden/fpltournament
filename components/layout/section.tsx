import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  variant?: "default" | "surface" | "muted" | "purple" | "gradient" | "dark";
  spacing?: "default" | "compact" | "hero" | "none";
}

export const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, variant = "default", spacing = "default", ...props }, ref) => {
    const variantStyles = {
      default: "bg-transparent text-[#1F1F1F]",
      surface: "bg-white text-[#1F1F1F] border-y border-[#EEEEEE]",
      muted: "bg-[#F7F7F7] text-[#1F1F1F]",
      purple: "bg-[#37003C] text-white",
      gradient: "bg-gradient-to-br from-[#37003C] to-[#240027] text-white",
      dark: "bg-[#18001a] text-white",
    };

    const spacingStyles = {
      none: "py-0",
      compact: "py-6 sm:py-8",
      default: "py-12 sm:py-16 lg:py-20", // 48px - 80px
      hero: "py-20 sm:py-24 lg:py-28",     // 80px - 112px
    };

    return (
      <section
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden",
          variantStyles[variant],
          spacingStyles[spacing],
          className
        )}
        {...props}
      />
    );
  }
);
Section.displayName = "Section";
