import { useDispatch, useSelector } from "react-redux";
import { FC, useEffect } from "react";

import PageLayout from "@/components/layout/PageLayout";
import GridLayout from "@/components/layout/GridLayout";
import ItemCard from "@/components/ui/ItemCard";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchRecommendations, fetchTrending } from "@/redux/home/homeSlice";
import TrendingWrapper from "@/components/home/TrendingWrapper";
import TrendingCard from "@/components/home/TrendingCard";
import Heading from "@/components/ui/Heading";

const Home: FC = () => {
  const data = useSelector((state: RootState) => state.home);
  const dispatch = useDispatch<AppDispatch>();

  const { loading, trending, recommendations } = data;
  const trendingData = trending?.slice(0, 5);

  useEffect(() => {
    dispatch(fetchTrending()).then((data) => {
      if (data.meta.requestStatus === "fulfilled") {
        const trendingData = data.payload;
        const { id, media_type } = trendingData[0];
        dispatch(fetchRecommendations({ id, media_type }));
      }
    });
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
              }
            )
          : null}
      </TrendingWrapper>

      <section className="w-full">
        <Heading as="h2" className="mt-6">
          Recommendations
        </Heading>
        <GridLayout>
          {!loading && recommendations && recommendations.length !== 0
            ? recommendations.map((item) => {
                const movie = item.media_type === "movie";
                return (
                  <ItemCard
                    key={item.id}
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
              })
            : null}
        </GridLayout>
      </section>
    </PageLayout>
  );
};
export default Home;
