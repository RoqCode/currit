ALTER TABLE "item_feedback" DROP CONSTRAINT "item_feedback_itemId_items_id_fk";
--> statement-breakpoint
ALTER TABLE "item_feedback" ADD CONSTRAINT "item_feedback_itemId_items_id_fk" FOREIGN KEY ("itemId") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;