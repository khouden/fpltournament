"use client";

import * as React from "react";
import { X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  onReset?: () => void;
  children: React.ReactNode;
  activeCount?: number;
}

export function FilterPanel({
  isOpen,
  onClose,
  title = "Filter & Sort",
  onReset,
  children,
  activeCount = 0,
}: FilterPanelProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="bg-white w-full sm:max-w-md p-6 flex flex-col justify-between">
        <div className="space-y-6">
          <SheetHeader className="text-left pb-4 border-b border-[#E5E5E5] flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-lg font-bold text-[#1F1F1F]">{title}</SheetTitle>
              {activeCount > 0 && (
                <span className="rounded-full bg-[#37003C] text-white font-mono text-[10px] font-bold px-2 py-0.5">
                  {activeCount} active
                </span>
              )}
            </div>
            {onReset && activeCount > 0 && (
              <button
                type="button"
                onClick={onReset}
                className="flex items-center gap-1 text-xs font-semibold text-[#E9007F] hover:underline cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                Reset all
              </button>
            )}
          </SheetHeader>

          <div className="space-y-6 py-2">{children}</div>
        </div>

        <div className="pt-4 border-t border-[#E5E5E5] flex items-center gap-3">
          <Button variant="primary" className="w-full" onClick={onClose}>
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function DesktopFilterBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("p-4 bg-white flex flex-wrap items-center gap-3 shadow-xs", className)}>
      {children}
    </Card>
  );
}
