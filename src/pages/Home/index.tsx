import { FC } from "react";

import PageLayout from "@/components/layout/PageLayout";
import GridLayout from "@/components/layout/GridLayout";
import ItemCard from "@/components/ui/ItemCard";
import { useTrending } from "./queries/useTrending";
import TrendingCarousel from "./components/TrendingCarousel";
import TrendingCard from "./components/TrendingCard";
import Heading from "@/components/ui/Heading";
import Skeleton from "@/components/skeletons/Skeleton";
import SkeletonGrid from "@/components/skeletons/SkeletonGrid";
import SkeletonTrendingCard from "./components/SkeletonTrendingCard";

// Two rows of cards at the widest grid layout (7 columns at 2xl).
const TWO_ROWS = 14;

const Home: FC = () => {
  const trendingQuery = useTrending("all");
  const moviesQuery = useTrending("movie");
  const tvQuery = useTrending("tv");

  const loading =
    trendingQuery.isLoading || moviesQuery.isLoading || tvQuery.isLoading;
  const trending = trendingQuery.data;
  const trendingData = trending?.slice(0, 15);
  const movies = moviesQuery.data?.slice(0, TWO_ROWS);
  const tvShows = tvQuery.data?.slice(0, TWO_ROWS);

  return (
    <div className="">
      <TrendingCarousel>
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <SkeletonTrendingCard key={i} />
            ))
          : !loading && trending && trending.length !== 0
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
              <Skeleton className="h-8 w-56 rounded-sm" />
              <SkeletonGrid count={14} />
            </section>
            <section className="w-full">
              <Skeleton className="h-8 w-56 rounded-sm mt-14" />
              <SkeletonGrid count={14} />
            </section>
          </>
        }
      >
        <section className="w-full mt-6 md:mt-10">
          <Heading as="h2" className="text-orange font-bold max-md:text-xl">
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

        <section className="w-full mt-6 md:mt-10">
          <Heading as="h2" className="text-orange font-bold max-md:text-xl">
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
