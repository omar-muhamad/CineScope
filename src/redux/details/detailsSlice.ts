import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { fetchRecommendations } from "../home/homeSlice";

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
};

type RecommendationsData = {
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
  loading?: boolean;
  details?: DetailsData;
  recommendations?: RecommendationsData[];
  error: string | undefined;
}

type Param = string | undefined;

const initialState: DataState = {
  loading: false,
  details: undefined,
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
        { params }
      );
      return response.data;
    } catch (err) {
      return err;
    }
  }
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
  },
});

export default detailsSlice.reducer;
