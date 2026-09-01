import { Session } from "@/types/auth";

const SESSION_STORAGE_KEY = "admin_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function createSession(email: string): Session {
  return {
    user: {
      id: "admin",
      email,
    },
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };
}

export function validateSession(session: Session): boolean {
  return session.user !== null && session.expiresAt > Date.now();
}

export function getSessionFromCookie(
  cookieHeader: string | null
): Session | null {
  if (!cookieHeader) return null;

  try {
    const cookies = cookieHeader.split("; ").reduce(
      (acc, cookie) => {
        const [key, value] = cookie.split("=");
        acc[key] = decodeURIComponent(value);
        return acc;
      },
      {} as Record<string, string>
    );

    const sessionData = cookies[SESSION_STORAGE_KEY];
    if (!sessionData) return null;

    const session = JSON.parse(sessionData) as Session;
    return validateSession(session) ? session : null;
  } catch {
    return null;
  }
}

export function setSessionCookie(session: Session): string {
  const serialized = encodeURIComponent(JSON.stringify(session));
  const maxAge = SESSION_DURATION_MS / 1000;
  return `${SESSION_STORAGE_KEY}=${serialized}; Path=/; HttpOnly; Max-Age=${maxAge}; SameSite=Lax`;
}
