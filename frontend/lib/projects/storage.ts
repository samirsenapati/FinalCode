import type { FileMap } from '@/lib/projects/types';

export const LOCAL_LAST_PROJECT_ID_KEY = 'finalcode:last_project_id';

export function normalizeFilesToRows(files: FileMap) {
  return Object.entries(files).map(([path, content]) => ({ path, content }));
}

export function rowsToFileMap(rows: { path: string; content: string }[]): FileMap {
  const map: FileMap = {};
  for (const row of rows) {
    map[row.path] = row.content;
  }
  return map;
}

export function safeProjectName(name: string) {
  const trimmed = name.trim();
  return trimmed.length ? trimmed : 'Untitled Project';
}

export function getLastProjectId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(LOCAL_LAST_PROJECT_ID_KEY);
}

export function setLastProjectId(projectId: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_LAST_PROJECT_ID_KEY, projectId);
}

export function clearLastProjectId() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(LOCAL_LAST_PROJECT_ID_KEY);
}
