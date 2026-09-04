"use client";

import { useState } from "react";
import { verifyFPLEntryAction } from "@/lib/fpl-actions";
import type { FPLManager } from "@/lib/fpl";
import { CheckCircle2, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface FPLVerifierProps {
  onVerified?: (manager: FPLManager) => void;
  title?: string;
  description?: string;
  buttonText?: string;
  autoClearOnVerify?: boolean;
}

export function FPLVerifier({
  onVerified,
  title = "Verify FPL Entry",
  description = "Enter your FPL manager ID to verify and import your leagues",
  buttonText = "Verify Entry",
  autoClearOnVerify = false,
}: FPLVerifierProps) {
  const [entryId, setEntryId] = useState("");
  const [manager, setManager] = useState<FPLManager | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && "preventDefault" in e) {
      e.preventDefault();
    }
    setError("");
    setLoading(true);

    const cleanId = entryId.trim();

    try {
      const result = await verifyFPLEntryAction(cleanId);

      if (result.success && result.manager) {
        setManager(result.manager);
        onVerified?.(result.manager);
        if (autoClearOnVerify) {
          setEntryId("");
        }
      } else {
        // Map common API / not found errors to friendly message
        const isNotFound = result.error?.toLowerCase().includes("not found") || result.error?.includes("404");
        setError(isNotFound ? "FPL manager not found. Please check the Entry ID." : (result.error || "Failed to verify entry"));
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-xs border-[#E5E5E5] bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#37003C]/10 text-[#37003C]">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <CardTitle className="text-base font-bold text-[#1F1F1F]">{title}</CardTitle>
        </div>
        <CardDescription className="text-xs text-[#666666]">{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="bg-[#E9007F]/10 border-[#E9007F]/30 text-[#E9007F] [&>svg]:text-[#E9007F]">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Verification Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {manager && (
          <Alert variant="success" className="bg-emerald-50 border-emerald-200 text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertTitle>
              Verified: {manager.player_first_name} {manager.player_last_name}
            </AlertTitle>
            <AlertDescription className="mt-1 text-xs">
              Team: <strong className="font-semibold text-emerald-900">{manager.name}</strong> • Manager ID:{" "}
              <strong className="font-mono text-emerald-900">{manager.id}</strong>
              {manager.summary_overall_points !== undefined &&
                ` • Total Points: ${manager.summary_overall_points}`}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="entry-id" className="text-xs font-semibold text-[#1F1F1F]">FPL Entry ID</Label>
          <Input
            type="text"
            id="entry-id"
            value={entryId}
            onChange={(e) => setEntryId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleVerify();
              }
            }}
            disabled={loading}
            placeholder="e.g., 3040938"
            required
            className="h-11 focus-visible:ring-[#37003C]"
          />
        </div>

        <Button
          type="button"
          onClick={handleVerify}
          disabled={loading || !entryId.trim()}
          className="w-full h-11 bg-[#37003C] hover:bg-[#5A0A63] text-white font-semibold transition-colors"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          <span>{loading ? "Verifying..." : buttonText}</span>
        </Button>
      </CardContent>
    </Card>
  );
}
