import { FC } from "react";

import SaveToggle from "./SaveToggle";

type BookMarkProps = {
  id: number;
  media_type: string;
  className?: string;
};

/** Bookmark toggle, backed by the signed-in user's TMDB favorites. */
const BookMark: FC<BookMarkProps> = ({ id, media_type, className }) => (
  <SaveToggle
    id={id}
    media_type={media_type}
    kind="favorite"
    className={className}
  />
);

export default BookMark;
