import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface FplLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  href?: string;
  className?: string;
}

export function FplLogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-9 h-9 shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="shieldGrad" x1="6" y1="6" x2="38" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00FFA3" />
          <stop offset="0.5" stopColor="#00D9FF" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="crownGrad" x1="10" y1="4" x2="34" y2="14" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5EEAD4" />
          <stop offset="0.5" stopColor="#00FFA3" />
          <stop offset="1" stopColor="#10B981" />
        </linearGradient>
        <filter id="mintGlow" x="0" y="0" width="44" height="44" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer Shield Outline */}
      <path
        d="M22 40C22 40 35 33 35 19V11L22 7L9 11V19C9 33 22 40 22 40Z"
        fill="#0E0922"
        stroke="url(#shieldGrad)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Crown Top Crest */}
      <path
        d="M13 14L16 8L22 12L28 8L31 14"
        stroke="url(#crownGrad)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Floating Crown Dots / Jewels */}
      <circle cx="16" cy="6" r="1.5" fill="#00FFA3" />
      <circle cx="22" cy="5" r="1.8" fill="#5EEAD4" />
      <circle cx="28" cy="6" r="1.5" fill="#00FFA3" />

      {/* Inner Central Soccer Ball Medallion */}
      <circle cx="22" cy="24" r="7" stroke="#00FFA3" strokeWidth="1.8" fill="#12092B" />
      {/* Pentagon center of soccer ball */}
      <polygon
        points="22,21.5 24.5,23.3 23.5,26 20.5,26 19.5,23.3"
        fill="#00FFA3"
      />
      {/* Ball seam lines */}
      <line x1="22" y1="21.5" x2="22" y2="17" stroke="#00FFA3" strokeWidth="1.2" />
      <line x1="24.5" y1="23.3" x2="28" y2="22.5" stroke="#00FFA3" strokeWidth="1.2" />
      <line x1="23.5" y1="26" x2="26.5" y2="29" stroke="#00FFA3" strokeWidth="1.2" />
      <line x1="20.5" y1="26" x2="17.5" y2="29" stroke="#00FFA3" strokeWidth="1.2" />
      <line x1="19.5" y1="23.3" x2="16" y2="22.5" stroke="#00FFA3" strokeWidth="1.2" />
    </svg>
  );
}

export function FplLogo({
  size = "md",
  showText = true,
  href = "/",
  className,
}: FplLogoProps) {
  const content = (
    <div className={cn("inline-flex items-center gap-2.5 group cursor-pointer select-none", className)}>
      <div className="relative flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
        <FplLogoIcon
          className={cn(
            size === "sm" && "w-7 h-7",
            size === "md" && "w-9 h-9",
            size === "lg" && "w-11 h-11"
          )}
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
              size === "lg" && "text-xl font-black"
            )}
          >
            FPL
          </span>
          <span
            className={cn(
              "font-bold uppercase tracking-[0.14em] text-[#A69DC6] group-hover:text-[#00FFA3] transition-colors",
              size === "sm" && "text-[9px] tracking-wider",
              size === "md" && "text-[10px]",
              size === "lg" && "text-xs"
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
