"use client";

import { useState } from "react";
import {
  deleteTournamentAction,
  unpublishTournamentAction,
} from "@/lib/tournament-actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  AlertCircle,
  Loader2,
  Pencil,
  Users,
  Calendar,
  EyeOff,
  Trash2,
  Rocket,
} from "lucide-react";

interface TournamentActionsProps {
  tournamentId: string;
  tournamentName: string;
  status: "DRAFT" | "PUBLISHED" | "FINISHED";
  hasGroups: boolean;
}

export function TournamentActions({
  tournamentId,
  tournamentName,
  status,
}: TournamentActionsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationIssues] = useState<string[]>([]);

  const handleDelete = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    setIsLoading(true);
    setError("");

    const result = await deleteTournamentAction(tournamentId);

    if (!result.success) {
      setError(result.error || "Failed to delete");
      setIsLoading(false);
      setShowDeleteConfirm(false);
    } else {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleUnpublish = async () => {
    setIsLoading(true);
    setError("");
    const result = await unpublishTournamentAction(tournamentId);
    if (!result.success) {
      setError(result.error || "Failed to unpublish");
    }
    setIsLoading(false);
  };

  return (
    <div className="w-full">
      {error && (
        <div
          role="alert"
          className="mb-3 rounded-[10px] border border-red-200 bg-red-50/95 p-3 sm:p-3.5 text-xs text-red-900 shadow-xs animate-fpl-fade-in"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-red-900">{error}</p>
              {validationIssues.length > 0 && (
                <ul className="mt-1.5 list-disc list-inside space-y-1 font-medium text-red-800">
                  {validationIssues.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {/* Primary Action: Manage Hub */}
        <Button
          size="sm"
          asChild
          className="h-8.5 px-3.5 text-xs font-bold bg-[#37003C] hover:bg-[#5A0A63] text-white rounded-xl shadow-xs transition-colors gap-1.5 cursor-pointer"
        >
          <Link href={`/admin/tournaments/${tournamentId}`}>
            <Rocket className="h-3.5 w-3.5 text-[#00FF87]" />
            <span>Manage Hub</span>
          </Link>
        </Button>

        {/* Secondary: Edit */}
        <Button
          variant="outline"
          size="sm"
          asChild
          className="h-8.5 px-3 text-xs font-semibold text-[#1F1F1F] border-gray-200 bg-white hover:bg-gray-50 hover:border-[#37003C]/40 hover:text-[#37003C] rounded-xl transition-colors gap-1.5 shadow-2xs"
        >
          <Link href={`/admin/tournaments/${tournamentId}/edit`}>
            <Pencil className="h-3.5 w-3.5 text-[#37003C]" />
            <span>Edit</span>
          </Link>
        </Button>

        {/* Secondary: Groups */}
        <Button
          variant="outline"
          size="sm"
          asChild
          className="h-8.5 px-3 text-xs font-semibold text-[#333333] border-gray-200 bg-white hover:bg-gray-50 hover:border-[#37003C]/40 hover:text-[#37003C] rounded-xl transition-colors gap-1.5 shadow-2xs"
        >
          <Link href={`/admin/tournaments/${tournamentId}/groups`}>
            <Users className="h-3.5 w-3.5 text-[#666666]" />
            <span>Groups</span>
          </Link>
        </Button>

        {/* Secondary: Schedule */}
        <Button
          variant="outline"
          size="sm"
          asChild
          className="h-8.5 px-3 text-xs font-semibold text-[#333333] border-gray-200 bg-white hover:bg-gray-50 hover:border-[#37003C]/40 hover:text-[#37003C] rounded-xl transition-colors gap-1.5 shadow-2xs"
        >
          <Link href={`/admin/tournaments/${tournamentId}/schedule`}>
            <Calendar className="h-3.5 w-3.5 text-[#666666]" />
            <span>Schedule</span>
          </Link>
        </Button>

        {/* Contextual: Review & Publish (Draft only) */}
        {status === "DRAFT" && (
          <Button
            variant="default"
            size="sm"
            asChild
            className="h-8.5 px-3.5 text-xs font-bold bg-[#00A855] hover:bg-[#008744] text-white rounded-xl shadow-xs transition-colors gap-1.5 cursor-pointer"
          >
            <Link href={`/admin/tournaments/${tournamentId}/publish`}>
              <Rocket className="h-3.5 w-3.5 text-[#00FF87]" />
              <span>Publish Wizard</span>
            </Link>
          </Button>
        )}

        {/* Contextual: Unpublish (Published only) */}
        {status === "PUBLISHED" && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleUnpublish}
            disabled={isLoading}
            className="h-8.5 px-3 text-xs font-semibold border-amber-300 bg-amber-50/50 text-amber-800 hover:bg-amber-100 hover:border-amber-400 rounded-xl transition-colors gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5 text-amber-700" />
                <span>Unpublish</span>
              </>
            )}
          </Button>
        )}

        {/* Destructive: Delete (visually separated) */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isLoading}
          className="h-8.5 px-3 text-xs font-semibold border-rose-200 bg-white text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 rounded-xl transition-colors gap-1.5 cursor-pointer disabled:opacity-50 sm:ml-auto"
          aria-label={`Delete ${tournamentName}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete</span>
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
          <AlertDialogHeader className="text-left space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 border border-rose-100 shrink-0">
                <Trash2 className="h-5 w-5 text-rose-600" />
              </div>
              <AlertDialogTitle className="text-lg font-black text-[#1F1F1F] tracking-tight">
                Delete Tournament?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs sm:text-sm text-[#666666] leading-relaxed pt-1">
              Are you sure you want to permanently delete &quot;<strong className="text-[#1F1F1F]">{tournamentName}</strong>&quot;? All associated groups, rounds, fixtures, and match scorecards will be deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
            <AlertDialogCancel
              disabled={isLoading}
              className="h-10 rounded-xl border-gray-200 text-[#1F1F1F] hover:bg-gray-50 font-semibold text-xs"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-1.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>Permanently Delete</span>
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
