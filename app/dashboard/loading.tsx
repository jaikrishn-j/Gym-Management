import { PageLoading } from '../components/shared/LoadingState';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <PageLoading />
    </div>
  );
}
