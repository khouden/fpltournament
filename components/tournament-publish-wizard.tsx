"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { publishTournamentWithValidationAction } from "@/lib/scoring-actions";
import { unpublishTournamentAction } from "@/lib/tournament-actions";
import { TournamentWizardStepper } from "./tournament-wizard-stepper";
import {
  Rocket,
  AlertTriangle,
  AlertCircle,
  Users,
  Calendar,
  Crown,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Loader2,
  Sparkles,
  EyeOff,
  Pencil,
  Check,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AdminItem {
  fplId: number;
  name: string | null;
  teamName: string | null;
  isPrimary: boolean;
}

interface MemberItem {
  id: string;
  fplId: number;
  name: string;
  isAdmin: boolean;
}

interface GroupItem {
  id: string;
  name: string;
  logo: string | null;
  members: MemberItem[];
}

interface MatchItem {
  id: string;
  matchNumber: number;
  homeGroup: { name: string; logo: string | null } | null;
  awayGroup: { name: string; logo: string | null } | null;
}

interface RoundItem {
  id: string;
  roundNumber: number;
  name: string | null;
  gameweek: number | null;
  matches: MatchItem[];
}

export interface TournamentPublishWizardProps {
  tournament: {
    id: string;
    name: string;
    season: number;
    banner: string | null;
    status: "DRAFT" | "PUBLISHED" | "FINISHED";
    allowBenchBoost: boolean;
    allowTripleCaptain: boolean;
    adminFplId: number;
    admins: AdminItem[];
    groups: GroupItem[];
    rounds: RoundItem[];
  };
  initialValidation: {
    isValid: boolean;
    issues: string[];
  };
}

export function TournamentPublishWizard({
  tournament,
  initialValidation,
}: TournamentPublishWizardProps) {
  const router = useRouter();

  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "FINISHED">(
    tournament.status
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationIssues, setValidationIssues] = useState<string[]>(
    initialValidation.issues
  );
  const [isValid, setIsValid] = useState(initialValidation.isValid);

  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showUnpublishDialog, setShowUnpublishDialog] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const totalMatches = tournament.rounds.reduce(
    (acc, r) => acc + r.matches.length,
    0
  );

  const totalMembers = tournament.groups.reduce(
    (acc, g) => acc + g.members.length,
    0
  );

  const primaryAdmin =
    tournament.admins.find((a) => a.isPrimary) || tournament.admins[0];

  const handlePublish = async () => {
    setLoading(true);
    setError("");
    setShowPublishDialog(false);

    try {
      const result = await publishTournamentWithValidationAction(tournament.id);

      if (!result.success) {
        setError(result.error || "Failed to publish tournament");
        if (result.issues) {
          setValidationIssues(result.issues);
          setIsValid(false);
        }
      } else {
        setStatus("PUBLISHED");
        setPublishSuccess(true);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleUnpublish = async () => {
    setLoading(true);
    setError("");
    setShowUnpublishDialog(false);

    try {
      const result = await unpublishTournamentAction(tournament.id);

      if (!result.success) {
        setError(result.error || "Failed to unpublish tournament");
      } else {
        setStatus("DRAFT");
        setPublishSuccess(false);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fpl-fade-in">
      {/* 1. Header & Stepper */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs sm:text-sm text-gray-500"
          >
            <Link
              href="/admin"
              className="font-semibold text-gray-600 hover:text-[#37003C] transition-colors"
            >
              Dashboard
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <Link
              href={`/admin/tournaments/${tournament.id}`}
              className="font-semibold text-gray-600 hover:text-[#37003C] transition-colors truncate max-w-[180px] sm:max-w-xs"
              title={tournament.name}
            >
              {tournament.name}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <span className="font-bold text-[#1F1F1F]">Review &amp; Publish</span>
          </nav>

          <h1 className="text-2xl sm:text-3xl font-black text-[#1F1F1F] tracking-tight leading-tight flex items-center gap-2.5">
            <span>Review &amp; Publish Tournament</span>
            <Rocket className="h-6 w-6 text-[#00A855]" />
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-2xl">
            Step 4 of 4: Inspect pre-flight readiness checks, verify tournament configuration, and launch the competition live.
          </p>
        </div>

        <div className="shrink-0 self-start sm:self-center flex items-center gap-2">
          {status === "PUBLISHED" && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-9 px-3.5 text-xs font-semibold text-[#1F1F1F] border-[#E5E5E5] bg-white hover:bg-[#F7F7F7] hover:border-[#37003C]/40 hover:text-[#37003C] rounded-[8px] transition-colors gap-1.5 shadow-2xs"
            >
              <Link
                href={`/tournaments/${tournament.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5 text-[#37003C]" />
                <span>View Public Page</span>
              </Link>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-9 px-3.5 text-xs font-semibold text-[#1F1F1F] border-[#E5E5E5] bg-white hover:bg-[#F7F7F7] hover:border-[#37003C]/40 hover:text-[#37003C] rounded-[8px] transition-colors gap-1.5 shadow-2xs"
          >
            <Link href={`/admin/tournaments/${tournament.id}/schedule?wizard=true`}>
              <ArrowLeft className="h-4 w-4 text-[#37003C]" />
              <span>Back to Schedule</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Wizard Stepper Bar */}
      <TournamentWizardStepper
        currentStep={4}
        tournamentId={tournament.id}
        tournamentStatus={status}
      />

      {/* Published Celebration Alert */}
      {publishSuccess && status === "PUBLISHED" && (
        <div className="rounded-[14px] border border-emerald-300 bg-emerald-50 p-5 text-emerald-900 shadow-sm animate-fpl-fade-in flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-emerald-950">
                🎉 Tournament is Officially Published!
              </h3>
              <p className="text-xs sm:text-sm text-emerald-800 mt-0.5">
                Your competition is now live and publicly accessible. Managers can track fixtures, view tables, and follow live gameweek scores.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <Button
              size="sm"
              asChild
              className="h-9 px-4 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-[8px] shadow-xs gap-1.5 cursor-pointer"
            >
              <Link
                href={`/tournaments/${tournament.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open Public Page</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-9 px-3.5 text-xs font-bold border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-100/60 rounded-[8px]"
            >
              <Link href={`/admin/tournaments/${tournament.id}`}>
                <span>Dashboard</span>
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div
          role="alert"
          className="rounded-[12px] border border-red-200 bg-red-50 p-4 text-red-900 shadow-xs animate-fpl-fade-in"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-900">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Pre-Flight Readiness Checklist (3 Cards) */}
      <section aria-label="Pre-Flight Readiness Checks" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-[#1F1F1F]">
            Pre-Flight Readiness Checks
          </h2>
          <span
            className={`text-xs font-extrabold px-2.5 py-1 rounded-full border ${
              isValid
                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                : "bg-amber-100 text-amber-800 border-amber-300"
            }`}
          >
            {isValid ? "✓ All Checks Passed" : "⚠️ Action Required"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Check 1: Details & Rules */}
          <div className="rounded-[14px] border border-[#E5E5E5] bg-white p-5 shadow-fpl-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#777777]">
                  Check 01 · Details
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Check className="h-3 w-3" />
                  Verified
                </span>
              </div>
              <h3 className="text-base font-extrabold text-[#1F1F1F] truncate">
                {tournament.name}
              </h3>
              <p className="text-xs text-[#666666]">
                Season {tournament.season}/{tournament.season + 1} · Primary: {primaryAdmin?.name || `#${tournament.adminFplId}`} ({tournament.admins.length} Admin{tournament.admins.length > 1 ? "s" : ""})
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F4F4F5] text-[#555555]">
                  BB: {tournament.allowBenchBoost ? "Enabled" : "Disabled"}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F4F4F5] text-[#555555]">
                  TC: {tournament.allowTripleCaptain ? "3x Points" : "2x Points"}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="w-full text-xs font-semibold h-8 border-[#E0E0E0] text-[#555555] hover:text-[#37003C] hover:border-[#37003C]/40 rounded-[8px]"
            >
              <Link href={`/admin/tournaments/${tournament.id}/edit`}>
                <Pencil className="h-3 w-3 mr-1.5" />
                <span>Edit Details</span>
              </Link>
            </Button>
          </div>

          {/* Check 2: Groups & Rosters */}
          <div
            className={`rounded-[14px] border p-5 shadow-fpl-sm flex flex-col justify-between space-y-4 ${
              tournament.groups.length >= 2
                ? "bg-white border-[#E5E5E5]"
                : "bg-amber-50/50 border-amber-300"
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#777777]">
                  Check 02 · Groups
                </span>
                {tournament.groups.length >= 2 ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Check className="h-3 w-3" />
                    Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                    <AlertTriangle className="h-3 w-3" />
                    Needs Groups
                  </span>
                )}
              </div>
              <h3 className="text-base font-extrabold text-[#1F1F1F]">
                {tournament.groups.length}{" "}
                {tournament.groups.length === 1 ? "Group" : "Groups"} Configured
              </h3>
              <p className="text-xs text-[#666666]">
                {totalMembers} Total Participating Players across all groups.
              </p>
              {tournament.groups.length < 2 && (
                <p className="text-[11px] font-bold text-amber-800">
                  ⚠️ At least 2 groups required to play matches.
                </p>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="w-full text-xs font-semibold h-8 border-[#E0E0E0] text-[#555555] hover:text-[#37003C] hover:border-[#37003C]/40 rounded-[8px]"
            >
              <Link href={`/admin/tournaments/${tournament.id}/groups?wizard=true`}>
                <Users className="h-3 w-3 mr-1.5" />
                <span>Manage Groups</span>
              </Link>
            </Button>
          </div>

          {/* Check 3: Schedule & Fixtures */}
          <div
            className={`rounded-[14px] border p-5 shadow-fpl-sm flex flex-col justify-between space-y-4 ${
              tournament.rounds.length > 0 && totalMatches > 0
                ? "bg-white border-[#E5E5E5]"
                : "bg-amber-50/50 border-amber-300"
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#777777]">
                  Check 03 · Schedule
                </span>
                {tournament.rounds.length > 0 && totalMatches > 0 ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Check className="h-3 w-3" />
                    Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                    <AlertTriangle className="h-3 w-3" />
                    Needs Fixtures
                  </span>
                )}
              </div>
              <h3 className="text-base font-extrabold text-[#1F1F1F]">
                {tournament.rounds.length}{" "}
                {tournament.rounds.length === 1 ? "Round" : "Rounds"} · {totalMatches}{" "}
                {totalMatches === 1 ? "Fixture" : "Fixtures"}
              </h3>
              <p className="text-xs text-[#666666]">
                Rounds mapped to official FPL Gameweeks with automated scoring.
              </p>
              {totalMatches === 0 && (
                <p className="text-[11px] font-bold text-amber-800">
                  ⚠️ At least 1 round with match fixtures is required.
                </p>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="w-full text-xs font-semibold h-8 border-[#E0E0E0] text-[#555555] hover:text-[#37003C] hover:border-[#37003C]/40 rounded-[8px]"
            >
              <Link href={`/admin/tournaments/${tournament.id}/schedule?wizard=true`}>
                <Calendar className="h-3 w-3 mr-1.5" />
                <span>Manage Schedule</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 4. Actionable Issues Alert Panel (if any issues exist) */}
      {validationIssues.length > 0 && (
        <div
          role="alert"
          className="rounded-[14px] border border-amber-300 bg-amber-50/95 p-4 sm:p-5 text-amber-950 shadow-xs space-y-3"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <h3 className="text-sm font-extrabold text-amber-950">
                Action Required Before Publishing
              </h3>
              <p className="text-xs text-amber-800">
                Please resolve the following items to satisfy competition integrity requirements:
              </p>
              <ul className="mt-2 space-y-1 list-disc list-inside text-xs font-medium text-amber-900">
                {validationIssues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 pl-8">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-8 px-3 text-xs font-bold border-amber-400 bg-white text-amber-900 hover:bg-amber-100 rounded-[6px]"
            >
              <Link href={`/admin/tournaments/${tournament.id}/groups?wizard=true`}>
                <span>Fix in Groups (Step 2)</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-8 px-3 text-xs font-bold border-amber-400 bg-white text-amber-900 hover:bg-amber-100 rounded-[6px]"
            >
              <Link href={`/admin/tournaments/${tournament.id}/schedule?wizard=true`}>
                <span>Fix in Schedule (Step 3)</span>
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* 5. Tournament Launch Card */}
      <section
        aria-label="Publish Tournament Action"
        className="rounded-[16px] border border-[#E5E5E5] bg-gradient-to-br from-[#1F0022] to-[#37003C] p-6 sm:p-8 text-white shadow-fpl-md relative overflow-hidden"
      >
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#00FF87] text-xs font-extrabold uppercase tracking-wider backdrop-blur-xs">
            <Rocket className="h-3.5 w-3.5" />
            <span>
              {status === "PUBLISHED" ? "Tournament is Live" : "Final Wizard Step"}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {status === "PUBLISHED"
              ? "Your Competition is Live and Public"
              : "Ready to Launch Your Tournament?"}
          </h2>

          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            {status === "PUBLISHED"
              ? "Participants and spectators can view live standings, check upcoming fixtures, and review gameweek results on the public page."
              : "Publishing unlocks the public tournament URL, enables manager participation tracking, and initiates live FPL automated scoring."}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {status === "DRAFT" ? (
              <Button
                size="lg"
                onClick={() => setShowPublishDialog(true)}
                disabled={loading || !isValid}
                className="h-12 px-6 font-extrabold text-sm sm:text-base bg-[#00FF87] hover:bg-[#00e67a] text-[#37003C] rounded-[10px] shadow-md transition-transform active:scale-98 gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-[#37003C]" />
                ) : (
                  <Rocket className="h-5 w-5 fill-[#37003C]" />
                )}
                <span>Publish Tournament Live</span>
              </Button>
            ) : (
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  size="lg"
                  asChild
                  className="h-11 px-5 font-bold text-sm bg-[#00FF87] hover:bg-[#00e67a] text-[#37003C] rounded-[8px] shadow-sm gap-2"
                >
                  <Link
                    href={`/tournaments/${tournament.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>View Public Page</span>
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowUnpublishDialog(true)}
                  disabled={loading}
                  className="h-11 px-4 font-semibold text-xs border-white/30 bg-white/10 hover:bg-white/20 text-white rounded-[8px] gap-2 cursor-pointer"
                >
                  <EyeOff className="h-4 w-4" />
                  <span>Unpublish to Draft</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Decorative Background Accent */}
        <div className="absolute right-[-40px] bottom-[-40px] w-64 h-64 rounded-full bg-[#00FF87]/10 blur-3xl pointer-events-none" />
      </section>

      {/* 6. Comprehensive Tournament Summary & Review */}
      <section aria-label="Tournament Summary Details" className="space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-[#1F1F1F]">
          Tournament Setup Summary
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Summary Card 1: Groups Breakdown */}
          <div className="rounded-[14px] border border-[#E5E5E5] bg-white p-5 shadow-fpl-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0F0F0]">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#37003C]" />
                <h3 className="text-sm font-extrabold text-[#1F1F1F]">
                  Participating Groups ({tournament.groups.length})
                </h3>
              </div>
              <Link
                href={`/admin/tournaments/${tournament.id}/groups?wizard=true`}
                className="text-xs font-semibold text-[#37003C] hover:underline"
              >
                Edit
              </Link>
            </div>

            {tournament.groups.length > 0 ? (
              <div className="space-y-2">
                {tournament.groups.map((group) => {
                  const adminMembers = group.members.filter((m) => m.isAdmin);
                  const playerMembers = group.members.filter((m) => !m.isAdmin);

                  return (
                    <div
                      key={group.id}
                      className="flex items-center justify-between p-2.5 rounded-[10px] bg-[#FAFAFA] border border-[#EEEEEE]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {group.logo ? (
                          <div className="relative h-7 w-7 shrink-0 rounded-full overflow-hidden bg-white border border-[#E0E0E0]">
                            <Image
                              src={group.logo}
                              alt={group.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-7 w-7 shrink-0 rounded-full bg-[#37003C]/10 text-[#37003C] flex items-center justify-center font-bold text-xs">
                            {group.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-bold text-xs sm:text-sm text-[#1F1F1F] truncate">
                          {group.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-xs">
                        <span className="text-[#666666] font-medium">
                          {playerMembers.length} managers
                        </span>
                        {adminMembers.length > 0 && (
                          <span
                            title={`Group Admin: ${adminMembers[0].name}`}
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-[#37003C]/5 text-[#37003C]"
                          >
                            <Crown className="h-3 w-3 text-amber-600" />
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#777777] italic py-2">
                No groups imported yet. Please add at least 2 groups.
              </p>
            )}
          </div>

          {/* Summary Card 2: Rounds & Gameweeks Breakdown */}
          <div className="rounded-[14px] border border-[#E5E5E5] bg-white p-5 shadow-fpl-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0F0F0]">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#37003C]" />
                <h3 className="text-sm font-extrabold text-[#1F1F1F]">
                  Rounds &amp; Fixtures ({tournament.rounds.length} Rounds)
                </h3>
              </div>
              <Link
                href={`/admin/tournaments/${tournament.id}/schedule?wizard=true`}
                className="text-xs font-semibold text-[#37003C] hover:underline"
              >
                Edit
              </Link>
            </div>

            {tournament.rounds.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {tournament.rounds.map((round) => (
                  <div
                    key={round.id}
                    className="p-2.5 rounded-[10px] bg-[#FAFAFA] border border-[#EEEEEE] space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-[#1F1F1F]">
                        Round {round.roundNumber}: {round.name || `Round ${round.roundNumber}`}
                      </span>
                      <span className="font-bold px-2 py-0.5 rounded-full bg-[#37003C]/5 text-[#37003C] text-[10px]">
                        GW {round.gameweek || "—"}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#666666] font-medium">
                      {round.matches.length > 0 ? (
                        <span>
                          {round.matches.length}{" "}
                          {round.matches.length === 1 ? "match" : "matches"}:{" "}
                          {round.matches
                            .map(
                              (m) =>
                                `${m.homeGroup?.name || "TBD"} vs ${
                                  m.awayGroup?.name || "TBD"
                                }`
                            )
                            .join(" · ")}
                        </span>
                      ) : (
                        <span className="text-amber-800 font-bold">
                          No matches configured in this round.
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#777777] italic py-2">
                No rounds or fixtures created yet. Use the schedule builder.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 7. Bottom Navigation Bar */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          asChild
          className="h-10 px-4 text-xs font-bold text-gray-700 hover:text-[#1F1F1F] border-gray-200 bg-white hover:bg-gray-50 rounded-xl gap-2 w-full sm:w-auto cursor-pointer"
        >
          <Link href={`/admin/tournaments/${tournament.id}/schedule?wizard=true`}>
            <ArrowLeft className="h-4 w-4" />
            <span>Step 3: Schedule &amp; Fixtures</span>
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          asChild
          className="h-10 px-5 text-xs font-bold text-[#37003C] hover:bg-[#37003C]/5 rounded-xl gap-1.5 w-full sm:w-auto cursor-pointer"
        >
          <Link href={`/admin/tournaments/${tournament.id}`}>
            <span>Go to Tournament Control Center</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Publish Confirmation Dialog */}
      <AlertDialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <AlertDialogContent className="bg-white border-gray-200 rounded-2xl max-w-md p-6 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-black text-[#1F1F1F] tracking-tight">
              Publish Tournament Live?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm text-gray-600">
              Publishing <strong className="text-[#1F1F1F]">{tournament.name}</strong> will make the competition publicly accessible. Managers will be able to view fixtures, and scores will update with official FPL points.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-4">
            <AlertDialogCancel className="border-gray-200 text-gray-600 rounded-xl font-semibold text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePublish}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              Publish Competition Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unpublish Confirmation Dialog */}
      <AlertDialog open={showUnpublishDialog} onOpenChange={setShowUnpublishDialog}>
        <AlertDialogContent className="bg-white border-gray-200 rounded-2xl max-w-md p-6 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-black text-[#1F1F1F] tracking-tight">
              Unpublish Tournament?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm text-gray-600">
              Returning <strong className="text-[#1F1F1F]">{tournament.name}</strong> to DRAFT will hide the tournament from the public directory while you make adjustments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-4">
            <AlertDialogCancel className="border-gray-200 text-gray-600 rounded-xl font-semibold text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnpublish}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              Unpublish Tournament
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
