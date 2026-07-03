import { clerkClient, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ClerkPrivateMetadata, USER_TYPES } from "./app/interfaces/authInterface";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isStaffRoute = createRouteMatcher(["/staff(.*)"]);
const isMemberRoute = createRouteMatcher(["/dashboard(.*)"]);
const isPublicRoute = createRouteMatcher(["/login", "/register", "/verify-email", "/forgot-password", "/"]);


const ROUTE_HOME_MAP = {
  [USER_TYPES.ADMIN]: "/admin",
  [USER_TYPES.STAFF]: "/staff",
} as const;


const TYPE_ROUTE_CHECKER = {
  [USER_TYPES.ADMIN]: isAdminRoute,
  [USER_TYPES.STAFF]: isStaffRoute,
} as const;

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();


  if (!isAdminRoute(req) && !isStaffRoute(req) && !isMemberRoute(req)) {
    return NextResponse.next();
  }

  if (!userId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }


  let userType: string | undefined;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    userType = (user.privateMetadata as ClerkPrivateMetadata)?.user;
  } catch (error) {
    console.error("Error fetching user metadata:", error);
    return NextResponse.redirect(new URL(`/error?error=${error}`, req.url));
  }


  if (!userType) {
    return isMemberRoute(req) 
      ? NextResponse.next() 
      : NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const userHomePath = ROUTE_HOME_MAP[userType as keyof typeof ROUTE_HOME_MAP];
  

  if (userHomePath) {
    const isUserRoute = TYPE_ROUTE_CHECKER[userType as keyof typeof TYPE_ROUTE_CHECKER];
    
    return isUserRoute(req) 
      ? NextResponse.next() 
      : NextResponse.redirect(new URL(userHomePath, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
};