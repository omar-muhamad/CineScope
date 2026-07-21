import axios from "axios";

/**
 * IMDb ratings aren't part of the TMDB payload (vote_average is TMDB's own
 * score), so we resolve the title's IMDb id from TMDB and look the rating up
 * via the OMDb API. Returns the rating as a string (e.g. "8.5") or null when
 * it's unavailable / OMDb has no data / no API key is configured.
 */
export const fetchImdbRating = async (
  imdbId: string | null | undefined,
): Promise<string | null> => {
  const apiKey = import.meta.env.VITE_APP_OMDB_API_KEY;
  if (!imdbId || !apiKey) return null;

  const { data } = await axios.get("https://www.omdbapi.com/", {
    params: { i: imdbId, apikey: apiKey },
  });

  const rating = data?.imdbRating;
  return rating && rating !== "N/A" ? rating : null;
};
