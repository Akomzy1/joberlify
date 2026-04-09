'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Kanban, Building2, ArrowRight } from 'lucide-react'

// ─── Primary card ─────────────────────────────────────────────────────────────

function PrimaryCard() {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href="/evaluate"
      className="flex flex-col justify-between rounded-[12px] p-5 min-h-[140px] sm:min-h-[160px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2"
      style={{ background: hovered ? '#2563A0' : '#1E3A5F' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Search size={22} color="#0EA5E9" strokeWidth={1.8} />
      <div>
        <p
          className="text-[#FAFAF8] font-bold text-lg leading-tight mb-0.5"
          style={{ fontFamily: 'var(--font-family-display)' }}
        >
          Evaluate a Job
        </p>
        <div className="flex items-center gap-1">
          <span className="text-xs text-[#FAFAF8]/50">Paste a JD and get scored</span>
          <ArrowRight
            size={12}
            color="#0EA5E9"
            className="transition-transform duration-150"
            style={{ transform: hovered ? 'translateX(3px)' : 'none' }}
          />
        </div>
      </div>
    </Link>
  )
}

// ─── Secondary card ───────────────────────────────────────────────────────────

function SecondaryCard({
  href,
  icon: Icon,
  label,
  sub,
}: {
  href: string
  icon: typeof Kanban
  label: string
  sub: string
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href={href}
      className="flex flex-col justify-between rounded-[12px] p-5 min-h-[140px] sm:min-h-[160px] border border-[#E8E4DD] bg-[#FAFAF8] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2"
      style={{
        // box-shadow inset simulates a left border that can be transitioned smoothly
        boxShadow: hovered
          ? 'inset 5px 0 0 0 #0EA5E9'
          : 'inset 3px 0 0 0 #0EA5E9',
        transition: 'box-shadow 150ms ease, background-color 150ms ease',
        background: hovered ? '#F5F3EF' : '#FAFAF8',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Icon size={22} color="#0EA5E9" strokeWidth={1.8} />
      <div>
        <p
          className="text-[#0A1628] font-bold text-lg leading-tight mb-0.5"
          style={{ fontFamily: 'var(--font-family-display)' }}
        >
          {label}
        </p>
        <span className="text-xs text-[#0A1628]/45">{sub}</span>
      </div>
    </Link>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <PrimaryCard />
      <SecondaryCard
        href="/pipeline"
        icon={Kanban}
        label="View Pipeline"
        sub="Track your applications"
      />
      <SecondaryCard
        href="/sponsors"
        icon={Building2}
        label="Browse Sponsors"
        sub="90,000+ UK licence holders"
      />
    </div>
  )
}
