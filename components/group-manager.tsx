"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
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

export function GroupManager({
  tournamentId,
  initialGroups,
}: {
  tournamentId: string;
  initialGroups: Group[];
}) {
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [leagues, setLeagues] = useState<LeagueView[]>([]);
  const [tournamentAdmins, setTournamentAdmins] = useState<TournamentAdminView[]>([]);
  const [selectedAdminFilter, setSelectedAdminFilter] = useState<number | "ALL">("ALL");
  const [leagueSearchQuery, setLeagueSearchQuery] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [loadingLeagues, setLoadingLeagues] = useState(false);
  const [importing, setImporting] = useState<number | null>(null);

  // Rename / Edit state
  const [renamingGroup, setRenamingGroup] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameLogo, setRenameLogo] = useState<string | null>(null);

  // Delete confirmation
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

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
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const fetchLeagues = async () => {
    setLoadingLeagues(true);
    setError("");
    const result = await getAdminLeaguesForTournamentAction(tournamentId);
    if (result.success && result.leagues) {
      setLeagues(result.leagues);
      if (result.admins) {
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
      setError(result.error || "Failed to fetch leagues");
    }
    setLoadingLeagues(false);
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
      showToast("Team updated successfully");
    } else {
      setError(result.error || "Failed to update team");
    }
  };

  const handleDirectChangeLogo = async (groupId: string, logoPath: string | null) => {
    const result = await updateGroupLogoAction(groupId, tournamentId, logoPath);
    if (result.success && result.group) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId ? { ...g, logo: result.group!.logo } : g
        )
      );
      showToast("Team logo updated");
    } else {
      setError(result.error || "Failed to update logo");
    }
  };

  const handleDelete = async (groupId: string) => {
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
      showToast("Team deleted");
      setGroupToDelete(null);
    } else {
      setError(result.error || "Failed to delete team");
      setGroupToDelete(null);
    }
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
    showToast(`Auto-assigned logos to ${count} leagues based on names!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Tournament Teams ({groups.length})
          </h2>
          <p className="text-sm text-gray-500">
            Each team corresponds to an FPL Classic League. Admins are excluded from match scoring.
          </p>
        </div>

        <Button
          onClick={() => {
            setShowImport(!showImport);
            if (!showImport && leagues.length === 0) fetchLeagues();
          }}
        >
          {showImport ? (
            <>
              <X className="h-4 w-4 mr-1.5" />
              <span>Close</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1.5" />
              <span>Import Group</span>
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMsg && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{successMsg}</AlertDescription>
        </Alert>
      )}

      {/* Import Panel */}
      {showImport && (
        <Card className="border-2 border-indigo-200 bg-indigo-50/70 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" />
              <CardTitle className="text-base font-bold text-indigo-950">
                Import from FPL Classic Leagues
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-indigo-700">
              Select a Classic League and customize the team logo before importing.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {loadingLeagues ? (
              <div className="flex items-center gap-2 text-sm text-indigo-600 py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading leagues from FPL...</span>
              </div>
            ) : leagues.length === 0 ? (
              <p className="text-sm text-indigo-700 py-2">
                No leagues found. Please verify the Admin FPL accounts.
              </p>
            ) : (
              <div className="space-y-3">
                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400 pointer-events-none" />
                  <Input
                    type="text"
                    value={leagueSearchQuery}
                    onChange={(e) => setLeagueSearchQuery(e.target.value)}
                    placeholder="Search leagues by name, league ID, or admin..."
                    className="pl-9 pr-8 bg-white border-indigo-200"
                  />
                  {leagueSearchQuery && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setLeagueSearchQuery("")}
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {/* Admin Filter if tournament has multiple admins */}
                {tournamentAdmins.length > 1 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-b border-indigo-200/70 pb-3">
                    <span className="text-xs font-bold text-indigo-900 mr-1">
                      Filter by Admin:
                    </span>
                    <Button
                      type="button"
                      variant={selectedAdminFilter === "ALL" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedAdminFilter("ALL")}
                      className="h-7 text-xs"
                    >
                      All Admins ({leagues.length})
                    </Button>
                    {tournamentAdmins.map((admin) => {
                      const count = leagues.filter(
                        (l) => l.adminFplId === admin.fplId
                      ).length;
                      const isSelected = selectedAdminFilter === admin.fplId;
                      return (
                        <Button
                          key={admin.fplId}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedAdminFilter(admin.fplId)}
                          className="h-7 text-xs gap-1.5"
                        >
                          {admin.isPrimary ? (
                            <Crown className="h-3 w-3 text-amber-500" />
                          ) : (
                            <Shield className="h-3 w-3 text-indigo-500" />
                          )}
                          <span>{admin.name || `Admin #${admin.fplId}`}</span>
                          <Badge variant="secondary" className="px-1.5 py-0 text-[10px] ml-0.5">
                            {count}
                          </Badge>
                        </Button>
                      );
                    })}
                  </div>
                )}

                {/* Action to Auto-Suggest Logos */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-indigo-800">
                    {leagues.length} leagues discovered
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAutoSuggestAllLogos}
                    className="gap-1.5 text-xs bg-white"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Auto-Match Logos</span>
                  </Button>
                </div>

                {/* Leagues List */}
                {(() => {
                  const filtered = leagues.filter((league) => {
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
                      const matchAdmin = (league.adminName || "")
                        .toLowerCase()
                        .includes(q);
                      return matchName || matchId || matchAdmin;
                    }
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="rounded-xl border border-dashed border-indigo-200 bg-white p-6 text-center">
                        <Search className="h-7 w-7 text-indigo-300 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-gray-800">
                          No leagues found
                          {leagueSearchQuery.trim()
                            ? ` matching "${leagueSearchQuery}"`
                            : ""}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setLeagueSearchQuery("");
                            setSelectedAdminFilter("ALL");
                          }}
                          className="mt-3"
                        >
                          Reset search &amp; filters
                        </Button>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2.5">
                      {filtered.map((league) => {
                        const currentChosenLogo = importLogos[league.id];
                        return (
                          <div
                            key={`${league.adminFplId || "admin"}_${league.id}`}
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
                                  <p className="font-bold text-gray-900">
                                    {league.name}
                                  </p>
                                  {league.isPrivate && (
                                    <Badge variant="secondary" className="text-[10px]">
                                      Mini-League
                                    </Badge>
                                  )}
                                  {league.adminName && (
                                    <Badge variant="outline" className="text-[10px] gap-1">
                                      <Shield className="h-2.5 w-2.5 text-indigo-500" />
                                      <span>via {league.adminName}</span>
                                    </Badge>
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

                            <div>
                              {league.isAlreadyImported ? (
                                <Badge variant="success" className="gap-1 py-1 px-2.5">
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Imported</span>
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleImport(league.id, league.adminFplId)
                                  }
                                  disabled={importing === league.id}
                                >
                                  {importing === league.id && (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                  )}
                                  <span>
                                    {importing === league.id
                                      ? "Importing..."
                                      : "Import Team"}
                                  </span>
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Group List */}
      {groups.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300 p-8 text-center bg-white">
          <Shield className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-700 font-bold">No teams imported yet</p>
          <p className="text-xs text-gray-500 mt-1">
            Click &quot;Import Group&quot; above to import FPL Classic Leagues as tournament teams.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const isRenaming = renamingGroup === group.id;

            return (
              <Card
                key={group.id}
                className="overflow-hidden border-gray-200 bg-white shadow-xs"
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
                        <Input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="h-8 w-48 text-sm"
                          placeholder="Team name"
                          autoFocus
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setActivePickerGroup(group)}
                          className="gap-1 text-xs"
                        >
                          <ImageIcon className="h-3.5 w-3.5 text-indigo-600" />
                          <span>Change Logo</span>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateGroup(group.id)}
                          className="h-8 text-xs"
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setRenamingGroup(null);
                            setRenameValue("");
                            setRenameLogo(null);
                          }}
                          className="h-8 text-xs text-gray-500"
                        >
                          Cancel
                        </Button>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActivePickerGroup(group)}
                        className="gap-1 text-xs text-gray-700"
                        title="Change team logo"
                      >
                        <ImageIcon className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Logo</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRenamingGroup(group.id);
                          setRenameValue(group.name);
                          setRenameLogo(group.logo);
                        }}
                        className="gap-1 text-xs text-gray-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span>Rename</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setGroupToDelete(group.id)}
                        className="gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Members Table */}
                <div className="px-4 py-2">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-100 hover:bg-transparent">
                        <TableHead className="py-2 text-xs font-bold uppercase tracking-wider text-gray-400">Player</TableHead>
                        <TableHead className="py-2 text-xs font-bold uppercase tracking-wider text-gray-400">Team Name</TableHead>
                        <TableHead className="py-2 text-right text-xs font-bold uppercase tracking-wider text-gray-400">FPL ID</TableHead>
                        <TableHead className="py-2 text-right text-xs font-bold uppercase tracking-wider text-gray-400">Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-50">
                      {group.members.map((member) => (
                        <TableRow
                          key={member.id}
                          onClick={() => setActiveSquadPlayer({ member, group })}
                          className={`cursor-pointer transition ${
                            member.isAdmin
                              ? "text-gray-400 italic bg-amber-50/30 hover:bg-amber-50/60"
                              : "text-gray-700 hover:bg-indigo-50/60"
                          }`}
                          title={`Click to view ${member.fplName}'s fantasy squad`}
                        >
                          <TableCell className="py-2.5 font-medium">
                            <div className="flex items-center gap-1.5">
                              <span className="hover:text-indigo-600 transition hover:underline">
                                {member.fplName}
                              </span>
                              <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100 hidden sm:inline-flex items-center gap-0.5 opacity-80 hover:opacity-100">
                                <Eye className="h-2.5 w-2.5" /> Squad
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5 text-gray-500">
                            {member.fplTeamName || "—"}
                          </TableCell>
                          <TableCell className="py-2.5 text-right font-mono text-xs text-gray-600">
                            {member.fplId}
                          </TableCell>
                          <TableCell className="py-2.5 text-right">
                            {member.isAdmin ? (
                              <Badge variant="warning" className="text-xs">
                                Admin (Excluded)
                              </Badge>
                            ) : (
                              <span className="text-xs text-indigo-600 font-medium hover:underline">
                                View Squad
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Group Confirmation Dialog */}
      <AlertDialog
        open={!!groupToDelete}
        onOpenChange={(open) => !open && setGroupToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this team from the tournament? Any scheduled matches involving this team will also be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => groupToDelete && handleDelete(groupToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
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
          title={`Choose Logo for "${activePickerGroup.name}"`}
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
          gameweek={1}
        />
      )}
    </div>
  );
}
