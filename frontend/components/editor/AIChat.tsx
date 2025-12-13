'use client';

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { Send, Loader2, Sparkles, User, Copy, Check, Wand2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  onCodeGenerated: (code: string, language: string) => void;
  onReplaceAllFiles: (files: Record<string, string>) => void;
  currentFiles: Record<string, string>;
}

import { loadAISettings } from '@/lib/ai/settings';

// Example prompts for inspiration
const EXAMPLE_PROMPTS = [
  "Create a beautiful todo app with animations",
  "Build a weather dashboard with API integration",
  "Make a landing page for a SaaS product",
  "Create a calculator with a modern design",
  "Build a simple game like tic-tac-toe",
];

export default function AIChat({ onCodeGenerated, onReplaceAllFiles, currentFiles }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI coding assistant. 🚀\n\nTell me what you want to build, and I'll create the code for you. Try something like:\n\n- \"Create a beautiful todo app\"\n- \"Build a calculator with a modern design\"\n- \"Make a landing page for my startup\"\n\nI can write HTML, CSS, and JavaScript to bring your ideas to life!",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  // (reserved) could show settings hint inline
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Copy code to clipboard
  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Extract code blocks from response
  const extractCode = (content: string): { code: string; language: string }[] => {
    const codeBlocks: { code: string; language: string }[] = [];
    const regex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      codeBlocks.push({
        language: match[1] || 'javascript',
        code: match[2].trim()
      });
    }
    
    return codeBlocks;
  };

  // Send message to AI
  // - Managed: call server route /api/ai/chat (server keys + per-user caps)
  // - BYOK: call provider APIs directly from browser (localStorage key)
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessageText = input.trim();

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { loadAISettings } = await import('@/lib/ai/settings');
      const { checkAndIncrementRateLimit } = await import('@/lib/ai/rateLimit');

      // Basic client-side rate limiting (applies to both modes to avoid spam clicks)
      const rate = checkAndIncrementRateLimit({ maxRequests: 20, windowMs: 60_000 });
      if (!rate.allowed) {
        throw new Error(`Rate limit: wait ${Math.ceil(rate.retryAfterMs / 1000)}s and try again.`);
      }

      const settings = loadAISettings();

      const filesContext = Object.entries(currentFiles)
        .map(([name, content]) => `### ${name}\n\`\`\`\n${content}\n\`\`\``)
        .join('\n\n');

      const userPrompt = `Current project files:\n${filesContext}\n\nUser request: ${userMessageText}\n\nPlease help with this request. If generating new code, provide complete files that can replace the current ones.`;

      let responseText = '';

      if (settings.mode === 'managed') {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessageText,
            currentFiles,
            provider: settings.provider,
            model: settings.model,
          }),
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.error || `Managed AI failed (${res.status})`);
        }
        responseText = json?.response || '';
      } else {
        const { generateAIResponse } = await import('@/lib/ai/providers');
        responseText = await generateAIResponse({
          settings,
          systemPrompt: `You are FinalCode AI, an expert web developer assistant that helps users build applications through natural language.\n\nYour role:\n1. Generate clean, working code based on user descriptions\n2. Explain what you're creating in a friendly way\n3. Always provide complete, runnable code\n\nGuidelines:\n- Generate HTML, CSS, and JavaScript code that works together\n- Use modern, clean design with good UX\n- Include helpful comments in the code\n- Make the code responsive and accessible\n- Use vanilla JavaScript (no frameworks) unless specifically asked\n- Always use semantic HTML\n\nWhen generating code:\n- For complete apps, provide separate code blocks for HTML, CSS, and JavaScript\n- Label each code block clearly with the language (html, css, javascript)\n- Make sure the code is complete and can run immediately\n- Include any necessary error handling\n\nResponse format:\n1. Brief explanation of what you're creating\n2. Code blocks with language labels\n3. Optional: Tips or suggestions for customization\n\nKeep responses concise but complete. Focus on delivering working code quickly.`,
          userPrompt,
        });
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      const codeBlocks = extractCode(responseText);

      // If the assistant returned multiple file blocks, map common filenames
      const extractedFiles: Record<string, string> = {};
      for (const block of codeBlocks) {
        if (block.language === 'html') extractedFiles['index.html'] = block.code;
        if (block.language === 'css') extractedFiles['style.css'] = block.code;
        if (block.language === 'javascript' || block.language === 'js') extractedFiles['script.js'] = block.code;
      }

      if (Object.keys(extractedFiles).length >= 2) {
        onReplaceAllFiles({ ...currentFiles, ...extractedFiles });
      } else if (codeBlocks.length > 0) {
        const mainCode = codeBlocks[codeBlocks.length - 1];
        onCodeGenerated(mainCode.code, mainCode.language);
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          `I couldn't reach your AI provider.\n\n` +
          `• Open **AI Settings** and paste a valid API key (stored only in your browser).\n` +
          `• Also check your network/CORS settings.\n\n` +
          `Error: ${error?.message || 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);

    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, currentFiles, onCodeGenerated, onReplaceAllFiles]);

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Use example prompt
  const useExample = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const hasKey = (() => {
    try {
      const s = loadAISettings();
      return Boolean(s.apiKey && s.apiKey.trim().length > 0);
    } catch {
      return false;
    }
  })();

  return (
    <div className="flex flex-col h-full" data-testid="ai-chat">
      {/* BYOK notice */}
      <div className="px-4 pt-3" data-testid="ai-chat-byok-notice">
        <div className="rounded-lg border border-editor-border bg-editor-bg px-3 py-2 text-xs text-gray-400">
          <span className="font-semibold text-gray-200">BYOK:</span> Your AI key stays in your browser only.
          {!hasKey && (
            <span className="ml-2 text-yellow-300">No key set — open AI Settings in the top bar.</span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`ai-message ${
              message.role === 'user' ? 'flex justify-end' : ''
            }`}
          >
            <div
              className={`max-w-[90%] rounded-xl p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-100'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {message.role === 'assistant' ? (
                  <Sparkles className="w-4 h-4 text-purple-400" />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span className="text-xs opacity-70">
                  {message.role === 'assistant' ? 'AI Assistant' : 'You'}
                </span>
              </div>
              
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }: {
                      node?: unknown;
                      inline?: boolean;
                      className?: string;
                      children?: ReactNode;
                    }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeString = String(children).replace(/\n$/, '');
                      
                      if (!inline && match) {
                        return (
                          <div className="relative group">
                            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => copyToClipboard(codeString, message.id + match[1])}
                                className="p-1.5 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                              >
                                {copiedId === message.id + match[1] ? (
                                  <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                  <Copy className="w-4 h-4 text-gray-300" />
                                )}
                              </button>
                            </div>
                            <pre className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </pre>
                          </div>
                        );
                      }
                      
                      return (
                        <code className="bg-gray-700 px-1 py-0.5 rounded text-sm" {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="ai-message">
            <div className="bg-gray-800 rounded-xl p-4 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
              <span className="text-gray-300">Generating code<span className="loading-dots"></span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Example Prompts */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <Wand2 className="w-3 h-3" /> Try an example:
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.slice(0, 3).map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => useExample(prompt)}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded-full transition-colors"
                data-testid={`ai-chat-example-${idx}`}
              >
                {prompt.length > 30 ? prompt.slice(0, 30) + '...' : prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-editor-border">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Describe what you want to build..."
            className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500"
            rows={2}
            disabled={isLoading}
            data-testid="ai-chat-input"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors self-end"
            data-testid="ai-chat-send-button"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
