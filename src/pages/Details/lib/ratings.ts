// Helpers for deriving human-readable ratings from TMDB responses.

type MovieReleaseDates = {
  results?: {
    iso_3166_1: string;
    release_dates: { certification: string }[];
  }[];
};

type TvContentRatings = {
  results?: {
    iso_3166_1: string;
    rating: string;
  }[];
};

export type CertificationSource = {
  release_dates?: MovieReleaseDates;
  content_ratings?: TvContentRatings;
};

// TMDB returns certifications per country. We surface the US rating
// (MPAA for movies, TV Parental Guidelines for shows) and fall back to
// an empty string when none is available so callers can skip rendering.
export const getCertification = (
  details: CertificationSource | undefined,
  media_type: string | undefined,
): string => {
  if (!details) return "";

  if (media_type === "tv") {
    const us = details.content_ratings?.results?.find(
      (r) => r.iso_3166_1 === "US",
    );
    return us?.rating || "";
  }

  const us = details.release_dates?.results?.find((r) => r.iso_3166_1 === "US");
  const certification = us?.release_dates?.find(
    (d) => d.certification,
  )?.certification;
  return certification || "";
};
