-- Loopy — step 1 of 3: tables only (no functions, no policies yet).
-- Run this first in the Supabase SQL Editor (Database > SQL Editor > New query),
-- then run 0002_functions.sql, then 0003_policies.sql.

create extension if not exists pgcrypto;

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nombre text,
  apodo text,
  avatar_url text,
  color_hilo text check (color_hilo in ('lavender','peach','blush','mint','butter','sky')),
  zona_horaria text default 'UTC',
  creado_en timestamptz not null default now()
);

create table couple_spaces (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  fecha_aniversario date,
  tema text default 'default',
  owner_id uuid not null references auth.users(id),
  plan text not null default 'free' check (plan in ('free','plus')),
  estado text not null default 'active' check (estado in ('active','archived')),
  loopy_nivel int not null default 1,
  loopy_accesorios text[] not null default '{}',
  creado_en timestamptz not null default now()
);

create table memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid not null references couple_spaces(id) on delete cascade,
  rol text not null check (rol in ('owner','partner')),
  unido_en timestamptz not null default now(),
  unique (user_id),
  unique (user_id, space_id)
);

create table invitations (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references couple_spaces(id) on delete cascade,
  codigo text not null unique,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  creado_por uuid not null references auth.users(id),
  vence_en timestamptz not null default (now() + interval '7 days'),
  usado boolean not null default false,
  creado_en timestamptz not null default now()
);

create table statuses (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references couple_spaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text,
  color text,
  actividad text,
  disponibilidad text check (disponibilidad in ('libre','ocupado','no_molestar')),
  mensaje text,
  actualizado_en timestamptz not null default now(),
  unique (space_id, user_id)
);

create table letters (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references couple_spaces(id) on delete cascade,
  autor_id uuid not null references auth.users(id),
  titulo text not null,
  contenido text not null,
  estilo text default 'default',
  tipo text not null default 'normal' check (tipo in ('normal','programada','condicional')),
  abrir_en timestamptz,
  condicion text,
  leida boolean not null default false,
  creado_en timestamptz not null default now()
);

create table songs (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references couple_spaces(id) on delete cascade,
  agregado_por uuid not null references auth.users(id),
  titulo text not null,
  artista text,
  url text,
  plataforma text,
  nota text,
  es_del_dia boolean not null default false,
  fecha timestamptz not null default now()
);

create table movies (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references couple_spaces(id) on delete cascade,
  agregado_por uuid not null references auth.users(id),
  tmdb_id int,
  titulo text not null,
  poster text,
  estado text not null default 'por_ver' check (estado in ('por_ver','viendo','vista')),
  rating_a int check (rating_a between 1 and 5),
  rating_b int check (rating_b between 1 and 5),
  creado_en timestamptz not null default now()
);

create table links (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references couple_spaces(id) on delete cascade,
  agregado_por uuid not null references auth.users(id),
  url text not null,
  titulo text,
  imagen text,
  categoria text,
  hecho boolean not null default false,
  creado_en timestamptz not null default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references couple_spaces(id) on delete cascade,
  creado_por uuid not null references auth.users(id),
  titulo text not null,
  inicio timestamptz not null,
  fin timestamptz,
  tipo text default 'general',
  recurrencia text,
  recordatorio boolean not null default true,
  creado_en timestamptz not null default now()
);

create table recipes (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references couple_spaces(id) on delete cascade,
  nombre text not null,
  ingredientes text[],
  pasos text,
  link text,
  creado_en timestamptz not null default now()
);

create table meals (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references couple_spaces(id) on delete cascade,
  fecha date not null,
  momento text not null check (momento in ('desayuno','almuerzo','cena')),
  receta_id uuid references recipes(id),
  cocina_user_id uuid references auth.users(id)
);

create table ideas (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references couple_spaces(id) on delete cascade,
  autor_id uuid not null references auth.users(id),
  titulo text not null,
  descripcion text,
  categoria text default 'general',
  privada boolean not null default false,
  votos int not null default 0,
  creado_en timestamptz not null default now()
);

create table notes (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references couple_spaces(id) on delete cascade,
  autor_id uuid not null references auth.users(id),
  texto text not null,
  color text not null default 'butter',
  posicion int not null default 0,
  rotacion numeric not null default 0,
  creado_en timestamptz not null default now()
);

create table memories (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references couple_spaces(id) on delete cascade,
  subido_por uuid not null references auth.users(id),
  url text not null,
  fecha timestamptz not null default now(),
  descripcion text
);
