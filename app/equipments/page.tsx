import { Suspense } from 'react';
import { AlertCircle } from 'lucide-react';
import { CardGridSkeleton } from '@/app/components/shared/LoadingState';
import { readEquipments } from '@/app/admin/equipment/action';
import PublicEquipmentList from '@/app/components/PublicEquipmentList';

function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-center py-20">
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
      <p className="text-red-500 text-lg font-medium">{message}</p>
    </div>
  );
}

export default async function EquipmentsPage() {
  const result = await readEquipments();

  if (!result.success) {
    return <ErrorState message={result.error || 'Failed to load equipment'} />;
  }

  const equipmentData = result.data ?? [];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight">
            Our Equipment
          </h1>
          <p className="mt-3 text-base sm:text-lg text-[var(--muted)] max-w-2xl mx-auto">
            Browse our full range of gym equipment available for your workout.
          </p>
        </div>

        <Suspense fallback={<CardGridSkeleton />}>
          <PublicEquipmentList equipments={equipmentData as any} />
        </Suspense>
      </div>
    </div>
  );
}
