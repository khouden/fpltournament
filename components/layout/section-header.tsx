import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  align?: "left" | "center";
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-8 sm:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4",
        align === "center" && "text-center md:flex-col md:items-center",
        className
      )}
      {...props}
    >
      <div className={cn("space-y-1.5", align === "center" ? "max-w-2xl mx-auto" : "max-w-xl")}>
        {eyebrow && (
          <div className="text-xs font-bold uppercase tracking-wider text-[#E9007F]">
            {eyebrow}
          </div>
        )}
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-inherit">
          {title}
        </h2>
        {description && (
          <p className="text-sm sm:text-base text-[#777777] leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
