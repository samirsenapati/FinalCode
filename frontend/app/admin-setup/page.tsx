import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function AdminSetupPage() {
  return (
    <div className="min-h-screen bg-editor-bg text-editor-text flex items-center justify-center p-6" data-testid="admin-setup-page">
      <div className="w-full max-w-2xl rounded-2xl border border-editor-border bg-editor-sidebar p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-white" data-testid="admin-setup-title">Admin setup required</h1>
        <p className="mt-3 text-gray-300" data-testid="admin-setup-description">
          FinalCode is not configured yet. This is a SaaS app — end users should not do any setup.
        </p>

        <div className="mt-5 space-y-3 text-sm text-gray-300" data-testid="admin-setup-steps">
          <p className="font-semibold text-white">Required environment variables (Vercel):</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code>
            </li>
            <li>
              <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
            </li>
            <li>
              <code className="font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</code> (for managed AI caps)
            </li>
            <li>
              <code className="font-mono text-xs">NEXT_PUBLIC_SITE_URL</code>
            </li>
          </ul>

          <p className="font-semibold text-white mt-4">Supabase Auth redirect URLs:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <code className="font-mono text-xs">http://localhost:3000/auth/callback</code>
            </li>
            <li>
              <code className="font-mono text-xs">https://YOUR_APP.vercel.app/auth/callback</code>
            </li>
          </ul>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700"
            data-testid="admin-setup-refresh-button"
          >
            Retry
          </Link>
          <a
            href="https://vercel.com/docs/projects/environment-variables"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-blue-300 hover:text-blue-200"
            data-testid="admin-setup-vercel-docs-link"
          >
            Vercel env var docs
          </a>
        </div>
      </div>
    </div>
  );
}
