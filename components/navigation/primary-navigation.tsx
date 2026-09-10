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
  { label: "Home", href: "/" },
  { label: "Tournaments", href: "/tournaments" },
  { label: "How it works", href: "/#how-it-works" },
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
    <nav className={cn("flex items-center gap-2", className)} aria-label="Primary Navigation">
      {items.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href) && item.href !== "/#how-it-works";

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative px-4 py-2 text-sm font-semibold tracking-tight transition-colors inline-flex items-center gap-1.5 cursor-pointer",
              isActive
                ? "text-white font-bold"
                : "text-[#A69DC6] hover:text-white"
            )}
          >
            <span>{item.label}</span>
            {item.badge && (
              <span className="rounded-full bg-[#00FFA3] text-[#0B081E] px-1.5 py-0.2 text-[10px] font-extrabold leading-none">
                {item.badge}
              </span>
            )}
            {/* Active neon mint pill underline indicator */}
            {isActive && (
              <span className="absolute -bottom-1 left-4 right-4 h-[3px] rounded-full bg-[#00FFA3] shadow-[0_0_8px_rgba(0,255,163,0.8)]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
