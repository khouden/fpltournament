"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Container } from "@/components/layout/container";

export interface SecondaryNavItem {
  label: string;
  href: string;
  count?: number;
}

export function SecondaryNavigation({
  items,
  className,
}: {
  items: SecondaryNavItem[];
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "w-full bg-white border-b border-[#E5E5E5] sticky top-[64px] z-30 shadow-xs",
        className
      )}
    >
      <Container>
        <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto no-scrollbar py-2">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative py-2.5 px-3 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors rounded-[6px]",
                  isActive
                    ? "text-[#37003C] bg-[#EEEEEE]"
                    : "text-[#555555] hover:text-[#1F1F1F] hover:bg-[#F7F7F7]"
                )}
              >
                <span>{item.label}</span>
                {typeof item.count === "number" && (
                  <span
                    className={cn(
                      "ml-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold",
                      isActive
                        ? "bg-[#37003C] text-white"
                        : "bg-[#EEEEEE] text-[#555555]"
                    )}
                  >
                    {item.count}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#E9007F] rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </Container>
    </div>
  );
}
