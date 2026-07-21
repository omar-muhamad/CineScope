ALTER TABLE "user" ADD COLUMN "avatar_data" text;--> statement-breakpoint
-- Data move (hand-written): uploaded avatars were stored as data URLs in
-- "image" back when cookieCache was off. They now live in "avatar_data" so
-- session responses / the session_data cookie stay small; "image" keeps only
-- small provider photo URLs.
UPDATE "user" SET "avatar_data" = "image", "image" = NULL WHERE "image" LIKE 'data:%';
