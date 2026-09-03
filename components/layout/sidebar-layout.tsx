import * as React from "react";
import { cn } from "@/lib/utils";

export interface SidebarLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  sidebarPosition?: "left" | "right";
  stickySidebar?: boolean;
}

export function SidebarLayout({
  sidebar,
  children,
  sidebarPosition = "right",
  stickySidebar = true,
  className,
  ...props
}: SidebarLayoutProps) {
  return (
    <div
      className={cn("grid grid-cols-1 lg:grid-cols-12 gap-8 items-start", className)}
      {...props}
    >
      <div
        className={cn(
          "lg:col-span-8 w-full",
          sidebarPosition === "left" && "lg:order-2"
        )}
      >
        {children}
      </div>
      <aside
        className={cn(
          "lg:col-span-4 w-full",
          sidebarPosition === "left" && "lg:order-1",
          stickySidebar && "lg:sticky lg:top-20"
        )}
      >
        {sidebar}
      </aside>
    </div>
  );
}
