'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, KeyRound, AlertTriangle, Cpu, Zap, Brain, Sparkles } from 'lucide-react';
import type { AIProvider, AISettings, AIMode } from '@/lib/ai/settings';
import {
  DEFAULT_AI_SETTINGS,
  loadAISettings,
  saveAISettings,
  clearAISettings,
  AVAILABLE_MODELS,
  getDefaultModel
} from '@/lib/ai/settings';

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (settings: AISettings) => void;
};

export default function AISettingsModal({ open, onClose, onSaved }: Props) {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);

  useEffect(() => {
    if (open) setSettings(loadAISettings());
  }, [open]);

  const modelOptions = useMemo(() => AVAILABLE_MODELS[settings.provider] ?? [], [settings.provider]);

  if (!open) return null;

  const handleProviderChange = (provider: AIProvider) => {
    const nextModel = getDefaultModel(provider);
    setSettings((s) => ({ ...s, provider, model: nextModel }));
  };

  const currentModelInfo = modelOptions.find(m => m.value === settings.model);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      data-testid="ai-settings-modal"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-editor-border bg-editor-sidebar shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-editor-border p-4 sticky top-0 bg-editor-sidebar z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
              <Brain className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">AI Configuration</h2>
              <p className="text-xs text-gray-400">Configure your AI models and API keys</p>
            </div>
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

        <div className="p-5 space-y-6">
          {/* Mode Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-200 flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              AI Mode
            </label>
            <div className="grid grid-cols-2 gap-3" data-testid="ai-settings-mode-toggle">
              {([
                {
                  value: 'managed',
                  label: 'Managed',
                  help: 'Uses server-side API keys with usage limits',
                  icon: <Cpu className="h-4 w-4" />
                },
                {
                  value: 'byok',
                  label: 'BYOK (Bring Your Own Key)',
                  help: 'Use your own API keys stored locally',
                  icon: <KeyRound className="h-4 w-4" />
                },
              ] as { value: AIMode; label: string; help: string; icon: React.ReactNode }[]).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, mode: opt.value }))}
                  className={`rounded-xl border px-4 py-3 text-left transition-all ${
                    settings.mode === opt.value
                      ? 'border-purple-500 bg-purple-500/10 text-white ring-1 ring-purple-500/50'
                      : 'border-editor-border bg-editor-bg text-gray-200 hover:bg-white/5 hover:border-gray-600'
                  }`}
                  data-testid={`ai-settings-mode-${opt.value}`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    {opt.icon}
                    {opt.label}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{opt.help}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Provider Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-200 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-400" />
              AI Provider
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleProviderChange('anthropic')}
                className={`rounded-xl border px-4 py-3 text-left transition-all ${
                  settings.provider === 'anthropic'
                    ? 'border-orange-500 bg-orange-500/10 text-white ring-1 ring-orange-500/50'
                    : 'border-editor-border bg-editor-bg text-gray-200 hover:bg-white/5 hover:border-gray-600'
                }`}
                data-testid="ai-settings-provider-anthropic"
              >
                <div className="flex items-center gap-2 font-semibold">
                  <div className="w-6 h-6 rounded bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-bold">A</div>
                  Anthropic (Claude)
                </div>
                <div className="text-xs text-gray-400 mt-1">Claude Opus 4.5, Sonnet 4, and more</div>
              </button>
              <button
                type="button"
                onClick={() => handleProviderChange('openai')}
                className={`rounded-xl border px-4 py-3 text-left transition-all ${
                  settings.provider === 'openai'
                    ? 'border-green-500 bg-green-500/10 text-white ring-1 ring-green-500/50'
                    : 'border-editor-border bg-editor-bg text-gray-200 hover:bg-white/5 hover:border-gray-600'
                }`}
                data-testid="ai-settings-provider-openai"
              >
                <div className="flex items-center gap-2 font-semibold">
                  <div className="w-6 h-6 rounded bg-green-500/20 flex items-center justify-center text-green-400 text-xs font-bold">O</div>
                  OpenAI (GPT)
                </div>
                <div className="text-xs text-gray-400 mt-1">GPT-5.2, GPT-4.1, and more</div>
              </button>
            </div>
          </div>

          {/* Model Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-200">Model</label>
            <div className="space-y-2">
              {modelOptions.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, model: m.value }))}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${
                    settings.model === m.value
                      ? 'border-purple-500 bg-purple-500/10 text-white ring-1 ring-purple-500/50'
                      : 'border-editor-border bg-editor-bg text-gray-200 hover:bg-white/5 hover:border-gray-600'
                  }`}
                  data-testid={`ai-settings-model-${m.value}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{m.label}</span>
                    {m.value === settings.model && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">Selected</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{m.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* BYOK API Keys Section */}
          {settings.mode === 'byok' && (
            <div className="space-y-4 p-4 rounded-xl border border-editor-border bg-editor-bg/50">
              <div className="flex items-start gap-2 text-sm text-yellow-200 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 text-yellow-400" />
                <div>
                  <p className="font-semibold">Security Notice</p>
                  <p className="text-yellow-100/80 text-xs mt-1">
                    Your API keys are stored only in this browser's localStorage. They are never sent to our servers.
                  </p>
                </div>
              </div>

              {/* OpenAI API Key */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-300 flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-green-500/20 flex items-center justify-center text-green-400 text-xs font-bold">O</div>
                    OpenAI API Key
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    {showOpenAIKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showOpenAIKey ? 'text' : 'password'}
                  className="w-full rounded-lg bg-editor-bg border border-editor-border px-3 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                  placeholder="sk-..."
                  value={settings.openaiApiKey}
                  onChange={(e) => setSettings((s) => ({ ...s, openaiApiKey: e.target.value }))}
                  data-testid="ai-settings-openai-api-key-input"
                />
                <p className="text-xs text-gray-500">
                  Get your API key from{' '}
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">
                    platform.openai.com
                  </a>
                </p>
              </div>

              {/* Anthropic API Key */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-300 flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-bold">A</div>
                    Anthropic API Key
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    {showAnthropicKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showAnthropicKey ? 'text' : 'password'}
                  className="w-full rounded-lg bg-editor-bg border border-editor-border px-3 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                  placeholder="sk-ant-..."
                  value={settings.anthropicApiKey}
                  onChange={(e) => setSettings((s) => ({ ...s, anthropicApiKey: e.target.value }))}
                  data-testid="ai-settings-anthropic-api-key-input"
                />
                <p className="text-xs text-gray-500">
                  Get your API key from{' '}
                  <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">
                    console.anthropic.com
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* Current Configuration Summary */}
          <div className="rounded-xl border border-editor-border bg-editor-bg/30 p-4">
            <h3 className="text-sm font-medium text-gray-200 mb-3">Current Configuration</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Mode:</span>
                <span className="text-white ml-2">{settings.mode === 'managed' ? 'Managed' : 'BYOK'}</span>
              </div>
              <div>
                <span className="text-gray-500">Provider:</span>
                <span className="text-white ml-2 capitalize">{settings.provider}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Model:</span>
                <span className="text-white ml-2">{currentModelInfo?.label || settings.model}</span>
              </div>
              {settings.mode === 'byok' && (
                <>
                  <div>
                    <span className="text-gray-500">OpenAI Key:</span>
                    <span className={`ml-2 ${settings.openaiApiKey ? 'text-green-400' : 'text-gray-600'}`}>
                      {settings.openaiApiKey ? '✓ Configured' : 'Not set'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Anthropic Key:</span>
                    <span className={`ml-2 ${settings.anthropicApiKey ? 'text-orange-400' : 'text-gray-600'}`}>
                      {settings.anthropicApiKey ? '✓ Configured' : 'Not set'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-editor-border">
            <button
              onClick={() => {
                clearAISettings();
                setSettings(DEFAULT_AI_SETTINGS);
              }}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300 hover:bg-red-500/20 transition-colors"
              data-testid="ai-settings-clear-button"
            >
              Reset to Defaults
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="rounded-lg border border-editor-border bg-editor-bg px-4 py-2 text-sm text-gray-200 hover:bg-white/5 transition-colors"
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
                className="rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-2 text-sm font-semibold text-white hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg shadow-purple-500/25"
                data-testid="ai-settings-save-button"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
