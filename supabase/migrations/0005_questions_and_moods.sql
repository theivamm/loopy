-- Loopy — 0005: pregunta del día + ánimos de la semana.
-- Ejecutar en Supabase > SQL Editor > New query (después de 0001–0004).

-- ───────────── Ánimos de la semana ─────────────
-- Una fila por persona y por día. El cliente la actualiza cuando cambian su estado.
create table mood_logs (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references couple_spaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  fecha date not null,
  mood text not null,
  creado_en timestamptz not null default now(),
  unique (space_id, user_id, fecha)
);

-- ───────────── Pregunta del día ─────────────
-- Banco de preguntas global. El cliente elige la del día con (días desde 1970 % cantidad).
create table questions (
  id uuid primary key default gen_random_uuid(),
  orden int not null unique,
  texto text not null
);

create table question_answers (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references couple_spaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references questions(id),
  fecha date not null,
  respuesta text not null,
  creado_en timestamptz not null default now(),
  unique (space_id, user_id, fecha)
);

-- ───────────── Funciones (SECURITY DEFINER: evitan recursión de RLS) ─────────────
-- ¿Ya respondí yo la pregunta de esa fecha?
create function has_answered(p_space_id uuid, p_fecha date)
returns boolean
language sql
stable
security definer
set search_path = public
as $has_answered$
  select exists (
    select 1 from question_answers
    where space_id = p_space_id and fecha = p_fecha and user_id = auth.uid()
  );
$has_answered$;

-- ¿Ya respondió mi pareja? (solo true/false, nunca el texto)
create function partner_answered(p_space_id uuid, p_fecha date)
returns boolean
language sql
stable
security definer
set search_path = public
as $partner_answered$
  select is_space_member(p_space_id) and exists (
    select 1 from question_answers
    where space_id = p_space_id and fecha = p_fecha and user_id <> auth.uid()
  );
$partner_answered$;

-- ───────────── RLS ─────────────
alter table mood_logs enable row level security;
alter table questions enable row level security;
alter table question_answers enable row level security;

create policy "mood_logs_select_member" on mood_logs
  for select using (is_space_member(space_id));
create policy "mood_logs_insert_own" on mood_logs
  for insert with check (is_space_member(space_id) and user_id = auth.uid());
create policy "mood_logs_update_own" on mood_logs
  for update using (is_space_member(space_id) and user_id = auth.uid());
create policy "mood_logs_delete_own" on mood_logs
  for delete using (user_id = auth.uid());

create policy "questions_select_auth" on questions
  for select using (auth.uid() is not null);

-- La respuesta de tu pareja solo se ve después de que contestes la misma fecha.
create policy "answers_select" on question_answers
  for select using (
    is_space_member(space_id)
    and (user_id = auth.uid() or has_answered(space_id, fecha))
  );
create policy "answers_insert_own" on question_answers
  for insert with check (is_space_member(space_id) and user_id = auth.uid());
create policy "answers_update_own" on question_answers
  for update using (is_space_member(space_id) and user_id = auth.uid());
create policy "answers_delete_own" on question_answers
  for delete using (user_id = auth.uid());

-- ───────────── Realtime ─────────────
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'question_answers') then
    alter publication supabase_realtime add table question_answers;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'mood_logs') then
    alter publication supabase_realtime add table mood_logs;
  end if;
end $$;

-- ───────────── Banco de preguntas ─────────────
insert into questions (orden, texto) values
  (1, '¿Qué momento de esta semana te hizo sentir más cerca de mí?'),
  (2, '¿Qué es lo primero que pensaste de mí cuando nos conocimos?'),
  (3, '¿Cuál es tu recuerdo favorito de nosotros?'),
  (4, '¿Qué cosa chiquita que hago te hace feliz?'),
  (5, '¿A dónde te gustaría viajar conmigo algún día?'),
  (6, '¿Qué canción te hace pensar en nosotros?'),
  (7, '¿Qué te gustaría que hagamos más seguido?'),
  (8, '¿Cuál fue el mejor regalo que recibiste en tu vida?'),
  (9, '¿Qué te da paz cuando estás estresado/a?'),
  (10, '¿Cuál es un sueño que todavía no me contaste?'),
  (11, '¿Qué plan perfecto de domingo imaginás conmigo?'),
  (12, '¿Qué aprendiste de mí este año?'),
  (13, '¿Qué comida te hace sentir en casa?'),
  (14, '¿Qué te hizo reír hoy?'),
  (15, '¿Cómo te gustaría que nos veamos dentro de 5 años?'),
  (16, '¿Cuál es tu película favorita para ver abrazados?'),
  (17, '¿Qué es lo que más admirás de mí?'),
  (18, '¿Qué chiste interno nuestro es tu favorito?'),
  (19, '¿Qué te gustaría probar juntos por primera vez?'),
  (20, '¿Cuál fue el momento en que más te sentiste cuidado/a por mí?'),
  (21, '¿Qué lugar de la ciudad te recuerda a nosotros?'),
  (22, '¿Qué te gustaría decirme más seguido?'),
  (23, '¿Qué hábito tuyo creés que me contagiaste?'),
  (24, '¿Cuál sería nuestra cita ideal un día de lluvia?'),
  (25, '¿Qué te hace sentir orgulloso/a de nosotros?'),
  (26, '¿Qué miedo tuyo te gustaría que te ayude a superar?'),
  (27, '¿Qué momento del día extrañás más cuando no estamos juntos?'),
  (28, '¿Qué foto nuestra es tu favorita y por qué?'),
  (29, '¿Qué te gustaría agradecerme hoy?'),
  (30, '¿Cuál es tu plan soñado para nuestro próximo aniversario?')
on conflict (orden) do nothing;
