"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { db } from "@/app/db"
import { gymSettings, GymSettings } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { hasPermission } from "@/app/lib/getPermission"
import { PERMISSION_ACTIONS, PERMISSION_MODULES } from "@/app/interfaces/authInterface"

export async function readSettings() {
  try {
    const rows = await db
      .select()
      .from(gymSettings)
      .limit(1)

    return { success: true, data: rows.length > 0 ? rows[0] as GymSettings : null }
  } catch (error) {
    console.error("Read settings error:", error)
    return { success: false, error: "Failed to load settings" }
  }
}

export async function updateSettings(data: {
  initialPaymentAmount?: number
  paymentGatewayEnabled?: boolean
  razorpayKeyId?: string
  razorpaySecretKey?: string
}) {
  try {
    const permission = await hasPermission(PERMISSION_MODULES.MEMBERS, PERMISSION_ACTIONS.UPDATE)
    if (!permission) {
      return { success: false, error: "Permission denied" }
    }

    const [existing] = await db
      .select()
      .from(gymSettings)
      .limit(1)

    if (existing) {
      await db
        .update(gymSettings)
        .set(data)
        .where(eq(gymSettings.id, "singleton"))
    } else {
      await db
        .insert(gymSettings)
        .values({ id: "singleton", ...data })
    }

    revalidatePath("/admin/settings")
    return { success: true }
  } catch (error: any) {
    console.error("Update settings error:", error)
    return { success: false, error: error.message || "Failed to update settings" }
  }
}
