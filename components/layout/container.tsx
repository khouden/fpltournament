import * as React from "react";
import { cn } from "@/lib/utils";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "default" | "large" | "narrow" | "full";
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = "default", ...props }, ref) => {
    const sizeClasses = {
      default: "max-w-[1280px]", // Desktop max-width: 1280px
      large: "max-w-[1400px]",   // Large desktop max-width: 1400px
      narrow: "max-w-[1024px]",  // Reading / form width
      full: "max-w-full",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "mx-auto w-full px-4 sm:px-6 lg:px-8",
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Container.displayName = "Container";
