import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const sourceTypeEnum = pgEnum("type", ["rss", "subreddit", "hn"]);

export const sources = pgTable("sources", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 256 }).notNull(),
  url: varchar({ length: 512 }).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  type: sourceTypeEnum().notNull(),
  lastPolledAt: timestamp(),
});

export const items = pgTable("items", {
  id: uuid().primaryKey().defaultRandom(),
  sourceId: uuid()
    .references(() => sources.id)
    .notNull(),
  title: varchar({ length: 512 }).notNull(),
  description: text(),
  url: varchar({ length: 512 }).notNull(),
  publishedAt: timestamp().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});
