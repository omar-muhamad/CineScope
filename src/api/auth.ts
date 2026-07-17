import {
  api,
  refreshSession,
  setAccessToken,
  type AuthUser,
  type SessionPayload,
} from "@/lib/api";

export type { AuthUser };

export type RegisterInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  /** Optional small avatar as an image data URL (see fileToAvatarDataUrl). */
  avatar?: string;
};

/**
 * Create an email/password account. Resolves once the account exists and the
 * verification email is on its way — there is NO session yet; the user logs in
 * after clicking the emailed link.
 */
export const register = async (input: RegisterInput): Promise<void> => {
  await api.post("/auth/register", input);
};

/**
 * Login with email or username + password. Throws with code
 * EMAIL_NOT_VERIFIED while the account's email is still unconfirmed.
 */
export const login = async (
  identifier: string,
  password: string,
): Promise<AuthUser> => {
  const { data } = await api.post<SessionPayload>("/auth/login", {
    identifier,
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

/**
 * Ask for a fresh verification link, by email or username. Always resolves
 * (no enumeration); the mail goes to the account's stored address.
 */
export const resendVerification = async (identifier: string): Promise<void> => {
  await api.post("/auth/resend-verification", { identifier });
};
