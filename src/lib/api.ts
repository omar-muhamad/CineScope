import axios from "axios";

import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/lib/queryClient";

/**
 * App API client for the saved-lists endpoints. Auth rides on Better Auth's
 * httpOnly session cookie — same-origin requests carry it automatically, so
 * there are no tokens, refreshes, or interceptor retries to manage here.
 */
export const api = axios.create({ baseURL: "/api" });

// A 401 from a protected call means the session expired or was revoked
// mid-session. Drop per-user caches and refetch the session (bypassing any
// cookie cache) so the shared store flips the whole UI to signed-out. No
// retry — the user must sign in again.
api.interceptors.response.use(undefined, (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    queryClient.clear();
    void authClient.getSession({ query: { disableCookieCache: true } });
  }
  return Promise.reject(error);
});
