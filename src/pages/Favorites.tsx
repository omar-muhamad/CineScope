import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import SavedMediaPage from "@/components/common/SavedMediaPage";
import { fetchFavoritesList } from "@/redux/bookmarked/bookmarkSlice";
import { AppDispatch, RootState } from "@/redux/store";

const Favorites = () => {
  const { favoritesLoading, favorites } = useSelector(
    (state: RootState) => state.bookmark,
  );
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(fetchFavoritesList());
  }, [dispatch]);

  return (
    <SavedMediaPage
      label="Favorites"
      items={favorites}
      loading={favoritesLoading}
    />
  );
};

export default Favorites;
