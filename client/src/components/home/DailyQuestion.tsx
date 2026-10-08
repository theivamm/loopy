import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Icon, MoodIcon } from '../ui/Icon'
import { LoopyMascot } from '../LoopyMascot'
import { Button } from '../ui/Button'
import type { Question, QuestionAnswer } from '../../types/db'

function localISO(d = new Date()) {
  const x = new Date(d)
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset())
  return x.toISOString().slice(0, 10)
}

export function DailyQuestion() {
  const { space, user } = useAuth()
  const fecha = localISO()
  const [qs, setQs] = useState<Question[]>([])
  const [answers, setAnswers] = useState<QuestionAnswer[]>([])
  const [partnerDone, setPartnerDone] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)

  async function load() {
    if (!space) return
    const { data: q } = await supabase.from('questions').select('*').order('orden')
    setQs((q as Question[]) ?? [])
    const { data: a } = await supabase.from('question_answers').select('*').eq('space_id', space.id).eq('fecha', fecha)
    setAnswers((a as QuestionAnswer[]) ?? [])
    const { data: done } = await supabase.rpc('partner_answered', { p_space_id: space.id, p_fecha: fecha })
    setPartnerDone(Boolean(done))
  }

  useEffect(() => {
    load()
    if (!space) return
    const channel = supabase
      .channel(`answers-${space.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'question_answers', filter: `space_id=eq.${space.id}` }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [space])

  const dayNumber = Math.floor(new Date(fecha).getTime() / 86400000)
  const question = qs.length ? qs[dayNumber % qs.length] : null
  const mine = answers.find((a) => a.user_id === user?.id)
  const partner = answers.find((a) => a.user_id !== user?.id)

  async function save() {
    if (!space || !user || !question || !draft.trim()) return
    setSaving(true)
    await supabase.from('question_answers').upsert(
      { space_id: space.id, user_id: user.id, question_id: question.id, fecha, respuesta: draft.trim() },
      { onConflict: 'space_id,user_id,fecha' },
    )
    setSaving(false)
    setEditing(false)
    setDraft('')
    load()
  }

  if (!question) return null

  return (
    <section className="card col-span-2 flex flex-col gap-4 md:col-span-6 xl:col-span-7">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Icon name="chats" size={32} />
          <span className="eyebrow">Pregunta del día</span>
        </div>
        {mine && partner && <span className="rounded-full bg-[#D5F3E6] px-3 py-1 text-xs font-bold text-success">Los dos respondieron</span>}
      </div>

      <h3 className="m-0 text-balance font-display text-[21px] font-medium leading-snug text-ink md:text-2xl">{question.texto}</h3>

      {!mine || editing ? (
        <>
          <div className="flex items-center gap-2.5 rounded-full bg-surface-soft py-2 pl-2 pr-4 text-sm font-semibold text-ink-soft">
            <Icon name={partnerDone ? 'lock' : 'clock'} size={30} tone={partnerDone ? 'lavender' : 'sky'} />
            {partnerDone ? 'Tu pareja ya respondió. Se revela cuando contestes.' : 'Tu pareja todavía no respondió.'}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && save()}
              placeholder="Escribí tu respuesta…"
              className="field flex-1"
              maxLength={400}
            />
            <Button variant="secondary" onClick={save} disabled={saving || !draft.trim()}>
              {saving ? 'Guardando…' : 'Responder'}
            </Button>
          </div>
        </>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[26px] bg-lilac-mist p-4">
            <p className="eyebrow m-0 !text-plum">Vos</p>
            <p className="m-0 mt-1 font-hand text-2xl leading-tight text-ink">{mine.respuesta}</p>
            <button onClick={() => { setDraft(mine.respuesta); setEditing(true) }} className="mt-2 text-xs font-bold text-plum underline">Editar</button>
          </div>
          {partner ? (
            <div className="rounded-[26px] bg-[#FFE9DF] p-4">
              <p className="eyebrow m-0 !text-[#F2733F]">Tu pareja</p>
              <p className="m-0 mt-1 font-hand text-2xl leading-tight text-ink">{partner.respuesta}</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-[26px] bg-surface-soft p-4">
              <LoopyMascot size={56} expression="waiting" />
              <p className="m-0 text-sm font-semibold text-ink-soft">Esperando a tu pareja…</p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export { MoodIcon }
