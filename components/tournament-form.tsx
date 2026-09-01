"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FPLVerifier } from "./fpl-verifier";
import type { FPLManager } from "@/lib/fpl";

interface TournamentFormProps {
  initialData?: {
    id: string;
    name: string;
    season: number;
    adminFplId: number | string;
    allowBenchBoost?: boolean;
    allowTripleCaptain?: boolean;
  };
}

export function TournamentForm({ initialData }: TournamentFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name || "");
  const [season, setSeason] = useState(initialData?.season || new Date().getFullYear());
  const [adminFplId, setAdminFplId] = useState(initialData?.adminFplId || 0);
  const [allowBenchBoost, setAllowBenchBoost] = useState(
    initialData?.allowBenchBoost ?? true
  );
  const [allowTripleCaptain, setAllowTripleCaptain] = useState(
    initialData?.allowTripleCaptain ?? true
  );
  const [verifiedManager, setVerifiedManager] = useState<FPLManager | null>(
    initialData?.adminFplId
      ? {
          id: Number(initialData.adminFplId),
          player_first_name: "Verified",
          player_last_name: "Admin",
          name: "Admin Team",
        }
      : null
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFPLVerified = (manager: FPLManager) => {
    setVerifiedManager(manager);
    setAdminFplId(manager.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!name.trim()) {
      setError("Tournament name is required");
      setLoading(false);
      return;
    }

    if (!verifiedManager) {
      setError("Please verify your FPL entry first");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/tournaments", {
        method: initialData ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: initialData?.id,
          name,
          season,
          adminFplId: verifiedManager.id,
          allowBenchBoost,
          allowTripleCaptain,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save tournament");
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Tournament Name *
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          placeholder="e.g., Premier League Fantasy Cup 2024"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50"
          required
        />
      </div>

      <div>
        <label
          htmlFor="season"
          className="block text-sm font-medium text-gray-700"
        >
          Season *
        </label>
        <input
          type="number"
          id="season"
          value={season}
          onChange={(e) => setSeason(parseInt(e.target.value))}
          disabled={loading}
          min={2020}
          max={2100}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50"
          required
        />
      </div>

      {/* Chip Rules Section with Two Distinct Settings */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
          ⚡ FPL Chips Configuration
        </h3>
        <p className="text-xs text-gray-500">
          Control which FPL chip bonuses count towards match scores. Free Hit & Wildcard are always allowed.
        </p>

        <div className="space-y-3 pt-1">
          {/* 1. Bench Boost Setting */}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3.5 shadow-sm">
            <div className="pr-4">
              <label
                htmlFor="allowBenchBoost"
                className="text-sm font-semibold text-gray-900 cursor-pointer flex items-center gap-2"
              >
                <span>💺 Bench Boost</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    allowBenchBoost
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {allowBenchBoost ? "ENABLED" : "DISABLED"}
                </span>
              </label>
              <p className="mt-1 text-xs text-gray-600">
                {allowBenchBoost
                  ? "Bench points count fully towards match score when a manager plays Bench Boost."
                  : "Bench points are excluded from the score (only starting 11 players count)."}
              </p>
            </div>
            <div className="flex items-center">
              <input
                id="allowBenchBoost"
                type="checkbox"
                checked={allowBenchBoost}
                onChange={(e) => setAllowBenchBoost(e.target.checked)}
                disabled={loading}
                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* 2. Triple Captain Setting */}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3.5 shadow-sm">
            <div className="pr-4">
              <label
                htmlFor="allowTripleCaptain"
                className="text-sm font-semibold text-gray-900 cursor-pointer flex items-center gap-2"
              >
                <span>👑 Triple Captain</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    allowTripleCaptain
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {allowTripleCaptain ? "ENABLED" : "DISABLED"}
                </span>
              </label>
              <p className="mt-1 text-xs text-gray-600">
                {allowTripleCaptain
                  ? "Triple Captain multiplier (3x) counts fully towards match score."
                  : "Triple Captain is reduced to 2x (captain points are doubled instead of tripled)."}
              </p>
            </div>
            <div className="flex items-center">
              <input
                id="allowTripleCaptain"
                type="checkbox"
                checked={allowTripleCaptain}
                onChange={(e) => setAllowTripleCaptain(e.target.checked)}
                disabled={loading}
                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border-2 border-indigo-200 bg-indigo-50 p-4">
        <h3 className="font-semibold text-indigo-900">Step 1: Verify FPL Account</h3>
        <p className="mt-2 text-sm text-indigo-700">
          Verify your FPL manager account to proceed. Your entry ID will be saved as the tournament admin.
        </p>
        <div className="mt-4">
          <FPLVerifier onVerified={handleFPLVerified} />
        </div>
      </div>

      {verifiedManager && (
        <div className="rounded-md bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">
            ✓ Admin Account Verified
          </p>
          <p className="text-xs text-green-700">
            {verifiedManager.player_first_name} {verifiedManager.player_last_name} (ID: {verifiedManager.id})
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || !verifiedManager}
          className="flex-1 rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:bg-gray-400"
        >
          {loading ? "Saving..." : initialData ? "Update Tournament" : "Create Tournament"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={loading}
          className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
