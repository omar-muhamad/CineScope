import { FC } from "react";
import { IoPerson } from "react-icons/io5";

import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import LazyImage from "@/components/ui/LazyImage";

type CastCardProps = {
  name: string;
  character: string;
  profilePath: string | null;
};

const CastCard: FC<CastCardProps> = ({ name, character, profilePath }) => {
  return (
    <li className="w-28 md:w-32 shrink-0">
      {profilePath ? (
        <LazyImage
          className="w-full rounded-lg aspect-2/3 object-cover bg-secondary-dark"
          src={`https://image.tmdb.org/t/p/w300/${profilePath}`}
          alt={`${name} headshot`}
        />
      ) : (
        <div className="w-full rounded-lg aspect-2/3 bg-secondary-dark flex items-center justify-center">
          <IoPerson className="text-4xl text-white/30" />
        </div>
      )}
      <Heading
        as="h3"
        size="sm"
        className="mt-2 line-clamp-1 max-md:text-base"
        title={name}
      >
        {name}
      </Heading>
      <Text size="sm" className="text-[#c3c4c7] line-clamp-1" title={character}>
        {character}
      </Text>
    </li>
  );
};
export default CastCard;
