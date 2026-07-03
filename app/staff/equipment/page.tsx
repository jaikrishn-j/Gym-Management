import { Suspense } from 'react';
import { AlertCircle } from 'lucide-react';
import { CardGridSkeleton } from '@/app/components/shared/LoadingState';
import { createEquipment, deleteEquipment, readEquipments, updateEquipment } from './action';
import StaffEquipmentClient from '@/app/components/staff/StaffEquipmentClient';
import { hasPermission } from '@/app/lib/getPermission';
import { PERMISSION_ACTIONS, PERMISSION_MODULES } from '@/app/interfaces/authInterface';

function StaffEquipmentsError({ message }: { message: string }) {
  return (
    <div className="text-center py-20">
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
      <p className="text-red-500 text-lg font-medium">{message}</p>
    </div>
  );
}

export default async function StaffEquipmentPage() {
  const result = await readEquipments();

  const [canCreate, canUpdate, canDelete] = await Promise.all([
    hasPermission(PERMISSION_MODULES.EQUIPMENTS, PERMISSION_ACTIONS.CREATE),
    hasPermission(PERMISSION_MODULES.EQUIPMENTS, PERMISSION_ACTIONS.UPDATE),
    hasPermission(PERMISSION_MODULES.EQUIPMENTS, PERMISSION_ACTIONS.DELETE),
  ]);

  if (!result.success) {
    return <StaffEquipmentsError message={result.error || 'Failed to load equipment'} />;
  }

  const equipmentData = result.data ?? [];

  return (
    <Suspense fallback={<CardGridSkeleton />}>
      <StaffEquipmentClient
        initialEquipments={equipmentData as any}
        initialError={null}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
        createEquipment={createEquipment}
        updateEquipment={updateEquipment}
        deleteEquipment={deleteEquipment}
      />
    </Suspense>
  );
}