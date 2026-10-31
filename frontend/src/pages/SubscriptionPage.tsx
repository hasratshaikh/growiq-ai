import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  Coins,
  CreditCard,
  History,
  LoaderCircle,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

type ProfileRow = {
  credits: number | null
  trial_claimed_at: string | null
  trial_ends_at: string | null
}

type PlanRow = {
  id: string
  name: string
  description: string | null
  price: number
  credits: number
  duration_days: number | null
  is_active: boolean
}

type SubscriptionRow = {
  id: string
  status: string
  start_date: string | null
  end_date: string | null
  plan: { name: string } | null
}

type TransactionRow = {
  id: string
  amount: number
  transaction_type: string
  description: string | null
  created_at: string
}

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const money = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)

const planCopy = [
  {
    name: 'Free Trial',
    price: 0,
    credits: 100,
    duration: '15 days',
    description: 'Try GrowIQ and explore your growth tools.',
    features: ['100 AI credits', '15-day access', 'One-time activation'],
    action: 'Free Trial',
  },
  {
    name: 'Go',
    price: 299,
    credits: 500,
    duration: 'per month',
    description: 'For consistent personal and business growth.',
    features: ['500 AI credits/month', 'Monthly credit reset', 'All available tools'],
    action: 'Coming Soon',
  },
  {
    name: 'Pro',
    price: 499,
    credits: 1000,
    duration: 'per month',
    description: 'For users ready to accelerate their growth.',
    features: ['1,000 AI credits/month', 'Monthly credit reset', 'All available tools'],
    action: 'Coming Soon',
  },
]

export default function SubscriptionPage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [plans, setPlans] = useState<PlanRow[]>([])
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null)
  const [transactions, setTransactions] = useState<TransactionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activating, setActivating] = useState(false)

  const loadPage = useCallback(async () => {
    setLoading(true)
    setError('')

    const { data: authData, error: authError } = await supabase.auth.getUser()
    const user = authData.user

    if (authError || !user) {
      navigate('/auth?mode=login', { replace: true })
      return
    }

    const [
      profileResult,
      plansResult,
      subscriptionResult,
      transactionsResult,
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('credits, trial_claimed_at, trial_ends_at')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('plans')
        .select('id, name, description, price, credits, duration_days, is_active')
        .in('name', ['Free Trial', 'Go', 'Pro'])
        .order('price', { ascending: true }),
      supabase
        .from('subscriptions')
        .select('id, status, start_date, end_date, plan:plans(name)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('credit_transactions')
        .select('id, amount, transaction_type, description, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100),
    ])

    if (profileResult.error) {
      setError(profileResult.error.message)
    } else {
      setProfile(profileResult.data as ProfileRow | null)
    }

    if (plansResult.error) {
      setError((current) => current || plansResult.error.message)
    } else {
      setPlans((plansResult.data ?? []) as PlanRow[])
    }

    if (!subscriptionResult.error) {
      setSubscription(subscriptionResult.data as unknown as SubscriptionRow | null)
    }

    if (transactionsResult.error) {
      setError((current) => current || transactionsResult.error.message)
    } else {
      setTransactions((transactionsResult.data ?? []) as TransactionRow[])
    }

    setLoading(false)
  }, [navigate])

  useEffect(() => {
    void loadPage()
  }, [loadPage])

  const activePlanName = useMemo(() => {
    if (
      subscription?.plan?.name &&
      subscription.end_date &&
      new Date(subscription.end_date).getTime() > Date.now()
    ) {
      return subscription.plan.name
    }

    if (
      profile?.trial_claimed_at &&
      profile.trial_ends_at &&
      new Date(profile.trial_ends_at).getTime() > Date.now()
    ) {
      return 'Free Trial'
    }

    if (profile?.trial_claimed_at) return 'Free Trial (Expired)'
    return 'No active plan'
  }, [profile, subscription])

  const credits = profile?.credits ?? 0
  const totalDebited = transactions
    .filter((item) => item.transaction_type === 'debit')
    .reduce((sum, item) => sum + Math.abs(item.amount), 0)
  const totalAdded = transactions
    .filter((item) =>
      ['credit', 'bonus', 'purchase', 'refund'].includes(item.transaction_type),
    )
    .reduce((sum, item) => sum + Math.abs(item.amount), 0)

  const activateTrial = async () => {
    setActivating(true)
    setError('')

    const { data, error: rpcError } = await supabase.rpc('claim_free_trial')

    if (rpcError) {
      setError(rpcError.message)
      setActivating(false)
      return
    }

    if (data?.success === false || data?.claimed === false) {
      setError(data?.message || 'Free Trial has already been claimed or is unavailable.')
      setActivating(false)
      await loadPage()
      return
    }

    await loadPage()
    setActivating(false)
  }

  const trialAvailable = !profile?.trial_claimed_at
  const trialActive =
    Boolean(profile?.trial_ends_at) &&
    new Date(profile!.trial_ends_at!).getTime() > Date.now()

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoaderCircle className="animate-spin text-violet-600" size={28} />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-7 sm:px-7 lg:px-9">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
            Account & billing
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Subscription
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Manage your plan, monitor credits and view your usage history.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadPage()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <History size={16} /> Refresh details
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#34246f] via-[#5140a0] to-[#765ce0] p-6 text-white shadow-lg shadow-violet-900/10 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-violet-100">Your current plan</p>
              <h3 className="mt-2 text-3xl font-bold">{activePlanName}</h3>
              <p className="mt-2 text-sm text-violet-100">
                {subscription?.end_date
                  ? `Renews / ends on ${formatDate(subscription.end_date)}`
                  : trialActive
                    ? `Trial ends on ${formatDate(profile?.trial_ends_at)}`
                    : trialAvailable
                      ? 'Activate your one-time free trial to get started.'
                      : 'Your trial has ended. Choose an available plan when upgrades launch.'}
              </p>
            </div>
            <div className="rounded-2xl bg-white/15 p-3">
              <CreditCard size={25} />
            </div>
          </div>
          <div className="mt-9 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-violet-100">Available credits</p>
              <p className="mt-1 text-4xl font-bold tabular-nums">{credits.toLocaleString('en-IN')}</p>
            </div>
            {trialAvailable && (
              <button
                type="button"
                onClick={activateTrial}
                disabled={activating}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-violet-800 shadow-sm transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {activating ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Activate Free Trial
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <Wallet size={19} />
            </div>
            <p className="mt-5 text-xs font-medium text-slate-500">Credits available</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{credits.toLocaleString('en-IN')}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <Coins size={19} />
            </div>
            <p className="mt-5 text-xs font-medium text-slate-500">Credits used</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{totalDebited.toLocaleString('en-IN')}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <ArrowUpRight size={19} />
            </div>
            <p className="mt-5 text-xs font-medium text-slate-500">Credits received</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{totalAdded.toLocaleString('en-IN')}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <CalendarDays size={19} />
            </div>
            <p className="mt-5 text-xs font-medium text-slate-500">Trial expiry</p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {profile?.trial_ends_at ? formatDate(profile.trial_ends_at) : 'Not started'}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Plans & pricing</h3>
          <p className="mt-1 text-sm text-slate-500">
            Choose the plan that matches your growth goals.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {planCopy.map((plan) => {
            const databasePlan = plans.find(
              (item) => item.name.toLowerCase() === plan.name.toLowerCase(),
            )
            const isCurrent = activePlanName.toLowerCase().startsWith(plan.name.toLowerCase())
            const isTrial = plan.name === 'Free Trial'
            return (
              <article
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${
                  isCurrent ? 'border-violet-300 ring-2 ring-violet-100' : 'border-slate-200'
                }`}
              >
                {isCurrent && (
                  <span className="absolute right-4 top-4 rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-700">
                    Current plan
                  </span>
                )}
                <h4 className="text-lg font-bold text-slate-900">{plan.name}</h4>
                <p className="mt-1 min-h-10 text-sm text-slate-500">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-slate-900">{money(databasePlan?.price ?? plan.price)}</span>
                  <span className="ml-1 text-xs text-slate-500">/{isTrial ? 'once' : 'month'}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-violet-700">
                  {(databasePlan?.credits ?? plan.credits).toLocaleString('en-IN')} credits
                </p>
                <ul className="mt-5 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={!isTrial || !trialAvailable || activating}
                  onClick={isTrial && trialAvailable ? activateTrial : undefined}
                  className={`mt-6 inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold ${
                    isTrial && trialAvailable
                      ? 'bg-violet-700 text-white hover:bg-violet-800'
                      : 'cursor-not-allowed bg-slate-100 text-slate-500'
                  }`}
                >
                  {isTrial
                    ? trialAvailable
                      ? 'Activate Free Trial'
                      : trialActive
                        ? 'Trial Activated'
                        : 'Already Claimed'
                    : 'Coming Soon'}
                </button>
              </article>
            )
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Credit usage history</h3>
            <p className="mt-1 text-sm text-slate-500">Your latest credit additions, usage and refunds.</p>
          </div>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
            <Clock3 size={14} /> Latest 100 transactions
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <History size={21} />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-800">No credit activity yet</p>
            <p className="mt-1 text-xs text-slate-500">Your credit transactions will appear here.</p>
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[1.3fr_1fr_0.8fr_0.6fr] gap-4 bg-slate-50 px-6 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500 sm:grid">
              <span>Activity</span>
              <span>Date</span>
              <span>Type</span>
              <span className="text-right">Credits</span>
            </div>
            <div className="divide-y divide-slate-100">
              {transactions.map((item) => {
                const positive = ['credit', 'bonus', 'purchase', 'refund'].includes(item.transaction_type)
                return (
                  <div
                    key={item.id}
                    className="grid gap-2 px-5 py-4 sm:grid-cols-[1.3fr_1fr_0.8fr_0.6fr] sm:items-center sm:gap-4 sm:px-6"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {item.description || item.transaction_type.replaceAll('_', ' ')}
                      </p>
                      <p className="mt-1 text-xs text-slate-400 sm:hidden">{formatDate(item.created_at)}</p>
                    </div>
                    <p className="hidden text-sm text-slate-500 sm:block">{formatDate(item.created_at)}</p>
                    <p className="text-xs capitalize text-slate-500">{item.transaction_type}</p>
                    <p className={`text-sm font-bold tabular-nums sm:text-right ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {positive ? '+' : '-'}{Math.abs(item.amount)}
                    </p>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
