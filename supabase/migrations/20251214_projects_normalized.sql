-- FinalCode production schema (normalized)
-- This migration resolves the `public.projects` naming conflict and establishes:
--   - public.projects (normalized)
--   - public.project_files
--   - RLS policies for both
--
-- It also renames the legacy JSONB table (created by older migration) to `projects_legacy`.

create extension if not exists pgcrypto;

-- 1) Rename legacy projects table if it exists
-- Older schema: public.projects(id, user_id, name, description, is_public, files jsonb, ...)
-- New schema: public.projects(id, user_id, name, description, created_at, updated_at)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'projects'
  ) THEN
    -- If the current projects table has a jsonb `files` column, treat it as legacy.
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'files'
    ) THEN
      -- Only rename if projects_legacy doesn't already exist
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'projects_legacy'
      ) THEN
        ALTER TABLE public.projects RENAME TO projects_legacy;
      END IF;
    END IF;
  END IF;
END $$;

-- 2) Ensure updated_at trigger exists
-- (Created by 20251213_create_deployments.sql in this repo; redefine safely)
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 3) Create normalized projects table
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

drop trigger if exists update_projects_updated_at on public.projects;
create trigger update_projects_updated_at
  before update on public.projects
  for each row
  execute function public.update_updated_at_column();

-- 4) Create project_files table
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

drop trigger if exists update_project_files_updated_at on public.project_files;
create trigger update_project_files_updated_at
  before update on public.project_files
  for each row
  execute function public.update_updated_at_column();

-- 5) Row Level Security
alter table public.projects enable row level security;
alter table public.project_files enable row level security;

-- Projects policies
DO $$
BEGIN
  -- SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='projects' AND policyname='Users can view their own projects'
  ) THEN
    CREATE POLICY "Users can view their own projects"
      ON public.projects FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  -- INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='projects' AND policyname='Users can insert their own projects'
  ) THEN
    CREATE POLICY "Users can insert their own projects"
      ON public.projects FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- UPDATE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='projects' AND policyname='Users can update their own projects'
  ) THEN
    CREATE POLICY "Users can update their own projects"
      ON public.projects FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- DELETE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='projects' AND policyname='Users can delete their own projects'
  ) THEN
    CREATE POLICY "Users can delete their own projects"
      ON public.projects FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Project files policies
DO $$
BEGIN
  -- SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='project_files' AND policyname='Users can view their own project files'
  ) THEN
    CREATE POLICY "Users can view their own project files"
      ON public.project_files FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  -- INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='project_files' AND policyname='Users can insert their own project files'
  ) THEN
    CREATE POLICY "Users can insert their own project files"
      ON public.project_files FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- UPDATE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='project_files' AND policyname='Users can update their own project files'
  ) THEN
    CREATE POLICY "Users can update their own project files"
      ON public.project_files FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- DELETE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='project_files' AND policyname='Users can delete their own project files'
  ) THEN
    CREATE POLICY "Users can delete their own project files"
      ON public.project_files FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;
