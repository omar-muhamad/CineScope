import { FC } from "react";
import { useParams } from "react-router-dom";

import { useDetails, useRecommendations } from "@/queries/useDetails";
import { useImdbRating } from "./queries/useImdbRating";
import DetailsHeader from "./components/DetailsHeader";
import GridLayout from "@/components/layout/GridLayout";
import ItemCard from "@/components/ui/ItemCard";
import Heading from "@/components/ui/Heading";
import SkeletonDetailsHeader from "./components/SkeletonDetailsHeader";
import SkeletonGrid from "@/components/skeletons/SkeletonGrid";
import { getCertification } from "./lib/ratings";
import { getTrailerKey } from "./lib/trailers";

const Details: FC = () => {
  const { media_type, id } = useParams();

  const { data: details, isLoading: loading } = useDetails(media_type, id);

  const imdbId = details?.external_ids?.imdb_id ?? details?.imdb_id ?? null;
  const { data: imdbRating } = useImdbRating(imdbId);

  const { data: recommendations, isLoading: recommendationsLoading } =
    useRecommendations(media_type, details?.id, Boolean(details));

  return (
    <main className="w-full pb-6">
      <div>
        {loading ? (
          <SkeletonDetailsHeader />
        ) : details ? (
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
            imdbRating={imdbRating}
            certification={getCertification(details, media_type)}
            trailerKey={getTrailerKey(details)}
            overview={details.overview}
          />
        ) : null}
      </div>
      <section className="px-4 md:px-16 mt-6 md:mt-10">
        <Heading as="h2" className="text-orange font-bold max-md:text-xl">
          Recommendations
        </Heading>
        {loading || recommendationsLoading ? (
          <SkeletonGrid count={14} />
        ) : (
          <GridLayout>
            {recommendations && recommendations.length !== 0
              ? recommendations.map((item) => {
                  const movie = item.media_type === "movie";
                  return (
                    <ItemCard
                      key={item.id}
                      id={item.id}
                      imgSrc={item.poster_path}
                      releaseDate={
                        movie
                          ? item.release_date?.substring(0, 4)
                          : item.first_air_date?.substring(0, 4)
                      }
                      media_type={movie ? "movie" : "tv"}
                      rating={item.vote_average}
                      title={movie ? item.title : item.name}
                    />
                  );
                })
              : null}
          </GridLayout>
        )}
      </section>
    </main>
  );
};

export default Details;
