"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/lib/actions";
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Trophy } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await loginAction(email, password);

      if (result.success) {
        // Redirect to admin dashboard
        router.push("/admin");
        router.refresh();
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <Card className="w-full max-w-md shadow-xl border-gray-200">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-2">
            <Trophy className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Fantasy Leagues
          </CardTitle>
          <CardDescription className="text-gray-600">Admin Access Portal</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Authentication Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="admin@tournament.local"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full font-semibold"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <span>{loading ? "Logging in..." : "Login"}</span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
