import { redirect } from 'next/navigation';
import { redirect } from 'next/navigation';

import AuthForm from '@/components/auth/AuthForm';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type LoginPageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = createClient();

  if (!supabase) {
    return redirect('/admin-setup');
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    return <AuthForm errorMessage={error.message} />;
  }

  if (session) {
    return redirect('/');
  }

  return <AuthForm errorMessage={stringifyError(searchParams?.error)} />;
}

function stringifyError(error?: string | string[]) {
  if (Array.isArray(error)) {
    return error.join(', ');
  }
  return error;
}
