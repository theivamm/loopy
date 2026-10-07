-- Loopy — step 4: song thumbnails + realtime for live partner status updates.
-- Run after 0001/0002/0003. Safe to run more than once.

alter table songs add column if not exists imagen text;
alter table songs add column if not exists plataforma_detectada text;

-- Without this, a status update from one partner never reaches the other
-- partner's open tab — they only see it after a manual reload, which is
-- what "al actualizar el estado no pasa nada" was actually describing.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'statuses'
  ) then
    alter publication supabase_realtime add table statuses;
  end if;
end $$;
