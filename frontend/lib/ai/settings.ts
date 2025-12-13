export type AIProvider = 'openai' | 'anthropic';

export type AIMode = 'managed' | 'byok';

export type AISettings = {
  mode: AIMode;
  provider: AIProvider;
  apiKey: string;
  model: string;
};

export const AI_SETTINGS_STORAGE_KEY = 'finalcode:ai_settings_v1';

export const DEFAULT_AI_SETTINGS: AISettings = {
  mode: 'managed',
  provider: 'openai',
  apiKey: '',
  model: 'gpt-4.1-mini',
};

export function loadAISettings(): AISettings {
  if (typeof window === 'undefined') return DEFAULT_AI_SETTINGS;
  try {
    const raw = window.localStorage.getItem(AI_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_AI_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AISettings>;
    return {
      mode: parsed.mode === 'byok' ? 'byok' : 'managed',
      provider: parsed.provider === 'anthropic' ? 'anthropic' : 'openai',
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
      model: typeof parsed.model === 'string' && parsed.model.length ? parsed.model : DEFAULT_AI_SETTINGS.model,
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
}
