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
