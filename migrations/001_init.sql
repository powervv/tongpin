create table if not exists student (
  id integer primary key,
  name text not null,
  grade text not null,
  city text not null,
  constraint student_singleton check (id = 1)
);

create table if not exists section_progress (
  section_id text primary key,
  status text not null check (status in ('unlearned', 'learning', 'learned')),
  updated_at timestamptz not null default now()
);

create table if not exists attempts (
  id text primary key,
  kind text not null check (kind in ('generated', 'school', 'similar')),
  subject text not null,
  exam_type text,
  title text not null,
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  score numeric,
  total numeric,
  duration_min integer,
  status text not null check (status in ('in_progress', 'graded', 'recorded')),
  school_date date,
  note text
);

create table if not exists attempt_items (
  id text primary key,
  attempt_id text not null references attempts (id) on delete cascade,
  position integer not null,
  kp_id text not null,
  template_id text,
  section_id text not null,
  subject text not null,
  item_type text not null,
  display text not null,
  difficulty integer not null,
  points numeric not null,
  stem text not null,
  choices_json text,
  answer_json text not null,
  solution text not null,
  signature text not null,
  student_answer text,
  correct boolean,
  error_cause text,
  earned numeric,
  source text not null default 'app'
);

create index if not exists attempt_items_attempt_idx on attempt_items (attempt_id);
create index if not exists attempt_items_kp_idx on attempt_items (kp_id);

create table if not exists mastery (
  kp_id text primary key,
  score numeric not null default 50,
  attempts integer not null default 0,
  correct_count integer not null default 0,
  last_error_cause text,
  recent_json text not null default '[]',
  next_review_at timestamptz,
  review_stage integer not null default 0,
  updated_at timestamptz not null default now()
);
