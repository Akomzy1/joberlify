'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from './Navbar'

// Routes where the main nav should not appear
const HIDE_ON: string[] = ['/login', '/signup', '/onboarding']

export function ConditionalNavbar() {
  const pathname = usePathname()
  const hidden = HIDE_ON.some((route) => pathname.startsWith(route))
  if (hidden) return null
  return <Navbar />
}
