import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { Page, PageHeader, EmptyState } from '../../components/ui/PageShell'
import type { Note } from '../../types/db'

const COLORS = ['butter', 'blush', 'mint', 'sky'] as const
const colorHex: Record<(typeof COLORS)[number], string> = {
  butter: '#FFE8A3', blush: '#FFC9DB', mint: '#C8F0DF', sky: '#C6E0FF',
}

export default function Notes() {
  const { space, user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    if (!space) return
    const { data } = await supabase.from('notes').select('*').eq('space_id', space.id).order('creado_en', { ascending: false })
    setNotes((data as Note[]) ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [space])

  async function addNote(e: FormEvent) {
    e.preventDefault()
    if (!space || !user || !texto.trim()) return
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    const rotacion = Math.floor(Math.random() * 6) - 3
    await supabase.from('notes').insert({ space_id: space.id, autor_id: user.id, texto, color, rotacion })
    setTexto('')
    load()
  }
  async function removeNote(id: string) { await supabase.from('notes').delete().eq('id', id); load() }

  return (
    <Page max={1000}>
      <PageHeader icon="notitas" title="Notitas" subtitle="La heladera virtual de la pareja." />

      <form onSubmit={addNote} className="card mb-8 flex gap-2 !p-2 md:gap-3">
        <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Dejale una notita…" className="field !bg-transparent" />
        <Button type="submit" className="shrink-0"><Icon name="send" bare size={20} tone="lavender" /><span className="hidden sm:inline">Pegar</span></Button>
      </form>

      {!loading && notes.length === 0 && <EmptyState text="Todavía no hay notitas. ¿Dejamos la primera?" />}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-6">
        {notes.map((note) => (
          <div
            key={note.id}
            style={{ background: colorHex[note.color as keyof typeof colorHex] ?? colorHex.butter, transform: `rotate(${note.rotacion}deg)` }}
            className="group relative flex aspect-square flex-col rounded-[26px_26px_26px_8px] p-4 font-hand text-[22px] leading-[1.05] text-ink shadow-[0_10px_20px_rgba(124,92,219,.14)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:z-10 hover:scale-105 hover:rotate-0"
          >
            <span className="line-clamp-5 break-words">{note.texto}</span>
            <button
              onClick={() => removeNote(note.id)}
              aria-label="Sacar la notita"
              title="Sacar la notita"
              className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/70 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
            >
              <Icon name="close" bare size={16} />
            </button>
          </div>
        ))}
      </div>
    </Page>
  )
}
