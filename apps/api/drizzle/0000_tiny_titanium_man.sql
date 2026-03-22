CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(256) NOT NULL,
	"url" varchar(512) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
