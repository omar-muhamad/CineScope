import { createContext } from "react";

import type { GoogleUser } from "@/lib/jwt";
import type { TmdbAccount } from "@/lib/tmdbAuth";

export type AuthContextValue = {
  /** Identity from Google OAuth — who the user is, and the app login gate. */
  google: GoogleUser | null;
  /** The user's own linked TMDB account/session — powers their lists. */
  tmdb: TmdbAccount | null;
  /** True while a TMDB session is being exchanged. */
  loading: boolean;
  error: string | null;
  /** Decode a Google credential, persist it, and re-link any TMDB account. */
  signIn: (credential: string) => void;
  /** Exchange an approved TMDB request token for a session and link it. */
  connectTmdb: (requestToken: string) => void;
  /** Revoke the TMDB session, clear stored identity, and reset cached data. */
  logout: () => Promise<void>;
  clearError: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
