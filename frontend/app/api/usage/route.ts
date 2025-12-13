import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { getUserUsage } from '@/lib/usage/tracking';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase configuration is missing' }, { status: 500 });
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const usage = await getUserUsage(session.user.id);

    if (!usage) {
      return NextResponse.json(
        { error: 'Usage data not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(usage);
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}
