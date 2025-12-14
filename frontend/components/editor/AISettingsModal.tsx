'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, KeyRound, AlertTriangle, Cpu, Zap, Brain, Sparkles, Check, Star, Gauge, Clock } from 'lucide-react';
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

const MODEL_RATINGS: Record<string, { capability: number; speed: number; cost: 'low' | 'medium' | 'high' }> = {
  'gpt-5.2': { capability: 5, speed: 3, cost: 'high' },
  'gpt-4.1': { capability: 4, speed: 3, cost: 'high' },
  'gpt-4.1-mini': { capability: 3, speed: 5, cost: 'low' },
  'gpt-4o': { capability: 4, speed: 4, cost: 'medium' },
  'claude-opus-4-5-20251101': { capability: 5, speed: 3, cost: 'high' },
  'claude-sonnet-4-20250514': { capability: 4, speed: 4, cost: 'medium' },
  'claude-3-5-sonnet-latest': { capability: 4, speed: 4, cost: 'medium' },
  'claude-3-5-haiku-latest': { capability: 3, speed: 5, cost: 'low' },
};

const COST_COLORS = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-red-400',
};

const COST_LABELS = {
  low: '$',
  medium: '$$',
  high: '$$$',
};

function RatingDots({ value, max = 5, color = 'purple' }: { value: number; max?: number; color?: string }) {
  const colorClasses: Record<string, string> = {
    purple: 'bg-purple-400',
    blue: 'bg-blue-400',
    green: 'bg-green-400',
    yellow: 'bg-yellow-400',
  };
  
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            i < value ? colorClasses[color] : 'bg-gray-700'
          }`}
        />
      ))}
    </div>
  );
}

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

  const handleSave = () => {
    saveAISettings(settings);
    onSaved(settings);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      data-testid="ai-settings-modal"
    >
      <div className="w-full max-w-3xl rounded-2xl border border-editor-border bg-[#0d1117] shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-editor-border p-5 sticky top-0 bg-[#0d1117] z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30">
              <Brain className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Settings</h2>
              <p className="text-sm text-gray-400">Choose your AI provider and model</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
            data-testid="ai-settings-close-button"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Quick Provider Switch - Large Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                Select AI Provider
              </label>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                settings.mode === 'managed'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}>
                {settings.mode === 'managed' ? 'Managed Mode' : 'Your Own Keys'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Anthropic Card */}
              <button
                type="button"
                onClick={() => handleProviderChange('anthropic')}
                className={`relative rounded-2xl border-2 p-5 text-left transition-all group ${
                  settings.provider === 'anthropic'
                    ? 'border-orange-500 bg-gradient-to-br from-orange-500/10 to-orange-600/5 shadow-lg shadow-orange-500/10'
                    : 'border-gray-700 bg-[#161b22] hover:border-gray-600 hover:bg-[#1c2128]'
                }`}
                data-testid="ai-settings-provider-anthropic"
              >
                {settings.provider === 'anthropic' && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    A
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg">Anthropic</div>
                    <div className="text-sm text-orange-400">Claude Models</div>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  Best for complex reasoning, code generation, and nuanced responses
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3" /> Claude Opus 4.5
                  </span>
                  <span className="flex items-center gap-1">
                    <Gauge className="w-3 h-3" /> 4 models
                  </span>
                </div>
              </button>

              {/* OpenAI Card */}
              <button
                type="button"
                onClick={() => handleProviderChange('openai')}
                className={`relative rounded-2xl border-2 p-5 text-left transition-all group ${
                  settings.provider === 'openai'
                    ? 'border-green-500 bg-gradient-to-br from-green-500/10 to-green-600/5 shadow-lg shadow-green-500/10'
                    : 'border-gray-700 bg-[#161b22] hover:border-gray-600 hover:bg-[#1c2128]'
                }`}
                data-testid="ai-settings-provider-openai"
              >
                {settings.provider === 'openai' && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    O
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg">OpenAI</div>
                    <div className="text-sm text-green-400">GPT Models</div>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  Excellent for general tasks, fast responses, and broad knowledge
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3" /> GPT-5.2
                  </span>
                  <span className="flex items-center gap-1">
                    <Gauge className="w-3 h-3" /> 4 models
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Model Selection with Ratings */}
          <div className="space-y-4">
            <label className="text-sm font-semibold text-white flex items-center gap-2">
              <Cpu className="h-4 w-4 text-blue-400" />
              Choose Model
            </label>
            <div className="grid gap-3">
              {modelOptions.map((m) => {
                const rating = MODEL_RATINGS[m.value] || { capability: 3, speed: 3, cost: 'medium' };
                const isSelected = settings.model === m.value;
                const providerColor = settings.provider === 'anthropic' ? 'orange' : 'green';
                
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, model: m.value }))}
                    className={`relative rounded-xl border-2 px-5 py-4 text-left transition-all ${
                      isSelected
                        ? `border-${providerColor}-500 bg-${providerColor}-500/10`
                        : 'border-gray-700 bg-[#161b22] hover:border-gray-600 hover:bg-[#1c2128]'
                    }`}
                    style={{
                      borderColor: isSelected ? (settings.provider === 'anthropic' ? '#f97316' : '#22c55e') : undefined,
                      background: isSelected ? (settings.provider === 'anthropic' ? 'rgba(249, 115, 22, 0.1)' : 'rgba(34, 197, 94, 0.1)') : undefined,
                    }}
                    data-testid={`ai-settings-model-${m.value}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold text-white">{m.label}</span>
                          {m.value.includes('opus') || m.value.includes('5.2') ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                              FLAGSHIP
                            </span>
                          ) : m.value.includes('haiku') || m.value.includes('mini') ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              FAST
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm text-gray-400">{m.description}</p>
                        
                        {/* Rating Bars */}
                        <div className="flex items-center gap-6 mt-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-16">Capability</span>
                            <RatingDots value={rating.capability} color="purple" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-10">Speed</span>
                            <RatingDots value={rating.speed} color="blue" />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">Cost</span>
                            <span className={`text-xs font-bold ${COST_COLORS[rating.cost]}`}>
                              {COST_LABELS[rating.cost]}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: settings.provider === 'anthropic' ? '#f97316' : '#22c55e' }}
                        >
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="space-y-4">
            <label className="text-sm font-semibold text-white flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-yellow-400" />
              API Key Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSettings((s) => ({ ...s, mode: 'managed' }))}
                className={`rounded-xl border-2 px-4 py-3 text-left transition-all ${
                  settings.mode === 'managed'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-700 bg-[#161b22] hover:border-gray-600'
                }`}
                data-testid="ai-settings-mode-managed"
              >
                <div className="flex items-center gap-2 font-semibold text-white">
                  <Cpu className="h-4 w-4 text-purple-400" />
                  Managed
                  {settings.mode === 'managed' && <Check className="w-4 h-4 text-purple-400 ml-auto" />}
                </div>
                <p className="text-xs text-gray-400 mt-1">Use our API keys (with usage limits)</p>
              </button>
              <button
                type="button"
                onClick={() => setSettings((s) => ({ ...s, mode: 'byok' }))}
                className={`rounded-xl border-2 px-4 py-3 text-left transition-all ${
                  settings.mode === 'byok'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 bg-[#161b22] hover:border-gray-600'
                }`}
                data-testid="ai-settings-mode-byok"
              >
                <div className="flex items-center gap-2 font-semibold text-white">
                  <KeyRound className="h-4 w-4 text-blue-400" />
                  Your Own Keys
                  {settings.mode === 'byok' && <Check className="w-4 h-4 text-blue-400 ml-auto" />}
                </div>
                <p className="text-xs text-gray-400 mt-1">Use your own API keys (no limits)</p>
              </button>
            </div>
          </div>

          {/* BYOK API Keys Section */}
          {settings.mode === 'byok' && (
            <div className="space-y-4 p-5 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
              <div className="flex items-start gap-3 text-sm">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-400" />
                <div>
                  <p className="font-semibold text-yellow-200">Your keys stay private</p>
                  <p className="text-yellow-100/70 text-xs mt-1">
                    Keys are stored only in your browser's localStorage and never sent to our servers.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                {/* OpenAI API Key */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-300 flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-green-500/20 flex items-center justify-center text-green-400 text-xs font-bold">O</div>
                      OpenAI API Key
                      {settings.openaiApiKey && <Check className="w-4 h-4 text-green-400" />}
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
                    className="w-full rounded-lg bg-[#0d1117] border border-gray-700 px-3 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                    placeholder="sk-..."
                    value={settings.openaiApiKey}
                    onChange={(e) => setSettings((s) => ({ ...s, openaiApiKey: e.target.value }))}
                    data-testid="ai-settings-openai-api-key-input"
                  />
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-xs text-green-400 hover:underline inline-flex items-center gap-1">
                    Get your OpenAI API key →
                  </a>
                </div>

                {/* Anthropic API Key */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-300 flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-bold">A</div>
                      Anthropic API Key
                      {settings.anthropicApiKey && <Check className="w-4 h-4 text-orange-400" />}
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
                    className="w-full rounded-lg bg-[#0d1117] border border-gray-700 px-3 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
                    placeholder="sk-ant-..."
                    value={settings.anthropicApiKey}
                    onChange={(e) => setSettings((s) => ({ ...s, anthropicApiKey: e.target.value }))}
                    data-testid="ai-settings-anthropic-api-key-input"
                  />
                  <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-xs text-orange-400 hover:underline inline-flex items-center gap-1">
                    Get your Anthropic API key →
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-800">
            <button
              onClick={() => {
                clearAISettings();
                setSettings(DEFAULT_AI_SETTINGS);
              }}
              className="rounded-lg px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              data-testid="ai-settings-clear-button"
            >
              Reset to Defaults
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="rounded-lg border border-gray-700 bg-transparent px-5 py-2.5 text-sm text-gray-200 hover:bg-white/5 transition-colors"
                data-testid="ai-settings-cancel-button"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-500/25"
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
