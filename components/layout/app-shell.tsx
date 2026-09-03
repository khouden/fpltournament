import * as React from "react";
import { Header } from "@/components/navigation/header";
import { Footer } from "@/components/layout/footer";
import { cn } from "@/lib/utils";

export interface AppShellProps {
  children: React.ReactNode;
  secondaryNav?: React.ReactNode;
  className?: string;
  hideFooter?: boolean;
}

export function AppShell({
  children,
  secondaryNav,
  className,
  hideFooter = false,
}: AppShellProps) {
  return (
    <div className={cn("min-h-screen flex flex-col bg-[#F7F7F7] text-[#1F1F1F]", className)}>
      <Header />
      {secondaryNav}
      <div className="flex-1 flex flex-col">{children}</div>
      {!hideFooter && <Footer />}
    </div>
  );
}
