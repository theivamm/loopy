import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Icon, type IconName } from '../../components/ui/Icon'
import { Page, PageHeader } from '../../components/ui/PageShell'
import type { Meal, Recipe } from '../../types/db'

const MOMENTOS: Meal['momento'][] = ['desayuno', 'almuerzo', 'cena']
const MOMENTO_LABEL: Record<Meal['momento'], string> = { desayuno: 'Desayuno', almuerzo: 'Almuerzo', cena: 'Cena' }
const MOMENTO_ICON: Record<Meal['momento'], IconName> = { desayuno: 'coffee', almuerzo: 'comidas', cena: 'pot' }

function startOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}
function toISODate(d: Date) {
  const x = new Date(d)
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset())
  return x.toISOString().slice(0, 10)
}

export default function Meals() {
  const { space } = useAuth()
  const [meals, setMeals] = useState<Meal[]>([])
  const [recipes, setRecipes] = useState<Record<string, Recipe>>({})
  const [editing, setEditing] = useState<{ fecha: string; momento: Meal['momento'] } | null>(null)
  const [draft, setDraft] = useState('')

  const weekStart = startOfWeek(new Date())
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })
  const todayISO = toISODate(new Date())

  async function load() {
    if (!space) return
    const { data: mealsData } = await supabase.from('meals').select('*').eq('space_id', space.id)
      .gte('fecha', toISODate(days[0])).lte('fecha', toISODate(days[6]))
    setMeals((mealsData as Meal[]) ?? [])
    const { data: recipesData } = await supabase.from('recipes').select('*').eq('space_id', space.id)
    const map: Record<string, Recipe> = {}
    for (const r of (recipesData as Recipe[]) ?? []) map[r.id] = r
    setRecipes(map)
  }
  useEffect(() => { load() }, [space])

  const mealFor = (fecha: string, momento: Meal['momento']) => meals.find((m) => m.fecha === fecha && m.momento === momento)

  async function saveMeal(fecha: string, momento: Meal['momento']) {
    if (!space || !draft.trim()) { setEditing(null); return }
    let recipe = Object.values(recipes).find((r) => r.nombre.trim().toLowerCase() === draft.trim().toLowerCase())
    if (!recipe) {
      const { data } = await supabase.from('recipes').insert({ space_id: space.id, nombre: draft.trim() }).select().single()
      recipe = data as Recipe
    }
    const existing = mealFor(fecha, momento)
    if (existing) await supabase.from('meals').update({ receta_id: recipe.id }).eq('id', existing.id)
    else await supabase.from('meals').insert({ space_id: space.id, fecha, momento, receta_id: recipe.id })
    setDraft(''); setEditing(null); load()
  }
  async function clearMeal(id: string) { await supabase.from('meals').delete().eq('id', id); load() }

  function renderCell(fecha: string, momento: Meal['momento']) {
    const meal = mealFor(fecha, momento)
    const isEditing = editing?.fecha === fecha && editing?.momento === momento
    if (isEditing)
      return (
        <input
          autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
          onBlur={() => saveMeal(fecha, momento)} onKeyDown={(e) => e.key === 'Enter' && saveMeal(fecha, momento)}
          placeholder="¿Qué comemos?" className="field !h-10 !px-3 text-sm"
        />
      )
    if (meal)
      return (
        <button onClick={() => clearMeal(meal.id)} title="Tocá para sacar" className="w-full rounded-[18px] bg-white px-3 py-2 text-left text-[13px] font-bold text-ink shadow-[var(--shadow-loopy-sm)] hover:line-through">
          {recipes[meal.receta_id ?? '']?.nombre ?? '—'}
        </button>
      )
    return (
      <button onClick={() => { setEditing({ fecha, momento }); setDraft('') }} className="flex w-full items-center gap-1 rounded-[18px] border-2 border-dashed border-[#CDEBDD] px-3 py-2 text-left text-[13px] font-semibold text-[#6FB79B] transition-colors hover:bg-white/70">
        <Icon name="plus" bare size={14} tone="mint" /> agregar
      </button>
    )
  }

  return (
    <Page>
      <PageHeader icon="comidas" title="Comidas" subtitle={`Semana del ${weekStart.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}`} />

      {/* Desktop */}
      <div className="card hidden bg-[#EAF8F2] md:block">
        <div className="grid grid-cols-[110px_repeat(7,minmax(0,1fr))] gap-2">
          <div />
          {days.map((d) => (
            <div key={d.toISOString()} className={`rounded-full py-1.5 text-center text-xs font-bold uppercase ${toISODate(d) === todayISO ? 'bg-plum text-white' : 'text-ink-soft'}`}>
              {d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' })}
            </div>
          ))}
          {MOMENTOS.map((momento) => (
            <div key={momento} className="contents">
              <div className="flex items-center gap-2 text-sm font-bold text-ink-soft">
                <Icon name={MOMENTO_ICON[momento]} size={32} />{MOMENTO_LABEL[momento]}
              </div>
              {days.map((d) => (
                <div key={toISODate(d) + momento} className="min-h-14">{renderCell(toISODate(d), momento)}</div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: un día por tarjeta */}
      <div className="flex flex-col gap-3 md:hidden">
        {days.map((d) => {
          const fecha = toISODate(d)
          const isToday = fecha === todayISO
          return (
            <div key={fecha} className={`card flex flex-col gap-2 !p-4 ${isToday ? 'bg-grad-fresh' : 'bg-[#EAF8F2]'}`}>
              <p className="m-0 flex items-center gap-2 font-display text-lg font-semibold capitalize text-ink">
                {d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric' })}
                {isToday && <span className="rounded-full bg-plum px-2.5 py-0.5 font-sans text-[11px] font-bold text-white">Hoy</span>}
              </p>
              {MOMENTOS.map((momento) => (
                <div key={momento} className="flex items-center gap-3">
                  <Icon name={MOMENTO_ICON[momento]} size={34} />
                  <div className="min-w-0 flex-1">{renderCell(fecha, momento)}</div>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </Page>
  )
}
