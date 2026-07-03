"use server"

import { auth } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { db } from "@/app/db"
import { broadcasts, broadcastReads } from "@/drizzle/schema"
import { eq, and, inArray, desc } from "drizzle-orm"
import { USER_TYPES } from "@/app/interfaces/authInterface"

export async function createBroadcast(data: {
  title: string
  message: string
  target: 'staff' | 'members' | 'both'
}) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthorized" }

    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const metadata = user.privateMetadata as any
    if (metadata?.user !== USER_TYPES.ADMIN) {
      return { success: false, error: "Only admins can send broadcasts" }
    }

    await db.insert(broadcasts).values({
      title: data.title,
      message: data.message,
      target: data.target,
      sentBy: userId,
    })

    revalidatePath("/admin/broadcast")
    return { success: true }
  } catch (error: any) {
    console.error("Create broadcast error:", error)
    return { success: false, error: error.message || "Failed to send broadcast" }
  }
}

export async function getUnreadBroadcasts(target: 'staff' | 'member') {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, data: [], error: "Unauthorized" }

    const reads = await db
      .select({ broadcastId: broadcastReads.broadcastId })
      .from(broadcastReads)
      .where(eq(broadcastReads.clerkUserId, userId))

    const readIds = reads.map(r => r.broadcastId)

    const targetCondition = target === 'staff'
      ? inArray(broadcasts.target, ['staff', 'both'])
      : inArray(broadcasts.target, ['members', 'both'])

    let allBroadcasts = await db
      .select()
      .from(broadcasts)
      .where(targetCondition)
      .orderBy(desc(broadcasts.createdAt))
      .limit(50)

    if (readIds.length > 0) {
      allBroadcasts = allBroadcasts.filter(b => !readIds.includes(b.id))
    }

    return { success: true, data: allBroadcasts }
  } catch (error: any) {
    console.error("Get unread broadcasts error:", error)
    return { success: false, data: [], error: error.message }
  }
}

export async function getSentBroadcasts() {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, data: [], error: "Unauthorized" }

    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const metadata = user.privateMetadata as any
    if (metadata?.user !== USER_TYPES.ADMIN) {
      return { success: false, data: [], error: "Only admins can view broadcasts" }
    }

    const all = await db
      .select()
      .from(broadcasts)
      .orderBy(desc(broadcasts.createdAt))
      .limit(100)

    return { success: true, data: all }
  } catch (error: any) {
    console.error("Get sent broadcasts error:", error)
    return { success: false, data: [], error: error.message }
  }
}

export async function getMemberMessages() {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, data: [], error: "Unauthorized" }

    const reads = await db
      .select({ broadcastId: broadcastReads.broadcastId })
      .from(broadcastReads)
      .where(eq(broadcastReads.clerkUserId, userId))

    const readIds = new Set(reads.map(r => r.broadcastId))

    const all = await db
      .select()
      .from(broadcasts)
      .where(inArray(broadcasts.target, ['members', 'both']))
      .orderBy(desc(broadcasts.createdAt))
      .limit(100)

    const data = all.map(b => ({
      ...b,
      isRead: readIds.has(b.id),
    }))

    return { success: true, data }
  } catch (error: any) {
    console.error("Get member messages error:", error)
    return { success: false, data: [], error: error.message }
  }
}

export async function markBroadcastRead(broadcastId: string) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthorized" }

    const existing = await db
      .select()
      .from(broadcastReads)
      .where(
        and(
          eq(broadcastReads.broadcastId, broadcastId),
          eq(broadcastReads.clerkUserId, userId)
        )
      )
      .limit(1)

    if (existing.length === 0) {
      await db.insert(broadcastReads).values({
        broadcastId,
        clerkUserId: userId,
      })
    }

    return { success: true }
  } catch (error: any) {
    console.error("Mark broadcast read error:", error)
    return { success: false, error: error.message }
  }
}
