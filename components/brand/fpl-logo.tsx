import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface FplLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  href?: string;
  className?: string;
  priority?: boolean;
}

export function FplLogoIcon({
  className,
  size = 48,
  priority = false,
}: {
  className?: string;
  size?: number;
  priority?: boolean;
}) {
  return (
    <div className={cn("relative shrink-0 flex items-center justify-center", className)}>
      <Image
        src="/logo.png"
        alt="Platform Logo"
        width={size}
        height={size}
        priority={priority}
        className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(0,255,163,0.25)]"
      />
    </div>
  );
}

export function FplLogo({
  size = "md",
  showText = true,
  href = "/",
  className,
  priority = false,
}: FplLogoProps) {
  const iconDimensions = {
    sm: { box: "w-8 h-8 sm:w-9 sm:h-9", px: 36 },
    md: { box: "w-10 h-10 sm:w-11 sm:h-11", px: 44 },
    lg: { box: "w-12 h-12 sm:w-14 sm:h-14", px: 56 },
    xl: { box: "w-16 h-16 sm:w-20 sm:h-20", px: 80 },
  }[size];

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 sm:gap-3 group cursor-pointer select-none", className)}>
      <div className="relative flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
        <FplLogoIcon
          className={iconDimensions.box}
          size={iconDimensions.px}
          priority={priority}
        />
        {/* Ambient glow behind icon */}
        <div className="absolute inset-0 bg-[#00FFA3]/20 rounded-full blur-md -z-10 group-hover:bg-[#00FFA3]/35 transition-all" />
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={cn(
              "font-extrabold tracking-tight text-white transition-colors group-hover:text-white",
              size === "sm" && "text-sm",
              size === "md" && "text-base font-black tracking-tight",
              size === "lg" && "text-xl font-black",
              size === "xl" && "text-2xl font-black"
            )}
          >
            FPL
          </span>
          <span
            className={cn(
              "font-bold uppercase tracking-[0.14em] text-[#A69DC6] group-hover:text-[#00FFA3] transition-colors",
              size === "sm" && "text-[9px] tracking-wider",
              size === "md" && "text-[10px]",
              size === "lg" && "text-xs",
              size === "xl" && "text-sm"
            )}
          >
            TOURNAMENTS
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}
