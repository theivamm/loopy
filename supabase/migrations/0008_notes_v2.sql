-- Loopy — 0008: Notitas 2.0 (heladera libre, listas, fijadas, me gusta, adornos).
-- Ejecutar en Supabase > SQL Editor > New query (después de 0001–0007).

alter table notes
  add column if not exists x real,
  add column if not exists y real,
  add column if not exists z int not null default 0,
  add column if not exists tipo text not null default 'nota' check (tipo in ('nota','lista')),
  add column if not exists items jsonb not null default '[]'::jsonb,
  add column if not exists pin text not null default 'chincheta',
  add column if not exists fijada boolean not null default false,
  add column if not exists me_gusta uuid[] not null default '{}';

-- Preferencia de aviso push para notitas nuevas
alter table notification_prefs
  add column if not exists notitas boolean not null default true;

-- Realtime para que la heladera se actualice en vivo
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notes') then
    alter publication supabase_realtime add table notes;
  end if;
end $$;
