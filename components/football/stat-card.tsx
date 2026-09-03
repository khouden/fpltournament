import * as React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  trend?: {
    value: string | number;
    direction: "up" | "down" | "neutral";
    label?: string;
  };
  icon?: React.ReactNode;
  variant?: "default" | "purple" | "fantasy" | "subtle";
  subtext?: string;
}

export function StatCard({
  label,
  value,
  trend,
  icon,
  variant = "default",
  subtext,
  className,
  ...props
}: StatCardProps) {
  const isPurple = variant === "purple";
  const isFantasy = variant === "fantasy";

  return (
    <Card
      variant={variant === "subtle" ? "subtle" : variant === "purple" ? "purple" : "default"}
      className={cn(
        "p-5 flex flex-col justify-between space-y-3",
        isFantasy && "border-[#00FF87]/30 bg-gradient-to-br from-[#37003C] to-[#1e0021] text-white shadow-fpl-glow-green",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-xs font-bold uppercase tracking-wider",
            isPurple || isFantasy ? "text-gray-300" : "text-[#777777]"
          )}
        >
          {label}
        </span>
        {icon && (
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-[8px]",
              isPurple || isFantasy
                ? "bg-white/10 text-[#00FF87]"
                : "bg-[#EEEEEE] text-[#37003C]"
            )}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-inherit">
          {value}
        </div>

        {(trend || subtext) && (
          <div className="flex items-center gap-2 pt-0.5 text-xs">
            {trend && (
              <div
                className={cn(
                  "inline-flex items-center gap-0.5 font-bold font-mono",
                  trend.direction === "up" && "text-[#00a859]",
                  trend.direction === "down" && "text-[#E9007F]",
                  trend.direction === "neutral" && "text-[#777777]"
                )}
              >
                {trend.direction === "up" && <TrendingUp className="h-3.5 w-3.5" />}
                {trend.direction === "down" && <TrendingDown className="h-3.5 w-3.5" />}
                {trend.direction === "neutral" && <Minus className="h-3.5 w-3.5" />}
                <span>{trend.value}</span>
                {trend.label && (
                  <span className="font-normal text-[#777777] ml-0.5">
                    {trend.label}
                  </span>
                )}
              </div>
            )}
            {subtext && !trend && (
              <span className={isPurple || isFantasy ? "text-gray-300" : "text-[#777777]"}>
                {subtext}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
