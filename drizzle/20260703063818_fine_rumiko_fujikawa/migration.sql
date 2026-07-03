CREATE TABLE "broadcast_reads" (
	"id" text PRIMARY KEY,
	"broadcast_id" text NOT NULL,
	"clerk_user_id" text NOT NULL,
	"read_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "broadcasts" (
	"id" text PRIMARY KEY,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"target" text NOT NULL,
	"sent_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_broadcast_read_user" ON "broadcast_reads" ("broadcast_id","clerk_user_id");