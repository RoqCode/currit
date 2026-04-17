CREATE TABLE "item_feedback" (
	"itemId" uuid NOT NULL,
	"likedAt" timestamp,
	"bookmarkedAt" timestamp,
	"readAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "item_feedback" ADD CONSTRAINT "item_feedback_itemId_items_id_fk" FOREIGN KEY ("itemId") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;