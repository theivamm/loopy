import webpush from 'web-push'
import { supabaseAdmin } from './supabaseAdmin.js'

const pub = process.env.VAPID_PUBLIC_KEY
const priv = process.env.VAPID_PRIVATE_KEY
export const pushEnabled = Boolean(pub && priv)

if (pushEnabled) {
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? 'mailto:hola@loopy.app', pub!, priv!)
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
  if (!pushEnabled) return 0

  if (pref) {
    const { data: prefs } = await supabaseAdmin.from('notification_prefs').select('*').eq('user_id', userId).maybeSingle()
    if (prefs && prefs[pref] === false) return 0
  }

  const { data: subs } = await supabaseAdmin.from('push_subscriptions').select('*').eq('user_id', userId)
  let sent = 0
  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload))
        sent++
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) await supabaseAdmin.from('push_subscriptions').delete().eq('id', s.id)
      }
    }),
  )
  return sent
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
  const reminders = async () => {
    const now = Date.now()
    const { data: evs } = await supabaseAdmin
      .from('events').select('id,space_id,titulo,inicio,recordado')
      .eq('recordatorio', true).lt('recordado', 2)
      .gte('inicio', new Date(now).toISOString()).lte('inicio', new Date(now + 24 * 3600_000).toISOString()).limit(100)
    for (const e of evs ?? []) {
      const ms = new Date(e.inicio).getTime() - now
      const stage = ms <= 3600_000 ? 2 : 1
      if (e.recordado >= stage) continue
      const { data: members } = await supabaseAdmin.from('memberships').select('user_id').eq('space_id', e.space_id)
      const when = stage === 2 ? 'en 1 hora' : 'mañana'
      for (const m of members ?? []) await sendToUser(m.user_id, { title: `${e.titulo} es ${when}`, url: '/app/calendario', tag: `event-${e.id}-${stage}` }, 'eventos')
      await supabaseAdmin.from('events').update({ recordado: stage }).eq('id', e.id)
    }
  }
  setInterval(() => { tick().catch((e) => console.error('[push] scheduler', e)); reminders().catch((e) => console.error('[push] reminders', e)) }, 60_000)
  tick().catch(() => undefined)
}
