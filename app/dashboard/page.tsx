'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getDaysLeft, getPulseStatus, sanitizeText } from '@/lib/utils'

const FREE_LIMIT = 3

interface Reminder { id:string; subject:string; expiry_date:string; notify_email:boolean; notify_wa:boolean; notify_telegram:boolean }

function PulseIndicator({ expiry_date }: { expiry_date: string }) {
  const days = getDaysLeft(expiry_date)
  const status = getPulseStatus(days)
  const color = status==='safe'?'bg-neon-cyan':status==='warning'?'bg-yellow-400':status==='urgent'?'bg-neon-red':'bg-outline-dim'
  const textColor = status==='safe'?'text-neon-cyan':status==='warning'?'text-yellow-400':status==='urgent'?'text-neon-red':'text-on-surface-variant'
  const label = status==='expired'?'EXPIRED':days===0?'TODAY':days===1?'1 day':`${days}d`
  const dur = status==='safe'?3:status==='warning'?1.5:0.6

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className="relative flex h-2.5 w-2.5">
        {status!=='expired' && (
          <motion.span className={`absolute inline-flex h-full w-full rounded-full ${color} opacity-60`}
            animate={{scale:[1,1.9,1],opacity:[0.6,0,0.6]}} transition={{duration:dur,repeat:Infinity,ease:'easeInOut'}}/>
        )}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`}/>
      </span>
      <span className={`text-xs font-medium tabular-nums ${textColor}`}>{label}</span>
    </div>
  )
}

function PremiumModal({ open, onClose, lang, trigger }: { open:boolean; onClose:()=>void; lang:'en'|'id'; trigger:'limit'|'wa'|'telegram' }) {
  const msg = {
    en:{limit:"You've hit the 3-item free limit.",wa:'WhatsApp requires Premium.',telegram:'Telegram requires Premium.'},
    id:{limit:'Batas 3 item gratis tercapai.',wa:'WhatsApp memerlukan Premium.',telegram:'Telegram memerlukan Premium.'},
  }[lang][trigger]

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center px-4" onClick={onClose}>
          <motion.div initial={{opacity:0,scale:0.9,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.9,y:20}}
            transition={{type:'spring',stiffness:300,damping:25}}
            className="glass-card rounded-2xl p-8 w-full max-w-md relative glow-purple" onClick={e=>e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-4 right-4 text-on-surface-variant hover:text-white text-xl">×</button>
            <div className="inline-flex items-center gap-2 bg-neon-purple/10 rounded-md px-3 py-1 mb-4">
              <span className="text-neon-purple-dim text-xs font-medium tracking-wide">PREMIUM</span>
            </div>
            <h2 className="text-2xl font-medium tracking-tighter mb-2">Unlock <span className="text-neon-purple-dim">Digital Pulse</span></h2>
            <p className="text-on-surface-variant text-sm mb-6">{msg}</p>
            <ul className="space-y-2 mb-8">
              {['∞ Unlimited Objects','📲 WhatsApp & Telegram','🔗 Webhook Integration','📊 Analytics'].map(f=>(
                <li key={f} className="flex items-center gap-3 text-sm">
                  <span className="w-7 h-7 rounded-lg bg-surface-highest flex items-center justify-center shrink-0">{f[0]}</span>
                  {f.slice(2)}<span className="ml-auto text-neon-cyan text-xs">✓</span>
                </li>
              ))}
            </ul>
            <div className="flex items-baseline gap-1 mb-3"><span className="text-3xl font-semibold">$19</span><span className="text-on-surface-variant text-sm">/mo</span></div>
            <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.98}} className="btn-primary w-full rounded-lg py-3 text-sm mb-2"
              onClick={()=>alert('Payment coming soon!')}>
              Upgrade to Premium →
            </motion.button>
            <button onClick={onClose} className="w-full text-center text-on-surface-variant text-xs hover:text-white py-1">No thanks</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [tier, setTier] = useState<'free'|'premium'>('free')
  const [showAdd, setShowAdd] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const [newDate, setNewDate] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string|null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalTrigger, setModalTrigger] = useState<'limit'|'wa'|'telegram'>('limit')
  const [lang, setLang] = useState<'en'|'id'>('en')

  const t = {
    en:{title:'Your Digital Pulse',sub:'Active reminders',empty:'No reminders yet. Add your first ↓',
      total:'Total',nearExpiry:'Near Expiry',add:'+ Add',logout:'Log out',
      subject:'What needs tracking?',date:'Expiry date',save:'Save →',cancel:'Cancel'},
    id:{title:'Detak Digital Anda',sub:'Pengingat aktif',empty:'Belum ada pengingat. Tambah yang pertama ↓',
      total:'Total',nearExpiry:'Akan Kadaluarsa',add:'+ Tambah',logout:'Keluar',
      subject:'Apa yang perlu dipantau?',date:'Tanggal kadaluarsa',save:'Simpan →',cancel:'Batal'},
  }[lang]

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/reminders')
    if (res.status===401) { router.push('/'); return }
    const data = await res.json()
    setReminders(data.reminders ?? [])
    setLoading(false)
  }, [router])

  const fetchTier = useCallback(async () => {
    const supabase = createClient()
    const { data:{user} } = await supabase.auth.getUser()
    if (!user) return
    const res = await fetch('/api/user/tier')
    if (res.ok) { const d = await res.json(); setTier(d.tier ?? 'free') }
  }, [])

  useEffect(() => { fetchData(); fetchTier() }, [fetchData, fetchTier])

  async function handleAdd() {
    if (tier==='free' && reminders.length>=FREE_LIMIT) { setModalTrigger('limit'); setShowModal(true); return }
    const clean = sanitizeText(newSubject)
    if (!clean || !newDate) return
    setAddLoading(true)
    await fetch('/api/reminders', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ subject:clean, expiry_date:newDate, notify_email:true }) })
    setNewSubject(''); setNewDate(''); setShowAdd(false)
    await fetchData(); setAddLoading(false)
  }

  async function handleDelete(id: string) {
    setDeleteId(id)
    await fetch(`/api/reminders/${id}`, { method:'DELETE' })
    await fetchData(); setDeleteId(null)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const nearExpiry = reminders.filter(r=>{ const d=getDaysLeft(r.expiry_date); return d>=0 && d<7 }).length

  return (
    <main className="min-h-screen bg-obsidian flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[300px] rounded-full bg-neon-purple/[0.06] blur-[120px] pointer-events-none"/>
      <div className="absolute bottom-0 left-0 w-[400px] h-[200px] rounded-full bg-neon-cyan/[0.04] blur-[100px] pointer-events-none"/>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-outline-dim/10">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-60"/>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-neon-cyan"/>
          </span>
          <span className="text-lg font-semibold tracking-tighter">RemindHer<span className="text-neon-purple-dim">.io</span></span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-surface-highest rounded-md p-0.5">
            {(['en','id'] as const).map(l=>(
              <button key={l} onClick={()=>setLang(l)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${lang===l?'bg-neon-purple/20 text-neon-purple-dim':'text-on-surface-variant hover:text-white'}`}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <button onClick={handleLogout} className="text-on-surface-variant text-xs hover:text-white transition-colors">{t.logout}</button>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-medium tracking-tighter text-white mb-1">{t.title}</h1>
          <p className="text-on-surface-variant text-sm">{t.sub}</p>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-16 rounded-xl bg-surface-mid animate-pulse"/>)}</div>
        ) : reminders.length===0 ? (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-center py-16 text-on-surface-variant">
            <div className="text-4xl mb-4">📭</div><p className="text-sm">{t.empty}</p>
          </motion.div>
        ) : (
          <motion.ul className="space-y-3" layout>
            <AnimatePresence initial={false}>
              {reminders.map(r=>(
                <motion.li key={r.id} layout initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,x:-20}}
                  className="glass-card rounded-xl px-5 py-4 flex items-center gap-4 group">
                  <PulseIndicator expiry_date={r.expiry_date}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{r.subject}</p>
                    <p className="text-on-surface-variant text-xs mt-0.5">
                      {new Date(r.expiry_date).toLocaleDateString(lang==='id'?'id-ID':'en-US',{year:'numeric',month:'short',day:'numeric'})}
                    </p>
                  </div>
                  {r.notify_email && <span className="text-neon-cyan/70 text-xs" title="Email">✉</span>}
                  <button onClick={()=>handleDelete(r.id)} disabled={deleteId===r.id}
                    className="text-on-surface-variant/30 group-hover:text-neon-red/70 transition-colors text-lg leading-none disabled:opacity-30 shrink-0">
                    {deleteId===r.id?'…':'×'}
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}

        {/* Add form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} className="mt-4 overflow-hidden">
              <div className="glass-card rounded-xl p-5 space-y-3">
                <input type="text" placeholder={t.subject} value={newSubject} onChange={e=>setNewSubject(e.target.value)} maxLength={255}
                  className="input-neon w-full bg-surface-highest text-white placeholder-on-surface-variant rounded-lg px-4 py-2.5 text-sm"/>
                <input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
                  className="input-neon w-full bg-surface-highest text-white rounded-lg px-4 py-2.5 text-sm"/>
                <div className="flex gap-2">
                  <motion.button whileTap={{scale:0.97}} onClick={handleAdd} disabled={addLoading}
                    className="btn-primary flex-1 rounded-lg py-2.5 text-sm disabled:opacity-60">
                    {addLoading?'...':t.save}
                  </motion.button>
                  <button onClick={()=>setShowAdd(false)} className="btn-ghost flex-1 rounded-lg py-2.5 text-sm">{t.cancel}</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FAB */}
      {!showAdd && (
        <motion.button initial={{scale:0}} animate={{scale:1}} whileHover={{scale:1.05}} whileTap={{scale:0.95}}
          onClick={()=>{ if(tier==='free'&&reminders.length>=FREE_LIMIT){setModalTrigger('limit');setShowModal(true)}else setShowAdd(true) }}
          data-testid="fab-add"
          className="fixed bottom-24 right-6 z-20 btn-primary rounded-xl px-5 py-3 text-sm font-semibold shadow-neon-purple">
          {t.add}
        </motion.button>
      )}

      {/* Footer stats */}
      <footer className="relative z-10 border-t border-outline-dim/10 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="text-center">
            <p className="text-xl font-semibold tabular-nums">{reminders.length}</p>
            <p className="text-on-surface-variant text-xs">{t.total}</p>
          </div>
          <div className="w-px h-8 bg-outline-dim/20"/>
          <div className="text-center">
            <p className={`text-xl font-semibold tabular-nums ${nearExpiry>0?'text-neon-red':''}`}>{nearExpiry}</p>
            <p className="text-on-surface-variant text-xs">{t.nearExpiry}</p>
          </div>
          <div className="w-px h-8 bg-outline-dim/20"/>
          <div className="text-center">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${tier==='premium'?'bg-neon-purple/20 text-neon-purple-dim':'bg-surface-highest text-on-surface-variant'}`}>
              {tier.toUpperCase()}
            </span>
          </div>
        </div>
      </footer>

      <PremiumModal open={showModal} onClose={()=>setShowModal(false)} lang={lang} trigger={modalTrigger}/>
    </main>
  )
}
