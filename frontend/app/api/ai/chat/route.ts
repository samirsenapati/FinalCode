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

const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini';
const DEFAULT_ANTHROPIC_MODEL = 'claude-4-sonnet-20250514';

const SYSTEM_PROMPT = `You are FinalCode AI, an expert web developer assistant that helps users build applications through natural language.

Your role:
1. Generate clean, working code based on user descriptions
2. Explain what you're creating in a friendly way
3. Always provide complete, runnable code

Guidelines:
- Generate HTML, CSS, and JavaScript code that works together
- Use modern, clean design with good UX
- Include helpful comments in the code
- Make the code responsive and accessible
- Use vanilla JavaScript (no frameworks) unless specifically asked
- Always use semantic HTML

When generating code:
- For complete apps, provide separate code blocks for HTML, CSS, and JavaScript
- Label each code block clearly with the language (html, css, javascript)
- Make sure the code is complete and can run immediately
- Include any necessary error handling

Keep responses concise but complete. Focus on delivering working code quickly.`;

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

    // Usage caps via Supabase DB
    const admin = createAdminClient();
    if (!admin) return jsonError('Server is missing SUPABASE_SERVICE_ROLE_KEY', 500);

    // Reset daily usage if needed
    try {
      await admin.rpc('reset_daily_usage');
    } catch {
      // ignore
    }

    const { data: usageRows, error: usageErr } = await admin.rpc('get_user_usage', {
      p_user_id: user.id,
    });

    if (usageErr) {
      return jsonError(`Usage lookup failed: ${usageErr.message}`, 500);
    }

    const usage = Array.isArray(usageRows) ? usageRows[0] : usageRows;
    const aiRequestsToday = Number(usage?.ai_requests_today ?? 0);
    const aiRequestsLimit = Number(usage?.ai_requests_limit ?? 0);

    if (aiRequestsLimit && aiRequestsToday >= aiRequestsLimit) {
      return jsonError('Daily AI limit reached. Please try again tomorrow.', 429);
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
          temperature: 0.2,
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
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }],
          temperature: 0.2,
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
        .insert({ user_id: user.id, request_type: `chat:${provider}`, tokens_used: null });
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

    // Extract basic files
    const extractedFiles: Record<string, string> = {};
    const htmlMatch = responseText.match(/```html\n([\s\S]*?)```/);
    const cssMatch = responseText.match(/```css\n([\s\S]*?)```/);
    const jsMatch = responseText.match(/```(?:javascript|js)\n([\s\S]*?)```/);

    if (htmlMatch) extractedFiles['index.html'] = htmlMatch[1].trim();
    if (cssMatch) extractedFiles['style.css'] = cssMatch[1].trim();
    if (jsMatch) extractedFiles['script.js'] = jsMatch[1].trim();

    return NextResponse.json({
      response: responseText,
      files: Object.keys(extractedFiles).length ? extractedFiles : {},
    });
  } catch (e: any) {
    return jsonError(e?.message || 'Unknown error', 500);
  }
}
