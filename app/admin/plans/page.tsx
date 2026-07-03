import { Suspense } from 'react';
import { AlertCircle } from 'lucide-react';
import { CardGridSkeleton } from '@/app/components/shared/LoadingState';

import PlansPageClient from '@/app/components/admin/PlanClient';
import { createPlan, deletePlan, readPlans, updatePlan, togglePlanStatus } from './action';

function PlansError({ message }: { message: string }) {
  return (
    <div className="text-center py-20">
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
      <p className="text-red-500 text-lg font-medium">{message}</p>
    </div>
  );
}

export default async function AdminPlansPage() {
  const result = await readPlans();

  if (!result.success && !result.data) {
    return <PlansError message={result.error || 'Failed to load plans'} />;
  }

  const plans = result.success ? result.data : [];
  const error = result.success ? '' : (result.error || 'Failed to load plans');

  return (
    <Suspense fallback={<CardGridSkeleton />}>
      <PlansPageClient 
        initialPlans={plans || []}
        initialError={error}
        createPlan={createPlan}
        updatePlan={updatePlan}
        deletePlan={deletePlan}
        togglePlanStatus={togglePlanStatus}
      />
    </Suspense>
  );
}
