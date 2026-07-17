import {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import * as authApi from "@/api/auth";
import type { AuthUser } from "@/api/auth";
import { setOnSessionExpired } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { AuthContext, type AuthContextValue } from "./AuthContext";

type AuthProviderProps = {
  children: ReactNode;
  /**
   * Test/SSR seam: seed the user directly instead of hitting the API. Pass
   * `null` for a resolved signed-out state. When omitted (production), the
   * provider restores the session from the refresh cookie on mount.
   */
  initialUser?: AuthUser | null;
};

export const AuthProvider: FC<AuthProviderProps> = ({
  children,
  initialUser,
}) => {
  const seeded = initialUser !== undefined;
  const [user, setUser] = useState<AuthUser | null>(initialUser ?? null);
  const [loading, setLoading] = useState(!seeded);

  useEffect(() => {
    // Tests inject a user and never touch the network.
    if (seeded) return;

    let active = true;
    authApi.restoreSession().then((restored) => {
      if (!active) return;
      setUser(restored);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [seeded]);

  useEffect(() => {
    // A mid-session refresh failure (revoked/expired session) signs us out.
    setOnSessionExpired(() => {
      setUser(null);
      queryClient.clear();
    });
    return () => setOnSessionExpired(null);
  }, []);

  const signIn = useCallback(async (identifier: string, password: string) => {
    setUser(await authApi.login(identifier, password));
  }, []);

  const signUp = useCallback(async (input: authApi.RegisterInput) => {
    // No session yet — the account must be verified via email first.
    await authApi.register(input);
  }, []);

  const signInWithGoogle = useCallback(async (credential: string) => {
    setUser(await authApi.loginWithGoogle(credential));
  }, []);

  const signOut = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    // Drop the previous user's cached lists so they don't leak to the next one.
    queryClient.clear();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
    }),
    [user, loading, signIn, signUp, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
