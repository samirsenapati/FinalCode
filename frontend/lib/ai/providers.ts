import type { AISettings } from '@/lib/ai/settings';
import { getActiveApiKey } from '@/lib/ai/settings';

export type AIMessage = { role: 'user' | 'assistant' | 'system'; content: string };

export class AIClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIClientError';
  }
}

// Model-specific configurations for optimal performance
const MODEL_CONFIGS: Record<string, { maxTokens: number; temperature?: number }> = {
  // OpenAI models
  'gpt-5.2': { maxTokens: 16384, temperature: 0.2 },
  'gpt-4.1': { maxTokens: 8192, temperature: 0.2 },
  'gpt-4.1-mini': { maxTokens: 4096, temperature: 0.2 },
  'gpt-4o': { maxTokens: 8192, temperature: 0.2 },
  // Anthropic models
  'claude-opus-4-5-20251101': { maxTokens: 16384, temperature: 0.2 },
  'claude-sonnet-4-20250514': { maxTokens: 8192, temperature: 0.2 },
  'claude-3-5-sonnet-latest': { maxTokens: 8192, temperature: 0.2 },
  'claude-3-5-haiku-latest': { maxTokens: 4096, temperature: 0.2 },
};

function getModelConfig(model: string): { maxTokens: number; temperature: number } {
  const config = MODEL_CONFIGS[model];
  return {
    maxTokens: config?.maxTokens ?? 4096,
    temperature: config?.temperature ?? 0.2,
  };
}

export async function generateAIResponse(params: {
  settings: AISettings;
  systemPrompt: string;
  userPrompt: string;
}): Promise<string> {
  const { settings, systemPrompt, userPrompt } = params;

  // Get the appropriate API key based on the selected provider
  const apiKey = getActiveApiKey(settings);

  if (!apiKey?.trim()) {
    const providerName = settings.provider === 'openai' ? 'OpenAI' : 'Anthropic';
    throw new AIClientError(`Missing ${providerName} API key. Open AI Settings to add one.`);
  }

  if (settings.provider === 'openai') {
    return generateOpenAIResponse({
      apiKey,
      model: settings.model || 'gpt-5.2',
      systemPrompt,
      userPrompt,
    });
  }

  return generateAnthropicResponse({
    apiKey,
    model: settings.model || 'claude-opus-4-5-20251101',
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
  const config = getModelConfig(params.model);

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
      temperature: config.temperature,
      max_tokens: config.maxTokens,
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
  const config = getModelConfig(params.model);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': params.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: params.model,
      max_tokens: config.maxTokens,
      system: params.systemPrompt,
      messages: [{ role: 'user', content: params.userPrompt }],
      temperature: config.temperature,
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
