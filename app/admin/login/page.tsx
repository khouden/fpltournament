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
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
} from "lucide-react";
import { FplLogoIcon } from "@/components/brand/fpl-logo";

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
    <main className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-[#14001c] via-[#20002d] to-[#0d0014] text-white px-4 py-8 relative overflow-y-auto font-sans selection:bg-[#00FF87] selection:text-[#063319]">
      {/* Stadium Ambient Glowing Accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[500px] bg-gradient-to-b from-[#37003C]/30 via-[#5A0A63]/20 to-transparent rounded-full blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/4 -left-40 w-[450px] h-[450px] bg-[#00FF87]/[0.06] rounded-full blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 -right-40 w-[480px] h-[480px] bg-[#00D9FF]/[0.06] rounded-full blur-3xl"
      />

      {/* Decorative ultra-low opacity football pitch geometry */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04]"
      >
        <svg
          width="700"
          height="700"
          viewBox="0 0 700 700"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="350" cy="350" r="160" stroke="#00FF87" strokeWidth="3" />
          <circle cx="350" cy="350" r="6" fill="#00FF87" />
          <line x1="50" y1="350" x2="650" y2="350" stroke="#00FF87" strokeWidth="3" />
        </svg>
      </div>

      {/* Login Container */}
      <div className="w-full max-w-[420px] flex flex-col items-center relative z-10 my-auto">
        {/* Brand Header */}
        <header className="flex flex-col items-center text-center mb-5 animate-fpl-fade-in">
          {/* Brand Logo Icon */}
          <div className="relative mb-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xl shadow-[#00FF87]/20 p-2.5 transition-transform duration-200 hover:scale-105 ring-1 ring-black/5">
              <FplLogoIcon size={56} className="w-full h-full" priority badge={false} />
            </div>
            {/* Live indicator dot */}
            <span
              className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[#00FF87] border-2 border-[#14001c] shadow-xs animate-pulse"
              title="Portal Online"
              aria-hidden="true"
            />
          </div>

          {/* Admin Category Pill */}
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#00FF87] bg-[#00FF87]/10 px-3 py-0.5 rounded-full border border-[#00FF87]/25 mb-1.5 shadow-xs">
            <Sparkles className="h-3 w-3" />
            <span>FPL TOURNAMENTS · ADMIN</span>
          </span>

          {/* Titles */}
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
            Command Center
          </h1>
          <p className="text-xs sm:text-sm font-medium text-white/70 mt-0.5">
            Sign in to manage leagues, fixtures &amp; scoring
          </p>
        </header>

        {/* Glassmorphic Login Card */}
        <Card className="w-full bg-white/[0.07] backdrop-blur-xl border border-white/15 rounded-3xl shadow-2xl p-5 sm:p-7 animate-fpl-slide-up text-white">
          <CardHeader className="p-0 pb-4 space-y-1 text-left">
            <CardTitle className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#00FF87]" />
              <span>Administrator Login</span>
            </CardTitle>
            <CardDescription className="text-xs text-white/60">
              Enter your authorized credentials below.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-5">
            {/* Error Callout */}
            {error && (
              <Alert
                variant="destructive"
                className="border-rose-500/40 bg-rose-950/70 text-rose-200 backdrop-blur-md animate-fpl-fade-in py-3 px-3.5 rounded-xl shadow-xs"
              >
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <div className="ml-1">
                  <AlertTitle className="text-xs font-bold text-rose-200 tracking-tight leading-tight">
                    Authentication Failed
                  </AlertTitle>
                  <AlertDescription className="text-xs text-rose-300/90 mt-0.5 leading-normal">
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
                  className="text-xs font-bold text-white/80 tracking-wide uppercase"
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
                  required
                  autoComplete="email"
                  className="h-11 px-3.5 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-[#00FF87] focus-visible:border-[#00FF87] rounded-xl transition-all"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-1.5 text-left">
                <Label
                  htmlFor="password"
                  className="text-xs font-bold text-white/80 tracking-wide uppercase"
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
                    className="h-11 pl-3.5 pr-10 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-[#00FF87] focus-visible:border-[#00FF87] rounded-xl transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={loading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors p-1.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF87] disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-[#00FF87] to-[#00D9FF] hover:opacity-95 active:scale-[0.99] text-[#063319] font-black rounded-xl shadow-lg shadow-[#00FF87]/20 text-sm tracking-wide transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed border-0"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign in to Control Center</span>
                  )}
                </Button>
              </div>
            </form>

            {/* Security Indicator */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-white/60">
              <ShieldCheck className="h-3.5 w-3.5 text-[#00FF87] shrink-0" />
              <span>Authorized administrators only · Encrypted session</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-white/50 font-medium z-10">
        <p>© Fantasy Premier League Tournaments · Control Center</p>
      </footer>
    </main>
  );
}
