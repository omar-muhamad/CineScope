import {
  api,
  refreshSession,
  setAccessToken,
  type AuthUser,
  type SessionPayload,
} from "@/lib/api";

export type { AuthUser };

/**
 * Create an email/password account. Resolves once the account exists and the
 * verification email is on its way — there is NO session yet; the user logs in
 * after clicking the emailed link.
 */
export const register = async (
  email: string,
  password: string,
): Promise<void> => {
  await api.post("/auth/register", { email, password });
};

/** Email + password login. Throws with code EMAIL_NOT_VERIFIED when pending. */
export const login = async (
  email: string,
  password: string,
): Promise<AuthUser> => {
  const { data } = await api.post<SessionPayload>("/auth/login", {
    email,
    password,
  });
  setAccessToken(data.accessToken);
  return data.user;
};

/** Exchange the Google ID token from @react-oauth/google for a session. */
export const loginWithGoogle = async (
  credential: string,
): Promise<AuthUser> => {
  const { data } = await api.post<SessionPayload>("/auth/google", {
    credential,
  });
  setAccessToken(data.accessToken);
  return data.user;
};

/**
 * Silent session restore from the refresh cookie (page load). Null when the
 * user simply isn't signed in — never throws.
 */
export const restoreSession = async (): Promise<AuthUser | null> => {
  const session = await refreshSession();
  return session?.user ?? null;
};

/**
 * Revoke the session server-side and drop the local token. Never throws — the
 * user is signed out locally even if the network call fails.
 */
export const logout = async (): Promise<void> => {
  try {
    await api.post("/auth/logout");
  } catch {
    // Local sign-out still proceeds.
  } finally {
    setAccessToken(null);
  }
};

/** Consume an emailed verification token. Throws on invalid/expired links. */
export const verifyEmail = async (token: string): Promise<void> => {
  await api.post("/auth/verify-email", { token });
};

/** Ask for a fresh verification link. Always resolves (no enumeration). */
export const resendVerification = async (email: string): Promise<void> => {
  await api.post("/auth/resend-verification", { email });
};
