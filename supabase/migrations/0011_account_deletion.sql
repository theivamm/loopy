-- Ejecutar antes de desplegar la opción Eliminar mi cuenta.
begin;

-- El contenido compartido sigue disponible para la otra persona, sin autor.
alter table public.letters alter column autor_id drop not null;
alter table public.letters drop constraint letters_autor_id_fkey;
alter table public.letters add constraint letters_autor_id_fkey foreign key (autor_id) references auth.users(id) on delete set null;
alter table public.notes alter column autor_id drop not null;
alter table public.notes drop constraint notes_autor_id_fkey;
alter table public.notes add constraint notes_autor_id_fkey foreign key (autor_id) references auth.users(id) on delete set null;
alter table public.ideas alter column autor_id drop not null;
alter table public.ideas drop constraint ideas_autor_id_fkey;
alter table public.ideas add constraint ideas_autor_id_fkey foreign key (autor_id) references auth.users(id) on delete set null;
alter table public.songs alter column agregado_por drop not null;
alter table public.songs drop constraint songs_agregado_por_fkey;
alter table public.songs add constraint songs_agregado_por_fkey foreign key (agregado_por) references auth.users(id) on delete set null;
alter table public.movies alter column agregado_por drop not null;
alter table public.movies drop constraint movies_agregado_por_fkey;
alter table public.movies add constraint movies_agregado_por_fkey foreign key (agregado_por) references auth.users(id) on delete set null;
alter table public.links alter column agregado_por drop not null;
alter table public.links drop constraint links_agregado_por_fkey;
alter table public.links add constraint links_agregado_por_fkey foreign key (agregado_por) references auth.users(id) on delete set null;
alter table public.events alter column creado_por drop not null;
alter table public.events drop constraint events_creado_por_fkey;
alter table public.events add constraint events_creado_por_fkey foreign key (creado_por) references auth.users(id) on delete set null;
alter table public.memories alter column subido_por drop not null;
alter table public.memories drop constraint memories_subido_por_fkey;
alter table public.memories add constraint memories_subido_por_fkey foreign key (subido_por) references auth.users(id) on delete set null;
alter table public.meals drop constraint meals_cocina_user_id_fkey;
alter table public.meals add constraint meals_cocina_user_id_fkey foreign key (cocina_user_id) references auth.users(id) on delete set null;
alter table public.invitations drop constraint invitations_creado_por_fkey;
alter table public.invitations add constraint invitations_creado_por_fkey foreign key (creado_por) references auth.users(id) on delete cascade;

create function public.cleanup_loopy_account() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  target_space uuid;
  remaining_user uuid;
begin
  for target_space in select space_id from public.memberships where user_id = old.id loop
    perform 1 from public.couple_spaces where id = target_space for update;
    select user_id into remaining_user from public.memberships
      where space_id = target_space and user_id <> old.id order by unido_en limit 1;
    if remaining_user is null then
      delete from public.couple_spaces where id = target_space;
    else
      update public.couple_spaces set owner_id = remaining_user where id = target_space and owner_id = old.id;
      update public.memberships set rol = 'owner' where space_id = target_space and user_id = remaining_user;
    end if;
  end loop;
  -- Las ideas privadas no pasan al otro integrante.
  delete from public.ideas where autor_id = old.id and privada = true;
  update public.notes set me_gusta = array_remove(me_gusta, old.id) where old.id = any(me_gusta);
  return old;
end;
$$;
revoke all on function public.cleanup_loopy_account() from public;
create trigger cleanup_loopy_before_delete before delete on auth.users
for each row execute function public.cleanup_loopy_account();

-- Solo el backend puede enumerar archivos de una cuenta para eliminarlos
-- usando la API de Storage (nunca DELETE directo sobre storage.objects).
create function public.account_storage_files(p_user_id uuid)
returns table(bucket_id text, name text)
language sql security definer set search_path = public as $$
  select o.bucket_id, o.name from storage.objects o where o.owner_id = p_user_id::text;
$$;
revoke all on function public.account_storage_files(uuid) from public;
grant execute on function public.account_storage_files(uuid) to service_role;
notify pgrst, 'reload schema';
commit;
