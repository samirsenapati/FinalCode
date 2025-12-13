'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

type AuthState = {
  error?: string;
  message?: string;
};

const missingConfigError =
  'Admin setup required: Supabase environment variables are missing on the server. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.';

function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL;
  if (!siteUrl) {
    return 'http://localhost:3000';
  }
  if (siteUrl.startsWith('http')) {
    return siteUrl;
  }
  return `https://${siteUrl}`;
}

export async function signInWithEmailPassword(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = createClient();
  if (!supabase) {
    return { error: missingConfigError };
  }

  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.message };
  }

  redirect('/');
}

export async function signUpWithEmailPassword(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = createClient();
  if (!supabase) {
    return { error: missingConfigError };
  }

  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    redirect('/');
  }

  return {
    message: 'Sign-up successful! Check your email to confirm your account.',
  };
}

export async function signInWithGithub(
  _prevState: AuthState,
  _formData: FormData
): Promise<AuthState> {
  const supabase = createClient();
  if (!supabase) {
    return { error: missingConfigError };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${getSiteUrl()}/auth/callback`,
    },
  });

  if (error || !data.url) {
    return { error: error?.message || 'Unable to sign in with GitHub.' };
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = createClient();
  if (!supabase) {
    return redirect('/login');
  }

  await supabase.auth.signOut();
  return redirect('/login');
}
