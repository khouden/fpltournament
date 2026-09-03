import * as React from "react";
import { cn } from "@/lib/utils";

export interface GradientBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "purple" | "fantasyPrimary" | "dark" | "bright" | "magenta";
  blur?: boolean;
}

export function GradientBackground({
  variant = "purple",
  blur = false,
  className,
  children,
  ...props
}: GradientBackgroundProps) {
  const gradients = {
    purple: "bg-fpl-gradient-purple",
    fantasyPrimary: "bg-fpl-gradient-primary",
    dark: "bg-fpl-gradient-dark",
    bright: "bg-fpl-gradient-bright",
    magenta: "bg-fpl-gradient-magenta",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        gradients[variant],
        blur && "backdrop-blur-md",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
