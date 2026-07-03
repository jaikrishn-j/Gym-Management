CREATE TABLE "equipments" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'cardio',
	"status" text DEFAULT 'available',
	"quantity" integer DEFAULT 1 NOT NULL,
	"imageUrl" text,
	"purchaseDate" timestamp,
	"lastMaintenance" timestamp,
	"nextMaintenance" timestamp,
	"location" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"price" real NOT NULL,
	"offer_price" real,
	"billing_days" integer NOT NULL,
	"features" text[] NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
