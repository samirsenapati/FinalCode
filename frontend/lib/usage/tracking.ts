import { createClient } from '@/lib/supabase/server';

export interface UsageLimits {
  planType: string;
  aiRequestsToday: number;
  aiRequestsLimit: number;
  projectsCount: number;
  projectsLimit: number;
  canCreatePrivate: boolean;
}

export async function getUserUsage(userId: string): Promise<UsageLimits | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc('get_user_usage', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error fetching user usage:', error);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  return {
    planType: data[0].plan_type,
    aiRequestsToday: data[0].ai_requests_today,
    aiRequestsLimit: data[0].ai_requests_limit,
    projectsCount: data[0].projects_count,
    projectsLimit: data[0].projects_limit,
    canCreatePrivate: data[0].can_create_private,
  };
}

export async function trackAIRequest(userId: string, requestType: string, tokensUsed?: number) {
  const supabase = createClient();
  if (!supabase) return;

  // Log the request
  await supabase.from('ai_request_logs').insert({
    user_id: userId,
    request_type: requestType,
    tokens_used: tokensUsed,
  });

  // Update usage tracking
  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .gte('period_end', new Date().toISOString())
    .single();

  if (usage) {
    await supabase
      .from('usage_tracking')
      .update({
        ai_requests_count: usage.ai_requests_count + 1,
      })
      .eq('id', usage.id);
  }
}

export async function canMakeAIRequest(userId: string): Promise<boolean> {
  const usage = await getUserUsage(userId);
  if (!usage) return false;
  return usage.aiRequestsToday < usage.aiRequestsLimit;
}

export async function canCreateProject(userId: string): Promise<boolean> {
  const usage = await getUserUsage(userId);
  if (!usage) return false;
  return usage.projectsCount < usage.projectsLimit;
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
      .update({
        projects_count: usage.projects_count + 1,
      })
      .eq('id', usage.id);
  }
}

export async function decrementProjectCount(userId: string) {
  const supabase = createClient();

  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .gte('period_end', new Date().toISOString())
    .single();

  if (usage && usage.projects_count > 0) {
    await supabase
      .from('usage_tracking')
      .update({
        projects_count: usage.projects_count - 1,
      })
      .eq('id', usage.id);
  }
}
