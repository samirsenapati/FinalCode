'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Github, Lock, Mail } from 'lucide-react';
import {
  signInWithEmailPassword,
  signInWithGithub,
  signUpWithEmailPassword,
} from '@/app/actions/auth';

type AuthState = {
  error?: string;
  message?: string;
};

type AuthMode = 'signin' | 'signup';

type AuthFormProps = {
  configMissing?: boolean;
  errorMessage?: string;
};

const initialState: AuthState = {};
const missingConfigMessage =
  'Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable authentication.';

export default function AuthForm({
  configMissing = false,
  errorMessage,
}: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [signInState, signInAction] = useFormState(
    signInWithEmailPassword,
    initialState
  );
  const [signUpState, signUpAction] = useFormState(
    signUpWithEmailPassword,
    initialState
  );
  const [githubState, githubAction] = useFormState(signInWithGithub, initialState);

  const activeState = mode === 'signin' ? signInState : signUpState;
  const resolvedError =
    errorMessage || activeState?.error || githubState?.error || (configMissing ? missingConfigMessage : undefined);
  const resolvedMessage = configMissing ? undefined : activeState?.message;

  return (
    <div className="min-h-screen bg-editor-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-editor-sidebar border border-editor-border rounded-xl shadow-lg p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white">Welcome to FinalCode</h1>
          <p className="text-sm text-gray-400">
            {mode === 'signin'
              ? 'Sign in to continue building with AI.'
              : 'Create your FinalCode account to get started.'}
          </p>
        </div>

        {(resolvedError || resolvedMessage) && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              resolvedError
                ? 'border-red-500/40 bg-red-500/10 text-red-200'
                : 'border-green-500/40 bg-green-500/10 text-green-200'
            }`}
          >
            {resolvedError || resolvedMessage}
          </div>
        )}

        <form
          className="space-y-4"
          action={mode === 'signin' ? signInAction : signUpAction}
          onSubmit={configMissing ? (event) => event.preventDefault() : undefined}
        >
          <label className="block text-sm text-gray-300 space-y-2">
            <span className="flex items-center gap-2 text-gray-400">
              <Mail className="w-4 h-4" />
              Email
            </span>
            <input
              required
              name="email"
              type="email"
              className="w-full rounded-lg bg-editor-bg border border-editor-border px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
              disabled={configMissing}
              data-testid="auth-email-input"
            />
          </label>

          <label className="block text-sm text-gray-300 space-y-2">
            <span className="flex items-center gap-2 text-gray-400">
              <Lock className="w-4 h-4" />
              Password
            </span>
            <input
              required
              name="password"
              type="password"
              minLength={6}
              className="w-full rounded-lg bg-editor-bg border border-editor-border px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              disabled={configMissing}
              data-testid="auth-password-input"
            />
          </label>

          <SubmitButton mode={mode} disabled={configMissing} />
        </form>

        <div className="flex items-center gap-3 text-gray-500">
          <div className="flex-1 h-px bg-editor-border" />
          <span className="text-xs uppercase tracking-wide">or</span>
          <div className="flex-1 h-px bg-editor-border" />
        </div>

        <form
          action={githubAction}
          className="space-y-4"
          onSubmit={configMissing ? (event) => event.preventDefault() : undefined}
        >
          <GitHubButton disabled={configMissing} />
        </form>

        <p className="text-center text-sm text-gray-400">
          {mode === 'signin' ? 'Need an account? ' : 'Already have an account? '}
          <button
            className="text-blue-400 hover:text-blue-300 font-semibold"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            type="button"
            data-testid="auth-toggle-mode-button"
          >
            {mode === 'signin' ? 'Create one' : 'Sign in'}
          </button>
        </p>

        {configMissing && (
          <p className="text-xs text-gray-400 text-center">
            Update your <code>.env.local</code> with <code>NEXT_PUBLIC_SUPABASE_URL</code> and
            <code className="ml-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable authentication flows.
          </p>
        )}

        <div className="pt-4 border-t border-editor-border text-center text-xs text-gray-500 space-x-4">
          <a href="/pricing" className="hover:text-blue-400 transition-colors">Pricing</a>
          <span>·</span>
          <a href="/terms" className="hover:text-blue-400 transition-colors">Terms</a>
          <span>·</span>
          <a href="/privacy" className="hover:text-blue-400 transition-colors">Privacy</a>
          <span>·</span>
          <a href="/contact" className="hover:text-blue-400 transition-colors">Contact</a>
        </div>
      </div>
    </div>
  );
}

function SubmitButton({ mode, disabled }: { mode: AuthMode; disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="w-full flex justify-center items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-4 py-2 text-white font-semibold"
      data-testid="auth-submit-button"
    >
      {pending ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
    </button>
  );
}

function GitHubButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="w-full flex items-center justify-center gap-2 rounded-lg border border-editor-border bg-editor-bg hover:bg-white/5 transition-colors px-4 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
      data-testid="auth-github-button"
    >
      <Github className="w-4 h-4" />
      {pending ? 'Redirecting...' : 'Continue with GitHub'}
    </button>
  );
}
