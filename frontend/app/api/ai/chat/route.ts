import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

type Provider = 'openai' | 'anthropic';

type Body = {
  message: string;
  currentFiles: Record<string, string>;
  provider?: Provider;
  model?: string;
};

// Default models - using latest and most capable
const DEFAULT_OPENAI_MODEL = 'gpt-5.2';
const DEFAULT_ANTHROPIC_MODEL = 'claude-opus-4-5-20251101';

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

const SYSTEM_PROMPT = `You are FinalCode AI, an expert fullstack web developer assistant that helps users build complete applications through natural language. You are powered by state-of-the-art AI models including Claude Opus 4.5 and GPT-5.2.

Your role:
1. Generate clean, working code based on user descriptions
2. Build both frontend AND backend code when needed
3. Explain what you're creating in a friendly way
4. Always provide complete, runnable code
5. Be creative and suggest improvements when appropriate

## IMPORTANT - Running the App:
- NEVER tell users to run npm install, npm start, or any terminal commands manually
- The platform handles all of this automatically
- Simply tell users: "Click the **Run** button to start your app"
- Dependencies are installed and the server starts automatically when they click Run

## Frontend Guidelines:
- Generate HTML, CSS, and JavaScript code that works together
- Use modern, clean design with good UX
- Make the code responsive and accessible
- Use vanilla JavaScript (no frameworks) unless specifically asked
- Use modern CSS features like Grid, Flexbox, and CSS Variables

## Backend Guidelines (Node.js/Express):
When the user asks for authentication, databases, APIs, or any server-side functionality:
- Use Express.js for the web server
- Use better-sqlite3 for database (SQLite)
- Use bcryptjs for password hashing
- Use jsonwebtoken for JWT authentication
- Use helmet for security headers
- Use cors for cross-origin requests

## File Structure:
ALWAYS organize frontend files in the public/ folder:
- server.js - Main Express server entry point
- package.json - Dependencies and scripts
- public/index.html - Frontend HTML (NOT index.html at root)
- public/style.css - Frontend CSS (NOT style.css at root)
- public/app.js - Frontend JavaScript (NOT script.js at root)
- routes/auth.js - Authentication routes (if needed)
- routes/api.js - API routes (if needed)
- middleware/auth.js - JWT verification middleware (if needed)
- db/database.js - Database setup and queries (if needed)

## Code Block Format:
IMPORTANT: For each file, use a code block with the FULL FILE PATH as the language identifier:
\`\`\`server.js
// server code here
\`\`\`

\`\`\`package.json
{
  "name": "my-app",
  ...
}
\`\`\`

\`\`\`public/index.html
<!DOCTYPE html>
...
\`\`\`

\`\`\`public/style.css
/* styles here */
\`\`\`

\`\`\`public/app.js
// frontend JavaScript here
\`\`\`

\`\`\`routes/auth.js
// auth routes
\`\`\`

For simple frontend-only apps without a server, use the public/ paths:
\`\`\`public/index.html
...
\`\`\`
\`\`\`public/style.css
...
\`\`\`
\`\`\`public/app.js
...
\`\`\`

## Backend Patterns:
1. **Express Server Setup**:
   - Serve static files from /public folder
   - Use JSON body parser
   - Enable CORS
   - Use helmet for security
   - All API routes under /api/*

2. **SQLite Database**:
   - Create tables on server start if they don't exist
   - Use prepared statements for queries
   - Handle foreign keys properly

3. **JWT Authentication**:
   - Tokens expire in 7 days
   - Include user id and email in payload
   - Verify from Authorization header (Bearer token)

4. **API Response Format**:
   \`\`\`json
   { "success": true, "data": { ... } }
   { "success": false, "error": "Error message" }
   \`\`\`

Keep responses concise but complete. Focus on delivering working, production-ready code.`;

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    if (!supabase) return jsonError('Supabase is not configured', 500);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return jsonError('Unauthorized', 401);

    const body = (await request.json()) as Body;

    const message = (body.message ?? '').trim();
    if (!message) return jsonError('Missing message');

    const currentFiles = body.currentFiles ?? {};

    const provider: Provider = body.provider === 'anthropic' ? 'anthropic' : 'openai';
    const model = (body.model ?? '').trim() || (provider === 'openai' ? DEFAULT_OPENAI_MODEL : DEFAULT_ANTHROPIC_MODEL);
    const modelConfig = getModelConfig(model);

    // Usage caps via Supabase DB
    const admin = createAdminClient();
    if (!admin) return jsonError('Server is missing SUPABASE_SERVICE_ROLE_KEY', 500);

    // Reset daily usage if needed
    try {
      await admin.rpc('reset_daily_usage');
    } catch {
      // ignore
    }

    let aiRequestsToday = 0;
    let aiRequestsLimit = 0;

    try {
      const { data: usageRows, error: usageErr } = await admin.rpc('get_user_usage', {
        p_user_id: user.id,
      });

      if (!usageErr && usageRows) {
        const usage = Array.isArray(usageRows) ? usageRows[0] : usageRows;
        aiRequestsToday = Number(usage?.ai_requests_today ?? 0);
        aiRequestsLimit = Number(usage?.ai_requests_limit ?? 0);

        if (aiRequestsLimit && aiRequestsToday >= aiRequestsLimit) {
          return jsonError('Daily AI limit reached. Please try again tomorrow.', 429);
        }
      } else {
        console.warn('Usage tracking not available - database may need migrations. Skipping limits.');
      }
    } catch {
      console.warn('Usage tracking not available - database may need migrations. Skipping limits.');
    }

    // Build context
    const filesContext = Object.entries(currentFiles)
      .map(([name, content]) => `### ${name}\n\`\`\`\n${content}\n\`\`\``)
      .join('\n\n');

    const userPrompt = `Current project files:\n${filesContext}\n\nUser request: ${message}\n\nPlease help with this request. If generating new code, provide complete files that can replace the current ones.`;

    // Call provider using server keys
    let responseText = '';
    if (provider === 'openai') {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) return jsonError('OPENAI_API_KEY not configured on server', 500);

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: modelConfig.temperature,
          max_completion_tokens: modelConfig.maxTokens,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = json?.error?.message || `OpenAI request failed (${res.status})`;
        return jsonError(msg, res.status);
      }

      responseText = json?.choices?.[0]?.message?.content ?? '';
    } else {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) return jsonError('ANTHROPIC_API_KEY not configured on server', 500);

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: modelConfig.maxTokens,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }],
          temperature: modelConfig.temperature,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = json?.error?.message || `Anthropic request failed (${res.status})`;
        return jsonError(msg, res.status);
      }

      const blocks = json?.content;
      responseText = Array.isArray(blocks) ? blocks.find((b: any) => b?.type === 'text')?.text ?? '' : '';
    }

    if (!responseText) return jsonError('Empty AI response', 500);

    // Track usage
    try {
      await admin
        .from('ai_request_logs')
        .insert({ user_id: user.id, request_type: `chat:${provider}:${model}`, tokens_used: null });
    } catch {
      // ignore
    }

    // Increment usage counter
    // usage_tracking has one row per day per user (initialized by trigger). Update the current active period row.
    try {
      await admin
        .from('usage_tracking')
        .update({ ai_requests_count: aiRequestsToday + 1 })
        .eq('user_id', user.id)
        .gte('period_end', new Date().toISOString());
    } catch {
      // ignore
    }

    // Extract files from code blocks
    const extractedFiles: Record<string, string> = {};
    
    // Match all code blocks with their language/path identifiers
    const codeBlockRegex = /```([^\n]+)\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(responseText)) !== null) {
      const identifier = match[1].trim();
      const content = match[2].trim();
      
      // Map language identifiers to file paths in public/ folder
      if (identifier === 'html') {
        extractedFiles['public/index.html'] = content;
      } else if (identifier === 'css') {
        extractedFiles['public/style.css'] = content;
      } else if (identifier === 'javascript' || identifier === 'js') {
        extractedFiles['public/app.js'] = content;
      } else if (identifier === 'json' && content.includes('"name"') && content.includes('"dependencies"')) {
        // Likely package.json
        extractedFiles['package.json'] = content;
      } else if (identifier.includes('.') || identifier.includes('/')) {
        // This is a file path (e.g., "server.js", "routes/auth.js", "public/index.html")
        extractedFiles[identifier] = content;
      }
    }

    // Detect if this is a fullstack project
    const isFullstack = Boolean(
      extractedFiles['server.js'] || 
      extractedFiles['package.json'] ||
      Object.keys(extractedFiles).some(f => f.startsWith('routes/') || f.startsWith('middleware/'))
    );

    return NextResponse.json({
      response: responseText,
      files: Object.keys(extractedFiles).length ? extractedFiles : {},
      isFullstack,
    });
  } catch (e: any) {
    return jsonError(e?.message || 'Unknown error', 500);
  }
}
