import { Suspense } from 'react';
import { AlertCircle } from 'lucide-react';
import { CardGridSkeleton } from '@/app/components/shared/LoadingState';

import MembersClient from '@/app/components/admin/MembersClient';
import { checkPendingSyncs, createPayment, readMemberPlans, readMembers, readPayments, readPlans, markAttendance, readAttendanceHistory } from './action';

function MembersError({ message }: { message: string }) {
  return (
    <div className="text-center py-20">
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
      <p className="text-red-500 text-lg font-medium">{message}</p>
    </div>
  );
}

export default async function AdminMembersPage() {
  const [membersResult, plansResult] = await Promise.all([
    readMembers(),
    readPlans(),
  ]);

  if (!membersResult.success) {
    return <MembersError message={membersResult.error || 'Failed to load members'} />;
  }

  return (
    <Suspense fallback={<CardGridSkeleton />}>
      <MembersClient
        initialMembers={membersResult.data || []}
        initialPlans={plansResult.data || []}
        readMemberPlans={readMemberPlans}
        readPayments={readPayments}
        createPayment={createPayment}
        checkPendingSyncs={checkPendingSyncs}
        markAttendance={markAttendance}
        readAttendanceHistory={readAttendanceHistory}
      />
    </Suspense>
  );
}
