import { logoutAction } from "@/lib/actions";
import { Trophy, LogOut, ExternalLink, Plus, LayoutDashboard, Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getAdminSessionServer } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSessionServer();

  if (!session) {
    return <>{children}</>;
  }

  return (
    <div
      className="min-h-screen bg-[#F8F9FA] text-[#1F1F1F] font-sans antialiased selection:bg-[#37003C] selection:text-[#00FF87]"
      suppressHydrationWarning
    >
      {/* Premier League Stadium Admin Header */}
      <header className="sticky top-0 z-50 bg-[#170020] border-b border-white/10 shadow-lg text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
          {/* Brand Identity & Main Nav */}
          <div className="flex items-center gap-6 sm:gap-8">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 group transition-opacity hover:opacity-95"
              aria-label="Fantasy Leagues Admin Home"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#37003C] text-[#00FF87] border border-[#00FF87]/30 shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-2 leading-none">
                <span className="text-base sm:text-lg font-black tracking-tight text-white">
                  Fantasy Leagues
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-[#00FF87]/15 text-[#00FF87] border border-[#00FF87]/30 px-2 py-0.5 rounded-full shadow-xs">
                  ADMIN
                </span>
              </div>
            </Link>

            {/* Quick Links */}
            <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-white/80">
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-[#00FF87]" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/admin/tournaments/new"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
              >
                <Plus className="h-3.5 w-3.5 text-[#00D9FF]" />
                <span>New Tournament</span>
              </Link>
              <Link
                href="/tournaments"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors text-white/70"
              >
                <span>Public Hub</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </nav>
          </div>

          {/* User Session & Logout */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs text-white/90">
              <Shield className="h-3.5 w-3.5 text-[#00FF87]" />
              <span
                className="font-medium truncate max-w-[140px] md:max-w-xs"
                title={session.user?.email || "Admin"}
              >
                {session.user?.email}
              </span>
            </div>

            <form action={logoutAction}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="gap-1.5 h-8 px-3 text-xs font-bold text-white/80 hover:text-white bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 rounded-lg transition-all cursor-pointer"
                aria-label="Log out of admin session"
              >
                <LogOut className="h-3.5 w-3.5 text-rose-400" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
