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

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      aria-label={active ? `Remove from ${label}` : `Add to ${label}`}
      className={`group rounded-full bg-[#00000070] hover:bg-white active:bg-orange hover:opacity-100 flex justify-center items-center cursor-pointer ${className}`}
    >
      {active ? (
        <OnIcon className="text-xl text-white group-hover:text-black" />
      ) : (
        <OffIcon className="text-xl text-white group-hover:text-black" />
      )}
    </button>
  );
};

export default SaveToggle;
