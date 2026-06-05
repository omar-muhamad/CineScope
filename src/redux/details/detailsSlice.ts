import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { fetchRecommendations } from "../home/homeSlice";
import { Episode, Season } from "@/types";

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
  seasons?: Season[];
  number_of_seasons?: number;
};

type RecommendationsData = {
  id: number;
  media_type: string;
  backdrop_path: string;
  poster_path: string;
  release_date: string;
  first_air_date: string;
  adult: boolean;
  title: string;
  name: string;
};

interface DataState {
  loading?: boolean;
  details?: DetailsData;
  recommendations?: RecommendationsData[];
  episodes?: Episode[];
  episodesLoading?: boolean;
  error: string | undefined;
}

type Param = string | undefined;

const initialState: DataState = {
  loading: false,
  details: undefined,
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

export const fetchSeasonEpisodes = createAsyncThunk(
  "data/fetchSeasonEpisodes",
  async ({ id, season_number }: { id: Param; season_number: number }) => {
    try {
      const params = {
        api_key: import.meta.env.VITE_APP_API_KEY,
      };
      const response = await axios.get(
        `https://api.themoviedb.org/3/tv/${id}/season/${season_number}`,
        { params },
      );
      return response.data.episodes;
    } catch (err) {
      return err;
    }
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
        state.loading = true;
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.loading = false;
        state.recommendations = action.payload;
      })
      .addCase(fetchRecommendations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
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
