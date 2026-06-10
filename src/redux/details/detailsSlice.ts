import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { fetchRecommendations } from "../home/homeSlice";
import { Episode, Season, Video } from "@/types";

type DetailsData = {
  id: number;
  backdrop_path: string;
  release_date: string;
  first_air_date: string;
  adult: boolean;
  title: string;
  name: string;
  poster_path: string;
  genres: { id: number; name: string }[];
  vote_average: number;
  overview: string;
  imdb_id?: string;
  external_ids?: { imdb_id: string | null };
  seasons?: Season[];
  number_of_seasons?: number;
  release_dates?: {
    results: {
      iso_3166_1: string;
      release_dates: { certification: string }[];
    }[];
  };
  content_ratings?: {
    results: { iso_3166_1: string; rating: string }[];
  };
  videos?: {
    results: Video[];
  };
};

type RecommendationsData = {
  id: number;
  media_type: string;
  backdrop_path: string;
  poster_path: string;
  release_date: string;
  first_air_date: string;
  adult: boolean;
  vote_average: number;
  title: string;
  name: string;
};

interface DataState {
  loading?: boolean;
  details?: DetailsData;
  recommendations?: RecommendationsData[];
  recommendationsLoading?: boolean;
  imdbRating?: string | null;
  imdbRatingLoading?: boolean;
  episodes?: Episode[];
  episodesLoading?: boolean;
  error: string | undefined;
}

type Param = string | undefined;

const initialState: DataState = {
  loading: false,
  details: undefined,
  recommendationsLoading: false,
  episodes: [],
  episodesLoading: false,
  error: undefined,
};

export const fetchDetails = createAsyncThunk(
  "data/fetchDetails",
  async ({ media_type, id }: { media_type: Param; id: Param }) => {
    try {
      const params = {
        api_key: import.meta.env.VITE_APP_API_KEY,
        append_to_response:
          media_type === "tv"
            ? "content_ratings,videos,external_ids"
            : "release_dates,videos,external_ids",
      };
      const response = await axios.get(
        `https://api.themoviedb.org/3/${media_type}/${id}`,
        { params },
      );
      return response.data;
    } catch (err) {
      return err;
    }
  },
);

// IMDb ratings aren't part of the TMDB payload (vote_average is TMDB's own
// score), so we resolve the title's IMDb id from TMDB and look the rating up
// via the OMDb API. Returns the rating as a string (e.g. "8.5") or null when
// it's unavailable / OMDb has no data.
export const fetchImdbRating = createAsyncThunk(
  "data/fetchImdbRating",
  async ({ imdb_id }: { imdb_id: Param }) => {
    const apiKey = import.meta.env.VITE_APP_OMDB_API_KEY;
    if (!imdb_id || !apiKey) return null;

    const response = await axios.get("https://www.omdbapi.com/", {
      params: { i: imdb_id, apikey: apiKey },
    });

    const rating = response.data?.imdbRating;
    return rating && rating !== "N/A" ? rating : null;
  },
);

export const fetchSeasonEpisodes = createAsyncThunk(
  "data/fetchSeasonEpisodes",
  async ({ id, season_number }: { id: Param; season_number: number }) => {
    const params = {
      api_key: import.meta.env.VITE_APP_API_KEY,
    };
    const response = await axios.get(
      `https://api.themoviedb.org/3/tv/${id}/season/${season_number}`,
      { params },
    );
    return response.data.episodes;
  },
);

export const detailsSlice = createSlice({
  name: "details",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDetails.pending, (state) => {
        state.loading = true;
        state.imdbRating = undefined;
      })
      .addCase(fetchDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.details = action.payload;
      })
      .addCase(fetchDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
    builder
      .addCase(fetchRecommendations.pending, (state) => {
        state.recommendationsLoading = true;
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.recommendationsLoading = false;
        state.recommendations = action.payload;
      })
      .addCase(fetchRecommendations.rejected, (state, action) => {
        state.recommendationsLoading = false;
        state.error = action.error.message;
      });
    builder
      .addCase(fetchImdbRating.pending, (state) => {
        state.imdbRatingLoading = true;
      })
      .addCase(fetchImdbRating.fulfilled, (state, action) => {
        state.imdbRatingLoading = false;
        state.imdbRating = action.payload;
      })
      .addCase(fetchImdbRating.rejected, (state) => {
        state.imdbRatingLoading = false;
        state.imdbRating = null;
      });
    builder
      .addCase(fetchSeasonEpisodes.pending, (state) => {
        state.episodesLoading = true;
      })
      .addCase(fetchSeasonEpisodes.fulfilled, (state, action) => {
        state.episodesLoading = false;
        state.episodes = action.payload;
      })
      .addCase(fetchSeasonEpisodes.rejected, (state, action) => {
        state.episodesLoading = false;
        state.error = action.error.message;
      });
  },
});

export default detailsSlice.reducer;
