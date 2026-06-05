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
import Loading from "./Loading";
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


  const currentItems = results
  const pageCount = total_pages > 100 ? 100 : total_pages;

  const movies = currentItems?.filter(
    (item: SearchResult) => item.media_type === "movie"
  );
  const tvShows = currentItems?.filter(
    (item: SearchResult) => item.media_type === "tv"
  );

  const handlePageClick = async (event: { selected: number }) => {
    await dispatch(
      searchPagination({ currentPage: event.selected + 1, query })
    );
  };

  return (
    <div>
      {loading ? (
        <div className="h-[calc(100vh-12rem)]">
          <Loading />
        </div>
      ) : (
        <div>
          <Heading as="h1" className="mt-6">
            Search Results
          </Heading>
          <section>
            <Heading as="h2" className="mt-6">
              Movies
            </Heading>
            {!loading && movies && movies?.length !== 0 ? (
              <GridLayout>
                {movies?.map((movie: SearchResult) => (
                  <ItemCard
                    key={movie.id}
                    id={movie.id}
                    imgSrc={movie.backdrop_path}
                    releaseDate={movie.release_date?.substring(0, 4)}
                    media_type={movie.media_type}
                    ratings={movie.adult ? "18+" : "PG"}
                    title={movie.title}
                  />
                ))}
              </GridLayout>
            ) : (
              <Text className="text-lg py-2 text-center text-orange">
                No movies match your search
              </Text>
            )}
          </section>
          <section>
            <Heading as="h2" className="mt-6">
              TV Shows
            </Heading>
            {!loading && tvShows && tvShows?.length !== 0 ? (
              <GridLayout>
                {tvShows?.map((tvShow: SearchResult) => (
                  <ItemCard
                    key={tvShow.id}
                    id={tvShow.id}
                    imgSrc={tvShow.backdrop_path}
                    releaseDate={tvShow.first_air_date?.substring(0, 4)}
                    media_type="tv"
                    ratings={tvShow.adult ? "18+" : "PG"}
                    title={tvShow.name}
                  />
                ))}
              </GridLayout>
            ) : (
              <Text className="text-lg py-2 text-center text-orange">
                No TV shows match your search
              </Text>
            )}
          </section>
          <div className="pr-6 md:pr-0">
            <ReactPagination pageCount={pageCount} handlePageClick={handlePageClick} page={page}/>
          </div>
        </div>
      )}
    </div>
  );
};
export default SearchResults;
