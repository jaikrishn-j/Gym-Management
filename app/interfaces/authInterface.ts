export const PERMISSION_ACTIONS = {
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
} as const;

export const PERMISSION_MODULES = {
  PLANS: "plans",
  STAFFS: "staffs",
  MEMBERS: "members",
  CALENDAR: "calendar",
  PAYMENTS: "payments",
  ANALYTICS: "analytics",
  EQUIPMENTS: "equipments",
  PERMISSIONS: "permissions",
} as const;

export const USER_TYPES = {
  ADMIN: "admin",
  STAFF: "staff",
} as const;

// ============ TYPES ============
export type PermissionAction = (typeof PERMISSION_ACTIONS)[keyof typeof PERMISSION_ACTIONS];
export type PermissionModule = (typeof PERMISSION_MODULES)[keyof typeof PERMISSION_MODULES];
export type UserType = (typeof USER_TYPES)[keyof typeof USER_TYPES];

export type Permissions = {
  [key in PermissionModule]: PermissionAction[];
};

export interface ClerkPrivateMetadata {
  user?: UserType;
  permission?: Partial<Permissions>;
}

export interface ClerkSessionClaims {
  metadata?: ClerkPrivateMetadata;
  userType?: UserType;
}