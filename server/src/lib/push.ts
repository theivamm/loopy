import webpush from 'web-push'
import { supabaseAdmin } from './supabaseAdmin.js'

const pub = process.env.VAPID_PUBLIC_KEY
const priv = process.env.VAPID_PRIVATE_KEY
export let pushEnabled = Boolean(pub && priv)
export let pushConfigurationError = 'El servidor no tiene configuradas las claves VAPID. Contactá al administrador.'

if (pushEnabled) {
  try {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? 'mailto:hola@loopy.app', pub!, priv!)
  } catch {
    pushEnabled = false
    pushConfigurationError = 'La configuración VAPID del servidor es inválida. Contactá al administrador.'
  }
} else {
  console.warn('[push] Falta VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY: las notificaciones push están desactivadas.')
}

export type PrefKey = 'toques' | 'reacciones' | 'estados' | 'cartas' | 'notitas' | 'eventos'
export interface PushPayload { title: string; body?: string; url?: string; tag?: string }

export async function partnerOf(spaceId: string, userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from('memberships').select('user_id').eq('space_id', spaceId).neq('user_id', userId).maybeSingle()
  return data?.user_id ?? null
}

export async function nameOf(userId: string): Promise<string> {
  const { data } = await supabaseAdmin.from('profiles').select('apodo,nombre').eq('id', userId).maybeSingle()
  return data?.apodo || data?.nombre || 'Tu pareja'
}

export async function sendToUser(userId: string, payload: PushPayload, pref?: PrefKey): Promise<number> {
  return (await deliverToUser(userId, payload, pref)).sent
}

export async function deliverToUser(userId: string, payload: PushPayload, pref?: PrefKey) {
  if (!pushEnabled) return { sent: 0, error: pushConfigurationError, status: 503 }

  if (pref) {
    const { data: prefs } = await supabaseAdmin.from('notification_prefs').select('*').eq('user_id', userId).maybeSingle()
    if (prefs && prefs[pref] === false) return { sent: 0, error: 'Las notificaciones están desactivadas en tus preferencias.', status: 409 }
  }

  const { data: subs, error } = await supabaseAdmin.from('push_subscriptions').select('*').eq('user_id', userId)
  if (error) return { sent: 0, error: 'El servidor no pudo consultar las suscripciones de notificaciones. Contactá al administrador.', status: 500 }
  if (!subs?.length) return { sent: 0, error: 'No hay dispositivos registrados para tu cuenta. Desactivá y volvé a activar las notificaciones.', status: 404 }
  let sent = 0
  const failures: number[] = []
  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload))
        sent++
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode
        failures.push(code ?? 0)
        if (code === 404 || code === 410) await supabaseAdmin.from('push_subscriptions').delete().eq('id', s.id)
      }
    }),
  )
  if (sent) return { sent, status: 200 }
  if (failures.some((code) => code === 401 || code === 403)) return { sent: 0, status: 502, error: 'El servicio push rechazó las credenciales. Verificá las claves VAPID del servidor y volvé a activar las notificaciones.' }
  if (failures.every((code) => code === 404 || code === 410)) return { sent: 0, status: 410, error: 'Las suscripciones vencieron. Desactivá y volvé a activar las notificaciones.' }
  return { sent: 0, status: 502, error: 'El servicio push no pudo entregar la notificación. Probá de nuevo en unos minutos.' }
}

/** Cada minuto avisa las cartas programadas que ya se pueden abrir. */
export function startLetterScheduler() {
  if (!pushEnabled) return
  const tick = async () => {
    const { data: due } = await supabaseAdmin
      .from('letters')
      .select('id,space_id,autor_id,titulo')
      .eq('tipo', 'programada')
      .eq('notificada', false)
      .lte('abrir_en', new Date().toISOString())
      .limit(50)
    for (const l of due ?? []) {
      const to = await partnerOf(l.space_id, l.autor_id)
      if (to) {
        const from = await nameOf(l.autor_id)
        await sendToUser(to, { title: 'Ya podés abrir una carta', body: `${from} te dejó “${l.titulo}”`, url: '/app/cartas', tag: `letter-${l.id}` }, 'cartas')
      }
      await supabaseAdmin.from('letters').update({ notificada: true }).eq('id', l.id)
    }
  }
  setInterval(() => tick().catch((e) => console.error('[push] scheduler', e)), 60_000)
  tick().catch(() => undefined)
}
