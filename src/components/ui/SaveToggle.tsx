import { FC, MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoBookmark,
  IoBookmarkOutline,
  IoTime,
  IoTimeOutline,
} from "react-icons/io5";

import { type MediaType, type SavedMeta } from "@/api/saved";
import { useAuth } from "@/auth/useAuth";
import {
  useSavedState,
  useToggleFavorite,
  useToggleWatchlist,
} from "@/queries/useBookmarks";

export type SaveKind = "favorite" | "watchlist";

type SaveToggleProps = {
  id: number;
  media_type: string;
  kind: SaveKind;
  /** Card metadata stored on add so saved pages render without re-hitting TMDB. */
  meta?: SavedMeta;
  className?: string;
};

const ICONS = {
  favorite: { on: IoBookmark, off: IoBookmarkOutline, label: "bookmarks" },
  watchlist: { on: IoTime, off: IoTimeOutline, label: "watch later" },
} as const;

const BASE_CLASSES =
  "group p-2 rounded-full bg-white/70 flex justify-center items-center hover:bg-black/70";

const SaveToggle: FC<SaveToggleProps> = ({
  id,
  media_type,
  kind,
  meta,
  className,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const mediaType = media_type as MediaType;

  // Current favorite/watchlist status, derived from the cached list (no
  // per-title request). Optimistic updates flow through that list cache.
  const { active } = useSavedState(kind, mediaType, id);
  const toggleFavorite = useToggleFavorite();
  const toggleWatchlist = useToggleWatchlist();

  const handleClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // Not signed in → route to the login flow.
    if (!user) {
      navigate("/login");
      return;
    }

    // Optimistic flip + rollback-on-error are handled inside the mutation.
    const vars = { mediaType, id, next: !active, meta: meta ?? {} };
    if (kind === "favorite") {
      toggleFavorite.mutate(vars);
    } else {
      toggleWatchlist.mutate(vars);
    }
  };

  const { on: OnIcon, off: OffIcon, label } = ICONS[kind];
  const loggedIn = Boolean(user);

  // Logged out: render a non-interactive, disabled-looking toggle with a
  // hover tooltip explaining why. This branch only ever shows on the details
  // page — cards hide the toggles entirely for logged-out visitors via
  // SaveActions. `aria-disabled` (not the `disabled` attribute) is used so the
  // element still receives hover events, which the tooltip relies on.
  if (!loggedIn) {
    const message = `Log in to use your ${label}`;
    return (
      <div className={`relative group/tip ${className ?? ""}`}>
        <button
          type="button"
          aria-disabled={true}
          aria-label={message}
          className={`${BASE_CLASSES} w-full h-full opacity-50 cursor-not-allowed`}
        >
          <OffIcon className="text-xl text-white" />
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
      aria-label={active ? `Remove from ${label}` : `Add to ${label}`}
      className={`${BASE_CLASSES} hover:bg-white active:bg-orange hover:opacity-100 cursor-pointer ${className}`}
    >
      {active ? (
        <OnIcon className="text-xl text-black/70" />
      ) : (
        <OffIcon className="text-xl text-black/70" />
      )}
    </button>
  );
};

export default SaveToggle;
