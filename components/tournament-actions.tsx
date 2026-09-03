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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

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

  const handleDelete = async () => {
    setIsLoading(true);
    setError("");

    const result = await deleteTournamentAction(tournamentId);

    if (!result.success) {
      setError(result.error || "Failed to delete");
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
    <>
      {error && (
        <Alert variant="destructive" className="mb-2 py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-xs font-semibold">{error}</AlertTitle>
          {validationIssues.length > 0 && (
            <AlertDescription className="text-xs mt-1">
              <ul className="list-disc list-inside space-y-0.5">
                {validationIssues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </AlertDescription>
          )}
        </Alert>
      )}

      <div className="flex items-center gap-1.5 flex-wrap">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/tournaments/${tournamentId}/edit`}>Edit</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/tournaments/${tournamentId}/groups`}>Groups</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/tournaments/${tournamentId}/schedule`}>Schedule</Link>
        </Button>

        {status === "DRAFT" && (
          <Button
            variant="default"
            size="sm"
            onClick={handlePublish}
            disabled={isLoading || !hasGroups}
            title={!hasGroups ? "Add groups before publishing" : "Publish tournament"}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                <span>Publishing...</span>
              </>
            ) : (
              "Publish"
            )}
          </Button>
        )}

        {status === "PUBLISHED" && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleUnpublish}
            disabled={isLoading}
            className="text-amber-600 border-amber-200 hover:bg-amber-50"
          >
            {isLoading ? "Updating..." : "Unpublish"}
          </Button>
        )}

        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isLoading}
        >
          Delete
        </Button>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tournament?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{tournamentName}&quot;? This action
              cannot be undone and all associated rounds and matches will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
