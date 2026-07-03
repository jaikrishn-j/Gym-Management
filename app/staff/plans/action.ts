"use server"

import { db } from "@/app/db"
import { plans } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { hasPermission } from "@/app/lib/getPermission"
import { PERMISSION_ACTIONS, PERMISSION_MODULES } from "@/app/interfaces/authInterface"

const ALLOWED_PLAN_FIELDS = new Set(['name', 'description', 'price', 'offerPrice', 'billingDays', 'features'])

function toPlanDbInput(data: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (key === 'description') {
      clean.descripttion = value
    } else if (ALLOWED_PLAN_FIELDS.has(key)) {
      clean[key] = value
    }
  }
  return clean
}

function mapDbToPlan(dbRecord: any): any {
  return {
    ...dbRecord,
    description: dbRecord.descripttion ?? dbRecord.description,
  };
}

export async function createPlan(data: any) {
  try {
    const permission = await hasPermission(PERMISSION_MODULES.PLANS, PERMISSION_ACTIONS.CREATE)
    if (!permission) {
      return { success: false, error: "You don't have permission to create plans" }
    }

    if (!data.name || !data.description || !data.price || !data.billingDays || !data.features?.length) {
      return { success: false, error: "Missing required fields" }
    }

    const dbData = toPlanDbInput(data)
    const [newPlan] = await db.insert(plans).values(dbData as any).returning()
    revalidatePath("/staff/plans")
    return { success: true, data: mapDbToPlan(newPlan) }
  } catch (error) {
    console.error('Create plan error:', error);
    return { success: false, error: "Failed to create plan" }
  }
}

export async function readPlans() {
  try {
    const allPlans = await db.select().from(plans).orderBy(plans.createdAt);
    return {
      success: true,
      data: allPlans.map(mapDbToPlan)
    }
  } catch (error) {
    console.error('Read plans error:', error);
    return { success: false, error: "Failed to read plans" }
  }
}

export async function updatePlan(id: string, data: any) {
  try {
    const permission = await hasPermission(PERMISSION_MODULES.PLANS, PERMISSION_ACTIONS.UPDATE)
    if (!permission) {
      return { success: false, error: "You don't have permission to update plans" }
    }

    const dbData = toPlanDbInput(data)

    if (Object.keys(dbData).length === 0) {
      return { success: false, error: "No valid fields to update" }
    }

    const [updatedPlan] = await db.update(plans)
      .set({ ...dbData, updatedAt: new Date() })
      .where(eq(plans.id, id))
      .returning()

    if (!updatedPlan) {
      return { success: false, error: "Plan not found" }
    }

    revalidatePath("/staff/plans")
    return { success: true, data: mapDbToPlan(updatedPlan) }
  } catch (error) {
    console.error('Update plan error:', error);
    return { success: false, error: "Failed to update plan" }
  }
}

export async function deletePlan(id: string) {
  try {
    const permission = await hasPermission(PERMISSION_MODULES.PLANS, PERMISSION_ACTIONS.DELETE)
    if (!permission) {
      return { success: false, error: "You don't have permission to delete plans" }
    }

    const [deletedPlan] = await db.delete(plans)
      .where(eq(plans.id, id))
      .returning()

    if (!deletedPlan) {
      return { success: false, error: "Plan not found" }
    }

    revalidatePath("/staff/plans")
    return { success: true, data: mapDbToPlan(deletedPlan) }
  } catch (error) {
    console.error('Delete plan error:', error);
    return { success: false, error: "Failed to delete plan" }
  }
}
