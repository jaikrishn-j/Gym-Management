import { Suspense } from "react"
import { FormSkeleton } from "@/app/components/shared/LoadingState"
import SettingsClient from "@/app/components/admin/SettingsClient"
import { readSettings } from "./action"

export default async function SettingsPage() {
  const result = await readSettings()

  return (
    <Suspense fallback={<FormSkeleton />}>
      <SettingsClient initialSettings={result.data ?? null} />
    </Suspense>
  )
}
