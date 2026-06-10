import { FC } from "react";

import SaveToggle from "./SaveToggle";

type WatchLaterProps = {
  id: number;
  media_type: string;
  className?: string;
};

/** Watch-later toggle, backed by the signed-in user's TMDB watchlist. */
const WatchLater: FC<WatchLaterProps> = ({ id, media_type, className }) => (
  <SaveToggle
    id={id}
    media_type={media_type}
    kind="watchlist"
    className={className}
  />
);

export default WatchLater;
