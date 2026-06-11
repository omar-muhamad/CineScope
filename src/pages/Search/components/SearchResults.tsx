import { FC } from "react";

import type { MediaSummary } from "@/types";
import ItemCard from "@/components/ui/ItemCard";
import GridLayout from "@/components/layout/GridLayout";
import Heading from "@/components/ui/Heading";
import SkeletonGrid from "@/components/skeletons/SkeletonGrid";
import Text from "@/components/ui/Text";
import ReactPagination from "@/components/common/ReactPagination";

type SearchResultsProps = {
  results: MediaSummary[];
  totalPages: number;
  page: number;
  loading: boolean;
  onPageChange: (event: { selected: number }) => void;
};

const SearchResults: FC<SearchResultsProps> = ({
  results,
  totalPages,
  page,
  loading,
  onPageChange,
}) => {
  const pageCount = totalPages > 100 ? 100 : totalPages;

  // Keep the API's relevance order (closest match first) and only drop the
  // "person" entries that /search/multi mixes in, since we only show titles.
  const items = results?.filter(
    (item) => item.media_type === "movie" || item.media_type === "tv",
  );

  return (
    <div>
      {loading ? (
        <div>
          <Heading as="h1" className="text-orange font-bold max-md:text-xl">
            Search Results
          </Heading>
          <SkeletonGrid count={14} />
        </div>
      ) : (
        <div>
          <Heading as="h1" className="text-orange font-bold max-md:text-xl">
            Search Results
          </Heading>
          {items && items.length !== 0 ? (
            <GridLayout>
              {items.map((item) => {
                const isMovie = item.media_type === "movie";
                return (
                  <ItemCard
                    key={`${item.media_type}-${item.id}`}
                    id={item.id}
                    imgSrc={item.poster_path}
                    releaseDate={(isMovie
                      ? item.release_date
                      : item.first_air_date
                    )?.substring(0, 4)}
                    media_type={item.media_type}
                    rating={item.vote_average}
                    title={isMovie ? item.title : item.name}
                  />
                );
              })}
            </GridLayout>
          ) : (
            <Text className="text-lg py-2 text-center text-orange">
              No results match your search
            </Text>
          )}
          <div className="pr-6 md:pr-0">
            <ReactPagination
              pageCount={pageCount}
              handlePageClick={onPageChange}
              page={page}
            />
          </div>
        </div>
      )}
    </div>
  );
};
export default SearchResults;
