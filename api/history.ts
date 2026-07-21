import { and, desc, eq } from "drizzle-orm";

import { db } from "../server/db";
import { watchHistory } from "../server/db/schema";
import { errorJson, requireUser } from "../server/http";

/**
 * Watch-history CRUD, scoped to the session user. One row per watched movie
 * or TV episode; movies and show-level manual marks use the (season 0,
 * episode 0) sentinel. Unlike api/saved.ts, DELETE takes plain query params
 * (no vercel.json rewrite): `?all=true` clears everything, `?mediaType&mediaId`
 * removes a title, adding `&season&episode` removes one episode row.
 */

const MEDIA_TYPES = ["movie", "tv"] as const;

type MediaType = (typeof MEDIA_TYPES)[number];

const isMediaType = (value: unknown): value is MediaType =>
  MEDIA_TYPES.includes(value as MediaType);
const isMediaId = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 1;
const isEpisodePart = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

const isShortString = (value: unknown, maxLength: number): boolean =>
  value === undefined ||
  (typeof value === "string" && value.length <= maxLength);

// Payload safety valve; revisit with pagination if anyone ever exceeds it.
const MAX_ROWS = 5000;

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (!user) return errorJson(401, "UNAUTHORIZED", "Not authenticated.");

  // The user's full history, most recently watched first.
  const items = await db
    .select({
      mediaId: watchHistory.mediaId,
      mediaType: watchHistory.mediaType,
      season: watchHistory.season,
      episode: watchHistory.episode,
      title: watchHistory.title,
      posterPath: watchHistory.posterPath,
      releaseDate: watchHistory.releaseDate,
      voteAverage: watchHistory.voteAverage,
      watchedAt: watchHistory.watchedAt,
    })
    .from(watchHistory)
    .where(eq(watchHistory.userId, user.id))
    .orderBy(desc(watchHistory.watchedAt))
    .limit(MAX_ROWS);

  return Response.json({ items });
}

/** Record a watch. Rewatching bumps watched_at and refreshes the card meta. */
export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return errorJson(401, "UNAUTHORIZED", "Not authenticated.");

  const body: unknown = await request.json().catch(() => null);
  if (body === null || typeof body !== "object") {
    return errorJson(400, "INVALID_INPUT", "Expected a JSON body.");
  }
  const {
    mediaType,
    mediaId,
    season = 0,
    episode = 0,
    title,
    posterPath,
    releaseDate,
    voteAverage,
  } = body as Record<string, unknown>;

  if (
    !isMediaType(mediaType) ||
    !isMediaId(mediaId) ||
    !isEpisodePart(season) ||
    !isEpisodePart(episode) ||
    !isShortString(title, 512) ||
    !isShortString(posterPath, 512) ||
    !isShortString(releaseDate, 32) ||
    (voteAverage !== undefined && typeof voteAverage !== "number")
  ) {
    return errorJson(400, "INVALID_INPUT", "Invalid history payload.");
  }

  // Movies only ever use the (0,0) sentinel; TV rows are either the sentinel
  // (show-level manual mark) or a real 1-based episode.
  const isSentinel = season === 0 && episode === 0;
  const isRealEpisode = season >= 1 && episode >= 1;
  if (mediaType === "movie" ? !isSentinel : !(isSentinel || isRealEpisode)) {
    return errorJson(400, "INVALID_INPUT", "Invalid season/episode pair.");
  }

  const meta = {
    title: (title as string | undefined) ?? null,
    posterPath: (posterPath as string | undefined) ?? null,
    releaseDate: (releaseDate as string | undefined) ?? null,
    voteAverage: (voteAverage as number | undefined) ?? null,
  };

  await db
    .insert(watchHistory)
    .values({ userId: user.id, mediaType, mediaId, season, episode, ...meta })
    .onConflictDoUpdate({
      target: [
        watchHistory.userId,
        watchHistory.mediaType,
        watchHistory.mediaId,
        watchHistory.season,
        watchHistory.episode,
      ],
      set: { watchedAt: new Date(), ...meta },
    });

  return Response.json({ message: "Recorded." }, { status: 201 });
}

/**
 * Remove history. Three scopes, strictly validated so a malformed request can
 * never delete more than intended: `?all=true` (everything), a title (every
 * row for mediaType+mediaId), or a single episode row.
 */
export async function DELETE(request: Request) {
  const user = await requireUser(request);
  if (!user) return errorJson(401, "UNAUTHORIZED", "Not authenticated.");

  const query = new URL(request.url).searchParams;

  if (query.get("all") === "true") {
    await db.delete(watchHistory).where(eq(watchHistory.userId, user.id));
    return new Response(null, { status: 204 });
  }

  const mediaType = query.get("mediaType");
  const mediaId = Number(query.get("mediaId"));
  if (!isMediaType(mediaType) || !isMediaId(mediaId)) {
    return errorJson(400, "INVALID_INPUT", "Invalid history key.");
  }

  const mediaScope = and(
    eq(watchHistory.userId, user.id),
    eq(watchHistory.mediaType, mediaType),
    eq(watchHistory.mediaId, mediaId),
  );

  const hasEpisode =
    query.get("season") !== null || query.get("episode") !== null;
  if (!hasEpisode) {
    await db.delete(watchHistory).where(mediaScope);
    return new Response(null, { status: 204 });
  }

  const season = Number(query.get("season"));
  const episode = Number(query.get("episode"));
  if (!isEpisodePart(season) || !isEpisodePart(episode)) {
    return errorJson(400, "INVALID_INPUT", "Invalid season/episode pair.");
  }

  await db
    .delete(watchHistory)
    .where(
      and(
        mediaScope,
        eq(watchHistory.season, season),
        eq(watchHistory.episode, episode),
      ),
    );

  return new Response(null, { status: 204 });
}
