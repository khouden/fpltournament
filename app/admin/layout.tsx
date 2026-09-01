import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { logoutAction } from "@/lib/actions";
import { Trophy, LogOut, Shield } from "lucide-react";
import Link from "next/link";

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
      <header className="bg-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/admin" className="flex items-center gap-2 text-2xl font-bold text-gray-900 hover:text-indigo-600 transition">
            <Trophy className="h-6 w-6 text-indigo-600" />
            <span>Fantasy Leagues Admin</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 font-medium">
              {session.user?.email}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
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
