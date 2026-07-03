"use server"

import { clerkClient } from "@clerk/nextjs/server"
import { db } from "@/app/db"
import { payments, memberplans, plans } from "@/drizzle/schema"
import { eq, desc, and } from "drizzle-orm"

export interface EnrichedPayment {
  id: string
  clerkUserId: string
  amount: number
  paymentMethod: string
  paymentDate: Date
  daysAdded: number
  status: string
  recordedBy: string | null
  recorderName: string
  recorderEmail: string
  notes: string | null
  paymentSource: string
  isSynced: boolean
  createdAt: Date
  memberName: string
  memberEmail: string
  memberImageUrl: string
  planName: string | null
}

export interface PaymentStats {
  totalRevenue: number
  thisMonthRevenue: number
  totalPayments: number
  thisMonthPayments: number
  methodBreakdown: Record<string, number>
  sourceBreakdown: Record<string, number>
}

export interface PaymentsResponse {
  payments: EnrichedPayment[]
  totalCount: number
  stats: PaymentStats | null
}

export async function readAllPayments(
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    search?: string
    paymentMethod?: string
    paymentSource?: string
  },
): Promise<{ success: boolean; data?: PaymentsResponse; error?: string }> {
  try {
    // Build DB-level where conditions (columns that exist in the DB)
    const conditions = []
    if (filters?.paymentMethod) {
      conditions.push(eq(payments.paymentMethod, filters.paymentMethod))
    }
    if (filters?.paymentSource) {
      conditions.push(eq(payments.paymentSource, filters.paymentSource))
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined

    // Fetch ALL matching rows (no limit/offset — enrichment & search filter need full dataset)
    const rows = await db
      .select({
        id: payments.id,
        clerkUserId: payments.clerkUserId,
        amount: payments.amount,
        paymentMethod: payments.paymentMethod,
        paymentDate: payments.paymentDate,
        daysAdded: payments.daysAdded,
        status: payments.status,
        recordedBy: payments.recordedBy,
        notes: payments.notes,
        paymentSource: payments.paymentSource,
        isSynced: payments.isSynced,
        createdAt: payments.createdAt,
        planId: memberplans.planId,
      })
      .from(payments)
      .leftJoin(memberplans, eq(payments.memberPlanId ?? "", memberplans.id))
      .where(where)
      .orderBy(desc(payments.paymentDate))

    // Enrich with Clerk user data
    const userIds = [...new Set(rows.map(r => r.clerkUserId))]
    const client = await clerkClient()
    const userMap = new Map<string, { firstName: string; lastName: string; email: string; imageUrl: string }>()

    if (userIds.length > 0) {
      const users = await client.users.getUserList({ userId: userIds })
      for (const u of users.data) {
        userMap.set(u.id, {
          firstName: u.firstName ?? "",
          lastName: u.lastName ?? "",
          email: u.emailAddresses?.[0]?.emailAddress ?? "",
          imageUrl: u.imageUrl,
        })
      }
    }

    // Enrich recorder names
    const recordedByIds = [...new Set(rows.map(r => r.recordedBy).filter(Boolean) as string[])]
    const recorderMap = new Map<string, { firstName: string; lastName: string; email: string }>()
    if (recordedByIds.length > 0) {
      const recorders = await client.users.getUserList({ userId: recordedByIds })
      for (const u of recorders.data) {
        recorderMap.set(u.id, {
          firstName: u.firstName ?? "",
          lastName: u.lastName ?? "",
          email: u.emailAddresses?.[0]?.emailAddress ?? "",
        })
      }
    }

    const planRows = await db.select().from(plans)
    const planMap = new Map(planRows.map(p => [p.id, p.name]))

    const enriched: EnrichedPayment[] = rows.map(r => {
      const user = userMap.get(r.clerkUserId)
      const recorder = r.recordedBy ? recorderMap.get(r.recordedBy) : undefined
      const planName = r.planId ? (planMap.get(r.planId) ?? null) : null
      return {
        id: r.id,
        clerkUserId: r.clerkUserId,
        amount: r.amount,
        paymentMethod: r.paymentMethod,
        paymentDate: r.paymentDate,
        daysAdded: r.daysAdded,
        status: r.status,
        recordedBy: r.recordedBy,
        recorderName: recorder ? `${recorder.firstName} ${recorder.lastName}`.trim() : "",
        recorderEmail: recorder?.email ?? "",
        notes: r.notes,
        paymentSource: r.paymentSource,
        isSynced: r.isSynced,
        createdAt: r.createdAt,
        memberName: user ? `${user.firstName} ${user.lastName}`.trim() : r.clerkUserId,
        memberEmail: user?.email ?? "",
        memberImageUrl: user?.imageUrl ?? "",
        planName,
      }
    })

    // Client-side search for member name/email
    let filtered = enriched
    if (filters?.search) {
      const q = filters.search.toLowerCase()
      filtered = enriched.filter(
        p =>
          p.memberName.toLowerCase().includes(q) ||
          p.memberEmail.toLowerCase().includes(q),
      )
    }

    // Build stats from filtered data
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const methodBreakdown: Record<string, number> = {}
    const sourceBreakdown: Record<string, number> = {}
    let totalRevenue = 0
    let thisMonthRevenue = 0
    let thisMonthPayments = 0

    for (const p of filtered) {
      totalRevenue += p.amount
      methodBreakdown[p.paymentMethod] = (methodBreakdown[p.paymentMethod] ?? 0) + p.amount
      sourceBreakdown[p.paymentSource] = (sourceBreakdown[p.paymentSource] ?? 0) + p.amount
      if (new Date(p.paymentDate) >= firstOfMonth) {
        thisMonthRevenue += p.amount
        thisMonthPayments++
      }
    }

    // Apply pagination
    const offset = (page - 1) * pageSize
    const paginated = filtered.slice(offset, offset + pageSize)

    return {
      success: true,
      data: {
        payments: paginated,
        totalCount: filtered.length,
        stats: {
          totalRevenue,
          thisMonthRevenue,
          totalPayments: filtered.length,
          thisMonthPayments,
          methodBreakdown,
          sourceBreakdown,
        },
      },
    }
  } catch (error) {
    console.error("Read all payments error:", error)
    return { success: false, error: "Failed to load payments" }
  }
}
