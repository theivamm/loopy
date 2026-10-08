-- Loopy — 0006: Estados 2.0 (batería social, ubicación, vencimiento, reacciones, toques).
-- Ejecutar en Supabase > SQL Editor > New query (después de 0001–0005).

-- ───────────── Nuevas columnas en statuses ─────────────
alter table statuses
  add column if not exists energia int check (energia between 0 and 100),
  add column if not exists ubicacion text,
  add column if not exists actividad_tipo text,
  add column if not exists vence_en timestamptz,
  add column if not exists zona_horaria text;

-- ───────────── Toques y mensajitos ("Pensando en vos", "Te extraño"…) ─────────────
create table if not exists thinking_touches (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references couple_spaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  mensaje text,
  creado_en timestamptz not null default now()
);

-- ───────────── Reacciones al estado del otro (abrazo, ánimo, café, corazón) ─────────────
create table if not exists status_reactions (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references couple_spaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('abrazo','animo','cafe','corazon')),
  creado_en timestamptz not null default now()
);

create index if not exists thinking_touches_space_idx on thinking_touches (space_id, creado_en desc);
create index if not exists status_reactions_space_idx on status_reactions (space_id, creado_en desc);

-- ───────────── RLS ─────────────
alter table thinking_touches enable row level security;
alter table status_reactions enable row level security;

create policy "touches_select_member" on thinking_touches
  for select using (is_space_member(space_id));
create policy "touches_insert_own" on thinking_touches
  for insert with check (is_space_member(space_id) and user_id = auth.uid());
create policy "touches_delete_own" on thinking_touches
  for delete using (user_id = auth.uid());

create policy "reactions_select_member" on status_reactions
  for select using (is_space_member(space_id));
create policy "reactions_insert_own" on status_reactions
  for insert with check (is_space_member(space_id) and user_id = auth.uid());
create policy "reactions_delete_own" on status_reactions
  for delete using (user_id = auth.uid());

-- ───────────── Realtime (para los avisos en la app) ─────────────
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'thinking_touches') then
    alter publication supabase_realtime add table thinking_touches;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'status_reactions') then
    alter publication supabase_realtime add table status_reactions;
  end if;
end $$;
