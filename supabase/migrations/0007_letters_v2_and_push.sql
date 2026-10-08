-- Loopy — 0007: Cartas 2.0 (decoraciones, imágenes) + Notificaciones push.
-- Ejecutar en Supabase > SQL Editor > New query (después de 0001–0006).

-- ───────────── Cartas ─────────────
-- `estilo` (ya existe) guarda el papel como JSON; `decoraciones` guarda stickers/sellos.
alter table letters
  add column if not exists decoraciones jsonb not null default '[]'::jsonb,
  add column if not exists notificada boolean not null default false;

-- ───────────── Storage: imágenes para stickers ─────────────
-- Bucket público (lectura por URL). Solo miembros del espacio pueden subir/borrar en SU carpeta {space_id}/...
insert into storage.buckets (id, name, public)
values ('letter-assets', 'letter-assets', true)
on conflict (id) do nothing;

create policy "letter_assets_read" on storage.objects
  for select using (bucket_id = 'letter-assets');
create policy "letter_assets_insert" on storage.objects
  for insert with check (
    bucket_id = 'letter-assets'
    and auth.uid() is not null
    and is_space_member(((storage.foldername(name))[1])::uuid)
  );
create policy "letter_assets_delete" on storage.objects
  for delete using (
    bucket_id = 'letter-assets'
    and is_space_member(((storage.foldername(name))[1])::uuid)
  );

-- ───────────── Push ─────────────
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid references couple_spaces(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  creado_en timestamptz not null default now()
);

create table if not exists notification_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  toques boolean not null default true,
  reacciones boolean not null default true,
  estados boolean not null default true,
  cartas boolean not null default true,
  eventos boolean not null default true,
  actualizado_en timestamptz not null default now()
);

alter table push_subscriptions enable row level security;
alter table notification_prefs enable row level security;

create policy "push_subs_select_own" on push_subscriptions for select using (user_id = auth.uid());
create policy "push_subs_insert_own" on push_subscriptions for insert with check (user_id = auth.uid());
create policy "push_subs_update_own" on push_subscriptions for update using (user_id = auth.uid());
create policy "push_subs_delete_own" on push_subscriptions for delete using (user_id = auth.uid());

create policy "prefs_select_own" on notification_prefs for select using (user_id = auth.uid());
create policy "prefs_insert_own" on notification_prefs for insert with check (user_id = auth.uid());
create policy "prefs_update_own" on notification_prefs for update using (user_id = auth.uid());
