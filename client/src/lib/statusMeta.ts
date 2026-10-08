import type { IconName } from '../components/ui/Icon'
import type { Status } from '../types/db'

export const ACTIVIDADES: { key: string; label: string; icon: IconName }[] = [
  { key: 'trabajando', label: 'Trabajando', icon: 'work' },
  { key: 'estudiando', label: 'Estudiando', icon: 'study' },
  { key: 'cocinando', label: 'Cocinando', icon: 'pot' },
  { key: 'gym', label: 'En el gym', icon: 'gym' },
  { key: 'viajando', label: 'Viajando', icon: 'plane' },
  { key: 'viendo', label: 'Viendo algo', icon: 'tv' },
  { key: 'musica', label: 'Con música', icon: 'headphones' },
  { key: 'descansando', label: 'Descansando', icon: 'bed' },
]

export const UBICACIONES: { key: string; label: string; icon: IconName }[] = [
  { key: 'casa', label: 'En casa', icon: 'home' },
  { key: 'trabajo', label: 'En el trabajo', icon: 'office' },
  { key: 'camino', label: 'En camino', icon: 'car' },
  { key: 'afuera', label: 'Por ahí', icon: 'pin' },
]

export const REACCIONES: { key: string; label: string; icon: IconName; msg: string }[] = [
  { key: 'abrazo', label: 'Abrazo', icon: 'hug', msg: 'te mandó un abrazo' },
  { key: 'animo', label: '¡Ánimo!', icon: 'bolt', msg: 'te manda ánimo' },
  { key: 'cafe', label: 'Café', icon: 'coffee', msg: 'te invita un cafecito' },
  { key: 'corazon', label: 'Corazón', icon: 'heart', msg: 'te mandó un corazón' },
]

export const FRASES = ['Te extraño', 'Te quiero', 'Llego en 10', 'Buen día', 'Ya salgo', '¿Hablamos?']

export const VENCIMIENTOS = [
  { key: 'none', label: 'Sin vencimiento' },
  { key: '30', label: '30 min' },
  { key: '60', label: '1 hora' },
  { key: '120', label: '2 horas' },
  { key: 'hoy', label: 'Hasta hoy' },
]

export function venceDesde(key: string): string | null {
  const now = new Date()
  if (key === 'none') return null
  if (key === 'hoy') {
    const d = new Date(now)
    d.setHours(23, 59, 0, 0)
    return d.toISOString()
  }
  return new Date(now.getTime() + Number(key) * 60000).toISOString()
}

export const myTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

export function isExpired(s: Pick<Status, 'vence_en'> | null) {
  return Boolean(s?.vence_en && new Date(s.vence_en).getTime() < Date.now())
}

export function localTime(tz?: string | null) {
  try {
    return new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz || undefined }).format(new Date())
  } catch {
    return ''
  }
}

export function localHour(tz?: string | null) {
  const t = localTime(tz)
  return t ? Number(t.split(':')[0]) : new Date().getHours()
}

export const isNight = (tz?: string | null) => {
  const h = localHour(tz)
  return h >= 23 || h < 7
}

export const cityOf = (tz?: string | null) => (tz ? tz.split('/').pop()!.replace(/_/g, ' ') : '')

export function energyLabel(n: number) {
  return n < 15 ? 'Sin batería' : n < 40 ? 'Bajita' : n < 70 ? 'Normal' : n < 90 ? 'Con ganas' : 'A tope'
}
export function energyColor(n: number) {
  return n < 30 ? 'linear-gradient(90deg,#FF9B9B,#FFC2A8)' : n < 65 ? 'linear-gradient(90deg,#FFE49A,#FFC2A8)' : 'linear-gradient(90deg,#B5EAD7,#9ED8F5)'
}

export function timeAgo(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'recién'
  if (m < 60) return `hace ${m} min`
  const h = Math.round(m / 60)
  if (h < 24) return `hace ${h} h`
  return `hace ${Math.round(h / 24)} d`
}

export interface Theme { expr: 'happy' | 'loving' | 'sleepy' | 'thinking' | 'waiting' | 'celebrating'; a: string; b: string; card: string; aura: string }

const THEMES: Record<string, Theme> = {
  feliz: { expr: 'happy', a: '#FFD966', b: '#FFB69A', card: 'linear-gradient(135deg,#FFF3C9,#FFD9C4)', aura: '#FFD966' },
  enamorado: { expr: 'loving', a: '#FF9FBF', b: '#FFC2A8', card: 'linear-gradient(135deg,#FFD3E2,#FFDCC8)', aura: '#FFB8D1' },
  tranquilo: { expr: 'happy', a: '#A8E6CF', b: '#B8DCFF', card: 'linear-gradient(135deg,#D3F3E6,#CFE6FB)', aura: '#B5EAD7' },
  dormido: { expr: 'sleepy', a: '#B9A4FF', b: '#8FA8FF', card: 'linear-gradient(135deg,#DCD2FF,#C7D3FF)', aura: '#A99BFF' },
  ansioso: { expr: 'thinking', a: '#FFC2A8', b: '#FFD6A5', card: 'linear-gradient(135deg,#FFE3D4,#FFEBCB)', aura: '#FFC2A8' },
  enojado: { expr: 'thinking', a: '#FF9B9B', b: '#FFC2A8', card: 'linear-gradient(135deg,#FFD0D0,#FFDCC8)', aura: '#FF9B9B' },
  enfermo: { expr: 'sleepy', a: '#B8DCFF', b: '#D3EAF5', card: 'linear-gradient(135deg,#D6E9FF,#E0F1F7)', aura: '#B8DCFF' },
  festejando: { expr: 'celebrating', a: '#FFB8D1', b: '#FFE8A3', card: 'linear-gradient(135deg,#FFD6E4,#FFF0B8)', aura: '#FFB8D1' },
}
const DEFAULT_THEME: Theme = { expr: 'waiting', a: '#C9B8FF', b: '#FFC2A8', card: 'linear-gradient(135deg,#E4D9FF,#FFE0D2)', aura: '#C9B8FF' }

export const themeFor = (mood?: string | null): Theme => (mood && THEMES[mood]) || DEFAULT_THEME

/** Estado "efectivo": aplica vencimiento y el modo dormido automático de noche. */
export function effective(s: Status | null) {
  if (!s) return null
  const expired = isExpired(s)
  const stale = Date.now() - new Date(s.actualizado_en).getTime() > 3 * 3600000
  const asleep = isNight(s.zona_horaria) && stale
  return {
    ...s,
    actividad: expired ? null : s.actividad,
    actividad_tipo: expired ? null : s.actividad_tipo,
    mensaje: expired ? null : s.mensaje,
    expired,
    asleep,
    mood: asleep ? 'dormido' : s.emoji,
  }
}
