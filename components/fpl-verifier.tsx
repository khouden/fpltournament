"use client";

import { useState } from "react";
import { verifyFPLEntryAction } from "@/lib/fpl-actions";
import type { FPLManager } from "@/lib/fpl";

interface FPLVerifierProps {
  onVerified?: (manager: FPLManager) => void;
}

export function FPLVerifier({ onVerified }: FPLVerifierProps) {
  const [entryId, setEntryId] = useState("");
  const [manager, setManager] = useState<FPLManager | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && "preventDefault" in e) {
      e.preventDefault();
    }
    setError("");
    setLoading(true);

    const cleanId = entryId.trim();

    try {
      const result = await verifyFPLEntryAction(cleanId);

      if (result.success && result.manager) {
        setManager(result.manager);
        onVerified?.(result.manager);
      } else {
        setError(result.error || "Failed to verify entry");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h3 className="text-lg font-bold text-gray-900">Verify FPL Entry</h3>
      <p className="mt-2 text-sm text-gray-600">
        Enter your FPL manager ID to verify and import your leagues
      </p>

      <div className="mt-6 space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {manager && (
          <div className="rounded-md bg-green-50 p-4 border border-green-200">
            <p className="text-sm font-semibold text-green-900">
              ✓ Verified: {manager.player_first_name} {manager.player_last_name}
            </p>
            <p className="text-xs text-green-700 mt-0.5">
              Team: <strong>{manager.name}</strong> • Manager ID: <strong>{manager.id}</strong>
              {manager.summary_overall_points !== undefined && ` • Total Points: ${manager.summary_overall_points}`}
            </p>
          </div>
        )}

        <div>
          <label
            htmlFor="entry-id"
            className="block text-sm font-medium text-gray-700"
          >
            FPL Entry ID
          </label>
          <input
            type="text"
            id="entry-id"
            value={entryId}
            onChange={(e) => setEntryId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleVerify();
              }
            }}
            disabled={loading}
            placeholder="e.g., 3040938"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 text-gray-900"
            required
          />
        </div>

        <button
          type="button"
          onClick={handleVerify}
          disabled={loading || !entryId.trim()}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:bg-gray-400 cursor-pointer"
        >
          {loading ? "Verifying..." : "Verify Entry"}
        </button>
      </div>
    </div>
  );
}
