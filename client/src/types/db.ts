export type ThreadColor = 'lavender' | 'peach' | 'blush' | 'mint' | 'butter' | 'sky'

export interface Profile {
  id: string
  email: string | null
  nombre: string | null
  apodo: string | null
  avatar_url: string | null
  color_hilo: ThreadColor | null
  zona_horaria: string | null
  creado_en: string
}

export interface CoupleSpace {
  id: string
  nombre: string
  fecha_aniversario: string | null
  tema: string | null
  owner_id: string
  plan: 'free' | 'plus'
  estado: 'active' | 'archived'
  loopy_nivel: number
  loopy_accesorios: string[]
  creado_en: string
}

export interface Membership {
  id: string
  user_id: string
  space_id: string
  rol: 'owner' | 'partner'
  unido_en: string
}

export interface Invitation {
  id: string
  space_id: string
  codigo: string
  token: string
  creado_por: string
  vence_en: string
  usado: boolean
  creado_en: string
}

export interface Status {
  id: string
  space_id: string
  user_id: string
  emoji: string | null
  color: string | null
  actividad: string | null
  disponibilidad: 'libre' | 'ocupado' | 'no_molestar' | null
  mensaje: string | null
  energia: number | null
  ubicacion: string | null
  actividad_tipo: string | null
  vence_en: string | null
  zona_horaria: string | null
  actualizado_en: string
}

export interface Letter {
  id: string
  space_id: string
  autor_id: string
  titulo: string
  contenido: string
  estilo: string | null
  tipo: 'normal' | 'programada' | 'condicional'
  abrir_en: string | null
  condicion: string | null
  leida: boolean
  decoraciones: import('../lib/letterStyle').Deco[]
  notificada: boolean
  creado_en: string
}

export interface Note {
  id: string
  space_id: string
  autor_id: string
  texto: string
  color: string
  posicion: number
  rotacion: number
  x: number | null
  y: number | null
  z: number
  tipo: 'nota' | 'lista'
  items: NoteItem[]
  pin: string
  fijada: boolean
  me_gusta: string[]
  creado_en: string
}

export interface NoteItem {
  id: string
  t: string
  done: boolean
}

export interface Song {
  id: string
  space_id: string
  agregado_por: string
  titulo: string
  artista: string | null
  url: string | null
  plataforma: string | null
  nota: string | null
  es_del_dia: boolean
  fecha: string
  imagen: string | null
  es_nuestra: boolean
  etiqueta: string | null
  del_dia_fecha: string | null
  dedicada: boolean
  reacciones: Record<string, string>
}

export interface Movie {
  id: string
  space_id: string
  agregado_por: string
  tmdb_id: number | null
  titulo: string
  poster: string | null
  estado: 'por_ver' | 'viendo' | 'vista'
  rating_a: number | null
  rating_b: number | null
  creado_en: string
}

export interface Link {
  id: string
  space_id: string
  agregado_por: string
  url: string
  titulo: string | null
  imagen: string | null
  categoria: string | null
  hecho: boolean
  creado_en: string
}

export interface Event {
  id: string
  space_id: string
  creado_por: string
  titulo: string
  inicio: string
  fin: string | null
  tipo: string | null
  recurrencia: string | null
  recordatorio: boolean
  creado_en: string
}

export interface Recipe {
  id: string
  space_id: string
  nombre: string
  ingredientes: string[] | null
  pasos: string | null
  link: string | null
  creado_en: string
}

export interface Meal {
  id: string
  space_id: string
  fecha: string
  momento: 'desayuno' | 'almuerzo' | 'cena'
  receta_id: string | null
  cocina_user_id: string | null
}

export interface Idea {
  id: string
  space_id: string
  autor_id: string
  titulo: string
  descripcion: string | null
  categoria: string | null
  privada: boolean
  votos: number
  creado_en: string
}

export interface MoodLog {
  id: string
  space_id: string
  user_id: string
  fecha: string
  mood: string
  creado_en: string
}

export interface Question {
  id: string
  orden: number
  texto: string
}

export interface QuestionAnswer {
  id: string
  space_id: string
  user_id: string
  question_id: string
  fecha: string
  respuesta: string
  creado_en: string
}

export interface Touch {
  id: string
  space_id: string
  user_id: string
  mensaje: string | null
  creado_en: string
}

export interface Reaction {
  id: string
  space_id: string
  user_id: string
  tipo: 'abrazo' | 'animo' | 'cafe' | 'corazon'
  creado_en: string
}

export interface NotificationPrefs {
  user_id: string
  toques: boolean
  reacciones: boolean
  estados: boolean
  cartas: boolean
  eventos: boolean
  notitas: boolean
}
