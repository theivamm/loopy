import { Router, type Request, type Response } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'

export const accountRouter = Router()
accountRouter.use(requireAuth)
export async function deleteAccount(req: Request, res: Response) {
  if (!req.userId) return res.status(401).json({ error: 'Iniciá sesión para eliminar tu cuenta.' })
  if (req.body?.confirmation !== 'ELIMINAR') return res.status(400).json({ error: 'Escribí ELIMINAR para confirmar.' })
  try {
    const { data: files, error: fileError } = await supabaseAdmin.rpc('account_storage_files', { p_user_id: req.userId! })
    if (fileError) return res.status(503).json({ error: 'La eliminación de cuentas todavía no está configurada en el servidor. Contactá al administrador.' })
    const buckets = new Map<string, string[]>()
    for (const file of (files ?? []) as { bucket_id: string; name: string }[]) {
      const names = buckets.get(file.bucket_id) ?? []
      names.push(file.name); buckets.set(file.bucket_id, names)
    }
    for (const [bucket, names] of buckets) {
      for (let index = 0; index < names.length; index += 100) {
        const { error } = await supabaseAdmin.storage.from(bucket).remove(names.slice(index, index + 100))
        if (error) return res.status(500).json({ error: 'No se pudieron eliminar todos tus archivos. Tu cuenta sigue activa; intentá nuevamente.' })
      }
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(req.userId!)
    if (error) {
      console.error('[account] delete', error.code)
      return res.status(500).json({ error: 'No se pudo eliminar tu cuenta. Algunos archivos pueden haberse eliminado; contactá al administrador antes de reintentar.' })
    }
    return res.json({ ok: true })
  } catch {
    return res.status(500).json({ error: 'No se pudo completar la eliminación. Revisá tu cuenta antes de reintentar.' })
  }
}
accountRouter.delete('/', deleteAccount)
