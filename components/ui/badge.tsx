import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#37003C] text-white shadow hover:bg-[#5A0A63]",
        purple:
          "border-transparent bg-[#37003C] text-white shadow hover:bg-[#5A0A63]",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-[#E9007F] text-white shadow hover:bg-[#d00072]",
        accent:
          "border-transparent bg-[#E9007F] text-white shadow hover:bg-[#d00072]",
        outline:
          "text-[#1F1F1F] border-[#E5E5E5] bg-white",
        success:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        warning:
          "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        subtle:
          "border-white/10 bg-white/10 text-gray-200",
        fantasy:
          "border-transparent bg-[#00FF87] text-[#37003C] font-bold shadow-xs",
        lime:
          "border-transparent bg-[#E7FF00] text-[#37003C] font-bold shadow-xs",
        cyan:
          "border-transparent bg-[#00D9FF] text-[#37003C] font-bold shadow-xs",
        live:
          "border-transparent bg-[#E9007F] text-white font-black tracking-wider uppercase shadow-xs",
        upcoming:
          "border-[#1689E8]/30 bg-[#1689E8]/10 text-[#1689E8] font-semibold",
        completed:
          "border-[#777777]/30 bg-[#777777]/10 text-[#555555] font-semibold",
        locked:
          "border-[#BDBDBD] bg-[#F4F4F5] text-[#777777] font-semibold",
        captain:
          "border-[#37003C]/20 bg-[#E7FF00] text-[#37003C] font-black shadow-xs",
        viceCaptain:
          "border-[#37003C]/20 bg-[#00D9FF] text-[#37003C] font-black shadow-xs",
        transferIn:
          "border-[#00FF87]/40 bg-[#00FF87]/15 text-[#008f4c] font-bold",
        transferOut:
          "border-[#E9007F]/40 bg-[#E9007F]/15 text-[#E9007F] font-bold",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.2 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
