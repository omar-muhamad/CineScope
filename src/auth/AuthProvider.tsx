import {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { AuthContext, type AuthContextValue } from "./AuthContext";

type AuthProviderProps = {
  children: ReactNode;
  /**
   * Test/SSR seam: seed the session directly instead of reading Supabase.
   * Pass `null` for a resolved signed-out state. When omitted (production),
   * the provider loads the session from Supabase and subscribes to changes.
   */
  initialSession?: Session | null;
};

export const AuthProvider: FC<AuthProviderProps> = ({
  children,
  initialSession,
}) => {
  const seeded = initialSession !== undefined;
  const [session, setSession] = useState<Session | null>(
    initialSession ?? null,
  );
  const [loading, setLoading] = useState(!seeded);

  useEffect(() => {
    // Tests inject a session and never touch the Supabase client.
    if (seeded) return;

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [seeded]);

  const signIn = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    // Drop the previous user's cached lists so they don't leak to the next one.
    queryClient.clear();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      signIn,
      signOut,
    }),
    [session, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
