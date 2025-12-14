export type FileMap = Record<string, string>;

export interface ToolResult {
  success: boolean;
  result?: string;
  error?: string;
  files_changed?: string[];
}

export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

export function executeReadFile(
  files: FileMap,
  args: { path: string }
): ToolResult {
  const { path } = args;
  
  if (!path) {
    return { success: false, error: 'Missing required parameter: path' };
  }

  const content = files[path];
  if (content === undefined) {
    const availableFiles = Object.keys(files).join(', ');
    return {
      success: false,
      error: `File not found: ${path}. Available files: ${availableFiles || 'none'}`,
    };
  }

  return { success: true, result: content };
}

export function executeWriteFile(
  files: FileMap,
  args: { path: string; content: string }
): ToolResult {
  const { path, content } = args;

  if (!path) {
    return { success: false, error: 'Missing required parameter: path' };
  }
  if (content === undefined) {
    return { success: false, error: 'Missing required parameter: content' };
  }

  const isNew = files[path] === undefined;
  files[path] = content;

  return {
    success: true,
    result: isNew ? `Created file: ${path}` : `Updated file: ${path}`,
    files_changed: [path],
  };
}

export function executeListFiles(files: FileMap): ToolResult {
  const fileList = Object.keys(files);
  
  if (fileList.length === 0) {
    return { success: true, result: 'No files in project.' };
  }

  const tree = buildFileTree(fileList);
  return { success: true, result: tree };
}

function buildFileTree(paths: string[]): string {
  const sorted = [...paths].sort();
  const lines: string[] = [];
  
  for (const path of sorted) {
    const parts = path.split('/');
    const indent = '  '.repeat(parts.length - 1);
    const name = parts[parts.length - 1];
    lines.push(`${indent}${name}`);
  }
  
  return lines.join('\n');
}

export function executeSearchFiles(
  files: FileMap,
  args: { query: string; file_pattern?: string }
): ToolResult {
  const { query, file_pattern } = args;

  if (!query) {
    return { success: false, error: 'Missing required parameter: query' };
  }

  const results: string[] = [];
  const regex = new RegExp(query, 'gi');

  for (const [path, content] of Object.entries(files)) {
    if (file_pattern && !matchPattern(path, file_pattern)) {
      continue;
    }

    const lines = content.split('\n');
    const matches: { line: number; text: string }[] = [];

    for (let i = 0; i < lines.length; i++) {
      if (regex.test(lines[i])) {
        matches.push({ line: i + 1, text: lines[i].trim() });
      }
      regex.lastIndex = 0;
    }

    if (matches.length > 0) {
      results.push(`\n${path}:`);
      for (const match of matches.slice(0, 10)) {
        results.push(`  Line ${match.line}: ${match.text}`);
      }
      if (matches.length > 10) {
        results.push(`  ... and ${matches.length - 10} more matches`);
      }
    }
  }

  if (results.length === 0) {
    return { success: true, result: `No matches found for "${query}"` };
  }

  return { success: true, result: results.join('\n') };
}

function matchPattern(path: string, pattern: string): boolean {
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${regexPattern}$`).test(path);
}

export function executeDeleteFile(
  files: FileMap,
  args: { path: string }
): ToolResult {
  const { path } = args;

  if (!path) {
    return { success: false, error: 'Missing required parameter: path' };
  }

  if (files[path] === undefined) {
    return { success: false, error: `File not found: ${path}` };
  }

  delete files[path];
  return {
    success: true,
    result: `Deleted file: ${path}`,
    files_changed: [path],
  };
}

export function executeTaskComplete(args: {
  summary: string;
  files_changed?: string;
}): ToolResult {
  return {
    success: true,
    result: `Task completed: ${args.summary}`,
    files_changed: args.files_changed?.split(',').map((f) => f.trim()),
  };
}

export function executeTool(
  toolName: string,
  args: Record<string, any>,
  files: FileMap
): ToolResult {
  switch (toolName) {
    case 'read_file':
      return executeReadFile(files, args as { path: string });
    case 'write_file':
      return executeWriteFile(files, args as { path: string; content: string });
    case 'list_files':
      return executeListFiles(files);
    case 'search_files':
      return executeSearchFiles(files, args as { query: string; file_pattern?: string });
    case 'delete_file':
      return executeDeleteFile(files, args as { path: string });
    case 'task_complete':
      return executeTaskComplete(args as { summary: string; files_changed?: string });
    default:
      return { success: false, error: `Unknown tool: ${toolName}` };
  }
}
