import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#37003C] text-white hover:bg-[#5A0A63] shadow-sm",
        primary:
          "bg-[#37003C] text-white hover:bg-[#5A0A63] shadow-sm",
        fantasy:
          "bg-[#00FF87] text-[#37003C] hover:bg-[#E7FF00] font-bold shadow-sm",
        neon:
          "bg-[#00FFA3] text-[#0B081E] font-extrabold hover:bg-[#00E592] hover:shadow-[0_0_24px_rgba(0,255,163,0.45)] rounded-full transition-all duration-200",
        glass:
          "bg-white/[0.07] text-white hover:bg-white/[0.14] border border-white/20 rounded-full backdrop-blur-md transition-all duration-200",
        darkPill:
          "bg-[#12092B] text-white hover:bg-[#1C0F3F] border border-transparent rounded-full font-bold transition-all duration-200",
        outlinePill:
          "border border-[#E2E8F0] bg-white text-[#0B081E] hover:bg-[#F8F9FD] rounded-full font-bold transition-all duration-200",
        accent:
          "bg-[#E9007F] text-white hover:bg-[#d00072] font-semibold shadow-sm",
        destructive:
          "bg-[#E9007F] text-white hover:bg-[#d00072] shadow-sm",
        outline:
          "border border-[#E5E5E5] bg-white text-[#1F1F1F] hover:bg-[#F7F7F7] shadow-xs",
        secondary:
          "bg-[#F4F4F5] text-[#18181B] hover:bg-[#E5E5E5] shadow-xs",
        ghost:
          "text-[#1F1F1F] hover:bg-[#F4F4F5]",
        link:
          "text-[#37003C] underline-offset-4 hover:underline p-0 h-auto",
        subtle:
          "bg-white/10 text-white hover:bg-white/20 border border-white/10",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        pill: "h-11 px-6 text-sm rounded-full",
        "pill-lg": "h-13 px-8 text-base rounded-full",
        icon: "h-10 w-10 p-0",
        "icon-sm": "h-8 w-8 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, children, disabled, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
