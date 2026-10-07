import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { LoopyMascot } from '../../components/LoopyMascot'
import type { Letter } from '../../types/db'

export default function Letters() {
  const { space, user } = useAuth()
  const [letters, setLetters] = useState<Letter[]>([])
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  async function load() {
    if (!space) return
    const { data } = await supabase
      .from('letters')
      .select('*')
      .eq('space_id', space.id)
      .order('creado_en', { ascending: false })
    setLetters((data as Letter[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [space])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!space || !user || !titulo.trim() || !contenido.trim()) return
    await supabase.from('letters').insert({
      space_id: space.id,
      autor_id: user.id,
      titulo,
      contenido,
    })
    setTitulo('')
    setContenido('')
    setOpen(false)
    load()
  }

  return (
    <div className="mx-auto max-w-[800px] p-6 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">Cartas</h1>
        <Button variant="primary" onClick={() => setOpen((v) => !v)}>
          {open ? 'Cancelar' : '+ Escribir'}
        </Button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mt-6 rounded-[var(--radius-lg)] bg-surface p-6 shadow-[var(--shadow-loopy-sm)]">
          <input
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título"
            className="h-12 w-full rounded-[var(--radius-sm)] bg-surface-soft px-4 outline-none focus:ring-2 focus:ring-lavender"
          />
          <textarea
            required
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            placeholder="Escribí lo que sientas…"
            rows={6}
            className="mt-3 w-full rounded-[var(--radius-sm)] bg-surface-soft p-4 font-hand text-xl outline-none focus:ring-2 focus:ring-lavender"
          />
          <Button type="submit" variant="primary" className="mt-3">
            Enviar carta 💌
          </Button>
        </form>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {!loading && letters.length === 0 && (
          <div className="col-span-2 flex flex-col items-center gap-3 py-12 text-center">
            <LoopyMascot expression="thinking" />
            <p className="text-ink-soft">Todavía no hay cartas. ¿Escribimos la primera?</p>
          </div>
        )}
        {letters.map((letter) => (
          <div
            key={letter.id}
            className="rounded-[var(--radius-lg)] border border-line bg-[#FFF9F4] p-5 shadow-[var(--shadow-loopy-sm)]"
          >
            <p className="font-display text-lg font-semibold text-ink">{letter.titulo}</p>
            <p className="mt-2 whitespace-pre-wrap font-hand text-xl text-ink-soft">{letter.contenido}</p>
            <p className="mt-3 text-xs text-ink-muted">
              {new Date(letter.creado_en).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
