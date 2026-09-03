"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  onRetry?: () => void;
  errorDetails?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "We encountered an unexpected error while loading this data. Please try again.",
  onRetry,
  errorDetails,
  className,
  ...props
}: ErrorStateProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[12px] border border-[#E9007F]/20 bg-white p-8 sm:p-10 text-center shadow-xs",
        className
      )}
      {...props}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E9007F]/10 text-[#E9007F] mb-4 ring-8 ring-[#E9007F]/5">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-bold text-[#1F1F1F] mb-2">{title}</h3>
      <p className="max-w-md text-sm text-[#777777] mb-6 leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <Button variant="accent" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      )}

      {errorDetails && (
        <div className="mt-6 w-full max-w-md text-left">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-xs font-semibold text-[#777777] hover:text-[#1F1F1F] transition cursor-pointer mx-auto"
          >
            <span>{showDetails ? "Hide" : "Show"} details</span>
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform", showDetails && "rotate-180")}
            />
          </button>
          {showDetails && (
            <pre className="mt-2 rounded-[6px] bg-[#F7F7F7] border border-[#E5E5E5] p-3 text-[11px] font-mono text-[#555555] overflow-x-auto whitespace-pre-wrap">
              {errorDetails}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
