"use client";

import { useState, useMemo, useEffect } from "react";
import {
  getAdminLeaguesForTournamentAction,
  importLeagueAsGroupAction,
  updateGroupAction,
  updateGroupLogoAction,
  deleteGroupAction,
  deleteGroupMemberAction,
  type TournamentAdminView,
  type LeagueView,
} from "@/lib/group-actions";
import { TeamLogoPicker } from "./team-logo-picker";
import { suggestLogoForTeamName } from "@/lib/team-logos";
import { FantasyTeamModal } from "./fantasy-team-modal";
import { AddManualTeamModal } from "./add-manual-team-modal";
import { ManualPlayerModal } from "./manual-player-modal";
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
  Clock,
  Calendar,
  UserPlus,
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
  isManual?: boolean;
}

export interface Group {
  id: string;
  name: string;
  logo: string | null;
  fplLeagueId: number | null;
  isManual?: boolean;
  members: GroupMember[];
  matchesCount?: number;
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
  const [importingLeagueIds, setImportingLeagueIds] = useState<Record<number, boolean>>({});

  // Rename / Edit state
  const [renamingGroup, setRenamingGroup] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameLogo, setRenameLogo] = useState<string | null>(null);
  const [updatingGroup, setUpdatingGroup] = useState(false);

  // Delete confirmation
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  // Delete Schedule confirmation when group has scheduled matches
  const [scheduleDeleteModalGroup, setScheduleDeleteModalGroup] = useState<{
    id: string;
    name: string;
    matchesCount: number;
  } | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState(false);

  // Expandable members state per group (keyed by groupId)
  const [expandedMembers, setExpandedMembers] = useState<Record<string, boolean>>({});

  // Logo Pickers state
  const [importLogos, setImportLogos] = useState<Record<number, string | null>>({});
  const [activePickerLeague, setActivePickerLeague] = useState<LeagueView | null>(null);
  const [activePickerGroup, setActivePickerGroup] = useState<Group | null>(null);

  // Fantasy Team Squad Modal state
  const [activeSquadPlayer, setActiveSquadPlayer] = useState<{ member: GroupMember; group: Group } | null>(null);

  // Manual Team and Player Modal states
  const [showAddManualModal, setShowAddManualModal] = useState(false);
  const [activePlayerModalGroup, setActivePlayerModalGroup] = useState<Group | null>(null);
  const [activePlayerToEdit, setActivePlayerToEdit] = useState<GroupMember | null>(null);
  const [playerToDelete, setPlayerToDelete] = useState<{
    memberId: string;
    name: string;
    groupId: string;
  } | null>(null);
  const [deletingPlayer, setDeletingPlayer] = useState(false);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isDeadlineActive, setIsDeadlineActive] = useState(false);
  const [deadlineReason, setDeadlineReason] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/fpl/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.isDeadline) {
          setIsDeadlineActive(true);
          setDeadlineReason(data.reason || "FPL Gameweek deadline in progress");
        } else {
          setIsDeadlineActive(false);
          setDeadlineReason(null);
        }
      })
      .catch(() => {});
  }, []);

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
    if (isDeadlineActive) {
      setError(
        "Cannot import teams during an active FPL deadline. Fantasy Premier League endpoints are locked while the game is updating. Please try again after the deadline window."
      );
      return;
    }
    if (importingLeagueIds[leagueId]) {
      return;
    }
    setImportingLeagueIds((prev) => ({ ...prev, [leagueId]: true }));
    setError("");
    const chosenLogo = importLogos[leagueId] || null;
    try {
      const result = await importLeagueAsGroupAction(
        tournamentId,
        leagueId,
        undefined,
        chosenLogo,
        adminFplId
      );
      if (result.success && result.group) {
        const newGroup = result.group as Group;
        setGroups((prev) => {
          if (
            prev.some(
              (g) =>
                g.id === newGroup.id ||
                (newGroup.fplLeagueId && g.fplLeagueId === newGroup.fplLeagueId)
            )
          ) {
            return prev;
          }
          return [...prev, newGroup];
        });
        setLeagues((prev) =>
          prev.map((l) =>
            l.id === leagueId ? { ...l, isAlreadyImported: true } : l
          )
        );
        // Auto-expand the newly imported group
        setExpandedMembers((prev) => ({ ...prev, [newGroup.id]: true }));
        showToast(`Imported "${newGroup.name}" as an official tournament team!`);
      } else {
        if (result.isDeadline) {
          setIsDeadlineActive(true);
        }
        setError(result.error || "Failed to import group");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to import group. Please try again.";
      setError(errorMessage);
    } finally {
      setImportingLeagueIds((prev) => {
        const next = { ...prev };
        delete next[leagueId];
        return next;
      });
    }
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
    setDeletingGroupId(groupId);
    setDeletingGroup(true);
    setError("");
    try {
      const result = await deleteGroupAction(groupId, tournamentId);
      if (result.success) {
        const deleted = groups.find((g) => g.id === groupId);
        setGroups((prev) => prev.filter((g) => g.id !== groupId));
        if (deleted) {
          setLeagues((prev) =>
            prev.map((l) =>
              (deleted.fplLeagueId && l.id === deleted.fplLeagueId) ||
              l.name.toLowerCase() === deleted.name.toLowerCase()
                ? { ...l, isAlreadyImported: false }
                : l
            )
          );
        }
        showToast(`Team "${deleted?.name || ""}" deleted`);
        setGroupToDelete(null);
      } else {
        if (result.isScheduled) {
          const deleted = groups.find((g) => g.id === groupId);
          setGroupToDelete(null);
          setScheduleDeleteModalGroup({
            id: groupId,
            name: deleted?.name || "Team",
            matchesCount: result.matchesCount || 1,
          });
        } else {
          setError(result.error || "Failed to delete team");
          setGroupToDelete(null);
        }
      }
    } finally {
      setDeletingGroup(false);
      setDeletingGroupId(null);
    }
  };

  const handleDeleteWithSchedule = async (groupId: string, groupName: string) => {
    setDeletingSchedule(true);
    setError("");
    const result = await deleteGroupAction(groupId, tournamentId, {
      deleteSchedule: true,
    });
    if (result.success) {
      const deleted = groups.find((g) => g.id === groupId);
      setGroups((prev) =>
        prev
          .filter((g) => g.id !== groupId)
          .map((g) => ({ ...g, matchesCount: 0 }))
      );
      if (deleted) {
        setLeagues((prev) =>
          prev.map((l) =>
            (deleted.fplLeagueId && l.id === deleted.fplLeagueId) ||
            l.name.toLowerCase() === deleted.name.toLowerCase()
              ? { ...l, isAlreadyImported: false }
              : l
          )
        );
      }
      showToast(
        `Tournament schedule deleted and group "${groupName}" removed successfully.`
      );
      setScheduleDeleteModalGroup(null);
    } else {
      setError(result.error || "Failed to delete schedule and group");
    }
    setDeletingSchedule(false);
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

  const handleTeamCreated = (newGroup: Group) => {
    setGroups((prev) => [...prev, newGroup]);
    setExpandedMembers((prev) => ({ ...prev, [newGroup.id]: true }));
    showToast(`Team "${newGroup.name}" created successfully!`);
  };

  const handlePlayerSaved = (savedMember: GroupMember, targetGroupId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== targetGroupId) return g;
        const exists = g.members.some((m) => m.id === savedMember.id);
        const members = exists
          ? g.members.map((m) => (m.id === savedMember.id ? savedMember : m))
          : [...g.members, savedMember];
        return { ...g, members };
      })
    );
    showToast(`Player "${savedMember.fplName}" saved successfully.`);
  };

  const handleDeletePlayer = async () => {
    if (!playerToDelete) return;
    setDeletingPlayer(true);
    const { memberId, name, groupId } = playerToDelete;
    const res = await deleteGroupMemberAction(memberId, tournamentId);
    if (res.success) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? { ...g, members: g.members.filter((m) => m.id !== memberId) }
            : g
        )
      );
      showToast(`Player "${name}" removed.`);
      setPlayerToDelete(null);
    } else {
      setError(res.error || "Failed to delete player.");
    }
    setDeletingPlayer(false);
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

  const importingCount = useMemo(
    () => Object.keys(importingLeagueIds).length,
    [importingLeagueIds]
  );

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

      {/* FPL Deadline Alert Banner */}
      {isDeadlineActive && (
        <Alert className="animate-fpl-fade-in border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-purple-900/10 to-transparent text-[#37003C] shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-700 mt-0.5 shrink-0">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
            <div className="space-y-1 min-w-0">
              <AlertTitle className="font-extrabold text-sm sm:text-base text-[#37003C] flex items-center gap-2">
                <span>FPL Gameweek Deadline in Progress</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white">
                  Imports Paused
                </span>
              </AlertTitle>
              <AlertDescription className="text-xs sm:text-sm text-[#555555] leading-relaxed">
                {deadlineReason ||
                  "The official Fantasy Premier League API is updating for the Gameweek deadline. Importing new teams and syncing rosters are temporarily paused until the deadline window closes."}
              </AlertDescription>
            </div>
          </div>
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

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-center">
          <Button
            type="button"
            onClick={() => setShowAddManualModal(true)}
            variant="outline"
            className="h-10 px-3.5 text-xs sm:text-sm font-bold border-[#37003C]/30 text-[#37003C] hover:bg-[#37003C]/5 rounded-[8px] transition-all gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus className="h-4 w-4 text-[#37003C]" />
            <span>Add Manual Team</span>
          </Button>

          <Button
            onClick={handleToggleImport}
            variant="default"
            className="h-10 px-4 text-xs sm:text-sm font-bold bg-[#37003C] hover:bg-[#5A0A63] text-white rounded-[8px] transition-all gap-2 shadow-sm cursor-pointer"
          >
            {showImport ? (
              <>
                <X className="h-4 w-4" />
                <span>Close Import</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 text-[#00FF87]" />
                <span>Import from FPL League</span>
              </>
            )}
          </Button>
        </div>
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
                  {importingCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#37003C]/10 text-[#37003C] text-xs font-semibold animate-pulse">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>
                        Importing {importingCount} {importingCount === 1 ? "team" : "teams"}...
                      </span>
                    </span>
                  )}
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
                    const matchingGroup = groups.find(
                      (g) =>
                        g.fplLeagueId === league.id ||
                        (!g.fplLeagueId &&
                          g.name.toLowerCase() === league.name.toLowerCase())
                    );
                    const isImported =
                      Boolean(matchingGroup) || league.isAlreadyImported;
                    const isDeletingThisGroup =
                      deletingGroupId === matchingGroup?.id;

                    return (
                      <div
                        key={`${league.adminFplId || "admin"}_${league.id}`}
                        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 rounded-[12px] p-3.5 sm:p-4 border shadow-xs transition ${
                          isImported
                            ? "bg-[#37003C]/[0.02] border-[#37003C]/20 hover:border-[#37003C]/40"
                            : "bg-white border-[#E5E5E5] hover:border-[#37003C]/30"
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Logo selector thumbnail button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (isImported && matchingGroup) {
                                setActivePickerGroup(matchingGroup);
                              } else {
                                setActivePickerLeague(league);
                              }
                            }}
                            disabled={Boolean(importingLeagueIds[league.id])}
                            className="group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#E5E5E5] bg-[#F7F7F7] p-1 hover:border-[#37003C] hover:bg-[#37003C]/5 transition cursor-pointer disabled:opacity-60 shadow-2xs"
                            title={
                              isImported
                                ? "Click to change team crest"
                                : "Click to choose club crest"
                            }
                          >
                            {isImported && matchingGroup?.logo ? (
                              <img
                                src={matchingGroup.logo}
                                alt={matchingGroup.name}
                                className="h-9 w-9 object-contain"
                              />
                            ) : currentChosenLogo ? (
                              <img
                                src={currentChosenLogo}
                                alt={league.name}
                                className="h-9 w-9 object-contain"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#37003C] text-white font-extrabold text-xs">
                                {getMonogram(matchingGroup?.name || league.name)}
                              </div>
                            )}
                            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#37003C] text-[9px] font-bold text-white shadow-xs">
                              <Pencil className="h-2.5 w-2.5 text-[#00FF87]" />
                            </span>
                          </button>

                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold text-[#1F1F1F] text-sm sm:text-base leading-snug truncate">
                                {matchingGroup?.name || league.name}
                              </h4>
                              {isImported && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
                                  <Check className="h-2.5 w-2.5 text-emerald-600" />
                                  <span>Imported</span>
                                </span>
                              )}
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
                                onClick={() => {
                                  if (isImported && matchingGroup) {
                                    setActivePickerGroup(matchingGroup);
                                  } else {
                                    setActivePickerLeague(league);
                                  }
                                }}
                                disabled={Boolean(importingLeagueIds[league.id])}
                                className="text-[11px] font-semibold text-[#37003C] hover:underline cursor-pointer disabled:pointer-events-none"
                              >
                                {isImported
                                  ? "Change Crest"
                                  : currentChosenLogo
                                  ? "Change Crest"
                                  : "Choose Crest"}
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
                            onClick={() => {
                              if (isImported && matchingGroup) {
                                setActivePickerGroup(matchingGroup);
                              } else {
                                setActivePickerLeague(league);
                              }
                            }}
                            disabled={Boolean(importingLeagueIds[league.id])}
                            className="h-8 px-3 text-xs font-semibold border-[#E5E5E5] text-[#555555] hover:text-[#1F1F1F] gap-1.5 cursor-pointer"
                          >
                            <ImageIcon className="h-3.5 w-3.5 text-[#37003C]" />
                            <span>Crest</span>
                          </Button>

                          {isImported ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const target =
                                  matchingGroup ||
                                  groups.find(
                                    (g) =>
                                      g.fplLeagueId === league.id ||
                                      g.name.toLowerCase() ===
                                        league.name.toLowerCase()
                                  );
                                if (target) {
                                  if (
                                    target.matchesCount &&
                                    target.matchesCount > 0
                                  ) {
                                    setScheduleDeleteModalGroup({
                                      id: target.id,
                                      name: target.name,
                                      matchesCount: target.matchesCount,
                                    });
                                  } else {
                                    handleDelete(target.id);
                                  }
                                }
                              }}
                              disabled={isDeletingThisGroup || deletingGroup}
                              className="h-8 px-3.5 text-xs font-bold rounded-[8px] gap-1.5 border-[#E9007F]/40 text-[#E9007F] hover:bg-[#E9007F]/10 hover:border-[#E9007F] hover:text-[#d00072] shadow-2xs transition-colors cursor-pointer"
                              title={`Delete ${matchingGroup?.name || league.name} from tournament`}
                            >
                              {isDeletingThisGroup ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#E9007F]" />
                                  <span>Deleting...</span>
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-3.5 w-3.5 text-[#E9007F]" />
                                  <span>Delete Team</span>
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleImport(league.id, league.adminFplId)}
                              disabled={Boolean(importingLeagueIds[league.id]) || isDeadlineActive}
                              title={
                                isDeadlineActive
                                  ? "Cannot import teams during an active FPL Gameweek deadline"
                                  : undefined
                              }
                              className={`h-8 px-3.5 text-xs font-bold rounded-[8px] gap-1.5 shadow-2xs cursor-pointer ${
                                isDeadlineActive
                                  ? "bg-amber-600/70 cursor-not-allowed text-white"
                                  : "bg-[#37003C] hover:bg-[#5A0A63] text-white"
                              }`}
                            >
                              {importingLeagueIds[league.id] ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-current" />
                                  <span>Importing...</span>
                                </>
                              ) : isDeadlineActive ? (
                                <>
                                  <Clock className="h-3.5 w-3.5 text-amber-200" />
                                  <span>Deadline Lock</span>
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
                          <div className="flex items-center gap-2">
                            <h4 className="text-base sm:text-lg font-extrabold text-[#1F1F1F] tracking-tight truncate">
                              {group.name}
                            </h4>
                            {group.isManual && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#37003C]/10 text-[#37003C] border border-[#37003C]/20 shrink-0">
                                <Shield className="h-2.5 w-2.5 text-[#00FF87]" />
                                <span>Manual Team</span>
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-[#666666]">
                            <span className="font-bold text-[#1F1F1F]">
                              {activePlayers.length} Active {activePlayers.length === 1 ? "Player" : "Players"}
                            </span>
                            {group.fplLeagueId ? (
                              <>
                                <span className="text-[#CCCCCC]">·</span>
                                <span className="font-mono text-[#777777]">
                                  FPL League #{group.fplLeagueId}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-[#CCCCCC]">·</span>
                                <span className="font-semibold text-purple-700">
                                  Custom Scoring (Admin Inserted)
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
                          disabled={deletingGroupId === group.id}
                          onClick={() => {
                            if (group.matchesCount && group.matchesCount > 0) {
                              setScheduleDeleteModalGroup({
                                id: group.id,
                                name: group.name,
                                matchesCount: group.matchesCount,
                              });
                            } else {
                              handleDelete(group.id);
                            }
                          }}
                          className="h-8 px-2.5 text-xs font-semibold text-[#E9007F] hover:text-[#d00072] hover:bg-[#E9007F]/10 gap-1 cursor-pointer disabled:opacity-60"
                          title="Delete team"
                        >
                          {deletingGroupId === group.id ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>Deleting...</span>
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete</span>
                            </>
                          )}
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

                    <div className="flex items-center gap-2">
                      {group.isManual && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActivePlayerModalGroup(group);
                            setActivePlayerToEdit(null);
                          }}
                          className="h-7 px-2.5 text-xs font-semibold border-[#37003C]/30 text-[#37003C] hover:bg-[#37003C]/10 gap-1 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5 text-[#37003C]" />
                          <span>Add Player</span>
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleMembersExpand(group.id)}
                        className="h-7 px-2.5 text-xs font-semibold text-[#37003C] hover:bg-[#37003C]/10 gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? "Hide Members" : "View Members"}</span>
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Expandable Members Table */}
                  {isExpanded && (
                    <div className="p-0 animate-fpl-fade-in">
                      <div className="px-4 sm:px-5 py-2 bg-[#FFFBEB]/50 border-b border-[#FDE68A]/40 text-[11px] text-[#92400E] flex items-center justify-between gap-2">
                        <span>
                          {group.isManual
                            ? "Manual roster: player scores default to 0 and can be inserted by tournament administrators for each match."
                            : "Member lists are captured when the FPL league is imported. Tournament administrators are automatically excluded from team scoring."}
                        </span>
                      </div>

                      {group.members.length === 0 ? (
                        <div className="p-8 text-center bg-white space-y-2.5">
                          <p className="text-xs sm:text-sm text-[#777777] italic">
                            No players added to this roster yet.
                          </p>
                          {group.isManual && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActivePlayerModalGroup(group);
                                setActivePlayerToEdit(null);
                              }}
                              className="h-8 px-3 text-xs font-semibold text-[#37003C] border-[#37003C]/30 hover:bg-[#37003C]/5 gap-1.5 cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Add First Player</span>
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-b border-[#E5E5E5] bg-[#F7F7F7]/70 hover:bg-[#F7F7F7]">
                                <TableHead className="py-2.5 px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777]">Manager Name</TableHead>
                                <TableHead className="py-2.5 px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777]">Squad / Team</TableHead>
                                <TableHead className="py-2.5 px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777]">ID / Source</TableHead>
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
                                    {group.isManual || member.isManual || member.fplId <= 0 ? (
                                      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-purple-800 bg-purple-100/70 px-2 py-0.5 rounded-[4px] border border-purple-200">
                                        <span>Manual #{member.fplId < 0 ? Math.abs(member.fplId) : member.fplId}</span>
                                      </span>
                                    ) : (
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
                                    )}
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
                                    <div className="flex items-center justify-end gap-1">
                                      {group.isManual || member.isManual ? (
                                        <>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              setActivePlayerModalGroup(group);
                                              setActivePlayerToEdit(member);
                                            }}
                                            className="h-7 px-2 text-xs font-semibold text-[#555555] hover:text-[#37003C] hover:bg-[#37003C]/10 gap-1 cursor-pointer"
                                            title="Edit player"
                                          >
                                            <Pencil className="h-3 w-3" />
                                            <span>Edit</span>
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              setPlayerToDelete({
                                                memberId: member.id,
                                                name: member.fplName,
                                                groupId: group.id,
                                              });
                                            }}
                                            className="h-7 px-2 text-xs font-semibold text-[#E9007F] hover:bg-[#E9007F]/10 gap-1 cursor-pointer"
                                            title="Delete player"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                            <span>Delete</span>
                                          </Button>
                                        </>
                                      ) : (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setActiveSquadPlayer({ member, group })}
                                          className="h-7 px-2.5 text-xs font-semibold text-[#37003C] hover:bg-[#37003C]/10 gap-1 cursor-pointer"
                                          title={`View ${member.fplName}'s tactical pitch squad`}
                                        >
                                          <Eye className="h-3.5 w-3.5 text-[#37003C]" />
                                          <span>View Squad</span>
                                        </Button>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
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
              This will remove the imported tournament group and its roster snapshot.
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

      {/* Delete Schedule to Remove Group Confirmation Dialog */}
      <AlertDialog
        open={!!scheduleDeleteModalGroup}
        onOpenChange={(open) =>
          !open && !deletingSchedule && setScheduleDeleteModalGroup(null)
        }
      >
        <AlertDialogContent className="max-w-md sm:max-w-lg rounded-2xl border-[#E5E5E5] bg-white p-6 shadow-2xl animate-fpl-fade-in">
          <AlertDialogHeader className="space-y-3">
            <div className="flex items-center gap-3 text-[#E9007F]">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E9007F]/10 border border-[#E9007F]/20">
                <AlertTriangle className="h-6 w-6 text-[#E9007F]" />
              </div>
              <div>
                <AlertDialogTitle className="text-lg sm:text-xl font-black text-[#1F1F1F] tracking-tight">
                  Delete Schedule to Remove Group?
                </AlertDialogTitle>
                <p className="text-xs text-[#777777] font-medium">
                  Matches are currently scheduled for this team
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-2 text-left">
              <div className="flex items-start gap-2 text-amber-900 font-bold text-xs sm:text-sm">
                <Calendar className="h-4 w-4 shrink-0 mt-0.5 text-amber-700" />
                <span>
                  Group &ldquo;{scheduleDeleteModalGroup?.name}&rdquo; is scheduled in{" "}
                  <span className="font-extrabold underline decoration-amber-500">
                    {scheduleDeleteModalGroup?.matchesCount} fixture
                    {scheduleDeleteModalGroup?.matchesCount === 1 ? "" : "s"}
                  </span>
                </span>
              </div>
              <p className="text-xs text-amber-950/80 leading-relaxed pl-6">
                To delete this group, the tournament match schedule (all rounds, fixtures, and recorded scores) must be removed. You can regenerate fixtures afterwards.
              </p>
            </div>

            <AlertDialogDescription className="text-xs sm:text-sm text-[#555555] leading-relaxed text-left">
              Do you want to delete the tournament schedule and permanently remove <strong>{scheduleDeleteModalGroup?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-5 gap-2 sm:gap-3">
            <AlertDialogCancel
              disabled={deletingSchedule}
              onClick={() => setScheduleDeleteModalGroup(null)}
              className="border-[#E5E5E5] text-[#555555] hover:text-[#1F1F1F] text-xs sm:text-sm font-semibold h-10 px-4 cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (scheduleDeleteModalGroup) {
                  handleDeleteWithSchedule(
                    scheduleDeleteModalGroup.id,
                    scheduleDeleteModalGroup.name
                  );
                }
              }}
              disabled={deletingSchedule}
              className="bg-[#E9007F] hover:bg-[#d00072] text-white font-bold text-xs sm:text-sm h-10 px-4 gap-2 shadow-xs cursor-pointer"
            >
              {deletingSchedule ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Deleting Schedule &amp; Group...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Schedule &amp; Remove Group</span>
                </>
              )}
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

      {/* Add Manual Team Modal */}
      <AddManualTeamModal
        isOpen={showAddManualModal}
        onClose={() => setShowAddManualModal(false)}
        tournamentId={tournamentId}
        onTeamCreated={(group) => handleTeamCreated(group as unknown as Group)}
      />

      {/* Add/Edit Manual Player Modal */}
      {activePlayerModalGroup && (
        <ManualPlayerModal
          isOpen={true}
          onClose={() => {
            setActivePlayerModalGroup(null);
            setActivePlayerToEdit(null);
          }}
          tournamentId={tournamentId}
          groupId={activePlayerModalGroup.id}
          groupName={activePlayerModalGroup.name}
          playerToEdit={activePlayerToEdit}
          onPlayerSaved={(member) =>
            handlePlayerSaved(member as unknown as GroupMember, activePlayerModalGroup.id)
          }
        />
      )}

      {/* Delete Player Confirmation Dialog */}
      <AlertDialog
        open={!!playerToDelete}
        onOpenChange={(open) => !open && setPlayerToDelete(null)}
      >
        <AlertDialogContent className="max-w-md rounded-2xl border-[#E5E5E5] bg-white p-6 shadow-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-2.5 text-[#E9007F]">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E9007F]/10">
                <Trash2 className="h-5 w-5 text-[#E9007F]" />
              </div>
              <AlertDialogTitle className="text-lg font-bold text-[#1F1F1F]">
                Remove {playerToDelete?.name}?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs sm:text-sm text-[#777777] mt-2">
              Are you sure you want to remove this player from the team roster? Their match score records for this tournament will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel
              disabled={deletingPlayer}
              className="border-[#E5E5E5] text-[#555555] text-xs font-semibold"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeletePlayer();
              }}
              disabled={deletingPlayer}
              className="bg-[#E9007F] hover:bg-[#d00072] text-white font-bold text-xs gap-1.5"
            >
              {deletingPlayer ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              <span>{deletingPlayer ? "Removing..." : "Remove Player"}</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
