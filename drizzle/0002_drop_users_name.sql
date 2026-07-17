-- Preserve existing display names into the new split columns before dropping.
UPDATE "users"
SET
  "first_name" = COALESCE("first_name", split_part("name", ' ', 1)),
  "last_name" = COALESCE(
    "last_name",
    NULLIF(btrim(substr("name", length(split_part("name", ' ', 1)) + 1)), '')
  )
WHERE "name" IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "name";
