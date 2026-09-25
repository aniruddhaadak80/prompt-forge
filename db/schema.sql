create table if not exists prompt_forge_builds (
  id text primary key,
  title text not null,
  prompt text not null,
  kind text not null check (kind in ('svg', 'arcade', 'orbit', 'climate')),
  status text not null default 'published' check (status in ('published', 'retired')),
  source_ids jsonb not null default '[]'::jsonb,
  artifact_code text not null,
  preview_mode text not null default 'iframe',
  score integer not null default 0,
  recommendation text not null default '',
  factors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  prev_seal text not null default '',
  seal text not null,
  owner_scope text not null
);
create index if not exists prompt_forge_builds_owner_updated_idx on prompt_forge_builds(owner_scope, updated_at desc);
create table if not exists prompt_forge_audit_events (
  id text primary key,
  build_id text not null references prompt_forge_builds(id),
  action text not null check (action in ('create', 'update', 'retire')),
  payload jsonb not null,
  previous_seal text not null,
  seal text not null,
  created_at timestamptz not null default now(),
  sequence bigserial not null
);
create index if not exists prompt_forge_audit_events_build_sequence_idx on prompt_forge_audit_events(build_id, sequence);
