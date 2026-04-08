import { integer } from "drizzle-orm/pg-core";
import {
  date,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";

export const sourceTypeEnum = pgEnum("type", ["rss", "subreddit", "hn"]);

export const sources = pgTable("sources", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 256 }).notNull(),
  url: varchar({ length: 512 }).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  type: sourceTypeEnum().notNull(),
  lastPolledAt: timestamp(),
  lastCollectedFrom: timestamp(),
  active: boolean().notNull().default(true),
  isBuiltin: boolean().notNull().default(false),
});

export const items = pgTable(
  "items",
  {
    id: uuid().primaryKey().defaultRandom(),
    sourceId: uuid().references(() => sources.id, { onDelete: "set null" }),
    type: sourceTypeEnum().notNull(),
    externalId: varchar({ length: 255 }),
    title: varchar({ length: 512 }).notNull(),
    author: varchar({ length: 255 }),
    description: text(),
    url: varchar({ length: 512 }).notNull(),
    publishedAt: timestamp().notNull(),
    fetchedAt: timestamp().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
    itemScore: integer().default(0),
    commentCount: integer().default(0),
  },
  (table) => [
    index("items_type_external_id_idx").on(table.type, table.externalId),
  ],
);

export const feeds = pgTable(
  "feeds",
  {
    id: uuid().primaryKey().defaultRandom(),
    feedDate: date().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
  },
  (table) => [uniqueIndex("feeds_feed_date_idx").on(table.feedDate)],
);

export const feedItems = pgTable(
  "feed_items",
  {
    feedId: uuid()
      .references(() => feeds.id)
      .notNull(),
    itemId: uuid()
      .references(() => items.id)
      .notNull(),
    position: integer().notNull(),
    bucket: sourceTypeEnum().notNull(),
    scoreAtSelection: integer(),
    createdAt: timestamp().defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.feedId, table.itemId] }),
    uniqueIndex("feed_items_feed_position_idx").on(
      table.feedId,
      table.position,
    ),
  ],
);
