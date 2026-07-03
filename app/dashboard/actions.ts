"use server"

import { auth, clerkClient } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { db } from "@/app/db"
import { plans, memberplans, memberAttendance, planRequests, gymSettings, payments } from "@/drizzle/schema"
import { eq, and, sql, desc, asc, lt, count } from "drizzle-orm"
import crypto from "crypto"

// ───────────── Plan Request (replaces direct subscribe) ─────────────

export async function requestPlan(planId: string) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Not authenticated" }

    const plan = await db
      .select()
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1)
    if (plan.length === 0) return { success: false, error: "Plan not found" }

    const [settings] = await db
      .select()
      .from(gymSettings)
      .limit(1)

    const gatewayEnabled = settings?.paymentGatewayEnabled ?? false

    if (gatewayEnabled) {
      // ── Gateway flow: create Razorpay order ──
      const totalAmount = plan[0].offerPrice ?? plan[0].price

      // @ts-ignore
      const Razorpay = (await import("razorpay")).default
      const instance = new Razorpay({
        key_id: settings?.razorpayKeyId ?? "",
        key_secret: settings?.razorpaySecretKey ?? "",
      })

      const order = await instance.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: `plan_${userId}_${Date.now()}`,
        notes: { clerkUserId: userId, planId },
      })

      const [req] = await db
        .insert(planRequests)
        .values({
          clerkUserId: userId,
          planId,
          status: "pending",
          razorpayOrderId: order.id,
          amount: totalAmount,
        })
        .returning()

      return {
        success: true,
        gateway: true,
        data: {
          requestId: req.id,
          orderId: order.id,
          amount: totalAmount,
          keyId: settings?.razorpayKeyId ?? "",
          planName: plan[0].name,
        },
      }
    }

    // ── Offline flow: create a plan request for admin/staff approval ──
    const [req] = await db
      .insert(planRequests)
      .values({
        clerkUserId: userId,
        planId,
        status: "pending",
        amount: plan[0].offerPrice ?? plan[0].price,
      })
      .returning()

    revalidatePath("/dashboard")
    return { success: true, gateway: false, data: req }
  } catch (error: any) {
    console.error("Request plan error:", error)
    return { success: false, error: error.message || "Failed to request plan" }
  }
}

export async function getMyPlanRequest() {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, data: null }

    const req = await db
      .select()
      .from(planRequests)
      .where(
        and(
          eq(planRequests.clerkUserId, userId),
          eq(planRequests.status, "pending"),
        )
      )
      .limit(1)

    if (req.length === 0) return { success: true, data: null }

    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, req[0].planId))
      .limit(1)

    return {
      success: true,
      data: {
        id: req[0].id,
        planName: plan?.name ?? "Unknown",
        status: req[0].status,
        createdAt: req[0].createdAt,
        amount: req[0].amount,
      },
    }
  } catch (error) {
    console.error("Get my plan request error:", error)
    return { success: false, error: "Failed to get request status" }
  }
}

// ───────────── Razorpay Payment Verification ─────────────

export async function verifyRazorpayPayment(
  orderId: string,
  paymentId: string,
  signature: string,
) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Not authenticated" }

    const [req] = await db
      .select()
      .from(planRequests)
      .where(
        and(
          eq(planRequests.razorpayOrderId, orderId),
          eq(planRequests.clerkUserId, userId),
          eq(planRequests.status, "pending"),
        )
      )
      .limit(1)
    if (!req) return { success: false, error: "Plan request not found" }

    const [settings] = await db
      .select()
      .from(gymSettings)
      .limit(1)

    // Verify HMAC signature
    const expectedSig = crypto
      .createHmac("sha256", settings?.razorpaySecretKey ?? "")
      .update(`${orderId}|${paymentId}`)
      .digest("hex")

    if (expectedSig !== signature) {
      return { success: false, error: "Payment verification failed" }
    }

    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, req.planId))
      .limit(1)
    if (!plan) return { success: false, error: "Plan not found" }

    // Create member plan
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + plan.billingDays)

    const [memberPlan] = await db
      .insert(memberplans)
      .values({
        clerkUserId: userId,
        planId: req.planId,
        startDate,
        endDate,
        status: "active",
        isSynced: true,
      })
      .returning()

    // Log payment
    await db.insert(payments).values({
      clerkUserId: userId,
      memberPlanId: memberPlan.id,
      amount: req.amount ?? plan.offerPrice ?? plan.price,
      paymentMethod: "razorpay",
      daysAdded: plan.billingDays,
      status: "completed",
      recordedBy: userId,
      paymentSource: "razorpay",
      isSynced: true,
    })

    // Mark request as approved
    await db
      .update(planRequests)
      .set({
        status: "approved",
        razorpayPaymentId: paymentId,
        updatedAt: new Date(),
      })
      .where(eq(planRequests.id, req.id))

    revalidatePath("/dashboard")
    return { success: true, data: memberPlan }
  } catch (error: any) {
    console.error("Verify Razorpay payment error:", error)
    return { success: false, error: error.message || "Payment verification failed" }
  }
}

// ───────────── Existing helpers (saveWeight, attendance, expiry, etc.) ─────────────

export async function saveWeight(weightIn?: number, weightOut?: number) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Not authenticated" }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existing = await db
      .select()
      .from(memberAttendance)
      .where(
        and(
          eq(memberAttendance.clerkUserId, userId),
          sql`${memberAttendance.date} >= ${today} AND ${memberAttendance.date} < ${tomorrow}`,
        )
      )
      .limit(1)

    if (existing.length > 0) {
      const [updated] = await db
        .update(memberAttendance)
        .set({
          weightIn: weightIn ?? existing[0].weightIn,
          weightOut: weightOut ?? existing[0].weightOut,
          updatedAt: new Date(),
        })
        .where(eq(memberAttendance.id, existing[0].id))
        .returning()

      revalidatePath("/dashboard")
      return { success: true, data: updated }
    }

    const [created] = await db
      .insert(memberAttendance)
      .values({
        clerkUserId: userId,
        date: new Date(),
        weightIn: weightIn ?? null,
        weightOut: weightOut ?? null,
      })
      .returning()

    revalidatePath("/dashboard")
    return { success: true, data: created }
  } catch (error: any) {
    console.error("Save weight error:", error)
    return { success: false, error: error.message || "Failed to save weight" }
  }
}

export async function getAttendanceData(
  period: "weekly" | "monthly",
  month: number,
  year: number,
  week?: number,
) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Not authenticated", data: [], stats: null }

    let startDate: Date
    let endDate: Date

    if (period === "monthly") {
      startDate = new Date(year, month - 1, 1)
      endDate = new Date(year, month, 0, 23, 59, 59)
    } else {
      const firstDay = new Date(year, month - 1, 1)
      const weekStart = (week || 1) - 1
      startDate = new Date(firstDay)
      startDate.setDate(startDate.getDate() + weekStart * 7)
      endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 6)
      endDate.setHours(23, 59, 59)
    }

    const records = await db
      .select()
      .from(memberAttendance)
      .where(
        and(
          eq(memberAttendance.clerkUserId, userId),
          sql`${memberAttendance.date} >= ${startDate} AND ${memberAttendance.date} <= ${endDate}`,
        )
      )
      .orderBy(asc(memberAttendance.date))

    const totalDays = records.length
    const presentDays = records.filter(r => r.isPresent).length
    const absentDays = totalDays - presentDays
    const totalWeightIn = records.reduce((sum, r) => sum + (r.weightIn || 0), 0)
    const totalWeightOut = records.reduce((sum, r) => sum + (r.weightOut || 0), 0)
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0

    return {
      success: true,
      data: records,
      stats: { totalDays, presentDays, absentDays, totalWeightIn, totalWeightOut, attendanceRate },
    }
  } catch (error) {
    console.error("Get attendance data error:", error)
    return { success: false, error: "Failed to get attendance data", data: [], stats: null }
  }
}

export async function checkAndExpirePlans(userId: string) {
  try {
    await db
      .update(memberplans)
      .set({ status: "expired", updatedAt: new Date() })
      .where(
        and(
          eq(memberplans.clerkUserId, userId),
          eq(memberplans.status, "active"),
          lt(memberplans.endDate, new Date()),
        )
      )
  } catch (error) {
    console.error("Check and expire plans error:", error)
  }
}

export async function getExpiringPlanInfo() {
  try {
    const { userId } = await auth()
    if (!userId) return { daysRemaining: null, planName: null, planId: null }

    await checkAndExpirePlans(userId)

    const active = await db
      .select({
        endDate: memberplans.endDate,
        planName: plans.name,
        planId: memberplans.planId,
      })
      .from(memberplans)
      .leftJoin(plans, eq(memberplans.planId, plans.id))
      .where(
        and(
          eq(memberplans.clerkUserId, userId),
          eq(memberplans.status, "active"),
        )
      )
      .limit(1)

    if (active.length === 0) return { daysRemaining: null, planName: null, planId: null }

    const daysRemaining = Math.ceil(
      (new Date(active[0].endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    )

    return { daysRemaining, planName: active[0].planName, planId: active[0].planId }
  } catch (error) {
    console.error("Get expiring plan info error:", error)
    return { daysRemaining: null, planName: null, planId: null }
  }
}

// ───────────── Profile ─────────────

export async function getProfile() {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, data: null, error: "Unauthorized" }

    const client = await clerkClient()
    const user = await client.users.getUser(userId)

    const metadata = (user.publicMetadata || {}) as Record<string, any>

    return {
      success: true,
      data: {
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.emailAddresses?.[0]?.emailAddress || "",
        phoneCode: metadata.phoneCode || "+91",
        phone: metadata.phone || "",
        whatsappSame: metadata.whatsappSame ?? true,
        whatsappCode: metadata.whatsappCode || "+91",
        whatsappPhone: metadata.whatsappPhone || "",
        dob: metadata.dob || "",
        gender: metadata.gender || "",
        bloodGroup: metadata.bloodGroup || "",
        address: metadata.address || "",
        emergencyName: metadata.emergencyName || "",
        emergencyPhone: metadata.emergencyPhone || "",
      },
    }
  } catch (error: any) {
    console.error("Get profile error:", error)
    return { success: false, data: null, error: error.message }
  }
}

export async function updateProfile(data: {
  firstName?: string
  lastName?: string
  phoneCode?: string
  phone?: string
  whatsappSame?: boolean
  whatsappCode?: string
  whatsappPhone?: string
  dob?: string
  gender?: string
  bloodGroup?: string
  address?: string
  emergencyName?: string
  emergencyPhone?: string
}) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthorized" }

    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const existingMetadata = (user.publicMetadata || {}) as Record<string, any>

    const updateData: any = {}

    if (data.firstName !== undefined) updateData.firstName = data.firstName
    if (data.lastName !== undefined) updateData.lastName = data.lastName

    if (
      data.phoneCode !== undefined ||
      data.phone !== undefined ||
      data.whatsappSame !== undefined ||
      data.whatsappCode !== undefined ||
      data.whatsappPhone !== undefined ||
      data.dob !== undefined ||
      data.gender !== undefined ||
      data.bloodGroup !== undefined ||
      data.address !== undefined ||
      data.emergencyName !== undefined ||
      data.emergencyPhone !== undefined
    ) {
      updateData.publicMetadata = {
        ...existingMetadata,
        ...(data.phoneCode !== undefined && { phoneCode: data.phoneCode }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.whatsappSame !== undefined && { whatsappSame: data.whatsappSame }),
        ...(data.whatsappCode !== undefined && { whatsappCode: data.whatsappCode }),
        ...(data.whatsappPhone !== undefined && { whatsappPhone: data.whatsappPhone }),
        ...(data.dob !== undefined && { dob: data.dob }),
        ...(data.gender !== undefined && { gender: data.gender }),
        ...(data.bloodGroup !== undefined && { bloodGroup: data.bloodGroup }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.emergencyName !== undefined && { emergencyName: data.emergencyName }),
        ...(data.emergencyPhone !== undefined && { emergencyPhone: data.emergencyPhone }),
      }
    }

    await client.users.updateUser(userId, updateData)

    revalidatePath("/dashboard/profile")
    return { success: true }
  } catch (error: any) {
    console.error("Update profile error:", error)
    return { success: false, error: error.message || "Failed to update profile" }
  }
}

// ───────────── Dashboard Settings ─────────────

export async function getDashboardSettings() {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, data: null, error: "Unauthorized" }

    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const metadata = (user.publicMetadata || {}) as Record<string, any>
    const settings = metadata.settings || {}

    return {
      success: true,
      data: {
        emailNotifications: settings.emailNotifications ?? true,
        smsNotifications: settings.smsNotifications ?? false,
        profileVisibility: settings.profileVisibility ?? "public",
      },
    }
  } catch (error: any) {
    console.error("Get dashboard settings error:", error)
    return { success: false, data: null, error: error.message }
  }
}

export async function updateDashboardSettings(data: {
  emailNotifications?: boolean
  smsNotifications?: boolean
  profileVisibility?: string
}) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthorized" }

    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const existingMetadata = (user.publicMetadata || {}) as Record<string, any>
    const existingSettings = existingMetadata.settings || {}

    await client.users.updateUser(userId, {
      publicMetadata: {
        ...existingMetadata,
        settings: {
          ...existingSettings,
          ...data,
        },
      },
    })

    revalidatePath("/dashboard/settings")
    return { success: true }
  } catch (error: any) {
    console.error("Update dashboard settings error:", error)
    return { success: false, error: error.message || "Failed to update settings" }
  }
}

// ───────────── Gym Settings (read-only for dashboard) ─────────────

export async function getGymSettings() {
  try {
    const [settings] = await db
      .select()
      .from(gymSettings)
      .limit(1)

    return {
      success: true,
      data: settings ?? null,
    }
  } catch (error) {
    console.error("Get gym settings error:", error)
    return { success: false, error: "Failed to load settings" }
  }
}
