import * as React from "react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/layout/container";

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  breadcrumbs?: React.ReactNode;
  badge?: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  variant?: "default" | "purple" | "gradient";
}

export function PageHeader({
  breadcrumbs,
  badge,
  title,
  description,
  actions,
  variant = "default",
  className,
  ...props
}: PageHeaderProps) {
  const variantStyles = {
    default: "bg-white border-b border-[#E5E5E5] text-[#1F1F1F]",
    purple: "bg-[#37003C] text-white border-b border-[#5A0A63]",
    gradient: "bg-gradient-to-br from-[#37003C] via-[#240027] to-[#1a001c] text-white border-b border-[#5A0A63]/50",
  };

  return (
    <div
      className={cn("py-8 sm:py-12 relative overflow-hidden", variantStyles[variant], className)}
      {...props}
    >
      <Container>
        {breadcrumbs && <div className="mb-4">{breadcrumbs}</div>}

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            {badge && <div className="mb-2">{badge}</div>}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-inherit">
              {title}
            </h1>
            {description && (
              <p
                className={cn(
                  "text-sm sm:text-base leading-relaxed",
                  variant === "default" ? "text-[#555555]" : "text-white/80"
                )}
              >
                {description}
              </p>
            )}
          </div>

          {actions && <div className="flex flex-wrap items-center gap-3 shrink-0">{actions}</div>}
        </div>
      </Container>
    </div>
  );
}
