import {
  House, ChatCircleDots, EnvelopeSimple, Notepad, MusicNotes, FilmSlate, LinkSimple,
  CalendarHeart, ForkKnife, Lightbulb, GearSix, Plus, X, Trash, PencilSimple, Check,
  Lock, Play, DiceFive, Sparkle, Heart, PaperPlaneTilt, DotsThreeOutline, SignOut,
  ArrowRight, Cake, Airplane, Gift, Star, Coffee, CookingPot, MapPin, ShoppingBag,
  Smiley, VideoCamera, Rocket, Confetti, Moon, Leaf, Thermometer, SmileyNervous,
  SmileyAngry, Copy, WhatsappLogo, Clock, Popcorn, Shield, UsersThree, Question,
  Cloud, Sun, Crown, ShootingStar, ChatsCircle, CaretLeft, CaretRight,
  TextB, TextItalic, TextUnderline, TextStrikethrough, TextHTwo, ListBullets, ListNumbers,
  TextAlignLeft, TextAlignCenter, TextAlignRight, Quotes, Eraser, Highlighter, TextAa, UploadSimple,
  ImageSquare, EnvelopeSimpleOpen, BellRinging, Briefcase, GraduationCap, Barbell, Car, Buildings, HandHeart, Lightning, Bed, Television, Headphones,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react'

export type Tone = 'lavender' | 'blush' | 'peach' | 'mint' | 'butter' | 'sky'

export const TONES: Record<Tone, { bg: string; fg: string; solid: string }> = {
  lavender: { bg: 'linear-gradient(135deg,#EFE9FF,#D8CBFF)', fg: '#7C5CDB', solid: '#C9B8FF' },
  blush: { bg: 'linear-gradient(135deg,#FFEEF4,#FFC9DB)', fg: '#E8588A', solid: '#FFB8D1' },
  peach: { bg: 'linear-gradient(135deg,#FFF2EA,#FFD3BF)', fg: '#F2733F', solid: '#FFC2A8' },
  mint: { bg: 'linear-gradient(135deg,#E9F9F2,#C3EEDC)', fg: '#2FAE7F', solid: '#B5EAD7' },
  butter: { bg: 'linear-gradient(135deg,#FFF8DC,#FFE49A)', fg: '#D79A00', solid: '#FFE8A3' },
  sky: { bg: 'linear-gradient(135deg,#EAF4FF,#C6E0FF)', fg: '#3B84D9', solid: '#B8DCFF' },
}

const REG = {
  home: [House, 'lavender'], estados: [ChatCircleDots, 'lavender'], cartas: [EnvelopeSimple, 'blush'],
  notitas: [Notepad, 'butter'], musica: [MusicNotes, 'peach'], pelis: [FilmSlate, 'sky'],
  links: [LinkSimple, 'sky'], calendario: [CalendarHeart, 'lavender'], comidas: [ForkKnife, 'mint'],
  ideas: [Lightbulb, 'butter'], ajustes: [GearSix, 'lavender'],
  plus: [Plus, 'lavender'], close: [X, 'lavender'], trash: [Trash, 'blush'], edit: [PencilSimple, 'lavender'],
  check: [Check, 'mint'], lock: [Lock, 'lavender'], play: [Play, 'lavender'], dice: [DiceFive, 'sky'],
  sparkle: [Sparkle, 'butter'], heart: [Heart, 'blush'], send: [PaperPlaneTilt, 'lavender'],
  more: [DotsThreeOutline, 'lavender'], logout: [SignOut, 'blush'], arrow: [ArrowRight, 'lavender'],
  cake: [Cake, 'blush'], plane: [Airplane, 'sky'], gift: [Gift, 'peach'], star: [Star, 'butter'],
  coffee: [Coffee, 'peach'], pot: [CookingPot, 'mint'], pin: [MapPin, 'blush'], bag: [ShoppingBag, 'peach'],
  smile: [Smiley, 'butter'], video: [VideoCamera, 'sky'], rocket: [Rocket, 'lavender'],
  confetti: [Confetti, 'blush'], moon: [Moon, 'lavender'], leaf: [Leaf, 'mint'], thermo: [Thermometer, 'sky'],
  nervous: [SmileyNervous, 'peach'], angry: [SmileyAngry, 'blush'], copy: [Copy, 'lavender'],
  whatsapp: [WhatsappLogo, 'mint'], clock: [Clock, 'sky'], popcorn: [Popcorn, 'butter'],
  shield: [Shield, 'mint'], users: [UsersThree, 'lavender'], question: [Question, 'lavender'],
  cloud: [Cloud, 'sky'], sun: [Sun, 'butter'], crown: [Crown, 'butter'], shooting: [ShootingStar, 'lavender'],
  chats: [ChatsCircle, 'lavender'], caretLeft: [CaretLeft, 'lavender'], caretRight: [CaretRight, 'lavender'],
  work: [Briefcase, 'sky'], study: [GraduationCap, 'lavender'], gym: [Barbell, 'peach'], car: [Car, 'sky'],
  office: [Buildings, 'lavender'], hug: [HandHeart, 'blush'], bolt: [Lightning, 'butter'], bed: [Bed, 'lavender'],
  bold: [TextB, 'lavender'], italic: [TextItalic, 'lavender'], underline: [TextUnderline, 'lavender'], strike: [TextStrikethrough, 'lavender'],
  h2: [TextHTwo, 'lavender'], ul: [ListBullets, 'lavender'], ol: [ListNumbers, 'lavender'], alignL: [TextAlignLeft, 'lavender'],
  alignC: [TextAlignCenter, 'lavender'], alignR: [TextAlignRight, 'lavender'], quote: [Quotes, 'lavender'], eraser: [Eraser, 'lavender'],
  highlighter: [Highlighter, 'butter'], size: [TextAa, 'lavender'], upload: [UploadSimple, 'sky'], image: [ImageSquare, 'sky'],
  envelopeOpen: [EnvelopeSimpleOpen, 'blush'], bell: [BellRinging, 'butter'],
  tv: [Television, 'sky'], headphones: [Headphones, 'blush'],
} as const satisfies Record<string, readonly [PhosphorIcon, Tone]>

export type IconName = keyof typeof REG

interface IconProps {
  name: IconName
  size?: number
  tone?: Tone
  /** sin tile: solo el ícono duotone con el color del tono */
  bare?: boolean
  className?: string
}

export function Icon({ name, size = 44, tone, bare = false, className = '' }: IconProps) {
  const [Cmp, defTone] = REG[name]
  const t = TONES[tone ?? defTone]
  if (bare) return <Cmp size={size} weight="duotone" color={t.fg} className={className} aria-hidden />
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '34%',
        background: t.bg,
        boxShadow: 'inset 0 2px 0 rgba(255,255,255,.85), 0 4px 12px rgba(124,92,219,.10)',
      }}
    >
      <Cmp size={Math.round(size * 0.54)} weight="duotone" color={t.fg} />
    </span>
  )
}

/* Estados de ánimo: se guardan como clave en statuses.emoji.
   Si en la base quedaron emojis viejos, MoodIcon los muestra como texto. */
export const MOODS: { key: string; label: string; icon: IconName; tone: Tone }[] = [
  { key: 'feliz', label: 'Feliz', icon: 'smile', tone: 'butter' },
  { key: 'enamorado', label: 'Enamorado', icon: 'heart', tone: 'blush' },
  { key: 'tranquilo', label: 'Tranquilo', icon: 'leaf', tone: 'mint' },
  { key: 'dormido', label: 'Con sueño', icon: 'moon', tone: 'lavender' },
  { key: 'ansioso', label: 'Nervioso', icon: 'nervous', tone: 'peach' },
  { key: 'enojado', label: 'Enojado', icon: 'angry', tone: 'blush' },
  { key: 'enfermo', label: 'Enfermito', icon: 'thermo', tone: 'sky' },
  { key: 'festejando', label: 'Festejando', icon: 'confetti', tone: 'peach' },
]

export function MoodIcon({ value, size = 44 }: { value: string | null | undefined; size?: number }) {
  const m = MOODS.find((x) => x.key === value)
  if (m) return <Icon name={m.icon} tone={m.tone} size={size} />
  if (value) return <span style={{ fontSize: size * 0.7, lineHeight: 1 }}>{value}</span>
  return <Icon name="smile" size={size} />
}
