import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/evaluate',
  '/evaluations',
  '/pipeline',
  '/cv',
  '/interview-prep',
  '/settings',
]

const AUTH_PREFIXES = ['/login', '/signup']

// These bypass all auth checks
const PUBLIC_API_PREFIXES = ['/api/billing/webhook']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow public API routes through without session overhead
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const { supabaseResponse, user } = await updateSession(request)

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isAuthPage = AUTH_PREFIXES.some((p) => pathname.startsWith(p))

  // Unauthenticated → redirect to login, preserve destination
  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Authenticated → bounce away from login/signup
  if (isAuthPage && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
