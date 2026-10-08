export interface Embed { src: string; height: number; platform: string }

export const PLATFORM_LABEL: Record<string, string> = { spotify: 'Spotify', youtube: 'YouTube', apple: 'Apple Music', other: 'Link' }

export function detectPlatform(url?: string | null): string {
  if (!url) return 'other'
  if (/spotify\.com/i.test(url)) return 'spotify'
  if (/youtu\.?be/i.test(url)) return 'youtube'
  if (/music\.apple\.com/i.test(url)) return 'apple'
  return 'other'
}

/** Convierte un link normal en uno incrustable (sin API keys). */
export function embedFor(url?: string | null): Embed | null {
  if (!url) return null
  try {
    const u = new URL(url)
    if (/spotify\.com$/i.test(u.hostname.replace(/^open\./, ''))) {
      const m = u.pathname.match(/\/(track|album|playlist|episode|show)\/([A-Za-z0-9]+)/)
      if (m) return { src: `https://open.spotify.com/embed/${m[1]}/${m[2]}?theme=0`, height: m[1] === 'track' || m[1] === 'episode' ? 152 : 352, platform: 'spotify' }
    }
    if (/youtu\.?be/i.test(u.hostname)) {
      const id = u.hostname.includes('youtu.be') ? u.pathname.slice(1) : u.searchParams.get('v') ?? u.pathname.split('/').pop()
      if (id) return { src: `https://www.youtube.com/embed/${id}?rel=0`, height: 210, platform: 'youtube' }
    }
    if (/music\.apple\.com/i.test(u.hostname)) {
      return { src: url.replace('music.apple.com', 'embed.music.apple.com'), height: 175, platform: 'apple' }
    }
  } catch { /* url inválida */ }
  return null
}

export const ETIQUETAS = ['Para bailar', 'Para manejar', 'Para llorar', 'Para dormir', 'Para cocinar', 'Para abrazar', 'Nuestra era']

export const REACCIONES: { key: string; icon: 'heart' | 'confetti' | 'moon' | 'bolt'; label: string }[] = [
  { key: 'amor', icon: 'heart', label: 'Amor' },
  { key: 'baile', icon: 'confetti', label: 'Para bailar' },
  { key: 'calma', icon: 'moon', label: 'Calma' },
  { key: 'fuego', icon: 'bolt', label: 'Fuego' },
]
