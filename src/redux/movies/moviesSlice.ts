import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

export type MovieData = {
  id: number;
  media_type: string;
  backdrop_path: string;
  release_date: string;
  first_air_date: string;
  adult: boolean;
  title: string;
  name: string;
};

type moviesData = {
  page: number;
  results: MovieData[];
  total_pages: number;
};

interface MovieState {
  loading: boolean;
  movies: moviesData;
  error: string | undefined;
}

const initialState: MovieState = {
  loading: false,
  movies: {
    page: 0,
    results: [],
    total_pages: 0,
  },
  error: undefined,
};

export const fetchMovies = createAsyncThunk("movies/fetchMovies", async () => {
  try {
    const params = {
      api_key: import.meta.env.VITE_APP_API_KEY,
    };
    const response = await axios.get(
      "https://api.themoviedb.org/3/movie/popular",
      { params }
    );

    const { page, results, total_pages } = response.data;
    const data = { page, results, total_pages };
    return data;
  } catch (err) {
    return err;
  }
});

export const moviesPagination = createAsyncThunk(
  "movies/moviesPagination",
  async ({ currentPage }: { currentPage: number }) => {
    try {
      const params = {
        api_key: import.meta.env.VITE_APP_API_KEY,
        page: currentPage,
      };
      const response = await axios.get(
        "https://api.themoviedb.org/3/movie/popular",
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

export const moviesSlice = createSlice({
  name: "movies",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMovies.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMovies.fulfilled, (state, action) => {
        state.loading = false;
        state.movies = action.payload as moviesData;
      })
      .addCase(fetchMovies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
    builder
      .addCase(moviesPagination.pending, (state) => {
        state.loading = true;
      })
      .addCase(moviesPagination.fulfilled, (state, action) => {
        state.loading = false;
        state.movies = action.payload as moviesData;
      })
      .addCase(moviesPagination.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default moviesSlice.reducer;
