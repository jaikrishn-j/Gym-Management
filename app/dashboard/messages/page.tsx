import { Suspense } from "react"
import { PageLoading } from "@/app/components/shared/LoadingState"
import MessagesClient from "@/app/components/member/MessagesClient"
import { getMemberMessages } from "@/app/admin/broadcast/action"

export default async function MessagesPage() {
  const result = await getMemberMessages()

  return (
    <Suspense fallback={<PageLoading />}>
      <MessagesClient initial={result.success ? result.data : []} />
    </Suspense>
  )
}
