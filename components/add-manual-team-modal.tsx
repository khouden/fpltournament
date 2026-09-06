"use client";

import { useState } from "react";
import {
  Shield,
  Plus,
  Trash2,
  Image as ImageIcon,
  Loader2,
  Users,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { TeamLogoPicker } from "./team-logo-picker";
import { suggestLogoForTeamName } from "@/lib/team-logos";
import {
  createManualGroupAction,
  type GroupView,
} from "@/lib/group-actions";

export interface AddManualTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  onTeamCreated: (group: GroupView) => void;
}

interface InitialPlayer {
  id: string;
  name: string;
  teamName: string;
  isAdmin: boolean;
}

export function AddManualTeamModal({
  isOpen,
  onClose,
  tournamentId,
  onTeamCreated,
}: AddManualTeamModalProps) {
  const [name, setName] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [isLogoPickerOpen, setIsLogoPickerOpen] = useState(false);
  const [players, setPlayers] = useState<InitialPlayer[]>([
    { id: "1", name: "", teamName: "", isAdmin: false },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNameChange = (val: string) => {
    setName(val);
    if (!logo && val.trim().length >= 3) {
      const suggested = suggestLogoForTeamName(val.trim());
      if (suggested) {
        setLogo(suggested.path);
      }
    }
  };

  const handleAddPlayerRow = () => {
    setPlayers((prev) => [
      ...prev,
      {
        id: String(Date.now() + Math.random()),
        name: "",
        teamName: "",
        isAdmin: false,
      },
    ]);
  };

  const handleRemovePlayerRow = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const handlePlayerFieldChange = (
    id: string,
    field: keyof InitialPlayer,
    val: string | boolean
  ) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: val } : p))
    );
  };

  const handleReset = () => {
    setName("");
    setLogo(null);
    setPlayers([{ id: "1", name: "", teamName: "", isAdmin: false }]);
    setError("");
    setLoading(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError("Please enter a team name.");
      return;
    }

    // Filter out rows with empty names
    const validPlayers = players
      .map((p) => ({
        name: p.name.trim(),
        teamName: p.teamName.trim() || undefined,
        isAdmin: p.isAdmin,
      }))
      .filter((p) => p.name.length > 0);

    setLoading(true);
    setError("");

    try {
      const result = await createManualGroupAction({
        tournamentId,
        name: cleanName,
        logo,
        initialPlayers: validPlayers,
      });

      if (result.success && result.group) {
        onTeamCreated(result.group as unknown as GroupView);
        handleClose();
      } else {
        setError(result.error || "Failed to create manual team.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create team.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-[#E5E5E5] bg-white text-[#1F1F1F] shadow-2xl rounded-2xl">
          <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-[#E5E5E5] bg-gradient-to-r from-[#37003C]/5 via-[#37003C]/[0.02] to-transparent">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#37003C] text-white shadow-xs">
                <Shield className="h-5 w-5 text-[#00FF87]" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-black text-[#1F1F1F] tracking-tight">
                  Add Team Manually
                </DialogTitle>
                <DialogDescription className="text-xs text-[#666666] mt-0.5">
                  Create a custom team without FPL API integration. Manage custom rosters and enter scores each matchday.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {error && (
              <Alert variant="destructive" className="border-[#E9007F]/30 bg-[#E9007F]/10 text-[#E9007F]">
                <AlertTitle className="font-bold text-xs sm:text-sm">Error</AlertTitle>
                <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
              </Alert>
            )}

            {/* Team Identity Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 items-center">
                {/* Crest Preview / Picker Trigger */}
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsLogoPickerOpen(true)}
                    className="group relative flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-[#CCCCCC] hover:border-[#37003C] bg-[#F7F7F7] p-2 transition-all cursor-pointer shadow-xs"
                    title="Click to select or change team crest"
                  >
                    {logo ? (
                      <img
                        src={logo}
                        alt="Selected Crest"
                        className="h-16 w-16 object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-[#888888] group-hover:text-[#37003C] transition-colors">
                        <ImageIcon className="h-6 w-6 mb-1" />
                        <span className="text-[10px] font-bold">Add Logo</span>
                      </div>
                    )}
                  </button>
                  {logo && (
                    <button
                      type="button"
                      onClick={() => setLogo(null)}
                      className="text-[11px] font-semibold text-[#888888] hover:text-[#E9007F] transition-colors cursor-pointer"
                    >
                      Remove Logo
                    </button>
                  )}
                </div>

                {/* Team Name Input */}
                <div className="space-y-2">
                  <Label htmlFor="manualTeamName" className="text-xs font-bold text-[#1F1F1F]">
                    Team Name *
                  </Label>
                  <Input
                    id="manualTeamName"
                    type="text"
                    required
                    placeholder="e.g. Real Madrid, Legends FC, Phoenix XI"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="h-10 text-sm font-semibold border-[#E5E5E5] focus-visible:ring-[#37003C]"
                  />
                  <div className="flex items-center justify-between text-[11px] text-[#777777]">
                    <span>Enter any club or tournament team name.</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsLogoPickerOpen(true)}
                      className="h-6 px-2 text-[11px] font-semibold text-[#37003C] hover:bg-[#37003C]/10 gap-1 cursor-pointer"
                    >
                      <ImageIcon className="h-3 w-3" />
                      <span>Browse Authentic Crests</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Roster / Initial Players Section */}
            <div className="space-y-3 pt-2 border-t border-[#E5E5E5]">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#1F1F1F] flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-[#37003C]" />
                    <span>Initial Players (Optional)</span>
                  </h4>
                  <p className="text-[11px] text-[#666666]">
                    You can add players now or anytime later. Scores for these players will default to 0.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddPlayerRow}
                  className="h-8 px-2.5 text-xs font-semibold border-[#E5E5E5] text-[#37003C] hover:bg-[#37003C]/5 gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Player</span>
                </Button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {players.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-xl border border-[#EBEBEB] bg-[#FAFAFA] hover:bg-[#F5F5F5] transition-colors"
                  >
                    <div className="flex items-center gap-1.5 min-w-[28px] text-xs font-black text-[#888888]">
                      #{idx + 1}
                    </div>

                    <div className="flex-1">
                      <Input
                        type="text"
                        placeholder="Player / Manager name (e.g. John Doe)"
                        value={p.name}
                        onChange={(e) =>
                          handlePlayerFieldChange(p.id, "name", e.target.value)
                        }
                        className="h-8 text-xs bg-white border-[#E0E0E0]"
                      />
                    </div>

                    <div className="w-full sm:w-40">
                      <Input
                        type="text"
                        placeholder="Squad name (optional)"
                        value={p.teamName}
                        onChange={(e) =>
                          handlePlayerFieldChange(p.id, "teamName", e.target.value)
                        }
                        className="h-8 text-xs bg-white border-[#E0E0E0]"
                      />
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 px-1">
                      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-[#555555] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={p.isAdmin}
                          onChange={(e) =>
                            handlePlayerFieldChange(p.id, "isAdmin", e.target.checked)
                          }
                          className="h-3.5 w-3.5 rounded border-gray-300 text-[#37003C] focus:ring-[#37003C]"
                        />
                        <span title="Excluded from team score sum">Admin (Exclude)</span>
                      </label>

                      {players.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePlayerRow(p.id)}
                          className="p-1 rounded text-[#999999] hover:text-[#E9007F] hover:bg-[#E9007F]/10 transition cursor-pointer"
                          title="Remove row"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="p-0 pt-4 border-t border-[#E5E5E5] flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="h-9 px-4 text-xs font-semibold text-[#555555] border-[#E5E5E5] cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !name.trim()}
                className="h-9 px-4 text-xs font-bold bg-[#37003C] hover:bg-[#5A0A63] text-white rounded-[8px] gap-1.5 shadow-xs cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#00FF87]" />
                ) : (
                  <Check className="h-4 w-4 text-[#00FF87]" />
                )}
                <span>{loading ? "Creating..." : "Create Team"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <TeamLogoPicker
        isOpen={isLogoPickerOpen}
        onClose={() => setIsLogoPickerOpen(false)}
        onSelect={(path) => {
          setLogo(path);
          setIsLogoPickerOpen(false);
        }}
        currentLogo={logo}
        teamName={name}
        title="Select Team Crest"
      />
    </>
  );
}
