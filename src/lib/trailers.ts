// Helpers for picking a trailer from a TMDB `videos` response.

import { Video } from "@/types";

export type VideosSource = {
  videos?: { results: Video[] };
};

// TMDB usually returns several videos (trailers, teasers, clips, featurettes)
// hosted on YouTube. We surface the most "official" trailer, preferring an
// official English trailer, then any trailer, then a teaser, then whatever
// YouTube video is available. Returns the YouTube video key, or null when
// there's nothing embeddable so callers can show a "no trailer" state.
export const getTrailerKey = (
  details: VideosSource | undefined,
): string | null => {
  const youtube =
    details?.videos?.results?.filter((v) => v.site === "YouTube") ?? [];
  if (youtube.length === 0) return null;

  const byType = (type: string) => youtube.filter((v) => v.type === type);
  const trailers = byType("Trailer");
  const teasers = byType("Teaser");

  const best =
    trailers.find((v) => v.official && v.iso_639_1 === "en") ??
    trailers.find((v) => v.official) ??
    trailers[0] ??
    teasers.find((v) => v.official && v.iso_639_1 === "en") ??
    teasers[0] ??
    youtube[0];

  return best?.key ?? null;
};
