import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Icon, type IconName } from '../../components/ui/Icon'
import { Page, PageHeader, EmptyState, IconBtn, FormCard } from '../../components/ui/PageShell'
import type { Idea } from '../../types/db'

const CATEGORIES: { key: string; icon: IconName }[] = [
  { key: 'general', icon: 'ideas' },
  { key: 'citas', icon: 'heart' },
  { key: 'viajes', icon: 'plane' },
  { key: 'regalos', icon: 'gift' },
  { key: 'proyectos', icon: 'rocket' },
]
const catIcon = (c: string | null): IconName => CATEGORIES.find((x) => x.key === c)?.icon ?? 'ideas'

export default function Ideas() {
  const { space, user } = useAuth()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState(CATEGORIES[0].key)
  const [privada, setPrivada] = useState(false)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  async function load() {
    if (!space || !user) return
    const { data } = await supabase.from('ideas').select('*').eq('space_id', space.id)
      .or(`privada.eq.false,autor_id.eq.${user.id}`).order('votos', { ascending: false })
    setIdeas((data as Idea[]) ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [space, user])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!space || !user || !titulo.trim()) return
    await supabase.from('ideas').insert({ space_id: space.id, autor_id: user.id, titulo, categoria, privada })
    setTitulo(''); setPrivada(false); setOpen(false); load()
  }
  async function vote(idea: Idea) { await supabase.from('ideas').update({ votos: idea.votos + 1 }).eq('id', idea.id); load() }
  async function handleDelete(id: string) { await supabase.from('ideas').delete().eq('id', id); load() }

  return (
    <Page>
      <PageHeader
        icon="ideas" title="Ideas" subtitle="Lo que sueñan hacer juntos."
        action={
          <Button variant={open ? 'secondary' : 'primary'} onClick={() => setOpen((v) => !v)}>
            <Icon name={open ? 'close' : 'plus'} bare size={20} tone="lavender" />
            {open ? 'Cancelar' : 'Agregar'}
          </Button>
        }
      />

      {open && (
        <FormCard onSubmit={handleSubmit}>
          <input required value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Una idea para los dos…" className="field" />
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                type="button" key={c.key} onClick={() => setCategoria(c.key)}
                className={`inline-flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-bold capitalize transition-all ${
                  categoria === c.key ? 'bg-lilac-mist text-plum shadow-[var(--shadow-loopy-md)]' : 'bg-surface-soft text-ink-soft'
                }`}
              >
                <Icon name={c.icon} size={30} />{c.key}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-3 rounded-full bg-surface-soft px-4 py-3 text-sm text-ink-soft">
            <input type="checkbox" checked={privada} onChange={(e) => setPrivada(e.target.checked)} className="h-5 w-5 accent-[#7C5CDB]" />
            Guardar como privada (solo yo la veo, por ahora)
          </label>
          <Button type="submit">Agregar idea</Button>
        </FormCard>
      )}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2 2xl:grid-cols-3">
        {!loading && ideas.length === 0 && <EmptyState text="Todavía no hay ideas. ¿Tiramos la primera?" />}
        {ideas.map((idea) => (
          <div key={idea.id} className="card card-lift flex items-center gap-3 !p-4">
            <Icon name={catIcon(idea.categoria)} size={48} />
            <div className="min-w-0 flex-1">
              <p className="m-0 flex items-center gap-1.5 font-bold text-ink">
                <span className="truncate">{idea.titulo}</span>
                {idea.privada && <Icon name="lock" bare size={16} />}
              </p>
              <p className="eyebrow m-0 !text-[11px] text-ink-muted">{idea.categoria}</p>
            </div>
            <button
              onClick={() => vote(idea)}
              className="flex items-center gap-1.5 rounded-full bg-[#FFE0EA] px-3.5 py-2 text-sm font-bold text-[#E8588A] transition-transform hover:scale-110 active:scale-90"
              aria-label="Votar"
            >
              <Icon name="heart" bare size={18} /> {idea.votos}
            </button>
            <IconBtn icon="trash" label="Eliminar idea" danger onClick={() => handleDelete(idea.id)} />
          </div>
        ))}
      </div>
    </Page>
  )
}
