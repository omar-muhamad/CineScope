import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  fetchFavorites,
  fetchWatchlist,
  setFavorite,
  setWatchlist,
  type MediaType,
} from "@/lib/tmdb";
import type { RootState } from "@/redux/store";

export type MediaItem = {
  id: number;
  media_type: string;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average?: number;
};

export interface BookmarkState {
  favorites: MediaItem[] | null;
  watchlist: MediaItem[] | null;
  favoritesLoading: boolean;
  watchlistLoading: boolean;
  error: string | null;
}

const initialState: BookmarkState = {
  favorites: null,
  watchlist: null,
  favoritesLoading: false,
  watchlistLoading: false,
  error: null,
};

type ToggleArgs = { media_type: MediaType; id: number };

const NO_TMDB = "Connect a TMDB account to use this feature.";

export const fetchFavoritesList = createAsyncThunk(
  "bookmark/fetchFavorites",
  async (_, { getState, rejectWithValue }) => {
    const { tmdb } = (getState() as RootState).user;
    if (!tmdb) return rejectWithValue(NO_TMDB);
    try {
      return (await fetchFavorites(
        tmdb.account_id,
        tmdb.session_id,
      )) as MediaItem[];
    } catch {
      return rejectWithValue("Failed to load your bookmarked titles.");
    }
  },
);

export const fetchWatchlistList = createAsyncThunk(
  "bookmark/fetchWatchlist",
  async (_, { getState, rejectWithValue }) => {
    const { tmdb } = (getState() as RootState).user;
    if (!tmdb) return rejectWithValue(NO_TMDB);
    try {
      return (await fetchWatchlist(
        tmdb.account_id,
        tmdb.session_id,
      )) as MediaItem[];
    } catch {
      return rejectWithValue("Failed to load your watch-later list.");
    }
  },
);

export const toggleFavorite = createAsyncThunk(
  "bookmark/toggleFavorite",
  async (
    { media_type, id, favorite }: ToggleArgs & { favorite: boolean },
    { getState, rejectWithValue },
  ) => {
    const { tmdb } = (getState() as RootState).user;
    if (!tmdb) return rejectWithValue(NO_TMDB);
    try {
      await setFavorite(
        tmdb.account_id,
        tmdb.session_id,
        media_type,
        id,
        favorite,
      );
      return { id, favorite };
    } catch {
      return rejectWithValue("Failed to update your bookmarks.");
    }
  },
);

export const toggleWatchlist = createAsyncThunk(
  "bookmark/toggleWatchlist",
  async (
    { media_type, id, watchlist }: ToggleArgs & { watchlist: boolean },
    { getState, rejectWithValue },
  ) => {
    const { tmdb } = (getState() as RootState).user;
    if (!tmdb) return rejectWithValue(NO_TMDB);
    try {
      await setWatchlist(
        tmdb.account_id,
        tmdb.session_id,
        media_type,
        id,
        watchlist,
      );
      return { id, watchlist };
    } catch {
      return rejectWithValue("Failed to update your watch-later list.");
    }
  },
);

const bookmarkSlice = createSlice({
  name: "bookmark",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavoritesList.pending, (state) => {
        state.favoritesLoading = true;
        state.error = null;
      })
      .addCase(fetchFavoritesList.fulfilled, (state, action) => {
        state.favoritesLoading = false;
        state.favorites = action.payload;
      })
      .addCase(fetchFavoritesList.rejected, (state, action) => {
        state.favoritesLoading = false;
        state.error = (action.payload as string) ?? "Failed to load bookmarks.";
      });

    builder
      .addCase(fetchWatchlistList.pending, (state) => {
        state.watchlistLoading = true;
        state.error = null;
      })
      .addCase(fetchWatchlistList.fulfilled, (state, action) => {
        state.watchlistLoading = false;
        state.watchlist = action.payload;
      })
      .addCase(fetchWatchlistList.rejected, (state, action) => {
        state.watchlistLoading = false;
        state.error =
          (action.payload as string) ?? "Failed to load watch-later list.";
      });

    // Keep cached lists in sync when an item is removed from a list page.
    builder.addCase(toggleFavorite.fulfilled, (state, action) => {
      if (!action.payload.favorite && state.favorites) {
        state.favorites = state.favorites.filter(
          (item) => item.id !== action.payload.id,
        );
      }
    });
    builder.addCase(toggleWatchlist.fulfilled, (state, action) => {
      if (!action.payload.watchlist && state.watchlist) {
        state.watchlist = state.watchlist.filter(
          (item) => item.id !== action.payload.id,
        );
      }
    });
  },
});

export default bookmarkSlice.reducer;
