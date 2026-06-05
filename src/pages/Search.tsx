import { FC, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";

import PageLayout from "@/components/layout/PageLayout";
import SearchResults from "@/components/common/SearchResults";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchSearch } from "@/redux/search/searchSlice";

const Search: FC = () => {
  const searchData = useSelector((state: RootState) => state.search);
  const dispatch = useDispatch<AppDispatch>();

  const [searchParams] = useSearchParams();
  const query = searchParams.get("search");

  useEffect(() => {
    if (query) {
      dispatch(fetchSearch({ query }));
    }
  }, [query, dispatch]);

  return (
    <PageLayout loading={false}>
      {query ? (
        <SearchResults data={searchData} />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 h-[calc(100vh-12rem)]">
          <Heading as="h1">Search</Heading>
          <Text className="text-lg text-gray">
            Find movies and TV shows using the search bar above.
          </Text>
        </div>
      )}
    </PageLayout>
  );
};
export default Search;
