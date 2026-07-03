import { auth } from '@clerk/nextjs/server'
import { redirect, RedirectType } from 'next/navigation'
import React from 'react'
import StaffSidebar from '../components/staff/StaffSidebar'

type Props = {
    children: React.ReactNode
}

const layout = async(props: Props) => {
    const { userId } = await auth()
    if(!userId){
        redirect("/login", RedirectType.replace)
    }
  return (
    <StaffSidebar>{props.children}</StaffSidebar>
  )
}

export default layout