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
import {
  AlertCircle,
  Loader2,
  Trophy,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <main className="min-h-screen flex flex-col justify-between items-center bg-[#F7F7F7] px-4 py-8 sm:py-12 relative overflow-hidden font-sans selection:bg-[#37003C] selection:text-white">
      {/* Subtle Ambient FPL Decorative Background Accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[680px] h-[480px] bg-gradient-to-b from-[#37003C]/[0.04] via-[#5A0A63]/[0.02] to-transparent rounded-full blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-gradient-to-t from-[#00FF87]/[0.03] to-transparent rounded-full blur-2xl"
      />

      {/* Decorative ultra-low opacity football pitch geometry */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.025]"
      >
        <svg
          width="600"
          height="600"
          viewBox="0 0 600 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="300"
            cy="300"
            r="120"
            stroke="#37003C"
            strokeWidth="3"
          />
          <circle cx="300" cy="300" r="5" fill="#37003C" />
          <line
            x1="50"
            y1="300"
            x2="550"
            y2="300"
            stroke="#37003C"
            strokeWidth="3"
          />
        </svg>
      </div>

      {/* Top spacer for balanced vertical alignment */}
      <div className="hidden sm:block sm:h-4" />

      {/* Admin Login Shell */}
      <div className="w-full max-w-[440px] flex flex-col items-center relative z-10 my-auto">
        {/* Brand Identity */}
        <header className="flex flex-col items-center text-center mb-6 sm:mb-8 animate-fpl-fade-in">
          {/* Trophy Brand Icon */}
          <div className="relative mb-3.5">
            <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-[#37003C] text-white shadow-md shadow-[#37003C]/15 border border-[#5A0A63]/25 transition-transform duration-200 hover:scale-105">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            {/* Subtle green indicator dot */}
            <span
              className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[#00FF87] border-2 border-white shadow-xs"
              title="System Online"
              aria-hidden="true"
            />
          </div>

          {/* Admin Category Pill */}
          <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-[#5A0A63] bg-[#37003C]/5 px-2.5 py-0.5 rounded-full border border-[#37003C]/10 mb-1.5">
            Administration
          </span>

          {/* Main Titles */}
          <h1 className="text-2xl sm:text-[28px] font-black tracking-tight text-[#1F1F1F] leading-tight">
            Fantasy Leagues
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[#666666] mt-0.5">
            Admin Access Portal
          </p>
        </header>

        {/* Login Card */}
        <Card className="w-full bg-white border border-[#E5E5E5] rounded-2xl shadow-fpl-md p-6 sm:p-8 animate-fpl-slide-up transition-shadow hover:shadow-fpl-lg">
          <CardHeader className="p-0 pb-6 space-y-1 text-left">
            <CardTitle className="text-lg sm:text-xl font-bold text-[#1F1F1F] tracking-tight">
              Welcome back
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-[#666666]">
              Sign in to manage your fantasy tournaments.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-5">
            {/* Error Notification Callout */}
            {error && (
              <Alert
                variant="destructive"
                className="border-red-200 bg-red-50 text-red-900 animate-fpl-fade-in py-3 px-3.5 rounded-xl shadow-xs"
              >
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <div className="ml-1">
                  <AlertTitle className="text-xs font-bold text-red-900 tracking-tight leading-tight">
                    Authentication Failed
                  </AlertTitle>
                  <AlertDescription className="text-xs text-red-700 mt-0.5 leading-normal">
                    {error}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
              {/* Email Field */}
              <div className="space-y-1.5 text-left">
                <Label
                  htmlFor="email"
                  className="text-xs font-semibold text-[#1F1F1F] tracking-wide"
                >
                  Email address
                </Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  placeholder="admin@tournament.local"
                  required
                  autoComplete="email"
                  className="h-11 px-3.5 text-sm bg-white border-[#E5E5E5] text-[#1F1F1F] placeholder:text-[#888888] focus-visible:ring-2 focus-visible:ring-[#37003C] rounded-lg transition-colors"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-1.5 text-left">
                <Label
                  htmlFor="password"
                  className="text-xs font-semibold text-[#1F1F1F] tracking-wide"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="h-11 pl-3.5 pr-10 text-sm bg-white border-[#E5E5E5] text-[#1F1F1F] placeholder:text-[#888888] focus-visible:ring-2 focus-visible:ring-[#37003C] rounded-lg transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={loading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#777777] hover:text-[#1F1F1F] transition-colors p-1.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#37003C] disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#37003C] hover:bg-[#5A0A63] active:scale-[0.99] text-white font-bold rounded-lg shadow-sm text-sm tracking-wide transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <span>Log in</span>
                  )}
                </Button>
              </div>
            </form>

            {/* Security Hint */}
            <div className="pt-3 border-t border-[#F0F0F0] flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-[#777777]">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Authorized administrators only · Secure encrypted session</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Minimal Footer */}
      <footer className="mt-8 text-center text-xs text-[#888888] font-medium z-10">
        <p>© Fantasy Leagues · Administration Portal</p>
      </footer>
    </main>
  );
}
