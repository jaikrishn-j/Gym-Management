export type Permission = 'read' | 'create' | 'update' | 'delete';

export interface StaffPermissions {
  plans: Permission[];
  equipments: Permission[];
  payments: Permission[];
  analytics: Permission[];
  calendar: Permission[];
  members: Permission[];
  staffs: Permission[];
  permissions: Permission[];
}

export interface Staff {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'staff';
  permissions: StaffPermissions;
  status: 'active' | 'inactive';
}

export const PERMISSION_LABELS: Record<Permission, string> = {
  read: 'Read',
  create: 'Create',
  update: 'Update',
  delete: 'Delete',
};

export const ALL_PERMISSIONS: Permission[] = ['read', 'create', 'update', 'delete'];

export const PERMISSION_SHORTHAND: Record<Permission, string> = {
  read: 'R',
  create: 'C',
  update: 'U',
  delete: 'D',
};

export const PERMISSION_COLORS: Record<Permission, string> = {
  read: 'text-blue-500 bg-blue-500/10',
  create: 'text-green-500 bg-green-500/10',
  update: 'text-yellow-500 bg-yellow-500/10',
  delete: 'text-red-500 bg-red-500/10',
};

export const PERMISSION_TOOLTIPS: Record<Permission, string> = {
  read: 'View and read data',
  create: 'Create new items',
  update: 'Update existing items',
  delete: 'Delete items',
};

export const PUBLIC_SECTIONS = ['plans', 'equipments'];

export interface PermissionSection {
  id: keyof StaffPermissions;
  label: string;
  icon: string;
}

export const PERMISSION_SECTIONS: PermissionSection[] = [
  { id: 'plans', label: 'Plans', icon: '📋' },
  { id: 'equipments', label: 'Equipments', icon: '🏋️' },
  { id: 'payments', label: 'Payments', icon: '💰' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'members', label: 'Members', icon: '👥' },
  { id: 'staffs', label: 'Staffs', icon: '👤' },
  { id: 'permissions', label: 'Permissions', icon: '🔐' },
];
