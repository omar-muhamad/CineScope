import { FC, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import PageLayout from "@/components/layout/PageLayout";
import ItemCard from "@/components/ui/ItemCard";
import GridLayout from "@/components/layout/GridLayout";
import Heading from "@/components/ui/Heading";
import { AppDispatch, RootState } from "@/redux/store";
import {
  MovieData,
  fetchMovies,
  moviesPagination,
} from "@/redux/movies/moviesSlice";
import ReactPagination from "@/components/common/ReactPagination";

const Movies: FC = () => {
  const data = useSelector((state: RootState) => state.movies);
  const dispatch = useDispatch<AppDispatch>();

  const { loading, movies } = data;
  const { page, total_pages, results } = movies;

  const currentItems = results
  const pageCount = total_pages > 100 ? 100 : total_pages;

  const handlePageClick = async (event: { selected: number }) => {
    await dispatch(moviesPagination({ currentPage: event.selected + 1 }));
  };

  useEffect(() => {
    dispatch(fetchMovies());
  }, [dispatch]);

  return (
    <PageLayout loading={loading}>
      <Heading as="h1" className="mt-6">
        Popular Movies
      </Heading>
      <GridLayout>
        {!loading && currentItems && currentItems.length !== 0
          ? currentItems.map((movie: MovieData) => (
              <ItemCard
                key={movie.id}
                id={movie.id}
                imgSrc={movie.backdrop_path}
                releaseDate={movie.release_date?.substring(0, 4)}
                media_type="movie"
                ratings={movie.adult ? "18+" : "PG"}
                title={movie.title}
              />
            ))
          : null}
      </GridLayout>
      <div className="pr-6 md:pr-0">
      <ReactPagination pageCount={pageCount} handlePageClick={handlePageClick} page={page}/>
      </div>
    </PageLayout>
  );
};

export default Movies;
