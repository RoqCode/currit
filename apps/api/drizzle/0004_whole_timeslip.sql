ALTER TABLE "items" ADD COLUMN "externalId" varchar(255);--> statement-breakpoint
CREATE INDEX "items_type_external_id_idx" ON "items" USING btree ("type","externalId");