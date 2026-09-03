"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  bordered?: boolean;
}

const sizeClasses = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-xl",
};

const dimensionMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt = "Avatar", fallback = "FPL", size = "md", bordered = false, className, ...props }, ref) => {
    const [hasError, setHasError] = React.useState(false);

    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold select-none bg-gradient-to-br from-[#37003C] to-[#5A0A63] text-white",
          sizeClasses[size],
          bordered && "ring-2 ring-white shadow-xs",
          className
        )}
        {...props}
      >
        {src && !hasError ? (
          <Image
            src={src}
            alt={alt}
            width={dimensionMap[size]}
            height={dimensionMap[size]}
            className="h-full w-full object-cover"
            onError={() => setHasError(true)}
          />
        ) : (
          <span className="uppercase tracking-wider">{fallback.slice(0, 3)}</span>
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";
