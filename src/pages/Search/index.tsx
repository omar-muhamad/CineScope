import { FC, useState, useTransition } from "react";
import { useSearchParams } from "react-router-dom";

import PageLayout from "@/components/layout/PageLayout";
import QueryBoundary from "@/components/common/QueryBoundary";
import MediaFilters from "@/components/common/MediaFilters";
import SearchResults from "./components/SearchResults";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import SkeletonGrid from "@/components/skeletons/SkeletonGrid";
import { useSearch } from "./queries/useSearch";
import {
  filtersFromParams,
  filtersKey,
  paramsWithFilters,
} from "@/lib/filterParams";
import {
  matchesDiscoverFilters,
  sortMediaSummaries,
  type DiscoverFilters,
} from "@/api/tmdb";

type SearchResultsSectionProps = {
  query: string;
  filters: DiscoverFilters;
  page: number;
  onPageChange: (event: { selected: number }) => void;
};

/**
 * Suspends on the search query, then renders the results. The search API
 * accepts no filter or sort params, so the year / rating / genre filters and
 * the asc/desc sort apply to each fetched page locally — other pages may
 * still hold matches, which is why the pagination keeps the server's page
 * count.
 */
const SearchResultsSection: FC<SearchResultsSectionProps> = ({
  query,
  filters,
  page,
  onPageChange,
}) => {
  const { data } = useSearch(query, page);
  const results = sortMediaSummaries(
    (data.results ?? []).filter((item) =>
      matchesDiscoverFilters(item, filters),
    ),
    filters.sort,
  );
  return (
    <SearchResults
      results={results}
      totalPages={data.total_pages ?? 0}
      page={page}
      onPageChange={onPageChange}
    />
  );
};

const Search: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("search") ?? "";
  const filters = filtersFromParams(searchParams);
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  // A new query or filter set starts over at page 1 (covers the search bar,
  // the filter bar, back/forward, and pasted links alike).
  const resetKey = `${query}|${filtersKey(filters)}`;
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setPage(1);
  }

  // Page and filter changes happen inside a transition so the current results
  // stay visible while the next page suspends, instead of flashing the
  // skeleton fallback.
  const onPageChange = ({ selected }: { selected: number }) =>
    startTransition(() => setPage(selected + 1));

  // Replace instead of push so every tweak doesn't pile up in history; the
  // `search` param itself is preserved by paramsWithFilters.
  const onFiltersChange = (next: DiscoverFilters) =>
    startTransition(() =>
      setSearchParams(paramsWithFilters(searchParams, next), {
        replace: true,
      }),
    );

  return (
    <PageLayout>
      {query ? (
        <>
          <Heading as="h1" className="text-orange font-bold max-md:text-xl">
            Search Results
          </Heading>
          <MediaFilters
            mediaType="all"
            filters={filters}
            onChange={onFiltersChange}
          />
          <div
            className={isPending ? "opacity-60 transition-opacity" : undefined}
          >
            {/* resetKeys must be stable primitives — `filters` is a fresh
                object every render, which would reset an errored section in
                a loop. */}
            <QueryBoundary
              fallback={<SkeletonGrid count={14} />}
              resetKeys={[resetKey]}
            >
              <SearchResultsSection
                query={query}
                filters={filters}
                page={page}
                onPageChange={onPageChange}
              />
            </QueryBoundary>
          </div>
        </>
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
