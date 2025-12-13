-- FinalCode: Projects + Files (Scope B)
-- Run this in Supabase Dashboard -> SQL Editor
-- This creates:
--   - public.projects
--   - public.project_files
-- With strict Row Level Security so users can only access their own rows.

-- Ensure uuid generator is available
create extension if not exists pgcrypto;

-- Projects table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_projects_updated_at on public.projects(updated_at);

-- Project files table (one row per file path)
create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  path text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, path)
);

create index if not exists idx_project_files_project_id on public.project_files(project_id);
create index if not exists idx_project_files_user_id on public.project_files(user_id);

-- updated_at trigger helper
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_projects_updated_at on public.projects;
create trigger update_projects_updated_at
  before update on public.projects
  for each row
  execute function public.update_updated_at_column();

drop trigger if exists update_project_files_updated_at on public.project_files;
create trigger update_project_files_updated_at
  before update on public.project_files
  for each row
  execute function public.update_updated_at_column();

-- Row Level Security
alter table public.projects enable row level security;
alter table public.project_files enable row level security;

-- Projects policies
drop policy if exists "Users can view their own projects" on public.projects;
create policy "Users can view their own projects"
  on public.projects for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own projects" on public.projects;
create policy "Users can insert their own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own projects" on public.projects;
create policy "Users can update their own projects"
  on public.projects for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own projects" on public.projects;
create policy "Users can delete their own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Project files policies
drop policy if exists "Users can view their own project files" on public.project_files;
create policy "Users can view their own project files"
  on public.project_files for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own project files" on public.project_files;
create policy "Users can insert their own project files"
  on public.project_files for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own project files" on public.project_files;
create policy "Users can update their own project files"
  on public.project_files for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own project files" on public.project_files;
create policy "Users can delete their own project files"
  on public.project_files for delete
  using (auth.uid() = user_id);
