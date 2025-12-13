'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, KeyRound, AlertTriangle } from 'lucide-react';
import type { AIProvider, AISettings, AIMode } from '@/lib/ai/settings';
import { DEFAULT_AI_SETTINGS, loadAISettings, saveAISettings, clearAISettings } from '@/lib/ai/settings';

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (settings: AISettings) => void;
};

const PROVIDER_MODELS: Record<AIProvider, { label: string; value: string }[]> = {
  openai: [
    { label: 'GPT-4.1 mini (default)', value: 'gpt-4.1-mini' },
    { label: 'GPT-4.1', value: 'gpt-4.1' },
  ],
  anthropic: [
    { label: 'Claude 3.5 Sonnet (latest)', value: 'claude-3-5-sonnet-latest' },
    { label: 'Claude 3.5 Haiku (latest)', value: 'claude-3-5-haiku-latest' },
  ],
};

export default function AISettingsModal({ open, onClose, onSaved }: Props) {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);

  useEffect(() => {
    if (open) setSettings(loadAISettings());
  }, [open]);

  const modelOptions = useMemo(() => PROVIDER_MODELS[settings.provider] ?? [], [settings.provider]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      data-testid="ai-settings-modal"
    >
      <div className="w-full max-w-xl rounded-2xl border border-editor-border bg-editor-sidebar shadow-2xl">
        <div className="flex items-center justify-between border-b border-editor-border p-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">AI Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white"
            data-testid="ai-settings-close-button"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm text-yellow-200 flex gap-2" data-testid="ai-settings-warning">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Security notice</p>
              <p className="text-yellow-100/90">
                Managed AI uses our server-side keys. BYOK stores your key only in your browser (localStorage) and never in Supabase.
              </p>
            </div>
          </div>


          <label className="block space-y-2">
            <span className="text-sm text-gray-300">Mode</span>
            <div className="grid grid-cols-2 gap-2" data-testid="ai-settings-mode-toggle">
              {([
                { value: 'managed', label: 'Managed (default)', help: 'Uses server-side keys and per-user caps' },
                { value: 'byok', label: 'BYOK', help: 'Uses your browser-stored key' },
              ] as { value: AIMode; label: string; help: string }[]).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, mode: opt.value }))}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    settings.mode === opt.value
                      ? 'border-purple-500 bg-purple-500/10 text-white'
                      : 'border-editor-border bg-editor-bg text-gray-200 hover:bg-white/5'
                  }`}
                  data-testid={`ai-settings-mode-${opt.value}`}
                >
                  <div className="font-semibold">{opt.label}</div>
                  <div className="text-xs text-gray-400">{opt.help}</div>
                </button>
              ))}
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-gray-300">Provider</span>
            <select
              className="w-full rounded-lg bg-editor-bg border border-editor-border px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={settings.provider}
              onChange={(e) => {
                const provider = e.target.value as AIProvider;
                const nextModel = PROVIDER_MODELS[provider]?.[0]?.value || settings.model;
                setSettings((s) => ({ ...s, provider, model: nextModel }));
              }}
              data-testid="ai-settings-provider-select"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-gray-300">Model</span>
            <select
              className="w-full rounded-lg bg-editor-bg border border-editor-border px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={settings.model}
              onChange={(e) => setSettings((s) => ({ ...s, model: e.target.value }))}
              data-testid="ai-settings-model-select"
            >
              {modelOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
              <option value={settings.model}>Custom: {settings.model}</option>
            </select>
            <p className="text-xs text-gray-500">
              You can paste a custom model name by editing the value in localStorage if needed.
            </p>
          </label>

          {settings.mode === 'byok' && (
            <label className="block space-y-2">
              <span className="text-sm text-gray-300">API Key (stored only in this browser)</span>
              <input
                type="password"
                className="w-full rounded-lg bg-editor-bg border border-editor-border px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder={settings.provider === 'openai' ? 'sk-...' : 'sk-ant-...'}
                value={settings.apiKey}
                onChange={(e) => setSettings((s) => ({ ...s, apiKey: e.target.value }))}
                data-testid="ai-settings-api-key-input"
              />
            </label>
          )}

          <div className="flex items-center justify-between gap-2 pt-2">
            <button
              onClick={() => {
                clearAISettings();
                setSettings(DEFAULT_AI_SETTINGS);
              }}
              className="rounded-lg border border-editor-border bg-editor-bg px-3 py-2 text-sm text-gray-200 hover:bg-white/5"
              data-testid="ai-settings-clear-button"
            >
              Clear
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="rounded-lg border border-editor-border bg-editor-bg px-3 py-2 text-sm text-gray-200 hover:bg-white/5"
                data-testid="ai-settings-cancel-button"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  saveAISettings(settings);
                  onSaved(settings);
                  onClose();
                }}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
                data-testid="ai-settings-save-button"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
