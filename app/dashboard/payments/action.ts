"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/app/db"
import { payments } from "@/drizzle/schema"
import { eq, desc } from "drizzle-orm"

interface Payment {
  id: string;
  clerkUserId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  daysAdded: number;
  status: string;
  notes: string | null;
  isSynced: boolean;
}

interface PaymentStats {
  totalSpent: number;
  totalPayments: number;
  averagePayment: number;
  lastPayment: Payment | null;
  thisMonthSpent: number;
  lastMonthSpent: number;
  paymentMethods: {
    cash: number;
    upi: number;
    card: number;
  };
  monthlyBreakdown: {
    month: string;
    amount: number;
    count: number;
  }[];
}

function mapPayment(row: any): Payment {
  return {
    id: row.id,
    clerkUserId: row.clerkUserId,
    amount: row.amount,
    paymentMethod: row.paymentMethod,
    paymentDate: row.paymentDate instanceof Date ? row.paymentDate.toISOString() : row.paymentDate,
    daysAdded: row.daysAdded,
    status: row.status,
    notes: row.notes,
    isSynced: row.isSynced,
  }
}

export async function readPayments(): Promise<{
  success: boolean;
  error?: string;
  payments: Payment[];
  stats: PaymentStats | null;
}> {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Not authenticated", payments: [], stats: null }

    const rows = await db
      .select()
      .from(payments)
      .where(eq(payments.clerkUserId, userId))
      .orderBy(desc(payments.paymentDate))

    const paymentList = rows.map(mapPayment)

    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear

    const thisMonthPayments = paymentList.filter(p => {
      const d = new Date(p.paymentDate)
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear
    })

    const lastMonthPayments = paymentList.filter(p => {
      const d = new Date(p.paymentDate)
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear
    })

    const totalSpent = paymentList.reduce((sum, p) => sum + p.amount, 0)
    const thisMonthSpent = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0)
    const lastMonthSpent = lastMonthPayments.reduce((sum, p) => sum + p.amount, 0)

    const paymentMethods = {
      cash: paymentList.filter(p => p.paymentMethod === 'cash').length,
      upi: paymentList.filter(p => p.paymentMethod === 'upi').length,
      card: paymentList.filter(p => p.paymentMethod === 'card').length,
    }

    const monthlyMap = new Map<string, { amount: number; count: number }>()
    for (const p of paymentList) {
      const d = new Date(p.paymentDate)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const existing = monthlyMap.get(key) || { amount: 0, count: 0 }
      existing.amount += p.amount
      existing.count += 1
      monthlyMap.set(key, existing)
    }

    const monthlyBreakdown = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, data]) => ({
        month,
        amount: data.amount,
        count: data.count,
      }))

    const stats: PaymentStats = {
      totalSpent,
      totalPayments: paymentList.length,
      averagePayment: paymentList.length > 0 ? Math.round(totalSpent / paymentList.length) : 0,
      lastPayment: paymentList.length > 0 ? paymentList[0] : null,
      thisMonthSpent,
      lastMonthSpent,
      paymentMethods,
      monthlyBreakdown,
    }

    return { success: true, payments: paymentList, stats }
  } catch (error) {
    console.error("Read payments error:", error)
    return { success: false, error: "Failed to load payments", payments: [], stats: null }
  }
}
