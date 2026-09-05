"use client";

import Link from "next/link";
import {
  Trophy,
  Users,
  Calendar,
  Rocket,
  Check,
  ChevronRight,
} from "lucide-react";

export interface TournamentWizardStepperProps {
  currentStep: 1 | 2 | 3 | 4;
  tournamentId?: string;
  tournamentStatus?: "DRAFT" | "PUBLISHED" | "FINISHED";
  groupsCount?: number;
  roundsCount?: number;
  matchesCount?: number;
}

interface StepConfig {
  number: 1 | 2 | 3 | 4;
  title: string;
  shortTitle: string;
  description: string;
  icon: typeof Trophy;
  href: (id?: string) => string | null;
}

const STEPS: StepConfig[] = [
  {
    number: 1,
    title: "Tournament Details",
    shortTitle: "Details",
    description: "Name, season, banner & admins",
    icon: Trophy,
    href: (id) => (id ? `/admin/tournaments/${id}/edit` : `/admin/tournaments/new`),
  },
  {
    number: 2,
    title: "Add Groups & Teams",
    shortTitle: "Groups",
    description: "Import leagues & assign teams",
    icon: Users,
    href: (id) => (id ? `/admin/tournaments/${id}/groups?wizard=true` : null),
  },
  {
    number: 3,
    title: "Schedule & Fixtures",
    shortTitle: "Schedule",
    description: "Build rounds & match pairings",
    icon: Calendar,
    href: (id) => (id ? `/admin/tournaments/${id}/schedule?wizard=true` : null),
  },
  {
    number: 4,
    title: "Review & Publish",
    shortTitle: "Publish",
    description: "Pre-flight checks & go live",
    icon: Rocket,
    href: (id) => (id ? `/admin/tournaments/${id}/publish` : null),
  },
];

export function TournamentWizardStepper({
  currentStep,
  tournamentId,
  tournamentStatus = "DRAFT",
}: TournamentWizardStepperProps) {
  const isPublished = tournamentStatus === "PUBLISHED" || tournamentStatus === "FINISHED";

  return (
    <nav
      aria-label="Tournament Creation Progress"
      className="w-full bg-white rounded-[16px] border border-[#E5E5E5] p-3 sm:p-5 shadow-fpl-sm overflow-hidden"
    >
      {/* Mobile Stepper Header: Compact Bar */}
      <div className="flex sm:hidden flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#37003C] text-[#00FF87] text-[11px] font-black">
              {currentStep}
            </span>
            <span className="text-xs font-black text-[#1F1F1F] uppercase tracking-wide">
              Step {currentStep} of 4: {STEPS[currentStep - 1].title}
            </span>
          </div>
          {isPublished && (
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Live
            </span>
          )}
        </div>

        {/* Mobile Progress Bar */}
        <div className="w-full h-1.5 bg-[#F0F0F0] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#37003C] to-[#00FF87] transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>

        {/* Mobile Step Badges */}
        <div className="flex items-center justify-between text-[11px] font-bold text-[#777777] pt-1">
          {STEPS.map((step) => {
            const isDone = isPublished || step.number < currentStep;
            const isActive = step.number === currentStep;
            const targetHref = step.href(tournamentId);

            if (targetHref && (isDone || isActive)) {
              return (
                <Link
                  key={step.number}
                  href={targetHref}
                  className={`transition-colors flex items-center gap-1 ${
                    isActive
                      ? "text-[#37003C] font-extrabold"
                      : isDone
                      ? "text-emerald-700 hover:text-[#37003C]"
                      : "text-[#999999]"
                  }`}
                >
                  {isDone ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <span>{step.number}.</span>
                  )}
                  <span>{step.shortTitle}</span>
                </Link>
              );
            }

            return (
              <span
                key={step.number}
                className={
                  isActive
                    ? "text-[#37003C] font-extrabold"
                    : isDone
                    ? "text-emerald-700"
                    : "text-[#AAAAAA]"
                }
              >
                {isDone ? "✓ " : `${step.number}. `}
                {step.shortTitle}
              </span>
            );
          })}
        </div>
      </div>

      {/* Desktop Stepper Bar */}
      <div className="hidden sm:grid grid-cols-4 gap-2 lg:gap-3 items-center relative">
        {STEPS.map((step, idx) => {
          const isDone = isPublished || step.number < currentStep;
          const isActive = step.number === currentStep;
          const targetHref = step.href(tournamentId);
          const isClickable = !!targetHref && (isDone || isActive);
          const Icon = step.icon;

          const StepContent = (
            <div
              className={`group flex items-center gap-3 p-2.5 rounded-[12px] transition-all duration-200 border ${
                isActive
                  ? "bg-[#37003C] text-white border-[#37003C] shadow-sm ring-2 ring-[#00FF87]/50"
                  : isDone
                  ? "bg-emerald-50/60 text-[#1F1F1F] border-emerald-200/80 hover:bg-emerald-100/50 hover:border-emerald-300"
                  : "bg-[#FAFAFA] text-[#777777] border-transparent opacity-75"
              }`}
            >
              {/* Step Icon / Number Indicator */}
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black transition-transform duration-200 ${
                  isActive
                    ? "bg-[#00FF87] text-[#37003C] shadow-xs scale-105"
                    : isDone
                    ? "bg-emerald-600 text-white shadow-2xs group-hover:scale-105"
                    : "bg-[#EAEAEA] text-[#777777]"
                }`}
              >
                {isDone ? (
                  <Check className="h-4 w-4 stroke-[2.5]" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>

              {/* Step Labels */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider ${
                      isActive
                        ? "text-[#00FF87]"
                        : isDone
                        ? "text-emerald-700"
                        : "text-[#888888]"
                    }`}
                  >
                    Step 0{step.number}
                  </span>
                  {isActive && (
                    <span className="flex h-1.5 w-1.5 rounded-full bg-[#00FF87] animate-pulse" />
                  )}
                </div>
                <p
                  className={`text-xs sm:text-sm font-extrabold truncate ${
                    isActive
                      ? "text-white"
                      : isDone
                      ? "text-[#1F1F1F]"
                      : "text-[#777777]"
                  }`}
                >
                  {step.title}
                </p>
                <p
                  className={`text-[11px] truncate hidden xl:block font-medium ${
                    isActive
                      ? "text-white/70"
                      : isDone
                      ? "text-[#666666]"
                      : "text-[#999999]"
                  }`}
                >
                  {step.description}
                </p>
              </div>

              {/* Desktop Chevron Divider */}
              {idx < STEPS.length - 1 && (
                <div className="hidden lg:block shrink-0 ml-auto pl-1">
                  <ChevronRight
                    className={`h-4 w-4 ${
                      isActive
                        ? "text-white/40"
                        : isDone
                        ? "text-emerald-400"
                        : "text-[#D0D0D0]"
                    }`}
                  />
                </div>
              )}
            </div>
          );

          if (isClickable && targetHref) {
            return (
              <Link
                key={step.number}
                href={targetHref}
                title={`Go to Step ${step.number}: ${step.title}`}
                className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#37003C] rounded-[12px]"
              >
                {StepContent}
              </Link>
            );
          }

          return (
            <div key={step.number} className="block cursor-default select-none">
              {StepContent}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
