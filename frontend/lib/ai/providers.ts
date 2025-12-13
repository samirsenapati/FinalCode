import type { AISettings } from '@/lib/ai/settings';

export type AIMessage = { role: 'user' | 'assistant' | 'system'; content: string };

export class AIClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIClientError';
  }
}

export async function generateAIResponse(params: {
  settings: AISettings;
  systemPrompt: string;
  userPrompt: string;
}): Promise<string> {
  const { settings, systemPrompt, userPrompt } = params;

  if (!settings.apiKey?.trim()) {
    throw new AIClientError('Missing API key. Open AI Settings to add one.');
  }

  if (settings.provider === 'openai') {
    return generateOpenAIResponse({
      apiKey: settings.apiKey,
      model: settings.model || 'gpt-4.1-mini',
      systemPrompt,
      userPrompt,
    });
  }

  return generateAnthropicResponse({
    apiKey: settings.apiKey,
    model: settings.model || 'claude-3-5-sonnet-latest',
    systemPrompt,
    userPrompt,
  });
}

async function generateOpenAIResponse(params: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
}): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      model: params.model,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userPrompt },
      ],
      temperature: 0.2,
    }),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = json?.error?.message || `OpenAI request failed (${res.status})`;
    throw new AIClientError(msg);
  }

  const text = json?.choices?.[0]?.message?.content;
  if (!text) throw new AIClientError('OpenAI returned an empty response.');
  return text;
}

async function generateAnthropicResponse(params: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
}): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': params.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: params.model,
      max_tokens: 4096,
      system: params.systemPrompt,
      messages: [{ role: 'user', content: params.userPrompt }],
      temperature: 0.2,
    }),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = json?.error?.message || `Anthropic request failed (${res.status})`;
    throw new AIClientError(msg);
  }

  // Anthropic: content is array of blocks; take first text
  const blocks = json?.content;
  const text = Array.isArray(blocks) ? blocks.find((b: any) => b?.type === 'text')?.text : null;
  if (!text) throw new AIClientError('Anthropic returned an empty response.');
  return text;
}
