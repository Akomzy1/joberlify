'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, FileSearch, Shield, ArrowLeft } from 'lucide-react'

const QUICK_LINKS = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard',         desc: 'Your overview and recent activity' },
  { href: '/evaluate',   icon: FileSearch,       label: 'Evaluate a job',    desc: 'Paste a URL or job description'    },
  { href: '/sponsors',   icon: Shield,           label: 'Sponsor directory', desc: 'Search 120,000+ UK visa sponsors'  },
]

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center px-4 py-20">
      <div className="w-full max-w-lg text-center">

        {/* 404 */}
        <p
          className="text-8xl font-bold text-[#E8E4DD] leading-none mb-8"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
          aria-hidden="true"
        >
          404
        </p>

        <h1
          className="text-2xl font-bold text-[#0A1628] mb-3"
          style={{ fontFamily: 'Satoshi, DM Sans, sans-serif' }}
        >
          Page not found
        </h1>
        <p className="text-sm text-[#0A1628]/55 leading-relaxed mb-10 max-w-sm mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          Here are some places to go instead:
        </p>

        {/* Quick links */}
        <div className="space-y-2 mb-10">
          {QUICK_LINKS.map(({ href, icon: Icon, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 bg-white rounded-xl border border-[#E8E4DD] px-4 py-3.5 text-left hover:border-[#0EA5E9]/40 hover:shadow-[0_2px_8px_0_rgba(14,165,233,0.08)] transition-all duration-150 group"
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#0EA5E9]/10 flex items-center justify-center">
                <Icon size={16} className="text-[#0EA5E9]" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-[#0A1628] group-hover:text-[#0EA5E9] transition-colors">{label}</p>
                <p className="text-xs text-[#0A1628]/45 truncate">{desc}</p>
              </div>
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-[#0A1628]/40 hover:text-[#0EA5E9] transition-colors"
        >
          <ArrowLeft size={14} />
          Go back
        </button>
      </div>
    </div>
  )
}
