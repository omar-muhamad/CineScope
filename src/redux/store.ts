import { configureStore } from "@reduxjs/toolkit";
import homeSlice from "./home/homeSlice";
import moviesSlice from "./movies/moviesSlice";
import tvSlice from "./tv/tvSlice";
import detailsSlice from "./details/detailsSlice";
import searchSlice from "./search/searchSlice";
import userSlice from "./user/userSlice";
import bookmarkSlice from "./bookmarked/bookmarkSlice";

export const store = configureStore({
  reducer: {
    user: userSlice,
    home: homeSlice,
    movies: moviesSlice,
    tv: tvSlice,
    details: detailsSlice,
    search: searchSlice,
    bookmark: bookmarkSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
