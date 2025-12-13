import { createClient } from '@/lib/supabase/client';

// Client-side usage helpers (uses RLS-protected tables)

export async function canCreateProject(userId: string): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return true;

  const { data, error } = await supabase.rpc('get_user_usage', { p_user_id: userId });
  if (error || !data?.length) return true;

  return Number(data[0].projects_count ?? 0) < Number(data[0].projects_limit ?? 0);
}

export async function incrementProjectCount(userId: string) {
  const supabase = createClient();
  if (!supabase) return;

  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .gte('period_end', new Date().toISOString())
    .single();

  if (usage) {
    await supabase
      .from('usage_tracking')
      .update({ projects_count: (usage as any).projects_count + 1 })
      .eq('id', (usage as any).id);
  }
}

export async function decrementProjectCount(userId: string) {
  const supabase = createClient();
  if (!supabase) return;

  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .gte('period_end', new Date().toISOString())
    .single();

  if (usage && (usage as any).projects_count > 0) {
    await supabase
      .from('usage_tracking')
      .update({ projects_count: (usage as any).projects_count - 1 })
      .eq('id', (usage as any).id);
  }
}

export async function canMakeAIRequest(userId: string): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return true;

  const { data, error } = await supabase.rpc('get_user_usage', { p_user_id: userId });
  if (error || !data?.length) return true;

  return Number(data[0].ai_requests_today ?? 0) < Number(data[0].ai_requests_limit ?? 0);
}
