import {
  pgTable,
  bigint,
  uuid,
  text,
  integer,
  real,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Favorites + watch-later, stored in our own Supabase Postgres.
 *
 * One table with a `list_type` discriminator (the app's data layer is already
 * parameterized by `kind: "favorite" | "watchlist"`). The card metadata
 * (title/poster/date/rating) is denormalized onto each row so the saved pages
 * render without re-hitting TMDB.
 *
 * Build-time only: this module is consumed by drizzle-kit to generate
 * migrations and is NEVER imported by the browser runtime. The FK to
 * `auth.users`, the CHECK constraints, and Row-Level Security live in the
 * hand-written `0001_saved_items_rls` migration so drizzle-kit never tries to
 * introspect or manage the Supabase `auth` schema.
 */
export const savedItems = pgTable(
  "saved_items",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    // Defaults to the caller's auth uid so the client never sends user_id and
    // the RLS insert check (auth.uid() = user_id) always holds.
    userId: uuid("user_id")
      .notNull()
      .default(sql`auth.uid()`),
    listType: text("list_type").notNull(), // 'favorite' | 'watchlist'
    mediaType: text("media_type").notNull(), // 'movie' | 'tv'
    mediaId: integer("media_id").notNull(), // TMDB id
    title: text("title"),
    posterPath: text("poster_path"),
    releaseDate: text("release_date"), // raw date or 4-char year — both render
    voteAverage: real("vote_average"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // media_type MUST be in the key: movie 123 and tv 123 are distinct titles.
    unique("saved_items_user_list_media_uq").on(
      t.userId,
      t.listType,
      t.mediaType,
      t.mediaId,
    ),
    // Serves the list fetch: WHERE user_id (RLS) AND list_type ORDER BY created_at desc.
    index("saved_items_user_list_created_idx").on(
      t.userId,
      t.listType,
      t.createdAt,
    ),
  ],
);
