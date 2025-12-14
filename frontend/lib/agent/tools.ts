export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
}

export const AGENT_TOOLS: ToolDefinition[] = [
  {
    name: 'read_file',
    description: 'Read the contents of a file from the project. Use this to understand existing code before making changes.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The file path to read (e.g., "server.js", "public/index.html", "routes/api.js")',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write or update a file in the project. Use this to create new files or modify existing ones.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The file path to write to (e.g., "server.js", "public/index.html")',
        },
        content: {
          type: 'string',
          description: 'The complete content to write to the file',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'list_files',
    description: 'List all files in the project. Use this to understand the project structure.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'search_files',
    description: 'Search for text or patterns across all project files. Use this to find specific code, imports, or references.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The text or regex pattern to search for',
        },
        file_pattern: {
          type: 'string',
          description: 'Optional glob pattern to filter files (e.g., "*.js", "public/*.html")',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'delete_file',
    description: 'Delete a file from the project. Use with caution.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The file path to delete',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'task_complete',
    description: 'Signal that the current task is complete. Call this when you have finished implementing the user\'s request.',
    parameters: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'A brief summary of what was done',
        },
        files_changed: {
          type: 'string',
          description: 'Comma-separated list of files that were created or modified',
        },
      },
      required: ['summary'],
    },
  },
];

export function getOpenAITools() {
  return AGENT_TOOLS.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

export function getAnthropicTools() {
  return AGENT_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters,
  }));
}
