import { useDispatch, useSelector } from "react-redux";
import { FC, useEffect } from "react";

import PageLayout from "@/components/layout/PageLayout";
import GridLayout from "@/components/layout/GridLayout";
import ItemCard from "@/components/ui/ItemCard";
import { AppDispatch, RootState } from "@/redux/store";
import {
  fetchTrending,
  fetchTrendingMovies,
  fetchTrendingTv,
} from "@/redux/home/homeSlice";
import TrendingCarousel from "@/components/home/TrendingCarousel";
import TrendingCard from "@/components/home/TrendingCard";
import Heading from "@/components/ui/Heading";
import Skeleton from "@/components/skeletons/Skeleton";
import SkeletonGrid from "@/components/skeletons/SkeletonGrid";
import SkeletonTrendingCard from "@/components/skeletons/SkeletonTrendingCard";

// Two rows of cards at the widest grid layout (7 columns at 2xl).

const Home: FC = () => {
  const data = useSelector((state: RootState) => state.home);
  const dispatch = useDispatch<AppDispatch>();

  const { loading, trending, trendingMovies, trendingTv } = data;
  const trendingData = trending?.slice(0, 15);
  const movies = trendingMovies?.slice(0, TWO_ROWS);
  const tvShows = trendingTv?.slice(0, TWO_ROWS);

  useEffect(() => {
    dispatch(fetchTrending());
    dispatch(fetchTrendingMovies());
    dispatch(fetchTrendingTv());
  }, [dispatch]);

  return (
    <div className="">
      <TrendingCarousel>
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <SkeletonTrendingCard key={i} />
            ))
          : !data.loading && trending && trending.length !== 0
            ? trendingData?.map((item) => {
                const movie = item.media_type === "movie";
                return (
                  <TrendingCard
                    key={item.id}
                    id={item.id}
                    imgSrc={item.poster_path}
                    releaseDate={
                      movie
                        ? item.release_date?.substring(0, 4)
                        : item.first_air_date?.substring(0, 4)
                    }
                    media_type={movie ? item.media_type : "tv"}
                    rating={item.vote_average}
                    title={movie ? item.title : item.name}
                  />
                );
              })
            : null}
      </TrendingCarousel>
      <PageLayout
        loading={loading}
        skeleton={
          <>
            <section className="w-full mt-10">
              <Skeleton className="h-8 w-56 rounded" />
              <SkeletonGrid count={14} />
            </section>
            <section className="w-full">
              <Skeleton className="h-8 w-56 rounded mt-14" />
              <SkeletonGrid count={14} />
            </section>
          </>
        }
      >
        <section className="w-full mt-10">
          <Heading as="h2" className="text-orange font-bold">
            Trending Movies
          </Heading>
          <GridLayout>
            {!loading && movies && movies.length !== 0
              ? movies.map((item) => (
                  <ItemCard
                    key={item.id}
                    id={item.id}
                    imgSrc={item.poster_path}
                    releaseDate={item.release_date?.substring(0, 4)}
                    media_type="movie"
                    rating={item.vote_average}
                    title={item.title}
                  />
                ))
              : null}
          </GridLayout>
        </section>

        <section className="w-full">
          <Heading as="h2" className="mt-14 text-orange font-bold">
            Trending TV Shows
          </Heading>
          <GridLayout>
            {!loading && tvShows && tvShows.length !== 0
              ? tvShows.map((item) => (
                  <ItemCard
                    key={item.id}
                    id={item.id}
                    imgSrc={item.poster_path}
                    releaseDate={item.first_air_date?.substring(0, 4)}
                    media_type="tv"
                    rating={item.vote_average}
                    title={item.name}
                  />
                ))
              : null}
          </GridLayout>
        </section>
      </PageLayout>
    </div>
  );
};
export default Home;
