export type AIProvider = 'openai' | 'anthropic' | 'deepseek' | 'groq';

export type AIMode = 'managed' | 'byok';

export type AISettings = {
  mode: AIMode;
  provider: AIProvider;
  apiKey: string;
  model: string;
  openaiApiKey: string;
  anthropicApiKey: string;
  deepseekApiKey: string;
  groqApiKey: string;
};

export const AI_SETTINGS_STORAGE_KEY = 'finalcode:ai_settings_v3';

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
  deepseek: [
    { label: 'DeepSeek-V3 (Latest)', value: 'deepseek-chat', description: 'Most capable, GPT-4 level at 10x lower cost' },
    { label: 'DeepSeek Coder', value: 'deepseek-coder', description: 'Optimized for code generation' },
    { label: 'DeepSeek Reasoner', value: 'deepseek-reasoner', description: 'Advanced reasoning with chain-of-thought' },
  ],
  groq: [
    { label: 'Llama 3.3 70B', value: 'llama-3.3-70b-versatile', description: 'Most capable Llama model' },
    { label: 'Llama 3.1 8B', value: 'llama-3.1-8b-instant', description: 'Ultra-fast responses' },
    { label: 'Mixtral 8x7B', value: 'mixtral-8x7b-32768', description: 'Strong coding, 32K context' },
    { label: 'Gemma 2 9B', value: 'gemma2-9b-it', description: 'Google open model, efficient' },
  ],
} as const;

export const DEFAULT_AI_SETTINGS: AISettings = {
  mode: 'managed',
  provider: 'anthropic',
  apiKey: '',
  model: 'claude-opus-4-5-20251101',
  openaiApiKey: '',
  anthropicApiKey: '',
  deepseekApiKey: '',
  groqApiKey: '',
};

export function loadAISettings(): AISettings {
  if (typeof window === 'undefined') return DEFAULT_AI_SETTINGS;
  try {
    let raw = window.localStorage.getItem(AI_SETTINGS_STORAGE_KEY);
    if (!raw) {
      raw = window.localStorage.getItem('finalcode:ai_settings_v2');
    }
    if (!raw) {
      raw = window.localStorage.getItem('finalcode:ai_settings_v1');
    }
    if (!raw) return DEFAULT_AI_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AISettings>;

    const validProviders: AIProvider[] = ['openai', 'anthropic', 'deepseek', 'groq'];
    const provider: AIProvider = validProviders.includes(parsed.provider as AIProvider) 
      ? (parsed.provider as AIProvider) 
      : 'anthropic';

    const openaiApiKey = typeof parsed.openaiApiKey === 'string' ? parsed.openaiApiKey : '';
    const anthropicApiKey = typeof parsed.anthropicApiKey === 'string' ? parsed.anthropicApiKey : '';
    const deepseekApiKey = typeof parsed.deepseekApiKey === 'string' ? parsed.deepseekApiKey : '';
    const groqApiKey = typeof parsed.groqApiKey === 'string' ? parsed.groqApiKey : '';
    const legacyApiKey = typeof parsed.apiKey === 'string' ? parsed.apiKey : '';

    return {
      mode: parsed.mode === 'byok' ? 'byok' : 'managed',
      provider,
      apiKey: legacyApiKey,
      model: typeof parsed.model === 'string' && parsed.model.length ? parsed.model : getDefaultModel(provider),
      openaiApiKey: openaiApiKey || (provider === 'openai' ? legacyApiKey : ''),
      anthropicApiKey: anthropicApiKey || (provider === 'anthropic' ? legacyApiKey : ''),
      deepseekApiKey,
      groqApiKey,
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

export function getActiveApiKey(settings: AISettings): string {
  switch (settings.provider) {
    case 'openai':
      return settings.openaiApiKey || settings.apiKey || '';
    case 'anthropic':
      return settings.anthropicApiKey || settings.apiKey || '';
    case 'deepseek':
      return settings.deepseekApiKey || '';
    case 'groq':
      return settings.groqApiKey || '';
    default:
      return '';
  }
}

// Helper to get default model for a provider
export function getDefaultModel(provider: AIProvider): string {
  return AVAILABLE_MODELS[provider][0].value;
}
