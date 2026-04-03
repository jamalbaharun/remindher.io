'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

function OTPForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lang, setLang] = useState<'en'|'id'>('en')
  const inputRefs = useRef<(HTMLInputElement|null)[]>([])

  useEffect(() => { inputRefs.current[0]?.focus() }, [])

  function handleChange(idx: number, value: string) {
    const digit = value.replace(/\D/g,'').slice(-1)
    const next = [...digits]; next[idx] = digit; setDigits(next)
    if (digit && idx < 5) inputRefs.current[idx+1]?.focus()
    if (digit && idx === 5 && next.every(d=>d)) verifyOTP(next.join(''))
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) inputRefs.current[idx-1]?.focus()
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6)
    if (pasted.length === 6) { setDigits(pasted.split('')); verifyOTP(pasted) }
    e.preventDefault()
  }

  async function verifyOTP(token: string) {
    setLoading(true); setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
    if (err) { setError('Invalid code. Try again.'); setDigits(Array(6).fill('')); inputRefs.current[0]?.focus(); setLoading(false); return }

    const pending = sessionStorage.getItem('pendingReminder')
    if (pending) {
      try {
        const { subject, expiryDate } = JSON.parse(pending)
        await fetch('/api/reminders', { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ subject, expiry_date: expiryDate, notify_email: true }) })
        sessionStorage.removeItem('pendingReminder')
      } catch {}
    }
    router.push('/dashboard')
  }

  const t = { en:{title:'Enter the code',sub:'Check your inbox.'}, id:{title:'Masukkan kode',sub:'Cek kotak masuk Anda.'} }[lang]

  return (
    <main className="min-h-screen bg-obsidian flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full bg-neon-purple/[0.06] blur-[140px]" />
      </div>

      <div className="absolute top-6 right-6 flex gap-1 bg-surface-highest rounded-md p-1">
        {(['en','id'] as const).map(l=>(
          <button key={l} onClick={()=>setLang(l)}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${lang===l?'bg-neon-purple/20 text-neon-purple-dim':'text-on-surface-variant hover:text-white'}`}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <motion.div initial={{opacity:0,y:-16}} animate={{opacity:1,y:0}} className="mb-10 text-center">
        <div className="flex items-center gap-2 justify-center">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-60"/>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-neon-cyan"/>
          </span>
          <span className="text-xl font-semibold tracking-tighter">RemindHer<span className="text-neon-purple-dim">.io</span></span>
        </div>
      </motion.div>

      <motion.div initial={{opacity:0,scale:0.96}} animate={{opacity:1,scale:1}} transition={{delay:0.1}}
        className="glass-card rounded-2xl p-8 w-full max-w-sm glow-purple text-center">
        <h2 className="text-3xl font-medium tracking-tighter text-white mb-2">{t.title}</h2>
        <p className="text-on-surface-variant text-sm mb-1">{t.sub}</p>
        <p className="text-neon-cyan text-xs mb-8 truncate">{email}</p>

        <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
          {digits.map((d,i)=>(
            <input key={i} ref={el=>{inputRefs.current[i]=el}} type="text" inputMode="numeric"
              maxLength={1} value={d} onChange={e=>handleChange(i,e.target.value)}
              onKeyDown={e=>handleKeyDown(i,e)} disabled={loading}
              className={`w-11 h-14 text-center text-xl font-semibold rounded-lg bg-surface-highest text-white outline-none transition-all
                ring-1 ${d?'ring-neon-cyan/60':'ring-outline-dim/30'} focus:ring-neon-cyan/80 disabled:opacity-50`}
            />
          ))}
        </div>

        {error && <motion.p initial={{opacity:0}} animate={{opacity:1}} className="text-neon-red text-xs mb-4">{error}</motion.p>}
        {loading && <p className="text-on-surface-variant text-sm mb-4">Verifying...</p>}

        <button onClick={()=>router.push('/')} className="text-on-surface-variant text-xs hover:text-white transition-colors">
          ← Change email
        </button>
      </motion.div>
    </main>
  )
}

export default function OTPPage() {
  return <Suspense fallback={<div className="min-h-screen bg-obsidian"/>}><OTPForm/></Suspense>
}
