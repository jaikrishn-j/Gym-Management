import { Suspense } from 'react';
import { AlertCircle } from 'lucide-react';
import { CardGridSkeleton } from '@/app/components/shared/LoadingState';
import { checkPendingSyncs, createPayment, readMemberPlans, readMembers, readPayments, readPlans, readAttendanceHistory, markAttendance } from './action';
import MembersClient from '@/app/components/staff/MembersClient';
import { hasPermission } from '@/app/lib/getPermission';
import { PERMISSION_ACTIONS, PERMISSION_MODULES } from '@/app/interfaces/authInterface';

function MembersError({ message }: { message: string }) {
  return (
    <div className="text-center py-20">
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
      <p className="text-red-500 text-lg font-medium">{message}</p>
    </div>
  );
}

export default async function StaffMembersPage() {
  const [membersResult, plansResult, canRead, canUpdate] = await Promise.all([
    readMembers(),
    readPlans(),
    hasPermission(PERMISSION_MODULES.MEMBERS, PERMISSION_ACTIONS.READ),
    hasPermission(PERMISSION_MODULES.MEMBERS, PERMISSION_ACTIONS.UPDATE),
  ]);

  if (!membersResult.success) {
    return <MembersError message={membersResult.error || 'Failed to load members'} />;
  }

  return (
    <Suspense fallback={<CardGridSkeleton />}>
      <MembersClient
        initialMembers={membersResult.data || []}
        initialPlans={plansResult.data || []}
        canRead={canRead}
        canUpdate={canUpdate}
        readMemberPlans={readMemberPlans}
        readPayments={readPayments}
        createPayment={createPayment}
        checkPendingSyncs={checkPendingSyncs}
        readAttendanceHistory={readAttendanceHistory}
        markAttendance={markAttendance}
      />
    </Suspense>
  );
}
