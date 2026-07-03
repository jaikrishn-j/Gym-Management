import { Suspense } from "react"
import { AlertCircle } from "lucide-react"
import { CardGridSkeleton } from "@/app/components/shared/LoadingState"
import PaymentsClient from "@/app/components/staff/PaymentsClient"
import { readAllPayments } from "./action"

function PaymentsError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 max-w-xl mx-auto mt-8">
      <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
      <p className="text-sm text-red-500 font-medium">{message}</p>
    </div>
  )
}

export default async function StaffPaymentsPage() {
  const result = await readAllPayments(1, 20)

  if (!result.success) {
    return <PaymentsError message={result.error || "Failed to load payments"} />
  }

  return (
    <Suspense fallback={<CardGridSkeleton count={3} />}>
      <PaymentsClient
        initialPayments={result.data?.payments ?? []}
        initialTotalCount={result.data?.totalCount ?? 0}
        initialStats={result.data?.stats ?? null}
        readAllPayments={readAllPayments}
      />
    </Suspense>
  )
}
