import SavedMediaPage from "@/components/common/SavedMediaPage";
import { useWatchlist } from "@/queries/useBookmarks";

const WatchLater = () => {
  const { data: watchlist, isLoading } = useWatchlist();

  return (
    <SavedMediaPage
      label="Watch Later"
      items={watchlist ?? null}
      loading={isLoading}
    />
  );
};

export default WatchLater;
