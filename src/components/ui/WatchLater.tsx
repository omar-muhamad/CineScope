import { FC } from "react";

import type { SavedMeta } from "@/api/saved";
import SaveToggle from "./SaveToggle";

type WatchLaterProps = {
  id: number;
  media_type: string;
  meta?: SavedMeta;
  className?: string;
};

/** Watch-later toggle, backed by the signed-in user's watch-later list. */
const WatchLater: FC<WatchLaterProps> = ({
  id,
  media_type,
  meta,
  className,
}) => (
  <SaveToggle
    id={id}
    media_type={media_type}
    kind="watchlist"
    meta={meta}
    className={className}
  />
);

export default WatchLater;
