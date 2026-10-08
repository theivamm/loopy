import { supabase } from './supabaseClient'

const API_URL = import.meta.env.VITE_API_URL as string
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

export type NotifyType = 'touch' | 'reaction' | 'status' | 'letter' | 'note'

export const pushSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

async function registration() {
  const existing = await navigator.serviceWorker.getRegistration('/sw.js')
  const reg = existing ?? (await navigator.serviceWorker.register('/sw.js'))
  await navigator.serviceWorker.ready
  return reg
}

export async function currentSubscription() {
  if (!pushSupported()) return null
  const reg = await navigator.serviceWorker.getRegistration('/sw.js')
  return reg ? reg.pushManager.getSubscription() : null
}

export async function enablePush(userId: string, spaceId: string | null): Promise<'ok' | 'denied' | 'unsupported' | 'nokey' | 'error'> {
  if (!pushSupported()) return 'unsupported'
  if (!VAPID_PUBLIC_KEY) return 'nokey'
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return 'denied'
  try {
    const reg = await registration()
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource }))
    const json = sub.toJSON()
    const { error } = await supabase.from('push_subscriptions').upsert(
      { user_id: userId, space_id: spaceId, endpoint: sub.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth, user_agent: navigator.userAgent },
      { onConflict: 'endpoint' },
    )
    return error ? 'error' : 'ok'
  } catch {
    return 'error'
  }
}

export async function disablePush() {
  const sub = await currentSubscription()
  if (!sub) return
  await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
  await sub.unsubscribe()
}

async function authedPost(path: string, body: unknown) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  return fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(body),
  })
}

/** Avisa a tu pareja (el servidor valida todo desde la base). Nunca rompe la acción principal. */
export async function notifyPartner(type: NotifyType, id: string) {
  try { await authedPost('/api/push/notify', { type, id }) } catch { /* best-effort */ }
}

export async function sendTestPush(): Promise<{ ok: boolean; message: string }> {
  if (!API_URL) return { ok: false, message: 'No está configurada la dirección del servidor de notificaciones. Contactá al administrador.' }
  try {
    const r = await authedPost('/api/push/test', {})
    if (!r) return { ok: false, message: 'Tu sesión no está disponible. Volvé a iniciar sesión.' }
    const body = await r.json().catch(() => null)
    if (r.ok && body?.ok === true) return { ok: true, message: 'Te mandamos una notificación de prueba.' }
    if (r.status === 401) return { ok: false, message: 'Tu sesión es inválida o venció. Volvé a iniciar sesión.' }
    if (typeof body?.error === 'string') return { ok: false, message: body.error }
    return { ok: false, message: `El servidor no devolvió una respuesta válida (HTTP ${r.status}). Contactá al administrador.` }
  } catch { return { ok: false, message: 'No se pudo conectar con el servidor de notificaciones. Revisá tu conexión; si continúa, contactá al administrador para revisar la URL del backend y CORS.' } }
}
