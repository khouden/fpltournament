"use client";

import { useState } from "react";
import {
  deleteTournamentAction,
  unpublishTournamentAction,
} from "@/lib/tournament-actions";
import { publishTournamentWithValidationAction } from "@/lib/scoring-actions";
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
  Upload,
  EyeOff,
  Trash2,
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
  hasGroups,
}: TournamentActionsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationIssues, setValidationIssues] = useState<string[]>([]);

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

  const handlePublish = async () => {
    setIsLoading(true);
    setError("");
    setValidationIssues([]);
    const result = await publishTournamentWithValidationAction(tournamentId);
    if (!result.success) {
      setError(result.error || "Failed to publish");
      if (result.issues) {
        setValidationIssues(result.issues);
      }
    }
    setIsLoading(false);
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
        {/* Primary: Edit */}
        <Button
          variant="outline"
          size="sm"
          asChild
          className="h-8 px-3 text-xs font-semibold text-[#1F1F1F] border-[#E5E5E5] bg-white hover:bg-[#F7F7F7] hover:border-[#37003C]/40 hover:text-[#37003C] transition-colors gap-1.5"
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
          className="h-8 px-3 text-xs font-medium text-[#444444] border-[#E5E5E5] bg-white hover:bg-[#F7F7F7] hover:text-[#1F1F1F] hover:border-[#CCCCCC] transition-colors gap-1.5"
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
          className="h-8 px-3 text-xs font-medium text-[#444444] border-[#E5E5E5] bg-white hover:bg-[#F7F7F7] hover:text-[#1F1F1F] hover:border-[#CCCCCC] transition-colors gap-1.5"
        >
          <Link href={`/admin/tournaments/${tournamentId}/schedule`}>
            <Calendar className="h-3.5 w-3.5 text-[#666666]" />
            <span>Schedule</span>
          </Link>
        </Button>

        {/* Contextual: Publish (Draft only) */}
        {status === "DRAFT" && (
          <Button
            variant="default"
            size="sm"
            onClick={handlePublish}
            disabled={isLoading || !hasGroups}
            title={!hasGroups ? "At least 2 groups required before publishing" : "Publish tournament"}
            className="h-8 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5" />
                <span>Publish</span>
              </>
            )}
          </Button>
        )}

        {/* Contextual: Unpublish (Published only) */}
        {status === "PUBLISHED" && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleUnpublish}
            disabled={isLoading}
            className="h-8 px-3 text-xs font-medium border-amber-200 bg-white text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition-colors gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                <span>Unpublish</span>
              </>
            )}
          </Button>
        )}

        {/* Destructive: Delete */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isLoading}
          className="h-8 px-3 text-xs font-medium border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors gap-1.5 cursor-pointer disabled:opacity-50 sm:ml-auto"
          aria-label={`Delete ${tournamentName}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete</span>
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="max-w-md rounded-[16px] border border-[#E5E5E5] bg-white p-6 shadow-fpl-lg">
          <AlertDialogHeader className="text-left space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 border border-red-100 shrink-0">
                <Trash2 className="h-4 w-4 text-red-600" />
              </div>
              <AlertDialogTitle className="text-lg font-bold text-[#1F1F1F]">
                Delete Tournament?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm text-[#666666] leading-relaxed pt-1">
              Are you sure you want to delete &quot;{tournamentName}&quot;? This action
              cannot be undone and all associated rounds and matches will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
            <AlertDialogCancel
              disabled={isLoading}
              className="h-10 rounded-[8px] border-[#E5E5E5] text-[#1F1F1F] hover:bg-[#F7F7F7] font-medium"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="h-10 rounded-[8px] bg-[#E9007F] hover:bg-[#d00072] text-white font-semibold gap-1.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
