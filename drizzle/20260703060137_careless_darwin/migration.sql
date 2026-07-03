CREATE TABLE "gym_settings" (
	"id" text PRIMARY KEY,
	"initial_payment_amount" real DEFAULT 0 NOT NULL,
	"payment_gateway_enabled" boolean DEFAULT false NOT NULL,
	"razorpay_key_id" text,
	"razorpay_secret_key" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_requests" (
	"id" text PRIMARY KEY,
	"clerk_user_id" text NOT NULL,
	"plan_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"razorpay_order_id" text,
	"razorpay_payment_id" text,
	"approved_by" text,
	"amount" real,
	"payment_method" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "payment_source" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_pr_status" ON "plan_requests" ("status");--> statement-breakpoint
CREATE INDEX "idx_pr_user" ON "plan_requests" ("clerk_user_id");