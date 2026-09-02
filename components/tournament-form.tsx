"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FPLVerifier } from "./fpl-verifier";
import type { FPLManager } from "@/lib/fpl";
import {
  Zap,
  Armchair,
  Crown,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  UserPlus,
  Shield,
  Trash2,
  Info,
  X,
} from "lucide-react";

export interface AdminItem {
  fplId: number;
  name: string;
  teamName: string;
  isPrimary: boolean;
}

interface TournamentFormProps {
  initialData?: {
    id: string;
    name: string;
    season: number;
    adminFplId: number | string;
    allowBenchBoost?: boolean;
    allowTripleCaptain?: boolean;
    admins?: Array<{
      fplId: number;
      name?: string | null;
      teamName?: string | null;
      isPrimary?: boolean;
    }>;
  };
}

export function TournamentForm({ initialData }: TournamentFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name || "");
  const [season, setSeason] = useState(
    initialData?.season || new Date().getFullYear()
  );
  const [allowBenchBoost, setAllowBenchBoost] = useState(
    initialData?.allowBenchBoost ?? true
  );
  const [allowTripleCaptain, setAllowTripleCaptain] = useState(
    initialData?.allowTripleCaptain ?? true
  );

  const [admins, setAdmins] = useState<AdminItem[]>(() => {
    if (initialData?.admins && initialData.admins.length > 0) {
      return initialData.admins.map((a, idx) => ({
        fplId: a.fplId,
        name: a.name || `Admin #${a.fplId}`,
        teamName: a.teamName || "Admin Team",
        isPrimary: a.isPrimary !== undefined ? a.isPrimary : idx === 0,
      }));
    }
    if (initialData?.adminFplId) {
      return [
        {
          fplId: Number(initialData.adminFplId),
          name: "Primary Admin",
          teamName: "Admin Team",
          isPrimary: true,
        },
      ];
    }
    return [];
  });

  const [showAddCoAdmin, setShowAddCoAdmin] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePrimaryVerified = (manager: FPLManager) => {
    setAdminError("");
    setAdmins([
      {
        fplId: manager.id,
        name: `${manager.player_first_name} ${manager.player_last_name}`,
        teamName: manager.name,
        isPrimary: true,
      },
    ]);
  };

  const handleCoAdminVerified = (manager: FPLManager) => {
    setAdminError("");
    if (admins.some((a) => a.fplId === manager.id)) {
      setAdminError(
        `FPL Manager ${manager.player_first_name} ${manager.player_last_name} (ID: ${manager.id}) is already an admin.`
      );
      return;
    }

    setAdmins((prev) => [
      ...prev,
      {
        fplId: manager.id,
        name: `${manager.player_first_name} ${manager.player_last_name}`,
        teamName: manager.name,
        isPrimary: prev.length === 0,
      },
    ]);
    setShowAddCoAdmin(false);
  };

  const handleSetPrimary = (fplId: number) => {
    setAdmins((prev) =>
      prev.map((a) => ({
        ...a,
        isPrimary: a.fplId === fplId,
      }))
    );
  };

  const handleRemoveAdmin = (fplId: number) => {
    setAdmins((prev) => {
      const remaining = prev.filter((a) => a.fplId !== fplId);
      if (remaining.length > 0 && !remaining.some((a) => a.isPrimary)) {
        remaining[0].isPrimary = true;
      }
      return remaining;
    });
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

    if (admins.length === 0) {
      setError("Please verify at least one FPL admin account first");
      setLoading(false);
      return;
    }

    const primaryAdmin = admins.find((a) => a.isPrimary) || admins[0];

    try {
      const response = await fetch("/api/admin/tournaments", {
        method: initialData ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: initialData?.id,
          name,
          season,
          adminFplId: primaryAdmin.fplId,
          admins,
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

  const primaryAdmin = admins.find((a) => a.isPrimary) || admins[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-4 border border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
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
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 text-gray-900"
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
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 text-gray-900"
          required
        />
      </div>

      {/* Chip Rules Section with Two Distinct Settings */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
          <Zap className="h-4 w-4 text-indigo-600" />
          <span>FPL Chips Configuration</span>
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
                <Armchair className="h-4 w-4 text-indigo-600" />
                <span>Bench Boost</span>
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
                <Crown className="h-4 w-4 text-amber-500" />
                <span>Triple Captain</span>
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

      {/* Tournament Admins Section (Multi-Admin Support) */}
      <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/60 p-5 space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-indigo-950 flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              <span>Tournament Admins ({admins.length})</span>
            </h3>
            {admins.length > 0 && !showAddCoAdmin && (
              <button
                type="button"
                onClick={() => {
                  setShowAddCoAdmin(true);
                  setAdminError("");
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition cursor-pointer shadow-xs"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>+ Add Co-Admin</span>
              </button>
            )}
          </div>
          <div className="mt-2 flex items-start gap-2 rounded-lg bg-indigo-100/70 p-2.5 text-xs text-indigo-900 border border-indigo-200">
            <Info className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5" />
            <p>
              <strong>Why add multiple admins?</strong> In Fantasy Premier League, an account can only join a limited number of private leagues. Adding co-admins allows your tournament to import teams from leagues joined by multiple organizers. <em>All tournament admins are automatically excluded from match scoring.</em>
            </p>
          </div>
        </div>

        {adminError && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 border border-red-200 text-xs text-red-800">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{adminError}</span>
          </div>
        )}

        {/* When no admins are added yet */}
        {admins.length === 0 ? (
          <div className="mt-2">
            <FPLVerifier
              onVerified={handlePrimaryVerified}
              title="Step 1: Verify Primary FPL Admin"
              description="Verify your primary FPL account to create this tournament. You will be able to add co-admins right after."
              buttonText="Verify Primary Admin"
            />
          </div>
        ) : (
          /* List of configured admins */
          <div className="space-y-2.5">
            {admins.map((admin) => (
              <div
                key={admin.fplId}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-xl p-3.5 border transition ${
                  admin.isPrimary
                    ? "bg-white border-amber-300 shadow-sm ring-1 ring-amber-200"
                    : "bg-white border-gray-200 shadow-xs"
                }`}
              >
                <div className="flex items-center gap-3 min-w-[220px]">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-bold ${
                      admin.isPrimary
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    }`}
                  >
                    {admin.isPrimary ? (
                      <Crown className="h-5 w-5 text-amber-600" />
                    ) : (
                      <Shield className="h-5 w-5 text-indigo-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900">
                        {admin.name}
                      </p>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          admin.isPrimary
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                        }`}
                      >
                        {admin.isPrimary ? "PRIMARY ADMIN" : "CO-ADMIN"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Team: <span className="font-semibold text-gray-700">{admin.teamName}</span> • FPL ID: <span className="font-mono text-gray-700">#{admin.fplId}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!admin.isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(admin.fplId)}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-amber-700 transition cursor-pointer"
                      title="Set as the primary tournament administrator"
                    >
                      <Crown className="h-3 w-3 text-amber-500" />
                      <span>Make Primary</span>
                    </button>
                  )}
                  {admins.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAdmin(admin.fplId)}
                      className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50/50 p-1.5 text-xs text-red-600 hover:bg-red-100 transition cursor-pointer"
                      title="Remove this admin"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Inline Add Co-Admin Form */}
            {showAddCoAdmin && (
              <div className="mt-4 rounded-xl border border-indigo-300 bg-white p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-indigo-600" />
                    <h4 className="text-sm font-bold text-gray-900">
                      Add Co-Admin Account
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCoAdmin(false);
                      setAdminError("");
                    }}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Enter another organizer&apos;s FPL entry ID. This enables importing leagues that this co-admin has joined.
                </p>
                <FPLVerifier
                  onVerified={handleCoAdminVerified}
                  title="Verify Co-Admin"
                  description="Enter FPL Manager ID"
                  buttonText="Verify & Add Co-Admin"
                  autoClearOnVerify={true}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {admins.length > 0 && primaryAdmin && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 p-3.5 border border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-700 shrink-0" />
          <div className="text-xs text-green-800">
            <span>
              Ready to save with <strong>{admins.length}</strong> configured admin{admins.length > 1 ? "s" : ""}. Primary Admin: <strong>{primaryAdmin.name}</strong> (#{primaryAdmin.fplId}).
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || admins.length === 0}
          className="inline-flex items-center justify-center gap-2 flex-1 rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:bg-gray-400 cursor-pointer transition"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>
            {loading
              ? "Saving..."
              : initialData
                ? "Update Tournament"
                : "Create Tournament"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={loading}
          className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

