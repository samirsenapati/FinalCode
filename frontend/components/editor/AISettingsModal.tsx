'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, KeyRound, AlertTriangle, Cpu, Brain, Sparkles, Check, Star, Gauge, ChevronDown, ChevronUp, CheckCircle2, ExternalLink, Info } from 'lucide-react';
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

const MODEL_RATINGS: Record<string, { capability: number; speed: number; cost: 'low' | 'medium' | 'high'; costEstimate: string }> = {
  'gpt-5.2': { capability: 5, speed: 3, cost: 'high', costEstimate: '~$0.05' },
  'gpt-4.1': { capability: 4, speed: 3, cost: 'high', costEstimate: '~$0.03' },
  'gpt-4.1-mini': { capability: 3, speed: 5, cost: 'low', costEstimate: '~$0.001' },
  'gpt-4o': { capability: 4, speed: 4, cost: 'medium', costEstimate: '~$0.02' },
  'claude-opus-4-5-20251101': { capability: 5, speed: 3, cost: 'high', costEstimate: '~$0.05' },
  'claude-sonnet-4-20250514': { capability: 4, speed: 4, cost: 'medium', costEstimate: '~$0.02' },
  'claude-3-5-sonnet-latest': { capability: 4, speed: 4, cost: 'medium', costEstimate: '~$0.015' },
  'claude-3-5-haiku-latest': { capability: 3, speed: 5, cost: 'low', costEstimate: '~$0.002' },
  'deepseek-chat': { capability: 4, speed: 4, cost: 'low', costEstimate: '~$0.002' },
  'deepseek-coder': { capability: 4, speed: 4, cost: 'low', costEstimate: '~$0.002' },
  'deepseek-reasoner': { capability: 5, speed: 3, cost: 'low', costEstimate: '~$0.005' },
  'llama-3.3-70b-versatile': { capability: 4, speed: 5, cost: 'low', costEstimate: '~$0.003' },
  'llama-3.1-8b-instant': { capability: 3, speed: 5, cost: 'low', costEstimate: '~$0.0005' },
  'mixtral-8x7b-32768': { capability: 4, speed: 5, cost: 'low', costEstimate: '~$0.002' },
  'gemma2-9b-it': { capability: 3, speed: 5, cost: 'low', costEstimate: '~$0.001' },
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

function SetupGuide({ provider, expanded, onToggle }: { provider: 'openai' | 'anthropic' | 'deepseek' | 'groq'; expanded: boolean; onToggle: () => void }) {
  const providerConfig: Record<string, { steps: { text: string; link?: string }[]; note: string; colorClass: string; bgClass: string; borderClass: string }> = {
    openai: {
      steps: [
        { text: 'Go to platform.openai.com/api-keys', link: 'https://platform.openai.com/api-keys' },
        { text: 'Click "Create new secret key"' },
        { text: 'Give it a name (e.g., "FinalCode")' },
        { text: 'Copy the key and paste below' },
      ],
      note: "You'll need at least $5 in API credits. Pay-as-you-go billing.",
      colorClass: 'text-green-400 hover:text-green-300',
      bgClass: 'bg-green-500/5 border-green-500/20',
      borderClass: 'border-green-500/20 text-green-300/70',
    },
    anthropic: {
      steps: [
        { text: 'Go to console.anthropic.com/settings/keys', link: 'https://console.anthropic.com/settings/keys' },
        { text: 'Click "Create Key"' },
        { text: 'Name it (e.g., "FinalCode")' },
        { text: 'Copy the key and paste below' },
      ],
      note: "Requires billing setup at console.anthropic.com",
      colorClass: 'text-orange-400 hover:text-orange-300',
      bgClass: 'bg-orange-500/5 border-orange-500/20',
      borderClass: 'border-orange-500/20 text-orange-300/70',
    },
    deepseek: {
      steps: [
        { text: 'Go to platform.deepseek.com', link: 'https://platform.deepseek.com' },
        { text: 'Sign up or log in to your account' },
        { text: 'Go to API Keys section' },
        { text: 'Create a new API key and copy it below' },
      ],
      note: "DeepSeek offers very low pricing. $5 credit gets you far.",
      colorClass: 'text-blue-400 hover:text-blue-300',
      bgClass: 'bg-blue-500/5 border-blue-500/20',
      borderClass: 'border-blue-500/20 text-blue-300/70',
    },
    groq: {
      steps: [
        { text: 'Go to console.groq.com', link: 'https://console.groq.com' },
        { text: 'Sign up or log in to your account' },
        { text: 'Navigate to API Keys' },
        { text: 'Create a new API key and copy it below' },
      ],
      note: "Groq offers a generous free tier with rate limits.",
      colorClass: 'text-purple-400 hover:text-purple-300',
      bgClass: 'bg-purple-500/5 border-purple-500/20',
      borderClass: 'border-purple-500/20 text-purple-300/70',
    },
  };

  const config = providerConfig[provider];
  const stepBgClass = provider === 'openai' ? 'bg-green-500/20 text-green-400' 
    : provider === 'anthropic' ? 'bg-orange-500/20 text-orange-400'
    : provider === 'deepseek' ? 'bg-blue-500/20 text-blue-400'
    : 'bg-purple-500/20 text-purple-400';
  const linkClass = provider === 'openai' ? 'text-green-400' 
    : provider === 'anthropic' ? 'text-orange-400'
    : provider === 'deepseek' ? 'text-blue-400'
    : 'text-purple-400';

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={onToggle}
        className={`flex items-center gap-2 text-xs font-medium transition-colors ${config.colorClass}`}
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        How to get your API key
      </button>
      
      {expanded && (
        <div className={`mt-3 p-4 rounded-lg border ${config.bgClass}`}>
          <ol className="space-y-2.5">
            {config.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${stepBgClass}`}>
                  {i + 1}
                </span>
                {step.link ? (
                  <a 
                    href={step.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 hover:underline ${linkClass}`}
                  >
                    {step.text}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span>{step.text}</span>
                )}
              </li>
            ))}
          </ol>
          <div className={`mt-3 pt-3 border-t flex items-start gap-2 text-xs ${config.borderClass}`}>
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{config.note}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function isValidKeyFormat(provider: 'openai' | 'anthropic' | 'deepseek' | 'groq', key: string): { valid: boolean; message: string } {
  if (!key) return { valid: false, message: '' };
  
  if (provider === 'openai') {
    if (key.startsWith('sk-') && key.length > 20) {
      return { valid: true, message: 'Format looks correct' };
    }
    return { valid: false, message: 'Should start with "sk-"' };
  }
  
  if (provider === 'anthropic') {
    if (key.startsWith('sk-ant-') && key.length > 20) {
      return { valid: true, message: 'Format looks correct' };
    }
    return { valid: false, message: 'Should start with "sk-ant-"' };
  }
  
  if (provider === 'deepseek') {
    if (key.startsWith('sk-') && key.length > 20) {
      return { valid: true, message: 'Format looks correct' };
    }
    return { valid: false, message: 'Should start with "sk-"' };
  }
  
  if (provider === 'groq') {
    if (key.startsWith('gsk_') && key.length > 20) {
      return { valid: true, message: 'Format looks correct' };
    }
    return { valid: false, message: 'Should start with "gsk_"' };
  }
  
  return { valid: false, message: '' };
}

export default function AISettingsModal({ open, onClose, onSaved }: Props) {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [showDeepSeekKey, setShowDeepSeekKey] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [openAIGuideExpanded, setOpenAIGuideExpanded] = useState(false);
  const [anthropicGuideExpanded, setAnthropicGuideExpanded] = useState(false);
  const [deepseekGuideExpanded, setDeepseekGuideExpanded] = useState(false);
  const [groqGuideExpanded, setGroqGuideExpanded] = useState(false);

  useEffect(() => {
    if (open) {
      setSettings(loadAISettings());
    }
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

  const getKeyFormatUI = (provider: 'openai' | 'anthropic' | 'deepseek' | 'groq') => {
    const keyMap: Record<string, string> = {
      openai: settings.openaiApiKey,
      anthropic: settings.anthropicApiKey,
      deepseek: settings.deepseekApiKey,
      groq: settings.groqApiKey,
    };
    const key = keyMap[provider] || '';
    const validation = isValidKeyFormat(provider, key);
    
    if (!key) return null;
    
    return (
      <div className="flex items-center gap-1.5 mt-1.5">
        {validation.valid ? (
          <span className="flex items-center gap-1 text-xs text-green-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {validation.message}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-yellow-400">
            <Info className="w-3.5 h-3.5" />
            {validation.message}
          </span>
        )}
      </div>
    );
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

              {/* DeepSeek Card */}
              <button
                type="button"
                onClick={() => handleProviderChange('deepseek')}
                className={`relative rounded-2xl border-2 p-5 text-left transition-all group ${
                  settings.provider === 'deepseek'
                    ? 'border-blue-500 bg-gradient-to-br from-blue-500/10 to-blue-600/5 shadow-lg shadow-blue-500/10'
                    : 'border-gray-700 bg-[#161b22] hover:border-gray-600 hover:bg-[#1c2128]'
                }`}
                data-testid="ai-settings-provider-deepseek"
              >
                {settings.provider === 'deepseek' && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    D
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg">DeepSeek</div>
                    <div className="text-sm text-blue-400">DeepSeek Models</div>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  Near GPT-4 quality at 10x lower cost
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3" /> DeepSeek-V3
                  </span>
                  <span className="flex items-center gap-1">
                    <Gauge className="w-3 h-3" /> 3 models
                  </span>
                </div>
              </button>

              {/* Groq Card */}
              <button
                type="button"
                onClick={() => handleProviderChange('groq')}
                className={`relative rounded-2xl border-2 p-5 text-left transition-all group ${
                  settings.provider === 'groq'
                    ? 'border-purple-500 bg-gradient-to-br from-purple-500/10 to-purple-600/5 shadow-lg shadow-purple-500/10'
                    : 'border-gray-700 bg-[#161b22] hover:border-gray-600 hover:bg-[#1c2128]'
                }`}
                data-testid="ai-settings-provider-groq"
              >
                {settings.provider === 'groq' && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    G
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg">Groq</div>
                    <div className="text-sm text-purple-400">Open-Source Models</div>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  Ultra-fast inference with open-source models
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3" /> Llama 3.3 70B
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
                const rating = MODEL_RATINGS[m.value] || { capability: 3, speed: 3, cost: 'medium', costEstimate: '~$0.01' };
                const isSelected = settings.model === m.value;
                const providerColors: Record<string, { border: string; bg: string }> = {
                  anthropic: { border: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' },
                  openai: { border: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
                  deepseek: { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
                  groq: { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
                };
                const colors = providerColors[settings.provider] || providerColors.openai;
                
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, model: m.value }))}
                    className={`relative rounded-xl border-2 px-5 py-4 text-left transition-all ${
                      isSelected
                        ? ''
                        : 'border-gray-700 bg-[#161b22] hover:border-gray-600 hover:bg-[#1c2128]'
                    }`}
                    style={{
                      borderColor: isSelected ? colors.border : undefined,
                      background: isSelected ? colors.bg : undefined,
                    }}
                    data-testid={`ai-settings-model-${m.value}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold text-white">{m.label}</span>
                          {m.value.includes('opus') || m.value.includes('5.2') || m.value.includes('reasoner') ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                              FLAGSHIP
                            </span>
                          ) : m.value.includes('haiku') || m.value.includes('mini') || m.value.includes('8b') || m.value.includes('instant') ? (
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
                            <span className="text-xs text-gray-500 ml-1">
                              ({rating.costEstimate}/req)
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: colors.border }}
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

              <div className="grid gap-6">
                {/* OpenAI API Key */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-300 flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-green-500/20 flex items-center justify-center text-green-400 text-xs font-bold">O</div>
                      OpenAI API Key
                      {settings.openaiApiKey && isValidKeyFormat('openai', settings.openaiApiKey).valid && (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      )}
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
                    className={`w-full rounded-lg bg-[#0d1117] border px-3 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 font-mono text-sm ${
                      settings.openaiApiKey && isValidKeyFormat('openai', settings.openaiApiKey).valid
                        ? 'border-green-500 focus:ring-green-500'
                        : 'border-gray-700 focus:ring-green-500'
                    } focus:border-transparent`}
                    placeholder="sk-..."
                    value={settings.openaiApiKey}
                    onChange={(e) => setSettings((s) => ({ ...s, openaiApiKey: e.target.value }))}
                    data-testid="ai-settings-openai-api-key-input"
                  />
                  {getKeyFormatUI('openai')}
                  <SetupGuide 
                    provider="openai" 
                    expanded={openAIGuideExpanded} 
                    onToggle={() => setOpenAIGuideExpanded(!openAIGuideExpanded)} 
                  />
                </div>

                {/* Anthropic API Key */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-300 flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-bold">A</div>
                      Anthropic API Key
                      {settings.anthropicApiKey && isValidKeyFormat('anthropic', settings.anthropicApiKey).valid && (
                        <CheckCircle2 className="w-4 h-4 text-orange-400" />
                      )}
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
                    className={`w-full rounded-lg bg-[#0d1117] border px-3 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 font-mono text-sm ${
                      settings.anthropicApiKey && isValidKeyFormat('anthropic', settings.anthropicApiKey).valid
                        ? 'border-orange-500 focus:ring-orange-500'
                        : 'border-gray-700 focus:ring-orange-500'
                    } focus:border-transparent`}
                    placeholder="sk-ant-..."
                    value={settings.anthropicApiKey}
                    onChange={(e) => setSettings((s) => ({ ...s, anthropicApiKey: e.target.value }))}
                    data-testid="ai-settings-anthropic-api-key-input"
                  />
                  {getKeyFormatUI('anthropic')}
                  <SetupGuide 
                    provider="anthropic" 
                    expanded={anthropicGuideExpanded} 
                    onToggle={() => setAnthropicGuideExpanded(!anthropicGuideExpanded)} 
                  />
                </div>

                {/* DeepSeek API Key */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-300 flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">D</div>
                      DeepSeek API Key
                      {settings.deepseekApiKey && isValidKeyFormat('deepseek', settings.deepseekApiKey).valid && (
                        <CheckCircle2 className="w-4 h-4 text-blue-400" />
                      )}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowDeepSeekKey(!showDeepSeekKey)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      {showDeepSeekKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showDeepSeekKey ? 'text' : 'password'}
                    className={`w-full rounded-lg bg-[#0d1117] border px-3 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 font-mono text-sm ${
                      settings.deepseekApiKey && isValidKeyFormat('deepseek', settings.deepseekApiKey).valid
                        ? 'border-blue-500 focus:ring-blue-500'
                        : 'border-gray-700 focus:ring-blue-500'
                    } focus:border-transparent`}
                    placeholder="sk-..."
                    value={settings.deepseekApiKey}
                    onChange={(e) => setSettings((s) => ({ ...s, deepseekApiKey: e.target.value }))}
                    data-testid="ai-settings-deepseek-api-key-input"
                  />
                  {getKeyFormatUI('deepseek')}
                  <SetupGuide 
                    provider="deepseek" 
                    expanded={deepseekGuideExpanded} 
                    onToggle={() => setDeepseekGuideExpanded(!deepseekGuideExpanded)} 
                  />
                </div>

                {/* Groq API Key */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-300 flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-bold">G</div>
                      Groq API Key
                      {settings.groqApiKey && isValidKeyFormat('groq', settings.groqApiKey).valid && (
                        <CheckCircle2 className="w-4 h-4 text-purple-400" />
                      )}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowGroqKey(!showGroqKey)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      {showGroqKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showGroqKey ? 'text' : 'password'}
                    className={`w-full rounded-lg bg-[#0d1117] border px-3 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 font-mono text-sm ${
                      settings.groqApiKey && isValidKeyFormat('groq', settings.groqApiKey).valid
                        ? 'border-purple-500 focus:ring-purple-500'
                        : 'border-gray-700 focus:ring-purple-500'
                    } focus:border-transparent`}
                    placeholder="gsk_..."
                    value={settings.groqApiKey}
                    onChange={(e) => setSettings((s) => ({ ...s, groqApiKey: e.target.value }))}
                    data-testid="ai-settings-groq-api-key-input"
                  />
                  {getKeyFormatUI('groq')}
                  <SetupGuide 
                    provider="groq" 
                    expanded={groqGuideExpanded} 
                    onToggle={() => setGroqGuideExpanded(!groqGuideExpanded)} 
                  />
                </div>
              </div>

              {/* Key validation note */}
              <div className="flex items-start gap-2 text-xs text-gray-400 mt-4 p-3 rounded-lg bg-gray-800/50">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-400" />
                <span>Your key will be validated when you send your first AI message. If there's an issue, you'll see an error message then.</span>
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
