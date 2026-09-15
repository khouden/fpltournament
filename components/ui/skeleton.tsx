import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
  dark?: boolean;
}

function Skeleton({
  className,
  shimmer = true,
  dark = false,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-[8px]",
        dark
          ? shimmer
            ? "animate-shimmer-dark bg-white/10"
            : "animate-pulse bg-white/10"
          : shimmer
          ? "animate-shimmer bg-slate-200"
          : "animate-pulse bg-[#EEEEEE]",
        className
      )}
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

export function TournamentCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-[20px] border border-[#E8ECF2] bg-white overflow-hidden shadow-[0_2px_12px_rgba(11,8,30,0.03)]",
        className
      )}
    >
      {/* Shimmering Banner */}
      <div className="h-36 sm:h-40 w-full animate-shimmer bg-slate-200" />

      {/* Card Content */}
      <div className="flex flex-1 flex-col justify-between p-5 sm:p-6 space-y-5">
        <div>
          {/* Title & Subtitle */}
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4 rounded-md" />
            <Skeleton className="h-3.5 w-1/2 rounded-md" />
          </div>

          {/* Progress bar */}
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-end">
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>

          {/* 3-Column Stats Row */}
          <div className="mt-4 grid grid-cols-3 gap-2 py-3 border-y border-gray-100">
            <div className="space-y-1">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>

          {/* Top 3 list */}
          <div className="mt-4 space-y-2.5">
            <Skeleton className="h-3.5 w-14" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-3.5 w-24 rounded-md" />
                  </div>
                  <Skeleton className="h-3.5 w-12 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function StandingsTableSkeleton({
  rows = 8,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full rounded-[20px] border border-[#E8ECF2] bg-white overflow-hidden shadow-xs",
        className
      )}
    >
      {/* Table Header */}
      <div className="border-b border-[#E8ECF2] bg-[#F8F9FA] px-6 py-4 flex items-center justify-between gap-4">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-40 flex-1" />
        <div className="hidden sm:flex items-center gap-6">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-8" />
        </div>
        <Skeleton className="h-4 w-14" />
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="px-6 py-3.5 flex items-center justify-between gap-4"
          >
            {/* Rank */}
            <Skeleton className="h-6 w-6 rounded-full shrink-0" />

            {/* Team Avatar & Name */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1 max-w-[200px]">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-3 w-2/3 rounded-md" />
              </div>
            </div>

            {/* Stats (P, W, D, L) */}
            <div className="hidden sm:flex items-center gap-6">
              <Skeleton className="h-4 w-6" />
              <Skeleton className="h-4 w-6" />
              <Skeleton className="h-4 w-6" />
              <Skeleton className="h-4 w-6" />
            </div>

            {/* Points */}
            <Skeleton className="h-6 w-14 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[16px] border border-[#E8ECF2] bg-white p-5 space-y-2 shadow-xs",
        className
      )}
    >
      <Skeleton className="h-3.5 w-20" />
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

export function PlayerCardSkeleton({ className }: { className?: string }) {
  return <CardSkeleton className={className} />;
}

export { Skeleton };
