'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, ChevronDown, LogOut, Settings, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import { cn } from '@/lib/utils/cn'

const AUTH_NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/evaluate', label: 'Evaluate' },
  { href: '/pipeline', label: 'Pipeline' },
  { href: '/sponsors', label: 'Sponsors' },
]

const PUBLIC_NAV_LINKS = [
  { href: '/sponsors', label: 'Sponsors' },
  { href: '/pricing', label: 'Pricing' },
]

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name) {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }
  if (email) return email[0].toUpperCase()
  return '?'
}

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const navLinks = user ? AUTH_NAV_LINKS : PUBLIC_NAV_LINKS

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const initials = getInitials(
    user?.user_metadata?.full_name,
    user?.email,
  )

  return (
    <>
      <nav className="bg-[#1E3A5F] border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link
              href={user ? '/dashboard' : '/'}
              className="flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E3A5F] rounded"
            >
              <span
                className="text-[#FAFAF8] text-xl font-bold"
                style={{
                  fontFamily: "'Satoshi', 'DM Sans', sans-serif",
                  letterSpacing: '0.04em',
                }}
              >
                Joberlify
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(({ href, label }) => {
                const isActive = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'relative px-3.5 py-1.5 text-sm font-medium rounded transition-colors duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-1 focus-visible:ring-offset-[#1E3A5F]',
                      isActive
                        ? 'text-[#FAFAF8]'
                        : 'text-[#FAFAF8]/60 hover:text-[#FAFAF8]',
                    )}
                  >
                    {label}
                    {/* Active indicator */}
                    {isActive && (
                      <span className="absolute bottom-0 left-3.5 right-3.5 h-0.5 bg-[#0EA5E9] rounded-full" />
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {user ? (
                /* ── Authenticated: avatar dropdown ── */
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={cn(
                      'flex items-center gap-2 rounded-full focus-visible:outline-none',
                      'focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E3A5F]',
                    )}
                    aria-label="Account menu"
                    aria-expanded={dropdownOpen}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full bg-[#1E4976] flex items-center justify-center',
                        'text-[#FAFAF8] text-xs font-semibold',
                        'transition-all duration-150',
                        dropdownOpen
                          ? 'ring-2 ring-[#0EA5E9]'
                          : 'hover:ring-2 hover:ring-[#0EA5E9]/50',
                      )}
                    >
                      {initials}
                    </div>
                    <ChevronDown
                      size={14}
                      className={cn(
                        'text-[#FAFAF8]/50 transition-transform duration-200 hidden md:block',
                        dropdownOpen && 'rotate-180',
                      )}
                    />
                  </button>

                  {/* Dropdown */}
                  {dropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-48 bg-[#0A1628] border border-white/10 rounded-lg shadow-lg overflow-hidden"
                      style={{ animation: 'fadeInUp 0.15s ease-out both' }}
                    >
                      <div className="px-3.5 py-3 border-b border-white/10">
                        <p className="text-xs text-[#FAFAF8]/40 truncate">{user.email}</p>
                      </div>
                      <div className="py-1">
                        {[
                          { href: '/settings', icon: Settings, label: 'Settings' },
                        ].map(({ href, icon: Icon, label }) => (
                          <Link
                            key={href}
                            href={href}
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-[#FAFAF8]/70 hover:text-[#FAFAF8] hover:bg-white/5 transition-colors"
                          >
                            <Icon size={14} />
                            {label}
                          </Link>
                        ))}
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-[#FAFAF8]/70 hover:text-[#EF4444] hover:bg-white/5 transition-colors"
                        >
                          <LogOut size={14} />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ── Unauthenticated: login + signup ── */
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-3.5 py-1.5 text-sm font-medium text-[#FAFAF8]/70 hover:text-[#FAFAF8] transition-colors duration-150 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9]"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className={cn(
                      'px-3.5 py-1.5 text-sm font-semibold rounded-lg',
                      'bg-[#0EA5E9] text-white',
                      'transition-colors duration-150',
                      'hover:bg-[#38BDF8]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E3A5F]',
                    )}
                  >
                    Sign up free
                  </Link>
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-1.5 rounded text-[#FAFAF8]/70 hover:text-[#FAFAF8] hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9]"
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile slide-in panel ── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30 bg-[#0A1628]/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />

          {/* Panel */}
          <div
            className="fixed top-14 right-0 bottom-0 z-40 w-72 bg-[#0A1628] border-l border-white/10 flex flex-col md:hidden"
            style={{ animation: 'slideInRight 0.25s ease-out both' }}
          >
            {user && (
              <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#1E4976] flex items-center justify-center text-[#FAFAF8] text-sm font-semibold">
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#FAFAF8]">
                    {user.user_metadata?.full_name ?? 'Account'}
                  </p>
                  <p className="text-xs text-[#FAFAF8]/40 truncate">{user.email}</p>
                </div>
              </div>
            )}

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navLinks.map(({ href, label }) => {
                const isActive = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                      isActive
                        ? 'bg-white/10 text-[#FAFAF8]'
                        : 'text-[#FAFAF8]/60 hover:bg-white/5 hover:text-[#FAFAF8]',
                    )}
                  >
                    {label}
                  </Link>
                )
              })}
            </nav>

            <div className="px-5 py-4 border-t border-white/10 space-y-2">
              {user ? (
                <>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2.5 text-sm text-[#FAFAF8]/60 hover:text-[#FAFAF8] transition-colors py-1.5"
                  >
                    <Settings size={15} /> Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-2.5 text-sm text-[#FAFAF8]/60 hover:text-[#EF4444] transition-colors py-1.5 w-full"
                  >
                    <LogOut size={15} /> Sign out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    className="px-4 py-2.5 text-sm font-medium text-center text-[#FAFAF8] border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2.5 text-sm font-semibold text-center text-white bg-[#0EA5E9] rounded-lg hover:bg-[#38BDF8] transition-colors"
                  >
                    Sign up free
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
