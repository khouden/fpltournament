"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FPLVerifier } from "./fpl-verifier";
import type { FPLManager } from "@/lib/fpl";
import { TOURNAMENT_BANNERS } from "@/lib/tournament-banners";
import {
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
  Check,
  ChevronRight,
  TriangleAlert,
  ImageIcon,
  Upload,
  Link as LinkIcon,
  Sparkles,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface AdminItem {
  fplId: number;
  name: string;
  teamName: string;
  isPrimary: boolean;
}

interface TournamentFormProps {
  initialData?: {
    id?: string;
    name?: string;
    season?: number;
    banner?: string | null;
    adminFplId?: number | string;
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
  const isEdit = !!initialData?.id;

  const [name, setName] = useState(initialData?.name || "");
  const [season, setSeason] = useState(
    initialData?.season || new Date().getFullYear()
  );
  const [banner, setBanner] = useState(initialData?.banner || "");
  const [bannerTab, setBannerTab] = useState<"preset" | "upload" | "url">("preset");
  const [customUrlInput, setCustomUrlInput] = useState(initialData?.banner || "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [adminToRemove, setAdminToRemove] = useState<AdminItem | null>(null);
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
    setAdminError("");
    const target = admins.find((a) => a.fplId === fplId);
    const updated = admins.filter((a) => a.fplId !== fplId);
    if (target?.isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    setAdmins(updated);
  };

  const handleSetPrimary = (fplId: number) => {
    setAdminError("");
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
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: initialData?.id,
          name,
          season,
          banner: banner.trim() ? banner.trim() : null,
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
  const coAdmins = admins.filter((a) => a.fplId !== primaryAdmin?.fplId);

  // Step state derivation
  const step1Complete = name.trim().length > 0 && season >= 2020 && season <= 2100;
  const step2Complete = true; // Always configured
  const step3Complete = admins.length > 0;

  // Track modified chip rules in edit mode
  const benchBoostChanged =
    isEdit &&
    initialData?.allowBenchBoost !== undefined &&
    allowBenchBoost !== initialData.allowBenchBoost;
  const tripleCaptainChanged =
    isEdit &&
    initialData?.allowTripleCaptain !== undefined &&
    allowTripleCaptain !== initialData.allowTripleCaptain;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Visual Step Indicator */}
      <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide text-sm font-medium">
        <div className="flex items-center gap-2 shrink-0 text-[#37003C]">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              step1Complete
                ? "bg-[#00FF87] text-[#37003C]"
                : "bg-[#37003C] text-white"
            }`}
          >
            {step1Complete ? <Check className="h-3.5 w-3.5" /> : "1"}
          </div>
          <span className="font-semibold">01 Basic Info</span>
        </div>
        <ChevronRight className="h-4 w-4 text-[#BDBDBD] shrink-0" />
        <div className="flex items-center gap-2 shrink-0 text-[#37003C]">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              step2Complete
                ? "bg-[#00FF87] text-[#37003C]"
                : "bg-[#E5E5E5] text-[#777777]"
            }`}
          >
            {step2Complete ? <Check className="h-3.5 w-3.5" /> : "2"}
          </div>
          <span className="font-semibold">02 Chip Rules</span>
        </div>
        <ChevronRight className="h-4 w-4 text-[#BDBDBD] shrink-0" />
        <div
          className={`flex items-center gap-2 shrink-0 ${
            step3Complete ? "text-[#37003C]" : "text-[#777777]"
          }`}
        >
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              step3Complete
                ? "bg-[#00FF87] text-[#37003C]"
                : step1Complete && step2Complete
                ? "bg-[#37003C] text-white"
                : "bg-[#E5E5E5] text-[#777777]"
            }`}
          >
            {step3Complete ? <Check className="h-3.5 w-3.5" /> : "3"}
          </div>
          <span className="font-semibold">03 Administrators</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {error && (
          <Alert
            variant="destructive"
            className="bg-[#E9007F]/10 border-[#E9007F]/30 text-[#E9007F] [&>svg]:text-[#E9007F]"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 01 Basic Information */}
        <Card className="bg-white rounded-[14px] sm:rounded-[16px] border-[#E5E5E5] shadow-xs overflow-hidden">
          <CardHeader className="bg-[#FAFAFA] border-b border-[#E5E5E5] px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#37003C] text-white font-bold text-sm shadow-xs">
                1
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-[#1F1F1F]">
                  01 Basic Information
                </CardTitle>
                <CardDescription className="text-sm text-[#666666]">
                  {isEdit
                    ? "Update the tournament identity and season."
                    : "Define the tournament identity and season."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="space-y-2 sm:col-span-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-semibold text-[#1F1F1F]"
                >
                  Tournament Name *
                </Label>
                <Input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  placeholder="e.g., Champions Fantasy Cup 2024"
                  required
                  className="h-11 focus-visible:ring-[#37003C] border-[#E5E5E5]"
                />
              </div>

              <div className="space-y-2 sm:col-span-1">
                <Label
                  htmlFor="season"
                  className="text-sm font-semibold text-[#1F1F1F]"
                >
                  Season *
                </Label>
                <Input
                  type="number"
                  id="season"
                  value={season}
                  onChange={(e) => setSeason(parseInt(e.target.value))}
                  disabled={loading}
                  min={2020}
                  max={2100}
                  required
                  className="h-11 focus-visible:ring-[#37003C] border-[#E5E5E5]"
                />
              </div>
            </div>

            {/* Tournament Banner Selector Section */}
            <div className="mt-6 pt-6 border-t border-[#F0F0F0] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <Label className="text-sm font-semibold text-[#1F1F1F] flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-[#37003C]" />
                    <span>Tournament Banner</span>
                    <span className="text-xs font-normal text-[#888888]">
                      (Optional — displayed on tournament cards & headers)
                    </span>
                  </Label>
                  <p className="text-xs text-[#777777] mt-0.5">
                    Select a curated stadium theme, upload a custom banner, or enter an image URL.
                  </p>
                </div>

                {banner && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setBanner("");
                      setCustomUrlInput("");
                      setUploadError("");
                    }}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 self-start sm:self-auto gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove Banner</span>
                  </Button>
                )}
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-[#F5F5F5] rounded-[10px] w-fit border border-[#E5E5E5]">
                <button
                  type="button"
                  onClick={() => setBannerTab("preset")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-bold transition-colors ${
                    bannerTab === "preset"
                      ? "bg-white text-[#37003C] shadow-xs"
                      : "text-[#666666] hover:text-[#1F1F1F]"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#00FF87]" />
                  <span>Preset Gallery</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBannerTab("upload")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-bold transition-colors ${
                    bannerTab === "upload"
                      ? "bg-white text-[#37003C] shadow-xs"
                      : "text-[#666666] hover:text-[#1F1F1F]"
                  }`}
                >
                  <Upload className="h-3.5 w-3.5 text-[#00D9FF]" />
                  <span>Upload Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBannerTab("url")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-bold transition-colors ${
                    bannerTab === "url"
                      ? "bg-white text-[#37003C] shadow-xs"
                      : "text-[#666666] hover:text-[#1F1F1F]"
                  }`}
                >
                  <LinkIcon className="h-3.5 w-3.5 text-[#E9007F]" />
                  <span>Custom URL</span>
                </button>
              </div>

              {/* 1. Preset Gallery Grid */}
              {bannerTab === "preset" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  {TOURNAMENT_BANNERS.map((item) => {
                    const isSelected = banner === item.path;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setBanner(item.path)}
                        className={`group relative overflow-hidden rounded-[12px] border text-left transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "border-[#37003C] ring-2 ring-[#37003C] shadow-sm scale-[1.02]"
                            : "border-[#E5E5E5] bg-white hover:border-[#37003C]/40 hover:shadow-xs"
                        }`}
                      >
                        <div className="relative h-20 sm:h-24 w-full bg-[#1F0022] overflow-hidden">
                          <Image
                            src={item.path}
                            alt={item.name}
                            fill
                            className="object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                          {isSelected && (
                            <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-[#00FF87] text-[#37003C] flex items-center justify-center shadow-xs">
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </div>
                          )}
                          <div className="absolute bottom-2 left-2 right-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#00FF87]">
                              {item.category}
                            </span>
                            <p className="text-xs font-black text-white truncate drop-shadow-sm">
                              {item.name}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 2. File Upload Box */}
              {bannerTab === "upload" && (
                <div className="space-y-3 pt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      setUploadError("");
                      setUploading(true);

                      try {
                        const formData = new FormData();
                        formData.append("file", file);

                        const res = await fetch("/api/admin/upload", {
                          method: "POST",
                          body: formData,
                        });

                        const data = await res.json();
                        if (!res.ok) {
                          throw new Error(data.error || "Failed to upload banner image");
                        }

                        setBanner(data.url);
                      } catch (err) {
                        setUploadError(
                          err instanceof Error ? err.message : "Failed to upload file"
                        );
                      } finally {
                        setUploading(false);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }
                    }}
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#D0D0D0] hover:border-[#37003C] bg-[#FAFAFA] hover:bg-white rounded-[14px] p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-8 w-8 text-[#37003C] animate-spin" />
                        <p className="text-sm font-semibold text-[#1F1F1F]">
                          Uploading banner image...
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="h-10 w-10 rounded-full bg-[#37003C]/10 text-[#37003C] flex items-center justify-center">
                          <Upload className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1F1F1F]">
                            Click to browse or drop an image file
                          </p>
                          <p className="text-xs text-[#777777] mt-0.5">
                            Supports JPG, PNG, WEBP, or SVG up to 5MB (1200×400 recommended)
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {uploadError && (
                    <p className="text-xs font-semibold text-rose-600 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>{uploadError}</span>
                    </p>
                  )}
                </div>
              )}

              {/* 3. Custom URL Input */}
              {bannerTab === "url" && (
                <div className="space-y-3 pt-1">
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      placeholder="https://example.com/stadium-banner.jpg"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      className="h-11 border-[#E5E5E5] focus-visible:ring-[#37003C]"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (customUrlInput.trim()) {
                          setBanner(customUrlInput.trim());
                        }
                      }}
                      className="h-11 bg-[#37003C] hover:bg-[#5A0A63] text-white px-5 font-semibold shrink-0"
                    >
                      Apply
                    </Button>
                  </div>
                  <p className="text-xs text-[#777777]">
                    Paste any public image URL. Ensure the image is hosted with CORS or HTTPS access.
                  </p>
                </div>
              )}

              {/* Live Preview Card */}
              {banner && (
                <div className="mt-4 rounded-[14px] border border-[#E0E0E0] overflow-hidden bg-white shadow-2xs">
                  <div className="px-4 py-2.5 bg-[#F9F9F9] border-b border-[#EAEAEA] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#555555] uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Banner Preview</span>
                    </span>
                    <span className="text-[11px] text-[#777777] truncate max-w-[250px]">
                      {banner}
                    </span>
                  </div>
                  <div className="relative h-28 sm:h-36 w-full bg-[#1F0022] overflow-hidden">
                    <Image
                      src={banner}
                      alt="Selected banner preview"
                      fill
                      unoptimized={banner.startsWith("http")}
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                      <div>
                        <Badge className="bg-[#00FF87] text-[#37003C] font-black text-[10px] uppercase tracking-wider border-0 mb-1">
                          Preview
                        </Badge>
                        <h4 className="text-base sm:text-lg font-black text-white drop-shadow-md truncate max-w-sm sm:max-w-md">
                          {name || "Tournament Title"}
                        </h4>
                      </div>
                      <span className="text-xs font-bold text-white/90 bg-black/40 px-2.5 py-1 rounded-md backdrop-blur-xs border border-white/20">
                        {season ? `Season ${season}` : "Season"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 02 FPL Chip Rules */}
        <Card className="bg-white rounded-[14px] sm:rounded-[16px] border-[#E5E5E5] shadow-xs overflow-hidden">
          <CardHeader className="bg-[#FAFAFA] border-b border-[#E5E5E5] px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#37003C] text-white font-bold text-sm shadow-xs">
                2
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-[#1F1F1F]">
                  02 FPL Chip Rules
                </CardTitle>
                <CardDescription className="text-sm text-[#666666]">
                  Configure how FPL chips affect tournament scoring.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[#E5E5E5]">
              {/* Bench Boost Setting */}
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-[#FAFAFA]">
                <div className="space-y-1.5 flex-1 pr-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#00FF87]/20 text-[#008f4c]">
                      <Armchair className="h-4 w-4" />
                    </div>
                    <Label
                      htmlFor="allowBenchBoost"
                      className="text-base font-bold text-[#1F1F1F] cursor-pointer"
                    >
                      Bench Boost
                    </Label>
                    <Badge
                      variant={allowBenchBoost ? "success" : "secondary"}
                      className="text-[10px] font-bold"
                    >
                      {allowBenchBoost ? "ENABLED" : "DISABLED"}
                    </Badge>
                    {benchBoostChanged && (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-amber-700 border-amber-300 bg-amber-50"
                      >
                        Modified (Previously: {initialData?.allowBenchBoost ? "Enabled" : "Disabled"})
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-[#666666]">
                    {allowBenchBoost
                      ? "Bench points count fully towards match score when a manager plays Bench Boost."
                      : "Bench points are excluded from the score (only starting 11 players count)."}
                  </p>
                </div>
                <div className="shrink-0 flex items-center justify-between sm:justify-end">
                  <Switch
                    id="allowBenchBoost"
                    checked={allowBenchBoost}
                    onCheckedChange={setAllowBenchBoost}
                    disabled={loading}
                    variant="fantasy"
                  />
                </div>
              </div>

              {/* Triple Captain Setting */}
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-[#FAFAFA]">
                <div className="space-y-1.5 flex-1 pr-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 text-amber-600">
                      <Crown className="h-4 w-4" />
                    </div>
                    <Label
                      htmlFor="allowTripleCaptain"
                      className="text-base font-bold text-[#1F1F1F] cursor-pointer"
                    >
                      Triple Captain
                    </Label>
                    <Badge
                      variant={allowTripleCaptain ? "success" : "secondary"}
                      className="text-[10px] font-bold"
                    >
                      {allowTripleCaptain ? "ENABLED" : "DISABLED"}
                    </Badge>
                    {tripleCaptainChanged && (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-amber-700 border-amber-300 bg-amber-50"
                      >
                        Modified (Previously: {initialData?.allowTripleCaptain ? "Enabled" : "Disabled"})
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-[#666666]">
                    {allowTripleCaptain
                      ? "Triple Captain multiplier (3x) counts fully towards match score."
                      : "Triple Captain is reduced to 2x (captain points are doubled instead of tripled)."}
                  </p>
                </div>
                <div className="shrink-0 flex items-center justify-between sm:justify-end">
                  <Switch
                    id="allowTripleCaptain"
                    checked={allowTripleCaptain}
                    onCheckedChange={setAllowTripleCaptain}
                    disabled={loading}
                    variant="fantasy"
                  />
                </div>
              </div>
            </div>

            {/* Retroactive Scoring Warning Block */}
            <div className="p-6 pt-0">
              <Alert className="bg-amber-50/80 border-amber-200 text-amber-900 shadow-2xs">
                <TriangleAlert className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <AlertTitle className="text-sm font-bold text-amber-900">
                    Scoring Rule Changes
                  </AlertTitle>
                  <AlertDescription className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                    Changing Bench Boost or Triple Captain rules can affect how existing match scores are calculated. After saving your changes, use <strong>Recalculate All Scores</strong> in the Schedule Builder if you need to apply the updated rules to existing matches.
                  </AlertDescription>
                </div>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* 03 Tournament Administrators */}
        <Card className="bg-white rounded-[14px] sm:rounded-[16px] border-[#E5E5E5] shadow-xs overflow-hidden">
          <CardHeader className="bg-[#FAFAFA] border-b border-[#E5E5E5] px-6 py-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#37003C] text-white font-bold text-sm shadow-xs">
                  3
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-[#1F1F1F] flex items-center gap-2">
                    <span>03 Tournament Administrators</span>
                    {admins.length > 0 && (
                      <Badge
                        variant="outline"
                        className="bg-white text-[#555555] font-semibold border-[#E5E5E5] text-xs"
                      >
                        <Users className="h-3.5 w-3.5 mr-1 text-[#777777]" />
                        {admins.length} {admins.length === 1 ? "admin" : "admins"}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-sm text-[#666666]">
                    Manage the FPL accounts responsible for this tournament.
                  </CardDescription>
                </div>
              </div>
              {admins.length > 0 && !showAddCoAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddCoAdmin(true);
                    setAdminError("");
                  }}
                  className="shrink-0 shadow-2xs border-[#E5E5E5] hover:bg-[#FAFAFA] hover:text-[#37003C]"
                >
                  <UserPlus className="h-4 w-4 mr-1.5" />
                  <span>Add Co-Admin</span>
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <Alert className="bg-[#FAFAFA] border-[#E5E5E5] text-[#555555] shadow-2xs">
              <Info className="h-4 w-4 text-[#37003C] mt-0.5 shrink-0" />
              <AlertDescription className="text-xs sm:text-sm leading-relaxed">
                In Fantasy Premier League, multiple organizers may be required to work around private league membership limits. All tournament administrators are automatically excluded from match scoring.
              </AlertDescription>
            </Alert>

            {adminError && (
              <Alert
                variant="destructive"
                className="bg-[#E9007F]/10 border-[#E9007F]/30 text-[#E9007F] [&>svg]:text-[#E9007F]"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{adminError}</AlertDescription>
              </Alert>
            )}

            {admins.length === 0 ? (
              <div className="max-w-xl mx-auto py-2">
                <FPLVerifier
                  onVerified={handlePrimaryVerified}
                  title="Primary Administrator"
                  description="Verify the FPL account that will own this tournament."
                  buttonText="Verify Primary Admin"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {/* Primary Admin Card */}
                  {primaryAdmin && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[12px] p-4.5 bg-[#37003C]/[0.02] border border-[#37003C]/20 shadow-xs ring-1 ring-[#37003C]/10">
                      <div className="flex items-start sm:items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#37003C] to-[#5A0A63] text-[#E7FF00] shadow-xs">
                          <Crown className="h-6 w-6" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-bold text-[#1F1F1F]">
                              {primaryAdmin.name}
                            </span>
                            <Badge
                              variant="fantasy"
                              className="text-[10px] font-extrabold uppercase tracking-wider bg-[#37003C] text-[#00FF87] border-0"
                            >
                              PRIMARY ADMIN
                            </Badge>
                          </div>
                          <p className="text-sm text-[#555555]">
                            <span className="font-semibold text-[#1F1F1F]">
                              {primaryAdmin.teamName}
                            </span>{" "}
                            <span className="text-[#BDBDBD]">·</span> FPL ID{" "}
                            <span className="font-mono font-medium text-[#1F1F1F]">
                              #{primaryAdmin.fplId}
                            </span>
                          </p>
                        </div>
                      </div>

                      {admins.length > 1 && (
                        <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-[#E5E5E5] sm:border-t-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setAdminToRemove(primaryAdmin)}
                            title="Remove this administrator"
                            className="text-[#E9007F] hover:text-[#d00072] hover:bg-[#E9007F]/10 border-[#E5E5E5] px-3"
                          >
                            <Trash2 className="h-4 w-4 mr-1.5 sm:mr-0" />
                            <span className="sm:hidden">Remove</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Co-Admins Cards */}
                  {coAdmins.map((admin) => (
                    <div
                      key={admin.fplId}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[12px] p-4.5 bg-white border border-[#E5E5E5] shadow-xs hover:border-[#37003C]/30 transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-[#FAFAFA] text-[#37003C] border border-[#E5E5E5]">
                          <Shield className="h-6 w-6" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-bold text-[#1F1F1F]">
                              {admin.name}
                            </span>
                            <Badge
                              variant="secondary"
                              className="text-[10px] uppercase font-bold text-[#666666] bg-[#F4F4F5] border-[#E5E5E5]"
                            >
                              CO-ADMIN
                            </Badge>
                          </div>
                          <p className="text-sm text-[#555555]">
                            <span className="font-semibold text-[#1F1F1F]">
                              {admin.teamName}
                            </span>{" "}
                            <span className="text-[#BDBDBD]">·</span> FPL ID{" "}
                            <span className="font-mono font-medium text-[#1F1F1F]">
                              #{admin.fplId}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-[#E5E5E5] sm:border-t-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetPrimary(admin.fplId)}
                          title="Promote to primary administrator"
                          className="flex-1 sm:flex-none border-[#E5E5E5] hover:bg-[#FAFAFA] hover:text-[#37003C]"
                        >
                          <Crown className="h-4 w-4 text-amber-500 mr-1.5" />
                          <span>Make Primary</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setAdminToRemove(admin)}
                          title="Remove this administrator"
                          className="text-[#E9007F] hover:text-[#d00072] hover:bg-[#E9007F]/10 border-[#E5E5E5] px-3"
                        >
                          <Trash2 className="h-4 w-4 mr-1.5 sm:mr-0" />
                          <span className="sm:hidden">Remove</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Inline Add Co-Admin Form */}
                {showAddCoAdmin && (
                  <div className="max-w-xl mx-auto py-4 animate-fpl-slide-up">
                    <div className="relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 z-10 h-8 w-8 text-[#777777] hover:text-[#1F1F1F] hover:bg-[#F4F4F5] rounded-full"
                        onClick={() => {
                          setShowAddCoAdmin(false);
                          setAdminError("");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <FPLVerifier
                        onVerified={handleCoAdminVerified}
                        title="Add Co-Administrator"
                        description="Enter another organizer's FPL entry ID to verify and add them to this tournament."
                        buttonText="Verify & Add Co-Admin"
                        autoClearOnVerify={true}
                      />
                    </div>
                  </div>
                )}

                {/* Admin Exclusion Rule Panel */}
                <div className="rounded-lg bg-[#FAFAFA] border border-[#E5E5E5] p-4 flex items-start gap-3">
                  <Shield className="h-5 w-5 text-[#37003C] mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-[#1F1F1F]">
                      Admin Exclusion
                    </h4>
                    <p className="text-xs text-[#666666] mt-0.5">
                      Tournament administrators are automatically excluded from match scoring to maintain fairness.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Validation Bar & Submit Action */}
        <div className="pt-2">
          {admins.length > 0 && primaryAdmin && (
            <div className="flex items-center gap-2 mb-4 text-sm text-[#008f4c] bg-[#00FF87]/10 p-3.5 rounded-lg border border-[#00FF87]/30 animate-fpl-fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                Tournament has <strong>{admins.length}</strong> configured{" "}
                {admins.length === 1 ? "administrator" : "administrators"}. Primary Admin:{" "}
                <strong>{primaryAdmin.name}</strong>
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              disabled={loading || admins.length === 0}
              className="flex-1 h-12 bg-[#37003C] hover:bg-[#5A0A63] text-white font-bold text-base rounded-[10px] shadow-sm transition-all duration-200 disabled:opacity-70"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
              <span>
                {loading
                  ? isEdit
                    ? "Saving Changes..."
                    : "Creating Tournament..."
                  : isEdit
                  ? "Save Changes"
                  : "Create Tournament"}
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                isEdit
                  ? router.push(`/admin/tournaments/${initialData?.id}`)
                  : router.push("/admin")
              }
              disabled={loading}
              className="h-12 px-6 font-semibold border-[#E5E5E5] text-[#555555] hover:bg-[#FAFAFA] hover:text-[#1F1F1F] rounded-[10px]"
            >
              Cancel
            </Button>
          </div>
        </div>
      </form>

      {/* Remove Admin Confirmation Dialog */}
      <AlertDialog
        open={!!adminToRemove}
        onOpenChange={(open) => !open && setAdminToRemove(null)}
      >
        <AlertDialogContent className="bg-white border-[#E5E5E5] rounded-[16px] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-[#1F1F1F]">
              Remove Administrator?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#666666]">
              This will remove <strong className="text-[#1F1F1F]">{adminToRemove?.name}</strong> (FPL ID #{adminToRemove?.fplId}) from the tournament administrators.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-2">
            <AlertDialogCancel className="border-[#E5E5E5] text-[#555555] hover:bg-[#FAFAFA]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (adminToRemove) {
                  handleRemoveAdmin(adminToRemove.fplId);
                  setAdminToRemove(null);
                }
              }}
              className="bg-[#E9007F] hover:bg-[#d00072] text-white font-semibold"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

