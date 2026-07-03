import { Suspense } from 'react';
import { DashboardSkeleton, PageLoading } from '@/app/components/shared/LoadingState';
import { auth } from "@clerk/nextjs/server"
import { db } from "@/app/db"
import { plans, memberplans, planRequests, gymSettings } from "@/drizzle/schema"
import { eq, desc, asc } from "drizzle-orm"
import { checkAndExpirePlans } from './actions'
import DashboardClient from '@/app/components/member/DashboardClient';

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) {
    return <PageLoading />
  }

  await checkAndExpirePlans(userId)

  const [allPlans, userMemberPlans, pendingRequests, settings] = await Promise.all([
    db.select().from(plans).orderBy(asc(plans.createdAt)),
    db
      .select()
      .from(memberplans)
      .where(eq(memberplans.clerkUserId, userId))
      .orderBy(desc(memberplans.createdAt)),
    db
      .select()
      .from(planRequests)
      .where(
        eq(planRequests.clerkUserId, userId),
      )
      .orderBy(desc(planRequests.createdAt))
      .limit(1),
    db.select().from(gymSettings).limit(1),
  ])

  const currentPlan = userMemberPlans.find(mp => mp.status === 'active') || null

  const daysRemaining = currentPlan
    ? Math.ceil((currentPlan.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const planName = currentPlan
    ? allPlans.find(p => p.id === currentPlan.planId)?.name ?? null
    : null

  const expiredPlan = !currentPlan
    ? userMemberPlans.find(mp => mp.status === 'expired' || mp.status === 'cancelled') || null
    : null

  let previousPlan: { memberPlan: typeof memberplans.$inferSelect; plan: typeof plans.$inferSelect } | null = null
  if (expiredPlan) {
    const expiredPlanObj = allPlans.find(p => p.id === expiredPlan.planId)
    if (expiredPlanObj) {
      previousPlan = { memberPlan: expiredPlan, plan: expiredPlanObj }
    }
  }

  const pendingRequest = pendingRequests.length > 0 && pendingRequests[0].status === "pending"
    ? {
        id: pendingRequests[0].id,
        planName: allPlans.find(p => p.id === pendingRequests[0].planId)?.name ?? "Unknown",
        status: pendingRequests[0].status,
        createdAt: pendingRequests[0].createdAt.toISOString(),
        amount: pendingRequests[0].amount,
      }
    : null

  const gymSettingsData = settings.length > 0
    ? {
        initialPaymentAmount: settings[0].initialPaymentAmount,
        paymentGatewayEnabled: settings[0].paymentGatewayEnabled,
        razorpayKeyId: settings[0].razorpayKeyId,
      }
    : null

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClient
        initialPlans={allPlans.map(p => ({
          id: p.id,
          name: p.name,
          description: p.descripttion,
          price: p.price,
          offerPrice: p.offerPrice,
          billingDays: p.billingDays,
          features: p.features,
          isActive: p.isActive,
        }))}
        initialMemberPlans={userMemberPlans.map(mp => ({
          id: mp.id,
          clerkUserId: mp.clerkUserId,
          planId: mp.planId,
          startDate: mp.startDate.toISOString(),
          endDate: mp.endDate.toISOString(),
          status: mp.status as 'active' | 'expired' | 'cancelled',
          createdAt: mp.createdAt.toISOString(),
        }))}
        initialCurrentPlan={currentPlan ? {
          id: currentPlan.id,
          clerkUserId: currentPlan.clerkUserId,
          planId: currentPlan.planId,
          startDate: currentPlan.startDate.toISOString(),
          endDate: currentPlan.endDate.toISOString(),
          status: currentPlan.status as 'active' | 'expired' | 'cancelled',
          createdAt: currentPlan.createdAt.toISOString(),
        } : null}
        previousPlan={previousPlan ? {
          memberPlan: {
            id: previousPlan.memberPlan.id,
            clerkUserId: previousPlan.memberPlan.clerkUserId,
            planId: previousPlan.memberPlan.planId,
            startDate: previousPlan.memberPlan.startDate.toISOString(),
            endDate: previousPlan.memberPlan.endDate.toISOString(),
            status: previousPlan.memberPlan.status as 'active' | 'expired' | 'cancelled',
            createdAt: previousPlan.memberPlan.createdAt.toISOString(),
          },
          plan: {
            id: previousPlan.plan.id,
            name: previousPlan.plan.name,
            description: previousPlan.plan.descripttion,
            price: previousPlan.plan.price,
            offerPrice: previousPlan.plan.offerPrice,
            billingDays: previousPlan.plan.billingDays,
            features: previousPlan.plan.features,
            isActive: previousPlan.plan.isActive,
          },
        } : null}
        daysRemaining={daysRemaining}
        planName={planName}
        initialPendingRequest={pendingRequest}
        initialGymSettings={gymSettingsData}
      />
    </Suspense>
  );
}
