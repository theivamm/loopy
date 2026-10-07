import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { LoopyMascot } from '../../components/LoopyMascot'
import type { Idea } from '../../types/db'

const CATEGORIES = ['general', 'citas', 'viajes', 'regalos', 'proyectos']

export default function Ideas() {
  const { space, user } = useAuth()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState(CATEGORIES[0])
  const [privada, setPrivada] = useState(false)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  async function load() {
    if (!space || !user) return
    const { data } = await supabase
      .from('ideas')
      .select('*')
      .eq('space_id', space.id)
      .or(`privada.eq.false,autor_id.eq.${user.id}`)
      .order('votos', { ascending: false })
    setIdeas((data as Idea[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [space, user])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!space || !user || !titulo.trim()) return
    await supabase.from('ideas').insert({
      space_id: space.id,
      autor_id: user.id,
      titulo,
      categoria,
      privada,
    })
    setTitulo('')
    setPrivada(false)
    setOpen(false)
    load()
  }

  async function vote(idea: Idea) {
    await supabase.from('ideas').update({ votos: idea.votos + 1 }).eq('id', idea.id)
    load()
  }

  async function handleDelete(id: string) {
    await supabase.from('ideas').delete().eq('id', id)
    load()
  }

  return (
    <div className="mx-auto max-w-[800px] p-6 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">Ideas</h1>
        <Button variant="primary" onClick={() => setOpen((v) => !v)}>
          {open ? 'Cancelar' : '+ Agregar'}
        </Button>
      </div>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col gap-3 rounded-[var(--radius-lg)] bg-surface p-6 shadow-[var(--shadow-loopy-sm)]"
        >
          <input
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Una idea para los dos…"
            className="h-12 rounded-[var(--radius-sm)] bg-surface-soft px-4 outline-none focus:ring-2 focus:ring-lavender"
          />
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="h-12 rounded-[var(--radius-sm)] bg-surface-soft px-4 capitalize outline-none focus:ring-2 focus:ring-lavender"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" checked={privada} onChange={(e) => setPrivada(e.target.checked)} />
            Guardar como privada (solo yo la veo, por ahora)
          </label>
          <Button type="submit" variant="primary">
            Agregar idea
          </Button>
        </form>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {!loading && ideas.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <LoopyMascot expression="thinking" />
            <p className="text-ink-soft">Todavía no hay ideas. ¿Tiramos la primera?</p>
          </div>
        )}
        {ideas.map((idea) => (
          <div
            key={idea.id}
            className="flex items-center justify-between rounded-[var(--radius-md)] border border-line bg-surface p-4"
          >
            <div>
              <p className="font-semibold text-ink">
                {idea.titulo} {idea.privada && <span className="text-xs text-ink-muted">🔒</span>}
              </p>
              <p className="text-xs uppercase tracking-wide text-ink-muted">{idea.categoria}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => vote(idea)}
                className="flex items-center gap-1 rounded-full bg-lilac-mist px-3 py-1.5 text-sm font-semibold text-plum"
              >
                ❤️ {idea.votos}
              </button>
              <button
                onClick={() => handleDelete(idea.id)}
                className="px-2 text-sm font-semibold text-error"
                aria-label="Eliminar idea"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
