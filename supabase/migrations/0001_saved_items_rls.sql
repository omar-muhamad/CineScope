-- Custom SQL migration file, put your code below! --

-- FK + CHECKs that the Drizzle schema deliberately doesn't manage (so
-- drizzle-kit never introspects the Supabase `auth` schema).
ALTER TABLE "public"."saved_items"
  ADD CONSTRAINT "saved_items_user_fk"
  FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "public"."saved_items"
  ADD CONSTRAINT "saved_items_list_type_chk" CHECK ("list_type" IN ('favorite','watchlist'));
--> statement-breakpoint
ALTER TABLE "public"."saved_items"
  ADD CONSTRAINT "saved_items_media_type_chk" CHECK ("media_type" IN ('movie','tv'));
--> statement-breakpoint
-- Row-Level Security: each user sees and mutates only their own rows.
-- Mandatory — policies are inert until RLS is enabled.
ALTER TABLE "public"."saved_items" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "saved_items_select_own" ON "public"."saved_items"
  FOR SELECT USING (auth.uid() = user_id);
--> statement-breakpoint
CREATE POLICY "saved_items_insert_own" ON "public"."saved_items"
  FOR INSERT WITH CHECK (auth.uid() = user_id);
--> statement-breakpoint
CREATE POLICY "saved_items_delete_own" ON "public"."saved_items"
  FOR DELETE USING (auth.uid() = user_id);
-- insert/delete only; no UPDATE policy. The client omits user_id (column
-- default auth.uid()), so the insert WITH CHECK always passes.
