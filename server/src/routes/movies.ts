import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'

export const moviesRouter = Router()
moviesRouter.use(requireAuth)

// Búsqueda en TMDB. Requiere TMDB_API_KEY en server/.env; sin clave responde 503 y el cliente permite agregar a mano.
moviesRouter.get('/search', async (req, res) => {
  const key = process.env.TMDB_API_KEY
  const q = String(req.query.q ?? '').trim()
  if (!key) return res.status(503).json({ error: 'TMDB no configurado' })
  if (q.length < 2) return res.json([])
  try {
    const r = await fetch(
      `https://api.themoviedb.org/3/search/multi?language=es-ES&include_adult=false&query=${encodeURIComponent(q)}`,
      { headers: { Authorization: `Bearer ${key}`, accept: 'application/json' } },
    )
    const j = (await r.json()) as { results?: Record<string, any>[] }
    const out = (j.results ?? [])
      .filter((m) => m.media_type === 'movie' || m.media_type === 'tv')
      .slice(0, 12)
      .map((m) => ({
        tmdb_id: m.id,
        titulo: m.title ?? m.name,
        poster: m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : null,
        anio: Number(String(m.release_date ?? m.first_air_date ?? '').slice(0, 4)) || null,
        tipo: m.media_type === 'tv' ? 'serie' : 'peli',
        sinopsis: m.overview || null,
      }))
    res.json(out)
  } catch {
    res.status(502).json({ error: 'No se pudo consultar TMDB' })
  }
})
