import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  size?: "sm" | "md" | "lg";
  fullscreen?: boolean;
}

export function LoadingState({
  message = "Loading live tournament data...",
  size = "md",
  fullscreen = false,
  className,
  ...props
}: LoadingStateProps) {
  const spinnerSizes = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center space-y-3 animate-fpl-fade-in",
        className
      )}
      {...props}
    >
      <div className="relative flex items-center justify-center">
        <Loader2
          className={cn(
            "animate-spin text-[#37003C]",
            spinnerSizes[size]
          )}
        />
      </div>
      {message && (
        <p className="text-sm font-semibold text-[#555555] tracking-wide">
          {message}
        </p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-xs">
        {content}
      </div>
    );
  }

  return content;
}
