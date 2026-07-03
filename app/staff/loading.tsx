import { PageLoading } from '../components/shared/LoadingState';

export default function StaffLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <PageLoading />
    </div>
  );
}
