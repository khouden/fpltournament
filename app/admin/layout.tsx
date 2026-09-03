import { cookies } from "next/headers";
import { logoutAction } from "@/lib/actions";
import { Trophy, LogOut } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("admin_session");

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const session = JSON.parse(sessionCookie.value);
    if (session.expiresAt && session.expiresAt < Date.now()) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-xs border-b border-gray-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/admin" className="flex items-center gap-2 text-2xl font-bold text-gray-900 hover:text-indigo-600 transition">
            <Trophy className="h-6 w-6 text-indigo-600" />
            <span>Fantasy Leagues Admin</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 font-medium">
              {session.user?.email}
            </span>
            <form action={logoutAction}>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                className="gap-1.5"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
