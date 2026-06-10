import { FC } from "react";
import { NavLink } from "react-router-dom";

import Text from "../ui/Text";
import SaveActions from "../ui/SaveActions";
import { RiFilmFill } from "react-icons/ri";
import { PiTelevisionSimpleFill } from "react-icons/pi";
import { IoStar } from "react-icons/io5";
import LazyImage from "../ui/LazyImage";
import poster from "@/assets/images/default-poster.png";

type TrendingCardProps = {
  id: number;
  imgSrc: string;
  releaseDate: string;
  media_type: string;
  rating: number;
  title: string;
};

const TrendingCard: FC<TrendingCardProps> = ({
  id,
  imgSrc,
  releaseDate,
  media_type,
  rating,
  title,
}) => {
  const movie = media_type === "movie";
  const imageSrc = imgSrc
    ? `https://image.tmdb.org/t/p/w500/${imgSrc}`
    : poster;

  return (
    <li className="group/card relative shrink-0 w-[42vw] sm:w-[28vw] md:w-[20vw] lg:w-[16vw]">
      <NavLink
        className="relative block"
        to={movie ? `/movie/${id}` : `/tv/${id}`}
      >
        <LazyImage
          className="w-full rounded-lg aspect-[2/3] object-cover"
          src={imageSrc}
          alt={`${title} poster`}
        />

        {/* Gradient + meta overlay for readability over the poster */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 rounded-b-lg bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        <div className="absolute inset-0 p-3 flex flex-col justify-end">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Text size="sm">{releaseDate}</Text>
            <span className="text-xs">•</span>
            <div className="media-type flex items-center gap-1">
              {media_type === "movie" ? (
                <RiFilmFill className="text-sm" />
              ) : (
                <PiTelevisionSimpleFill className="text-sm" />
              )}
              <Text size="sm" className="hidden md:block">
                {media_type}
              </Text>
            </div>
            {rating > 0 && (
              <>
                <span className="text-xs">•</span>
                <div className="flex items-center gap-1">
                  <IoStar className="text-orange text-sm" />
                  <Text size="sm">{rating.toFixed(1)}</Text>
                </div>
              </>
            )}
          </div>
          <h2 className="font-outfitMedium text-base md:text-lg truncate text-ellipsis">
            {title}
          </h2>
        </div>

        <div className="absolute inset-0 rounded-lg opacity-0 hover:opacity-100 hover:duration-300 group-hover/card:opacity-100 bg-[#00000070] backdrop-blur-[2px] flex flex-col gap-3 justify-center items-center">
          <SaveActions id={id} media_type={media_type} />
          <Text size="sm" className="bg-white/70 text-black py-2 px-3 rounded-full">
            See Details
          </Text>
        </div>
      </NavLink>
    </li>
  );
};
export default TrendingCard;
