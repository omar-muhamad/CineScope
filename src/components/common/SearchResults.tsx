import { FC } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";

import {
  DataState,
  SearchResult,
  searchPagination,
} from "@/redux/search/searchSlice";
import ItemCard from "../ui/ItemCard";
import GridLayout from "../layout/GridLayout";
import Heading from "../ui/Heading";
import SkeletonGrid from "../skeletons/SkeletonGrid";
import { AppDispatch } from "@/redux/store";
import Text from "../ui/Text";
import ReactPagination from "./ReactPagination";

type SearchResultsProps = {
  data: DataState;
};

const SearchResults: FC<SearchResultsProps> = ({ data }) => {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  const query = searchParams.get("search");
  const { loading, searchData } = data;
  const { page, total_pages, results } = searchData;

  const pageCount = total_pages > 100 ? 100 : total_pages;

  // Keep the API's relevance order (closest match first) and only drop the
  // "person" entries that /search/multi mixes in, since we only show titles.
  const items = results?.filter(
    (item: SearchResult) =>
      item.media_type === "movie" || item.media_type === "tv",
  );

  const handlePageClick = async (event: { selected: number }) => {
    await dispatch(
      searchPagination({ currentPage: event.selected + 1, query }),
    );
  };

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
              {items.map((item: SearchResult) => {
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
              handlePageClick={handlePageClick}
              page={page}
            />
          </div>
        </div>
      )}
    </div>
  );
};
export default SearchResults;
