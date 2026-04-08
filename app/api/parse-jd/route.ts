import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseJdWithAI } from '@/lib/scraper/parse-jd'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { text: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { text } = body
  if (!text?.trim()) return NextResponse.json({ error: 'text is required' }, { status: 400 })
  if (text.length < 50) return NextResponse.json({ error: 'Text too short — paste the full job description' }, { status: 400 })
  if (text.length > 15_000) return NextResponse.json({ error: 'Text exceeds 15,000 character limit' }, { status: 400 })

  try {
    const listing = await parseJdWithAI(text)
    return NextResponse.json({ data: listing }, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Parsing failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
