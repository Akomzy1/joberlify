import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scrapeJob } from '@/lib/scraper/scrape-job'

export const runtime = 'nodejs'
export const maxDuration = 15

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { url: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { url } = body
  if (!url?.trim()) return NextResponse.json({ error: 'url is required' }, { status: 400 })

  let parsedUrl: URL
  try {
    parsedUrl = new URL(url.trim())
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Invalid protocol')
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  const result = await scrapeJob(parsedUrl.toString())

  if (!result.success) {
    return NextResponse.json(
      { fallbackRequired: true, reason: result.reason },
      { status: 422 },
    )
  }

  return NextResponse.json({ data: result.listing }, { status: 200 })
}
