import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { LoopyMascot } from '../../components/LoopyMascot'
import type { Note } from '../../types/db'

const COLORS = ['butter', 'blush', 'mint', 'sky'] as const
const colorHex: Record<(typeof COLORS)[number], string> = {
  butter: '#FFE8A3',
  blush: '#FFB8D1',
  mint: '#B5EAD7',
  sky: '#B8DCFF',
}

export default function Notes() {
  const { space, user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    if (!space) return
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('space_id', space.id)
      .order('creado_en', { ascending: false })
    setNotes((data as Note[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [space])

  async function addNote(e: FormEvent) {
    e.preventDefault()
    if (!space || !user || !texto.trim()) return
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    const rotacion = Math.floor(Math.random() * 6) - 3
    await supabase.from('notes').insert({
      space_id: space.id,
      autor_id: user.id,
      texto,
      color,
      rotacion,
    })
    setTexto('')
    load()
  }

  async function removeNote(id: string) {
    await supabase.from('notes').delete().eq('id', id)
    load()
  }

  return (
    <div className="mx-auto max-w-[1000px] p-6 md:p-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Notitas</h1>
      <p className="text-ink-soft">La heladera virtual de la pareja.</p>

      <form onSubmit={addNote} className="mt-6 flex gap-3">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Dejale una notita…"
          className="h-12 flex-1 rounded-[var(--radius-sm)] bg-surface-soft px-4 outline-none focus:ring-2 focus:ring-lavender"
        />
        <Button type="submit" variant="primary">
          Pegar
        </Button>
      </form>

      {!loading && notes.length === 0 && (
        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <LoopyMascot expression="thinking" />
          <p className="text-ink-soft">Todavía no hay notitas. ¿Dejamos la primera?</p>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-5">
        {notes.map((note) => (
          <div
            key={note.id}
            onClick={() => removeNote(note.id)}
            style={{ background: colorHex[note.color as keyof typeof colorHex] ?? colorHex.butter, transform: `rotate(${note.rotacion}deg)` }}
            className="h-36 w-36 cursor-pointer rounded-[var(--radius-sm)] p-3 font-hand text-lg text-ink shadow-[var(--shadow-loopy-sm)] transition-transform hover:scale-105"
            title="Click para sacar la notita"
          >
            {note.texto}
          </div>
        ))}
      </div>
    </div>
  )
}
