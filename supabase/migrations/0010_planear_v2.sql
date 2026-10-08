-- Loopy — 0010: Pelis, Links, Calendario, Comidas e Ideas 2.0.
-- Ejecutar en Supabase > SQL Editor > New query (después de 0001–0009).

-- ───────── Pelis y series ─────────
alter table movies
  add column if not exists tipo text not null default 'peli',
  add column if not exists anio int,
  add column if not exists sinopsis text,
  add column if not exists plataforma text,
  add column if not exists ratings jsonb not null default '{}'::jsonb,
  add column if not exists vista_fecha date;

-- ───────── Links ─────────
alter table links
  add column if not exists nota text,
  add column if not exists favorito boolean not null default false;

-- ───────── Calendario ─────────
alter table events
  add column if not exists recordado int not null default 0; -- 0 nada, 1 aviso de 1 día, 2 aviso de 1 hora

-- ───────── Ideas ─────────
alter table ideas
  add column if not exists estado text not null default 'sonada' check (estado in ('sonada','planeada','hecha')),
  add column if not exists fecha_objetivo date,
  add column if not exists costo text check (costo in ('bajo','medio','alto')),
  add column if not exists votos_por uuid[] not null default '{}';

-- ───────── Comidas: lista de compras ─────────
create table if not exists shopping_items (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references couple_spaces(id) on delete cascade,
  texto text not null,
  hecho boolean not null default false,
  agregado_por uuid references auth.users(id),
  creado_en timestamptz not null default now()
);
alter table shopping_items enable row level security;
create policy "shopping_select_member" on shopping_items for select using (is_space_member(space_id));
create policy "shopping_insert_member" on shopping_items for insert with check (is_space_member(space_id));
create policy "shopping_update_member" on shopping_items for update using (is_space_member(space_id));
create policy "shopping_delete_member" on shopping_items for delete using (is_space_member(space_id));

-- ───────── Realtime ─────────
do $$
declare t text;
begin
  foreach t in array array['shopping_items','meals','ideas','movies','links','events'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table %I', t);
    end if;
  end loop;
end $$;
