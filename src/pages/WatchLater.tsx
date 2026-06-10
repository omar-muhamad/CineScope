import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import SavedMediaPage from "@/components/common/SavedMediaPage";
import { fetchWatchlistList } from "@/redux/bookmarked/bookmarkSlice";
import { AppDispatch, RootState } from "@/redux/store";

const WatchLater = () => {
  const { watchlistLoading, watchlist } = useSelector(
    (state: RootState) => state.bookmark,
  );
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(fetchWatchlistList());
  }, [dispatch]);

  return (
    <SavedMediaPage
      label="Watch Later"
      items={watchlist}
      loading={watchlistLoading}
      saveKind="watchlist"
    />
  );
};

export default WatchLater;
