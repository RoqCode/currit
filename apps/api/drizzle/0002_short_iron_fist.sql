ALTER TABLE "items" ADD COLUMN "type" "type" NOT NULL;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "author" varchar(255);--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "fetchedAt" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "itemScore" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "commentCount" integer DEFAULT 0;