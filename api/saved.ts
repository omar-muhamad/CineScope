import { and, desc, eq } from "drizzle-orm";

import { db } from "../server/db/index.js";
import { savedItems } from "../server/db/schema.js";
import { errorJson, requireUser, withErrorBody } from "../server/http.js";

/**
 * Favorites / watch-later CRUD, scoped to the session user (the authorization
 * model the old Fastify routes provided). One function serves all three
 * methods; the path-style DELETE URL the client sends is mapped onto query
 * params by a vercel.json rewrite.
 */

const LIST_TYPES = ["favorite", "watchlist"] as const;
const MEDIA_TYPES = ["movie", "tv"] as const;

type ListType = (typeof LIST_TYPES)[number];
type MediaType = (typeof MEDIA_TYPES)[number];

const isListType = (value: unknown): value is ListType =>
  LIST_TYPES.includes(value as ListType);
const isMediaType = (value: unknown): value is MediaType =>
  MEDIA_TYPES.includes(value as MediaType);
// Upper bound keeps values inside Postgres `integer`; without it an oversized
// id overflows into a driver error (500) instead of a 400.
const PG_INT_MAX = 2_147_483_647;

const isMediaId = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= 1 &&
  value <= PG_INT_MAX;

// TMDB legitimately returns null for missing posters/dates — treat it like
// the field being absent (the columns are nullable anyway).
const isShortString = (value: unknown, maxLength: number): boolean =>
  value == null || (typeof value === "string" && value.length <= maxLength);

export const GET = withErrorBody(async (request: Request) => {
  const user = await requireUser(request);
  if (!user) return errorJson(401, "UNAUTHORIZED", "Not authenticated.");

  const list = new URL(request.url).searchParams.get("list");
  if (!isListType(list)) {
    return errorJson(400, "INVALID_INPUT", "list must be favorite|watchlist.");
  }

  // The user's list, newest first.
  const items = await db
    .select({
      mediaId: savedItems.mediaId,
      mediaType: savedItems.mediaType,
      title: savedItems.title,
      posterPath: savedItems.posterPath,
      releaseDate: savedItems.releaseDate,
      voteAverage: savedItems.voteAverage,
    })
    .from(savedItems)
    .where(and(eq(savedItems.userId, user.id), eq(savedItems.listType, list)))
    .orderBy(desc(savedItems.createdAt));

  return Response.json({ items });
});

/** Add a title to a list. Saving an already-saved title is a no-op. */
export const POST = withErrorBody(async (request: Request) => {
  const user = await requireUser(request);
  if (!user) return errorJson(401, "UNAUTHORIZED", "Not authenticated.");

  const body: unknown = await request.json().catch(() => null);
  if (body === null || typeof body !== "object") {
    return errorJson(400, "INVALID_INPUT", "Expected a JSON body.");
  }
  const {
    listType,
    mediaType,
    mediaId,
    title,
    posterPath,
    releaseDate,
    voteAverage,
  } = body as Record<string, unknown>;

  if (
    !isListType(listType) ||
    !isMediaType(mediaType) ||
    !isMediaId(mediaId) ||
    !isShortString(title, 512) ||
    !isShortString(posterPath, 512) ||
    !isShortString(releaseDate, 32) ||
    (voteAverage != null && typeof voteAverage !== "number")
  ) {
    return errorJson(400, "INVALID_INPUT", "Invalid saved-item payload.");
  }

  await db
    .insert(savedItems)
    .values({
      userId: user.id,
      listType,
      mediaType,
      mediaId,
      title: (title as string | null | undefined) ?? null,
      posterPath: (posterPath as string | null | undefined) ?? null,
      releaseDate: (releaseDate as string | null | undefined) ?? null,
      voteAverage: (voteAverage as number | null | undefined) ?? null,
    })
    .onConflictDoNothing();

  return Response.json({ message: "Saved." }, { status: 201 });
});

/** Remove a title from a list. Removing a non-saved title is a no-op. */
export const DELETE = withErrorBody(async (request: Request) => {
  const user = await requireUser(request);
  if (!user) return errorJson(401, "UNAUTHORIZED", "Not authenticated.");

  // Path params arrive as query params via the vercel.json rewrite.
  const query = new URL(request.url).searchParams;
  const listType = query.get("listType");
  const mediaType = query.get("mediaType");
  const mediaId = Number(query.get("mediaId"));

  if (!isListType(listType) || !isMediaType(mediaType) || !isMediaId(mediaId)) {
    return errorJson(400, "INVALID_INPUT", "Invalid saved-item key.");
  }

  await db
    .delete(savedItems)
    .where(
      and(
        eq(savedItems.userId, user.id),
        eq(savedItems.listType, listType),
        eq(savedItems.mediaType, mediaType),
        eq(savedItems.mediaId, mediaId),
      ),
    );

  return new Response(null, { status: 204 });
});
