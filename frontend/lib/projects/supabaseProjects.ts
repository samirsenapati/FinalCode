import { createClient } from '@/lib/supabase/client';
import type { FileMap, Project, ProjectFile, ChatMessage, ProjectCheckpoint } from '@/lib/projects/types';
import { normalizeFilesToRows, rowsToFileMap } from '@/lib/projects/storage';
import { canCreateProject, decrementProjectCount, incrementProjectCount } from '@/lib/usage/trackingClient';

const PROJECTS_TABLE = 'projects';
const PROJECT_FILES_TABLE = 'project_files';
const CHAT_MESSAGES_TABLE = 'chat_messages';
const PROJECT_CHECKPOINTS_TABLE = 'project_checkpoints';

export class ProjectsServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectsServiceError';
  }
}

function requireSupabase() {
  const supabase = createClient();
  if (!supabase) throw new ProjectsServiceError('Supabase is not configured.');
  return supabase;
}

export async function listProjects(): Promise<Project[]> {
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from(PROJECTS_TABLE)
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw new ProjectsServiceError(error.message);
  return (data ?? []) as Project[];
}

export async function createProject(params: {
  name: string;
  description?: string | null;
  initialFiles: FileMap;
}): Promise<{ project: Project; files: FileMap }> {
  const supabase = requireSupabase();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) throw new ProjectsServiceError(userError?.message || 'Not authenticated');

  // Enforce project cap (free plan etc.)
  const allowed = await canCreateProject(user.id);
  if (!allowed) throw new ProjectsServiceError('Project limit reached for your plan.');

  const { data: projectData, error: projectError } = await supabase
    .from(PROJECTS_TABLE)
    .insert({
      user_id: user.id,
      name: params.name,
      description: params.description ?? null,
    })
    .select('*')
    .single();

  if (projectError) throw new ProjectsServiceError(projectError.message);

  const project = projectData as Project;

  const rows = normalizeFilesToRows(params.initialFiles);
  const { error: filesError } = await supabase.from(PROJECT_FILES_TABLE).insert(
    rows.map((r) => ({
      user_id: user.id,
      project_id: project.id,
      path: r.path,
      content: r.content,
    }))
  );

  if (filesError) throw new ProjectsServiceError(filesError.message);

  // Increment usage counter (best-effort)
  await incrementProjectCount(user.id).catch(() => null);

  return { project, files: params.initialFiles };
}

export async function deleteProject(projectId: string): Promise<void> {
  const supabase = requireSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from(PROJECTS_TABLE).delete().eq('id', projectId);
  if (error) throw new ProjectsServiceError(error.message);

  // Decrement usage counter (best-effort)
  if (user) await decrementProjectCount(user.id).catch(() => null);
}

export async function getProjectWithFiles(projectId: string): Promise<{ project: Project; files: FileMap }> {
  const supabase = requireSupabase();

  const { data: projectData, error: projectError } = await supabase
    .from(PROJECTS_TABLE)
    .select('*')
    .eq('id', projectId)
    .single();

  if (projectError) throw new ProjectsServiceError(projectError.message);

  const { data: fileRows, error: filesError } = await supabase
    .from(PROJECT_FILES_TABLE)
    .select('*')
    .eq('project_id', projectId);

  if (filesError) throw new ProjectsServiceError(filesError.message);

  const files = rowsToFileMap((fileRows ?? []).map((r) => ({ path: r.path, content: r.content })));

  return { project: projectData as Project, files };
}

export async function upsertProjectFiles(projectId: string, files: FileMap): Promise<void> {
  const supabase = requireSupabase();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) throw new ProjectsServiceError(userError?.message || 'Not authenticated');

  const rows = normalizeFilesToRows(files);
  const upsertRows = rows.map((r) => ({
    user_id: user.id,
    project_id: projectId,
    path: r.path,
    content: r.content,
  }));

  // Upsert by unique(project_id, path)
  const { error: upsertError } = await supabase
    .from(PROJECT_FILES_TABLE)
    .upsert(upsertRows, { onConflict: 'project_id,path' });

  if (upsertError) throw new ProjectsServiceError(upsertError.message);

  // Touch project.updated_at via an update
  const { error: touchError } = await supabase
    .from(PROJECTS_TABLE)
    .update({ updated_at: new Date().toISOString() })
    .eq('id', projectId);

  if (touchError) {
    // Not fatal for file save; but surface if needed
    throw new ProjectsServiceError(touchError.message);
  }
}

export async function deleteProjectFile(projectId: string, path: string): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase
    .from(PROJECT_FILES_TABLE)
    .delete()
    .eq('project_id', projectId)
    .eq('path', path);

  if (error) throw new ProjectsServiceError(error.message);
}

export function projectFilesToFileMap(projectFiles: ProjectFile[]): FileMap {
  return rowsToFileMap(projectFiles.map((pf) => ({ path: pf.path, content: pf.content })));
}

// ============================================
// Chat History Functions
// ============================================

export async function saveChatMessage(params: {
  projectId: string;
  role: 'user' | 'assistant';
  content: string;
}): Promise<ChatMessage> {
  const supabase = requireSupabase();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) throw new ProjectsServiceError(userError?.message || 'Not authenticated');

  const { data, error } = await supabase
    .from(CHAT_MESSAGES_TABLE)
    .insert({
      project_id: params.projectId,
      user_id: user.id,
      role: params.role,
      content: params.content,
    })
    .select('*')
    .single();

  if (error) throw new ProjectsServiceError(error.message);
  return data as ChatMessage;
}

export async function getChatHistory(projectId: string): Promise<ChatMessage[]> {
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from(CHAT_MESSAGES_TABLE)
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) throw new ProjectsServiceError(error.message);
  return (data ?? []) as ChatMessage[];
}

export async function clearChatHistory(projectId: string): Promise<void> {
  const supabase = requireSupabase();

  const { error } = await supabase
    .from(CHAT_MESSAGES_TABLE)
    .delete()
    .eq('project_id', projectId);

  if (error) throw new ProjectsServiceError(error.message);
}

// ============================================
// Project Checkpoint Functions
// ============================================

export async function createCheckpoint(params: {
  projectId: string;
  name?: string;
  description?: string;
  files: FileMap;
  chatMessageId?: string;
}): Promise<ProjectCheckpoint> {
  const supabase = requireSupabase();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) throw new ProjectsServiceError(userError?.message || 'Not authenticated');

  const { data, error } = await supabase
    .from(PROJECT_CHECKPOINTS_TABLE)
    .insert({
      project_id: params.projectId,
      user_id: user.id,
      name: params.name ?? null,
      description: params.description ?? null,
      files: params.files,
      chat_message_id: params.chatMessageId ?? null,
    })
    .select('*')
    .single();

  if (error) throw new ProjectsServiceError(error.message);
  return {
    ...data,
    files: data.files as FileMap,
  } as ProjectCheckpoint;
}

export async function getCheckpoints(projectId: string): Promise<ProjectCheckpoint[]> {
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from(PROJECT_CHECKPOINTS_TABLE)
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw new ProjectsServiceError(error.message);
  return (data ?? []).map((row) => ({
    ...row,
    files: row.files as FileMap,
  })) as ProjectCheckpoint[];
}

export async function getCheckpoint(checkpointId: string): Promise<ProjectCheckpoint | null> {
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from(PROJECT_CHECKPOINTS_TABLE)
    .select('*')
    .eq('id', checkpointId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new ProjectsServiceError(error.message);
  }
  return {
    ...data,
    files: data.files as FileMap,
  } as ProjectCheckpoint;
}

export async function deleteCheckpoint(checkpointId: string): Promise<void> {
  const supabase = requireSupabase();

  const { error } = await supabase
    .from(PROJECT_CHECKPOINTS_TABLE)
    .delete()
    .eq('id', checkpointId);

  if (error) throw new ProjectsServiceError(error.message);
}

export async function rollbackToCheckpoint(checkpointId: string): Promise<{ files: FileMap }> {
  const supabase = requireSupabase();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) throw new ProjectsServiceError(userError?.message || 'Not authenticated');

  const checkpoint = await getCheckpoint(checkpointId);
  if (!checkpoint) throw new ProjectsServiceError('Checkpoint not found');

  await upsertProjectFiles(checkpoint.project_id, checkpoint.files);

  const currentFilePaths = Object.keys(checkpoint.files);
  const { data: existingFiles } = await supabase
    .from(PROJECT_FILES_TABLE)
    .select('path')
    .eq('project_id', checkpoint.project_id);

  if (existingFiles) {
    const pathsToDelete = existingFiles
      .map((f) => f.path)
      .filter((p) => !currentFilePaths.includes(p));

    for (const path of pathsToDelete) {
      await deleteProjectFile(checkpoint.project_id, path);
    }
  }

  return { files: checkpoint.files };
}
