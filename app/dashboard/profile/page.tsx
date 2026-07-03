import { Suspense } from "react"
import { FormSkeleton } from "@/app/components/shared/LoadingState"
import ProfileClient from "@/app/components/member/ProfileClient"
import { getProfile } from "@/app/dashboard/actions"

export default async function ProfilePage() {
  const result = await getProfile()

  if (!result.success || !result.data) {
    return <FormSkeleton />
  }

  return (
    <Suspense fallback={<FormSkeleton />}>
      <ProfileClient initial={result.data} />
    </Suspense>
  )
}
