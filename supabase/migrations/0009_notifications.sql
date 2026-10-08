-- Ejecutar en Supabase SQL Editor después de 0008.
begin;
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  url text not null default '/app',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_created on public.notifications(user_id, created_at desc);
create index notifications_unread on public.notifications(user_id) where read_at is null;
alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
create policy notifications_select_own on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notifications_read_own on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Se guardan aunque el destinatario esté desconectado o no tenga push.
create function public.store_partner_notification() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  actor uuid;
  heading text;
  detail text;
  destination text;
  row_data jsonb := to_jsonb(new);
begin
  actor := coalesce((row_data->>'user_id')::uuid, (row_data->>'autor_id')::uuid);
  if tg_table_name = 'statuses' then
    if tg_op = 'UPDATE' then
      if (to_jsonb(old) - 'actualizado_en') = (row_data - 'actualizado_en') then return new; end if;
    end if;
    heading := 'Tu pareja actualizó su estado'; detail := row_data->>'mensaje'; destination := '/app/estados';
  elsif tg_table_name = 'thinking_touches' then
    heading := 'Tu pareja está pensando en vos'; detail := row_data->>'mensaje'; destination := '/app/estados';
  elsif tg_table_name = 'status_reactions' then
    heading := 'Tu pareja te mandó una reacción'; detail := row_data->>'tipo'; destination := '/app/estados';
  elsif tg_table_name = 'letters' then
    heading := 'Tu pareja te escribió una carta'; detail := row_data->>'titulo'; destination := '/app/cartas';
  elsif tg_table_name = 'notes' then
    heading := 'Tu pareja dejó una notita'; detail := left(row_data->>'texto', 180); destination := '/app/notitas';
  end if;
  insert into public.notifications(user_id, title, body, url)
    select m.user_id, heading, detail, destination from public.memberships m
    where m.space_id = new.space_id and m.user_id <> actor;
  return new;
end;
$$;
revoke all on function public.store_partner_notification() from public;
create trigger notify_status after insert or update on public.statuses for each row execute function public.store_partner_notification();
create trigger notify_touch after insert on public.thinking_touches for each row execute function public.store_partner_notification();
create trigger notify_reaction after insert on public.status_reactions for each row execute function public.store_partner_notification();
create trigger notify_letter after insert on public.letters for each row execute function public.store_partner_notification();
create trigger notify_note after insert on public.notes for each row execute function public.store_partner_notification();
alter publication supabase_realtime add table public.notifications;
commit;
