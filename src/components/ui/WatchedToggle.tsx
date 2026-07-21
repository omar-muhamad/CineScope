import { FC, MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { IoCheckmarkCircle, IoCheckmarkCircleOutline } from "react-icons/io5";

import { type MediaType, type SavedMeta } from "@/api/saved";
import { useAuth } from "@/auth/useAuth";
import {
  useIsWatched,
  useRecordWatch,
  useRemoveFromHistory,
} from "@/queries/useWatchHistory";

type WatchedToggleProps = {
  id: number;
  media_type: string;
  /** Card metadata stored on mark so the history page renders without TMDB. */
  meta?: SavedMeta;
  className?: string;
};

const BASE_CLASSES =
  "group p-2 rounded-full bg-white/70 flex justify-center items-center hover:bg-black/70";

/**
 * Manual watched override on the details hero, styled like SaveToggle.
 * Marking uses the (0,0) sentinel row (for TV that's a show-level mark);
 * unmarking deletes EVERY history row for the title — episode indicators on
 * the watch page vanish too, so the poster badge and the toggle always agree.
 */
const WatchedToggle: FC<WatchedToggleProps> = ({
  id,
  media_type,
  meta,
  className,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const mediaType = media_type as MediaType;

  // Derived from the cached history (no per-title request); optimistic
  // updates flow through that cache.
  const active = useIsWatched(mediaType, id);
  const record = useRecordWatch();
  const remove = useRemoveFromHistory();

  const handleClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // Not signed in → route to the login flow.
    if (!user) {
      navigate("/login");
      return;
    }

    if (active) {
      remove.mutate({ mediaType, mediaId: id });
    } else {
      record.mutate({ mediaType, mediaId: id, meta: meta ?? {} });
    }
  };

  const loggedIn = Boolean(user);

  // Logged out: non-interactive toggle with a hover tooltip, matching
  // SaveToggle's details-page branch.
  if (!loggedIn) {
    const message = "Log in to track watched titles";
    return (
      <div className={`relative group/tip ${className ?? ""}`}>
        <button
          type="button"
          aria-disabled={true}
          aria-label={message}
          className={`${BASE_CLASSES} w-full h-full opacity-50 cursor-not-allowed`}
        >
          <IoCheckmarkCircleOutline className="text-xl text-white" />
        </button>
        <span
          role="tooltip"
          aria-hidden={true}
          className="pointer-events-none absolute left-1/2 bottom-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover/tip:opacity-100"
        >
          {message}
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      aria-label={active ? "Remove from watch history" : "Mark as watched"}
      className={`${BASE_CLASSES} hover:bg-white active:bg-orange hover:opacity-100 cursor-pointer ${className}`}
    >
      {active ? (
        <IoCheckmarkCircle className="text-xl text-orange" />
      ) : (
        <IoCheckmarkCircleOutline className="text-xl text-black/70" />
      )}
    </button>
  );
};

export default WatchedToggle;
