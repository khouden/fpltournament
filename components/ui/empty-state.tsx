import * as React from "react";
import { FolderSearch, Trophy, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  preset?: "players" | "fixtures" | "leagues" | "search" | "default";
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  preset = "default",
  className,
  ...props
}: EmptyStateProps) {
  const defaultIcons = {
    default: <FolderSearch className="h-8 w-8 text-[#37003C]" />,
    players: <Users className="h-8 w-8 text-[#37003C]" />,
    fixtures: <Trophy className="h-8 w-8 text-[#37003C]" />,
    leagues: <Trophy className="h-8 w-8 text-[#00a859]" />,
    search: <FolderSearch className="h-8 w-8 text-[#E9007F]" />,
  };

  const renderedIcon = icon || defaultIcons[preset];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[12px] border border-dashed border-[#E5E5E5] bg-white p-8 sm:p-12 text-center shadow-xs",
        className
      )}
      {...props}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EEEEEE]/70 mb-4 ring-8 ring-[#F7F7F7]">
        {renderedIcon}
      </div>
      <h3 className="text-lg font-bold text-[#1F1F1F] mb-1.5">{title}</h3>
      <p className="max-w-md text-sm text-[#777777] mb-6 leading-relaxed">
        {description}
      </p>

      {actionLabel && (
        <>
          {actionHref ? (
            <Button asChild variant="primary">
              <a href={actionHref}>
                {actionLabel}
                <ArrowRight className="h-4 w-4 ml-1" />
              </a>
            </Button>
          ) : (
            <Button variant="primary" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
