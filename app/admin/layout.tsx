import React from 'react'
import AdminSidebar from '../components/admin/Sidebar'

type Props = {
    children: React.ReactNode
}

const layout = (props: Props) => {
  return (
    <AdminSidebar>
        {props.children}
    </AdminSidebar>
  )
}

export default layout