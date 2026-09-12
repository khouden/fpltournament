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
      className="w-full bg-white rounded-2xl border border-gray-200/80 p-3.5 sm:p-5 shadow-xs overflow-hidden"
    >
      {/* Mobile Stepper Header: Compact Bar */}
      <div className="flex sm:hidden flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#37003C] text-[#00FF87] text-xs font-black">
              {currentStep}
            </span>
            <span className="text-xs font-black text-[#1F1F1F] uppercase tracking-wide">
              Step {currentStep} of 4: {STEPS[currentStep - 1].title}
            </span>
          </div>
          {isPublished && (
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Live
            </span>
          )}
        </div>

        {/* Mobile Progress Bar */}
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#37003C] to-[#00FF87] transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>

        {/* Mobile Step Badges */}
        <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 pt-1">
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
                      ? "text-[#37003C] font-black"
                      : isDone
                      ? "text-emerald-700 hover:text-[#37003C]"
                      : "text-gray-400"
                  }`}
                >
                  {isDone ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
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
                    ? "text-[#37003C] font-black"
                    : isDone
                    ? "text-emerald-700"
                    : "text-gray-400"
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
      <div className="hidden sm:grid grid-cols-4 gap-2.5 lg:gap-3 items-center relative">
        {STEPS.map((step, idx) => {
          const isDone = isPublished || step.number < currentStep;
          const isActive = step.number === currentStep;
          const targetHref = step.href(tournamentId);
          const isClickable = !!targetHref && (isDone || isActive);
          const Icon = step.icon;

          const StepContent = (
            <div
              className={`group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border ${
                isActive
                  ? "bg-gradient-to-r from-[#170020] via-[#240030] to-[#1F0022] text-white border-[#00FF87]/40 shadow-sm ring-1 ring-[#00FF87]/30"
                  : isDone
                  ? "bg-emerald-50/70 text-[#1F1F1F] border-emerald-200/80 hover:bg-emerald-100/50 hover:border-emerald-300"
                  : "bg-gray-50/70 text-gray-400 border-transparent opacity-75"
              }`}
            >
              {/* Step Icon / Number Indicator */}
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black transition-transform duration-200 ${
                  isActive
                    ? "bg-[#00FF87] text-[#063319] shadow-xs scale-105"
                    : isDone
                    ? "bg-emerald-600 text-white shadow-2xs group-hover:scale-105"
                    : "bg-gray-200 text-gray-500"
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
                        : "text-gray-400"
                    }`}
                  >
                    Step 0{step.number}
                  </span>
                  {isActive && (
                    <span className="flex h-1.5 w-1.5 rounded-full bg-[#00FF87] animate-pulse" />
                  )}
                </div>
                <p
                  className={`text-xs sm:text-sm font-black truncate ${
                    isActive
                      ? "text-white"
                      : isDone
                      ? "text-[#1F1F1F]"
                      : "text-gray-500"
                  }`}
                >
                  {step.title}
                </p>
                <p
                  className={`text-[11px] truncate hidden xl:block font-medium ${
                    isActive
                      ? "text-white/70"
                      : isDone
                      ? "text-gray-500"
                      : "text-gray-400"
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
                        : "text-gray-300"
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
                className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#37003C] rounded-xl"
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
