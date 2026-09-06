"use client";

import { useState, useEffect } from "react";
import { User, Shield, Check, Loader2, UserPlus, Pencil } from "lucide-react";
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
import {
  addMemberToGroupAction,
  updateGroupMemberAction,
  type GroupMemberView,
} from "@/lib/group-actions";

export interface ManualPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  groupId: string;
  groupName: string;
  playerToEdit?: GroupMemberView | null;
  onPlayerSaved: (member: GroupMemberView) => void;
}

export function ManualPlayerModal({
  isOpen,
  onClose,
  tournamentId,
  groupId,
  groupName,
  playerToEdit,
  onPlayerSaved,
}: ManualPlayerModalProps) {
  const isEditing = !!playerToEdit;

  const [name, setName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [fplId, setFplId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (playerToEdit) {
        setName(playerToEdit.fplName);
        setTeamName(playerToEdit.fplTeamName || "");
        setIsAdmin(playerToEdit.isAdmin);
        setFplId(playerToEdit.fplId > 0 ? String(playerToEdit.fplId) : "");
      } else {
        setName("");
        setTeamName("");
        setIsAdmin(false);
        setFplId("");
      }
      setError("");
      setLoading(false);
    }
  }, [isOpen, playerToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError("Please enter a player name.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const parsedFplId = fplId.trim() ? parseInt(fplId.trim(), 10) : undefined;

      if (isEditing && playerToEdit) {
        const res = await updateGroupMemberAction({
          memberId: playerToEdit.id,
          tournamentId,
          name: cleanName,
          teamName: teamName.trim() || null,
          isAdmin,
        });

        if (res.success && res.member) {
          onPlayerSaved(res.member as unknown as GroupMemberView);
          onClose();
        } else {
          setError(res.error || "Failed to update player.");
        }
      } else {
        const res = await addMemberToGroupAction({
          groupId,
          tournamentId,
          name: cleanName,
          teamName: teamName.trim() || undefined,
          isAdmin,
          fplId: parsedFplId && !isNaN(parsedFplId) ? parsedFplId : undefined,
        });

        if (res.success && res.member) {
          onPlayerSaved(res.member as unknown as GroupMemberView);
          onClose();
        } else {
          setError(res.error || "Failed to add player.");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save player.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-[#E5E5E5] bg-white text-[#1F1F1F] shadow-2xl rounded-2xl">
        <DialogHeader className="p-5 pb-4 border-b border-[#E5E5E5] bg-gradient-to-r from-[#37003C]/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#37003C] text-white shadow-xs">
              {isEditing ? (
                <Pencil className="h-4 w-4 text-[#00FF87]" />
              ) : (
                <UserPlus className="h-4 w-4 text-[#00FF87]" />
              )}
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black text-[#1F1F1F] tracking-tight">
                {isEditing ? "Edit Player" : "Add Player to Roster"}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#666666] mt-0.5">
                {groupName} · Custom scoring player
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <Alert variant="destructive" className="border-[#E9007F]/30 bg-[#E9007F]/10 text-[#E9007F]">
              <AlertTitle className="font-bold text-xs sm:text-sm">Error</AlertTitle>
              <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="playerNameInput" className="text-xs font-bold text-[#1F1F1F]">
              Player / Manager Name *
            </Label>
            <Input
              id="playerNameInput"
              type="text"
              required
              autoFocus
              placeholder="e.g. John Doe, Karim Benzema"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 text-xs sm:text-sm bg-white border-[#E5E5E5] focus-visible:ring-[#37003C]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="playerTeamInput" className="text-xs font-bold text-[#1F1F1F]">
              Squad / FPL Team Name (Optional)
            </Label>
            <Input
              id="playerTeamInput"
              type="text"
              placeholder="e.g. Johnny's XI, Phoenix FC"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="h-9 text-xs sm:text-sm bg-white border-[#E5E5E5] focus-visible:ring-[#37003C]"
            />
          </div>

          {!isEditing && (
            <div className="space-y-1.5">
              <Label htmlFor="playerFplIdInput" className="text-xs font-semibold text-[#555555]">
                FPL Entry ID (Optional)
              </Label>
              <Input
                id="playerFplIdInput"
                type="number"
                placeholder="Leave blank to auto-assign a custom ID"
                value={fplId}
                onChange={(e) => setFplId(e.target.value)}
                className="h-9 text-xs bg-white border-[#E5E5E5] focus-visible:ring-[#37003C]"
              />
              <p className="text-[10px] text-[#777777]">
                If not specified, a unique negative ID will be generated automatically.
              </p>
            </div>
          )}

          <div className="pt-2 border-t border-[#E5E5E5]">
            <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-[#EEEEEE] bg-[#FBFBFB] hover:bg-[#F5F5F5] transition cursor-pointer">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="h-4 w-4 mt-0.5 rounded border-gray-300 text-[#37003C] focus:ring-[#37003C]"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-[#1F1F1F] flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-amber-600" />
                  <span>Admin Member (Excluded from scoring)</span>
                </span>
                <p className="text-[11px] text-[#666666]">
                  Tournament administrators do not contribute points to the team total score.
                </p>
              </div>
            </label>
          </div>

          <DialogFooter className="p-0 pt-3 border-t border-[#E5E5E5] flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
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
              <span>{loading ? "Saving..." : isEditing ? "Save Changes" : "Add Player"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
