import { Construction } from "lucide-react"

export default async function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 mb-4">
        <Construction className="h-8 w-8 text-green-500" />
      </div>
      <h1 className="text-2xl font-black text-[var(--foreground)]">Coming Soon</h1>
      <p className="text-sm text-[var(--muted)] mt-2 text-center max-w-sm">
        Settings page is under construction and will be available soon.
      </p>
    </div>
  )
}
