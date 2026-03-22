import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const sourcesTable = pgTable("sources", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 256 }).notNull(),
  url: varchar({ length: 512 }).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});
