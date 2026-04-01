CREATE TABLE "feed_items" (
	"feedId" uuid NOT NULL,
	"itemId" uuid NOT NULL,
	"position" integer NOT NULL,
	"bucket" "type" NOT NULL,
	"scoreAtSelection" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feed_items_feedId_itemId_pk" PRIMARY KEY("feedId","itemId")
);
--> statement-breakpoint
CREATE TABLE "feeds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feedDate" date NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feed_items" ADD CONSTRAINT "feed_items_feedId_feeds_id_fk" FOREIGN KEY ("feedId") REFERENCES "public"."feeds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_items" ADD CONSTRAINT "feed_items_itemId_items_id_fk" FOREIGN KEY ("itemId") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "feed_items_feed_position_idx" ON "feed_items" USING btree ("feedId","position");--> statement-breakpoint
CREATE UNIQUE INDEX "feeds_feed_date_idx" ON "feeds" USING btree ("feedDate");