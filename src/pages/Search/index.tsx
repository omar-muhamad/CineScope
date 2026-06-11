import { FC, useEffect, useState, useTransition } from "react";
import { useSearchParams } from "react-router-dom";

import PageLayout from "@/components/layout/PageLayout";
import QueryBoundary from "@/components/common/QueryBoundary";
import SearchResults from "./components/SearchResults";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import SkeletonGrid from "@/components/skeletons/SkeletonGrid";
import { useSearch } from "./queries/useSearch";

type SearchResultsSectionProps = {
  query: string;
  page: number;
  onPageChange: (event: { selected: number }) => void;
};

/** Suspends on the search query, then renders the results. */
const SearchResultsSection: FC<SearchResultsSectionProps> = ({
  query,
  page,
  onPageChange,
}) => {
  const { data } = useSearch(query, page);
  return (
    <SearchResults
      results={data.results ?? []}
      totalPages={data.total_pages ?? 0}
      page={page}
      onPageChange={onPageChange}
    />
  );
};

const SearchResultsFallback: FC = () => (
  <div>
    <Heading as="h1" className="text-orange font-bold max-md:text-xl">
      Search Results
    </Heading>
    <SkeletonGrid count={14} />
  </div>
);

const Search: FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("search") ?? "";
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  // A new search term starts over at page 1.
  useEffect(() => {
    // Intentional reset-on-query-change; react-hooks 7's set-state-in-effect
    // rule flags this pattern, but resetting here is the desired behavior.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [query]);

  // Page through inside a transition so the current results stay visible while
  // the next page suspends, instead of flashing the skeleton fallback.
  const onPageChange = ({ selected }: { selected: number }) =>
    startTransition(() => setPage(selected + 1));

  return (
    <PageLayout>
      {query ? (
        <div
          className={isPending ? "opacity-60 transition-opacity" : undefined}
        >
          <QueryBoundary
            fallback={<SearchResultsFallback />}
            resetKeys={[query]}
          >
            <SearchResultsSection
              query={query}
              page={page}
              onPageChange={onPageChange}
            />
          </QueryBoundary>
        </div>
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
