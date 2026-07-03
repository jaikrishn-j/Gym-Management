import { Suspense } from 'react';
import { AlertCircle, Shield } from 'lucide-react';
import { CardGridSkeleton } from '@/app/components/shared/LoadingState';

import TrainerClient from '@/app/components/staff/TrainerClient';
import { createStaff, deleteStaff, readStaffs, updateStaff, generateResetLink } from './action';
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

function InsufficientPermissions() {
  return (
    <div className="text-center py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-500/10 mx-auto mb-4">
        <Shield className="h-8 w-8 text-yellow-500" />
      </div>
      <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Insufficient Permissions</h2>
      <p className="text-[var(--muted)] max-w-md mx-auto">
        You need read permission to view the staff list. Please contact your administrator.
      </p>
    </div>
  );
}

export default async function StaffTrainersPage() {
  const [canView, canCreate, canUpdate, canDelete] = await Promise.all([
    hasPermission(PERMISSION_MODULES.STAFFS, PERMISSION_ACTIONS.READ),
    hasPermission(PERMISSION_MODULES.STAFFS, PERMISSION_ACTIONS.CREATE),
    hasPermission(PERMISSION_MODULES.STAFFS, PERMISSION_ACTIONS.UPDATE),
    hasPermission(PERMISSION_MODULES.STAFFS, PERMISSION_ACTIONS.DELETE),
  ]);

  if (!canView) {
    return <InsufficientPermissions />;
  }

  const result = await readStaffs();

  if (!result.success && !result.data) {
    return <TrainersError message={result.error || 'Failed to load staff'} />;
  }

  const staffs = result.success ? result.data : [];
  const error = result.success ? '' : (result.error || 'Failed to load staff');

  return (
    <Suspense fallback={<CardGridSkeleton />}>
      <TrainerClient
        initialStaffs={staffs || []}
        initialError={error}
        canView={canView}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
        createStaff={createStaff}
        updateStaff={updateStaff}
        deleteStaff={deleteStaff}
        generateResetLink={generateResetLink}
      />
    </Suspense>
  );
}