import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Icon, type IconName } from '../../components/ui/Icon'
import { Modal } from '../../components/ui/Modal'
import { Page, PageHeader, IconBtn, Chip } from '../../components/ui/PageShell'
import type { Meal, Recipe, ShoppingItem } from '../../types/db'

const MOMENTOS: Meal['momento'][] = ['desayuno', 'almuerzo', 'cena']
const MLABEL: Record<Meal['momento'], string> = { desayuno: 'Desayuno', almuerzo: 'Almuerzo', cena: 'Cena' }
const MICON: Record<Meal['momento'], IconName> = { desayuno: 'coffee', almuerzo: 'comidas', cena: 'pot' }
type Tab = 'semana' | 'recetas' | 'compras'

const iso = (d: Date) => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10) }
const startOfWeek = (d: Date) => { const x = new Date(d); x.setDate(x.getDate() + (x.getDay() === 0 ? -6 : 1 - x.getDay())); x.setHours(0, 0, 0, 0); return x }

function RecipeForm({ recipe, onClose, onSaved }: { recipe: Recipe | null; onClose: () => void; onSaved: () => void }) {
  const { space } = useAuth()
  const [nombre, setNombre] = useState(recipe?.nombre ?? '')
  const [ing, setIng] = useState((recipe?.ingredientes ?? []).join('\n'))
  const [pasos, setPasos] = useState(recipe?.pasos ?? '')
  const [link, setLink] = useState(recipe?.link ?? '')
  async function save() {
    if (!space || !nombre.trim()) return
    const row = { nombre: nombre.trim(), ingredientes: ing.split('\n').map((s) => s.trim()).filter(Boolean), pasos: pasos.trim() || null, link: link.trim() || null }
    if (recipe) await supabase.from('recipes').update(row).eq('id', recipe.id)
    else await supabase.from('recipes').insert({ ...row, space_id: space.id })
    onSaved()
  }
  async function del() {
    if (!recipe || !confirm('¿Borrar la receta?')) return
    await supabase.from('recipes').delete().eq('id', recipe.id)
    onSaved()
  }
  return (
    <Modal title={recipe ? 'Editar receta' : 'Nueva receta'} onClose={onClose}>
      <input autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre (ej: Ravioles con salsa rosa)" className="field" />
      <textarea value={ing} onChange={(e) => setIng(e.target.value)} rows={5} placeholder={'Ingredientes, uno por línea\nravioles\ncrema\ntomate'} className="field" />
      <textarea value={pasos} onChange={(e) => setPasos(e.target.value)} rows={3} placeholder="Pasos o notas (opcional)" className="field" />
      <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link de la receta (opcional)" className="field" />
      <div className="flex items-center justify-between gap-3">
        {recipe ? <Button variant="danger" onClick={del}><Icon name="trash" bare size={18} />Borrar</Button> : <span />}
        <Button onClick={save} disabled={!nombre.trim()}>Guardar</Button>
      </div>
    </Modal>
  )
}

export default function Meals() {
  const { space, user } = useAuth()
  const [tab, setTab] = useState<Tab>('semana')
  const [offset, setOffset] = useState(0)
  const [meals, setMeals] = useState<Meal[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ fecha: string; momento: Meal['momento'] } | null>(null)
  const [draft, setDraft] = useState('')
  const [newItem, setNewItem] = useState('')
  const [recipeForm, setRecipeForm] = useState<{ r: Recipe | null } | null>(null)
  const [suggest, setSuggest] = useState<Recipe | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const weekStart = useMemo(() => { const w = startOfWeek(new Date()); w.setDate(w.getDate() + offset * 7); return w }, [offset])
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d }), [weekStart])
  const todayISO = iso(new Date())
  const byId = useMemo(() => Object.fromEntries(recipes.map((r) => [r.id, r])), [recipes])

  async function load() {
    if (!space) return
    const [m, r, s, mem] = await Promise.all([
      supabase.from('meals').select('*').eq('space_id', space.id).gte('fecha', iso(days[0])).lte('fecha', iso(days[6])),
      supabase.from('recipes').select('*').eq('space_id', space.id).order('nombre'),
      supabase.from('shopping_items').select('*').eq('space_id', space.id).order('creado_en', { ascending: false }),
      supabase.from('memberships').select('user_id').eq('space_id', space.id),
    ])
    setMeals((m.data as Meal[]) ?? [])
    setRecipes((r.data as Recipe[]) ?? [])
    setItems((s.data as ShoppingItem[]) ?? [])
    setPartnerId(((mem.data ?? []) as { user_id: string }[]).find((x) => x.user_id !== user?.id)?.user_id ?? null)
  }
  useEffect(() => { load() }, [space, offset])
  useEffect(() => {
    if (!space) return
    const f = `space_id=eq.${space.id}`
    const ch = supabase.channel(`meals-${space.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meals', filter: f }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recipes', filter: f }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_items', filter: f }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [space, offset])

  const toast = (t: string) => { setFlash(t); setTimeout(() => setFlash(null), 2200) }
  const mealFor = (fecha: string, m: Meal['momento']) => meals.find((x) => x.fecha === fecha && x.momento === m)

  async function setMeal(fecha: string, momento: Meal['momento'], name: string) {
    if (!space || !name.trim()) return
    let recipe = recipes.find((r) => r.nombre.trim().toLowerCase() === name.trim().toLowerCase())
    if (!recipe) {
      const { data } = await supabase.from('recipes').insert({ space_id: space.id, nombre: name.trim() }).select().single()
      recipe = data as Recipe
    }
    const ex = mealFor(fecha, momento)
    if (ex) await supabase.from('meals').update({ receta_id: recipe.id }).eq('id', ex.id)
    else await supabase.from('meals').insert({ space_id: space.id, fecha, momento, receta_id: recipe.id })
    load()
  }
  async function save(fecha: string, momento: Meal['momento']) {
    if (draft.trim()) await setMeal(fecha, momento, draft)
    setDraft(''); setEditing(null)
  }
  async function cycleCook(m: Meal) {
    if (!user) return
    const next = m.cocina_user_id === null ? user.id : m.cocina_user_id === user.id ? partnerId : null
    setMeals((p) => p.map((x) => (x.id === m.id ? { ...x, cocina_user_id: next } : x)))
    await supabase.from('meals').update({ cocina_user_id: next }).eq('id', m.id)
  }
  async function clearMeal(id: string) { await supabase.from('meals').delete().eq('id', id); load() }

  function renderCell(fecha: string, momento: Meal['momento']) {
    const m = mealFor(fecha, momento)
    if (editing?.fecha === fecha && editing?.momento === momento)
      return <input autoFocus list="recipe-names" value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={() => save(fecha, momento)} onKeyDown={(e) => e.key === 'Enter' && save(fecha, momento)} placeholder="¿Qué comemos?" className="field !h-10 !px-3 text-sm" />
    if (m) {
      const cook = m.cocina_user_id
      return (
        <div className="group flex items-center gap-1.5 rounded-[18px] bg-white py-1.5 pl-3 pr-1.5 shadow-[var(--shadow-loopy-sm)]">
          <button onClick={() => { setEditing({ fecha, momento }); setDraft(byId[m.receta_id ?? '']?.nombre ?? '') }} className="min-w-0 flex-1 truncate text-left text-[13px] font-bold text-ink">{byId[m.receta_id ?? '']?.nombre ?? '—'}</button>
          <button onClick={() => cycleCook(m)} title={cook ? (cook === user?.id ? 'Cocinás vos' : 'Cocina tu pareja') : 'Quién cocina'} aria-label="Quién cocina"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-extrabold transition-transform hover:scale-110" style={{ background: cook ? (cook === user?.id ? '#C9B8FF' : '#FFC2A8') : '#F0EBF3', color: '#2E2440' }}>
            {cook ? (cook === user?.id ? 'Yo' : 'Él') : <Icon name="pot" bare size={14} />}
          </button>
          <button onClick={() => clearMeal(m.id)} aria-label="Sacar" className="grid h-7 w-7 shrink-0 place-items-center rounded-full opacity-60 transition-opacity hover:opacity-100"><Icon name="close" bare size={12} /></button>
        </div>
      )
    }
    return <button onClick={() => { setEditing({ fecha, momento }); setDraft('') }} className="flex w-full items-center gap-1 rounded-[18px] border-2 border-dashed border-[#CDEBDD] px-3 py-2 text-left text-[13px] font-semibold text-[#6FB79B] transition-colors hover:bg-white/70"><Icon name="plus" bare size={14} tone="mint" />agregar</button>
  }

  async function weekIngredients() {
    if (!space || !user) return
    const have = new Set(items.filter((i) => !i.hecho).map((i) => i.texto.trim().toLowerCase()))
    const want = new Set<string>()
    meals.forEach((m) => (byId[m.receta_id ?? '']?.ingredientes ?? []).forEach((g) => { const k = g.trim().toLowerCase(); if (k && !have.has(k)) want.add(g.trim()) }))
    if (!want.size) return toast('No hay ingredientes nuevos para agregar.')
    await supabase.from('shopping_items').insert([...want].map((texto) => ({ space_id: space.id, texto, agregado_por: user.id })))
    toast(`Se agregaron ${want.size} ingredientes.`)
    load()
  }
  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!space || !user || !newItem.trim()) return
    await supabase.from('shopping_items').insert({ space_id: space.id, texto: newItem.trim(), agregado_por: user.id })
    setNewItem(''); load()
  }
  async function toggleItem(i: ShoppingItem) {
    setItems((p) => p.map((x) => (x.id === i.id ? { ...x, hecho: !x.hecho } : x)))
    await supabase.from('shopping_items').update({ hecho: !i.hecho }).eq('id', i.id)
  }
  async function clearDone() { await supabase.from('shopping_items').delete().eq('space_id', space!.id).eq('hecho', true); load() }

  function suggestOne() { if (recipes.length) setSuggest(recipes[Math.floor(Math.random() * recipes.length)]) }
  async function putTonight(r: Recipe) { await setMeal(todayISO, 'cena', r.nombre); setSuggest(null); setTab('semana'); setOffset(0); toast('Listo: cena de hoy.') }

  const pending = items.filter((i) => !i.hecho)
  const done = items.filter((i) => i.hecho)
  const weekLabel = `${days[0].toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })} – ${days[6].toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}`

  return (
    <Page max={1500}>
      <PageHeader icon="comidas" title="Comidas" subtitle="Qué cocinamos, qué comprar." action={<Button variant="secondary" onClick={suggestOne} disabled={!recipes.length}><Icon name="dice" bare size={18} />¿Qué comemos?</Button>} />
      <datalist id="recipe-names">{recipes.map((r) => <option key={r.id} value={r.nombre} />)}</datalist>

      {suggest && (
        <div className="card animate-pop mb-6 flex flex-wrap items-center gap-4 bg-grad-fresh !p-5">
          <Icon name="pot" size={56} />
          <div className="min-w-0 flex-1"><p className="eyebrow m-0">Se me ocurre…</p><p className="m-0 font-display text-2xl font-semibold text-ink">{suggest.nombre}</p></div>
          <Button variant="secondary" onClick={suggestOne}>Otra</Button>
          <Button onClick={() => putTonight(suggest)}>Cenarla hoy</Button>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex rounded-full bg-white/80 p-1.5 shadow-[var(--shadow-loopy-sm)]">
          {([['semana', 'Semana'], ['recetas', `Recetas · ${recipes.length}`], ['compras', `Compras · ${pending.length}`]] as [Tab, string][]).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${tab === k ? 'bg-plum text-white shadow-[var(--shadow-loopy-md)]' : 'text-ink-soft'}`}>{l}</button>
          ))}
        </div>
        {tab === 'semana' && (
          <div className="flex items-center gap-2">
            <button onClick={() => setOffset((o) => o - 1)} aria-label="Semana anterior" className="grid h-10 w-10 place-items-center rounded-full bg-white/80 transition-transform hover:scale-110"><Icon name="caretLeft" bare size={18} /></button>
            <span className="min-w-[190px] text-center text-sm font-bold capitalize text-ink">{offset === 0 ? 'Esta semana' : weekLabel}</span>
            <button onClick={() => setOffset((o) => o + 1)} aria-label="Semana siguiente" className="grid h-10 w-10 place-items-center rounded-full bg-white/80 transition-transform hover:scale-110"><Icon name="caretRight" bare size={18} /></button>
            {offset !== 0 && <Chip onClick={() => setOffset(0)}>Hoy</Chip>}
          </div>
        )}
      </div>

      {tab === 'semana' && (
        <>
          <div className="card hidden bg-[#EAF8F2] md:block">
            <div className="grid grid-cols-[120px_repeat(7,minmax(0,1fr))] gap-2.5">
              <div />
              {days.map((d) => <div key={d.toISOString()} className={`rounded-full py-1.5 text-center text-xs font-bold uppercase ${iso(d) === todayISO ? 'bg-plum text-white' : 'text-ink-soft'}`}>{d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' })}</div>)}
              {MOMENTOS.map((mo) => (
                <div key={mo} className="contents">
                  <div className="flex items-center gap-2 text-sm font-bold text-ink-soft"><Icon name={MICON[mo]} size={34} />{MLABEL[mo]}</div>
                  {days.map((d) => <div key={iso(d) + mo} className="min-h-[52px]">{renderCell(iso(d), mo)}</div>)}
                </div>
              ))}
            </div>
            <p className="m-0 mt-4 text-xs text-ink-soft">Tocá el círculo de cada comida para marcar quién cocina: yo, mi pareja o nadie.</p>
          </div>
          <div className="flex flex-col gap-3 md:hidden">
            {days.map((d) => {
              const f = iso(d), isT = f === todayISO
              return (
                <div key={f} className={`card flex flex-col gap-2 !p-4 ${isT ? 'bg-grad-fresh' : 'bg-[#EAF8F2]'}`}>
                  <p className="m-0 flex items-center gap-2 font-display text-lg font-semibold capitalize text-ink">{d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric' })}{isT && <span className="rounded-full bg-plum px-2.5 py-0.5 font-sans text-[11px] font-bold text-white">Hoy</span>}</p>
                  {MOMENTOS.map((mo) => <div key={mo} className="flex items-center gap-3"><Icon name={MICON[mo]} size={34} /><div className="min-w-0 flex-1">{renderCell(f, mo)}</div></div>)}
                </div>
              )
            })}
          </div>
        </>
      )}

      {tab === 'recetas' && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <button onClick={() => setRecipeForm({ r: null })} className="card card-lift flex min-h-[150px] flex-col items-center justify-center gap-2 border-2 border-dashed border-[#CDEBDD] bg-white/50 text-ink-soft"><Icon name="plus" size={48} tone="mint" />Nueva receta</button>
          {recipes.map((r) => (
            <article key={r.id} className="card card-lift flex flex-col gap-3">
              <div className="flex items-start gap-3"><Icon name="pot" size={48} /><div className="min-w-0 flex-1"><h3 className="m-0 truncate text-lg text-ink">{r.nombre}</h3><p className="m-0 text-xs text-ink-soft">{r.ingredientes?.length ?? 0} ingredientes</p></div><IconBtn icon="edit" label="Editar" onClick={() => setRecipeForm({ r })} /></div>
              {r.ingredientes?.length ? <p className="m-0 line-clamp-2 text-sm text-ink-soft">{r.ingredientes.join(' · ')}</p> : <p className="m-0 text-sm text-ink-muted">Sin ingredientes cargados.</p>}
              <div className="mt-auto flex items-center justify-between gap-2">
                {r.link ? <a href={r.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-plum no-underline"><Icon name="links" bare size={16} />Ver receta</a> : <span />}
                <Button size="sm" variant="secondary" onClick={() => putTonight(r)}>Cenarla hoy</Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {tab === 'compras' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="card flex flex-col gap-4">
            <form onSubmit={addItem} className="flex gap-2"><input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Agregar a la lista…" className="field" /><Button type="submit"><Icon name="plus" bare size={20} tone="lavender" /></Button></form>
            {!items.length && <p className="m-0 py-8 text-center text-ink-soft">La lista está vacía. Traé los ingredientes de la semana →</p>}
            <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
              {pending.map((i) => (
                <li key={i.id}><button onClick={() => toggleItem(i)} className="flex w-full items-center gap-3 rounded-full bg-surface-soft py-2 pl-2 pr-5 text-left transition-colors hover:bg-white"><span className="h-7 w-7 shrink-0 rounded-full border-2 border-[#9ED8BE] bg-white" /><span className="text-sm font-bold text-ink">{i.texto}</span></button></li>
              ))}
            </ul>
            {done.length > 0 && (
              <>
                <div className="flex items-center justify-between"><span className="eyebrow">En el carrito · {done.length}</span><button onClick={clearDone} className="text-xs font-bold text-error underline">Vaciar</button></div>
                <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
                  {done.map((i) => <li key={i.id}><button onClick={() => toggleItem(i)} className="flex w-full items-center gap-3 rounded-full bg-[#E6F7EE] py-2 pl-2 pr-5 text-left opacity-70"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-success"><Icon name="check" bare size={14} className="icon-white" /></span><span className="text-sm font-bold text-ink line-through">{i.texto}</span></button></li>)}
                </ul>
              </>
            )}
          </section>
          <aside className="card flex h-fit flex-col gap-3 bg-grad-fresh">
            <Icon name="bag" size={56} />
            <h3 className="m-0 text-xl text-ink">Compras de la semana</h3>
            <p className="m-0 text-sm text-ink-soft">Trae los ingredientes de las recetas que planearon, sin repetir lo que ya está en la lista.</p>
            <Button onClick={weekIngredients}>Traer de la semana</Button>
          </aside>
        </div>
      )}

      {recipeForm && <RecipeForm recipe={recipeForm.r} onClose={() => setRecipeForm(null)} onSaved={() => { setRecipeForm(null); load() }} />}
      {flash && <div className="animate-pop fixed bottom-28 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white shadow-[var(--shadow-loopy-lg)] md:bottom-8">{flash}</div>}
    </Page>
  )
}
