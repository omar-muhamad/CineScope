import { FC } from "react";
import { NavLink } from "react-router-dom";

import Text from "../ui/Text";
import BookMark from "../ui/BookMark";
import { RiFilmFill } from "react-icons/ri";
import { PiTelevisionSimpleFill } from "react-icons/pi";
import LazyImage from "../ui/LazyImage";

type TrendingCardProps = {
  id: number;
  imgSrc: string;
  releaseDate: string;
  media_type: string;
  ratings: string;
  title: string;
};

const TrendingCard: FC<TrendingCardProps> = ({
  id: id,
  imgSrc,
  releaseDate,
  media_type,
  ratings,
  title,
}) => {
  const movie = media_type === "movie";
  return (
    <li className="relative">
      <div className="absolute w-8 h-8 z-30 peer right-4 top-4">
        <BookMark id={id} media_type={media_type} className="w-full h-full" />
      </div>
      <NavLink className="relative" to={movie ? `/movie/${id}` : `/tv/${id}`}>
        <div className="relative item-image w-[80vw] md:w-[30vw]">
          <LazyImage
            className="w-full rounded-lg"
            src={`https://image.tmdb.org/t/p/w1280/${imgSrc}`}
            alt={`${title} poster`}
          />
        </div>

        <div className="absolute inset-0 p-3 md:p-5 flex flex-col justify-end">
          <div className="w-fit flex gap-2">
            <Text>{releaseDate}</Text>
            <span>•</span>
            <div className="media-type flex items-center gap-1">
              {media_type === "movie" ? (
                <RiFilmFill className="text-md" />
              ) : (
                <PiTelevisionSimpleFill className="text-md" />
              )}
              <Text>{media_type}</Text>
            </div>
            <span>•</span>
            <Text>{ratings}</Text>
          </div>
          <h2 className="font-outfitMedium text-2xl truncate text-ellipsis">
            {title}
          </h2>
        </div>

        <div className="absolute inset-0 opacity-0 hover:opacity-100 hover:duration-300 peer-hover:opacity-100 bg-[#00000070] backdrop-blur-[2px] flex justify-center items-center">
          <Text className="bg-white/70 text-black py-2 px-4 rounded-full">
            See Details
          </Text>
        </div>
      </NavLink>
    </li>
  );
};
export default TrendingCard;
