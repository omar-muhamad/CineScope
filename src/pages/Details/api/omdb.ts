import axios from "axios";

export type ImdbInfo = {
  /** IMDb score as a string, e.g. "8.5" (null when unavailable). */
  rating: string | null;
  /** IMDb vote count as OMDb returns it, e.g. "1,234,567" (null when none). */
  votes: string | null;
};

/**
 * IMDb rating + vote count for a title. IMDb data isn't part of the TMDB
 * payload (vote_average is TMDB's own score), so we resolve the title's IMDb
 * id from TMDB and look it up via the OMDb API. Fields are null when
 * unavailable / OMDb has no data / no API key is configured.
 */
export const fetchImdbInfo = async (
  imdbId: string | null | undefined,
): Promise<ImdbInfo> => {
  const apiKey = import.meta.env.VITE_APP_OMDB_API_KEY;
  if (!imdbId || !apiKey) return { rating: null, votes: null };

  const { data } = await axios.get("https://www.omdbapi.com/", {
    params: { i: imdbId, apikey: apiKey },
  });

  const clean = (value: unknown) =>
    typeof value === "string" && value !== "N/A" ? value : null;

  return { rating: clean(data?.imdbRating), votes: clean(data?.imdbVotes) };
};
