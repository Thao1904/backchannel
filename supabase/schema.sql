create table if not exists public.survey_sessions (
  id text primary key,
  owner_name text,
  survey_payload jsonb not null,
  survey_signature text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_rooms (
  id text primary key,
  survey_session_id text not null references public.survey_sessions(id) on delete cascade,
  room_code text not null unique,
  join_code_hash text not null,
  room_url text,
  status text not null default 'active',
  free_message_limit integer not null default 8,
  user_message_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id text primary key,
  room_id text not null references public.chat_rooms(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  speaker text,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.feedback (
  id text primary key,
  rating integer check (rating between 1 and 5),
  message text,
  contact text,
  page_path text,
  created_at timestamptz not null default now()
);

create index if not exists chat_rooms_room_code_idx
  on public.chat_rooms(room_code);

create index if not exists chat_rooms_join_code_hash_idx
  on public.chat_rooms(join_code_hash);

create index if not exists chat_messages_room_id_created_at_idx
  on public.chat_messages(room_id, created_at);

create index if not exists feedback_created_at_idx
  on public.feedback(created_at desc);

alter table public.survey_sessions enable row level security;
alter table public.chat_rooms enable row level security;
alter table public.chat_messages enable row level security;
alter table public.feedback enable row level security;

-- The Next.js API route uses SUPABASE_SERVICE_ROLE_KEY server-side, so public
-- browser clients do not need direct table access for this kiosk prototype.
