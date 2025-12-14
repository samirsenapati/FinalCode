-- FinalCode Chat History and Project Checkpoints
-- This migration adds tables for persisting AI chat messages and project checkpoints (rollback points)

-- ============================================
-- PART 1: Chat Messages Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON public.chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own chat messages" ON public.chat_messages;
CREATE POLICY "Users can view their own chat messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own chat messages" ON public.chat_messages;
CREATE POLICY "Users can insert their own chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own chat messages" ON public.chat_messages;
CREATE POLICY "Users can delete their own chat messages"
  ON public.chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- PART 2: Project Checkpoints Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.project_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  description TEXT,
  files JSONB NOT NULL,
  chat_message_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_checkpoints_project_id ON public.project_checkpoints(project_id);
CREATE INDEX IF NOT EXISTS idx_project_checkpoints_user_id ON public.project_checkpoints(user_id);
CREATE INDEX IF NOT EXISTS idx_project_checkpoints_created_at ON public.project_checkpoints(created_at);

ALTER TABLE public.project_checkpoints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own checkpoints" ON public.project_checkpoints;
CREATE POLICY "Users can view their own checkpoints"
  ON public.project_checkpoints FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own checkpoints" ON public.project_checkpoints;
CREATE POLICY "Users can insert their own checkpoints"
  ON public.project_checkpoints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own checkpoints" ON public.project_checkpoints;
CREATE POLICY "Users can delete their own checkpoints"
  ON public.project_checkpoints FOR DELETE
  USING (auth.uid() = user_id);
