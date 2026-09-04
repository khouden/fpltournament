"use client";

import { useState, useMemo } from "react";
import {
  getAdminLeaguesForTournamentAction,
  importLeagueAsGroupAction,
  updateGroupAction,
  updateGroupLogoAction,
  deleteGroupAction,
  type TournamentAdminView,
  type LeagueView,
} from "@/lib/group-actions";
import { TeamLogoPicker } from "./team-logo-picker";
import { suggestLogoForTeamName } from "@/lib/team-logos";
import { FantasyTeamModal } from "./fantasy-team-modal";
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
  Crown,
  Search,
  Image as ImageIcon,
  Eye,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
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
import { EmptyState } from "@/components/ui/empty-state";

export interface GroupMember {
  id: string;
  fplName: string;
  fplTeamName: string | null;
  fplId: number;
  isAdmin: boolean;
}

export interface Group {
  id: string;
  name: string;
  logo: string | null;
  fplLeagueId: number | null;
  members: GroupMember[];
}

export interface GroupManagerProps {
  tournamentId: string;
  tournamentName?: string;
  initialGroups: Group[];
  initialAdmins?: TournamentAdminView[];
  gameweek?: number;
  allowBenchBoost?: boolean;
  allowTripleCaptain?: boolean;
}

export function GroupManager({
  tournamentId,
  tournamentName,
  initialGroups,
  initialAdmins = [],
  gameweek = 1,
  allowBenchBoost = true,
  allowTripleCaptain = true,
}: GroupManagerProps) {
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [leagues, setLeagues] = useState<LeagueView[]>([]);
  const [tournamentAdmins, setTournamentAdmins] = useState<TournamentAdminView[]>(initialAdmins);
  const [selectedAdminFilter, setSelectedAdminFilter] = useState<number | "ALL">("ALL");
  const [leagueSearchQuery, setLeagueSearchQuery] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [loadingLeagues, setLoadingLeagues] = useState(false);
  const [importing, setImporting] = useState<number | null>(null);

  // Rename / Edit state
  const [renamingGroup, setRenamingGroup] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameLogo, setRenameLogo] = useState<string | null>(null);
  const [updatingGroup, setUpdatingGroup] = useState(false);

  // Delete confirmation
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [deletingGroup, setDeletingGroup] = useState(false);

  // Expandable members state per group (keyed by groupId)
  const [expandedMembers, setExpandedMembers] = useState<Record<string, boolean>>({});

  // Logo Pickers state
  const [importLogos, setImportLogos] = useState<Record<number, string | null>>({});
  const [activePickerLeague, setActivePickerLeague] = useState<LeagueView | null>(null);
  const [activePickerGroup, setActivePickerGroup] = useState<Group | null>(null);

  // Fantasy Team Squad Modal state
  const [activeSquadPlayer, setActiveSquadPlayer] = useState<{ member: GroupMember; group: Group } | null>(null);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const toggleMembersExpand = (groupId: string) => {
    setExpandedMembers((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const getMonogram = (name: string) => {
    const clean = name.trim();
    if (!clean) return "FC";
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  const fetchLeagues = async () => {
    setLoadingLeagues(true);
    setError("");
    const result = await getAdminLeaguesForTournamentAction(tournamentId);
    if (result.success && result.leagues) {
      setLeagues(result.leagues);
      if (result.admins && result.admins.length > 0) {
        setTournamentAdmins(result.admins);
      }
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
      setError(result.error || "Failed to fetch leagues from FPL API");
    }
    setLoadingLeagues(false);
  };

  const handleToggleImport = () => {
    const nextState = !showImport;
    setShowImport(nextState);
    if (nextState && leagues.length === 0) {
      fetchLeagues();
    }
  };

  const handleImport = async (leagueId: number, adminFplId?: number) => {
    setImporting(leagueId);
    setError("");
    const chosenLogo = importLogos[leagueId] || null;
    const result = await importLeagueAsGroupAction(
      tournamentId,
      leagueId,
      undefined,
      chosenLogo,
      adminFplId
    );
    if (result.success && result.group) {
      const newGroup = result.group as Group;
      setGroups((prev) => [...prev, newGroup]);
      setLeagues((prev) =>
        prev.map((l) =>
          l.id === leagueId ? { ...l, isAlreadyImported: true } : l
        )
      );
      // Auto-expand the newly imported group
      setExpandedMembers((prev) => ({ ...prev, [newGroup.id]: true }));
      showToast(`Imported "${newGroup.name}" as an official tournament team!`);
    } else {
      setError(result.error || "Failed to import group");
    }
    setImporting(null);
  };

  const handleUpdateGroup = async (groupId: string) => {
    if (!renameValue.trim()) return;
    setUpdatingGroup(true);
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
      showToast("Team renamed successfully");
    } else {
      setError(result.error || "Failed to update team");
    }
    setUpdatingGroup(false);
  };

  const handleDirectChangeLogo = async (groupId: string, logoPath: string | null) => {
    const result = await updateGroupLogoAction(groupId, tournamentId, logoPath);
    if (result.success && result.group) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId ? { ...g, logo: result.group!.logo } : g
        )
      );
      showToast("Team crest updated");
    } else {
      setError(result.error || "Failed to update crest");
    }
  };

  const handleDelete = async (groupId: string) => {
    setDeletingGroup(true);
    setError("");
    const result = await deleteGroupAction(groupId, tournamentId);
    if (result.success) {
      const deleted = groups.find((g) => g.id === groupId);
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      if (deleted?.fplLeagueId) {
        setLeagues((prev) =>
          prev.map((l) =>
            l.id === deleted.fplLeagueId ? { ...l, isAlreadyImported: false } : l
          )
        );
      }
      showToast(`Team "${deleted?.name || ""}" deleted`);
      setGroupToDelete(null);
    } else {
      setError(result.error || "Failed to delete team");
      setGroupToDelete(null);
    }
    setDeletingGroup(false);
  };

  const handleAutoSuggestAllLogos = () => {
    const updated = { ...importLogos };
    let count = 0;
    leagues.forEach((l) => {
      const match = suggestLogoForTeamName(l.name);
      if (match) {
        updated[l.id] = match.path;
        count++;
      }
    });
    setImportLogos(updated);
    showToast(`Auto-assigned authentic crests to ${count} leagues based on names!`);
  };

  // Filter leagues
  const filteredLeagues = useMemo(() => {
    return leagues.filter((league) => {
      if (
        selectedAdminFilter !== "ALL" &&
        league.adminFplId !== selectedAdminFilter
      ) {
        return false;
      }
      if (leagueSearchQuery.trim()) {
        const q = leagueSearchQuery.trim().toLowerCase();
        const matchName = league.name.toLowerCase().includes(q);
        const matchId = String(league.id).includes(q);
        const matchAdmin = (league.adminName || "").toLowerCase().includes(q);
        return matchName || matchId || matchAdmin;
      }
      return true;
    });
  }, [leagues, selectedAdminFilter, leagueSearchQuery]);

  const targetGroupToDelete = useMemo(() => {
    return groups.find((g) => g.id === groupToDelete);
  }, [groups, groupToDelete]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Messages / Alerts */}
      {error && (
        <Alert variant="destructive" className="animate-fpl-fade-in border-[#E9007F]/30 bg-[#E9007F]/10 text-[#E9007F]">
          <AlertCircle className="h-4 w-4 text-[#E9007F]" />
          <AlertTitle className="font-bold">Error</AlertTitle>
          <AlertDescription className="text-xs sm:text-sm font-medium">{error}</AlertDescription>
        </Alert>
      )}

      {successMsg && (
        <Alert variant="success" className="animate-fpl-fade-in border-emerald-500/30 bg-emerald-500/10 text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertTitle className="font-bold">Success</AlertTitle>
          <AlertDescription className="text-xs sm:text-sm font-medium">{successMsg}</AlertDescription>
        </Alert>
      )}

      {/* 4. Group Management Toolbar */}
      <section
        aria-label="Participating Groups Toolbar"
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E5E5E5]"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#1F1F1F] tracking-tight">
              Participating Groups
            </h2>
            <span className="inline-flex items-center justify-center rounded-full bg-[#37003C] px-2.5 py-0.5 text-xs font-extrabold text-white shadow-2xs">
              {groups.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#777777]">
            Each group represents an official FPL Classic League competing as a tournament team.
          </p>
        </div>

        <Button
          onClick={handleToggleImport}
          variant="default"
          className="h-10 px-4 text-xs sm:text-sm font-bold bg-[#37003C] hover:bg-[#5A0A63] text-white rounded-[8px] transition-all gap-2 shadow-sm shrink-0 self-start sm:self-center"
        >
          {showImport ? (
            <>
              <X className="h-4 w-4" />
              <span>Close Import</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 text-[#00FF87]" />
              <span>Import Group from FPL League</span>
            </>
          )}
        </Button>
      </section>

      {/* 5. FPL League Import Experience (Expandable) */}
      {showImport && (
        <section
          aria-label="FPL League Import Workspace"
          className="rounded-[14px] border-2 border-[#37003C]/20 bg-[#37003C]/[0.02] p-4 sm:p-6 shadow-xs space-y-5 animate-fpl-fade-in"
        >
          {/* Step guidance & Workflow header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E5E5E5] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#37003C] text-white">
                  <Users className="h-4 w-4 text-[#00FF87]" />
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#1F1F1F] tracking-tight">
                  Import from FPL Classic Leagues
                </h3>
              </div>
              <p className="text-xs text-[#666666]">
                Select a private Classic League from any tournament administrator and customize club branding before importing.
              </p>
            </div>

            {/* Workflow steps badge */}
            <div className="hidden lg:flex items-center gap-2 text-[11px] font-semibold text-[#555555] bg-white px-3 py-1.5 rounded-lg border border-[#E5E5E5] shadow-2xs">
              <span className="text-[#37003C] font-bold">1. Organizer</span>
              <span>→</span>
              <span className="text-[#37003C] font-bold">2. Find League</span>
              <span>→</span>
              <span className="text-[#37003C] font-bold">3. Choose Crest</span>
              <span>→</span>
              <span className="text-[#37003C] font-bold">4. Import</span>
            </div>
          </div>

          {loadingLeagues ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-[#777777] bg-white rounded-xl border border-[#E5E5E5]">
              <Loader2 className="h-8 w-8 animate-spin text-[#37003C] mb-3" />
              <p className="text-sm font-bold text-[#1F1F1F]">Fetching leagues from official FPL API...</p>
              <p className="text-xs text-[#777777] mt-1">Connecting to Fantasy Premier League accounts</p>
            </div>
          ) : leagues.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#E5E5E5] bg-white p-8 text-center">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-[#1F1F1F]">No Classic Leagues found</p>
              <p className="text-xs text-[#777777] mt-1 max-w-md mx-auto">
                No private classic leagues could be retrieved. Ensure tournament administrators have active private leagues on the official FPL website.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fetchLeagues}
                className="mt-4 gap-1.5 text-xs font-semibold"
              >
                <span>Retry Fetching</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Organizer Filter Pills */}
              {tournamentAdmins.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wider">
                      Filter by Organizer:
                    </span>
                    <span className="text-[11px] text-[#777777] hidden sm:inline">
                      Leagues can come from any registered tournament administrator
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedAdminFilter("ALL")}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                        selectedAdminFilter === "ALL"
                          ? "bg-[#37003C] text-white shadow-xs"
                          : "bg-white border border-[#E5E5E5] text-[#555555] hover:bg-[#F7F7F7]"
                      }`}
                    >
                      <span>All Organizers</span>
                      <span className="rounded-full bg-black/15 px-1.5 py-0.2 text-[10px] font-bold">
                        {leagues.length}
                      </span>
                    </button>

                    {tournamentAdmins.map((admin) => {
                      const count = leagues.filter(
                        (l) => l.adminFplId === admin.fplId
                      ).length;
                      const isSelected = selectedAdminFilter === admin.fplId;

                      return (
                        <button
                          key={admin.fplId}
                          type="button"
                          onClick={() => setSelectedAdminFilter(admin.fplId)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-[#37003C] text-white shadow-xs"
                              : "bg-white border border-[#E5E5E5] text-[#555555] hover:bg-[#F7F7F7]"
                          }`}
                        >
                          {admin.isPrimary ? (
                            <Crown className={`h-3 w-3 ${isSelected ? "text-amber-300" : "text-amber-500"}`} />
                          ) : (
                            <Shield className={`h-3 w-3 ${isSelected ? "text-[#00FF87]" : "text-[#37003C]"}`} />
                          )}
                          <span>{admin.name || `Admin #${admin.fplId}`}</span>
                          <span className="rounded-full bg-black/15 px-1.5 py-0.2 text-[10px] font-bold">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Search & Auto-Match Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#777777] pointer-events-none" />
                  <Input
                    type="text"
                    value={leagueSearchQuery}
                    onChange={(e) => setLeagueSearchQuery(e.target.value)}
                    placeholder="Search league name, league ID, or organizer..."
                    className="pl-9 pr-8 bg-white border-[#E5E5E5] h-9 text-xs sm:text-sm shadow-2xs focus-visible:ring-[#37003C]"
                  />
                  {leagueSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setLeagueSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-[#777777] hover:bg-[#EEEEEE] hover:text-[#1F1F1F] transition cursor-pointer"
                      aria-label="Clear league search"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span className="text-xs text-[#777777] font-medium">
                    {filteredLeagues.length} of {leagues.length} leagues
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAutoSuggestAllLogos}
                    className="gap-1.5 text-xs font-semibold h-9 bg-white border-[#E5E5E5] text-[#37003C] hover:bg-[#37003C]/5 shadow-2xs"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#37003C]" />
                    <span>Auto-Match Logos</span>
                  </Button>
                </div>
              </div>

              {/* League Cards List */}
              {filteredLeagues.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#E5E5E5] bg-white p-8 text-center shadow-xs">
                  <Search className="h-7 w-7 text-[#AAAAAA] mx-auto mb-2" />
                  <p className="text-sm font-bold text-[#1F1F1F]">No FPL leagues found</p>
                  <p className="text-xs text-[#777777] mt-1">
                    Try another organizer or search term.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setLeagueSearchQuery("");
                      setSelectedAdminFilter("ALL");
                    }}
                    className="mt-3 text-xs font-semibold"
                  >
                    Reset filters
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredLeagues.map((league) => {
                    const currentChosenLogo = importLogos[league.id];

                    return (
                      <div
                        key={`${league.adminFplId || "admin"}_${league.id}`}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 rounded-[12px] bg-white p-3.5 sm:p-4 border border-[#E5E5E5] shadow-xs transition hover:border-[#37003C]/30"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Logo selector thumbnail button */}
                          <button
                            type="button"
                            onClick={() => setActivePickerLeague(league)}
                            disabled={league.isAlreadyImported}
                            className="group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#E5E5E5] bg-[#F7F7F7] p-1 hover:border-[#37003C] hover:bg-[#37003C]/5 transition cursor-pointer disabled:opacity-60 shadow-2xs"
                            title="Click to choose club crest"
                          >
                            {currentChosenLogo ? (
                              <img
                                src={currentChosenLogo}
                                alt={league.name}
                                className="h-9 w-9 object-contain"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#37003C] text-white font-extrabold text-xs">
                                {getMonogram(league.name)}
                              </div>
                            )}
                            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#37003C] text-[9px] font-bold text-white shadow-xs">
                              <Pencil className="h-2.5 w-2.5 text-[#00FF87]" />
                            </span>
                          </button>

                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold text-[#1F1F1F] text-sm sm:text-base leading-snug truncate">
                                {league.name}
                              </h4>
                              {league.isPrivate && (
                                <span className="inline-flex items-center px-2 py-0.2 rounded text-[10px] font-bold bg-[#37003C]/5 text-[#37003C] border border-[#37003C]/10">
                                  Mini-League
                                </span>
                              )}
                              {league.adminName && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded text-[10px] font-semibold bg-white text-[#555555] border border-[#E5E5E5]">
                                  <Shield className="h-2.5 w-2.5 text-[#37003C]" />
                                  <span>Owner: {league.adminName}</span>
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-[#777777]">
                              <span className="font-mono">FPL League #{league.id}</span>
                              <span className="text-[#CCCCCC]">·</span>
                              <button
                                type="button"
                                onClick={() => setActivePickerLeague(league)}
                                disabled={league.isAlreadyImported}
                                className="text-[11px] font-semibold text-[#37003C] hover:underline cursor-pointer disabled:pointer-events-none"
                              >
                                {currentChosenLogo ? "Change Crest" : "Choose Crest"}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Row Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setActivePickerLeague(league)}
                            disabled={league.isAlreadyImported}
                            className="h-8 px-3 text-xs font-semibold border-[#E5E5E5] text-[#555555] hover:text-[#1F1F1F] gap-1.5"
                          >
                            <ImageIcon className="h-3.5 w-3.5 text-[#37003C]" />
                            <span>Crest</span>
                          </Button>

                          {league.isAlreadyImported ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 text-xs font-bold">
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Imported</span>
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleImport(league.id, league.adminFplId)}
                              disabled={importing === league.id}
                              className="h-8 px-3.5 text-xs font-bold bg-[#37003C] hover:bg-[#5A0A63] text-white rounded-[8px] gap-1.5 shadow-2xs"
                            >
                              {importing === league.id ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-current" />
                                  <span>Importing...</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="h-3.5 w-3.5 text-[#00FF87]" />
                                  <span>Import as Team</span>
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* 6. Imported Groups Section */}
      <section aria-label="Imported Groups List" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-extrabold text-[#1F1F1F] tracking-tight">
            Imported Groups
          </h3>
          <span className="text-xs text-[#777777] font-medium">
            {groups.length} {groups.length === 1 ? "group" : "groups"} active
          </span>
        </div>

        {groups.length === 0 ? (
          <EmptyState
            icon={<Users className="h-8 w-8 text-[#37003C]" />}
            title="No groups imported yet"
            description="Import an FPL Classic League to create your first tournament team. You can discover leagues owned by any tournament organizer."
            actionLabel="+ Import Group from FPL League"
            onAction={handleToggleImport}
            className="border-2 border-dashed border-[#E5E5E5] bg-white py-12"
          />
        ) : (
          <div className="space-y-4">
            {groups.map((group) => {
              const isRenaming = renamingGroup === group.id;
              const isExpanded = expandedMembers[group.id] !== false; // default open or expanded
              const activePlayers = group.members.filter((m) => !m.isAdmin);
              const adminMembers = group.members.filter((m) => m.isAdmin);

              return (
                <div
                  key={group.id}
                  className="rounded-[14px] border border-[#E5E5E5] bg-white shadow-fpl-sm overflow-hidden transition-all duration-200 hover:border-[#37003C]/30"
                >
                  {/* Group Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 p-4 sm:p-5 border-b border-[#E5E5E5] bg-white">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Team Crest (48-64px) */}
                      <button
                        type="button"
                        onClick={() => setActivePickerGroup(group)}
                        className="group relative flex h-13 w-13 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl border border-[#E5E5E5] bg-[#F7F7F7] p-1.5 hover:border-[#37003C] hover:ring-2 hover:ring-[#37003C]/20 transition cursor-pointer shadow-xs"
                        title="Click to change team crest"
                      >
                        {group.logo ? (
                          <img
                            src={group.logo}
                            alt={group.name}
                            className="h-10 w-10 sm:h-11 sm:w-11 object-contain"
                          />
                        ) : (
                          <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-lg bg-[#37003C] text-white font-extrabold text-sm sm:text-base">
                            {getMonogram(group.name)}
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#37003C] text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition shadow-xs">
                          <Pencil className="h-2 w-2 text-[#00FF87]" />
                        </span>
                      </button>

                      {/* Team Identity / Inline Rename */}
                      {isRenaming ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <Input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleUpdateGroup(group.id);
                              if (e.key === "Escape") setRenamingGroup(null);
                            }}
                            className="h-8 w-56 text-sm border-[#37003C] focus-visible:ring-[#37003C]"
                            placeholder="Team name"
                            autoFocus
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setActivePickerGroup(group)}
                            className="gap-1 text-xs h-8"
                          >
                            <ImageIcon className="h-3.5 w-3.5 text-[#37003C]" />
                            <span>Crest</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateGroup(group.id)}
                            disabled={updatingGroup}
                            className="h-8 text-xs font-bold bg-[#37003C] hover:bg-[#5A0A63] text-white"
                          >
                            {updatingGroup ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setRenamingGroup(null);
                              setRenameValue("");
                              setRenameLogo(null);
                            }}
                            className="h-8 text-xs text-[#777777]"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-1 min-w-0">
                          <h4 className="text-base sm:text-lg font-extrabold text-[#1F1F1F] tracking-tight truncate">
                            {group.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-[#666666]">
                            <span className="font-bold text-[#1F1F1F]">
                              {activePlayers.length} Active {activePlayers.length === 1 ? "Player" : "Players"}
                            </span>
                            {group.fplLeagueId && (
                              <>
                                <span className="text-[#CCCCCC]">·</span>
                                <span className="font-mono text-[#777777]">
                                  FPL League #{group.fplLeagueId}
                                </span>
                              </>
                            )}
                            {adminMembers.length > 0 && (
                              <>
                                <span className="text-[#CCCCCC]">·</span>
                                <span className="text-amber-700 font-medium">
                                  {adminMembers.length} {adminMembers.length === 1 ? "admin" : "admins"} excluded
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Team Header Actions */}
                    {!isRenaming && (
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActivePickerGroup(group)}
                          className="h-8 px-2.5 text-xs font-semibold text-[#555555] hover:text-[#37003C] hover:bg-[#37003C]/5 gap-1"
                          title="Change team crest"
                        >
                          <ImageIcon className="h-3.5 w-3.5 text-[#37003C]" />
                          <span className="hidden sm:inline">Change Crest</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRenamingGroup(group.id);
                            setRenameValue(group.name);
                            setRenameLogo(group.logo);
                          }}
                          className="h-8 px-2.5 text-xs font-semibold border-[#E5E5E5] text-[#555555] hover:text-[#1F1F1F] hover:bg-[#F7F7F7] gap-1"
                          title="Rename team"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span>Rename</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setGroupToDelete(group.id)}
                          className="h-8 px-2.5 text-xs font-semibold text-[#E9007F] hover:text-[#d00072] hover:bg-[#E9007F]/10 gap-1"
                          title="Delete team"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Members Snapshot Collapsible Bar */}
                  <div className="bg-[#FAFAFA] border-b border-[#E5E5E5] px-4 sm:px-5 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <Users className="h-3.5 w-3.5 text-[#777777]" />
                      <span className="font-bold text-[#1F1F1F]">Members Snapshot</span>
                      <span className="text-[#777777] hidden sm:inline">
                        ({activePlayers.length} active players
                        {adminMembers.length > 0 ? `, ${adminMembers.length} excluded admin` : ""})
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleMembersExpand(group.id)}
                      className="h-7 px-2.5 text-xs font-semibold text-[#37003C] hover:bg-[#37003C]/10 gap-1"
                    >
                      <span>{isExpanded ? "Hide Members" : "View Members"}</span>
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>

                  {/* Expandable Members Table */}
                  {isExpanded && (
                    <div className="p-0 animate-fpl-fade-in">
                      <div className="px-4 sm:px-5 py-2 bg-[#FFFBEB]/50 border-b border-[#FDE68A]/40 text-[11px] text-[#92400E] flex items-center justify-between gap-2">
                        <span>Member lists are captured when the FPL league is imported. Tournament administrators are automatically excluded from team scoring.</span>
                      </div>

                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-b border-[#E5E5E5] bg-[#F7F7F7]/70 hover:bg-[#F7F7F7]">
                              <TableHead className="py-2.5 px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777]">Manager Name</TableHead>
                              <TableHead className="py-2.5 px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777]">FPL Team</TableHead>
                              <TableHead className="py-2.5 px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777]">FPL ID</TableHead>
                              <TableHead className="py-2.5 px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777]">Status / Role</TableHead>
                              <TableHead className="py-2.5 px-4 text-right text-xs font-extrabold uppercase tracking-wider text-[#777777]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="divide-y divide-[#E5E5E5]">
                            {group.members.map((member) => (
                              <TableRow
                                key={member.id}
                                className={`transition-colors ${
                                  member.isAdmin
                                    ? "bg-amber-50/40 hover:bg-amber-50/70 text-[#777777]"
                                    : "hover:bg-[#37003C]/[0.02] text-[#1F1F1F]"
                                }`}
                              >
                                <TableCell className="py-2.5 px-4 font-semibold text-xs sm:text-sm">
                                  <div className="flex items-center gap-1.5">
                                    <span>{member.fplName}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-2.5 px-4 text-xs text-[#666666]">
                                  {member.fplTeamName || "—"}
                                </TableCell>
                                <TableCell className="py-2.5 px-4">
                                  <a
                                    href={`https://fantasy.premierleague.com/entry/${member.fplId}/history`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 font-mono text-xs text-[#777777] hover:text-[#37003C] hover:underline transition-colors"
                                    title="View manager history on official FPL"
                                  >
                                    <span>#{member.fplId}</span>
                                    <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                                  </a>
                                </TableCell>
                                <TableCell className="py-2.5 px-4">
                                  {member.isAdmin ? (
                                    <span
                                      className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-[6px] bg-amber-500/15 text-amber-800 border border-amber-500/30"
                                      title="Tournament administrators are automatically excluded from team scoring"
                                    >
                                      <Shield className="h-3 w-3 text-amber-600" />
                                      <span>Admin (Excluded)</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-[6px] bg-[#F4F4F5] text-[#555555]">
                                      Player
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="py-2.5 px-4 text-right">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setActiveSquadPlayer({ member, group })}
                                    className="h-7 px-2.5 text-xs font-semibold text-[#37003C] hover:bg-[#37003C]/10 gap-1"
                                    title={`View ${member.fplName}'s tactical pitch squad`}
                                  >
                                    <Eye className="h-3.5 w-3.5 text-[#37003C]" />
                                    <span>View Squad</span>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Delete Group Confirmation Dialog */}
      <AlertDialog
        open={!!groupToDelete}
        onOpenChange={(open) => !open && setGroupToDelete(null)}
      >
        <AlertDialogContent className="max-w-md rounded-2xl border-[#E5E5E5] bg-white p-6 shadow-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-2.5 text-[#E9007F]">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E9007F]/10">
                <Trash2 className="h-5 w-5 text-[#E9007F]" />
              </div>
              <AlertDialogTitle className="text-lg font-bold text-[#1F1F1F]">
                Delete {targetGroupToDelete?.name || "Team"}?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs sm:text-sm text-[#777777] mt-2">
              This will remove the imported tournament group and its roster snapshot. Any scheduled matches involving this team will also be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel
              disabled={deletingGroup}
              className="border-[#E5E5E5] text-[#555555] hover:text-[#1F1F1F]"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => groupToDelete && handleDelete(groupToDelete)}
              disabled={deletingGroup}
              className="bg-[#E9007F] hover:bg-[#d00072] text-white font-bold"
            >
              {deletingGroup ? "Deleting..." : "Delete Group"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
          title={`Choose Crest for "${activePickerGroup.name}"`}
        />
      )}

      {/* Fantasy Team Squad Modal */}
      {activeSquadPlayer && (
        <FantasyTeamModal
          isOpen={true}
          onClose={() => setActiveSquadPlayer(null)}
          fplId={activeSquadPlayer.member.fplId}
          managerName={activeSquadPlayer.member.fplName}
          fplTeamName={activeSquadPlayer.member.fplTeamName}
          tournamentTeamName={activeSquadPlayer.group.name}
          tournamentTeamLogo={activeSquadPlayer.group.logo}
          gameweek={gameweek}
          allowBenchBoost={allowBenchBoost}
          allowTripleCaptain={allowTripleCaptain}
        />
      )}
    </div>
  );
}
