import type { FastifyInstance } from "fastify";
import { and, desc, eq } from "drizzle-orm";

import { db } from "../db";
import { savedItems } from "../db/schema";
import { requireAuth } from "../plugins/requireAuth";

const LIST_TYPES = ["favorite", "watchlist"] as const;
const MEDIA_TYPES = ["movie", "tv"] as const;

type ListType = (typeof LIST_TYPES)[number];
type MediaType = (typeof MEDIA_TYPES)[number];

type SavedKey = { listType: ListType; mediaType: MediaType; mediaId: number };
type SavedBody = SavedKey & {
  title?: string;
  posterPath?: string;
  releaseDate?: string;
  voteAverage?: number;
};

/**
 * Favorites / watch-later CRUD. Replaces the old browser→Supabase RLS path:
 * every query here is scoped to the JWT-authenticated user, which is the
 * authorization model RLS used to provide.
 */
export const savedRoutes = (app: FastifyInstance) => {
  app.addHook("preHandler", requireAuth);

  /** The user's list, newest first. */
  app.get<{ Querystring: { list: ListType } }>(
    "/",
    {
      schema: {
        querystring: {
          type: "object",
          required: ["list"],
          properties: { list: { type: "string", enum: [...LIST_TYPES] } },
        },
      },
    },
    async (request) => {
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
        .where(
          and(
            eq(savedItems.userId, request.userId),
            eq(savedItems.listType, request.query.list),
          ),
        )
        .orderBy(desc(savedItems.createdAt));
      return { items };
    },
  );

  /** Add a title to a list. Saving an already-saved title is a no-op. */
  app.post<{ Body: SavedBody }>(
    "/",
    {
      schema: {
        body: {
          type: "object",
          required: ["listType", "mediaType", "mediaId"],
          properties: {
            listType: { type: "string", enum: [...LIST_TYPES] },
            mediaType: { type: "string", enum: [...MEDIA_TYPES] },
            mediaId: { type: "integer", minimum: 1 },
            title: { type: "string", maxLength: 512 },
            posterPath: { type: "string", maxLength: 512 },
            releaseDate: { type: "string", maxLength: 32 },
            voteAverage: { type: "number" },
          },
        },
      },
    },
    async (request, reply) => {
      const { listType, mediaType, mediaId, ...meta } = request.body;
      await db
        .insert(savedItems)
        .values({
          userId: request.userId,
          listType,
          mediaType,
          mediaId,
          title: meta.title ?? null,
          posterPath: meta.posterPath ?? null,
          releaseDate: meta.releaseDate ?? null,
          voteAverage: meta.voteAverage ?? null,
        })
        .onConflictDoNothing();
      return reply.code(201).send({ message: "Saved." });
    },
  );

  /** Remove a title from a list. Removing a non-saved title is a no-op. */
  app.delete<{ Params: SavedKey }>(
    "/:listType/:mediaType/:mediaId",
    {
      schema: {
        params: {
          type: "object",
          required: ["listType", "mediaType", "mediaId"],
          properties: {
            listType: { type: "string", enum: [...LIST_TYPES] },
            mediaType: { type: "string", enum: [...MEDIA_TYPES] },
            mediaId: { type: "integer", minimum: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      const { listType, mediaType, mediaId } = request.params;
      await db
        .delete(savedItems)
        .where(
          and(
            eq(savedItems.userId, request.userId),
            eq(savedItems.listType, listType),
            eq(savedItems.mediaType, mediaType),
            eq(savedItems.mediaId, mediaId),
          ),
        );
      return reply.code(204).send();
    },
  );
};
