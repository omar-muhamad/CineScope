import { FC } from "react";
import { PiTelevisionSimpleFill } from "react-icons/pi";
import { RiFilmFill } from "react-icons/ri";

import Text from "@/components/ui/Text";

type MediaMetaProps = {
  release_date: string;
  media_type: string;
  certification?: string;
};

// The single line of metadata under the title: release year, the media type
// (with a film / TV icon), and an optional content-rating certification badge.
const MediaMeta: FC<MediaMetaProps> = ({
  release_date,
  media_type,
  certification,
}) => (
  <div className="flex items-center gap-2">
    <Text>{release_date}</Text>
    <span>•</span>
    <div className="media-type flex items-center gap-1">
      {media_type === "movie" ? (
        <RiFilmFill className="text-md" />
      ) : (
        <PiTelevisionSimpleFill className="text-md" />
      )}
      <Text>{media_type}</Text>
    </div>
    {certification ? (
      <>
        <span>•</span>
        <span className="rounded-sm border border-white/40 px-1.5 text-sm leading-tight">
          {certification}
        </span>
      </>
    ) : null}
  </div>
);

export default MediaMeta;
