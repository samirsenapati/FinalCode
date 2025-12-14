'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  GitBranch,
  Clock,
  FolderOpen,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { signOut } from '@/app/actions/auth';
import ProjectModal from '@/components/editor/ProjectModal';
import GitHubImportModal from '@/components/GitHubImportModal';
import { safeProjectName, setLastProjectId } from '@/lib/projects/storage';
import {
  createProject,
  deleteProject,
  listProjects,
} from '@/lib/projects/supabaseProjects';
import type { Project } from '@/lib/projects/types';

const DEFAULT_FILES = {
  'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My FinalCode App</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>Welcome to FinalCode</h1>
    <p>Start building by chatting with AI on the right panel.</p>
    <button id="demo-btn">Click Me!</button>
    <p id="output"></p>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
  'style.css': `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: system-ui; background: linear-gradient(135deg, #0f172a, #1e1b4b); color: white; min-height: 100vh; display: grid; place-items: center; }
.container { width: min(720px, 92vw); background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 40px; }
h1 { font-size: 32px; margin-bottom: 16px; background: linear-gradient(135deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
button { margin-top: 16px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 12px 24px; border-radius: 12px; border: 0; cursor: pointer; }`,
  'script.js': `let clickCount = 0;
document.getElementById('demo-btn').addEventListener('click', () => {
  clickCount++;
  document.getElementById('output').textContent = 'Clicks: ' + clickCount;
});`,
};

export default function HomePage({ userEmail }: { userEmail?: string }) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showGitHubImportModal, setShowGitHubImportModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      const list = await listProjects();
      setProjects(list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreateProject = useCallback(
    async (name: string) => {
      try {
        const { project } = await createProject({
          name: safeProjectName(name),
          description: null,
          initialFiles: DEFAULT_FILES,
        });
        setLastProjectId(project.id);
        setShowProjectModal(false);
        router.push('/editor');
      } catch (error) {
        console.error('Failed to create project:', error);
      }
    },
    [router]
  );

  const handleSelectProject = useCallback(
    async (projectId: string) => {
      try {
        setLastProjectId(projectId);
        router.push('/editor');
      } catch (error) {
        console.error('Failed to open project:', error);
      }
    },
    [router]
  );


  const handleGitHubImport = useCallback(
    async (repo: string, branch: string, token: string) => {
      try {
        const res = await fetch('/api/github/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'pull',
            repo,
            branch,
            token,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || 'Failed to import repository');
        }

        const files = data?.files || {};
        const { project } = await createProject({
          name: safeProjectName(repo.split('/')[1] || 'imported-project'),
          description: `Imported from ${repo}`,
          initialFiles: files,
        });

        // Save GitHub connection for the imported repo so Git panel shows correct repo
        localStorage.setItem('finalcode_github_repo', repo);
        localStorage.setItem('finalcode_github_branch', branch);
        localStorage.setItem('finalcode_github_token', token);

        setLastProjectId(project.id);
        setShowGitHubImportModal(false);
        router.push('/editor');
      } catch (error: any) {
        setImportError(error?.message || 'Failed to import from GitHub');
        throw error;
      }
    },
    [router]
  );

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    await signOut();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      <div className="border-b border-[#21262d] bg-[#161b22] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-400" />
              FinalCode
            </h1>
            <p className="text-sm text-[#8b949e]">{userEmail}</p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-12">
          <h2 className="text-4xl font-bold mb-2">What will you build today?</h2>
          <p className="text-[#8b949e]">Create a new project, edit an existing one, or sync with GitHub</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <button
            onClick={() => setShowProjectModal(true)}
            className="flex items-center gap-3 p-6 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 hover:border-blue-500/60 transition-all"
          >
            <Plus className="w-6 h-6 text-blue-400" />
            <div className="text-left">
              <div className="font-semibold">Create New Project</div>
              <div className="text-sm text-[#8b949e]">Start from scratch or use AI</div>
            </div>
          </button>

          <button
            onClick={() => setShowGitHubImportModal(true)}
            className="flex items-center gap-3 p-6 rounded-lg bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/30 hover:border-green-500/60 transition-all"
          >
            <GitBranch className="w-6 h-6 text-green-400" />
            <div className="text-left">
              <div className="font-semibold">Import from GitHub</div>
              <div className="text-sm text-[#8b949e]">Sync a repository</div>
            </div>
          </button>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#8b949e]" />
            Recent Projects
          </h3>

          {loading ? (
            <div className="text-center py-12 text-[#8b949e]">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="rounded-lg border border-[#21262d] bg-[#161b22] p-12 text-center">
              <FolderOpen className="w-12 h-12 text-[#8b949e] mx-auto mb-4 opacity-50" />
              <p className="text-[#8b949e] mb-4">No projects yet. Create your first project to get started!</p>
              <button
                onClick={() => setShowProjectModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Create Project
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => handleSelectProject(project.id)}
                  className="flex items-center justify-between p-4 rounded-lg bg-[#161b22] border border-[#21262d] hover:border-[#30363d] cursor-pointer group"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <FolderOpen className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold group-hover:text-blue-400">{project.name}</h4>
                      {project.description && <p className="text-sm text-[#8b949e]">{project.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-[#8b949e]">{formatDate(project.updated_at)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this project?')) {
                          deleteProject(project.id).then(() => loadProjects());
                        }
                      }}
                      className="px-3 py-1.5 rounded text-sm text-[#8b949e] hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showProjectModal && (
        <ProjectModal
          open={true}
          onClose={() => setShowProjectModal(false)}
          projects={projects}
          activeProjectId={null}
          onCreate={handleCreateProject}
          onOpen={handleSelectProject}
          onDelete={(projectId) => {
            deleteProject(projectId).then(() => loadProjects());
          }}
        />
      )}

      <GitHubImportModal
        open={showGitHubImportModal}
        onClose={() => {
          setShowGitHubImportModal(false);
          setImportError(null);
        }}
        onImport={handleGitHubImport}
      />
    </div>
  );
}
