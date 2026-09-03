"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  href: string;
  badge?: string;
  isExternal?: boolean;
}

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: "Tournaments", href: "/tournaments" },
  { label: "Scoring Rules", href: "/#scoring-rules" },
  { label: "Design System", href: "/design-system", badge: "UI" },
  { label: "Admin Portal", href: "/admin" },
];

export function PrimaryNavigation({
  items = DEFAULT_NAV_ITEMS,
  className,
}: {
  items?: NavItem[];
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex items-center gap-1", className)} aria-label="Primary Navigation">
      {items.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href) && item.href !== "/#scoring-rules";

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative px-3.5 py-2 text-sm font-bold tracking-tight transition-colors rounded-[6px] inline-flex items-center gap-1.5 cursor-pointer",
              isActive
                ? "text-white bg-white/10 shadow-xs"
                : "text-white/80 hover:text-white hover:bg-white/5"
            )}
          >
            <span>{item.label}</span>
            {item.badge && (
              <span className="rounded-full bg-[#E7FF00] text-[#37003C] px-1.5 py-0.2 text-[10px] font-extrabold leading-none">
                {item.badge}
              </span>
            )}
            {/* Active lime underline indicator */}
            {isActive && (
              <span className="absolute bottom-0 left-3 right-3 h-[3px] rounded-full bg-[#00FF87]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
