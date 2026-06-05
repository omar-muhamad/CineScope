import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

export type SearchResult = {
  id: number;
  media_type: string;
  backdrop_path: string;
  release_date: string;
  first_air_date: string;
  adult: boolean;
  title: string;
  name: string;
};

export type SearchData = {
  page: number;
  results: SearchResult[];
  total_pages: number;
};

export interface DataState {
  loading: boolean;
  searchData: SearchData;
  error: string | undefined;
}

const initialState: DataState = {
  loading: false,
  searchData: {
    page: 0,
    results: [],
    total_pages: 0,
  },
  error: undefined,
};

export const fetchSearch = createAsyncThunk(
  "data/fetchSearch",
  async ({ query }: { query: string }) => {
    try {
      const params = {
        api_key: import.meta.env.VITE_APP_API_KEY,
        query,
      };
      const response = await axios.get(
        `https://api.themoviedb.org/3/search/multi`,
        { params }
      );
      const { page, results, total_pages } = response.data;
      const data = { page, results, total_pages };
      return data;
    } catch (error) {
      return error;
    }
  }
);

export const searchPagination = createAsyncThunk(
  "data/searchPagination",
  async ({
    currentPage,
    query,
  }: {
    currentPage: number;
    query: string | null;
  }) => {
    try {
      const params = {
        api_key: import.meta.env.VITE_APP_API_KEY,
        page: currentPage,
        query,
      };
      const response = await axios.get(
        `https://api.themoviedb.org/3/search/multi`,
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

export const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSearch.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSearch.fulfilled, (state, action) => {
        state.loading = false;
        state.searchData = action.payload as SearchData;
      })
      .addCase(fetchSearch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
    builder
      .addCase(searchPagination.pending, (state) => {
        state.loading = true;
      })
      .addCase(searchPagination.fulfilled, (state, action) => {
        state.loading = false;
        state.searchData = action.payload as SearchData;
      })
      .addCase(searchPagination.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default searchSlice.reducer;
