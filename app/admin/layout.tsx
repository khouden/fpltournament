import { logoutAction } from "@/lib/actions";
import { Trophy, LogOut } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getAdminSessionServer } from "@/lib/auth-server";

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
    <div className="min-h-screen bg-[#F7F7F7] text-[#1F1F1F] font-sans antialiased selection:bg-[#37003C] selection:text-white">
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E5E5] shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:py-3.5 sm:px-6 lg:px-8">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 group transition-opacity hover:opacity-90"
            aria-label="Fantasy Leagues Admin Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#37003C] text-[#00FF87] shadow-xs shrink-0">
              <Trophy className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-base sm:text-lg font-bold tracking-tight text-[#1F1F1F]">
                Fantasy Leagues
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-[#37003C]/10 text-[#37003C] px-1.5 py-0.5 rounded-[4px]">
                Admin
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            <span
              className="text-xs sm:text-sm text-[#666666] font-medium truncate max-w-[130px] sm:max-w-xs"
              title={session.user?.email || "Admin"}
            >
              {session.user?.email}
            </span>
            <form action={logoutAction}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 px-3 text-xs sm:text-sm font-medium text-[#555555] border-[#E5E5E5] hover:text-[#E9007F] hover:bg-[#E9007F]/10 hover:border-[#E9007F]/30 transition-colors"
                aria-label="Log out of admin session"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
