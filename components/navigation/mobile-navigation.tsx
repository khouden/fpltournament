"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, ArrowRight, Shield, BookOpen, LayoutGrid, Palette } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
  const pathname = usePathname();

  const links = [
    { label: "Home", href: "/", icon: <Trophy className="h-4 w-4 text-[#00FF87]" /> },
    { label: "Tournaments", href: "/tournaments", icon: <LayoutGrid className="h-4 w-4 text-[#00D9FF]" /> },
    { label: "Scoring Rules", href: "/#scoring-rules", icon: <BookOpen className="h-4 w-4 text-[#E7FF00]" /> },
    { label: "Design System", href: "/design-system", icon: <Palette className="h-4 w-4 text-[#E9007F]" /> },
    { label: "Admin Portal", href: "/admin", icon: <Shield className="h-4 w-4 text-[#00FF87]" /> },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="left" className="bg-[#240027] text-white border-r border-[#37003C] p-6 flex flex-col justify-between">
        <div>
          <SheetHeader className="text-left pb-6 border-b border-[#37003C]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#00FF87] text-[#37003C]">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <SheetTitle className="text-lg font-black tracking-tight text-white leading-none">
                  FPL <span className="text-[#00FF87]">TOURNAMENTS</span>
                </SheetTitle>
                <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">
                  Fantasy Premier League
                </div>
              </div>
            </div>
          </SheetHeader>

          <nav className="mt-6 flex flex-col gap-1.5" aria-label="Mobile Navigation">
            {links.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href) && link.href !== "/#scoring-rules";

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-[8px] text-sm font-bold transition-colors",
                    isActive
                      ? "bg-[#37003C] text-white border-l-4 border-[#00FF87]"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-[#37003C] space-y-3">
          <Button asChild variant="fantasy" className="w-full justify-between" onClick={onClose}>
            <Link href="/tournaments">
              <span>Explore Tournaments</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <p className="text-[11px] text-center text-gray-400">
            Fantasy Premier League Knockout Engine
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
