-- Loopy — 0009: Música 2.0 (nuestra canción, historial del día, etiquetas, reacciones, dedicatorias).
-- Ejecutar en Supabase > SQL Editor > New query (después de 0001–0008).

alter table songs
  add column if not exists es_nuestra boolean not null default false,
  add column if not exists etiqueta text,
  add column if not exists del_dia_fecha date,
  add column if not exists dedicada boolean not null default false,
  add column if not exists reacciones jsonb not null default '{}'::jsonb;

create index if not exists songs_del_dia_idx on songs (space_id, del_dia_fecha desc);

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'songs') then
    alter publication supabase_realtime add table songs;
  end if;
end $$;
