'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { sanitizeText } from '@/lib/utils'

const labels = {
  en: {
    tagline: 'The Pulse of Digital Memory',
    subjectPlaceholder: "What's expiring? e.g. Vendor Contract",
    emailPlaceholder: 'your@work.com',
    cta: 'Forget It →',
    sending: 'Sending OTP...',
    hint: "We'll send a one-time code to verify.",
    errorFill: 'Please fill in all fields.',
  },
  id: {
    tagline: 'Detak Memori Digital Anda',
    subjectPlaceholder: 'Apa yang akan kadaluarsa? mis. Kontrak Vendor',
    emailPlaceholder: 'kerja@anda.com',
    cta: 'Lupain →',
    sending: 'Mengirim OTP...',
    hint: 'Kami akan kirim kode sekali pakai untuk verifikasi.',
    errorFill: 'Mohon isi semua kolom.',
  },
}

export default function HookPage() {
  const router = useRouter()
  const [lang, setLang] = useState<'en' | 'id'>('en')
  const [subject, setSubject] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const t = labels[lang]

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const clean = sanitizeText(subject)
    if (!clean || !expiryDate || !email) { setError(t.errorFill); return }
    setLoading(true)
    const supabase = createClient()
    const { error: otpError } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
    if (otpError) { setError(otpError.message); setLoading(false); return }
    sessionStorage.setItem('pendingReminder', JSON.stringify({ subject: clean, expiryDate }))
    router.push(`/otp?email=${encodeURIComponent(email)}`)
  }

  return (
    <main className="min-h-screen bg-obsidian flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-neon-purple/[0.08] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[200px] rounded-full bg-neon-cyan/[0.05] blur-[100px] pointer-events-none" />

      {/* Lang toggle */}
      <div className="absolute top-6 right-6 flex gap-1 bg-surface-highest rounded-md p-1">
        {(['en','id'] as const).map(l => (
          <button key={l} onClick={() => setLang(l)}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${lang===l ? 'bg-neon-purple/20 text-neon-purple-dim' : 'text-on-surface-variant hover:text-white'}`}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Logo */}
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} transition={{duration:0.5}} className="mb-10 text-center">
        <div className="flex items-center gap-3 justify-center mb-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-cyan" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tighter">RemindHer<span className="text-neon-purple-dim">.io</span></h1>
        </div>
        <p className="text-on-surface-variant text-sm tracking-wide">{t.tagline}</p>
      </motion.div>

      {/* Card */}
      <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:0.5,delay:0.1}}
        className="glass-card rounded-2xl p-8 w-full max-w-md glow-purple">
        <h2 className="text-3xl font-medium tracking-tighter text-white mb-1">What should we</h2>
        <h2 className="text-3xl font-medium tracking-tighter text-neon-purple-dim mb-8">remind you about?</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input id="subject" type="text" value={subject} onChange={e=>setSubject(e.target.value)}
            placeholder={t.subjectPlaceholder} maxLength={255} required
            className="input-neon w-full bg-surface-highest text-white placeholder-on-surface-variant rounded-lg px-4 py-3 text-sm" />
          <input id="expiry-date" type="date" value={expiryDate} onChange={e=>setExpiryDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]} required
            className="input-neon w-full bg-surface-highest text-white rounded-lg px-4 py-3 text-sm" />
          <input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)}
            placeholder={t.emailPlaceholder} required
            className="input-neon w-full bg-surface-highest text-white placeholder-on-surface-variant rounded-lg px-4 py-3 text-sm" />
          {error && <p className="text-neon-red text-xs px-1">{error}</p>}
          <p className="text-on-surface-variant text-xs">{t.hint}</p>
          <motion.button type="submit" disabled={loading} whileHover={{scale:1.01}} whileTap={{scale:0.98}}
            className="btn-primary w-full rounded-lg py-3.5 text-sm mt-2 disabled:opacity-60">
            {loading ? t.sending : t.cta}
          </motion.button>
        </form>
      </motion.div>

      <p className="mt-8 text-on-surface-variant text-xs flex gap-4">
        <a href="#" className="hover:text-white transition-colors">Privacy</a>
        <a href="#" className="hover:text-white transition-colors">Terms</a>
        <a href="#" className="hover:text-white transition-colors">Support</a>
      </p>
    </main>
  )
}
