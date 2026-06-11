import { createClient } from "@supabase/supabase-js";

/**
 * App-wide Supabase client. Backs Google sign-in (Auth) and the user's
 * favorites / watch-later (Postgres + Row-Level Security).
 *
 * The anon key is meant to ship in the client — RLS is what protects the data.
 * `detectSessionInUrl` lets the client parse the session from the OAuth redirect
 * hash automatically, so no dedicated callback route is needed.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
