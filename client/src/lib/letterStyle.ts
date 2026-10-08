import type { CSSProperties } from 'react'

export type PaperKind = 'lisa' | 'renglones' | 'cuadriculado' | 'puntos'
export type FontKey = 'hand' | 'serif' | 'sans'

export interface Paper { color: string; kind: PaperKind; font: FontKey; ink: string }
export interface Deco {
  id: string
  type: 'icon' | 'seal' | 'image'
  ref: string // icon: nombre de Icon · seal: "color|icono" · image: URL
  x: number // % del ancho
  y: number // % del alto
  size: number // px
  rot: number // grados
}

export const LINE = 36

export const DEFAULT_PAPER: Paper = { color: '#FFFAF0', kind: 'renglones', font: 'hand', ink: '#2E2440' }

export const PAPER_COLORS = [
  { key: 'crema', hex: '#FFFAF0' },
  { key: 'rosa', hex: '#FFE9F0' },
  { key: 'lavanda', hex: '#F1EAFF' },
  { key: 'menta', hex: '#E6F7EE' },
  { key: 'durazno', hex: '#FFEBDD' },
  { key: 'cielo', hex: '#E6F1FF' },
  { key: 'mantequilla', hex: '#FFF6CF' },
]
export const INKS = ['#2E2440', '#7C5CDB', '#E8588A', '#2FAE7F', '#3B84D9', '#F2733F']
export const KINDS: { key: PaperKind; label: string }[] = [
  { key: 'lisa', label: 'Lisa' },
  { key: 'renglones', label: 'Renglones' },
  { key: 'cuadriculado', label: 'Cuadros' },
  { key: 'puntos', label: 'Puntos' },
]
export const FONTS: { key: FontKey; label: string; family: string; size: number }[] = [
  { key: 'hand', label: 'Manuscrita', family: 'Caveat, cursive', size: 27 },
  { key: 'serif', label: 'Clásica', family: 'Fraunces, serif', size: 18 },
  { key: 'sans', label: 'Moderna', family: '"Plus Jakarta Sans", sans-serif', size: 16 },
]
export const CONDICIONES = ['estés triste', 'no puedas dormir', 'me extrañes', 'necesites ánimo', 'estés feliz', 'tengas un mal día']

export const SEAL_COLORS: Record<string, [string, string]> = {
  lavanda: ['#B9A4FF', '#7C5CDB'],
  rojo: ['#FF9FB2', '#E5586F'],
  dorado: ['#FFE49A', '#D79A00'],
  menta: ['#9FE3C6', '#2FAE7F'],
  cielo: ['#9CCBFF', '#3B84D9'],
}

export const STICKER_ICONS = [
  'heart', 'star', 'sparkle', 'confetti', 'gift', 'cake', 'plane', 'musica', 'pelis', 'comidas', 'cartas',
  'popcorn', 'coffee', 'moon', 'sun', 'leaf', 'hug', 'rocket', 'crown', 'smile', 'bolt', 'shooting', 'cloud', 'calendario',
] as const

export function paperStyle(p: Paper): CSSProperties {
  const line = 'rgba(124,92,219,.17)'
  const bg: CSSProperties = { backgroundColor: p.color }
  if (p.kind === 'renglones') {
    bg.backgroundImage = `linear-gradient(90deg, transparent 58px, rgba(232,88,138,.35) 58px, rgba(232,88,138,.35) 60px, transparent 60px), repeating-linear-gradient(to bottom, transparent 0, transparent ${LINE - 1}px, ${line} ${LINE - 1}px, ${line} ${LINE}px)`
  } else if (p.kind === 'cuadriculado') {
    bg.backgroundImage = `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`
    bg.backgroundSize = '28px 28px'
  } else if (p.kind === 'puntos') {
    bg.backgroundImage = `radial-gradient(${line} 1.5px, transparent 1.8px)`
    bg.backgroundSize = '24px 24px'
  }
  return bg
}

export function contentStyle(p: Paper): CSSProperties {
  const f = FONTS.find((x) => x.key === p.font) ?? FONTS[0]
  return {
    fontFamily: f.family,
    fontSize: f.size,
    lineHeight: `${LINE}px`,
    color: p.ink,
    padding: `${LINE}px 36px ${LINE}px ${p.kind === 'renglones' ? 78 : 40}px`,
    minHeight: 460,
  }
}

export function parsePaper(s: string | null | undefined): Paper {
  if (!s) return DEFAULT_PAPER
  try {
    const o = JSON.parse(s)
    return { ...DEFAULT_PAPER, ...o }
  } catch {
    return DEFAULT_PAPER
  }
}

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Cartas viejas eran texto plano: las convierte a HTML. */
export function toHtml(content: string) {
  if (/<\/?(p|div|br|b|i|u|s|ul|ol|li|h2|h3|span|mark|strong|em|blockquote)\b/i.test(content)) return sanitizeHtml(content)
  return esc(content).replace(/\n/g, '<br>')
}

const ALLOWED = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'MARK', 'SPAN', 'DIV', 'P', 'BR', 'UL', 'OL', 'LI', 'H2', 'H3', 'BLOCKQUOTE', 'FONT'])
const FONT_SIZES: Record<string, string> = {
  '1': '.7em', '2': '.85em', '3': '1em', '4': '1.15em', '5': '1.4em', '6': '1.8em', '7': '2.3em',
  'x-small': '.7em', small: '.85em', medium: '1em', large: '1.15em', 'x-large': '1.4em', 'xx-large': '1.8em', 'xxx-large': '2.3em',
}
const COLOR_RE = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)$/i

export function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  const out = document.createElement('div')
  const walk = (src: Node, dst: Node) => {
    src.childNodes.forEach((n) => {
      if (n.nodeType === 3) { dst.appendChild(document.createTextNode(n.textContent ?? '')); return }
      if (n.nodeType !== 1) return
      const el = n as HTMLElement
      if (!ALLOWED.has(el.tagName)) { walk(el, dst); return }
      let tag = el.tagName.toLowerCase()
      if (tag === 'font') tag = 'span'
      if (tag === 'strike') tag = 's'
      const c = document.createElement(tag)
      const css: string[] = []
      const color = el.style.color || el.getAttribute('color')
      if (color && COLOR_RE.test(color)) css.push(`color:${color}`)
      const bgc = el.style.backgroundColor
      if (bgc && COLOR_RE.test(bgc)) css.push(`background-color:${bgc}`)
      const ta = el.style.textAlign
      if (['left', 'center', 'right', 'justify'].includes(ta)) css.push(`text-align:${ta}`)
      const fs = el.style.fontSize || el.getAttribute('size') || ''
      if (fs && FONT_SIZES[fs]) css.push(`font-size:${FONT_SIZES[fs]}`)
      else if (/^[\d.]+(em|px|%)$/.test(fs)) css.push(`font-size:${fs}`)
      if (css.length) c.setAttribute('style', css.join(';'))
      walk(el, c)
      dst.appendChild(c)
    })
  }
  walk(doc.body, out)
  return out.innerHTML
}

export function isEmptyHtml(html: string) {
  const d = document.createElement('div')
  d.innerHTML = html
  return !(d.textContent ?? '').trim()
}
