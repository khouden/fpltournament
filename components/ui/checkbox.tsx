"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, checked, onChange, disabled, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="flex items-start gap-2.5">
        <div className="relative flex items-center justify-center pt-0.5">
          <input
            type="checkbox"
            id={inputId}
            ref={ref}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className={cn(
              "peer h-4 w-4 appearance-none rounded-[4px] border border-[#E5E5E5] bg-white transition-colors checked:border-[#37003C] checked:bg-[#37003C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#37003C] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
              className
            )}
            {...props}
          />
          <Check className="pointer-events-none absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
        </div>
        {(label || description) && (
          <label htmlFor={inputId} className="cursor-pointer select-none text-sm">
            {label && <div className="font-medium text-[#1F1F1F] leading-tight">{label}</div>}
            {description && (
              <p className="text-xs text-[#777777] leading-normal mt-0.5">{description}</p>
            )}
          </label>
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";
