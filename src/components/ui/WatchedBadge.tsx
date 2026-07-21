import { FC } from "react";
import { IoCheckmarkSharp } from "react-icons/io5";

import { useIsWatched } from "@/queries/useWatchHistory";

type WatchedBadgeProps = {
  id: number;
  media_type: string;
};

/**
 * Always-visible "watched" mark on the top-right corner of poster images.
 * Reads the cached watch history internally (a Set lookup, no per-card
 * request) and renders nothing when logged out or unwatched — absolutely
 * positioned, so it never shifts layout. Parents must be `relative`; no
 * z-index of its own, so the cards' hover overlays (z-10) paint above it.
 */
const WatchedBadge: FC<WatchedBadgeProps> = ({ id, media_type }) => {
  const watched = useIsWatched(media_type, id);
  if (!watched) return null;

  return (
    <span
      role="img"
      aria-label="Watched"
      title="Watched"
      className="pointer-events-none absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-orange text-white shadow-md"
    >
      <IoCheckmarkSharp className="text-sm" />
    </span>
  );
};

export default WatchedBadge;
