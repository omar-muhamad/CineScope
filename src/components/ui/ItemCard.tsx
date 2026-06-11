import { FC } from "react";
import { NavLink } from "react-router-dom";
import { RiFilmFill } from "react-icons/ri";
import { PiTelevisionSimpleFill } from "react-icons/pi";
import { IoStar } from "react-icons/io5";
import poster from "@/assets/images/default-poster.png";

import Heading from "./Heading";
import Text from "./Text";
import SaveActions from "./SaveActions";
import LazyImage from "./LazyImage";

type ItemCardProps = {
  id: number;
  imgSrc: string;
  releaseDate: string;
  media_type: string;
  rating: number;
  title: string;
  /** Extra classes for the root `<li>` (e.g. a fixed width in a scroll row). */
  className?: string;
};

const ItemCard: FC<ItemCardProps> = ({
  id,
  imgSrc,
  releaseDate,
  media_type,
  rating,
  title,
  className,
}) => {
  const imageSrc = `https://image.tmdb.org/t/p/w500/${imgSrc}`;

  return (
    <li className={className}>
      <div className="group/card relative w-full">
        <NavLink to={media_type === "movie" ? `/movie/${id}` : `/tv/${id}`}>
          <div className="absolute z-10 inset-0 opacity-0 hover:opacity-100 hover:duration-300 bg-[#00000070] backdrop-blur-[2px] flex flex-col gap-3 justify-center items-center">
            <SaveActions
              id={id}
              media_type={media_type}
              meta={{
                title,
                poster_path: imgSrc,
                release_date: releaseDate,
                vote_average: rating,
              }}
            />
            <Text
              size="sm"
              className="bg-white/70 text-black py-2 px-3 rounded-full"
            >
              See Details
            </Text>
          </div>
          <LazyImage
            className="w-full rounded-lg aspect-2/3 object-cover"
            src={imgSrc ? imageSrc : poster}
            alt={`${title} poster`}
          />
        </NavLink>
      </div>
      <div className="mt-2">
        <div className="flex gap-2">
          <Text>{releaseDate}</Text>
          <span>•</span>
          <div className="flex items-center gap-1">
            {media_type === "movie" ? (
              <RiFilmFill className="text-md" />
            ) : (
              <PiTelevisionSimpleFill className="text-md" />
            )}
            <Text className="hidden md:block">{media_type}</Text>
          </div>
          {rating > 0 && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1">
                <IoStar className="text-orange" />
                <Text>{rating.toFixed(1)}</Text>
              </div>
            </>
          )}
        </div>
        <NavLink to={media_type === "movie" ? `/movie/${id}` : `/tv/${id}`}>
          <Heading
            as="h3"
            size="sm"
            className="line-clamp-2 text-ellipsis md:truncate max-md:text-base"
          >
            {title}
          </Heading>
        </NavLink>
      </div>
    </li>
  );
};
export default ItemCard;
