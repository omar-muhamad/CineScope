import { FC, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import PageLayout from "@/components/layout/PageLayout";
import SearchResults from "@/components/common/SearchResults";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import { useSearch } from "@/queries/useSearch";

const Search: FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("search") ?? "";
  const [page, setPage] = useState(1);

  // A new search term starts over at page 1.
  useEffect(() => {
    setPage(1);
  }, [query]);

  const { data, isLoading } = useSearch(query, page);

  return (
    <PageLayout loading={false}>
      {query ? (
        <SearchResults
          results={data?.results ?? []}
          totalPages={data?.total_pages ?? 0}
          page={page}
          loading={isLoading}
          onPageChange={({ selected }) => setPage(selected + 1)}
        />
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
