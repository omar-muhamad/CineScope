import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

type HomeData = {
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
  loading: boolean;
  trending: HomeData[];
  trendingMovies?: HomeData[];
  trendingTv?: HomeData[];
  recommendations?: HomeData[];
  error: string | undefined;
}

const initialState: DataState = {
  loading: false,
  trending: [],
  trendingMovies: [],
  trendingTv: [],
  recommendations: [],
  error: undefined,
};

export const fetchTrending = createAsyncThunk(
  "data/fetchTrending",
  async () => {
    try {
      const params = {
        api_key: import.meta.env.VITE_APP_API_KEY,
        language: "en-US",
      };
      const response = await axios.get(
        "https://api.themoviedb.org/3/trending/all/week",
        { params },
      );
      return response.data.results;
    } catch (err) {
      return err;
    }
  },
);

export const fetchTrendingMovies = createAsyncThunk(
  "data/fetchTrendingMovies",
  async () => {
    const params = {
      api_key: import.meta.env.VITE_APP_API_KEY,
      language: "en-US",
    };
    const response = await axios.get(
      "https://api.themoviedb.org/3/trending/movie/week",
      { params },
    );
    return response.data.results;
  },
);

export const fetchTrendingTv = createAsyncThunk(
  "data/fetchTrendingTv",
  async () => {
    const params = {
      api_key: import.meta.env.VITE_APP_API_KEY,
      language: "en-US",
    };
    const response = await axios.get(
      "https://api.themoviedb.org/3/trending/tv/week",
      { params },
    );
    return response.data.results;
  },
);

export const fetchRecommendations = createAsyncThunk(
  "data/fetchRecommendations",
  async ({
    id,
    media_type,
  }: {
    id: string;
    media_type: string | undefined;
  }) => {
    try {
      const params = {
        api_key: import.meta.env.VITE_APP_API_KEY,
      };
      const response = await axios.get(
        `https://api.themoviedb.org/3/${media_type}/${id}/recommendations`,
        { params },
      );
      return response.data.results;
    } catch (err) {
      return err;
    }
  },
);

export const dataSlice = createSlice({
  name: "data",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrending.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTrending.fulfilled, (state, action) => {
        state.loading = false;
        state.trending = action.payload;
      })
      .addCase(fetchTrending.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
    builder
      .addCase(fetchTrendingMovies.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTrendingMovies.fulfilled, (state, action) => {
        state.loading = false;
        state.trendingMovies = action.payload;
      })
      .addCase(fetchTrendingMovies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
    builder
      .addCase(fetchTrendingTv.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTrendingTv.fulfilled, (state, action) => {
        state.loading = false;
        state.trendingTv = action.payload;
      })
      .addCase(fetchTrendingTv.rejected, (state, action) => {
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
  },
});

export default dataSlice.reducer;
