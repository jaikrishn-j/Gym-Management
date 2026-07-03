import { auth, clerkClient } from "@clerk/nextjs/server";
import { ClerkPrivateMetadata, PermissionAction, PermissionModule, USER_TYPES } from "../interfaces/authInterface";



export async function hasPermission(
    module: PermissionModule,
    action: PermissionAction
):Promise<boolean>{
    try {

        const { userId } = await auth()
        if(!userId){
            return false
        }

        const client = await clerkClient()
        const user = await client.users.getUser(userId)
        const metadata = user.privateMetadata as ClerkPrivateMetadata
        const userType = metadata?.user

        if(!userType) {
            return false
        }

        if(userType === USER_TYPES.ADMIN){
            return true
        }
        if(userType === USER_TYPES.STAFF){
            const permissions = metadata?.permission

            if(!permissions) {
                return false
            }
            const modulePermissiosn = permissions[module]
            if(!modulePermissiosn || !Array.isArray(modulePermissiosn)){
                return false
            }
            return modulePermissiosn.includes(action)
        }
        return false
    } catch(error){
        console.error("Error checking permission:", error)
        return false
    }
}