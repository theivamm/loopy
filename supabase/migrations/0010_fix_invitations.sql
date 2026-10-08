-- Ejecutar en Supabase SQL Editor. Repara la RPC sin depender de dónde
-- esté instalado pgcrypto y reutiliza las invitaciones vigentes.
begin;
alter table public.invitations alter column token
  set default replace(gen_random_uuid()::text, '-', '');

create or replace function public.create_invitation(p_space_id uuid)
returns public.invitations
language plpgsql security definer set search_path = public
as $$
declare
  invitation public.invitations;
begin
  if auth.uid() is null then raise exception 'Iniciá sesión para crear una invitación'; end if;
  if not exists (select 1 from public.memberships where space_id = p_space_id and user_id = auth.uid()) then
    raise exception 'No pertenecés a este espacio';
  end if;
  -- Serializa la creación para que dos solicitudes no invaliden sus links.
  perform 1 from public.couple_spaces where id = p_space_id for update;
  if (select count(*) from public.memberships where space_id = p_space_id) >= 2 then
    raise exception 'Tu pareja ya se unió al espacio';
  end if;
  select * into invitation from public.invitations
    where space_id = p_space_id and usado = false and vence_en > now()
    order by creado_en desc limit 1;
  if found then return invitation; end if;
  update public.invitations set usado = true where space_id = p_space_id and usado = false;
  loop
    begin
      insert into public.invitations (space_id, codigo, token, creado_por)
        values (p_space_id, upper(left(replace(gen_random_uuid()::text, '-', ''), 8)), replace(gen_random_uuid()::text, '-', ''), auth.uid())
        returning * into invitation;
      exit;
    exception when unique_violation then
      -- Generar otro código en el caso improbable de una colisión.
    end;
  end loop;
  return invitation;
end;
$$;
revoke all on function public.create_invitation(uuid) from public;
grant execute on function public.create_invitation(uuid) to authenticated;
notify pgrst, 'reload schema';
commit;
