import { auth } from '@clerk/nextjs/server'
import { redirect, RedirectType } from 'next/navigation'
import React from 'react'

type Props = {
    children: React.ReactNode
}

const layout = async (props: Props) => {
    const { userId } = await auth()
    if(userId){
        redirect("/dashboard", RedirectType.replace)
    }
  return (
    <div>{props.children}</div>
  )
}

export default layout