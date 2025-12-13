export type AIProvider = 'openai' | 'anthropic';

export type AIMode = 'managed' | 'byok';

export type AISettings = {
  mode: AIMode;
  provider: AIProvider;
  apiKey: string;
  model: string;
  // Support separate API keys for each provider in BYOK mode
  openaiApiKey: string;
  anthropicApiKey: string;
};

export const AI_SETTINGS_STORAGE_KEY = 'finalcode:ai_settings_v2';

// Available models for each provider
export const AVAILABLE_MODELS = {
  openai: [
    { label: 'GPT-5.2 (Latest)', value: 'gpt-5.2', description: 'Most capable OpenAI model' },
    { label: 'GPT-4.1', value: 'gpt-4.1', description: 'Powerful reasoning model' },
    { label: 'GPT-4.1 Mini', value: 'gpt-4.1-mini', description: 'Fast and efficient' },
    { label: 'GPT-4o', value: 'gpt-4o', description: 'Optimized GPT-4' },
  ],
  anthropic: [
    { label: 'Claude Opus 4.5 (Latest)', value: 'claude-opus-4-5-20251101', description: 'Most capable Claude model' },
    { label: 'Claude Sonnet 4', value: 'claude-sonnet-4-20250514', description: 'Balanced performance' },
    { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-latest', description: 'Fast and capable' },
    { label: 'Claude 3.5 Haiku', value: 'claude-3-5-haiku-latest', description: 'Fastest Claude model' },
  ],
} as const;

export const DEFAULT_AI_SETTINGS: AISettings = {
  mode: 'managed',
  provider: 'anthropic',
  apiKey: '',
  model: 'claude-opus-4-5-20251101',
  openaiApiKey: '',
  anthropicApiKey: '',
};

export function loadAISettings(): AISettings {
  if (typeof window === 'undefined') return DEFAULT_AI_SETTINGS;
  try {
    // Try to load from new storage key first, then fall back to old key
    let raw = window.localStorage.getItem(AI_SETTINGS_STORAGE_KEY);
    if (!raw) {
      // Try old storage key for migration
      raw = window.localStorage.getItem('finalcode:ai_settings_v1');
    }
    if (!raw) return DEFAULT_AI_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AISettings>;

    const provider = parsed.provider === 'anthropic' ? 'anthropic' : 'openai';
    const openaiApiKey = typeof parsed.openaiApiKey === 'string' ? parsed.openaiApiKey : '';
    const anthropicApiKey = typeof parsed.anthropicApiKey === 'string' ? parsed.anthropicApiKey : '';

    // Legacy support: migrate old apiKey to provider-specific keys
    const legacyApiKey = typeof parsed.apiKey === 'string' ? parsed.apiKey : '';

    return {
      mode: parsed.mode === 'byok' ? 'byok' : 'managed',
      provider,
      apiKey: legacyApiKey,
      model: typeof parsed.model === 'string' && parsed.model.length ? parsed.model : DEFAULT_AI_SETTINGS.model,
      openaiApiKey: openaiApiKey || (provider === 'openai' ? legacyApiKey : ''),
      anthropicApiKey: anthropicApiKey || (provider === 'anthropic' ? legacyApiKey : ''),
    };
  } catch {
    return DEFAULT_AI_SETTINGS;
  }
}

export function saveAISettings(settings: AISettings) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AI_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function clearAISettings() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AI_SETTINGS_STORAGE_KEY);
  // Also clear old storage key
  window.localStorage.removeItem('finalcode:ai_settings_v1');
}

// Helper to get the current API key based on selected provider
export function getActiveApiKey(settings: AISettings): string {
  if (settings.provider === 'openai') {
    return settings.openaiApiKey || settings.apiKey || '';
  }
  return settings.anthropicApiKey || settings.apiKey || '';
}

// Helper to get default model for a provider
export function getDefaultModel(provider: AIProvider): string {
  return AVAILABLE_MODELS[provider][0].value;
}
