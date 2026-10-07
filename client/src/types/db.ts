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
  creado_en: string
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
