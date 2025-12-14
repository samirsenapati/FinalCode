import { redirect } from 'next/navigation';
import EditorPage from '@/components/editor/EditorPage';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function Editor() {
  const supabase = createClient();

  if (!supabase) {
    return redirect('/admin-setup');
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return redirect('/login');
  }

  return <EditorPage userEmail={session.user.email || undefined} />;
}
