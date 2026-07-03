"use server"

import AdminDashboardClient from "../components/admin/AdminDashboardClient"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

const AdminHome = async () => {
  const { userId } = await auth()
  if (!userId) redirect("/login")

  return <AdminDashboardClient />
}

export default AdminHome
