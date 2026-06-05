import { FC, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import { AppDispatch, RootState } from "@/redux/store";
import { fetchDetails } from "@/redux/details/detailsSlice";
import DetailsHeader from "@/components/details/DetailsHeader";
import GridLayout from "@/components/layout/GridLayout";
import { fetchRecommendations } from "@/redux/home/homeSlice";
import ItemCard from "@/components/ui/ItemCard";
import Heading from "@/components/ui/Heading";
import Loading from "@/components/common/Loading";

const Details: FC = () => {
  const data = useSelector((state: RootState) => state.details);
  const dispatch = useDispatch<AppDispatch>();

  const { loading, details, recommendations } = data;
  const { media_type, id } = useParams();

  useEffect(() => {
    dispatch(fetchDetails({ media_type, id })).then((data) => {
      if (data.meta.requestStatus === "fulfilled") {
        const detailsData = data.payload;
        const { id } = detailsData;
        dispatch(fetchRecommendations({ id, media_type }));
      }
    });
  }, [dispatch, id, media_type]);

  return (
    <main className="w-full md:w-[calc(100%-8rem)] pb-6 md:ml-32 md:pl-0">
      {loading ? (
        <Loading />
      ) : (
        <>
          <div>
            {!loading && details ? (
              <DetailsHeader
                id={details.id}
                posterUrl={details.poster_path}
                title={media_type === "movie" ? details.title : details.name}
                imageSrc={details.backdrop_path}
                release_date={
                  media_type === "movie"
                    ? details.release_date?.substring(0, 4)
                    : details.first_air_date?.substring(0, 4)
                }
                media_type={media_type === "movie" ? "movie" : "tv"}
                genres={details.genres}
                rating={details.vote_average}
                overview={details.overview}
              />
            ) : null}
          </div>
          <section className="pl-6 md:pl-0">
            <Heading as="h2">Recommendations</Heading>
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
                        media_type={movie ? "movie" : "tv"}
                        ratings={item.adult ? "18+" : "PG"}
                        title={movie ? item.title : item.name}
                      />
                    );
                  })
                : null}
            </GridLayout>
          </section>
        </>
      )}
    </main>
  );
};

export default Details;
