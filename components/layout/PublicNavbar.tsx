'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

export function PublicNavbar() {
  const [scrolled, setScrolled]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 48) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-200"
        style={{
          background: scrolled ? '#1E3A5F' : 'transparent',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
          backdropFilter: scrolled ? 'blur(8px)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="text-[#FAFAF8] font-bold text-xl tracking-[0.04em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:rounded"
            style={{ fontFamily: "'Clash Display', 'Satoshi', sans-serif" }}
          >
            Joberlify
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Public navigation">
            {[
              { href: '/features', label: 'Features' },
              { href: '/pricing',  label: 'Pricing'  },
              { href: '/blog',     label: 'Blog'     },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-[#FAFAF8]/65 hover:text-[#FAFAF8] transition-colors duration-150"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/auth/sign-in"
              className="text-sm text-[#FAFAF8]/65 hover:text-[#FAFAF8] transition-colors duration-150"
            >
              Log in
            </Link>
            <Link
              href="/auth/sign-up"
              className="text-sm font-semibold px-4 py-2 rounded-[10px] bg-[#0EA5E9] text-white transition-colors duration-150 hover:bg-[#38BDF8]"
            >
              Start Free
            </Link>
          </div>

          {/* Mobile: sign-up + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/auth/sign-up"
              className="text-xs font-semibold px-3 py-1.5 rounded-[8px] bg-[#0EA5E9] text-white hover:bg-[#38BDF8] transition-colors"
            >
              Start Free
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="p-1.5 text-[#FAFAF8]/70 hover:text-[#FAFAF8] transition-colors"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile panel */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-[#0A1628]/70 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div
            className="fixed top-14 left-0 right-0 z-50 bg-[#0A1628] border-b border-white/10 px-4 py-4 flex flex-col gap-3 md:hidden"
            style={{ animation: 'fadeInDown 0.2s ease-out both' }}
          >
            <Link href="/features"    className="text-sm text-[#FAFAF8]/70 hover:text-[#FAFAF8] py-2" onClick={() => setMobileOpen(false)}>Features</Link>
            <Link href="/pricing"     className="text-sm text-[#FAFAF8]/70 hover:text-[#FAFAF8] py-2" onClick={() => setMobileOpen(false)}>Pricing</Link>
            <Link href="/blog"        className="text-sm text-[#FAFAF8]/70 hover:text-[#FAFAF8] py-2" onClick={() => setMobileOpen(false)}>Blog</Link>
            <Link href="/auth/sign-in" className="text-sm text-[#FAFAF8]/70 hover:text-[#FAFAF8] py-2" onClick={() => setMobileOpen(false)}>Log in</Link>
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
