-- Loopy — initial schema
-- Two-person "couple space" model. Every content table is scoped by space_id
-- and protected by RLS so only the two members of a space can read/write it.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────
-- profiles (1:1 with auth.users)
-- ─────────────────────────────────────────────────────────────────────────
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

alter table profiles enable row level security;

create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

-- a profile row for every pair of members in the same space should be visible
-- to its partner too (to show name/avatar/color), so widen select:
create policy "profiles_select_space_partner" on profiles
  for select using (
    exists (
      select 1 from memberships m1
      join memberships m2 on m1.space_id = m2.space_id
      where m1.user_id = auth.uid() and m2.user_id = profiles.id
    )
  );

-- auto-create a profile row when a new auth user signs up
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────
-- couple_spaces
-- ─────────────────────────────────────────────────────────────────────────
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

alter table couple_spaces enable row level security;

create table memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid not null references couple_spaces(id) on delete cascade,
  rol text not null check (rol in ('owner','partner')),
  unido_en timestamptz not null default now(),
  unique (user_id),
  unique (user_id, space_id)
);

alter table memberships enable row level security;

create policy "spaces_select_member" on couple_spaces
  for select using (
    exists (select 1 from memberships where memberships.space_id = couple_spaces.id and memberships.user_id = auth.uid())
  );

create policy "spaces_update_member" on couple_spaces
  for update using (
    exists (select 1 from memberships where memberships.space_id = couple_spaces.id and memberships.user_id = auth.uid())
  );

create policy "memberships_select_own_space" on memberships
  for select using (
    user_id = auth.uid()
    or exists (select 1 from memberships m2 where m2.space_id = memberships.space_id and m2.user_id = auth.uid())
  );

-- helper used by every content-table policy below
create function is_space_member(target_space_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from memberships
    where memberships.space_id = target_space_id
      and memberships.user_id = auth.uid()
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- invitations
-- ─────────────────────────────────────────────────────────────────────────
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

alter table invitations enable row level security;

create policy "invitations_select_member" on invitations
  for select using (is_space_member(space_id));

-- ─────────────────────────────────────────────────────────────────────────
-- RPC: create_space — called right after onboarding by the owner
-- ─────────────────────────────────────────────────────────────────────────
create function create_space(p_nombre text, p_fecha_aniversario date default null)
returns couple_spaces
language plpgsql
security definer set search_path = public
as $$
declare
  v_space couple_spaces;
begin
  if exists (select 1 from memberships where user_id = auth.uid()) then
    raise exception 'ya perteneces a un espacio';
  end if;

  insert into couple_spaces (nombre, fecha_aniversario, owner_id)
  values (p_nombre, p_fecha_aniversario, auth.uid())
  returning * into v_space;

  insert into memberships (user_id, space_id, rol)
  values (auth.uid(), v_space.id, 'owner');

  return v_space;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- RPC: create_invitation — owner generates a fresh link/code
-- ─────────────────────────────────────────────────────────────────────────
create function create_invitation(p_space_id uuid)
returns invitations
language plpgsql
security definer set search_path = public
as $$
declare
  v_inv invitations;
begin
  if not is_space_member(p_space_id) then
    raise exception 'no pertenece a este espacio';
  end if;

  update invitations set usado = true
  where space_id = p_space_id and usado = false;

  insert into invitations (space_id, codigo, creado_por)
  values (p_space_id, upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6)), auth.uid())
  returning * into v_inv;

  return v_inv;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- RPC: accept_invitation — invited partner redeems a token or code
-- ─────────────────────────────────────────────────────────────────────────
create function accept_invitation(p_token text)
returns couple_spaces
language plpgsql
security definer set search_path = public
as $$
declare
  v_inv invitations;
  v_space couple_spaces;
  v_member_count int;
begin
  if exists (select 1 from memberships where user_id = auth.uid()) then
    raise exception 'ya perteneces a un espacio';
  end if;

  select * into v_inv from invitations
  where (token = p_token or codigo = upper(p_token))
    and usado = false
    and vence_en > now()
  limit 1;

  if v_inv is null then
    raise exception 'invitación inválida o vencida';
  end if;

  select count(*) into v_member_count from memberships where space_id = v_inv.space_id;
  if v_member_count >= 2 then
    raise exception 'el espacio ya tiene dos integrantes';
  end if;

  insert into memberships (user_id, space_id, rol)
  values (auth.uid(), v_inv.space_id, 'partner');

  update invitations set usado = true where id = v_inv.id;

  select * into v_space from couple_spaces where id = v_inv.space_id;
  return v_space;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- content tables (phase 1 + planning/memories)
-- ─────────────────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────────────────
-- generic RLS: member of the space can select/insert/update/delete
-- ─────────────────────────────────────────────────────────────────────────
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'statuses','letters','songs','movies','links','events',
    'recipes','meals','ideas','notes','memories'
  ])
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "%1$s_select_member" on %1$I for select using (is_space_member(space_id))', t
    );
    execute format(
      'create policy "%1$s_insert_member" on %1$I for insert with check (is_space_member(space_id))', t
    );
    execute format(
      'create policy "%1$s_update_member" on %1$I for update using (is_space_member(space_id))', t
    );
    execute format(
      'create policy "%1$s_delete_member" on %1$I for delete using (is_space_member(space_id))', t
    );
  end loop;
end $$;
