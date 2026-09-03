import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-[8px] border border-[#E5E5E5] bg-white px-3.5 py-2 text-sm text-[#1F1F1F] shadow-xs transition-colors placeholder:text-[#777777] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#37003C] focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
