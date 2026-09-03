import * as React from "react";
import { cn } from "@/lib/utils";

export interface ContentGridProps extends React.HTMLAttributes<HTMLDivElement> {
  layout?: "12" | "8-4" | "6-6" | "4-4-4" | "3-3-3-3" | "auto-fill" | "cards";
  gap?: "sm" | "md" | "lg";
}

export function ContentGrid({
  children,
  layout = "cards",
  gap = "md",
  className,
  ...props
}: ContentGridProps) {
  const gapClasses = {
    sm: "gap-3 sm:gap-4",
    md: "gap-4 sm:gap-6",
    lg: "gap-6 sm:gap-8",
  };

  const layoutClasses = {
    "12": "grid grid-cols-12",
    "8-4": "grid grid-cols-1 lg:grid-cols-12",
    "6-6": "grid grid-cols-1 md:grid-cols-2",
    "4-4-4": "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    "3-3-3-3": "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    "auto-fill": "grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))]",
    cards: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  };

  return (
    <div
      className={cn(layoutClasses[layout], gapClasses[gap], className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function GridMain({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("lg:col-span-8", className)} {...props}>
      {children}
    </div>
  );
}

export function GridSidebar({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("lg:col-span-4", className)} {...props}>
      {children}
    </div>
  );
}
