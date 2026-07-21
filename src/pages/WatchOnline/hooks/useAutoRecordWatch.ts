import { useEffect, useRef } from "react";

import type { SavedMeta } from "@/api/saved";
import type { MediaType } from "@/lib/tmdb";
import { useAuth } from "@/auth/useAuth";
import { useRecordWatch } from "@/queries/useWatchHistory";

type AutoRecordArgs = {
  mediaType: MediaType;
  mediaId: number;
  /** (0,0) for movies; the selected episode for TV. */
  season?: number;
  episode?: number;
  /** Card metadata persisted so the history page renders without TMDB. */
  meta: SavedMeta;
  /** Gate: TV passes false until the selected episode exists in the season. */
  enabled: boolean;
};

/**
 * The player iframe is cross-origin, so there are no playback events —
 * "started watching" is the page being open on a title/episode. The delay
 * absorbs the mount-time season reset and rapid episode flipping (the timer
 * is cleared on every change); leaving within the delay records nothing.
 */
const RECORD_DELAY_MS = 3000;

/** Auto-record the watched title/episode. No-op when logged out. */
export const useAutoRecordWatch = ({
  mediaType,
  mediaId,
  season = 0,
  episode = 0,
  meta,
  enabled,
}: AutoRecordArgs) => {
  const { user } = useAuth();
  const loggedIn = Boolean(user);
  const { mutate } = useRecordWatch();

  // meta is a fresh object every render; a ref keeps it out of the effect
  // deps so it never re-arms the timer.
  const metaRef = useRef(meta);
  useEffect(() => {
    metaRef.current = meta;
  });

  // Guards re-recording the same key on rerenders and on the history
  // invalidation that follows the mutation itself.
  const recordedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const key = `${mediaType}:${mediaId}:${season}:${episode}`;
    if (!loggedIn || !enabled || recordedKeyRef.current === key) return;

    const timer = setTimeout(() => {
      recordedKeyRef.current = key;
      mutate({ mediaType, mediaId, season, episode, meta: metaRef.current });
    }, RECORD_DELAY_MS);

    return () => clearTimeout(timer);
  }, [loggedIn, enabled, mediaType, mediaId, season, episode, mutate]);
};
