
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

type TvData = {
  id: number;
  media_type: string;
  backdrop_path: string;
  release_date: string;
  first_air_date: string;
  adult: boolean;
  title: string;
  name: string;
};

type TvShowsData = {
  page: number;
  results: TvData[];
  total_pages: number;
};

interface DataState {
  loading: boolean;
  tv: TvShowsData;
  error: string | undefined;
}

const initialState: DataState = {
  loading: false,
  tv: {
    page: 0,
    results: [],
    total_pages: 0,
  },
  error: undefined,
};

export const fetchTv = createAsyncThunk("tv/fetchTv", async () => {
  try {
    const params = {
      api_key: import.meta.env.VITE_APP_API_KEY,
    };
    const response = await axios.get(
      "https://api.themoviedb.org/3/tv/popular",
      { params }
    );
    const { page, results, total_pages } = response.data;
    const data = { page, results, total_pages };
    return data;
  } catch (err) {
    return err;
  }
});

export const tvPagination = createAsyncThunk(
  "movies/moviesPagination",
  async ({ currentPage }: { currentPage: number }) => {
    try {
      const params = {
        api_key: import.meta.env.VITE_APP_API_KEY,
        page: currentPage,
      };
      const response = await axios.get(
        "https://api.themoviedb.org/3/tv/popular",
        { params }
      );
      const { page, results, total_pages } = response.data;
      const data = { page, results, total_pages };
      return data;
    } catch (err) {
      return err;
    }
  }
);

export const tvSlice = createSlice({
  name: "tv",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTv.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTv.fulfilled, (state, action) => {
        state.loading = false;
        state.tv = action.payload as TvShowsData;
      })
      .addCase(fetchTv.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
      builder
      .addCase(tvPagination.pending, (state) => {
        state.loading = true;
      })
      .addCase(tvPagination.fulfilled, (state, action) => {
        state.loading = false;
        state.tv = action.payload as TvShowsData;
      })
      .addCase(tvPagination.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default tvSlice.reducer;
