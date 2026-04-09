import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { SUBSCRIPTION_LIMITS } from '@/types/subscription'
import type { SubscriptionTier } from '@/types/subscription'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { UsageMeter } from '@/components/dashboard/UsageMeter'
import { RecentEvaluations } from '@/components/dashboard/RecentEvaluations'
import type { RecentEvalItem } from '@/components/dashboard/RecentEvaluations'
import { PipelineStats } from '@/components/dashboard/PipelineStats'
import type { PipelineStatCounts } from '@/components/dashboard/PipelineStats'
import { OnboardingBanner } from '@/components/dashboard/OnboardingBanner'
import { ClientDate } from '@/components/dashboard/ClientDate'

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
}

// ─── Staggered fade-in animation ─────────────────────────────────────────────

const FADE_CSS = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
`

function FadeUp({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <div style={{ animation: `fadeInUp 380ms ease-out ${delay}ms both` }}>
      {children}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  // Current calendar month start
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  // Fetch everything in one parallel round-trip
  const [userRow, profileRow, evalRows, pipelineRows, evalCountRow] = await Promise.all([
    supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .single(),

    supabase
      .from('user_profiles')
      .select('full_name, cv_parsed_data, nationality')
      .eq('user_id', user.id)
      .maybeSingle(),

    supabase
      .from('evaluations')
      .select('id, job_title, company_name, grade, overall_score, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),

    supabase
      .from('pipeline_items')
      .select('status')
      .eq('user_id', user.id),

    supabase
      .from('evaluations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', monthStart.toISOString()),
  ])

  // ── Derive display name ──────────────────────────────────────────────────────
  const displayName: string =
    profileRow.data?.full_name
    ?? user.user_metadata?.full_name
    ?? user.email?.split('@')[0]
    ?? 'there'

  // ── Tier + limits ────────────────────────────────────────────────────────────
  const tier = (userRow.data?.subscription_tier ?? 'free') as SubscriptionTier
  const limits = SUBSCRIPTION_LIMITS[tier]
  const evalsUsed = evalCountRow.count ?? 0

  // ── Onboarding completeness ──────────────────────────────────────────────────
  const hasProfile  = !!profileRow.data
  const hasName     = !!profileRow.data?.full_name
  const hasCv       = !!profileRow.data?.cv_parsed_data
  const onboardingComplete = hasProfile && hasName && hasCv

  // ── Shape recent evaluations ─────────────────────────────────────────────────
  const recentEvals: RecentEvalItem[] = (evalRows.data ?? []).map((row) => ({
    id:          row.id,
    jobTitle:    row.job_title,
    companyName: row.company_name,
    grade:       row.grade,
    overallScore: row.overall_score,
    createdAt:   row.created_at,
  }))

  // ── Shape pipeline counts ─────────────────────────────────────────────────────
  const allStatuses = pipelineRows.data ?? []
  const pipelineCounts: PipelineStatCounts = {
    total:        allStatuses.length,
    applying:     allStatuses.filter((r) => r.status === 'applying').length,
    applied:      allStatuses.filter((r) => r.status === 'applied').length,
    interviewing: allStatuses.filter((r) => r.status === 'interviewing').length,
    offer:        allStatuses.filter((r) => r.status === 'offer').length,
    hired:        allStatuses.filter((r) => r.status === 'hired').length,
    rejected:     allStatuses.filter((r) => r.status === 'rejected').length,
    withdrawn:    allStatuses.filter((r) => r.status === 'withdrawn').length,
  }

  // ── Tier display label ────────────────────────────────────────────────────────
  const tierLabel = tier === 'free' ? 'Free' : tier === 'pro' ? 'Pro' : 'Global'

  return (
    <>
      <style>{FADE_CSS}</style>

      <div className="min-h-screen bg-[#FAFAF8]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-16 space-y-8">

          {/* ── Onboarding banner ─────────────────────────────────────────────── */}
          {!onboardingComplete && (
            <FadeUp delay={0}>
              <OnboardingBanner
                hasName={hasName}
                hasCv={hasCv}
                hasProfile={hasProfile}
              />
            </FadeUp>
          )}

          {/* ── Welcome ──────────────────────────────────────────────────────── */}
          <FadeUp delay={onboardingComplete ? 0 : 100}>
            <div>
              <h1
                className="text-2xl font-bold text-[#0A1628] leading-tight"
                style={{ fontFamily: 'var(--font-family-display)' }}
              >
                Welcome back, {displayName}
              </h1>
              <ClientDate />
            </div>
          </FadeUp>

          {/* ── Quick actions ─────────────────────────────────────────────────── */}
          <FadeUp delay={onboardingComplete ? 100 : 200}>
            <QuickActions />
          </FadeUp>

          {/* ── Usage meter ───────────────────────────────────────────────────── */}
          <FadeUp delay={onboardingComplete ? 200 : 300}>
            <div
              className="rounded-[12px] border border-[#E8E4DD] bg-white px-5 py-4"
            >
              <UsageMeter
                used={evalsUsed}
                limit={limits.evaluationsPerMonth}
                noun="evaluation"
                tier={tierLabel}
                upgradeHref="/pricing"
              />
            </div>
          </FadeUp>

          {/* ── Recent evaluations ────────────────────────────────────────────── */}
          <FadeUp delay={onboardingComplete ? 300 : 400}>
            <RecentEvaluations items={recentEvals} />
          </FadeUp>

          {/* ── Pipeline summary ──────────────────────────────────────────────── */}
          <FadeUp delay={onboardingComplete ? 400 : 500}>
            <PipelineStats counts={pipelineCounts} />
          </FadeUp>

        </div>
      </div>
    </>
  )
}
