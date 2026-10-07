-- Loopy — step 3 of 3: Row Level Security.
-- Run 0001_tables.sql and 0002_functions.sql first.

alter table profiles enable row level security;

create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

-- a profile row for the other member of the same space should be visible too
-- (to show name/avatar/color)
create policy "profiles_select_space_partner" on profiles
  for select using (
    exists (
      select 1 from memberships m1
      join memberships m2 on m1.space_id = m2.space_id
      where m1.user_id = auth.uid() and m2.user_id = profiles.id
    )
  );

alter table couple_spaces enable row level security;

create policy "spaces_select_member" on couple_spaces
  for select using (is_space_member(id));

create policy "spaces_update_member" on couple_spaces
  for update using (is_space_member(id));

alter table memberships enable row level security;

create policy "memberships_select_own_space" on memberships
  for select using (
    user_id = auth.uid()
    or exists (select 1 from memberships m2 where m2.space_id = memberships.space_id and m2.user_id = auth.uid())
  );

alter table invitations enable row level security;

create policy "invitations_select_member" on invitations
  for select using (is_space_member(space_id));

-- generic RLS: member of the space can select/insert/update/delete
do $generic_rls$
declare
  t text;
begin
  for t in select unnest(array[
    'statuses','letters','songs','movies','links','events',
    'recipes','meals','ideas','notes','memories'
  ])
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "%1$s_select_member" on %1$I for select using (is_space_member(space_id))', t
    );
    execute format(
      'create policy "%1$s_insert_member" on %1$I for insert with check (is_space_member(space_id))', t
    );
    execute format(
      'create policy "%1$s_update_member" on %1$I for update using (is_space_member(space_id))', t
    );
    execute format(
      'create policy "%1$s_delete_member" on %1$I for delete using (is_space_member(space_id))', t
    );
  end loop;
end;
$generic_rls$;
