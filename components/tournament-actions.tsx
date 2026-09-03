"use client";

import { useState } from "react";
import {
  deleteTournamentAction,
  unpublishTournamentAction,
} from "@/lib/tournament-actions";
import { publishTournamentWithValidationAction } from "@/lib/scoring-actions";
import Link from "next/link";

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
        <div className="rounded-md bg-red-50 p-2 text-xs text-red-800">
          <p className="font-semibold">{error}</p>
          {validationIssues.length > 0 && (
            <ul className="mt-1 list-disc list-inside space-y-0.5">
              {validationIssues.map((issue, idx) => (
                <li key={idx}>{issue}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex gap-1">
        <Link
          href={`/admin/tournaments/${tournamentId}/edit`}
          className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200"
        >
          Edit
        </Link>
        <Link
          href={`/admin/tournaments/${tournamentId}/groups`}
          className="rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
        >
          Groups
        </Link>
        <Link
          href={`/admin/tournaments/${tournamentId}/schedule`}
          className="rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
        >
          Schedule
        </Link>

        {status === "DRAFT" && (
          <button
            onClick={handlePublish}
            disabled={isLoading || !hasGroups}
            title={!hasGroups ? "Add groups before publishing" : "Publish tournament"}
            className="rounded px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 disabled:text-gray-400"
          >
            {isLoading ? "Publishing..." : "Publish"}
          </button>
        )}

        {status === "PUBLISHED" && (
          <button
            onClick={handleUnpublish}
            disabled={isLoading}
            className="rounded px-2 py-1 text-xs font-medium text-yellow-600 hover:bg-yellow-50"
          >
            {isLoading ? "Updating..." : "Unpublish"}
          </button>
        )}

        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isLoading}
          className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
        >
          Delete
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900">
              Delete Tournament?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete &quot;{tournamentName}&quot;? This action
              cannot be undone.
            </p>

            <div className="mt-4 flex gap-3">
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:bg-gray-400"
              >
                {isLoading ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isLoading}
                className="flex-1 rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
