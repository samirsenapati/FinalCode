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
  onStatusChange?: (status: string) => void;
  projectId?: string | null;
  terminalOutput?: string[];
  onRunApp?: () => Promise<void>;
}

const MAX_AUTO_FIX_ATTEMPTS = 3;
const ERROR_PATTERNS = [
  /error:/i,
  /Error:/,
  /SyntaxError/,
  /ReferenceError/,
  /TypeError/,
  /Cannot find module/,
  /ENOENT/,
  /failed/i,
  /npm ERR!/,
  /exception/i,
  /undefined is not/i,
  /is not defined/,
  /unexpected token/i,
];

function detectErrors(output: string[]): string | null {
  const errorLines: string[] = [];
  for (const line of output) {
    for (const pattern of ERROR_PATTERNS) {
      if (pattern.test(line)) {
        errorLines.push(line);
        break;
      }
    }
  }
  if (errorLines.length > 0) {
    return errorLines.slice(0, 10).join('\n');
  }
  return null;
}

import { loadAISettings, getActiveApiKey, AVAILABLE_MODELS } from '@/lib/ai/settings';

// Example prompts for inspiration
const EXAMPLE_PROMPTS = [
  "Create a todo app with user authentication and database",
  "Build a REST API with Express and SQLite",
  "Make a landing page for a SaaS product",
  "Create a fullstack blog with login system",
  "Build a task manager with JWT authentication",
];

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm **FinalCode AI**, powered by cutting-edge models like **Claude Opus 4.5** and **GPT-5.2**.\n\nI can build **fullstack applications** with frontend and backend code. Try something like:\n\n- \"Create a todo app with user authentication and database\"\n- \"Build a REST API with Express and JWT authentication\"\n- \"Make a fullstack blog with login system\"\n- \"Create a task manager with SQLite database\"\n\nI generate complete, runnable code including:\n- **Frontend**: HTML, CSS, JavaScript\n- **Backend**: Node.js, Express, SQLite, JWT auth\n\nConfigure your preferred AI model in **AI Settings**.",
  timestamp: new Date(),
};

export default function AIChat({ onCodeGenerated, onReplaceAllFiles, currentFiles, onStatusChange, projectId, terminalOutput = [], onRunApp }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const terminalOutputRef = useRef<string[]>([]);
  const pendingAutoFixRef = useRef<string | null>(null);
  const autoFixAttemptRef = useRef(0);

  // Sync terminal output to ref for access in callbacks
  useEffect(() => {
    terminalOutputRef.current = terminalOutput;
  }, [terminalOutput]);

  // Process pending auto-fix after state updates
  useEffect(() => {
    if (pendingAutoFixRef.current && !isLoading) {
      const errorMsg = pendingAutoFixRef.current;
      pendingAutoFixRef.current = null;
      setInput(errorMsg);
      // Trigger send after a brief delay to let state settle
      setTimeout(() => {
        const sendBtn = document.querySelector('[data-testid="ai-chat-send-button"]') as HTMLButtonElement;
        if (sendBtn && !sendBtn.disabled) {
          sendBtn.click();
        }
      }, 100);
    }
  }, [isLoading]);

  // Load chat history from database when projectId changes
  useEffect(() => {
    if (!projectId) {
      setMessages([WELCOME_MESSAGE]);
      setHistoryLoaded(false);
      return;
    }

    const loadHistory = async () => {
      try {
        const { getChatHistory } = await import('@/lib/projects/supabaseProjects');
        const history = await getChatHistory(projectId);
        
        if (history.length > 0) {
          const loadedMessages: Message[] = history.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.created_at),
          }));
          setMessages([WELCOME_MESSAGE, ...loadedMessages]);
        } else {
          setMessages([WELCOME_MESSAGE]);
        }
        setHistoryLoaded(true);
      } catch (error) {
        console.error('Failed to load chat history:', error);
        setMessages([WELCOME_MESSAGE]);
        setHistoryLoaded(true);
      }
    };

    loadHistory();
  }, [projectId]);

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

  // Extract code blocks from response - supports file paths like "server.js", "routes/auth.js"
  const extractCode = (content: string): { code: string; language: string }[] => {
    const codeBlocks: { code: string; language: string }[] = [];
    // Updated regex to capture file paths with dots and slashes (e.g., server.js, routes/auth.js)
    const regex = /```([^\n`]+)?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const identifier = (match[1] || 'javascript').trim();
      codeBlocks.push({
        language: identifier,
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
    onStatusChange?.('Thinking through your request and reviewing the project files...');

    // Save user message to database (best-effort)
    if (projectId) {
      import('@/lib/projects/supabaseProjects').then(({ saveChatMessage }) => {
        saveChatMessage({ projectId, role: 'user', content: userMessageText }).catch(console.error);
      });
    }

    let hadError = false;

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
        const { callManagedAI } = await import('@/lib/ai/managedClient');
        responseText = await callManagedAI({ settings, message: userMessageText, currentFiles });
      } else {
        const { generateAIResponse } = await import('@/lib/ai/providers');
        responseText = await generateAIResponse({
          settings,
          systemPrompt: `You are FinalCode AI, an expert web developer assistant that helps users build applications through natural language.

Your role:
1. Generate clean, working code based on user descriptions
2. Explain what you're creating in a friendly way
3. Always provide complete, runnable code

IMPORTANT - Running the App:
- NEVER tell users to run npm install, npm start, or any terminal commands manually
- The platform handles all of this automatically
- Simply tell users: "Click the **Run** button to start your app"

File Structure:
- Always put frontend files in the public/ folder
- Use: public/index.html, public/style.css, public/app.js
- Backend files go at root: server.js, package.json

Guidelines:
- Generate HTML, CSS, and JavaScript code that works together
- Use modern, clean design with good UX
- Include helpful comments in the code
- Make the code responsive and accessible
- Use vanilla JavaScript (no frameworks) unless specifically asked
- Always use semantic HTML

When generating code:
- For complete apps, provide separate code blocks for each file
- Use file paths as code block labels: public/index.html, public/style.css, public/app.js
- Make sure the code is complete and can run immediately
- Include any necessary error handling

Response format:
1. Brief explanation of what you're creating
2. Code blocks with file path labels
3. Tell users to click the Run button to start

Keep responses concise but complete. Focus on delivering working code quickly.`,
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

      // Save assistant message to database (best-effort)
      if (projectId) {
        import('@/lib/projects/supabaseProjects').then(({ saveChatMessage }) => {
          saveChatMessage({ projectId, role: 'assistant', content: responseText }).catch(console.error);
        });
      }

      const codeBlocks = extractCode(responseText);

      // Extract files from code blocks - supports both simple and fullstack patterns
      const extractedFiles: Record<string, string> = {};
      for (const block of codeBlocks) {
        const lang = block.language.trim();
        
        // Simple frontend patterns - map to public/ folder
        if (lang === 'html') {
          extractedFiles['public/index.html'] = block.code;
        } else if (lang === 'css') {
          extractedFiles['public/style.css'] = block.code;
        } else if (lang === 'javascript' || lang === 'js') {
          extractedFiles['public/app.js'] = block.code;
        } else if (lang === 'json' && block.code.includes('"name"') && block.code.includes('"dependencies"')) {
          extractedFiles['package.json'] = block.code;
        } else if (lang.includes('.') || lang.includes('/')) {
          // Fullstack file paths (e.g., "server.js", "routes/auth.js", "public/index.html")
          extractedFiles[lang] = block.code;
        }
      }

      // Detect if this is a fullstack project
      const isFullstack = Boolean(
        extractedFiles['server.js'] || 
        extractedFiles['package.json'] ||
        Object.keys(extractedFiles).some(f => f.startsWith('routes/') || f.startsWith('middleware/'))
      );

      const newFiles = { ...currentFiles, ...extractedFiles };
      
      if (Object.keys(extractedFiles).length >= 2) {
        onStatusChange?.(isFullstack 
          ? 'Applying fullstack project files...' 
          : 'Applying generated updates across your project files...');
        
        // Create checkpoint before applying changes (best-effort)
        if (projectId) {
          import('@/lib/projects/supabaseProjects').then(({ createCheckpoint }) => {
            const checkpointName = userMessageText.slice(0, 50) + (userMessageText.length > 50 ? '...' : '');
            createCheckpoint({
              projectId,
              name: checkpointName,
              description: `AI generated ${Object.keys(extractedFiles).length} files`,
              files: newFiles,
            }).catch(console.error);
          });
        }
        
        onReplaceAllFiles(newFiles);
      } else if (codeBlocks.length > 0) {
        const mainCode = codeBlocks[codeBlocks.length - 1];
        onStatusChange?.(`Updating ${mainCode.language || 'code'} to match your request...`);
        onCodeGenerated(mainCode.code, mainCode.language);
      }
      // Auto-run and check for errors if onRunApp is available
      if (onRunApp && Object.keys(extractedFiles).length > 0) {
        onStatusChange?.('Running your app and checking for errors...');
        
        try {
          await onRunApp();
          
          // Wait for output to accumulate
          await new Promise(resolve => setTimeout(resolve, 4000));
          
          // Check for errors in terminal output using the synced ref
          const currentOutput = terminalOutputRef.current;
          const errors = detectErrors(currentOutput);
          
          if (errors && autoFixAttemptRef.current < MAX_AUTO_FIX_ATTEMPTS) {
            autoFixAttemptRef.current += 1;
            const attemptNum = autoFixAttemptRef.current;
            onStatusChange?.(`Found errors, attempting auto-fix (${attemptNum}/${MAX_AUTO_FIX_ATTEMPTS})...`);
            
            // Queue auto-fix message - will be processed by useEffect
            const fixPrompt = `[Auto-fix attempt ${attemptNum}] The app has the following errors:\n\`\`\`\n${errors}\n\`\`\`\n\nPlease analyze and fix these errors in the code. Provide the corrected files.`;
            pendingAutoFixRef.current = fixPrompt;
          } else if (errors && autoFixAttemptRef.current >= MAX_AUTO_FIX_ATTEMPTS) {
            autoFixAttemptRef.current = 0; // Reset for next user request
            onStatusChange?.(`Auto-fix reached max attempts. Check the console for remaining errors.`);
          } else {
            autoFixAttemptRef.current = 0; // Reset on success
            onStatusChange?.(isFullstack 
              ? 'Done — your app is running!' 
              : 'Done — preview the changes on the right.');
          }
        } catch (runError) {
          console.error('Auto-run failed:', runError);
          onStatusChange?.(isFullstack 
            ? 'Done — click the Run button to start your app!' 
            : 'Done — preview the changes on the right.');
        }
      } else {
        onStatusChange?.(isFullstack 
          ? 'Done — click the Run button to start your app!' 
          : 'Done — preview the changes on the right.');
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          `AI request failed.\n\n` +
          `• If you're using Managed AI, the server must be configured with provider keys and Supabase service role.\n` +
          `• If you're using BYOK, open **AI Settings** and paste a valid key (stored only in your browser).\n\n` +
          `Error: ${error?.message || 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      onStatusChange?.('AI request failed — check your settings and try again.');
      hadError = true;

    } finally {
      setIsLoading(false);
      if (!hadError) {
        onStatusChange?.('Idle — ready for your next request');
      }
    }
  }, [input, isLoading, currentFiles, onCodeGenerated, onReplaceAllFiles, onStatusChange, projectId]);

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

  const settingsSnapshot = (() => {
    try {
      return loadAISettings();
    } catch {
      return { mode: 'managed', provider: 'anthropic', apiKey: '', model: 'claude-opus-4-5-20251101', openaiApiKey: '', anthropicApiKey: '' } as any;
    }
  })();

  const hasKey = Boolean(getActiveApiKey(settingsSnapshot)?.trim());

  // Get model label for display
  const getModelLabel = (provider: string, model: string) => {
    const models = AVAILABLE_MODELS[provider as keyof typeof AVAILABLE_MODELS] || [];
    const found = models.find(m => m.value === model);
    return found?.label || model;
  };

  return (
    <div className="flex flex-col h-full" data-testid="ai-chat">
      {/* AI mode notice */}
      <div className="px-4 pt-3" data-testid="ai-chat-mode-notice">
        <div className="rounded-lg border border-editor-border bg-editor-bg px-3 py-2.5 text-xs text-gray-400 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${settingsSnapshot.provider === 'anthropic' ? 'bg-orange-400' : 'bg-green-400'}`}></span>
              <span className="font-semibold text-gray-200">
                {getModelLabel(settingsSnapshot.provider, settingsSnapshot.model)}
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
              settingsSnapshot.mode === 'managed'
                ? 'bg-purple-500/20 text-purple-300'
                : 'bg-blue-500/20 text-blue-300'
            }`}>
              {settingsSnapshot.mode === 'managed' ? 'Managed' : 'BYOK'}
            </span>
          </div>
          {settingsSnapshot.mode === 'byok' && !hasKey && (
            <div className="text-yellow-300 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              No {settingsSnapshot.provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} API key set — open AI Settings
            </div>
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
