import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDaysLeft } from '@/lib/utils'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const REMINDER_DAYS = [30, 14, 7, 3, 2, 1]

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use service role to bypass RLS for cron queries
  const supabase = createClient()

  const { data: reminders, error } = await supabase
    .from('reminders')
    .select('*, users(email)')
    .eq('notify_email', true)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const results: { id: string; daysLeft: number; sent: boolean }[] = []

  for (const reminder of reminders ?? []) {
    const daysLeft = getDaysLeft(reminder.expiry_date)
    if (!REMINDER_DAYS.includes(daysLeft)) continue
    const userEmail = reminder.users?.email
    if (!userEmail) continue

    try {
      await resend.emails.send({
        from: 'RemindHer.io <noreply@remindher.io>',
        to: userEmail,
        subject: `⏰ "${reminder.subject}" expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
        html: `
          <div style="font-family:Inter,sans-serif;background:#0e0e0e;color:#fff;padding:40px;max-width:560px;margin:0 auto">
            <h1 style="color:#af25fe;font-size:24px;margin-bottom:8px">RemindHer.io</h1>
            <p style="color:#8a8a8a;font-size:12px;margin-bottom:32px">The Pulse of Digital Memory</p>
            <h2 style="font-size:20px;margin-bottom:16px">${daysLeft <= 1 ? '🚨' : '⏰'} ${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining</h2>
            <div style="background:#1a1a1a;border-radius:12px;padding:20px;margin-bottom:24px">
              <p style="color:#8a8a8a;font-size:12px;margin-bottom:4px">DOCUMENT / ITEM</p>
              <p style="font-size:18px;font-weight:500">${reminder.subject}</p>
              <p style="color:#8a8a8a;font-size:12px;margin-top:8px">Expires: ${new Date(reminder.expiry_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
              style="display:inline-block;background:linear-gradient(135deg,#d692ff,#af25fe);color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
              Open Dashboard →
            </a>
          </div>
        `,
      })
      results.push({ id: reminder.id, daysLeft, sent: true })
    } catch {
      results.push({ id: reminder.id, daysLeft, sent: false })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
