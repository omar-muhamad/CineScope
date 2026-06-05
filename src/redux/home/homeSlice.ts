import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";


type HomeData = {
  id: number;
  media_type: string;
  backdrop_path: string;
  release_date: string;
  first_air_date: string;
  adult: boolean;
  title: string;
  name: string;
};

interface DataState {
  loading: boolean;
  trending: HomeData[];
  recommendations?: HomeData[];
  error: string | undefined;
}

const initialState: DataState = {
  loading: false,
  trending: [],
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
        { params }
      );
      return response.data.results;
    } catch (err) {
      return err;
    }
  }
);

export const fetchRecommendations = createAsyncThunk(
  "data/fetchRecommendations",
  async ({ id, media_type }: { id: string ; media_type: string | undefined}) => {
    try {
      const params = {
        api_key: import.meta.env.VITE_APP_API_KEY,
      };
      const response = await axios.get(
        `https://api.themoviedb.org/3/${media_type}/${id}/recommendations`,
        { params }
      );
      return response.data.results;
    } catch (err) {
      return err;
    }
  }
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
