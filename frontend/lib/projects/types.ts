export type Project = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectFile = {
  id: string;
  project_id: string;
  user_id: string;
  path: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type FileMap = Record<string, string>;

export type ChatMessage = {
  id: string;
  project_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

export type ProjectCheckpoint = {
  id: string;
  project_id: string;
  user_id: string;
  name: string | null;
  description: string | null;
  files: FileMap;
  chat_message_id: string | null;
  created_at: string;
};
