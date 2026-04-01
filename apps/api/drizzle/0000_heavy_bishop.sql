CREATE TYPE "public"."type" AS ENUM('rss', 'subreddit', 'hn');--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sourceId" uuid NOT NULL,
	"title" varchar(512) NOT NULL,
	"description" text,
	"url" varchar(512) NOT NULL,
	"publishedAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(256) NOT NULL,
	"url" varchar(512) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"type" "type" NOT NULL,
	"lastPolledAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_sourceId_sources_id_fk" FOREIGN KEY ("sourceId") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;