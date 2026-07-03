import { auth } from "@clerk/nextjs/server"
import { redirect, RedirectType } from "next/navigation"
import DashboardTopbar from "./components/DashboardTopbar"
import Footer from "../components/Footer"


type Props = {
  children: React.ReactNode
}

const layout = async(props: Props) => {
  const { userId } = await auth()
  if(!userId){
    redirect("/login", RedirectType.replace)
  }
  return (
    <div className="flex flex-col min-h-full">
      <main className="min-h-screen flex-1">
        <DashboardTopbar />
        {props.children}
      </main>
      <Footer />
    </div>
  )
}

export default layout