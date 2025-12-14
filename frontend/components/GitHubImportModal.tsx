'use client';

import { useState } from 'react';
import { X, GitBranch, Loader2, AlertCircle } from 'lucide-react';

interface GitHubImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (repo: string, branch: string, token: string) => Promise<void>;
}

export default function GitHubImportModal({ open, onClose, onImport }: GitHubImportModalProps) {
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('main');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!repo.trim() || !token.trim()) {
      setError('Repository and token are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onImport(repo.trim(), branch.trim() || 'main', token.trim());
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to import repository');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#21262d] bg-[#161b22] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#21262d] p-4">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-green-400" />
            <h2 className="text-lg font-semibold text-white">Import from GitHub</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          {error && (
            <div className="flex items-start gap-3 rounded-lg bg-red-500/10 border border-red-500/30 p-3">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Repository <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="owner/repository"
              disabled={loading}
              className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] disabled:opacity-50"
            />
            <p className="text-xs text-[#8b949e] mt-1">Format: owner/repo</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Branch</label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              disabled={loading}
              className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] disabled:opacity-50"
            />
            <p className="text-xs text-[#8b949e] mt-1">Default: main</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Personal Access Token <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_..."
              disabled={loading}
              className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] disabled:opacity-50"
            />
            <p className="text-xs text-[#8b949e] mt-1">
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#58a6ff] hover:underline"
              >
                Create a token
              </a>
              {' '}with repo scope
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-3 py-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !repo.trim() || !token.trim()}
              className="flex-1 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                'Import'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
