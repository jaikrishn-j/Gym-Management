import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import StaffDashboardClient from "../components/staff/StaffDashboardClient"

const StaffHome = async () => {
  const { userId } = await auth()
  if (!userId) redirect("/login")

  return <StaffDashboardClient />
}

export default StaffHome
