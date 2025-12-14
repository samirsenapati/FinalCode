'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Bot,
  FileText,
  FolderTree,
  Search,
  Trash2,
  Terminal,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
  Send,
  Sparkles,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AgentStep, AgentResponse, AgentEvent } from '@/lib/agent/types';
import { loadAISettings } from '@/lib/ai/settings';

interface AgentPanelProps {
  files: Record<string, string>;
  onFilesChange: (files: Record<string, string>) => void;
  projectId?: string;
  onRunApp?: () => void;
  terminalOutput?: string[];
  settingsKey?: number;
}

const TOOL_ICONS: Record<string, typeof FileText> = {
  read_file: FileText,
  write_file: FileText,
  list_files: FolderTree,
  search_files: Search,
  delete_file: Trash2,
  run_command: Terminal,
  task_complete: CheckCircle,
};

const TOOL_LABELS: Record<string, string> = {
  read_file: 'Reading file',
  write_file: 'Writing file',
  list_files: 'Listing files',
  search_files: 'Searching files',
  delete_file: 'Deleting file',
  run_command: 'Running command',
  task_complete: 'Task complete',
};

export default function AgentPanel({
  files,
  onFilesChange,
  projectId,
  onRunApp,
  terminalOutput,
  settingsKey = 0,
}: AgentPanelProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load AI settings from localStorage
  const [aiSettings, setAiSettings] = useState<{ provider: 'openai' | 'anthropic'; model: string }>({
    provider: 'anthropic',
    model: 'claude-opus-4-5-20251101',
  });

  useEffect(() => {
    try {
      const settings = loadAISettings();
      setAiSettings({ provider: settings.provider, model: settings.model });
    } catch {
      // Keep defaults
    }
  }, [settingsKey]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps]);

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const addStep = (step: Omit<AgentStep, 'id' | 'timestamp'>) => {
    const newStep: AgentStep = {
      ...step,
      id: `step-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
    };
    setSteps(prev => [...prev, newStep]);
    return newStep.id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    addStep({
      type: 'text',
      content: `**You:** ${userMessage}`,
    });

    addStep({
      type: 'thinking',
      content: 'Analyzing request...',
    });

    try {
      const res = await fetch('/api/ai/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          currentFiles: files,
          provider: aiSettings.provider,
          model: aiSettings.model,
        }),
      });

      const data: AgentResponse = await res.json();

      if (!res.ok) {
        addStep({
          type: 'error',
          content: (data as any).error || 'Failed to get response from agent',
        });
        return;
      }

      setSteps(prev => prev.filter(s => s.type !== 'thinking'));

      for (const event of data.events) {
        processEvent(event);
      }

      if (data.files && Object.keys(data.files).length > 0) {
        // Merge updated files with existing files (preserve any client-only edits)
        const mergedFiles = { ...files, ...data.files };
        onFilesChange(mergedFiles);
        
        // Auto-run if we have a complete fullstack project
        if (data.isFullstack && onRunApp) {
          addStep({
            type: 'text',
            content: '🚀 Starting the app automatically...',
          });
          setTimeout(() => onRunApp(), 500);
        }
      }
    } catch (error: any) {
      addStep({
        type: 'error',
        content: error.message || 'An error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processEvent = (event: AgentEvent) => {
    switch (event.type) {
      case 'tool_call':
        addStep({
          type: 'tool_call',
          tool: event.tool,
          content: formatToolCall(event.tool, event.arguments),
        });
        break;

      case 'tool_result':
        addStep({
          type: 'tool_result',
          tool: event.tool,
          content: formatToolResult(event.tool, event.result),
        });
        break;

      case 'text':
        if (event.content) {
          addStep({
            type: 'text',
            content: event.content,
          });
        }
        break;

      case 'error':
        addStep({
          type: 'error',
          content: event.message,
        });
        break;

      case 'complete':
        if (event.summary) {
          addStep({
            type: 'complete',
            content: event.summary,
          });
        }
        break;
    }
  };

  const formatToolCall = (tool: string, args: Record<string, any>): string => {
    switch (tool) {
      case 'read_file':
        return `Reading \`${args.path}\``;
      case 'write_file':
        return `Writing to \`${args.path}\` (${args.content?.length || 0} chars)`;
      case 'list_files':
        return 'Getting project file list';
      case 'search_files':
        return `Searching for "${args.query}"${args.file_pattern ? ` in ${args.file_pattern}` : ''}`;
      case 'delete_file':
        return `Deleting \`${args.path}\``;
      case 'run_command':
        return `Running: \`${args.command}\``;
      case 'task_complete':
        return args.summary || 'Task completed';
      default:
        return `${tool}(${JSON.stringify(args)})`;
    }
  };

  const formatToolResult = (tool: string, result: any): string => {
    if (!result.success) {
      return `Error: ${result.error}`;
    }
    
    if (tool === 'read_file' && result.result) {
      const lines = result.result.split('\n');
      if (lines.length > 10) {
        return `\`\`\`\n${lines.slice(0, 10).join('\n')}\n... (${lines.length - 10} more lines)\n\`\`\``;
      }
      return `\`\`\`\n${result.result}\n\`\`\``;
    }
    
    return result.result || 'Success';
  };

  const renderStep = (step: AgentStep) => {
    const isExpanded = expandedSteps.has(step.id);
    const Icon = step.tool ? TOOL_ICONS[step.tool] || Bot : Bot;

    return (
      <div
        key={step.id}
        className={`border-l-2 pl-3 py-2 ${
          step.type === 'error'
            ? 'border-red-500 bg-red-500/10'
            : step.type === 'complete'
            ? 'border-green-500 bg-green-500/10'
            : step.type === 'tool_call'
            ? 'border-blue-500 bg-blue-500/5'
            : step.type === 'tool_result'
            ? 'border-purple-500 bg-purple-500/5'
            : step.type === 'thinking'
            ? 'border-yellow-500 bg-yellow-500/5'
            : 'border-[#30363d]'
        }`}
      >
        <div
          className="flex items-start gap-2 cursor-pointer"
          onClick={() => toggleStep(step.id)}
        >
          <div className="flex-shrink-0 mt-0.5">
            {step.type === 'thinking' ? (
              <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
            ) : step.type === 'error' ? (
              <XCircle className="w-4 h-4 text-red-500" />
            ) : step.type === 'complete' ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : step.type === 'tool_call' || step.type === 'tool_result' ? (
              <Icon className="w-4 h-4 text-blue-400" />
            ) : (
              <Bot className="w-4 h-4 text-[#8b949e]" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {step.tool && (
                <span className="text-xs font-medium text-[#8b949e] uppercase">
                  {TOOL_LABELS[step.tool] || step.tool}
                </span>
              )}
              {step.type === 'tool_result' && (
                isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-[#6e7681]" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-[#6e7681]" />
                )
              )}
            </div>

            <div
              className={`text-sm text-[#c9d1d9] ${
                step.type === 'tool_result' && !isExpanded ? 'line-clamp-1' : ''
              }`}
            >
              <ReactMarkdown
                components={{
                  code: ({ children }) => (
                    <code className="bg-[#21262d] px-1 py-0.5 rounded text-xs font-mono">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-[#21262d] p-2 rounded text-xs font-mono overflow-x-auto mt-1 max-h-40 overflow-y-auto">
                      {children}
                    </pre>
                  ),
                }}
              >
                {step.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#0d1117]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#21262d]">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <span className="font-semibold text-white">Agent Mode</span>
        <span className="text-xs text-[#8b949e] ml-auto">
          Works like Replit Agent
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        {steps.length === 0 ? (
          <div className="text-center text-[#8b949e] py-8">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              Describe what you want to build and the agent will read your code,
              make changes, and verify everything works.
            </p>
          </div>
        ) : (
          steps.map(renderStep)
        )}

        {isLoading && steps[steps.length - 1]?.type !== 'thinking' && (
          <div className="flex items-center gap-2 text-[#8b949e] text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-[#21262d]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell the agent what to build..."
            disabled={isLoading}
            className="flex-1 bg-[#21262d] border border-[#30363d] rounded-lg px-4 py-2 text-sm text-white placeholder-[#6e7681] focus:outline-none focus:border-[#58a6ff] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
