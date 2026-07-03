// app/admin/equipments/page.tsx
import { Suspense } from 'react';
import { AlertCircle } from 'lucide-react';
import { CardGridSkeleton } from '@/app/components/shared/LoadingState';
import { createEquipment, deleteEquipment, readEquipments, updateEquipment, updateEquipmentStatus } from './action';
import EquipmentsPageClient from '@/app/components/admin/EquipmentsPageClient';

// Error component
function EquipmentsError({ message }: { message: string }) {
  return (
    <div className="text-center py-20">
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
      <p className="text-red-500 text-lg font-medium">{message}</p>
    </div>
  );
}

export default async function AdminEquipmentPage() {
  const result = await readEquipments();

  if (!result.success) {
    return <EquipmentsError message={result.error || 'Failed to load equipment'} />;
  }

  // Ensure data is always an array
  const equipmentData = result.data ?? [];

  return (
    <Suspense fallback={<CardGridSkeleton />}>
      <EquipmentsPageClient 
        initialEquipments={equipmentData as any}
        initialError={null}
        createEquipment={createEquipment}
        updateEquipment={updateEquipment}
        deleteEquipment={deleteEquipment}
        updateEquipmentStatus={updateEquipmentStatus}
      />
    </Suspense>
  );
}