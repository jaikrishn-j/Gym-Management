"use server"

import { clerkClient } from "@clerk/nextjs/server"
import { db } from "@/app/db"
import { payments, memberplans, plans, planRequests, memberAttendance } from "@/drizzle/schema"
import { eq, desc, and, count, sql, gte, lte } from "drizzle-orm"

export interface DashboardStats {
  totalMembers: number
  activeMembers: number
  newMembersThisMonth: number
  totalRevenue: number
  thisMonthRevenue: number
  pendingRequests: number
  todayCheckIns: number
  activePlansCount: number
}

export interface MonthlyRevenue {
  month: string
  revenue: number
}

export interface MemberGrowth {
  month: string
  count: number
}

export interface PlanDistribution {
  name: string
  count: number
}

export interface RecentPayment {
  id: string
  clerkUserId: string
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

export interface PaymentMethodStats {
  method: string
  total: number
}

export async function getDashboardStats(): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
  try {
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [activePlans, totalRev, monthRev, pendingReqs, todayAtt, clerkUsers] = await Promise.all([
      db.select({ count: count() }).from(memberplans)
        .where(and(eq(memberplans.status, "active"), gte(memberplans.endDate, now))),
      db.select({ total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` }).from(payments)
        .where(eq(payments.status, "completed")),
      db.select({ total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` }).from(payments)
        .where(and(eq(payments.status, "completed"), gte(payments.paymentDate, firstOfMonth))),
      db.select({ count: count() }).from(planRequests).where(eq(planRequests.status, "pending")),
      db.select({ count: count() }).from(memberAttendance)
        .where(and(eq(memberAttendance.isPresent, true), gte(memberAttendance.date, todayStart),
          lte(memberAttendance.date, new Date(todayStart.getTime() + 86400000)))),
      clerkClient().then(c => c.users.getUserList({ limit: 500 })),
    ])

    const members = clerkUsers.data.filter(u => {
      const metadata = u.privateMetadata as any
      const userType = metadata?.user
      return !userType || (userType !== 'admin' && userType !== 'staff')
    })
    const newMembersThisMonth = members.filter(m => {
      const created = m.createdAt ? new Date(m.createdAt) : null
      return created && created >= firstOfMonth
    }).length

    return {
      success: true,
      data: {
        totalMembers: members.length,
        activeMembers: Number(activePlans[0]?.count || 0),
        newMembersThisMonth,
        totalRevenue: totalRev[0]?.total || 0,
        thisMonthRevenue: monthRev[0]?.total || 0,
        pendingRequests: Number(pendingReqs[0]?.count || 0),
        todayCheckIns: Number(todayAtt[0]?.count || 0),
        activePlansCount: Number(activePlans[0]?.count || 0),
      },
    }
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return { success: false, error: "Failed to load dashboard stats" }
  }
}

export async function getMonthlyRevenue(months: number = 6): Promise<{ success: boolean; data?: MonthlyRevenue[]; error?: string }> {
  try {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)
    startDate.setDate(1)

    const rows = await db
      .select({
        month: sql<string>`TO_CHAR(${payments.paymentDate}, 'Mon YY')`,
        revenue: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
        sortKey: sql<string>`TO_CHAR(${payments.paymentDate}, 'YYYY-MM')`,
      })
      .from(payments)
      .where(and(eq(payments.status, "completed"), gte(payments.paymentDate, startDate)))
      .groupBy(sql`TO_CHAR(${payments.paymentDate}, 'Mon YY')`, sql`TO_CHAR(${payments.paymentDate}, 'YYYY-MM')`)
      .orderBy(sql`MIN(${payments.paymentDate})`)

    const data: MonthlyRevenue[] = rows.map(r => ({ month: r.month, revenue: r.revenue }))
    return { success: true, data }
  } catch (error) {
    console.error("Monthly revenue error:", error)
    return { success: false, error: "Failed to load revenue data" }
  }
}

export async function getMemberGrowth(months: number = 6): Promise<{ success: boolean; data?: MemberGrowth[]; error?: string }> {
  try {
    const client = await clerkClient()
    const users = await client.users.getUserList({ limit: 500 })
    const members = users.data.filter(u => {
      const metadata = u.privateMetadata as any
      const userType = metadata?.user
      return !userType || (userType !== 'admin' && userType !== 'staff')
    })

    const monthMap = new Map<string, number>()
    for (const m of members) {
      if (!m.createdAt) continue
      const d = new Date(m.createdAt)
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      monthMap.set(key, (monthMap.get(key) || 0) + 1)
    }

    const data: MemberGrowth[] = []
    const now = new Date()
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      data.push({ month: key, count: monthMap.get(key) || 0 })
    }
    return { success: true, data }
  } catch (error) {
    console.error("Member growth error:", error)
    return { success: false, error: "Failed to load member growth data" }
  }
}

export async function getPlanDistribution(): Promise<{ success: boolean; data?: PlanDistribution[]; error?: string }> {
  try {
    const rows = await db
      .select({
        planId: memberplans.planId,
        count: count(),
        planName: plans.name,
      })
      .from(memberplans)
      .leftJoin(plans, eq(memberplans.planId, plans.id))
      .where(eq(memberplans.status, "active"))
      .groupBy(memberplans.planId, plans.name)

    return { success: true, data: rows.map(r => ({ name: r.planName || "Unknown", count: Number(r.count) })) }
  } catch (error) {
    console.error("Plan distribution error:", error)
    return { success: false, error: "Failed to load plan distribution" }
  }
}

export async function getRecentPayments(limit: number = 5): Promise<{ success: boolean; data?: RecentPayment[]; error?: string }> {
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
    const client = await clerkClient()
    let userMap = new Map<string, { firstName: string; lastName: string; imageUrl: string }>()
    if (userIds.length > 0) {
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
          id: r.id, clerkUserId: r.clerkUserId, amount: r.amount,
          paymentMethod: r.paymentMethod, paymentDate: r.paymentDate,
          memberName: user ? `${user.firstName} ${user.lastName}`.trim() : r.clerkUserId,
          memberImageUrl: user?.imageUrl ?? "",
          planName: r.planId ? (planMap.get(r.planId) ?? null) : null,
        }
      }),
    }
  } catch (error) {
    console.error("Recent payments error:", error)
    return { success: false, error: "Failed to load recent payments" }
  }
}

export async function getAttendanceTrend(days: number = 7): Promise<{ success: boolean; data?: AttendanceTrend[]; error?: string }> {
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
    console.error("Attendance trend error:", error)
    return { success: false, error: "Failed to load attendance data" }
  }
}

export async function getPaymentMethodBreakdown(): Promise<{ success: boolean; data?: PaymentMethodStats[]; error?: string }> {
  try {
    const rows = await db
      .select({ method: payments.paymentMethod, total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` })
      .from(payments)
      .where(eq(payments.status, "completed"))
      .groupBy(payments.paymentMethod)

    return { success: true, data: rows.map(r => ({ method: r.method, total: r.total })) }
  } catch (error) {
    console.error("Payment method breakdown error:", error)
    return { success: false, error: "Failed to load payment method data" }
  }
}
