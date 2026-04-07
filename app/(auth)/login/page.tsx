'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout'
import { cn } from '@/lib/utils/cn'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${redirectTo}`,
      },
    })
  }

  return (
    <AuthSplitLayout>
      <div className="space-y-8">
        {/* Heading */}
        <div className="space-y-1">
          <h2
            className="text-2xl font-bold text-[#0A1628]"
            style={{ fontFamily: "'Satoshi', 'DM Sans', sans-serif" }}
          >
            Welcome back
          </h2>
          <p className="text-sm text-[#0A1628]/50">
            Sign in to your Joberlify account
          </p>
        </div>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className={cn(
            'w-full flex items-center justify-center gap-3 px-4 py-2.5',
            'border border-[#1E3A5F]/20 rounded-lg bg-white',
            'text-sm font-medium text-[#0A1628]',
            'transition-all duration-150',
            'hover:border-[#1E3A5F]/40 hover:bg-[#F5F3EF]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2',
          )}
        >
          {googleLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#E8E4DD]" />
          <span className="text-xs text-[#0A1628]/40 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-[#E8E4DD]" />
        </div>

        {/* Email / password form */}
        <form onSubmit={handleSignIn} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-[#0A1628]">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={cn(
                'w-full px-3.5 py-2.5 rounded-lg text-sm',
                'bg-white border border-[#1E3A5F]/20 text-[#0A1628]',
                'placeholder:text-[#0A1628]/30',
                'transition-colors duration-150',
                'hover:border-[#1E3A5F]/40',
                'focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20',
              )}
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-[#0A1628]">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-[#0A1628]/50 hover:text-[#0EA5E9] transition-colors duration-150"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={cn(
                  'w-full px-3.5 py-2.5 pr-10 rounded-lg text-sm',
                  'bg-white border border-[#1E3A5F]/20 text-[#0A1628]',
                  'placeholder:text-[#0A1628]/30',
                  'transition-colors duration-150',
                  'hover:border-[#1E3A5F]/40',
                  'focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20',
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0A1628]/40 hover:text-[#0A1628]/70 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-[#EF4444] bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-lg px-3.5 py-2.5">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || googleLoading}
            className={cn(
              'w-full px-4 py-2.5 rounded-lg text-sm font-semibold',
              'bg-[#1E3A5F] text-[#FAFAF8]',
              'transition-colors duration-200',
              'hover:bg-[#0EA5E9]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2',
            )}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Signing in…
              </span>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        {/* Signup link */}
        <p className="text-center text-sm text-[#0A1628]/50">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-medium text-[#0A1628] underline decoration-[#0EA5E9]/40 underline-offset-2 hover:decoration-[#0EA5E9] transition-all duration-150"
          >
            Create one free
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  )
}
