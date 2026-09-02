"use client";

import { useState, useEffect } from "react";
import {
  getAdminLeaguesForTournamentAction,
  importLeagueAsGroupAction,
  updateGroupAction,
  updateGroupLogoAction,
  deleteGroupAction,
} from "@/lib/group-actions";
import { TeamLogoPicker } from "./team-logo-picker";
import { suggestLogoForTeamName } from "@/lib/team-logos";
import {
  Users,
  Plus,
  Check,
  Loader2,
  Trash2,
  Pencil,
  AlertCircle,
  CheckCircle2,
  X,
  Shield,
  Image as ImageIcon,
} from "lucide-react";

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
  logo: string | null;
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

  // Rename / Edit state
  const [renamingGroup, setRenamingGroup] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameLogo, setRenameLogo] = useState<string | null>(null);

  // Logo Pickers state
  const [importLogos, setImportLogos] = useState<Record<number, string | null>>({});
  const [activePickerLeague, setActivePickerLeague] = useState<League | null>(null);
  const [activePickerGroup, setActivePickerGroup] = useState<Group | null>(null);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const fetchLeagues = async () => {
    setLoadingLeagues(true);
    setError("");
    const result = await getAdminLeaguesForTournamentAction(tournamentId);
    if (result.success && result.leagues) {
      setLeagues(result.leagues);
      // Pre-populate auto-suggested logos for each league
      const initialMap: Record<number, string | null> = {};
      result.leagues.forEach((l) => {
        const suggestion = suggestLogoForTeamName(l.name);
        if (suggestion) {
          initialMap[l.id] = suggestion.path;
        }
      });
      setImportLogos(initialMap);
    } else {
      setError(result.error || "Failed to fetch leagues");
    }
    setLoadingLeagues(false);
  };

  const handleImport = async (leagueId: number) => {
    setImporting(leagueId);
    setError("");
    const chosenLogo = importLogos[leagueId] || null;
    const result = await importLeagueAsGroupAction(
      tournamentId,
      leagueId,
      undefined,
      chosenLogo
    );
    if (result.success && result.group) {
      setGroups((prev) => [...prev, result.group as Group]);
      setLeagues((prev) =>
        prev.map((l) =>
          l.id === leagueId ? { ...l, isAlreadyImported: true } : l
        )
      );
      showToast(`Imported "${result.group.name}" successfully`);
    } else {
      setError(result.error || "Failed to import group");
    }
    setImporting(null);
  };

  const handleUpdateGroup = async (groupId: string) => {
    if (!renameValue.trim()) return;
    setError("");
    const result = await updateGroupAction(groupId, tournamentId, {
      name: renameValue.trim(),
      logo: renameLogo,
    });
    if (result.success && result.group) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? { ...g, name: result.group!.name, logo: result.group!.logo }
            : g
        )
      );
      setRenamingGroup(null);
      setRenameValue("");
      setRenameLogo(null);
      showToast("Team updated successfully");
    } else {
      setError(result.error || "Failed to update team");
    }
  };

  const handleDirectChangeLogo = async (groupId: string, newLogo: string | null) => {
    setError("");
    const result = await updateGroupLogoAction(groupId, tournamentId, newLogo);
    if (result.success && result.group) {
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, logo: result.group!.logo } : g))
      );
      showToast("Logo updated");
    } else {
      setError(result.error || "Failed to update logo");
    }
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm("Are you sure you want to delete this group?")) return;
    setError("");
    const result = await deleteGroupAction(groupId, tournamentId);
    if (result.success) {
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      showToast("Group deleted");
    } else {
      setError(result.error || "Failed to delete group");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <span>Teams & Groups ({groups.length})</span>
          </h2>
          <p className="text-sm text-gray-500">
            Import FPL Classic Leagues, customize club logos, and manage team rosters
          </p>
        </div>
        <button
          onClick={() => {
            setShowImport(!showImport);
            if (!showImport && leagues.length === 0) fetchLeagues();
          }}
          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition cursor-pointer"
        >
          {showImport ? (
            <>
              <X className="h-4 w-4" />
              <span>Close</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Import Group</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 border border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 border border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          <p className="text-sm text-green-800">{successMsg}</p>
        </div>
      )}

      {/* Import Panel */}
      {showImport && (
        <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/70 p-5 space-y-4">
          <div>
            <h3 className="font-bold text-indigo-950 flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" />
              <span>Import from FPL Classic Leagues</span>
            </h3>
            <p className="mt-1 text-xs text-indigo-700">
              Select a Classic League and customize the team logo before importing.
            </p>
          </div>

          {loadingLeagues ? (
            <div className="flex items-center gap-2 text-sm text-indigo-600 py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading leagues from FPL...</span>
            </div>
          ) : leagues.length === 0 ? (
            <p className="text-sm text-indigo-700 py-2">
              No leagues found. Please verify the Admin FPL Entry ID.
            </p>
          ) : (
            <div className="space-y-2.5">
              {leagues.map((league) => {
                const currentChosenLogo = importLogos[league.id];
                return (
                  <div
                    key={league.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3.5 shadow-xs border border-indigo-100"
                  >
                    <div className="flex items-center gap-3 min-w-[200px]">
                      {/* Logo selector thumbnail button */}
                      <button
                        type="button"
                        onClick={() => setActivePickerLeague(league)}
                        disabled={league.isAlreadyImported}
                        className="group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-1 hover:border-indigo-400 hover:bg-indigo-50/50 transition cursor-pointer disabled:opacity-60"
                        title="Click to choose a custom logo"
                      >
                        {currentChosenLogo ? (
                          <img
                            src={currentChosenLogo}
                            alt={league.name}
                            className="h-9 w-9 object-contain"
                          />
                        ) : (
                          <Shield className="h-6 w-6 text-gray-400 group-hover:text-indigo-600" />
                        )}
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white shadow-xs">
                          <Pencil className="h-2.5 w-2.5" />
                        </span>
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900">{league.name}</p>
                          {league.isPrivate && (
                            <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                              Mini-League
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <span>League #{league.id}</span>
                          {currentChosenLogo && (
                            <button
                              type="button"
                              onClick={() => setActivePickerLeague(league)}
                              className="text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                            >
                              Change logo
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {league.isAlreadyImported ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200">
                          <Check className="h-3.5 w-3.5" />
                          <span>Imported</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleImport(league.id)}
                          disabled={importing === league.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:bg-gray-400 cursor-pointer transition"
                        >
                          {importing === league.id && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          )}
                          <span>
                            {importing === league.id ? "Importing..." : "Import Team"}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Group List */}
      {groups.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center bg-white">
          <Shield className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-700 font-bold">No teams imported yet</p>
          <p className="text-xs text-gray-500 mt-1">
            Click &quot;Import Group&quot; above to import FPL Classic Leagues as tournament teams.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const isRenaming = renamingGroup === group.id;

            return (
              <div
                key={group.id}
                className="rounded-xl border border-gray-200 bg-white shadow-xs overflow-hidden"
              >
                {/* Group Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3.5 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    {/* Team Logo Badge */}
                    <button
                      type="button"
                      onClick={() => setActivePickerGroup(group)}
                      className="group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white p-1 hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500/20 transition cursor-pointer shadow-2xs"
                      title="Click to change team logo"
                    >
                      {group.logo ? (
                        <img
                          src={group.logo}
                          alt={group.name}
                          className="h-8 w-8 object-contain"
                        />
                      ) : (
                        <Shield className="h-5 w-5 text-gray-400 group-hover:text-indigo-600" />
                      )}
                      <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition shadow-xs">
                        <Pencil className="h-2 w-2" />
                      </span>
                    </button>

                    {isRenaming ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none"
                          placeholder="Team name"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setActivePickerGroup(group)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          <ImageIcon className="h-3.5 w-3.5 text-indigo-600" />
                          <span>Change Logo</span>
                        </button>
                        <button
                          onClick={() => handleUpdateGroup(group.id)}
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs text-white font-bold hover:bg-indigo-700 cursor-pointer shadow-xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setRenamingGroup(null);
                            setRenameValue("");
                            setRenameLogo(null);
                          }}
                          className="text-xs text-gray-500 hover:text-gray-700 px-2"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">
                          {group.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {group.members.filter((m) => !m.isAdmin).length} players
                          {group.fplLeagueId &&
                            ` · FPL League #${group.fplLeagueId}`}
                        </p>
                      </div>
                    )}
                  </div>

                  {!isRenaming && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setActivePickerGroup(group)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                        title="Change team logo"
                      >
                        <ImageIcon className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Logo</span>
                      </button>
                      <button
                        onClick={() => {
                          setRenamingGroup(group.id);
                          setRenameValue(group.name);
                          setRenameLogo(group.logo);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span>Rename</span>
                      </button>
                      <button
                        onClick={() => handleDelete(group.id)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Members Table */}
                <div className="px-4 py-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                        <th className="pb-2">Player</th>
                        <th className="pb-2">Team Name</th>
                        <th className="pb-2 text-right">FPL ID</th>
                        <th className="pb-2 text-right">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {group.members.map((member) => (
                        <tr
                          key={member.id}
                          className={
                            member.isAdmin
                              ? "text-gray-400 italic bg-amber-50/30"
                              : "text-gray-700 hover:bg-gray-50/50"
                          }
                        >
                          <td className="py-2 font-medium">{member.fplName}</td>
                          <td className="py-2 text-gray-500">
                            {member.fplTeamName || "—"}
                          </td>
                          <td className="py-2 text-right font-mono text-xs">
                            {member.fplId}
                          </td>
                          <td className="py-2 text-right">
                            {member.isAdmin && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                                Admin (Excluded)
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Logo Picker for League Import */}
      {activePickerLeague && (
        <TeamLogoPicker
          isOpen={true}
          onClose={() => setActivePickerLeague(null)}
          onSelect={(logoPath) => {
            setImportLogos((prev) => ({
              ...prev,
              [activePickerLeague.id]: logoPath,
            }));
          }}
          currentLogo={importLogos[activePickerLeague.id]}
          teamName={activePickerLeague.name}
          title={`Choose Logo for "${activePickerLeague.name}"`}
        />
      )}

      {/* Modal Logo Picker for Existing Group / Team */}
      {activePickerGroup && (
        <TeamLogoPicker
          isOpen={true}
          onClose={() => setActivePickerGroup(null)}
          onSelect={(logoPath) => {
            if (renamingGroup === activePickerGroup.id) {
              setRenameLogo(logoPath);
            } else {
              handleDirectChangeLogo(activePickerGroup.id, logoPath);
            }
          }}
          currentLogo={
            renamingGroup === activePickerGroup.id
              ? renameLogo
              : activePickerGroup.logo
          }
          teamName={activePickerGroup.name}
          title={`Choose Logo for "${activePickerGroup.name}"`}
        />
      )}
    </div>
  );
}
