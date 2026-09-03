import * as React from "react";
import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-[8px] bg-[#EEEEEE]", className)}
      {...props}
    />
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[10px] border border-[#E5E5E5] bg-white p-5 space-y-4 shadow-fpl-sm",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <div className="pt-2 flex items-center gap-3">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}

export function PlayerCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[10px] border border-[#E5E5E5] bg-white p-4 space-y-3 shadow-fpl-sm w-full max-w-[240px]",
        className
      )}
    >
      <div className="flex justify-between items-start">
        <Skeleton className="h-7 w-7 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <Skeleton className="h-32 w-full rounded-[8px]" />
      <Skeleton className="h-5 w-3/4" />
      <div className="flex justify-between pt-1">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}

export function StatSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[10px] border border-[#E5E5E5] bg-white p-5 space-y-2 shadow-fpl-sm",
        className
      )}
    >
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-28" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function TableSkeleton({
  rows = 5,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full rounded-[10px] border border-[#E5E5E5] bg-white overflow-hidden shadow-fpl-sm",
        className
      )}
    >
      <div className="border-b border-[#E5E5E5] bg-[#F7F7F7] p-4 flex gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-32 flex-1" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="divide-y divide-[#EEEEEE] p-2 space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 px-2">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-40 flex-1" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-8 animate-fpl-fade-in py-8">
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </div>
      <TableSkeleton rows={6} />
    </div>
  );
}

export { Skeleton };
