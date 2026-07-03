"use server"

import { db } from "@/app/db"
import { equipments } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { hasPermission } from "@/app/lib/getPermission"
import { PERMISSION_ACTIONS, PERMISSION_MODULES } from "@/app/interfaces/authInterface"

const ALLOWED_EQUIPMENT_FIELDS = new Set([
  'name',
  'description',
  'category',
  'status',
  'quantity',
  'imageUrl',
  'purchaseDate',
  'lastMaintenance',
  'nextMaintenance',
  'location'
])

function toEquipmentDbInput(data: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (ALLOWED_EQUIPMENT_FIELDS.has(key) && value !== undefined) {
      if (['purchaseDate', 'lastMaintenance', 'nextMaintenance'].includes(key)) {
        if (value) {
          clean[key] = new Date(value as string)
        }
      }
      else if (key === 'quantity') {
        clean[key] = parseInt(value as string, 10) || 1
      }
      else {
        clean[key] = value
      }
    }
  }
  return clean
}

export async function createEquipment(data: any) {
  try {
    const permission = await hasPermission(PERMISSION_MODULES.EQUIPMENTS, PERMISSION_ACTIONS.CREATE)
    if (!permission) {
      return { success: false, error: "You don't have permission to create equipment" }
    }

    if (!data.name) {
      return { success: false, error: "Equipment name is required" }
    }

    if (data.quantity !== undefined && (isNaN(data.quantity) || data.quantity < 0)) {
      return { success: false, error: "Quantity must be a non-negative number" }
    }

    const dbData = toEquipmentDbInput(data)
    const [newEquipment] = await db.insert(equipments).values(dbData as any).returning()
    revalidatePath("/staff/equipment")
    return { success: true, data: newEquipment }
  } catch (error) {
    console.error('Create equipment error:', error);
    return { success: false, error: "Failed to create equipment" }
  }
}

export async function readEquipments() {
  try {
    const allEquipments = await db.select().from(equipments).orderBy(equipments.createdAt);
    return { success: true, data: allEquipments }
  } catch (error) {
    console.error('Read equipments error:', error);
    return { success: false, error: "Failed to read equipments" }
  }
}

export async function updateEquipment(id: string, data: any) {
  try {
    const permission = await hasPermission(PERMISSION_MODULES.EQUIPMENTS, PERMISSION_ACTIONS.UPDATE)
    if (!permission) {
      return { success: false, error: "You don't have permission to update equipment" }
    }

    const [existingEquipment] = await db.select()
      .from(equipments)
      .where(eq(equipments.id, id));

    if (!existingEquipment) {
      return { success: false, error: "Equipment not found" }
    }

    if (data.quantity !== undefined && (isNaN(data.quantity) || data.quantity < 0)) {
      return { success: false, error: "Quantity must be a non-negative number" }
    }

    const dbData = toEquipmentDbInput(data)

    if (Object.keys(dbData).length === 0) {
      return { success: false, error: "No valid fields to update" }
    }

    const [updatedEquipment] = await db.update(equipments)
      .set({ ...dbData, updatedAt: new Date() } as any)
      .where(eq(equipments.id, id))
      .returning()

    revalidatePath("/staff/equipment")
    return { success: true, data: updatedEquipment }
  } catch (error) {
    console.error('Update equipment error:', error);
    return { success: false, error: "Failed to update equipment" }
  }
}

export async function deleteEquipment(id: string) {
  try {
    const permission = await hasPermission(PERMISSION_MODULES.EQUIPMENTS, PERMISSION_ACTIONS.DELETE)
    if (!permission) {
      return { success: false, error: "You don't have permission to delete equipment" }
    }

    const [existingEquipment] = await db.select()
      .from(equipments)
      .where(eq(equipments.id, id));

    if (!existingEquipment) {
      return { success: false, error: "Equipment not found" }
    }

    const [deletedEquipment] = await db.delete(equipments)
      .where(eq(equipments.id, id))
      .returning()

    revalidatePath("/staff/equipment")
    return { success: true, data: deletedEquipment }
  } catch (error) {
    console.error('Delete equipment error:', error);
    return { success: false, error: "Failed to delete equipment" }
  }
}
