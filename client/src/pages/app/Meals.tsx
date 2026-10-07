import { Fragment, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import type { Meal, Recipe } from '../../types/db'

const MOMENTOS: Meal['momento'][] = ['desayuno', 'almuerzo', 'cena']
const MOMENTO_LABEL: Record<Meal['momento'], string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  cena: 'Cena',
}

function startOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10)
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

  async function load() {
    if (!space) return
    const from = toISODate(days[0])
    const to = toISODate(days[6])
    const { data: mealsData } = await supabase
      .from('meals')
      .select('*')
      .eq('space_id', space.id)
      .gte('fecha', from)
      .lte('fecha', to)
    setMeals((mealsData as Meal[]) ?? [])

    const { data: recipesData } = await supabase.from('recipes').select('*').eq('space_id', space.id)
    const map: Record<string, Recipe> = {}
    for (const r of (recipesData as Recipe[]) ?? []) map[r.id] = r
    setRecipes(map)
  }

  useEffect(() => {
    load()
  }, [space])

  function mealFor(fecha: string, momento: Meal['momento']) {
    return meals.find((m) => m.fecha === fecha && m.momento === momento)
  }

  async function saveMeal(fecha: string, momento: Meal['momento']) {
    if (!space || !draft.trim()) {
      setEditing(null)
      return
    }

    let recipe = Object.values(recipes).find(
      (r) => r.nombre.trim().toLowerCase() === draft.trim().toLowerCase(),
    )

    if (!recipe) {
      const { data } = await supabase
        .from('recipes')
        .insert({ space_id: space.id, nombre: draft.trim() })
        .select()
        .single()
      recipe = data as Recipe
    }

    const existing = mealFor(fecha, momento)
    if (existing) {
      await supabase.from('meals').update({ receta_id: recipe.id }).eq('id', existing.id)
    } else {
      await supabase.from('meals').insert({
        space_id: space.id,
        fecha,
        momento,
        receta_id: recipe.id,
      })
    }

    setDraft('')
    setEditing(null)
    load()
  }

  async function clearMeal(id: string) {
    await supabase.from('meals').delete().eq('id', id)
    load()
  }

  return (
    <div className="mx-auto max-w-[1000px] p-6 md:p-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Calendario de comidas</h1>
      <p className="text-ink-soft">Semana del {weekStart.toLocaleDateString('es-AR')}</p>

      <div className="mt-6 overflow-x-auto">
        <div className="grid min-w-[700px] grid-cols-8 gap-2">
          <div />
          {days.map((d) => (
            <div key={d.toISOString()} className="text-center text-xs font-semibold uppercase text-ink-muted">
              {d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' })}
            </div>
          ))}

          {MOMENTOS.map((momento) => (
            <Fragment key={momento}>
              <div className="flex items-center text-sm font-semibold text-ink-soft">
                {MOMENTO_LABEL[momento]}
              </div>
              {days.map((d) => {
                const fecha = toISODate(d)
                const meal = mealFor(fecha, momento)
                const isEditing = editing?.fecha === fecha && editing?.momento === momento
                return (
                  <div
                    key={fecha + momento}
                    className="min-h-16 rounded-[var(--radius-sm)] bg-surface-soft p-2 text-xs"
                  >
                    {isEditing ? (
                      <input
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={() => saveMeal(fecha, momento)}
                        onKeyDown={(e) => e.key === 'Enter' && saveMeal(fecha, momento)}
                        placeholder="¿Qué comemos?"
                        className="w-full rounded bg-surface px-1.5 py-1 outline-none"
                      />
                    ) : meal ? (
                      <button
                        onClick={() => clearMeal(meal.id)}
                        title="Click para sacar"
                        className="w-full truncate text-left font-semibold text-ink hover:line-through"
                      >
                        {recipes[meal.receta_id ?? '']?.nombre ?? '—'}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setEditing({ fecha, momento })
                          setDraft('')
                        }}
                        className="w-full text-left text-ink-muted hover:text-plum"
                      >
                        + agregar
                      </button>
                    )}
                  </div>
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
