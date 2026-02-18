-- Kaiban Studio – Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New Query)
-- ============================================================

-- 0. Extensions
create extension if not exists "pgcrypto";

-- 1. Users
create table public.users (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  name        text not null default '',
  avatar_url  text not null default '',
  created_at  timestamptz not null default now()
);

-- 2. Boards
create table public.boards (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_id    uuid not null references public.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- 3. Board members (multi-user, roles)
create table public.board_members (
  id        uuid primary key default gen_random_uuid(),
  board_id  uuid not null references public.boards(id) on delete cascade,
  user_id   uuid not null references public.users(id) on delete cascade,
  role      text not null default 'editor' check (role in ('admin','editor','viewer')),
  unique(board_id, user_id)
);

-- 4. Columns
create table public.columns (
  id        uuid primary key default gen_random_uuid(),
  board_id  uuid not null references public.boards(id) on delete cascade,
  name      text not null,
  wip_limit integer,
  "order"   integer not null default 0
);

-- 5. Lanes
create table public.lanes (
  id        uuid primary key default gen_random_uuid(),
  board_id  uuid not null references public.boards(id) on delete cascade,
  name      text not null,
  color     text not null default 'bg-blue-900/50',
  "order"   integer not null default 0
);

-- 6. Cards
create table public.cards (
  id          uuid primary key default gen_random_uuid(),
  board_id    uuid not null references public.boards(id) on delete cascade,
  column_id   uuid not null references public.columns(id) on delete cascade,
  lane_id     uuid references public.lanes(id) on delete set null,
  title       text not null,
  description text not null default '',
  priority    text not null default 'P2' check (priority in ('P0','P1','P2','P3')),
  owner_id    uuid references public.users(id) on delete set null,
  epic_id     text,
  feature_id  text,
  "order"     integer not null default 0,
  created_at  timestamptz not null default now()
);

-- 7. Checklist items
create table public.checklist_items (
  id        uuid primary key default gen_random_uuid(),
  card_id   uuid not null references public.cards(id) on delete cascade,
  text      text not null,
  completed boolean not null default false,
  "order"   integer not null default 0
);

-- 8. Comments
create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  card_id     uuid not null references public.cards(id) on delete cascade,
  author_id   uuid not null references public.users(id) on delete cascade,
  text        text not null,
  created_at  timestamptz not null default now()
);

-- 9. Card templates
create table public.card_templates (
  id            uuid primary key default gen_random_uuid(),
  board_id      uuid not null references public.boards(id) on delete cascade,
  name          text not null,
  template_data jsonb not null default '{}'
);

-- 10. Custom fields (board-level definitions)
create table public.custom_fields (
  id          uuid primary key default gen_random_uuid(),
  board_id    uuid not null references public.boards(id) on delete cascade,
  name        text not null,
  field_type  text not null default 'text' check (field_type in ('text','number','select')),
  options     jsonb -- for select type: ["opt1","opt2"]
);

-- 11. Card custom field values
create table public.card_custom_values (
  id        uuid primary key default gen_random_uuid(),
  card_id   uuid not null references public.cards(id) on delete cascade,
  field_id  uuid not null references public.custom_fields(id) on delete cascade,
  value     text,
  unique(card_id, field_id)
);

-- Indexes
create index idx_columns_board on public.columns(board_id);
create index idx_lanes_board on public.lanes(board_id);
create index idx_cards_board on public.cards(board_id);
create index idx_cards_column on public.cards(column_id);
create index idx_checklist_card on public.checklist_items(card_id);
create index idx_comments_card on public.comments(card_id);
create index idx_board_members_board on public.board_members(board_id);
create index idx_board_members_user on public.board_members(user_id);
