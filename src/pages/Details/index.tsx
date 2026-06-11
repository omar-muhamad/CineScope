import { FC } from "react";
import { useParams } from "react-router-dom";

import { useDetails } from "@/queries/useDetails";
import { useImdbRating } from "./queries/useImdbRating";
import DetailsHeader from "./components/DetailsHeader";
import CastList from "./components/CastList";
import SkeletonCastList from "./components/SkeletonCastList";
import SkeletonDetailsHeader from "./components/SkeletonDetailsHeader";
import QueryBoundary from "@/components/common/QueryBoundary";
import MediaRowSkeleton from "@/components/common/MediaRowSkeleton";
import {
  RecommendationsRow,
  SimilarRow,
} from "@/components/common/MediaRowSections";
import Heading from "@/components/ui/Heading";
import { getCertification } from "./lib/ratings";
import { getTrailerKey } from "./lib/trailers";

type SectionProps = {
  mediaType: string | undefined;
  id: string | undefined;
};

/** Hero header + Top Billed Cast. Suspends on the details query. */
const DetailsHeaderSection: FC<SectionProps> = ({ mediaType, id }) => {
  const { data: details } = useDetails(mediaType, id);

  // Progressive enhancement — non-blocking useQuery against the flaky OMDb API.
  const imdbId = details.external_ids?.imdb_id ?? details.imdb_id ?? null;
  const { data: imdbRating } = useImdbRating(imdbId);

  const cast = details.credits?.cast ?? [];

  return (
    <>
      <DetailsHeader
        id={details.id}
        posterUrl={details.poster_path}
        title={mediaType === "movie" ? details.title : details.name}
        imageSrc={details.backdrop_path}
        release_date={
          mediaType === "movie"
            ? details.release_date?.substring(0, 4)
            : details.first_air_date?.substring(0, 4)
        }
        media_type={mediaType === "movie" ? "movie" : "tv"}
        genres={details.genres}
        rating={details.vote_average}
        imdbRating={imdbRating}
        certification={getCertification(details, mediaType)}
        trailerKey={getTrailerKey(details)}
        overview={details.overview}
      />
      {cast.length > 0 && (
        <section className="px-4 md:px-16 mt-6 md:mt-10">
          <Heading as="h2" className="text-orange font-bold max-md:text-xl">
            Top Billed Cast
          </Heading>
          <CastList cast={cast} />
        </section>
      )}
    </>
  );
};

const DetailsHeaderFallback: FC = () => (
  <>
    <SkeletonDetailsHeader />
    <section className="px-4 md:px-16 mt-6 md:mt-10">
      <Heading as="h2" className="text-orange font-bold max-md:text-xl">
        Top Billed Cast
      </Heading>
      <SkeletonCastList />
    </section>
  </>
);

const Details: FC = () => {
  const { media_type, id } = useParams();
  const pageMediaType = media_type === "movie" ? "movie" : "tv";
  const resetKeys = [media_type, id];

  return (
    <main className="w-full pb-6">
      <QueryBoundary fallback={<DetailsHeaderFallback />} resetKeys={resetKeys}>
        <DetailsHeaderSection mediaType={media_type} id={id} />
      </QueryBoundary>

      <QueryBoundary
        fallback={<MediaRowSkeleton title="Recommendations" />}
        resetKeys={resetKeys}
      >
        <RecommendationsRow mediaType={pageMediaType} id={id} />
      </QueryBoundary>

      <QueryBoundary
        fallback={<MediaRowSkeleton title="More Like This" />}
        resetKeys={resetKeys}
      >
        <SimilarRow mediaType={pageMediaType} id={id} />
      </QueryBoundary>
    </main>
  );
};

export default Details;
