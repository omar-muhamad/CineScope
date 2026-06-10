import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

export type AuthContextValue = {
  /** The signed-in Supabase user (Google identity), or null when logged out. */
  user: User | null;
  /** The full Supabase session (token used by RLS), or null when logged out. */
  session: Session | null;
  /** True until the initial session lookup resolves. */
  loading: boolean;
  /** Start the Google OAuth redirect flow. */
  signIn: () => Promise<void>;
  /** Sign out and clear cached per-user data. */
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
