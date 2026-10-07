-- Loopy — step 2 of 3: functions & triggers.
-- Run 0001_tables.sql first. Each function body uses its own named dollar-quote
-- tag (e.g. $handle_new_user$) instead of bare $$, to avoid any editor/tool
-- mangling plain $$ delimiters.

-- auto-create a profile row when a new auth user signs up
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $handle_new_user$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$handle_new_user$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- helper used by every content-table policy
create function is_space_member(target_space_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $is_space_member$
  select exists (
    select 1 from memberships
    where memberships.space_id = target_space_id
      and memberships.user_id = auth.uid()
  );
$is_space_member$;

-- RPC: create_space — called right after onboarding by the owner
create function create_space(p_nombre text, p_fecha_aniversario date default null)
returns couple_spaces
language plpgsql
security definer set search_path = public
as $create_space$
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
$create_space$;

-- RPC: create_invitation — owner generates a fresh link/code
create function create_invitation(p_space_id uuid)
returns invitations
language plpgsql
security definer set search_path = public
as $create_invitation$
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
$create_invitation$;

-- RPC: accept_invitation — invited partner redeems a token or code
create function accept_invitation(p_token text)
returns couple_spaces
language plpgsql
security definer set search_path = public
as $accept_invitation$
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
$accept_invitation$;
