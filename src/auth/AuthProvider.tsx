import { FC, ReactNode, useCallback, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { googleLogout } from "@react-oauth/google";

import { decodeGoogleCredential, type GoogleUser } from "@/lib/jwt";
import {
  createSession,
  deleteSession,
  getAccount,
  type TmdbAccount,
} from "@/lib/tmdbAuth";
import {
  clearAuthStorage,
  loadGoogleUser,
  loadTmdbAccount,
  saveGoogleUser,
  saveTmdbAccount,
} from "@/lib/authStorage";
import { queryClient } from "@/lib/queryClient";
import { AuthContext, type AuthContextValue } from "./AuthContext";

type Identity = { google: GoogleUser | null; tmdb: TmdbAccount | null };

/**
 * Rebuild auth state from localStorage on load. The TMDB session is looked up
 * by the Google `sub`, so we only restore a TMDB account that belongs to the
 * currently signed-in Google user.
 */
const rehydrate = (): Identity => {
  const google = loadGoogleUser();
  const tmdb = google ? loadTmdbAccount(google.sub) : null;
  return { google, tmdb };
};

type AuthProviderProps = {
  children: ReactNode;
  /** Test/SSR seam: override the initial identity instead of reading storage. */
  initialAuth?: Identity;
};

export const AuthProvider: FC<AuthProviderProps> = ({
  children,
  initialAuth,
}) => {
  const [{ google, tmdb }, setIdentity] = useState<Identity>(
    () => initialAuth ?? rehydrate(),
  );
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const signIn = useCallback((credential: string) => {
    try {
      const googleUser = decodeGoogleCredential(credential);
      saveGoogleUser(googleUser);
      // Re-link this Google user's previously connected TMDB account, if any.
      const linked = loadTmdbAccount(googleUser.sub);
      setIdentity({ google: googleUser, tmdb: linked });
      setError(null);
    } catch {
      setError("Could not read your Google account.");
    }
  }, []);

  const connect = useMutation({
    mutationFn: async (requestToken: string): Promise<TmdbAccount> => {
      const session_id = await createSession(requestToken);
      const account = await getAccount(session_id);
      return { session_id, ...account };
    },
    onMutate: () => setError(null),
    onSuccess: (account) => {
      if (google) saveTmdbAccount(google.sub, account);
      setIdentity((prev) => ({ ...prev, tmdb: account }));
    },
    onError: (err) => {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to connect your TMDB account.",
      );
    },
  });

  // `mutate` is referentially stable across renders in React Query v5.
  const connectTmdb = connect.mutate;

  const logout = useCallback(async () => {
    if (tmdb?.session_id) {
      try {
        await deleteSession(tmdb.session_id);
      } catch {
        // Best-effort: still clear the client even if TMDB rejects the delete.
      }
    }
    clearAuthStorage(google?.sub);
    googleLogout();
    setIdentity({ google: null, tmdb: null });
    setError(null);
    // Drop the previous user's cached lists/states so they don't leak.
    queryClient.clear();
  }, [google?.sub, tmdb?.session_id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      google,
      tmdb,
      loading: connect.isPending,
      error,
      signIn,
      connectTmdb,
      logout,
      clearError,
    }),
    [
      google,
      tmdb,
      connect.isPending,
      error,
      signIn,
      connectTmdb,
      logout,
      clearError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
