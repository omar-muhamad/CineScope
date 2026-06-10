import { FC } from "react";
import { useNavigate } from "react-router-dom";

import PercentageCircle from "../../icons/PercentageCircle";
import BookMark from "../ui/BookMark";
import WatchLater from "../ui/WatchLater";
import Heading from "../ui/Heading";
import LazyImage from "../ui/LazyImage";
import Text from "../ui/Text";
import MediaMeta from "./MediaMeta";
import PlayButton from "./PlayButton";
import TrailerModal from "./TrailerModal";
import { useTrailerModal } from "./useTrailerModal";

type DetailsHeaderProps = {
  id: number;
  title: string;
  rating: number;
  imdbRating?: string | null;
  release_date: string;
  media_type: string;
  imageSrc: string;
  genres: {
    id: number;
    name: string;
  }[];
  posterUrl: string;
  certification?: string;
  trailerKey: string | null;
  overview: string;
};

const DetailsHeader: FC<DetailsHeaderProps> = ({
  id,
  posterUrl,
  title,
  rating,
  imdbRating,
  release_date,
  media_type,
  genres,
  imageSrc,
  certification,
  trailerKey,
  overview,
}) => {
  const navigate = useNavigate();
  const { trailerUrl, isOpen, openTrailer, closeTrailer } =
    useTrailerModal(trailerKey);

  const topGenres = genres?.slice(0, 3) ?? [];

  const handleWatchOnline = () => {
    const validMediaTypes = ["movie", "tv"];
    const isValidId = typeof id === "number" && Number.isInteger(id) && id > 0;
    const isValidMediaType = validMediaTypes.includes(media_type);

    if (!isValidId || !isValidMediaType) {
      console.error(
        "Invalid media type or id provided for watch online navigation.",
      );
      return;
    }

    navigate(`/watch/${media_type}/${id}`);
  };

  return (
    <>
      <section
        style={{
          backgroundImage: `url(https://image.tmdb.org/t/p/w1280/${imageSrc})`,
        }}
        className="w-full md:rounded-bl-2xl bg-cover bg-center md:bg-top bg-no-repeat"
      >
        <div
          data-testid="details-poster-image"
          className="w-full max-md:py-5 px-4 md:px-16 md:py-5  h-full flex gap-4 md:gap-6 backdrop-blur-[3px] md:rounded-bl-2xl bg-black/70"
        >
          <div className="h-full">
            <LazyImage
              className="aspect-[2/3] rounded-md md:rounded-xl bg-secondary-dark object-cover"
              src={`https://image.tmdb.org/t/p/w300/${posterUrl}`}
              alt={`${title} poster`}
            />
          </div>

          <div className="md:mt-5 grow">
            <Heading as="h1" className="md:mt-6">
              {title}
            </Heading>

            <div className="flex gap-2">
              {topGenres.map((genre, i) => (
                <Text key={genre.id}>
                  {genre.name}
                  {i === topGenres.length - 1 ? "" : ","}
                </Text>
              ))}
            </div>

            <MediaMeta
              release_date={release_date}
              media_type={media_type}
              certification={certification}
            />

            <div className="w-fit">
              <div
                data-testid="details-rating"
                className="mt-2 flex items-center gap-2"
              >
                <PercentageCircle rating={rating * 10} />
                {imdbRating && (
                  <PercentageCircle
                    rating={Number(imdbRating) * 10}
                    className="text-[#F5C518]"
                  />
                )}

                <div className="h-10 w-10">
                  <BookMark
                    id={id}
                    media_type={media_type}
                    className="w-full h-full"
                  />
                </div>
                <div className="h-10 w-10">
                  <WatchLater
                    id={id}
                    media_type={media_type}
                    className="w-full h-full"
                  />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <PlayButton className="h-10" onClick={openTrailer}>
                  Trailer
                </PlayButton>
                <PlayButton className="w-full h-10" onClick={handleWatchOnline}>
                  Watch Online
                </PlayButton>
              </div>
            </div>

            <div className="hidden md:block mt-2 max-w-[50vw]">
              <Heading as="h3" size="sm">
                Overview:
              </Heading>
              <Text size="sm" className="text-[#c3c4c7]">
                {overview}
              </Text>
            </div>
          </div>
        </div>
      </section>

      {isOpen && (
        <TrailerModal trailerUrl={trailerUrl} onClose={closeTrailer} />
      )}
    </>
  );
};

export default DetailsHeader;
