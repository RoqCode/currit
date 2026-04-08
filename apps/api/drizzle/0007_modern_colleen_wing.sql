ALTER TABLE "items" DROP CONSTRAINT "items_sourceId_sources_id_fk";
--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "sourceId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_sourceId_sources_id_fk" FOREIGN KEY ("sourceId") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;