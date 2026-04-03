import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeText } from '@/lib/utils'
import { z } from 'zod'

const Schema = z.object({
  subject: z.string().min(1).max(255),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  notify_email: z.boolean().default(true),
  notify_wa: z.boolean().default(false),
  notify_telegram: z.boolean().default(false),
  phone_number: z.string().optional().nullable(),
})

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // RLS enforces user_id = auth.uid() automatically
  const { data: reminders, error } = await supabase
    .from('reminders')
    .select('*')
    .order('expiry_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reminders })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { subject, expiry_date, notify_email, notify_wa, notify_telegram, phone_number } = parsed.data

  const { data, error } = await supabase.from('reminders').insert({
    user_id: user.id,
    subject: sanitizeText(subject),
    expiry_date,
    notify_email,
    notify_wa,
    notify_telegram,
    phone_number: phone_number ?? null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reminder: data }, { status: 201 })
}
