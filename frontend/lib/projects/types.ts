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
