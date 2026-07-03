import { Suspense } from 'react';
import { AlertCircle } from 'lucide-react';
import { CardGridSkeleton } from '@/app/components/shared/LoadingState';
import { createPlan, deletePlan, readPlans, updatePlan } from './action';
import PlansClient from '@/app/components/staff/PlansClient';
import { hasPermission } from '@/app/lib/getPermission';
import { PERMISSION_ACTIONS, PERMISSION_MODULES } from '@/app/interfaces/authInterface';

function PlansError({ message }: { message: string }) {
  return (
    <div className="text-center py-20">
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
      <p className="text-red-500 text-lg font-medium">{message}</p>
    </div>
  );
}

export default async function StaffPlansPage() {
  const result = await readPlans();

  const [canCreate, canUpdate, canDelete] = await Promise.all([
    hasPermission(PERMISSION_MODULES.PLANS, PERMISSION_ACTIONS.CREATE),
    hasPermission(PERMISSION_MODULES.PLANS, PERMISSION_ACTIONS.UPDATE),
    hasPermission(PERMISSION_MODULES.PLANS, PERMISSION_ACTIONS.DELETE),
  ]);

  if (!result.success && !result.data) {
    return <PlansError message={result.error || 'Failed to load plans'} />;
  }

  const plans = result.success ? result.data : [];
  const error = result.success ? '' : (result.error || 'Failed to load plans');

  return (
    <Suspense fallback={<CardGridSkeleton />}>
      <PlansClient
        initialPlans={plans || []}
        initialError={error}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
        createPlan={createPlan}
        updatePlan={updatePlan}
        deletePlan={deletePlan}
      />
    </Suspense>
  );
}