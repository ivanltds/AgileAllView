export interface Session {
  username: string;
  pat: string;
  createdAt: number;
}

const SESSION_KEY = "agileallview_session";

export function createSession(username: string, pat: string): Session {
  const session: Session = {
    username,
    pat,
    createdAt: Date.now(),
  };

  if (typeof window !== "undefined") {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  return session;
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;

  const sessionData = sessionStorage.getItem(SESSION_KEY);
  if (!sessionData) return null;

  try {
    return JSON.parse(sessionData);
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}
