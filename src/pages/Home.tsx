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
import TrendingWrapper from "@/components/home/TrendingWrapper";
import TrendingCard from "@/components/home/TrendingCard";
import Heading from "@/components/ui/Heading";

// Two rows of cards at the widest grid layout (5 columns).
const TWO_ROWS = 10;

const Home: FC = () => {
  const data = useSelector((state: RootState) => state.home);
  const dispatch = useDispatch<AppDispatch>();

  const { loading, trending, trendingMovies, trendingTv } = data;
  const trendingData = trending?.slice(0, 5);
  const movies = trendingMovies?.slice(0, TWO_ROWS);
  const tvShows = trendingTv?.slice(0, TWO_ROWS);

  useEffect(() => {
    dispatch(fetchTrending());
    dispatch(fetchTrendingMovies());
    dispatch(fetchTrendingTv());
  }, [dispatch]);

  return (
    <PageLayout loading={loading}>
      <Heading as="h1" className="mt-6">
        Trending
      </Heading>
      <TrendingWrapper>
        {!data.loading && trending && trending.length !== 0
          ? [...(trendingData || []), ...(trendingData || [])].map(
              (item, index: number) => {
                const movie = item.media_type === "movie";
                return (
                  <TrendingCard
                    key={item.id + index}
                    id={item.id}
                    imgSrc={item.backdrop_path}
                    releaseDate={
                      movie
                        ? item.release_date?.substring(0, 4)
                        : item.first_air_date?.substring(0, 4)
                    }
                    media_type={movie ? item.media_type : "tv"}
                    ratings={item.adult ? "18+" : "PG"}
                    title={movie ? item.title : item.name}
                  />
                );
              },
            )
          : null}
      </TrendingWrapper>

      <section className="w-full">
        <Heading as="h2" className="mt-6">
          Trending Movies
        </Heading>
        <GridLayout>
          {!loading && movies && movies.length !== 0
            ? movies.map((item) => (
                <ItemCard
                  key={item.id}
                  id={item.id}
                  imgSrc={item.backdrop_path}
                  releaseDate={item.release_date?.substring(0, 4)}
                  media_type="movie"
                  ratings={item.adult ? "18+" : "PG"}
                  title={item.title}
                />
              ))
            : null}
        </GridLayout>
      </section>

      <section className="w-full">
        <Heading as="h2" className="mt-6">
          Trending TV Shows
        </Heading>
        <GridLayout>
          {!loading && tvShows && tvShows.length !== 0
            ? tvShows.map((item) => (
                <ItemCard
                  key={item.id}
                  id={item.id}
                  imgSrc={item.backdrop_path}
                  releaseDate={item.first_air_date?.substring(0, 4)}
                  media_type="tv"
                  ratings={item.adult ? "18+" : "PG"}
                  title={item.name}
                />
              ))
            : null}
        </GridLayout>
      </section>
    </PageLayout>
  );
};
export default Home;
