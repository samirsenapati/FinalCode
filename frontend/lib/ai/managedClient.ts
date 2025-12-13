import type { AISettings } from '@/lib/ai/settings';

export async function callManagedAI(params: {
  settings: AISettings;
  message: string;
  currentFiles: Record<string, string>;
}): Promise<string> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: params.message,
      currentFiles: params.currentFiles,
      provider: params.settings.provider,
      model: params.settings.model,
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error || `Managed AI failed (${res.status})`);
  }

  return json?.response || '';
}
