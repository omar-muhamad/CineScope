import SavedMediaPage from "@/components/common/SavedMediaPage";
import { useFavorites } from "@/queries/useBookmarks";

const Favorites = () => {
  const { data: favorites, isLoading } = useFavorites();

  return (
    <SavedMediaPage
      label="Favorites"
      items={favorites ?? null}
      loading={isLoading}
    />
  );
};

export default Favorites;
