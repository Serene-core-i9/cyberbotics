create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  username      text not null unique,
  email         text not null unique,
  password_hash text not null,
  role          text not null default 'student' check (role in ('student','instructor','admin')),
  is_verified   boolean not null default false,
  last_login    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists reset_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used       boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists quiz_scores (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  level      text not null check (level in ('beginner','intermediate','advanced')),
  score      integer not null default 0,
  correct    integer not null default 0,
  total      integer not null default 0,
  played_at  timestamptz not null default now()
);

create index if not exists idx_users_email       on users(email);
create index if not exists idx_users_username    on users(username);
create index if not exists idx_reset_token_hash  on reset_tokens(token_hash);
create index if not exists idx_quiz_user         on quiz_scores(user_id);
