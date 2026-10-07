import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { Page, PageHeader, EmptyState, IconBtn, FormCard } from '../../components/ui/PageShell'
import type { Letter } from '../../types/db'

export default function Letters() {
  const { space, user } = useAuth()
  const [letters, setLetters] = useState<Letter[]>([])
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    if (!space) return
    const { data } = await supabase.from('letters').select('*').eq('space_id', space.id).order('creado_en', { ascending: false })
    setLetters((data as Letter[]) ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [space])

  function startCreate() { setEditingId(null); setTitulo(''); setContenido(''); setOpen(true) }
  function startEdit(l: Letter) { setEditingId(l.id); setTitulo(l.titulo); setContenido(l.contenido); setOpen(true) }
  function cancel() { setOpen(false); setEditingId(null); setTitulo(''); setContenido('') }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!space || !user || !titulo.trim() || !contenido.trim()) return
    if (editingId) await supabase.from('letters').update({ titulo, contenido }).eq('id', editingId)
    else await supabase.from('letters').insert({ space_id: space.id, autor_id: user.id, titulo, contenido })
    cancel(); load()
  }
  async function handleDelete(id: string) { await supabase.from('letters').delete().eq('id', id); load() }

  return (
    <Page max={900}>
      <PageHeader
        icon="cartas" title="Cartas" subtitle="Para hoy, para guardar, para cuando lo necesiten."
        action={
          <Button variant={open ? 'secondary' : 'primary'} onClick={() => (open ? cancel() : startCreate())}>
            <Icon name={open ? 'close' : 'send'} bare size={20} tone="lavender" />
            {open ? 'Cancelar' : 'Escribir'}
          </Button>
        }
      />

      {open && (
        <FormCard onSubmit={handleSubmit}>
          <input required value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título" className="field" />
          <textarea required value={contenido} onChange={(e) => setContenido(e.target.value)} placeholder="Escribí lo que sientas…" rows={6} className="field font-hand text-[22px] leading-snug" />
          <Button type="submit">
            <Icon name="send" bare size={20} tone="lavender" />
            {editingId ? 'Guardar cambios' : 'Enviar carta'}
          </Button>
        </FormCard>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5">
        {!loading && letters.length === 0 && <EmptyState text="Todavía no hay cartas. ¿Escribimos la primera?" />}
        {letters.map((letter, i) => {
          const mine = letter.autor_id === user?.id
          return (
            <article
              key={letter.id}
              className="card card-lift relative flex flex-col gap-2 bg-[#FFFAF3]"
              style={{ transform: `rotate(${i % 2 ? 0.6 : -0.6}deg)` }}
            >
              <div
                className="absolute -top-3 right-5 grid h-11 w-11 place-items-center rounded-full shadow-[0_6px_14px_rgba(124,92,219,.25),inset_0_2px_0_rgba(255,255,255,.5)]"
                style={{ background: mine ? '#C9B8FF' : '#FFC2A8' }}
                title={mine ? 'Escribiste vos' : 'Escribió tu pareja'}
              >
                <Icon name="heart" bare size={22} tone="blush" />
              </div>
              <h3 className="m-0 pr-10 text-xl text-ink">{letter.titulo}</h3>
              <p className="m-0 whitespace-pre-wrap font-hand text-[22px] leading-snug text-ink-soft">{letter.contenido}</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="m-0 text-xs text-ink-muted">{new Date(letter.creado_en).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}</p>
                {mine && (
                  <div className="flex gap-2">
                    <IconBtn icon="edit" label="Editar" onClick={() => startEdit(letter)} />
                    <IconBtn icon="trash" label="Eliminar" danger onClick={() => handleDelete(letter.id)} />
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </Page>
  )
}
