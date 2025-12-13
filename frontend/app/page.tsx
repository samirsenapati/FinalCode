import { redirect } from 'next/navigation';
import EditorPage from '@/components/editor/EditorPage';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = createClient();

  if (!supabase) {
    return redirect('/login?error=Supabase%20configuration%20is%20missing');
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error('Error retrieving session', error.message);
    return redirect('/login');
  }

  if (!session) {
    return redirect('/login');
  }

  return <EditorPage userEmail={session.user.email || undefined} />;
}
