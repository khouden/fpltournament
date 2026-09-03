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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

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
      setAdminError("This manager is already an administrator of the tournament.");
      return;
    }
    setAdmins((prev) => [
      ...prev,
      {
        fplId: manager.id,
        name: `${manager.player_first_name} ${manager.player_last_name}`,
        teamName: manager.name,
        isPrimary: false,
      },
    ]);
    setShowAddCoAdmin(false);
  };

  const handleRemoveAdmin = (fplId: number) => {
    if (admins.length <= 1) {
      setAdminError("A tournament must have at least one administrator.");
      return;
    }
    const target = admins.find((a) => a.fplId === fplId);
    const updated = admins.filter((a) => a.fplId !== fplId);
    if (target?.isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    setAdmins(updated);
  };

  const handleSetPrimary = (fplId: number) => {
    setAdmins((prev) =>
      prev.map((a) => ({
        ...a,
        isPrimary: a.fplId === fplId,
      }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

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
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Tournament Name *</Label>
        <Input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          placeholder="e.g., Premier League Fantasy Cup 2024"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="season">Season *</Label>
        <Input
          type="number"
          id="season"
          value={season}
          onChange={(e) => setSeason(parseInt(e.target.value))}
          disabled={loading}
          min={2020}
          max={2100}
          required
        />
      </div>

      {/* Chip Rules Section with Two Distinct Settings */}
      <Card className="bg-gray-50/70 border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-indigo-600" />
            <CardTitle className="text-sm font-bold uppercase tracking-wide">
              FPL Chips Configuration
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Control which FPL chip bonuses count towards match scores. Free Hit &amp; Wildcard are always allowed.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* 1. Bench Boost Setting */}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3.5 shadow-xs">
            <div className="pr-4 space-y-1">
              <div className="flex items-center gap-2">
                <Armchair className="h-4 w-4 text-indigo-600" />
                <Label htmlFor="allowBenchBoost" className="cursor-pointer font-semibold">
                  Bench Boost
                </Label>
                <Badge variant={allowBenchBoost ? "success" : "destructive"}>
                  {allowBenchBoost ? "ENABLED" : "DISABLED"}
                </Badge>
              </div>
              <p className="text-xs text-gray-600">
                {allowBenchBoost
                  ? "Bench points count fully towards match score when a manager plays Bench Boost."
                  : "Bench points are excluded from the score (only starting 11 players count)."}
              </p>
            </div>
            <Switch
              id="allowBenchBoost"
              checked={allowBenchBoost}
              onCheckedChange={setAllowBenchBoost}
              disabled={loading}
            />
          </div>

          {/* 2. Triple Captain Setting */}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3.5 shadow-xs">
            <div className="pr-4 space-y-1">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                <Label htmlFor="allowTripleCaptain" className="cursor-pointer font-semibold">
                  Triple Captain
                </Label>
                <Badge variant={allowTripleCaptain ? "success" : "destructive"}>
                  {allowTripleCaptain ? "ENABLED" : "DISABLED"}
                </Badge>
              </div>
              <p className="text-xs text-gray-600">
                {allowTripleCaptain
                  ? "Triple Captain multiplier (3x) counts fully towards match score."
                  : "Triple Captain is reduced to 2x (captain points are doubled instead of tripled)."}
              </p>
            </div>
            <Switch
              id="allowTripleCaptain"
              checked={allowTripleCaptain}
              onCheckedChange={setAllowTripleCaptain}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tournament Admins Section (Multi-Admin Support) */}
      <Card className="border-2 border-indigo-200 bg-indigo-50/60 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              <CardTitle className="font-bold text-indigo-950">
                Tournament Admins ({admins.length})
              </CardTitle>
            </div>
            {admins.length > 0 && !showAddCoAdmin && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setShowAddCoAdmin(true);
                  setAdminError("");
                }}
              >
                <UserPlus className="h-3.5 w-3.5 mr-1" />
                <span>Add Co-Admin</span>
              </Button>
            )}
          </div>
          <Alert className="mt-2 bg-indigo-100/70 border-indigo-200 text-indigo-900">
            <Info className="h-4 w-4 text-indigo-600" />
            <AlertDescription className="text-xs">
              <strong>Why add multiple admins?</strong> In Fantasy Premier League, an account can only join a limited number of private leagues. Adding co-admins allows your tournament to import teams from leagues joined by multiple organizers. <em>All tournament admins are automatically excluded from match scoring.</em>
            </AlertDescription>
          </Alert>
        </CardHeader>

        <CardContent className="space-y-3">
          {adminError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{adminError}</AlertDescription>
            </Alert>
          )}

          {/* When no admins are added yet */}
          {admins.length === 0 ? (
            <FPLVerifier
              onVerified={handlePrimaryVerified}
              title="Step 1: Verify Primary FPL Admin"
              description="Verify your primary FPL account to create this tournament. You will be able to add co-admins right after."
              buttonText="Verify Primary Admin"
            />
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
                        <Badge
                          variant={admin.isPrimary ? "warning" : "secondary"}
                          className="text-[10px]"
                        >
                          {admin.isPrimary ? "PRIMARY ADMIN" : "CO-ADMIN"}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        Team: <span className="font-semibold text-gray-700">{admin.teamName}</span> • FPL ID: <span className="font-mono text-gray-700">#{admin.fplId}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!admin.isPrimary && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetPrimary(admin.fplId)}
                        title="Set as the primary tournament administrator"
                      >
                        <Crown className="h-3.5 w-3.5 text-amber-500 mr-1" />
                        <span>Make Primary</span>
                      </Button>
                    )}
                    {admins.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRemoveAdmin(admin.fplId)}
                        title="Remove this admin"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {/* Inline Add Co-Admin Form */}
              {showAddCoAdmin && (
                <Card className="border-indigo-300 bg-white shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-indigo-600" />
                        <CardTitle className="text-sm font-bold">
                          Add Co-Admin Account
                        </CardTitle>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-400 hover:text-gray-600"
                        onClick={() => {
                          setShowAddCoAdmin(false);
                          setAdminError("");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardDescription className="text-xs">
                      Enter another organizer&apos;s FPL entry ID. This enables importing leagues that this co-admin has joined.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FPLVerifier
                      onVerified={handleCoAdminVerified}
                      title="Verify Co-Admin"
                      description="Enter FPL Manager ID"
                      buttonText="Verify & Add Co-Admin"
                      autoClearOnVerify={true}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {admins.length > 0 && primaryAdmin && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Ready to Save</AlertTitle>
          <AlertDescription className="text-xs">
            Tournament has <strong>{admins.length}</strong> configured admin{admins.length > 1 ? "s" : ""}. Primary Admin: <strong>{primaryAdmin.name}</strong> (#{primaryAdmin.fplId}).
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={loading || admins.length === 0}
          className="flex-1"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          <span>
            {loading
              ? "Saving..."
              : initialData
                ? "Update Tournament"
                : "Create Tournament"}
          </span>
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
