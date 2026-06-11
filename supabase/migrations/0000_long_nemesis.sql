CREATE TABLE "saved_items" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "saved_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"list_type" text NOT NULL,
	"media_type" text NOT NULL,
	"media_id" integer NOT NULL,
	"title" text,
	"poster_path" text,
	"release_date" text,
	"vote_average" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_items_user_list_media_uq" UNIQUE("user_id","list_type","media_type","media_id")
);
--> statement-breakpoint
CREATE INDEX "saved_items_user_list_created_idx" ON "saved_items" USING btree ("user_id","list_type","created_at");