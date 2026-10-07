import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'

export const linkPreviewRouter = Router()

function extractMeta(html: string, property: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    'i',
  )
  const match = html.match(re)
  return match ? match[1] : null
}

linkPreviewRouter.get('/', requireAuth, async (req, res) => {
  const target = req.query.url
  if (typeof target !== 'string') {
    return res.status(400).json({ error: 'Falta el parámetro url' })
  }

  let parsed: URL
  try {
    parsed = new URL(target)
  } catch {
    return res.status(400).json({ error: 'URL inválida' })
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return res.status(400).json({ error: 'URL inválida' })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const response = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LoopyBot/1.0)' },
    })
    clearTimeout(timeout)
    const html = await response.text()

    res.json({
      titulo: extractMeta(html, 'og:title') ?? extractMeta(html, 'twitter:title'),
      imagen: extractMeta(html, 'og:image'),
      descripcion: extractMeta(html, 'og:description'),
    })
  } catch {
    res.status(502).json({ error: 'No se pudo obtener la vista previa' })
  }
})
