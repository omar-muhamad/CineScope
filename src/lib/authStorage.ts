import type { GoogleUser } from "./jwt";
import type { TmdbAccount } from "./tmdbAuth";

/**
 * Client-side persistence for the auth state. The Google profile is the source
 * of identity; each user's TMDB session is stored keyed by their Google `sub`
 * so different Google users link to their own TMDB accounts on the same device.
 */
const GOOGLE_KEY = "cinescope:google";
const tmdbKey = (sub: string) => `cinescope:tmdb:${sub}`;

const read = <T>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

export const loadGoogleUser = (): GoogleUser | null =>
  read<GoogleUser>(GOOGLE_KEY);

export const saveGoogleUser = (user: GoogleUser): void => {
  localStorage.setItem(GOOGLE_KEY, JSON.stringify(user));
};

export const loadTmdbAccount = (sub: string): TmdbAccount | null =>
  read<TmdbAccount>(tmdbKey(sub));

export const saveTmdbAccount = (sub: string, account: TmdbAccount): void => {
  localStorage.setItem(tmdbKey(sub), JSON.stringify(account));
};

export const clearAuthStorage = (sub: string | undefined): void => {
  localStorage.removeItem(GOOGLE_KEY);
  if (sub) localStorage.removeItem(tmdbKey(sub));
};
