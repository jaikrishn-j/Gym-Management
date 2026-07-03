CREATE TABLE "member_attendance" (
	"id" text PRIMARY KEY,
	"clerk_user_id" text NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"time_in" timestamp,
	"time_out" timestamp,
	"weight_in" real,
	"weight_out" real,
	"is_present" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberplans" (
	"id" text PRIMARY KEY,
	"clerk_user_id" text NOT NULL,
	"plan_id" text NOT NULL,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"end_date" timestamp NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"is_synced" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY,
	"clerk_user_id" text NOT NULL,
	"member_plan_id" text,
	"amount" real NOT NULL,
	"payment_method" text DEFAULT 'cash' NOT NULL,
	"payment_date" timestamp DEFAULT now() NOT NULL,
	"days_added" integer NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"recorded_by" text,
	"notes" text,
	"is_synced" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pending_syncs" (
	"id" text PRIMARY KEY,
	"clerk_user_id" text NOT NULL,
	"action" text NOT NULL,
	"payload" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"synced" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_attendance_user_date" ON "member_attendance" ("clerk_user_id","date");--> statement-breakpoint
CREATE INDEX "idx_attendance_user" ON "member_attendance" ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_date" ON "member_attendance" ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_memberplan_user_plan_start" ON "memberplans" ("clerk_user_id","plan_id","start_date");--> statement-breakpoint
CREATE INDEX "idx_memberplan_user" ON "memberplans" ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "idx_memberplan_status" ON "memberplans" ("status");--> statement-breakpoint
CREATE INDEX "idx_payment_user" ON "payments" ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "idx_payment_date" ON "payments" ("payment_date");--> statement-breakpoint
CREATE INDEX "idx_payment_sync" ON "payments" ("is_synced");--> statement-breakpoint
CREATE INDEX "idx_sync_synced" ON "pending_syncs" ("synced");