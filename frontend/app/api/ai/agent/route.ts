import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getOpenAITools, getAnthropicTools } from '@/lib/agent/tools';
import { executeTool, FileMap, ToolResult } from '@/lib/agent/handlers';
import { AGENT_SYSTEM_PROMPT, AGENT_CONTINUE_PROMPT } from '@/lib/agent/prompts';

const MAX_ITERATIONS = 15;
const MAX_TOKENS = 8192;

type Provider = 'openai' | 'anthropic';

interface ToolCallEvent {
  type: 'tool_call';
  tool: string;
  arguments: Record<string, any>;
}

interface ToolResultEvent {
  type: 'tool_result';
  tool: string;
  result: ToolResult;
}

interface TextEvent {
  type: 'text';
  content: string;
}

interface CompleteEvent {
  type: 'complete';
  files: FileMap;
  summary?: string;
}

interface ErrorEvent {
  type: 'error';
  message: string;
}

type StreamEvent = ToolCallEvent | ToolResultEvent | TextEvent | CompleteEvent | ErrorEvent;

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function callOpenAI(
  apiKey: string,
  model: string,
  messages: any[],
  tools: any[]
): Promise<{ content: string | null; tool_calls: any[] | null; error?: string }> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      tools,
      tool_choice: 'auto',
      max_completion_tokens: MAX_TOKENS,
      temperature: 0.1,
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { content: null, tool_calls: null, error: json?.error?.message || `OpenAI error (${res.status})` };
  }

  const choice = json?.choices?.[0];
  return {
    content: choice?.message?.content ?? null,
    tool_calls: choice?.message?.tool_calls ?? null,
  };
}

async function callAnthropic(
  apiKey: string,
  model: string,
  messages: any[],
  tools: any[]
): Promise<{ content: string | null; tool_calls: any[] | null; error?: string }> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_TOKENS,
      system: AGENT_SYSTEM_PROMPT,
      messages,
      tools,
      temperature: 0.1,
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { content: null, tool_calls: null, error: json?.error?.message || `Anthropic error (${res.status})` };
  }

  const blocks = json?.content ?? [];
  let textContent = '';
  const toolCalls: any[] = [];

  for (const block of blocks) {
    if (block.type === 'text') {
      textContent += block.text;
    } else if (block.type === 'tool_use') {
      toolCalls.push({
        id: block.id,
        name: block.name,
        arguments: block.input,
      });
    }
  }

  return {
    content: textContent || null,
    tool_calls: toolCalls.length > 0 ? toolCalls : null,
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    if (!supabase) return jsonError('Supabase is not configured', 500);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return jsonError('Unauthorized', 401);

    const body = await request.json();
    const message = (body.message ?? '').trim();
    if (!message) return jsonError('Missing message');

    let files: FileMap = body.currentFiles ?? {};
    const provider: Provider = body.provider === 'anthropic' ? 'anthropic' : 'openai';
    const model = (body.model ?? '').trim() || (provider === 'openai' ? 'gpt-4o' : 'claude-sonnet-4-20250514');

    const admin = createAdminClient();
    if (!admin) return jsonError('Server is missing SUPABASE_SERVICE_ROLE_KEY', 500);

    try {
      await admin.rpc('reset_daily_usage');
    } catch { }

    try {
      const { data: usageRows, error: usageErr } = await admin.rpc('get_user_usage', {
        p_user_id: user.id,
      });

      if (!usageErr && usageRows) {
        const usage = Array.isArray(usageRows) ? usageRows[0] : usageRows;
        const aiRequestsToday = Number(usage?.ai_requests_today ?? 0);
        const aiRequestsLimit = Number(usage?.ai_requests_limit ?? 0);

        if (aiRequestsLimit && aiRequestsToday >= aiRequestsLimit) {
          return jsonError('Daily AI limit reached. Please try again tomorrow.', 429);
        }
      }
    } catch {
      console.warn('Usage tracking not available');
    }

    const apiKey = provider === 'openai' ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return jsonError(`${provider.toUpperCase()}_API_KEY not configured`, 500);

    const tools = provider === 'openai' ? getOpenAITools() : getAnthropicTools();
    const events: StreamEvent[] = [];
    let isComplete = false;
    let completeSummary: string | undefined;

    const filesContext = Object.keys(files).length > 0
      ? `\n\nCurrent project files:\n${Object.keys(files).join('\n')}`
      : '\n\nThis is an empty project with no files yet.';

    const initialUserMessage = `${message}${filesContext}`;

    let messages: any[];
    if (provider === 'openai') {
      messages = [
        { role: 'system', content: AGENT_SYSTEM_PROMPT },
        { role: 'user', content: initialUserMessage },
      ];
    } else {
      messages = [
        { role: 'user', content: initialUserMessage },
      ];
    }

    const getFilesContext = () => {
      return Object.keys(files).length > 0
        ? `Current files: ${Object.keys(files).join(', ')}`
        : 'No files yet';
    };

    for (let iteration = 0; iteration < MAX_ITERATIONS && !isComplete; iteration++) {
      const response = provider === 'openai'
        ? await callOpenAI(apiKey, model, messages, tools)
        : await callAnthropic(apiKey, model, messages, tools);

      if (response.error) {
        events.push({ type: 'error', message: response.error });
        break;
      }

      if (response.content) {
        events.push({ type: 'text', content: response.content });
      }

      if (!response.tool_calls || response.tool_calls.length === 0) {
        isComplete = true;
        break;
      }

      const toolResults: any[] = [];

      for (const toolCall of response.tool_calls) {
        const toolName = toolCall.name || toolCall.function?.name;
        const toolArgs = toolCall.arguments || (toolCall.function?.arguments ? JSON.parse(toolCall.function.arguments) : {});
        const toolId = toolCall.id;

        events.push({
          type: 'tool_call',
          tool: toolName,
          arguments: toolArgs,
        });

        if (toolName === 'run_command') {
          const result: ToolResult = {
            success: true,
            result: 'Command execution is handled client-side. The command will be queued for execution.',
          };
          events.push({ type: 'tool_result', tool: toolName, result });
          toolResults.push({ toolId, toolName, result: JSON.stringify(result) });
        } else if (toolName === 'task_complete') {
          const result = executeTool(toolName, toolArgs, files);
          events.push({ type: 'tool_result', tool: toolName, result });
          isComplete = true;
          completeSummary = toolArgs.summary;
          toolResults.push({ toolId, toolName, result: JSON.stringify(result) });
        } else {
          const result = executeTool(toolName, toolArgs, files);
          events.push({ type: 'tool_result', tool: toolName, result });
          toolResults.push({ toolId, toolName, result: JSON.stringify(result) });
        }
      }

      if (provider === 'openai') {
        messages.push({
          role: 'assistant',
          content: response.content,
          tool_calls: response.tool_calls.map((tc: any) => ({
            id: tc.id,
            type: 'function',
            function: {
              name: tc.name || tc.function?.name,
              arguments: typeof tc.arguments === 'string' ? tc.arguments : JSON.stringify(tc.arguments || tc.function?.arguments),
            },
          })),
        });

        for (const tr of toolResults) {
          messages.push({
            role: 'tool',
            tool_call_id: tr.toolId,
            content: tr.result + `\n\n[${getFilesContext()}]`,
          });
        }
      } else {
        const assistantContent: any[] = [];
        if (response.content) {
          assistantContent.push({ type: 'text', text: response.content });
        }
        for (const tc of response.tool_calls) {
          assistantContent.push({
            type: 'tool_use',
            id: tc.id,
            name: tc.name,
            input: tc.arguments,
          });
        }
        messages.push({ role: 'assistant', content: assistantContent });

        const toolResultContent: any[] = [];
        for (const tr of toolResults) {
          toolResultContent.push({
            type: 'tool_result',
            tool_use_id: tr.toolId,
            content: tr.result + `\n\n[${getFilesContext()}]`,
          });
        }
        messages.push({ role: 'user', content: toolResultContent });
      }
    }

    try {
      await admin.rpc('increment_ai_requests', { p_user_id: user.id });
    } catch { }

    events.push({
      type: 'complete',
      files,
      summary: completeSummary,
    });

    const isFullstack = Boolean(
      files['server.js'] ||
      files['package.json'] ||
      Object.keys(files).some(f => f.startsWith('routes/') || f.startsWith('middleware/'))
    );

    return NextResponse.json({
      events,
      files,
      isFullstack,
      summary: completeSummary,
    });
  } catch (e: any) {
    console.error('Agent error:', e);
    return jsonError(e?.message || 'Unknown error', 500);
  }
}
