import {
  pgTable,
  bigint,
  uuid,
  text,
  integer,
  real,
  boolean,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";

/**
 * App-owned auth + saved lists, managed entirely by Drizzle (no Supabase).
 * The browser never touches the database — every access goes through the
 * Fastify API in `server/`, which scopes queries to the authenticated user.
 */

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Stored lowercase; the API normalizes before insert/lookup.
  email: text("email").notNull().unique(),
  // Stored lowercase; usable as a login identifier alongside email. Null for
  // Google-created accounts, which never pass through the signup form.
  username: text("username").unique(),
  // Null for Google-only accounts (no password set).
  passwordHash: text("password_hash"),
  // Google `sub` claim. Null until the account is linked to a Google identity.
  googleId: text("google_id").unique(),
  // Password signups must verify via emailed link before they can log in.
  // Google sign-ins are trusted as verified (Google asserts email_verified).
  emailVerified: boolean("email_verified").notNull().default(false),
  firstName: text("first_name"),
  lastName: text("last_name"),
  // Either a small data-URL avatar uploaded at signup (stored inline — the
  // app has no object storage) or the Google profile photo URL.
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * One row per issued refresh token, stored as a SHA-256 hash (a DB leak must
 * not yield usable tokens). Rotation: each /auth/refresh revokes the presented
 * row and inserts a replacement; presenting an already-revoked token is
 * treated as theft and revokes the whole family (all of the user's sessions).
 */
export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("refresh_tokens_user_idx").on(t.userId)],
);

/** Single-use, expiring tokens backing the email-verification links. */
export const emailVerificationTokens = pgTable(
  "email_verification_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("email_verification_tokens_user_idx").on(t.userId)],
);

/** Single-use, expiring tokens backing the "forgot password" email links. */
export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("password_reset_tokens_user_idx").on(t.userId)],
);

/**
 * Favorites + watch-later. One table with a `list_type` discriminator (the
 * app's data layer is parameterized by `kind: "favorite" | "watchlist"`).
 * Card metadata (title/poster/date/rating) is denormalized onto each row so
 * the saved pages render without re-hitting TMDB.
 */
export const savedItems = pgTable(
  "saved_items",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
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
    // Serves the list fetch: WHERE user_id AND list_type ORDER BY created_at desc.
    index("saved_items_user_list_created_idx").on(
      t.userId,
      t.listType,
      t.createdAt,
    ),
  ],
);

export type User = typeof users.$inferSelect;
export type SavedItem = typeof savedItems.$inferSelect;
