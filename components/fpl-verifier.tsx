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
        setError(result.error || "Failed to verify entry");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-indigo-600" />
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Verification Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {manager && (
          <Alert variant="success">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>
              Verified: {manager.player_first_name} {manager.player_last_name}
            </AlertTitle>
            <AlertDescription className="mt-1">
              Team: <strong>{manager.name}</strong> • Manager ID:{" "}
              <strong>{manager.id}</strong>
              {manager.summary_overall_points !== undefined &&
                ` • Total Points: ${manager.summary_overall_points}`}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="entry-id">FPL Entry ID</Label>
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
          />
        </div>

        <Button
          type="button"
          onClick={handleVerify}
          disabled={loading || !entryId.trim()}
          className="w-full"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          <span>{loading ? "Verifying..." : buttonText}</span>
        </Button>
      </CardContent>
    </Card>
  );
}
