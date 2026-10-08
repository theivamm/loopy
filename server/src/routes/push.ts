import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'
import { nameOf, partnerOf, pushEnabled, sendToUser } from '../lib/push.js'

export const pushRouter = Router()
pushRouter.use(requireAuth)

const MOODS: Record<string, string> = {
  feliz: 'feliz', enamorado: 'enamorado/a', tranquilo: 'tranquilo/a', dormido: 'con sueño',
  ansioso: 'nervioso/a', enojado: 'enojado/a', enfermo: 'enfermito/a', festejando: 'festejando',
}
const REACTIONS: Record<string, string> = {
  abrazo: 'te mandó un abrazo', animo: 'te manda ánimo', cafe: 'te invita un cafecito', corazon: 'te mandó un corazón',
}

pushRouter.post('/test', async (req, res) => {
  if (!pushEnabled) return res.status(503).json({ error: 'Push no configurado' })
  const sent = await sendToUser(req.userId!, { title: 'Loopy', body: '¡Las notificaciones funcionan!', url: '/app/ajustes', tag: 'test' })
  res.status(sent ? 200 : 404).json({ ok: sent > 0, sent })
})

// El cliente avisa "creé X"; el servidor lee la fila, verifica que sea tuya y notifica SOLO a tu pareja.
pushRouter.post('/notify', async (req, res) => {
  if (!pushEnabled) return res.json({ ok: false, reason: 'disabled' })
  const { type, id } = req.body as { type?: string; id?: string }
  if (!type || !id) return res.status(400).json({ error: 'Faltan datos' })
  const me = req.userId!

  try {
    if (type === 'touch' || type === 'reaction' || type === 'status') {
      const table = type === 'touch' ? 'thinking_touches' : type === 'reaction' ? 'status_reactions' : 'statuses'
      const { data: row } = await supabaseAdmin.from(table).select('*').eq('id', id).maybeSingle()
      if (!row || row.user_id !== me) return res.status(403).json({ error: 'No permitido' })
      if (type !== 'status' && Date.now() - new Date(row.creado_en).getTime() > 2 * 60_000) return res.json({ ok: false, reason: 'stale' })

      const to = await partnerOf(row.space_id, me)
      if (!to) return res.json({ ok: false, reason: 'no-partner' })
      const from = await nameOf(me)

      if (type === 'touch') {
        const custom = row.mensaje && row.mensaje !== 'Pensando en vos'
        await sendToUser(to, { title: custom ? from : `${from} está pensando en vos`, body: custom ? row.mensaje : undefined, url: '/app/estados', tag: 'touch' }, 'toques')
      } else if (type === 'reaction') {
        await sendToUser(to, { title: `${from} ${REACTIONS[row.tipo] ?? 'te mandó algo'}`, url: '/app/estados', tag: 'reaction' }, 'reacciones')
      } else {
        const mood = MOODS[row.emoji ?? '']
        await sendToUser(to, { title: mood ? `${from} ahora está ${mood}` : `${from} actualizó su estado`, body: row.mensaje ?? undefined, url: '/app/estados', tag: 'status' }, 'estados')
      }
      return res.json({ ok: true })
    }

    if (type === 'letter') {
      const { data: l } = await supabaseAdmin.from('letters').select('*').eq('id', id).maybeSingle()
      if (!l || l.autor_id !== me) return res.status(403).json({ error: 'No permitido' })
      const to = await partnerOf(l.space_id, me)
      if (!to) return res.json({ ok: false, reason: 'no-partner' })
      const from = await nameOf(me)
      const future = l.tipo === 'programada' && l.abrir_en && new Date(l.abrir_en) > new Date()
      const body = l.tipo === 'condicional'
        ? `Para cuando ${l.condicion ?? 'la necesites'}`
        : future
          ? `Se abre el ${new Date(l.abrir_en).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}`
          : l.titulo
      await sendToUser(to, { title: future ? `${from} te escribió una carta` : `${from} te mandó una carta`, body, url: '/app/cartas', tag: `letter-${l.id}` }, 'cartas')
      return res.json({ ok: true })
    }

    if (type === 'note') {
      const { data: n } = await supabaseAdmin.from('notes').select('*').eq('id', id).maybeSingle()
      if (!n || n.autor_id !== me) return res.status(403).json({ error: 'No permitido' })
      const to = await partnerOf(n.space_id, me)
      if (!to) return res.json({ ok: false, reason: 'no-partner' })
      const from = await nameOf(me)
      const body = String(n.texto ?? '').slice(0, 90)
      await sendToUser(to, { title: n.tipo === 'lista' ? `${from} armó una lista` : `${from} dejó una notita`, body, url: '/app/notitas', tag: `note-${n.id}` }, 'notitas')
      return res.json({ ok: true })
    }

    return res.status(400).json({ error: 'Tipo desconocido' })
  } catch (e) {
    console.error('[push] notify', e)
    return res.status(500).json({ error: 'No se pudo notificar' })
  }
})
