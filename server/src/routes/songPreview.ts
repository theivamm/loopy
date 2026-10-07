import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'

export const songPreviewRouter = Router()

interface Preview {
  titulo: string | null
  artista: string | null
  imagen: string | null
  plataforma: string | null
}

async function fetchJson(url: string, timeoutMs = 5000): Promise<any | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

function detectPlatform(parsed: URL): string | null {
  const host = parsed.hostname.replace(/^www\./, '')
  if (host === 'youtube.com' || host === 'music.youtube.com' || host === 'youtu.be') return 'youtube'
  if (host === 'open.spotify.com') return 'spotify'
  if (host === 'soundcloud.com') return 'soundcloud'
  if (host === 'music.apple.com') return 'apple_music'
  return null
}

async function viaOEmbed(target: string, plataforma: string): Promise<Preview | null> {
  const endpoints: Record<string, string> = {
    youtube: `https://www.youtube.com/oembed?url=${encodeURIComponent(target)}&format=json`,
    spotify: `https://open.spotify.com/oembed?url=${encodeURIComponent(target)}`,
    soundcloud: `https://soundcloud.com/oembed?url=${encodeURIComponent(target)}&format=json`,
  }
  const endpoint = endpoints[plataforma]
  if (!endpoint) return null

  const data = await fetchJson(endpoint)
  if (!data) return null

  return {
    titulo: data.title ?? null,
    artista: data.author_name ?? null,
    imagen: data.thumbnail_url ?? null,
    plataforma,
  }
}

function extractMeta(html: string, property: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    'i',
  )
  const match = html.match(re)
  return match ? match[1] : null
}

async function viaOpenGraph(target: string, parsed: URL): Promise<Preview> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(target, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LoopyBot/1.0)' },
    })
    clearTimeout(timeout)
    const html = await res.text()
    const rawImage = extractMeta(html, 'og:image')
    return {
      titulo: extractMeta(html, 'og:title') ?? extractMeta(html, 'twitter:title'),
      artista: extractMeta(html, 'music:musician') ?? extractMeta(html, 'og:site_name'),
      imagen: rawImage ? new URL(rawImage, parsed.origin).toString() : null,
      plataforma: null,
    }
  } catch {
    return { titulo: null, artista: null, imagen: null, plataforma: null }
  }
}

songPreviewRouter.get('/', requireAuth, async (req, res) => {
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

  const platform = detectPlatform(parsed)
  let preview: Preview | null = platform ? await viaOEmbed(target, platform) : null

  if (!preview) {
    preview = await viaOpenGraph(target, parsed)
    preview.plataforma = platform
  }

  res.json(preview)
})
