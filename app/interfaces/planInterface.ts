// /app/interfaces/planInterface.ts

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  offerPrice?: number | null;
  billingDays: number;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlansPageClientProps {
  initialPlans: Plan[];
  initialError: string;
  createPlan: (data: Omit<Plan, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>) => Promise<{ success: boolean; data?: Plan; error?: string }>;
  updatePlan: (id: string, data: Partial<Omit<Plan, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>>) => Promise<{ success: boolean; data?: Plan; error?: string }>;
  deletePlan: (id: string) => Promise<{ success: boolean; data?: Plan; error?: string }>;
  togglePlanStatus: (id: string) => Promise<{ success: boolean; data?: Plan; error?: string }>;
}

export interface PlanCardProps {
  plan: Plan;
  onEdit?: (plan: Plan) => void;
  onDelete?: (plan: Plan) => void;
  onToggleStatus?: (plan: Plan) => void;
  showActions?: boolean;
}