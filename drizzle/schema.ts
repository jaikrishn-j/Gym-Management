import { boolean, integer, pgTable, real, text, timestamp, uniqueIndex, index, primaryKey } from "drizzle-orm/pg-core";

export const plans = pgTable("plans", {
  id: text("id").primaryKey().$defaultFn(()=>crypto.randomUUID()),
  name: text("name").notNull(),
  descripttion: text("description").notNull(),
  price: real("price").notNull(),
  offerPrice: real("offer_price"),
  billingDays: integer("billing_days").notNull(),
  features: text("features").array().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
})

export type Plan = typeof plans.$inferSelect
export type NewPlan = typeof plans.$inferInsert


export const equipments = pgTable("equipments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").default("cardio"),
  status: text("status").default("available"),
  quantity: integer("quantity").default(1).notNull(),
  imageUrl: text("imageUrl"),
  purchaseDate: timestamp("purchaseDate"),
  lastMaintenance: timestamp("lastMaintenance"),
  nextMaintenance: timestamp("nextMaintenance"),
  location: text("location"),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Equipment = typeof equipments.$inferSelect
export type NewEquipment = typeof equipments.$inferInsert


export const memberplans = pgTable("memberplans", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clerkUserId: text("clerk_user_id").notNull(),
  planId: text("plan_id").notNull(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").default("active").notNull(),
  isSynced: boolean("is_synced").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  uniqueUserPlanStart: uniqueIndex("uq_memberplan_user_plan_start").on(table.clerkUserId, table.planId, table.startDate),
  clerkUserIdx: index("idx_memberplan_user").on(table.clerkUserId),
  statusIdx: index("idx_memberplan_status").on(table.status),
}))

export type MemberPlan = typeof memberplans.$inferSelect
export type NewMemberPlan = typeof memberplans.$inferInsert


export const payments = pgTable("payments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clerkUserId: text("clerk_user_id").notNull(),
  memberPlanId: text("member_plan_id"),
  amount: real("amount").notNull(),
  paymentMethod: text("payment_method").default("cash").notNull(),
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  daysAdded: integer("days_added").notNull(),
  status: text("status").default("completed").notNull(),
  recordedBy: text("recorded_by"),
  notes: text("notes"),
  paymentSource: text("payment_source").default("manual").notNull(),
  isSynced: boolean("is_synced").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  clerkUserIdx: index("idx_payment_user").on(table.clerkUserId),
  paymentDateIdx: index("idx_payment_date").on(table.paymentDate),
  syncIdx: index("idx_payment_sync").on(table.isSynced),
}))

export type Payment = typeof payments.$inferSelect
export type NewPayment = typeof payments.$inferInsert


export const pendingSyncs = pgTable("pending_syncs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clerkUserId: text("clerk_user_id").notNull(),
  action: text("action").notNull(),
  payload: text("payload").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  synced: boolean("synced").default(false).notNull(),
}, (table) => ({
  syncIdx: index("idx_sync_synced").on(table.synced),
}))

export type PendingSync = typeof pendingSyncs.$inferSelect
export type NewPendingSync = typeof pendingSyncs.$inferInsert


export const memberAttendance = pgTable("member_attendance", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clerkUserId: text("clerk_user_id").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  timeIn: timestamp("time_in"),
  timeOut: timestamp("time_out"),
  weightIn: real("weight_in"),
  weightOut: real("weight_out"),
  isPresent: boolean("is_present").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  uniqueUserDate: uniqueIndex("uq_attendance_user_date").on(table.clerkUserId, table.date),
  clerkUserIdx: index("idx_attendance_user").on(table.clerkUserId),
  dateIdx: index("idx_attendance_date").on(table.date),
}))

export type MemberAttendance = typeof memberAttendance.$inferSelect
export type NewMemberAttendance = typeof memberAttendance.$inferInsert


export const planRequests = pgTable("plan_requests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clerkUserId: text("clerk_user_id").notNull(),
  planId: text("plan_id").notNull(),
  status: text("status").default("pending").notNull(),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  approvedBy: text("approved_by"),
  amount: real("amount"),
  paymentMethod: text("payment_method"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  statusIdx: index("idx_pr_status").on(table.status),
  userIdx: index("idx_pr_user").on(table.clerkUserId),
}))

export type PlanRequest = typeof planRequests.$inferSelect
export type NewPlanRequest = typeof planRequests.$inferInsert


export const gymSettings = pgTable("gym_settings", {
  id: text("id").primaryKey().$default(() => "singleton"),
  initialPaymentAmount: real("initial_payment_amount").default(0).notNull(),
  paymentGatewayEnabled: boolean("payment_gateway_enabled").default(false).notNull(),
  razorpayKeyId: text("razorpay_key_id"),
  razorpaySecretKey: text("razorpay_secret_key"),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
})

export type GymSettings = typeof gymSettings.$inferSelect
export type NewGymSettings = typeof gymSettings.$inferInsert


export const broadcasts = pgTable("broadcasts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  message: text("message").notNull(),
  target: text("target").notNull(),
  sentBy: text("sent_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
})

export type Broadcast = typeof broadcasts.$inferSelect
export type NewBroadcast = typeof broadcasts.$inferInsert

export const broadcastReads = pgTable("broadcast_reads", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  broadcastId: text("broadcast_id").notNull(),
  clerkUserId: text("clerk_user_id").notNull(),
  readAt: timestamp("read_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserBroadcast: uniqueIndex("uq_broadcast_read_user").on(table.broadcastId, table.clerkUserId),
}))

export type BroadcastRead = typeof broadcastReads.$inferSelect
export type NewBroadcastRead = typeof broadcastReads.$inferInsert
