import { createContext } from "react";

import type { AuthUser } from "@/api/auth";

export type AuthContextValue = {
  /** The signed-in user, or null when logged out. */
  user: AuthUser | null;
  /** True until the initial silent session restore resolves. */
  loading: boolean;
  /** Email + password login. Throws an API error on bad credentials or an
   *  unverified email (code EMAIL_NOT_VERIFIED). */
  signIn: (email: string, password: string) => Promise<void>;
  /** Create an account. Resolves once the verification email is sent — the
   *  user is NOT signed in until they verify and log in. */
  signUp: (email: string, password: string) => Promise<void>;
  /** Complete a Google sign-in with the ID token from @react-oauth/google. */
  signInWithGoogle: (credential: string) => Promise<void>;
  /** Sign out and clear cached per-user data. */
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
