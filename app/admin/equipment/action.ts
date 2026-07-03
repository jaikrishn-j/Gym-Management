// /app/admin/equipments/actions.ts
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
      // Convert date strings to Date objects for timestamp fields
      if (['purchaseDate', 'lastMaintenance', 'nextMaintenance'].includes(key)) {
        if (value) {
          clean[key] = new Date(value as string)
        }
        // skip empty date strings instead of passing "" to DB
      } 
      // Ensure quantity is a number
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

// CREATE - Add a new equipment
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
        revalidatePath("/admin/equipments")
        return { success: true, data: newEquipment }
    } catch (error) {
        console.error('Create equipment error:', error);
        return { success: false, error: "Failed to create equipment" }
    }
}

// READ - Get all equipments (public access - no permission check required)
export async function readEquipments() {
    try {
        const allEquipments = await db.select().from(equipments).orderBy(equipments.createdAt);
        return { 
            success: true, 
            data: allEquipments 
        }
    } catch (error) {
        console.error('Read equipments error:', error);
        return { success: false, error: "Failed to read equipments" }
    }
}

// READ - Get single equipment by ID (public access - no permission check required)
export async function getEquipmentById(id: string) {
    try {
        const [equipment] = await db.select().from(equipments).where(eq(equipments.id, id));
        if (!equipment) {
            return { success: false, error: "Equipment not found" }
        }
        return { success: true, data: equipment }
    } catch (error) {
        console.error('Get equipment error:', error);
        return { success: false, error: "Failed to fetch equipment" }
    }
}

// READ - Get equipments by category (public access - no permission check required)
export async function getEquipmentsByCategory(category: string) {
    try {
        const categoryEquipments = await db.select()
            .from(equipments)
            .where(eq(equipments.category, category))
            .orderBy(equipments.createdAt);
        
        return { 
            success: true, 
            data: categoryEquipments 
        }
    } catch (error) {
        console.error('Get equipments by category error:', error);
        return { success: false, error: "Failed to fetch equipments by category" }
    }
}

// READ - Get equipments by status (public access - no permission check required)
export async function getEquipmentsByStatus(status: string) {
    try {
        const statusEquipments = await db.select()
            .from(equipments)
            .where(eq(equipments.status, status))
            .orderBy(equipments.createdAt);
        
        return { 
            success: true, 
            data: statusEquipments 
        }
    } catch (error) {
        console.error('Get equipments by status error:', error);
        return { success: false, error: "Failed to fetch equipments by status" }
    }
}

// UPDATE - Update an equipment
export async function updateEquipment(id: string, data: any) {
    try {
        const permission = await hasPermission(PERMISSION_MODULES.EQUIPMENTS, PERMISSION_ACTIONS.UPDATE)
        if (!permission) {
            return { success: false, error: "You don't have permission to update equipment" }
        }

        // Check if equipment exists
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
        
        revalidatePath("/admin/equipments")
        return { success: true, data: updatedEquipment }
    } catch (error) {
        console.error('Update equipment error:', error);
        return { success: false, error: "Failed to update equipment" }
    }
}

// UPDATE - Update equipment status only
export async function updateEquipmentStatus(id: string, status: string) {
    try {
        const permission = await hasPermission(PERMISSION_MODULES.EQUIPMENTS, PERMISSION_ACTIONS.UPDATE)
        if (!permission) {
            return { success: false, error: "You don't have permission to update equipment status" }
        }

        const validStatuses = ['available', 'in_use', 'maintenance', 'out_of_order', 'retired'];
        if (!validStatuses.includes(status)) {
            return { success: false, error: "Invalid status value" }
        }

        const [existingEquipment] = await db.select()
            .from(equipments)
            .where(eq(equipments.id, id));
            
        if (!existingEquipment) {
            return { success: false, error: "Equipment not found" }
        }

        const [updatedEquipment] = await db.update(equipments)
            .set({ 
                status, 
                updatedAt: new Date() 
            } as any)
            .where(eq(equipments.id, id))
            .returning()

        revalidatePath("/admin/equipments")
        return { success: true, data: updatedEquipment }
    } catch (error) {
        console.error('Update equipment status error:', error);
        return { success: false, error: "Failed to update equipment status" }
    }
}

// UPDATE - Update maintenance dates
export async function updateMaintenanceDates(
    id: string, 
    lastMaintenance?: Date | null, 
    nextMaintenance?: Date | null
) {
    try {
        const permission = await hasPermission(PERMISSION_MODULES.EQUIPMENTS, PERMISSION_ACTIONS.UPDATE)
        if (!permission) {
            return { success: false, error: "You don't have permission to update equipment maintenance" }
        }

        const [existingEquipment] = await db.select()
            .from(equipments)
            .where(eq(equipments.id, id));
            
        if (!existingEquipment) {
            return { success: false, error: "Equipment not found" }
        }

        const updateData: any = { updatedAt: new Date() };
        if (lastMaintenance !== undefined) {
            updateData.lastMaintenance = lastMaintenance;
        }
        if (nextMaintenance !== undefined) {
            updateData.nextMaintenance = nextMaintenance;
        }

        const [updatedEquipment] = await db.update(equipments)
            .set(updateData)
            .where(eq(equipments.id, id))
            .returning()

        revalidatePath("/admin/equipments")
        return { success: true, data: updatedEquipment }
    } catch (error) {
        console.error('Update maintenance dates error:', error);
        return { success: false, error: "Failed to update maintenance dates" }
    }
}

// DELETE - Delete an equipment
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

        revalidatePath("/admin/equipments")
        return { success: true, data: deletedEquipment }
    } catch (error) {
        console.error('Delete equipment error:', error);
        return { success: false, error: "Failed to delete equipment" }
    }
}

// BULK OPERATIONS

// CREATE - Bulk add equipments
export async function bulkCreateEquipments(equipmentList: any[]) {
    try {
        const permission = await hasPermission(PERMISSION_MODULES.EQUIPMENTS, PERMISSION_ACTIONS.CREATE)
        if (!permission) {
            return { success: false, error: "You don't have permission to create equipment" }
        }

        if (!equipmentList || equipmentList.length === 0) {
            return { success: false, error: "No equipment data provided" }
        }

        const dbDataList = equipmentList.map(data => toEquipmentDbInput(data));
        
        const newEquipments = await db.insert(equipments)
            .values(dbDataList as any)
            .returning()

        revalidatePath("/admin/equipments")
        return { 
            success: true, 
            data: newEquipments,
            message: `Successfully created ${newEquipments.length} equipment(s)` 
        }
    } catch (error) {
        console.error('Bulk create equipment error:', error);
        return { success: false, error: "Failed to create equipment in bulk" }
    }
}

// UPDATE - Bulk update equipment status
export async function bulkUpdateStatus(ids: string[], status: string) {
    try {
        const permission = await hasPermission(PERMISSION_MODULES.EQUIPMENTS, PERMISSION_ACTIONS.UPDATE)
        if (!permission) {
            return { success: false, error: "You don't have permission to update equipment" }
        }

        const validStatuses = ['available', 'in_use', 'maintenance', 'out_of_order', 'retired'];
        if (!validStatuses.includes(status)) {
            return { success: false, error: "Invalid status value" }
        }

        if (!ids || ids.length === 0) {
            return { success: false, error: "No equipment IDs provided" }
        }

        // Update each equipment status
        const updatedEquipments = [];
        for (const id of ids) {
            const [updated] = await db.update(equipments)
                .set({ status, updatedAt: new Date() } as any)
                .where(eq(equipments.id, id))
                .returning();
            if (updated) {
                updatedEquipments.push(updated);
            }
        }

        revalidatePath("/admin/equipments")
        return { 
            success: true, 
            data: updatedEquipments,
            message: `Successfully updated ${updatedEquipments.length} equipment(s)` 
        }
    } catch (error) {
        console.error('Bulk update status error:', error);
        return { success: false, error: "Failed to update equipment status in bulk" }
    }
}

// DELETE - Bulk delete equipments
export async function bulkDeleteEquipments(ids: string[]) {
    try {
        const permission = await hasPermission(PERMISSION_MODULES.EQUIPMENTS, PERMISSION_ACTIONS.DELETE)
        if (!permission) {
            return { success: false, error: "You don't have permission to delete equipment" }
        }

        if (!ids || ids.length === 0) {
            return { success: false, error: "No equipment IDs provided" }
        }

        const deletedEquipments = [];
        for (const id of ids) {
            const [deleted] = await db.delete(equipments)
                .where(eq(equipments.id, id))
                .returning();
            if (deleted) {
                deletedEquipments.push(deleted);
            }
        }

        revalidatePath("/admin/equipments")
        return { 
            success: true, 
            data: deletedEquipments,
            message: `Successfully deleted ${deletedEquipments.length} equipment(s)` 
        }
    } catch (error) {
        console.error('Bulk delete equipment error:', error);
        return { success: false, error: "Failed to delete equipment in bulk" }
    }
}

// STATISTICS - Get equipment statistics (public access)
export async function getEquipmentStatistics() {
    try {
        const allEquipments = await db.select().from(equipments);
        
        const statistics = {
            total: allEquipments.length,
            byStatus: {} as Record<string, number>,
            byCategory: {} as Record<string, number>,
            needsMaintenance: 0,
            totalQuantity: 0,
        };

        const today = new Date();
        
        for (const equipment of allEquipments) {
            // Count by status
            statistics.byStatus[equipment.status || 'unknown'] = 
                (statistics.byStatus[equipment.status || 'unknown'] || 0) + 1;
            
            // Count by category
            statistics.byCategory[equipment.category || 'uncategorized'] = 
                (statistics.byCategory[equipment.category || 'uncategorized'] || 0) + 1;
            
            // Count equipment needing maintenance
            if (equipment.nextMaintenance && new Date(equipment.nextMaintenance) <= today) {
                statistics.needsMaintenance++;
            }
            
            // Sum total quantity
            statistics.totalQuantity += equipment.quantity || 0;
        }

        return { 
            success: true, 
            data: statistics 
        }
    } catch (error) {
        console.error('Get equipment statistics error:', error);
        return { success: false, error: "Failed to fetch equipment statistics" }
    }
}