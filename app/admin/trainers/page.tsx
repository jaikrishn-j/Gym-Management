import { Suspense } from 'react';
import { AlertCircle } from 'lucide-react';
import { CardGridSkeleton } from '@/app/components/shared/LoadingState';

import TrainersPageClient from '@/app/components/admin/TrainerPageClient';
import { createStaff, deleteStaff, readStaffs, updateStaff, toggleStaffStatus, generateResetLink } from './action';
import { hasPermission } from '@/app/lib/getPermission';
import { PERMISSION_ACTIONS, PERMISSION_MODULES } from '@/app/interfaces/authInterface';

function TrainersError({ message }: { message: string }) {
  return (
    <div className="text-center py-20">
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
      <p className="text-red-500 text-lg font-medium">{message}</p>
    </div>
  );
}

export default async function AdminTrainersPage() {
  const result = await readStaffs();

  if (!result.success && !result.data) {
    return <TrainersError message={result.error || 'Failed to load staff'} />;
  }

  const staffs = result.success ? result.data : [];
  const error = result.success ? '' : (result.error || 'Failed to load staff');

  const canCreate = await hasPermission(PERMISSION_MODULES.STAFFS, PERMISSION_ACTIONS.CREATE);
  const canUpdate = await hasPermission(PERMISSION_MODULES.STAFFS, PERMISSION_ACTIONS.UPDATE);
  const canDelete = await hasPermission(PERMISSION_MODULES.STAFFS, PERMISSION_ACTIONS.DELETE);

  return (
    <Suspense fallback={<CardGridSkeleton />}>
      <TrainersPageClient 
        initialStaffs={staffs || []}
        initialError={error}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
        createStaff={createStaff}
        updateStaff={updateStaff}
        deleteStaff={deleteStaff}
        toggleStaffStatus={toggleStaffStatus}
        generateResetLink={generateResetLink}
      />
    </Suspense>
  );
}
