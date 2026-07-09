"use server"

import { clerkClient } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { hasPermission } from "@/app/lib/getPermission"
import { PERMISSION_ACTIONS, PERMISSION_MODULES, ClerkPrivateMetadata } from "@/app/interfaces/authInterface"
import { Staff, StaffPermissions, Permission } from "@/app/interfaces/StaffInterface"

const DEFAULT_PERMISSIONS: StaffPermissions = {
  plans: [],
  equipments: [],
  payments: [],
  analytics: [],
  calendar: [],
  members: [],
  staffs: [],
  permissions: [],
}

function mapClerkUserToStaff(user: any): Staff | null {
  const metadata = user.privateMetadata as ClerkPrivateMetadata | undefined
  const userType = metadata?.user

  // Skip users who are not staff or admin (i.e., regular members)
  if (!userType || (userType !== 'admin' && userType !== 'staff')) {
    return null
  }

  const permissions = metadata?.permission || {}

  return {
    id: user.id,
    email: user.emailAddresses?.[0]?.emailAddress || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    role: userType,
    permissions: {
      plans: (permissions.plans || []) as Permission[],
      equipments: (permissions.equipments || []) as Permission[],
      payments: (permissions.payments || []) as Permission[],
      analytics: (permissions.analytics || []) as Permission[],
      calendar: (permissions.calendar || []) as Permission[],
      members: (permissions.members || []) as Permission[],
      staffs: (permissions.staffs || []) as Permission[],
      permissions: (permissions.permissions || []) as Permission[],
    },
    status: user.banned ? 'inactive' : 'active',
  }
}

export async function readStaffs() {
  try {
    const permission = await hasPermission(PERMISSION_MODULES.STAFFS, PERMISSION_ACTIONS.READ)
    if (!permission) {
      return { success: false, error: "You don't have permission to view staff" }
    }

    const client = await clerkClient()
    const users = await client.users.getUserList()

    const staffs = users.data
      .map(mapClerkUserToStaff)
      .filter((s): s is Staff => s !== null)

    return { success: true, data: staffs }
  } catch (error) {
    console.error('Read staffs error:', error)
    return { success: false, error: "Failed to read staffs" }
  }
}

export async function createStaff(data: any) {
  try {
    const permission = await hasPermission(PERMISSION_MODULES.STAFFS, PERMISSION_ACTIONS.CREATE)
    if (!permission) {
      return { success: false, error: "You don't have permission to create staff" }
    }

    if (!data.firstName || !data.lastName || !data.email) {
      return { success: false, error: "Missing required fields" }
    }

    const client = await clerkClient()
    const user = await client.users.createUser({
      emailAddress: [data.email],
      firstName: data.firstName,
      lastName: data.lastName,
      skipPasswordRequirement: true,
      privateMetadata: {
        user: data.role || 'staff',
        permission: data.permissions || DEFAULT_PERMISSIONS,
      } as any,
    })

    revalidatePath("/admin/trainers")
    return { success: true, data: mapClerkUserToStaff(user)! }
  } catch (error: any) {
    console.error('Create staff error:', error)
    return { success: false, error: error?.errors?.[0]?.message || "Failed to create staff" }
  }
}

export async function updateStaff(id: string, data: any) {
  try {
    const permission = await hasPermission(PERMISSION_MODULES.STAFFS, PERMISSION_ACTIONS.UPDATE)
    if (!permission) {
      return { success: false, error: "You don't have permission to update staff" }
    }

    const client = await clerkClient()

    const updateParams: any = {}
    if (data.firstName) updateParams.firstName = data.firstName
    if (data.lastName) updateParams.lastName = data.lastName

    if (Object.keys(updateParams).length > 0) {
      await client.users.updateUser(id, updateParams)
    }

    await client.users.updateUserMetadata(id, {
      privateMetadata: {
        user: data.role || 'staff',
        permission: data.permissions || DEFAULT_PERMISSIONS,
      } as any,
    })

    const updatedUser = await client.users.getUser(id)
    revalidatePath("/admin/trainers")
    return { success: true, data: mapClerkUserToStaff(updatedUser)! }
  } catch (error: any) {
    console.error('Update staff error:', error)
    return { success: false, error: error?.errors?.[0]?.message || "Failed to update staff" }
  }
}

export async function deleteStaff(id: string) {
  try {
    const permission = await hasPermission(PERMISSION_MODULES.STAFFS, PERMISSION_ACTIONS.DELETE)
    if (!permission) {
      return { success: false, error: "You don't have permission to delete staff" }
    }

    const client = await clerkClient()
    await client.users.deleteUser(id)

    revalidatePath("/admin/trainers")
    return { success: true, data: { id } }
  } catch (error: any) {
    console.error('Delete staff error:', error)
    return { success: false, error: error?.errors?.[0]?.message || "Failed to delete staff" }
  }
}

export async function toggleStaffStatus(id: string) {
  try {
    const permission = await hasPermission(PERMISSION_MODULES.STAFFS, PERMISSION_ACTIONS.UPDATE)
    if (!permission) {
      return { success: false, error: "You don't have permission to modify staff" }
    }

    const client = await clerkClient()
    const user = await client.users.getUser(id)

    const updatedUser = user.banned
      ? await client.users.unbanUser(id)
      : await client.users.banUser(id)

    revalidatePath("/admin/trainers")
    return { success: true, data: mapClerkUserToStaff(updatedUser)! }
  } catch (error: any) {
    console.error('Toggle staff status error:', error)
    return { success: false, error: error?.errors?.[0]?.message || "Failed to toggle staff status" }
  }
}

export async function generateResetLink(staffId: string, email: string) {
  try {
    const permission = await hasPermission(PERMISSION_MODULES.STAFFS, PERMISSION_ACTIONS.UPDATE)
    if (!permission) {
      return { success: false, error: "You don't have permission to generate reset links" }
    }

    const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY

    // Create a sign-in token directly — works for all users (with or without password)
    // Sign-in tokens are one-time use. Admin generates a fresh token each time.
    const response = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: staffId, expires_in_seconds: 86400 }),
    })

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      try {
        const errData = await response.json()
        errorMessage = errData.errors?.[0]?.message || errorMessage
      } catch {
        try {
          const text = await response.text()
          if (text) errorMessage = text
        } catch { /* keep default */ }
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()
    return { success: true, token: data.token }
  } catch (error: any) {
    console.error('Generate reset link error:', error)
    return { success: false, error: error.message || "Failed to generate reset link" }
  }
}
