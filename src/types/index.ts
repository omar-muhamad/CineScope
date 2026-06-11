export type Season = {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  poster_path: string | null;
  air_date: string | null;
};

export type Video = {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  iso_639_1: string;
  published_at: string;
};

export type Episode = {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  air_date: string | null;
  vote_average: number;
  runtime: number | null;
  still_path: string | null;
};

/**
 * The card-shaped media object returned by TMDB list endpoints (trending,
 * popular, search/multi, recommendations). All of these share the same fields.
 */
export type MediaSummary = {
  id: number;
  media_type: string;
  backdrop_path: string;
  poster_path: string;
  release_date: string;
  first_air_date: string;
  adult: boolean;
  vote_average: number;
  title: string;
  name: string;
};

/** A billed cast member from a title's `credits` (movie or tv). */
export type CastMember = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  /** Billing order — lower numbers are more prominent. */
  order: number;
  known_for_department?: string;
};

/** A page of results from a paginated TMDB list endpoint. */
export type Paginated<T> = {
  page: number;
  results: T[];
  total_pages: number;
};

/**
 * An item in a user's favorites / watch-later list. The account list endpoints
 * omit some fields, so most are optional (and `media_type` is tagged on by us).
 */
export type MediaItem = {
  id: number;
  media_type: string;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average?: number;
};

/** Full movie/TV details from `/{media_type}/{id}` with appended responses. */
export type DetailsData = {
  id: number;
  backdrop_path: string;
  release_date: string;
  first_air_date: string;
  adult: boolean;
  title: string;
  name: string;
  poster_path: string;
  genres: { id: number; name: string }[];
  vote_average: number;
  overview: string;
  imdb_id?: string;
  external_ids?: { imdb_id: string | null };
  seasons?: Season[];
  number_of_seasons?: number;
  release_dates?: {
    results: {
      iso_3166_1: string;
      release_dates: { certification: string }[];
    }[];
  };
  content_ratings?: {
    results: { iso_3166_1: string; rating: string }[];
  };
  videos?: {
    results: Video[];
  };
  credits?: {
    cast: CastMember[];
  };
};
