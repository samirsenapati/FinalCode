export interface ToolCallEvent {
  type: 'tool_call';
  tool: string;
  arguments: Record<string, any>;
}

export interface ToolResultEvent {
  type: 'tool_result';
  tool: string;
  result: {
    success: boolean;
    result?: string;
    error?: string;
    files_changed?: string[];
  };
}

export interface TextEvent {
  type: 'text';
  content: string;
}

export interface CompleteEvent {
  type: 'complete';
  files: Record<string, string>;
  summary?: string;
}

export interface ErrorEvent {
  type: 'error';
  message: string;
}

export type AgentEvent = ToolCallEvent | ToolResultEvent | TextEvent | CompleteEvent | ErrorEvent;

export interface AgentResponse {
  events: AgentEvent[];
  files: Record<string, string>;
  isFullstack: boolean;
  summary?: string;
}

export interface AgentStep {
  id: string;
  type: 'thinking' | 'tool_call' | 'tool_result' | 'text' | 'error' | 'complete';
  tool?: string;
  content: string;
  timestamp: number;
  expanded?: boolean;
}
