"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  getAdminLeaguesForTournamentAction,
  importLeagueAsGroupAction,
  renameGroupAction,
  deleteGroupAction,
} from "@/lib/group-actions";

interface GroupMember {
  id: string;
  fplName: string;
  fplTeamName: string | null;
  fplId: number;
  isAdmin: boolean;
}

interface Group {
  id: string;
  name: string;
  fplLeagueId: number | null;
  members: GroupMember[];
}

interface League {
  id: number;
  name: string;
  isAlreadyImported: boolean;
  isPrivate?: boolean;
}

export function GroupManager({
  tournamentId,
  initialGroups,
}: {
  tournamentId: string;
  initialGroups: Group[];
}) {
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [loadingLeagues, setLoadingLeagues] = useState(false);
  const [importing, setImporting] = useState<number | null>(null);
  const [renamingGroup, setRenamingGroup] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const fetchLeagues = async () => {
    setLoadingLeagues(true);
    setError("");
    const result = await getAdminLeaguesForTournamentAction(tournamentId);
    if (result.success && result.leagues) {
      setLeagues(result.leagues);
    } else {
      setError(result.error || "Failed to fetch leagues");
    }
    setLoadingLeagues(false);
  };

  const handleImport = async (leagueId: number) => {
    setImporting(leagueId);
    setError("");
    const result = await importLeagueAsGroupAction(tournamentId, leagueId);
    if (result.success && result.group) {
      setGroups((prev) => [...prev, result.group as Group]);
      setLeagues((prev) =>
        prev.map((l) =>
          l.id === leagueId ? { ...l, isAlreadyImported: true } : l
        )
      );
      setSuccessMsg(`Imported "${result.group.name}" successfully`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } else {
      setError(result.error || "Failed to import group");
    }
    setImporting(null);
  };

  const handleRename = async (groupId: string) => {
    if (!renameValue.trim()) return;
    setError("");
    const result = await renameGroupAction(groupId, tournamentId, renameValue);
    if (result.success && result.group) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId ? { ...g, name: result.group!.name } : g
        )
      );
      setRenamingGroup(null);
      setRenameValue("");
    } else {
      setError(result.error || "Failed to rename group");
    }
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm("Are you sure you want to delete this group?")) return;
    setError("");
    const result = await deleteGroupAction(groupId, tournamentId);
    if (result.success) {
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      setSuccessMsg("Group deleted");
      setTimeout(() => setSuccessMsg(""), 3000);
    } else {
      setError(result.error || "Failed to delete group");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Groups ({groups.length})
          </h2>
          <p className="text-sm text-gray-500">
            Import FPL Classic Leagues as tournament groups
          </p>
        </div>
        <button
          onClick={() => {
            setShowImport(!showImport);
            if (!showImport && leagues.length === 0) fetchLeagues();
          }}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showImport ? "Close" : "+ Import Group"}
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="rounded-md bg-green-50 p-3">
          <p className="text-sm text-green-800">{successMsg}</p>
        </div>
      )}

      {/* Import Panel */}
      {showImport && (
        <div className="rounded-lg border-2 border-indigo-200 bg-indigo-50 p-4">
          <h3 className="font-semibold text-indigo-900">
            Import from FPL Leagues
          </h3>
          <p className="mt-1 text-sm text-indigo-700">
            Select a Classic League to import as a tournament group
          </p>

          {loadingLeagues ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-indigo-600">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Loading leagues...
            </div>
          ) : leagues.length === 0 ? (
            <p className="mt-4 text-sm text-indigo-600">
              No leagues found. Verify the Admin FPL ID.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {leagues.map((league) => (
                <div
                  key={league.id}
                  className="flex items-center justify-between rounded-md bg-white p-3 shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{league.name}</p>
                      {league.isPrivate && (
                        <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                          Mini-League
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      League ID: {league.id}
                    </p>
                  </div>
                  {league.isAlreadyImported ? (
                    <span className="text-xs font-medium text-green-600">
                      ✓ Imported
                    </span>
                  ) : (
                    <button
                      onClick={() => handleImport(league.id)}
                      disabled={importing === league.id}
                      className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:bg-gray-400"
                    >
                      {importing === league.id ? "Importing..." : "Import"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Group List */}
      {groups.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-500">
            No groups imported yet. Click &quot;Import Group&quot; to add FPL
            leagues.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="rounded-lg border border-gray-200 bg-white shadow-sm"
            >
              {/* Group Header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                {renamingGroup === group.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="rounded border border-gray-300 px-2 py-1 text-sm"
                      placeholder="New name"
                      autoFocus
                    />
                    <button
                      onClick={() => handleRename(group.id)}
                      className="rounded bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setRenamingGroup(null);
                        setRenameValue("");
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {group.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {group.members.filter((m) => !m.isAdmin).length} players
                      {group.fplLeagueId &&
                        ` · League #${group.fplLeagueId}`}
                    </p>
                  </div>
                )}

                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setRenamingGroup(group.id);
                      setRenameValue(group.name);
                    }}
                    className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => handleDelete(group.id)}
                    className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Members */}
              <div className="px-4 py-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500">
                      <th className="pb-2">Player</th>
                      <th className="pb-2">Team</th>
                      <th className="pb-2 text-right">FPL ID</th>
                      <th className="pb-2 text-right">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.members.map((member) => (
                      <tr
                        key={member.id}
                        className={
                          member.isAdmin
                            ? "text-gray-400 italic"
                            : "text-gray-700"
                        }
                      >
                        <td className="py-1">{member.fplName}</td>
                        <td className="py-1">
                          {member.fplTeamName || "—"}
                        </td>
                        <td className="py-1 text-right">{member.fplId}</td>
                        <td className="py-1 text-right">
                          {member.isAdmin && (
                            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                              Admin
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
