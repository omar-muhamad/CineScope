CREATE TABLE "watch_history" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "watch_history_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" text NOT NULL,
	"media_type" text NOT NULL,
	"media_id" integer NOT NULL,
	"season" integer DEFAULT 0 NOT NULL,
	"episode" integer DEFAULT 0 NOT NULL,
	"title" text,
	"poster_path" text,
	"release_date" text,
	"vote_average" real,
	"watched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "watch_history_user_media_ep_uq" UNIQUE("user_id","media_type","media_id","season","episode")
);
--> statement-breakpoint
ALTER TABLE "watch_history" ADD CONSTRAINT "watch_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "watch_history_user_watched_idx" ON "watch_history" USING btree ("user_id","watched_at");