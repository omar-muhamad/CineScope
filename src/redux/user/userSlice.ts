import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
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

export interface UserState {
  /** Identity from Google OAuth — who the user is, and the app login gate. */
  google: GoogleUser | null;
  /** The user's own linked TMDB account/session — powers their lists. */
  tmdb: TmdbAccount | null;
  /** True while a TMDB session is being exchanged. */
  loading: boolean;
  error: string | null;
}

/**
 * Rebuild auth state from localStorage on load. The TMDB session is looked up
 * by the Google `sub`, so we only restore a TMDB account that belongs to the
 * currently signed-in Google user.
 */
const rehydrate = (): Pick<UserState, "google" | "tmdb"> => {
  const google = loadGoogleUser();
  const tmdb = google ? loadTmdbAccount(google.sub) : null;
  return { google, tmdb };
};

const initialState: UserState = {
  ...rehydrate(),
  loading: false,
  error: null,
};

export const signInWithGoogle = createAsyncThunk(
  "user/signInWithGoogle",
  async (credential: string, { rejectWithValue }) => {
    try {
      const google = decodeGoogleCredential(credential);
      saveGoogleUser(google);
      // Re-link this Google user's previously connected TMDB account, if any.
      const tmdb = loadTmdbAccount(google.sub);
      return { google, tmdb };
    } catch {
      return rejectWithValue("Could not read your Google account.");
    }
  },
);

export const completeTmdbConnect = createAsyncThunk(
  "user/completeTmdbConnect",
  async (requestToken: string, { getState, rejectWithValue }) => {
    try {
      const session_id = await createSession(requestToken);
      const account = await getAccount(session_id);
      const tmdb: TmdbAccount = { session_id, ...account };

      const sub = (getState() as { user: UserState }).user.google?.sub;
      if (sub) saveTmdbAccount(sub, tmdb);
      return tmdb;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to connect your TMDB account.",
      );
    }
  },
);

export const logout = createAsyncThunk(
  "user/logout",
  async (_, { getState }) => {
    const { user } = getState() as { user: UserState };
    if (user.tmdb?.session_id) {
      try {
        await deleteSession(user.tmdb.session_id);
      } catch {
        // Best-effort: still clear the client even if TMDB rejects the delete.
      }
    }
    clearAuthStorage(user.google?.sub);
    googleLogout();
  },
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(signInWithGoogle.fulfilled, (state, action) => {
        state.google = action.payload.google;
        state.tmdb = action.payload.tmdb;
        state.error = null;
      })
      .addCase(signInWithGoogle.rejected, (state, action) => {
        state.error = (action.payload as string) ?? "Google sign-in failed.";
      });

    builder
      .addCase(completeTmdbConnect.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeTmdbConnect.fulfilled, (state, action) => {
        state.loading = false;
        state.tmdb = action.payload;
      })
      .addCase(completeTmdbConnect.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ?? "Failed to connect your TMDB account.";
      });

    builder.addCase(logout.fulfilled, (state) => {
      state.google = null;
      state.tmdb = null;
      state.error = null;
    });
  },
});

export const { clearAuthError } = userSlice.actions;
export default userSlice.reducer;
