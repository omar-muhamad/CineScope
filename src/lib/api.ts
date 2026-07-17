import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

/**
 * App API client. The access token lives only in this module's memory (never
 * storage — XSS can't read what isn't there); the long-lived refresh token is
 * an httpOnly cookie scoped to /api/auth that the server manages. On a 401 the
 * response interceptor silently refreshes and retries once, so callers never
 * deal with token lifetimes.
 */

export type AuthUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  /** Login handle. Null for Google-created accounts. */
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  /** Data-URL avatar uploaded at signup, or the Google profile photo URL. */
  avatarUrl: string | null;
};

export type SessionPayload = {
  user: AuthUser;
  accessToken: string;
};

export const api = axios.create({ baseURL: "/api" });

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

/** Called when a refresh fails mid-session — the provider signs the user out. */
let onSessionExpired: (() => void) | null = null;
export const setOnSessionExpired = (handler: (() => void) | null) => {
  onSessionExpired = handler;
};

/**
 * The refresh cookie is shared browser-wide but rotates on every use, so two
 * tabs refreshing at once would race (the loser presents an already-rotated
 * token). Web Locks serialize the calls across tabs — the waiter then sends
 * the successor cookie the winner installed. Same-tab callers already share
 * one flight via refreshInFlight; older browsers just fall back to that.
 */
const withCrossTabLock = <T>(task: () => Promise<T>): Promise<T> =>
  typeof navigator !== "undefined" && navigator.locks
    ? navigator.locks.request("cine-scope-refresh", task)
    : task();

/**
 * Exchange the refresh cookie for a new access token (single-flight: parallel
 * 401s share one refresh call). Resolves null when there's no valid session.
 */
let refreshInFlight: Promise<SessionPayload | null> | null = null;
export const refreshSession = (): Promise<SessionPayload | null> => {
  refreshInFlight ??= withCrossTabLock(() =>
    axios
      // Bare axios, not `api` — a 401 here must not re-enter the interceptor.
      .post<SessionPayload>("/api/auth/refresh")
      .then(({ data }) => {
        setAccessToken(data.accessToken);
        return data;
      }),
  )
    .catch(() => {
      setAccessToken(null);
      return null;
    })
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
};

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as RetriableConfig | undefined;
  const status = error.response?.status;

  // Auth endpoints speak 401 as part of their contract (bad password, no
  // session) — refresh-and-retry only applies to protected resource calls.
  const isAuthCall = config?.url?.includes("/auth/") ?? false;

  if (status !== 401 || !config || config._retried || isAuthCall) {
    throw error;
  }

  config._retried = true;
  const session = await refreshSession();
  if (!session) {
    onSessionExpired?.();
    throw error;
  }
  config.headers.Authorization = `Bearer ${session.accessToken}`;
  return api(config);
});

/** The `{ code, message }` error body the API sends, if this is one. */
export const getApiError = (
  error: unknown,
): { code?: string; message?: string } => {
  if (axios.isAxiosError(error) && error.response?.data) {
    return error.response.data as { code?: string; message?: string };
  }
  return {};
};
