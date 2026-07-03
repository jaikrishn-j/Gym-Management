"use server"

import { clerkClient } from "@clerk/nextjs/server"
import { db } from "@/app/db"
import { payments, memberplans, plans, planRequests, memberAttendance } from "@/drizzle/schema"
import { eq, and, count, sql, gte, lte, desc } from "drizzle-orm"
import { hasPermission } from "@/app/lib/getPermission"
import { PERMISSION_ACTIONS, PERMISSION_MODULES } from "@/app/interfaces/authInterface"

export interface DashboardStats {
  totalMembers?: number
  activeMembers?: number
  totalRevenue?: number
  thisMonthRevenue?: number
  pendingRequests?: number
  todayCheckIns?: number
  activePlansCount?: number
  canViewAnalytics: boolean
}

export interface MonthlyRevenue {
  month: string
  revenue: number
}

export interface PlanDistribution {
  name: string
  count: number
}

export interface RecentPayment {
  id: string
  amount: number
  paymentMethod: string
  paymentDate: Date
  memberName: string
  memberImageUrl: string
  planName: string | null
}

export interface AttendanceTrend {
  date: string
  checkIns: number
}

export async function getDashboardStats(): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
  try {
    const [canReadMembers, canReadPayments, canUpdateMembers, canViewAnalytics] = await Promise.all([
      hasPermission(PERMISSION_MODULES.MEMBERS, PERMISSION_ACTIONS.READ),
      hasPermission(PERMISSION_MODULES.PAYMENTS, PERMISSION_ACTIONS.READ),
      hasPermission(PERMISSION_MODULES.MEMBERS, PERMISSION_ACTIONS.UPDATE),
      hasPermission(PERMISSION_MODULES.ANALYTICS, PERMISSION_ACTIONS.READ),
    ])

    const stats: DashboardStats = { canViewAnalytics: false }
    const now = new Date()
    const queries: Promise<any>[] = []

    if (canReadMembers) {
      queries.push(
        db.select({ count: count() }).from(memberplans)
          .where(and(eq(memberplans.status, "active"), gte(memberplans.endDate, now))),
        db.select({ count: count() }).from(memberAttendance)
          .where(and(eq(memberAttendance.isPresent, true),
            gte(memberAttendance.date, new Date(now.getFullYear(), now.getMonth(), now.getDate())),
            lte(memberAttendance.date, new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)))),
      )
    }
    if (canReadPayments) {
      queries.push(
        db.select({ total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` }).from(payments)
          .where(eq(payments.status, "completed")),
        db.select({ total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` }).from(payments)
          .where(and(eq(payments.status, "completed"),
            gte(payments.paymentDate, new Date(now.getFullYear(), now.getMonth(), 1)))),
      )
    }
    if (canUpdateMembers) {
      queries.push(
        db.select({ count: count() }).from(planRequests).where(eq(planRequests.status, "pending")),
      )
    }

    const results = await Promise.all(queries)
    let idx = 0

    if (canReadMembers) {
      const client = await clerkClient()
      const users = await client.users.getUserList({ limit: 500 })
      const members = users.data.filter(u => {
        const metadata = u.privateMetadata as any
        const userType = metadata?.user
        return !userType || (userType !== 'admin' && userType !== 'staff')
      })
      stats.totalMembers = members.length
      stats.activeMembers = Number(results[idx][0]?.count || 0)
      stats.activePlansCount = Number(results[idx][0]?.count || 0)
      idx++
      stats.todayCheckIns = Number(results[idx][0]?.count || 0)
      idx++
    }
    if (canReadPayments) {
      stats.totalRevenue = results[idx][0]?.total || 0
      idx++
      stats.thisMonthRevenue = results[idx][0]?.total || 0
      idx++
    }
    if (canUpdateMembers) {
      stats.pendingRequests = Number(results[idx][0]?.count || 0)
    }

    return {
      success: true,
      data: {
        ...stats,
        canViewAnalytics,
      },
    }
  } catch (error) {
    console.error("Staff dashboard stats error:", error)
    return { success: false, error: "Failed to load dashboard stats" }
  }
}

export async function getMonthlyRevenue(months: number = 6): Promise<{ success: boolean; data?: MonthlyRevenue[]; error?: string }> {
  const canReadPayments = await hasPermission(PERMISSION_MODULES.PAYMENTS, PERMISSION_ACTIONS.READ)
  if (!canReadPayments) return { success: false, error: "Permission denied" }

  try {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)
    startDate.setDate(1)

    const rows = await db
      .select({
        month: sql<string>`TO_CHAR(${payments.paymentDate}, 'Mon YY')`,
        revenue: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
      })
      .from(payments)
      .where(and(eq(payments.status, "completed"), gte(payments.paymentDate, startDate)))
      .groupBy(sql`TO_CHAR(${payments.paymentDate}, 'Mon YY')`, sql`TO_CHAR(${payments.paymentDate}, 'YYYY-MM')`)
      .orderBy(sql`MIN(${payments.paymentDate})`)

    return { success: true, data: rows.map(r => ({ month: r.month, revenue: r.revenue })) }
  } catch (error) {
    console.error("Staff monthly revenue error:", error)
    return { success: false, error: "Failed to load revenue data" }
  }
}

export async function getPlanDistribution(): Promise<{ success: boolean; data?: PlanDistribution[]; error?: string }> {
  const canReadMembers = await hasPermission(PERMISSION_MODULES.MEMBERS, PERMISSION_ACTIONS.READ)
  if (!canReadMembers) return { success: false, error: "Permission denied" }

  try {
    const rows = await db
      .select({
        planId: memberplans.planId, count: count(), planName: plans.name,
      })
      .from(memberplans)
      .leftJoin(plans, eq(memberplans.planId, plans.id))
      .where(eq(memberplans.status, "active"))
      .groupBy(memberplans.planId, plans.name)

    return { success: true, data: rows.map(r => ({ name: r.planName || "Unknown", count: Number(r.count) })) }
  } catch (error) {
    console.error("Staff plan distribution error:", error)
    return { success: false, error: "Failed to load plan distribution" }
  }
}

export async function getRecentPayments(limit: number = 5): Promise<{ success: boolean; data?: RecentPayment[]; error?: string }> {
  const canReadPayments = await hasPermission(PERMISSION_MODULES.PAYMENTS, PERMISSION_ACTIONS.READ)
  if (!canReadPayments) return { success: false, error: "Permission denied" }

  try {
    const rows = await db
      .select({
        id: payments.id, clerkUserId: payments.clerkUserId, amount: payments.amount,
        paymentMethod: payments.paymentMethod, paymentDate: payments.paymentDate,
        planId: memberplans.planId,
      })
      .from(payments)
      .leftJoin(memberplans, eq(payments.memberPlanId ?? "", memberplans.id))
      .where(eq(payments.status, "completed"))
      .orderBy(desc(payments.paymentDate))
      .limit(limit)

    const userIds = [...new Set(rows.map(r => r.clerkUserId))]
    let userMap = new Map<string, { firstName: string; lastName: string; imageUrl: string }>()
    if (userIds.length > 0) {
      const client = await clerkClient()
      const users = await client.users.getUserList({ userId: userIds })
      for (const u of users.data) {
        userMap.set(u.id, { firstName: u.firstName ?? "", lastName: u.lastName ?? "", imageUrl: u.imageUrl })
      }
    }

    const planRows = await db.select({ id: plans.id, name: plans.name }).from(plans)
    const planMap = new Map(planRows.map(p => [p.id, p.name]))

    return {
      success: true,
      data: rows.map(r => {
        const user = userMap.get(r.clerkUserId)
        return {
          id: r.id, amount: r.amount, paymentMethod: r.paymentMethod, paymentDate: r.paymentDate,
          memberName: user ? `${user.firstName} ${user.lastName}`.trim() : r.clerkUserId,
          memberImageUrl: user?.imageUrl ?? "",
          planName: r.planId ? (planMap.get(r.planId) ?? null) : null,
        }
      }),
    }
  } catch (error) {
    console.error("Staff recent payments error:", error)
    return { success: false, error: "Failed to load recent payments" }
  }
}

export async function getAttendanceTrend(days: number = 7): Promise<{ success: boolean; data?: AttendanceTrend[]; error?: string }> {
  const canReadMembers = await hasPermission(PERMISSION_MODULES.MEMBERS, PERMISSION_ACTIONS.READ)
  if (!canReadMembers) return { success: false, error: "Permission denied" }

  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    const rows = await db
      .select({
        dateLabel: sql<string>`TO_CHAR(${memberAttendance.date}, 'Mon DD')`,
        checkIns: count(),
        sortKey: sql<string>`TO_CHAR(${memberAttendance.date}, 'MM-DD')`,
      })
      .from(memberAttendance)
      .where(and(eq(memberAttendance.isPresent, true), gte(memberAttendance.date, startDate)))
      .groupBy(sql`TO_CHAR(${memberAttendance.date}, 'Mon DD')`, sql`TO_CHAR(${memberAttendance.date}, 'MM-DD')`)
      .orderBy(sql`MIN(${memberAttendance.date})`)

    const dataMap = new Map(rows.map(r => [r.sortKey, { date: r.dateLabel, checkIns: Number(r.checkIns) }]))
    const data: AttendanceTrend[] = []
    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const key = d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      data.push(dataMap.get(key) || { date: label, checkIns: 0 })
    }
    return { success: true, data }
  } catch (error) {
    console.error("Staff attendance trend error:", error)
    return { success: false, error: "Failed to load attendance data" }
  }
}
