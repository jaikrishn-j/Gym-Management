// app/interfaces/EquipmentInterface.ts
export interface Equipment {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  status?: string | null;
  quantity: number;
  imageUrl?: string | null;
  purchaseDate?: Date | string | null;
  lastMaintenance?: Date | string | null;
  nextMaintenance?: Date | string | null;
  location?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export const CATEGORIES = [
  { value: 'cardio', label: 'Cardio' },
  { value: 'strength', label: 'Strength' },
  { value: 'functional', label: 'Functional' },
  { value: 'free_weights', label: 'Free Weights' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'other', label: 'Other' },
] as const;

export const EQUIPMENT_STATUS = [
  { value: 'available', label: 'Available' },
  { value: 'in_use', label: 'In Use' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'out_of_order', label: 'Out of Order' },
  { value: 'retired', label: 'Retired' },
] as const;

export interface EquipmentActionResponse {
  success: boolean;
  error?: string;
  data?: any;
}

export interface EquipmentsPageClientProps {
  initialEquipments: Equipment[];
  initialError: string | null;
  createEquipment: (data: any) => Promise<EquipmentActionResponse>;
  updateEquipment: (id: string, data: any) => Promise<EquipmentActionResponse>;
  deleteEquipment: (id: string) => Promise<EquipmentActionResponse>;
  updateEquipmentStatus: (id: string, status: string) => Promise<EquipmentActionResponse>;
}