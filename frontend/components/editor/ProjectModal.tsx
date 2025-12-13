'use client';

import { useMemo, useState } from 'react';
import { X, Folder, Plus, Trash2, Search, ExternalLink } from 'lucide-react';
import type { Project } from '@/lib/projects/types';

type Props = {
  open: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectId: string | null;
  onCreate: (name: string) => void;
  onOpen: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  isBusy?: boolean;
};

export default function ProjectModal({
  open,
  onClose,
  projects,
  activeProjectId,
  onCreate,
  onOpen,
  onDelete,
  isBusy = false,
}: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projects, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true" data-testid="projects-modal">
      <div className="w-full max-w-2xl rounded-2xl border border-editor-border bg-editor-sidebar shadow-2xl">
        <div className="flex items-center justify-between border-b border-editor-border p-4">
          <div className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Projects</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white"
            aria-label="Close"
            data-testid="projects-modal-close-button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 text-gray-500 absolute left-3 top-2.5" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg bg-editor-bg border border-editor-border pl-9 pr-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search projects"
                data-testid="projects-modal-search-input"
              />
            </div>
            <button
              onClick={() => {
                const name = window.prompt('Project name:', 'My Project');
                if (!name) return;
                onCreate(name);
              }}
              disabled={isBusy}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              data-testid="projects-modal-create-button"
            >
              <Plus className="h-4 w-4" />
              New
            </button>
          </div>

          <div className="rounded-xl border border-editor-border overflow-hidden">
            <div className="max-h-[420px] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-400" data-testid="projects-modal-empty">
                  No projects found.
                </div>
              ) : (
                <ul className="divide-y divide-editor-border">
                  {filtered.map((p) => (
                    <li
                      key={p.id}
                      className={`flex items-center justify-between gap-3 p-3 hover:bg-white/5 ${
                        p.id === activeProjectId ? 'bg-white/5' : ''
                      }`}
                      data-testid={`projects-modal-row-${p.id}`}
                    >
                      <button
                        onClick={() => onOpen(p.id)}
                        className="flex-1 text-left min-w-0"
                        disabled={isBusy}
                        data-testid={`projects-modal-open-${p.id}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white truncate">{p.name}</span>
                          {p.id === activeProjectId && (
                            <span className="text-xs text-blue-300">(open)</span>
                          )}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500">
                          Updated {new Date(p.updated_at).toLocaleString()}
                        </div>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(p.id);
                          }}
                          className="rounded-lg border border-editor-border bg-editor-bg p-2 text-gray-300 hover:bg-white/5"
                          title="Copy project id"
                          data-testid={`projects-modal-copy-id-${p.id}`}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete project "${p.name}"? This cannot be undone.`)) onDelete(p.id);
                          }}
                          disabled={isBusy}
                          className="rounded-lg border border-editor-border bg-editor-bg p-2 text-red-300 hover:bg-red-500/10"
                          title="Delete"
                          data-testid={`projects-modal-delete-${p.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-500" data-testid="projects-modal-footnote">
            Note: If you haven't created the database tables yet, run <code>supabase/sql/001_projects.sql</code> in your Supabase SQL Editor.
          </p>
        </div>
      </div>
    </div>
  );
}
