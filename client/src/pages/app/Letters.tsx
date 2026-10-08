import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { notifyPartner } from '../../lib/push'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { Page, PageHeader, EmptyState, IconBtn, Chip } from '../../components/ui/PageShell'
import { RichEditor, RichToolbar } from '../../components/letters/RichText'
import { LetterPaper, Seal } from '../../components/letters/LetterPaper'
import { StickerPicker } from '../../components/letters/StickerPicker'
import { LetterReader } from '../../components/letters/LetterReader'
import {
  CONDICIONES, DEFAULT_PAPER, FONTS, INKS, KINDS, PAPER_COLORS, parsePaper, isEmptyHtml, sanitizeHtml, toHtml,
  type Deco, type Paper,
} from '../../lib/letterStyle'
import type { Letter } from '../../types/db'

type Filter = 'todas' | 'recibidas' | 'enviadas'

const plain = (html: string) => {
  const d = document.createElement('div')
  d.innerHTML = toHtml(html)
  return (d.textContent ?? '').trim()
}
const toLocalInput = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}
const isLocked = (l: Letter, uid?: string) => l.tipo === 'programada' && !!l.abrir_en && new Date(l.abrir_en) > new Date() && l.autor_id !== uid
const daysTo = (iso: string) => Math.max(1, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000))

/* ───────────────────────── Editor ───────────────────────── */
function LetterEditor({ letter, onClose, onSaved }: { letter: Letter | null; onClose: () => void; onSaved: () => void }) {
  const { space, user } = useAuth()
  const [titulo, setTitulo] = useState(letter?.titulo ?? '')
  const [html, setHtml] = useState(letter ? toHtml(letter.contenido) : '')
  const [paper, setPaper] = useState<Paper>(letter ? parsePaper(letter.estilo) : DEFAULT_PAPER)
  const [decos, setDecos] = useState<Deco[]>(letter?.decoraciones ?? [])
  const [sel, setSel] = useState<string | null>(null)
  const [tipo, setTipo] = useState<Letter['tipo']>(letter?.tipo ?? 'normal')
  const [abrirEn, setAbrirEn] = useState(toLocalInput(letter?.abrir_en ?? null))
  const [condicion, setCondicion] = useState(letter?.condicion ?? CONDICIONES[0])
  const [tab, setTab] = useState<'papel' | 'stickers' | 'envio'>('papel')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selected = decos.find((d) => d.id === sel) ?? null
  const patchDeco = (id: string, p: Partial<Deco>) => setDecos((prev) => prev.map((d) => (d.id === id ? { ...d, ...p } : d)))

  function addDeco(d: { type: Deco['type']; ref: string; size?: number }) {
    const nd: Deco = { id: crypto.randomUUID(), type: d.type, ref: d.ref, size: d.size ?? 64, x: 50 + (Math.random() * 30 - 15), y: 30 + Math.random() * 30, rot: Math.round(Math.random() * 24 - 12) }
    setDecos((p) => [...p, nd])
    setSel(nd.id)
  }

  async function save(e?: FormEvent) {
    e?.preventDefault()
    if (!space || !user) return
    if (!titulo.trim()) return setError('Ponele un título a la carta.')
    if (isEmptyHtml(html)) return setError('La carta está vacía.')
    if (tipo === 'programada' && !abrirEn) return setError('Elegí cuándo se puede abrir.')
    setSaving(true)
    setError(null)
    const row = {
      titulo: titulo.trim(),
      contenido: sanitizeHtml(html),
      estilo: JSON.stringify(paper),
      decoraciones: decos,
      tipo,
      abrir_en: tipo === 'programada' ? new Date(abrirEn).toISOString() : null,
      condicion: tipo === 'condicional' ? condicion : null,
    }
    if (letter) {
      const { error: err } = await supabase.from('letters').update(row).eq('id', letter.id)
      if (err) { setSaving(false); return setError('Uy, se nos enredó el hilo. Probá de nuevo.') }
    } else {
      const { data, error: err } = await supabase.from('letters').insert({ ...row, space_id: space.id, autor_id: user.id }).select('id').single()
      if (err || !data) { setSaving(false); return setError('Uy, se nos enredó el hilo. Probá de nuevo.') }
      notifyPartner('letter', data.id)
    }
    setSaving(false)
    onSaved()
  }

  const tabBtn = (k: typeof tab, label: string) => (
    <button type="button" onClick={() => setTab(k)} className={`flex-1 rounded-full py-2.5 text-[13px] font-bold transition-all ${tab === k ? 'bg-white text-plum shadow-[var(--shadow-loopy-sm)]' : 'text-ink-muted'}`}>{label}</button>
  )
  const Label = ({ children }: { children: string }) => <p className="eyebrow m-0 mb-2">{children}</p>

  return (
    <Page max={1400}>
      <PageHeader
        icon="cartas"
        title={letter ? 'Editar carta' : 'Nueva carta'}
        subtitle="Escribí, decorá y mandala."
        action={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => save()} disabled={saving}>
              <Icon name="send" bare size={20} tone="lavender" />{saving ? 'Guardando…' : letter ? 'Guardar' : tipo === 'programada' ? 'Programar' : 'Enviar'}
            </Button>
          </div>
        }
      />
      {error && <p className="mb-4 rounded-full bg-[#FFE6EA] px-5 py-2.5 text-sm font-bold text-error">{error}</p>}

      <form onSubmit={save} className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-w-0 flex-col gap-4">
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título de la carta" className="field !h-14 font-display text-xl font-semibold" maxLength={80} />
          <div className="sticky top-[76px] z-20"><RichToolbar /></div>
          <LetterPaper
            paper={paper}
            decos={decos}
            selectedId={sel}
            onSelect={setSel}
            onMove={(id, x, y) => patchDeco(id, { x, y })}
            editor={<RichEditor initial={html} onChange={setHtml} />}
          />
          {selected && (
            <div className="card animate-pop flex flex-wrap items-center gap-x-6 gap-y-3 !p-4">
              <label className="flex items-center gap-3 text-[13px] font-bold text-ink-soft">Tamaño
                <input type="range" min={28} max={220} value={selected.size} onChange={(e) => patchDeco(selected.id, { size: Number(e.target.value) })} className="w-32 accent-[#7C5CDB]" />
              </label>
              <label className="flex items-center gap-3 text-[13px] font-bold text-ink-soft">Giro
                <input type="range" min={-45} max={45} value={selected.rot} onChange={(e) => patchDeco(selected.id, { rot: Number(e.target.value) })} className="w-32 accent-[#7C5CDB]" />
              </label>
              <Button type="button" variant="danger" size="sm" className="ml-auto" onClick={() => { setDecos((p) => p.filter((d) => d.id !== selected.id)); setSel(null) }}>
                <Icon name="trash" bare size={16} tone="blush" />Quitar
              </Button>
            </div>
          )}
        </div>

        <aside className="card flex h-fit flex-col gap-5 xl:sticky xl:top-[92px]">
          <div className="flex rounded-full bg-surface-soft p-1">{tabBtn('papel', 'Papel')}{tabBtn('stickers', 'Stickers')}{tabBtn('envio', 'Envío')}</div>

          {tab === 'papel' && (
            <>
              <div>
                <Label>Color del papel</Label>
                <div className="flex flex-wrap gap-2.5">
                  {PAPER_COLORS.map((c) => (
                    <button type="button" key={c.key} onClick={() => setPaper({ ...paper, color: c.hex })} aria-label={c.key} title={c.key}
                      className={`h-10 w-10 rounded-full shadow-[inset_0_2px_0_rgba(255,255,255,.7),0_4px_10px_rgba(124,92,219,.15)] transition-transform ${paper.color === c.hex ? 'scale-110 outline outline-[3px] outline-plum' : 'hover:scale-105'}`}
                      style={{ background: c.hex }} />
                  ))}
                </div>
              </div>
              <div>
                <Label>Tipo de hoja</Label>
                <div className="grid grid-cols-2 gap-2">
                  {KINDS.map((k) => (
                    <button type="button" key={k.key} onClick={() => setPaper({ ...paper, kind: k.key })}
                      className={`rounded-full py-2.5 text-[13px] font-bold transition-all ${paper.kind === k.key ? 'bg-lilac-mist text-plum shadow-[var(--shadow-loopy-md)]' : 'bg-surface-soft text-ink-soft hover:bg-white'}`}>{k.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Letra</Label>
                <div className="flex flex-col gap-2">
                  {FONTS.map((f) => (
                    <button type="button" key={f.key} onClick={() => setPaper({ ...paper, font: f.key })}
                      className={`rounded-full px-5 py-2.5 text-left transition-all ${paper.font === f.key ? 'bg-lilac-mist text-plum shadow-[var(--shadow-loopy-md)]' : 'bg-surface-soft text-ink-soft hover:bg-white'}`}
                      style={{ fontFamily: f.family, fontSize: f.key === 'hand' ? 22 : 15 }}>{f.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Color de tinta</Label>
                <div className="flex flex-wrap gap-2.5">
                  {INKS.map((c) => (
                    <button type="button" key={c} onClick={() => setPaper({ ...paper, ink: c })} aria-label="Tinta"
                      className={`h-9 w-9 rounded-full ring-2 ring-white transition-transform ${paper.ink === c ? 'scale-110 outline outline-[3px] outline-plum' : 'hover:scale-105'}`} style={{ background: c }} />
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === 'stickers' && (
            <>
              <p className="m-0 text-[13px] text-ink-soft">Tocá uno para pegarlo en la hoja y arrastralo donde quieras.</p>
              <StickerPicker onAdd={addDeco} />
            </>
          )}

          {tab === 'envio' && (
            <>
              <div className="flex flex-col gap-2">
                {([
                  ['normal', 'Enviar ahora', 'Tu pareja la recibe enseguida.'],
                  ['programada', 'Programar', 'Se abre en la fecha que elijas.'],
                  ['condicional', 'Abrir cuando…', 'Una carta para un momento especial.'],
                ] as const).map(([k, t, d]) => (
                  <button type="button" key={k} onClick={() => setTipo(k)}
                    className={`rounded-[22px] px-5 py-3 text-left transition-all ${tipo === k ? 'bg-lilac-mist shadow-[var(--shadow-loopy-md)]' : 'bg-surface-soft hover:bg-white'}`}>
                    <p className={`m-0 text-sm font-bold ${tipo === k ? 'text-plum' : 'text-ink'}`}>{t}</p>
                    <p className="m-0 text-xs text-ink-soft">{d}</p>
                  </button>
                ))}
              </div>
              {tipo === 'programada' && (
                <div><Label>Se abre el</Label><input type="datetime-local" value={abrirEn} onChange={(e) => setAbrirEn(e.target.value)} className="field" /></div>
              )}
              {tipo === 'condicional' && (
                <div>
                  <Label>Abrir cuando…</Label>
                  <div className="flex flex-wrap gap-2">
                    {CONDICIONES.map((c) => (
                      <button type="button" key={c} onClick={() => setCondicion(c)}
                        className={`rounded-full px-4 py-2 text-[13px] font-bold transition-all ${condicion === c ? 'bg-plum text-white shadow-[var(--shadow-loopy-md)]' : 'bg-surface-soft text-ink-soft hover:bg-white'}`}>{c}</button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </aside>
      </form>
    </Page>
  )
}

/* ───────────────────────── Lista ───────────────────────── */
function EnvelopeCard({ letter, mine, uid, onOpen, onEdit, onDelete }: {
  letter: Letter; mine: boolean; uid?: string; onOpen: () => void; onEdit: () => void; onDelete: () => void
}) {
  const paper = parsePaper(letter.estilo)
  const locked = isLocked(letter, uid)
  const seal = letter.decoraciones?.find((d) => d.type === 'seal')?.ref ?? (mine ? 'lavanda|heart' : 'dorado|heart')
  const isNew = !mine && !letter.leida && !locked
  return (
    <article className="card card-lift group relative flex flex-col gap-4 !p-0 overflow-hidden">
      <button onClick={locked ? undefined : onOpen} disabled={locked} className="relative block h-[150px] w-full text-left" style={{ background: paper.color }} aria-label={`Abrir ${letter.titulo}`}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,.55), rgba(0,0,0,.05))' }} />
        <div className="absolute inset-x-0 top-0 h-[96px]" style={{ background: paper.color, clipPath: 'polygon(0 0, 100% 0, 50% 100%)', filter: 'brightness(.94)' }} />
        <div className="absolute left-1/2 top-[64px] -translate-x-1/2 transition-transform duration-300 group-hover:scale-110"><Seal spec={seal} size={50} /></div>
        {isNew && <span className="absolute right-4 top-4 rounded-full bg-coral px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-[var(--shadow-loopy-md)]">Nueva</span>}
        {locked && <span className="absolute inset-0 grid place-items-center bg-white/55 backdrop-blur-[2px]"><Icon name="lock" size={52} /></span>}
      </button>
      <div className="flex flex-1 flex-col gap-2 px-5 pb-5">
        <h3 className="m-0 line-clamp-1 text-lg text-ink">{letter.tipo === 'condicional' && letter.condicion ? `Abrir cuando ${letter.condicion}` : letter.titulo}</h3>
        {locked
          ? <p className="m-0 text-sm font-semibold text-ink-soft">Se abre en {daysTo(letter.abrir_en!)} {daysTo(letter.abrir_en!) === 1 ? 'día' : 'días'}</p>
          : <p className="m-0 line-clamp-2 min-h-[40px] text-sm text-ink-soft">{plain(letter.contenido)}</p>}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip tone={mine ? 'lavender' : 'peach'}>{mine ? 'Enviada' : 'Recibida'}</Chip>
            {letter.tipo === 'programada' && <Chip tone="sky"><Icon name="clock" bare size={14} />Programada</Chip>}
            {mine && letter.leida && <Chip tone="mint"><Icon name="check" bare size={14} tone="mint" />Leída</Chip>}
          </div>
          {mine && (
            <div className="flex gap-2">
              <IconBtn icon="edit" label="Editar" onClick={onEdit} />
              <IconBtn icon="trash" label="Eliminar" danger onClick={onDelete} />
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export default function Letters() {
  const { space, user } = useAuth()
  const [letters, setLetters] = useState<Letter[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Letter | null | 'new'>(null)
  const [reading, setReading] = useState<Letter | null>(null)
  const [filter, setFilter] = useState<Filter>('todas')

  async function load() {
    if (!space) return
    const { data } = await supabase.from('letters').select('*').eq('space_id', space.id).order('creado_en', { ascending: false })
    setLetters(((data as Letter[]) ?? []).map((l) => ({ ...l, decoraciones: l.decoraciones ?? [] })))
    setLoading(false)
  }
  useEffect(() => { load() }, [space])

  async function remove(id: string) {
    if (!confirm('¿Eliminar esta carta?')) return
    await supabase.from('letters').delete().eq('id', id)
    load()
  }

  if (editing) {
    return <LetterEditor letter={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />
  }

  const shown = letters.filter((l) => (filter === 'todas' ? true : filter === 'enviadas' ? l.autor_id === user?.id : l.autor_id !== user?.id))
  const unread = letters.filter((l) => l.autor_id !== user?.id && !l.leida && !isLocked(l, user?.id)).length

  return (
    <Page>
      <PageHeader
        icon="cartas"
        title="Cartas"
        subtitle={unread ? `${unread} ${unread === 1 ? 'carta nueva para abrir' : 'cartas nuevas para abrir'}` : 'Para hoy, para guardar, para cuando lo necesiten.'}
        action={<Button onClick={() => setEditing('new')}><Icon name="send" bare size={20} tone="lavender" />Escribir</Button>}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {(['todas', 'recibidas', 'enviadas'] as Filter[]).map((f) => (
          <Chip key={f} active={filter === f} onClick={() => setFilter(f)}><span className="capitalize">{f}</span></Chip>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {!loading && shown.length === 0 && <EmptyState text="Todavía no hay cartas. ¿Escribimos la primera?" />}
        {shown.map((l) => (
          <EnvelopeCard key={l.id} letter={l} mine={l.autor_id === user?.id} uid={user?.id} onOpen={() => setReading(l)} onEdit={() => setEditing(l)} onDelete={() => remove(l.id)} />
        ))}
      </div>

      {reading && <LetterReader letter={reading} mine={reading.autor_id === user?.id} onClose={() => setReading(null)} onRead={load} />}
    </Page>
  )
}
