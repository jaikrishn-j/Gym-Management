"use server"

import { clerkClient } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { db } from "@/app/db"
import { plans, memberplans, payments, pendingSyncs, memberAttendance, planRequests } from "@/drizzle/schema"
import { eq, asc, desc, sql, and, count } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"
import { hasPermission } from "@/app/lib/getPermission"
import { PERMISSION_ACTIONS, PERMISSION_MODULES } from "@/app/interfaces/authInterface"

interface Member {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  createdAt: string;
  lastSignIn: string;
  status: string;
  role: string;
}

function mapDbToPlan(dbRecord: any): any {
  return {
    ...dbRecord,
    description: dbRecord.descripttion ?? dbRecord.description,
  };
}

export async function readMembers() {
  try {
    const permission = await hasPermission(PERMISSION_MODULES.MEMBERS, PERMISSION_ACTIONS.READ)
    if (!permission) {
      return { success: false, error: "You don't have permission to view members" }
    }

    const client = await clerkClient()
    const users = await client.users.getUserList()

    const members: Member[] = users.data
      .filter(user => {
        const metadata = user.privateMetadata as any
        const userType = metadata?.user
        return !userType || (userType !== 'admin' && userType !== 'staff')
      })
      .map(user => ({
        id: user.id,
        email: user.emailAddresses?.[0]?.emailAddress || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        imageUrl: user.imageUrl,
        createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : '',
        lastSignIn: user.lastSignInAt ? new Date(user.lastSignInAt).toISOString() : '',
        status: user.banned ? 'inactive' : 'active',
        role: '',
      }))

    return { success: true, data: members }
  } catch (error) {
    console.error('Read members error:', error)
    return { success: false, error: "Failed to read members" }
  }
}

export async function readPlans() {
  try {
    const allPlans = await db.select().from(plans).orderBy(asc(plans.createdAt))
    return { success: true, data: allPlans.map(mapDbToPlan) }
  } catch (error) {
    console.error('Read plans error:', error)
    return { success: false, error: "Failed to read plans" }
  }
}

export async function readMemberPlans(clerkUserId: string) {
  try {
    const rows = await db
      .select({
        id: memberplans.id,
        clerkUserId: memberplans.clerkUserId,
        planId: memberplans.planId,
        startDate: memberplans.startDate,
        endDate: memberplans.endDate,
        status: memberplans.status,
        isSynced: memberplans.isSynced,
        plan: {
          id: plans.id,
          name: plans.name,
          description: plans.descripttion,
          price: plans.price,
          offerPrice: plans.offerPrice,
          billingDays: plans.billingDays,
          features: plans.features,
          isActive: plans.isActive,
        },
      })
      .from(memberplans)
      .leftJoin(plans, eq(memberplans.planId, plans.id))
      .where(eq(memberplans.clerkUserId, clerkUserId))
      .orderBy(desc(memberplans.createdAt))

    return { success: true, data: rows }
  } catch (error) {
    console.error('Read member plans error:', error)
    return { success: false, error: "Failed to read member plans", data: [] }
  }
}

export async function readPayments(clerkUserId: string, limit: number = 5) {
  try {
    const rows = await db
      .select()
      .from(payments)
      .where(eq(payments.clerkUserId, clerkUserId))
      .orderBy(desc(payments.paymentDate))
      .limit(limit)

    return { success: true, data: rows }
  } catch (error) {
    console.error('Read payments error:', error)
    return { success: false, error: "Failed to read payments", data: [] }
  }
}

export async function createPayment(data: {
  clerkUserId: string;
  planId: string;
  amount: number;
  paymentMethod: string;
  daysAdded: number;
  notes?: string;
  memberName?: string;
  planName?: string;
}) {
  try {
    const permission = await hasPermission(PERMISSION_MODULES.MEMBERS, PERMISSION_ACTIONS.UPDATE)
    if (!permission) {
      return { success: false, error: "You don't have permission to manage members" }
    }

    const { userId: recordedBy } = await auth()

    const [newPayment] = await db
      .insert(payments)
      .values({
        clerkUserId: data.clerkUserId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        daysAdded: data.daysAdded,
        notes: data.notes,
        recordedBy,
        isSynced: true,
      })
      .returning()

    const activePlan = await db
      .select()
      .from(memberplans)
      .where(
        and(
          eq(memberplans.clerkUserId, data.clerkUserId),
          eq(memberplans.status, "active"),
        )
      )
      .limit(1)

    if (activePlan.length > 0) {
      const existing = activePlan[0]
      const extendedEnd = new Date(existing.endDate)
      extendedEnd.setDate(extendedEnd.getDate() + data.daysAdded)

      const [updated] = await db
        .update(memberplans)
        .set({ endDate: extendedEnd, updatedAt: new Date() })
        .where(eq(memberplans.id, existing.id))
        .returning()

      await db
        .update(payments)
        .set({ memberPlanId: updated.id })
        .where(eq(payments.id, newPayment.id))
    } else {
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + data.daysAdded)

      const [newMemberPlan] = await db
        .insert(memberplans)
        .values({
          clerkUserId: data.clerkUserId,
          planId: data.planId,
          startDate,
          endDate,
          status: "active",
          isSynced: true,
        })
        .returning()

      await db
        .update(payments)
        .set({ memberPlanId: newMemberPlan.id })
        .where(eq(payments.id, newPayment.id))
    }

    revalidatePath("/staff/members")
    return { success: true, data: newPayment }
  } catch (error: any) {
    console.error('Create payment error:', error)
    return { success: false, error: error.message || "Failed to create payment" }
  }
}

export async function checkPendingSyncs() {
  try {
    const result = await db
      .select({ count: count() })
      .from(pendingSyncs)
      .where(eq(pendingSyncs.synced, false))

    return { count: Number(result[0]?.count || 0) }
  } catch {
    return { count: 0 }
  }
}

export async function markAttendance(data: {
  clerkUserId: string;
  date?: string;
  timeIn?: string;
  timeOut?: string;
  weightIn?: number;
  weightOut?: number;
  isPresent?: boolean;
}) {
  try {
    const permission = await hasPermission(PERMISSION_MODULES.MEMBERS, PERMISSION_ACTIONS.UPDATE)
    if (!permission) {
      return { success: false, error: "You don't have permission to manage members" }
    }

    const attendanceDate = data.date ? new Date(data.date) : new Date()

    const existing = await db
      .select()
      .from(memberAttendance)
      .where(
        and(
          eq(memberAttendance.clerkUserId, data.clerkUserId),
          sql`DATE(${memberAttendance.date}) = DATE(${attendanceDate.toISOString()})`,
        )
      )
      .limit(1)

    if (existing.length > 0) {
      const [updated] = await db
        .update(memberAttendance)
        .set({
          timeIn: data.timeIn ? new Date(data.timeIn) : undefined,
          timeOut: data.timeOut ? new Date(data.timeOut) : undefined,
          weightIn: data.weightIn ?? undefined,
          weightOut: data.weightOut ?? undefined,
          isPresent: data.isPresent ?? true,
          updatedAt: new Date(),
        })
        .where(eq(memberAttendance.id, existing[0].id))
        .returning()

      revalidatePath("/staff/members")
      return { success: true, data: updated }
    }

    const [created] = await db
      .insert(memberAttendance)
      .values({
        clerkUserId: data.clerkUserId,
        date: attendanceDate,
        timeIn: data.timeIn ? new Date(data.timeIn) : null,
        timeOut: data.timeOut ? new Date(data.timeOut) : null,
        weightIn: data.weightIn ?? null,
        weightOut: data.weightOut ?? null,
        isPresent: data.isPresent ?? true,
      })
      .returning()

    revalidatePath("/staff/members")
    return { success: true, data: created }
  } catch (error: any) {
    console.error("Mark attendance error:", error)
    return { success: false, error: error.message || "Failed to mark attendance" }
  }
}

export async function syncPendingRecords() {
  try {
    const permission = await hasPermission(PERMISSION_MODULES.MEMBERS, PERMISSION_ACTIONS.UPDATE)
    if (!permission) {
      return { success: false, error: "You don't have permission" }
    }

    const pending = await db
      .select()
      .from(pendingSyncs)
      .where(eq(pendingSyncs.synced, false))
      .orderBy(asc(pendingSyncs.createdAt))

    for (const record of pending) {
      try {
        const payload = JSON.parse(record.payload)

        if (record.action === "create_payment") {
          const result = await createPayment(payload)
          if (result.success) {
            await db
              .update(pendingSyncs)
              .set({ synced: true })
              .where(eq(pendingSyncs.id, record.id))
          }
        } else if (record.action === "mark_attendance") {
          const result = await markAttendance(payload)
          if (result.success) {
            await db
              .update(pendingSyncs)
              .set({ synced: true })
              .where(eq(pendingSyncs.id, record.id))
          }
        }
      } catch (parseError) {
        console.error("Failed to process pending sync:", record.id, parseError)
      }
    }

    revalidatePath("/staff/members")
    return { success: true }
  } catch (error) {
    console.error("Sync pending records error:", error)
    return { success: false, error: "Failed to sync pending records" }
  }
}

export async function readAttendanceHistory(clerkUserId: string) {
  try {
    const rows = await db
      .select()
      .from(memberAttendance)
      .where(eq(memberAttendance.clerkUserId, clerkUserId))
      .orderBy(desc(memberAttendance.date))
      .limit(100)

    return { success: true, data: rows }
  } catch (error) {
    console.error("Read attendance history error:", error)
    return { success: false, error: "Failed to read attendance history", data: [] }
  }
}

// ───────────── Plan Request Management ─────────────

export async function getPendingPlanRequests() {
  try {
    const permission = await hasPermission(PERMISSION_MODULES.MEMBERS, PERMISSION_ACTIONS.UPDATE)
    if (!permission) {
      return { success: false, error: "Permission denied", data: [] }
    }

    const rows = await db
      .select({
        id: planRequests.id,
        clerkUserId: planRequests.clerkUserId,
        planId: planRequests.planId,
        status: planRequests.status,
        amount: planRequests.amount,
        createdAt: planRequests.createdAt,
        planName: plans.name,
        planPrice: plans.price,
        planOfferPrice: plans.offerPrice,
        planBillingDays: plans.billingDays,
      })
      .from(planRequests)
      .leftJoin(plans, eq(planRequests.planId, plans.id))
      .where(eq(planRequests.status, "pending"))
      .orderBy(desc(planRequests.createdAt))

    return { success: true, data: rows }
  } catch (error) {
    console.error("Get pending plan requests error:", error)
    return { success: false, error: "Failed to load requests", data: [] }
  }
}

export async function approvePlanRequest(
  requestId: string,
  data: { amount: number; paymentMethod: string; notes?: string },
) {
  try {
    const permission = await hasPermission(PERMISSION_MODULES.MEMBERS, PERMISSION_ACTIONS.UPDATE)
    if (!permission) {
      return { success: false, error: "Permission denied" }
    }

    const { userId: approvedBy } = await auth()

    const [req] = await db
      .select()
      .from(planRequests)
      .where(and(eq(planRequests.id, requestId), eq(planRequests.status, "pending")))
      .limit(1)
    if (!req) return { success: false, error: "Request not found" }

    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, req.planId))
      .limit(1)
    if (!plan) return { success: false, error: "Plan not found" }

    const activePlanRows = await db
      .select()
      .from(memberplans)
      .where(
        and(
          eq(memberplans.clerkUserId, req.clerkUserId),
          eq(memberplans.status, "active"),
        )
      )
      .limit(1)

    let memberPlanId: string

    if (activePlanRows.length > 0) {
      const existing = activePlanRows[0]
      const extendedEnd = new Date(existing.endDate)
      extendedEnd.setDate(extendedEnd.getDate() + plan.billingDays)

      const [updated] = await db
        .update(memberplans)
        .set({ endDate: extendedEnd, updatedAt: new Date() })
        .where(eq(memberplans.id, existing.id))
        .returning()

      memberPlanId = updated.id
    } else {
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + plan.billingDays)

      const [newMemberPlan] = await db
        .insert(memberplans)
        .values({
          clerkUserId: req.clerkUserId,
          planId: req.planId,
          startDate,
          endDate,
          status: "active",
          isSynced: true,
        })
        .returning()

      memberPlanId = newMemberPlan.id
    }

    await db.insert(payments).values({
      clerkUserId: req.clerkUserId,
      memberPlanId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      daysAdded: plan.billingDays,
      status: "completed",
      notes: data.notes,
      recordedBy: approvedBy,
      paymentSource: "manual",
      isSynced: true,
    })

    await db
      .update(planRequests)
      .set({
        status: "approved",
        approvedBy,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        updatedAt: new Date(),
      })
      .where(eq(planRequests.id, requestId))

    revalidatePath("/staff/members")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Approve plan request error:", error)
    return { success: false, error: error.message || "Failed to approve request" }
  }
}

export async function rejectPlanRequest(requestId: string) {
  try {
    const permission = await hasPermission(PERMISSION_MODULES.MEMBERS, PERMISSION_ACTIONS.UPDATE)
    if (!permission) {
      return { success: false, error: "Permission denied" }
    }

    await db
      .update(planRequests)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(planRequests.id, requestId))

    revalidatePath("/staff/members")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Reject plan request error:", error)
    return { success: false, error: error.message || "Failed to reject request" }
  }
}
