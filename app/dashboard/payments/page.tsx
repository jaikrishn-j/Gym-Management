import { readPayments } from "./action"
import PaymentsClient from "@/app/components/member/PaymentsClient"

export default async function PaymentsPage() {
  const { payments, stats, error } = await readPayments()
  return <PaymentsClient initialPayments={payments} initialStats={stats} error={error} />
}