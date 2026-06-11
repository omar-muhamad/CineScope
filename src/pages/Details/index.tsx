import { FC } from "react";
import { useParams } from "react-router-dom";

import {
  useDetails,
  useRecommendations,
  useSimilar,
} from "@/queries/useDetails";
import { useImdbRating } from "./queries/useImdbRating";
import DetailsHeader from "./components/DetailsHeader";
import CastList from "./components/CastList";
import SkeletonCastList from "./components/SkeletonCastList";
import MediaScrollSection from "./components/MediaScrollSection";
import Heading from "@/components/ui/Heading";
import SkeletonDetailsHeader from "./components/SkeletonDetailsHeader";
import { getCertification } from "./lib/ratings";
import { getTrailerKey } from "./lib/trailers";

const Details: FC = () => {
  const { media_type, id } = useParams();

  const { data: details, isLoading: loading } = useDetails(media_type, id);

  const imdbId = details?.external_ids?.imdb_id ?? details?.imdb_id ?? null;
  const { data: imdbRating } = useImdbRating(imdbId);

  const pageMediaType = media_type === "movie" ? "movie" : "tv";

  const { data: recommendations, isLoading: recommendationsLoading } =
    useRecommendations(media_type, details?.id, Boolean(details));

  const { data: similar, isLoading: similarLoading } = useSimilar(
    media_type,
    details?.id,
    Boolean(details),
  );

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
      {(loading || (details?.credits?.cast?.length ?? 0) > 0) && (
        <section className="px-4 md:px-16 mt-6 md:mt-10">
          <Heading as="h2" className="text-orange font-bold max-md:text-xl">
            Top Billed Cast
          </Heading>
          {loading ? (
            <SkeletonCastList />
          ) : (
            <CastList cast={details?.credits?.cast ?? []} />
          )}
        </section>
      )}
      <MediaScrollSection
        title="Recommendations"
        items={recommendations}
        mediaType={pageMediaType}
        isLoading={loading || recommendationsLoading}
      />
      <MediaScrollSection
        title="More Like This"
        items={similar}
        mediaType={pageMediaType}
        isLoading={loading || similarLoading}
      />
    </main>
  );
};

export default Details;
