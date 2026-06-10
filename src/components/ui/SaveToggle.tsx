import { FC, MouseEvent, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  IoBookmark,
  IoBookmarkOutline,
  IoTime,
  IoTimeOutline,
} from "react-icons/io5";

import { AppDispatch, RootState } from "@/redux/store";
import { getAccountStates, type MediaType } from "@/lib/tmdb";
import {
  toggleFavorite,
  toggleWatchlist,
} from "@/redux/bookmarked/bookmarkSlice";

export type SaveKind = "favorite" | "watchlist";

type SaveToggleProps = {
  id: number;
  media_type: string;
  kind: SaveKind;
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
  className,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { google, tmdb } = useSelector((state: RootState) => state.user);
  const [active, setActive] = useState(false);

  const mediaType = media_type as MediaType;

  // Reflect the current favorite/watchlist status from TMDB on mount.
  useEffect(() => {
    let cancelled = false;
    if (!tmdb) {
      setActive(false);
      return;
    }
    getAccountStates(mediaType, id, tmdb.session_id)
      .then((states) => {
        if (!cancelled) {
          setActive(kind === "favorite" ? states.favorite : states.watchlist);
        }
      })
      .catch(() => {
        /* leave as inactive if the status can't be read */
      });
    return () => {
      cancelled = true;
    };
  }, [tmdb, mediaType, id, kind]);

  const handleClick = async (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // Not authenticated (or no TMDB linked) → route to the login/connect flow.
    if (!google || !tmdb) {
      navigate("/login");
      return;
    }

    const next = !active;
    setActive(next); // optimistic

    const result =
      kind === "favorite"
        ? await dispatch(
            toggleFavorite({ media_type: mediaType, id, favorite: next }),
          )
        : await dispatch(
            toggleWatchlist({ media_type: mediaType, id, watchlist: next }),
          );

    if (result.meta.requestStatus === "rejected") {
      setActive(!next); // revert on failure
    }
  };

  const { on: OnIcon, off: OffIcon, label } = ICONS[kind];
  const loggedIn = Boolean(google);

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
