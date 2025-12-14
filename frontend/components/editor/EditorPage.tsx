'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import {
  ArrowDownUp,
  ChevronDown,
  Code2,
  Download,
  ExternalLink,
  Eye,
  FileCode,
  Files,
  FolderOpen,
  GitBranch,
  Loader2,
  LogOut,
  PanelLeftClose,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Terminal as TerminalIcon,
  Upload,
  X,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { signOut } from '@/app/actions/auth';
import AIChat from '@/components/editor/AIChat';
import ChatHistoryPanel from '@/components/editor/ChatHistoryPanel';
import AISettingsModal from '@/components/editor/AISettingsModal';
import CodeEditor from '@/components/editor/CodeEditor';
import FileTree from '@/components/editor/FileTree';
import Preview from '@/components/editor/Preview';
import ProjectModal from '@/components/editor/ProjectModal';
import Terminal from '@/components/editor/Terminal';
import { useDebouncedCallback } from '@/lib/hooks/useDebouncedCallback';
import { useCrossOriginIsolation } from '@/lib/hooks/useCrossOriginIsolation';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import { buildNodeRunShim, getDefaultRunEntry, isFullstackProject, getServerStartCommand, needsNpmInstall } from '@/lib/webcontainer/runnerUtils';
import { runNodeScript, writeFilesToWebContainer, installDependencies, startServer, type ServerProcess } from '@/lib/webcontainer/runner';
import type { FileMap, Project } from '@/lib/projects/types';
import { clearLastProjectId, getLastProjectId, safeProjectName, setLastProjectId } from '@/lib/projects/storage';
import {
  createProject,
  deleteProject,
  getProjectWithFiles,
  listProjects,
  upsertProjectFiles,
} from '@/lib/projects/supabaseProjects';

type EditorPageProps = {
  userEmail?: string;
};

const DEFAULT_FILES: FileMap = {
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
    <p>Try saying: "Create a todo app with a modern design"</p>
    <button id="demo-btn">Click Me!</button>
    <p id="output"></p>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
  'style.css': `* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
  color: white;
  min-height: 100vh;
  display: grid;
  place-items: center;
}

.container {
  width: min(720px, 92vw);
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  padding: 40px;
  backdrop-filter: blur(10px);
  box-shadow: 0 25px 50px rgba(0,0,0,0.4);
}

h1 {
  font-size: 32px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #60a5fa, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

p { opacity: 0.85; margin-bottom: 12px; line-height: 1.6; }

button {
  margin-top: 16px;
  border: 0;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4);
}

#output { margin-top: 16px; font-weight: 500; }`,
  'script.js': `let clickCount = 0;

document.getElementById('demo-btn').addEventListener('click', () => {
  clickCount++;
  const output = document.getElementById('output');
  output.textContent = clickCount === 1 ? 'Nice! You clicked the button.' : 'Clicks: ' + clickCount;
});

console.log('FinalCode app loaded');`,
};

type SidebarTab = 'files' | 'search' | 'git';
type BottomPanelTab = 'console' | 'terminal';
type RightPanelTab = 'preview' | 'console' | 'git' | 'history';

export default function EditorPage({ userEmail }: EditorPageProps) {
  const [isSigningOut, startSignOut] = useTransition();

  // Projects
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProjectName, setActiveProjectName] = useState<string>('');
  const [showProjectsModal, setShowProjectsModal] = useState(false);

  // File system
  const [files, setFiles] = useState<FileMap>(DEFAULT_FILES);
  const [activeFile, setActiveFile] = useState('index.html');

  // Autosave
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Panel states
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [bottomPanelOpen, setBottomPanelOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('files');
  const [bottomPanelTab, setBottomPanelTab] = useState<BottomPanelTab>('console');

  // Modals
  const [showAISettings, setShowAISettings] = useState(false);

  // Terminal
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    '> FinalCode Terminal Ready',
    '> Create a project to enable autosave',
    '',
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [serverProcess, setServerProcess] = useState<ServerProcess | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);

  const { isIsolated } = useCrossOriginIsolation();

  // Open files (tabs)
  const [openFiles, setOpenFiles] = useState<string[]>(['index.html']);
  const [agentStatus, setAgentStatus] = useState('Idle — ready for your next request');

  // Right panel tabs
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>('preview');

  // GitHub integration
  const [githubRepo, setGithubRepo] = useState('');
  const [githubBranch, setGithubBranch] = useState('main');
  const [githubToken, setGithubToken] = useState('');
  const [gitCommitMessage, setGitCommitMessage] = useState('Update via FinalCode AI');
  const [gitStatus, setGitStatus] = useState<string | null>(null);
  const [gitLoading, setGitLoading] = useState<'pull' | 'push' | 'fetch' | null>(null);
  const [lastFetchedTime, setLastFetchedTime] = useState<Date | null>(null);
  const [commitsToPush, setCommitsToPush] = useState(0);

  // Persist GitHub connection details locally for convenience
  useEffect(() => {
    const savedRepo = localStorage.getItem('finalcode_github_repo');
    const savedBranch = localStorage.getItem('finalcode_github_branch');
    const savedToken = localStorage.getItem('finalcode_github_token');

    if (savedRepo) setGithubRepo(savedRepo);
    if (savedBranch) setGithubBranch(savedBranch);
    if (savedToken) setGithubToken(savedToken);
  }, []);

  useEffect(() => {
    localStorage.setItem('finalcode_github_repo', githubRepo);
  }, [githubRepo]);

  useEffect(() => {
    localStorage.setItem('finalcode_github_branch', githubBranch);
  }, [githubBranch]);

  useEffect(() => {
    if (githubToken) {
      localStorage.setItem('finalcode_github_token', githubToken);
    } else {
      localStorage.removeItem('finalcode_github_token');
    }
  }, [githubToken]);

  const refreshProjects = useCallback(async () => {
    const list = await listProjects();
    setProjects(list);
    return list;
  }, []);

  const openProject = useCallback(async (projectId: string) => {
    const { project, files: projectFiles } = await getProjectWithFiles(projectId);

    setActiveProjectId(project.id);
    setActiveProjectName(project.name);
    setLastProjectId(project.id);

    const fileMap = Object.keys(projectFiles).length ? projectFiles : DEFAULT_FILES;
    setFiles(fileMap);

    const fileKeys = Object.keys(fileMap);
    const nextActive = fileMap[activeFile] ? activeFile : fileKeys[0];
    setActiveFile(nextActive);
    setOpenFiles([nextActive]);

    setSaveStatus('idle');
    setSaveError(null);

    setTerminalOutput((prev) => [...prev, `> Opened project: ${project.name}`, '']);
  }, [activeFile]);

  useEffect(() => {
    (async () => {
      try {
        const list = await refreshProjects();
        const last = getLastProjectId();
        if (last && list.some((p) => p.id === last)) {
          await openProject(last);
        }
      } catch (e: any) {
        setTerminalOutput((prev) => [...prev, `> Projects not loaded: ${e?.message || e}`, '']);
      }
    })();
  }, [openProject, refreshProjects]);

  const handleCreateProject = useCallback(
    async (name: string) => {
      try {
        const { project } = await createProject({
          name: safeProjectName(name),
          description: null,
          initialFiles: files,
        });
        await refreshProjects();
        await openProject(project.id);
        setShowProjectsModal(false);
      } catch (e: any) {
        setTerminalOutput((prev) => [...prev, `> Failed to create project: ${e?.message || e}`, '']);
      }
    },
    [files, openProject, refreshProjects]
  );

  const handleDeleteProject = useCallback(
    async (projectId: string) => {
      try {
        await deleteProject(projectId);
        if (activeProjectId === projectId) {
          setActiveProjectId(null);
          setActiveProjectName('');
          clearLastProjectId();
          setFiles(DEFAULT_FILES);
          setActiveFile('index.html');
          setOpenFiles(['index.html']);
          setSaveStatus('idle');
          setSaveError(null);
        }
        await refreshProjects();
      } catch (e: any) {
        setTerminalOutput((prev) => [...prev, `> Failed to delete project: ${e?.message || e}`, '']);
      }
    },
    [activeProjectId, refreshProjects]
  );

  const handleSelectFile = useCallback((filename: string) => {
    setActiveFile(filename);
    setOpenFiles((prev) => (prev.includes(filename) ? prev : [...prev, filename]));
  }, []);

  const handleCloseTab = useCallback((filename: string) => {
    setOpenFiles((prev) => {
      const next = prev.filter((f) => f !== filename);
      if (next.length === 0) {
        const firstFile = Object.keys(files)[0];
        setActiveFile(firstFile);
        return [firstFile];
      }
      if (activeFile === filename) {
        setActiveFile(next[next.length - 1]);
      }
      return next;
    });
  }, [activeFile, files]);

  const handleCodeChange = useCallback(
    (newCode: string) => {
      setFiles((prev) => ({
        ...prev,
        [activeFile]: newCode,
      }));
    },
    [activeFile]
  );

  const handleCreateFile = useCallback(
    (filename: string) => {
      if (files[filename]) return;

      let content = '';
      if (filename.endsWith('.html')) {
        content = '<!DOCTYPE html>\n<html>\n<head>\n  <title>New Page</title>\n</head>\n<body>\n\n</body>\n</html>';
      } else if (filename.endsWith('.css')) {
        content = '/* New stylesheet */\n';
      } else if (filename.endsWith('.js')) {
        content = '// New JavaScript file\n';
      }

      setFiles((prev) => ({ ...prev, [filename]: content }));
      handleSelectFile(filename);
    },
    [files, handleSelectFile]
  );

  const handleDeleteFile = useCallback(
    async (filename: string) => {
      if (Object.keys(files).length <= 1) return;

      setFiles((prev) => {
        const next = { ...prev };
        delete next[filename];
        return next;
      });

      setOpenFiles((prev) => prev.filter((f) => f !== filename));

      if (activeFile === filename) {
        const nextActive = Object.keys(files).find((f) => f !== filename);
        if (nextActive) {
          setActiveFile(nextActive);
          setOpenFiles((prev) => (prev.includes(nextActive) ? prev : [...prev, nextActive]));
        }
      }
    },
    [activeFile, files]
  );

  const doSaveNow = useCallback(async () => {
    if (!activeProjectId) {
      setTerminalOutput((prev) => [...prev, '> Create a project first to enable autosave.', '']);
      return;
    }

    setSaveStatus('saving');
    setSaveError(null);

    try {
      await upsertProjectFiles(activeProjectId, files);
      setSaveStatus('saved');
      await refreshProjects();
    } catch (e: any) {
      setSaveStatus('error');
      setSaveError(e?.message || String(e));
    }
  }, [activeProjectId, files, refreshProjects]);

  const { debounced: debouncedSave } = useDebouncedCallback(doSaveNow, 1000);

  useEffect(() => {
    if (!activeProjectId) return;
    debouncedSave();
  }, [activeProjectId, debouncedSave, files]);

  useKeyboardShortcuts([
    {
      key: 's',
      ctrl: true,
      description: 'Save project',
      action: () => {
        doSaveNow();
      },
    },
  ]);

  const handleRun = useCallback(async () => {
    try {
      setIsRunning(true);
      setBottomPanelOpen(true);
      setBottomPanelTab('console');

      if (!isIsolated) {
        setTerminalOutput((prev) => [
          ...prev,
          '> WebContainers is not available (crossOriginIsolated is false).',
          '> Run is disabled, but Preview still works.',
          '',
        ]);
        return;
      }

      // Stop any existing server
      if (serverProcess) {
        serverProcess.kill();
        setServerProcess(null);
        setServerUrl(null);
      }

      setTerminalOutput((prev) => [...prev, '> Running in WebContainers...', '']);

      // Write files to WebContainer
      await writeFilesToWebContainer(files);

      // Check if this is a fullstack project
      const isFullstack = isFullstackProject(files);

      if (isFullstack) {
        setTerminalOutput((prev) => [...prev, '> Detected fullstack project', '']);

        // Install dependencies if needed
        if (needsNpmInstall(files)) {
          setTerminalOutput((prev) => [...prev, '> Installing dependencies...', '']);
          const installResult = await installDependencies({
            onOutput: (line) => setTerminalOutput((prev) => [...prev, line]),
          });
          if (installResult.exitCode !== 0) {
            setTerminalOutput((prev) => [...prev, '> npm install failed', '']);
            return;
          }
          setTerminalOutput((prev) => [...prev, '> Dependencies installed successfully', '']);
        }

        // Start the server
        const startCmd = getServerStartCommand(files);
        setTerminalOutput((prev) => [...prev, '> Starting server...', '']);
        
        const proc = await startServer({
          command: startCmd,
          onOutput: (line) => setTerminalOutput((prev) => [...prev, line]),
          onServerReady: (url) => {
            setServerUrl(url);
            setTerminalOutput((prev) => [...prev, `> Server available at: ${url}`, '']);
          },
        });
        
        setServerProcess(proc);
        setTerminalOutput((prev) => [...prev, '> Server process started', '']);
      } else {
        // Simple script execution for non-fullstack projects
        const entry = getDefaultRunEntry(files);
        if (!entry) {
          setTerminalOutput((prev) => [
            ...prev,
            '> No runnable JS entry found for Node.',
            '> Create server.js, run.js, script.js, or index.js.',
            '> Tip: HTML projects can be previewed in the Preview panel.',
            '',
          ]);
          return;
        }

        const shimPath = 'finalcode-runner.mjs';
        await writeFilesToWebContainer({
          ...files,
          [shimPath]: buildNodeRunShim(entry),
        });

        setTerminalOutput((prev) => [...prev, `> node ${entry}`, '']);

        const result = await runNodeScript({
          entryPath: shimPath,
          onOutput: (line) => setTerminalOutput((prev) => [...prev, line]),
        });

        setTerminalOutput((prev) => [...prev, `> Exit code: ${result.exitCode}`, '']);
      }
    } catch (e: any) {
      setTerminalOutput((prev) => [...prev, `> Run failed: ${e?.message || e}`, '']);
    } finally {
      setIsRunning(false);
    }
  }, [files, isIsolated, serverProcess]);

  const handleAICodeGenerated = useCallback(
    (generatedCode: string, language: string) => {
      let targetFile = activeFile;
      if (language === 'html' || generatedCode.includes('<!DOCTYPE') || generatedCode.includes('<html')) {
        targetFile = 'index.html';
      } else if (
        language === 'css' ||
        (generatedCode.includes('{') && generatedCode.includes(':') && !generatedCode.includes('function'))
      ) {
        targetFile = 'style.css';
      } else if (language === 'javascript' || language === 'js') {
        targetFile = 'script.js';
      }

      setFiles((prev) => ({ ...prev, [targetFile]: generatedCode }));
      handleSelectFile(targetFile);
      setTerminalOutput((prev) => [...prev, `> AI updated ${targetFile}`, '']);
    },
    [activeFile, handleSelectFile]
  );

  const handleReplaceAllFiles = useCallback((newFiles: Record<string, string>) => {
    setFiles(newFiles);
    const firstFile = Object.keys(newFiles)[0];
    setActiveFile(firstFile);
    setOpenFiles([firstFile]);
    setTerminalOutput((prev) => [...prev, '> AI generated new project files', '']);
  }, []);

  const handleGithubPull = useCallback(async () => {
    if (!githubRepo.trim() || !githubToken.trim()) {
      setGitStatus('Add a repository (owner/name) and a token to pull code.');
      return;
    }

    setGitLoading('pull');
    const repo = githubRepo.trim();
    const branch = githubBranch.trim() || 'main';

    setGitStatus(`Pulling ${repo} (${branch})...`);
    setTerminalOutput((prev) => [...prev, `> Pulling ${repo} (${branch}) from GitHub...`, '']);
    setAgentStatus(`Syncing with GitHub: loading ${repo} (${branch})`);

    try {
      const res = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pull',
          repo,
          branch,
          token: githubToken.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to pull from GitHub.');
      }

      const pulledFiles = (data?.files || {}) as Record<string, string>;
      const fileNames = Object.keys(pulledFiles);
      if (fileNames.length === 0) {
        throw new Error('No files returned from GitHub.');
      }

      setFiles(pulledFiles);
      setActiveFile(fileNames[0]);
      setOpenFiles([fileNames[0]]);

      setGitStatus(`Pulled ${fileNames.length} files from ${repo} (${branch}).`);
      setTerminalOutput((prev) => [...prev, `> Pulled ${fileNames.length} files from ${repo} (${branch})`, '']);
      setAgentStatus(`Loaded code from ${repo} (${branch})`);
    } catch (error: any) {
      const message = error?.message || 'GitHub pull failed.';
      setGitStatus(message);
      setTerminalOutput((prev) => [...prev, `> GitHub pull failed: ${message}`, '']);
      setAgentStatus('Idle — ready for your next request');
    } finally {
      setGitLoading(null);
    }
  }, [githubRepo, githubBranch, githubToken]);

  const handleGithubPush = useCallback(async () => {
    if (!githubRepo.trim() || !githubToken.trim()) {
      setGitStatus('Add a repository (owner/name) and a token to push changes.');
      return;
    }

    const repo = githubRepo.trim();
    const branch = githubBranch.trim() || 'main';
    const message = gitCommitMessage.trim() || 'Update via FinalCode AI';

    setGitLoading('push');
    setGitStatus(`Pushing ${repo} (${branch})...`);
    setTerminalOutput((prev) => [...prev, `> Pushing ${repo} (${branch}) to GitHub...`, '']);
    setAgentStatus(`Syncing changes to ${repo} (${branch})`);

    try {
      const res = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'push',
          repo,
          branch,
          token: githubToken.trim(),
          files,
          message,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to push to GitHub.');
      }

      setGitStatus(`Pushed ${data?.updated ?? 0} files to ${repo} (${branch}).`);
      setTerminalOutput((prev) => [...prev, `> Pushed ${data?.updated ?? 0} files to ${repo} (${branch})`, '']);
      setAgentStatus('Synced changes to GitHub');
    } catch (error: any) {
      const message = error?.message || 'GitHub push failed.';
      setGitStatus(message);
      setTerminalOutput((prev) => [...prev, `> GitHub push failed: ${message}`, '']);
      setAgentStatus('Idle — ready for your next request');
    } finally {
      setGitLoading(null);
    }
  }, [files, gitCommitMessage, githubBranch, githubRepo, githubToken]);

  const handleGithubFetch = useCallback(async () => {
    if (!githubRepo.trim() || !githubToken.trim()) {
      setGitStatus('Add a repository and token to fetch.');
      return;
    }

    setGitLoading('fetch');
    const repo = githubRepo.trim();
    const branch = githubBranch.trim() || 'main';

    setGitStatus(`Fetching ${repo} (${branch})...`);
    setTerminalOutput((prev) => [...prev, `> Fetching ${repo} (${branch})...`, '']);

    try {
      const res = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'fetch',
          repo,
          branch,
          token: githubToken.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to fetch from GitHub.');
      }

      setLastFetchedTime(new Date());
      setCommitsToPush(data?.commitsBehind ?? 0);
      setGitStatus(`Fetched ${repo} (${branch}) successfully.`);
      setTerminalOutput((prev) => [...prev, `> Fetched ${repo} (${branch})`, '']);
    } catch (error: any) {
      const msg = error?.message || 'GitHub fetch failed.';
      setGitStatus(msg);
      setTerminalOutput((prev) => [...prev, `> GitHub fetch failed: ${msg}`, '']);
    } finally {
      setGitLoading(null);
    }
  }, [githubBranch, githubRepo, githubToken]);

  const formatLastFetched = useCallback(() => {
    if (!lastFetchedTime) return 'never';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastFetchedTime.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return lastFetchedTime.toLocaleDateString();
  }, [lastFetchedTime]);

  // File icon helper
  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const colors: Record<string, string> = {
      html: 'text-orange-400',
      css: 'text-blue-400',
      js: 'text-yellow-400',
      jsx: 'text-cyan-400',
      ts: 'text-blue-500',
      tsx: 'text-cyan-500',
      json: 'text-yellow-300',
    };
    return colors[ext || ''] || 'text-gray-400';
  };

  return (
    <div className="h-screen flex flex-col bg-[#0d1117]" data-testid="editor-page">
      <AISettingsModal
        open={showAISettings}
        onClose={() => setShowAISettings(false)}
        onSaved={() => setTerminalOutput((prev) => [...prev, '> AI settings updated', ''])}
      />

      <ProjectModal
        open={showProjectsModal}
        onClose={() => setShowProjectsModal(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        onCreate={handleCreateProject}
        onOpen={async (id) => {
          await openProject(id);
          setShowProjectsModal(false);
        }}
        onDelete={handleDeleteProject}
        isBusy={saveStatus === 'saving'}
      />

      {/* Top Header Bar - Replit Style */}
      <header className="h-12 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 pr-3 border-r border-[#30363d]">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white text-sm hidden sm:block">FinalCode</span>
          </div>

          {/* Project Dropdown */}
          <button
            onClick={() => setShowProjectsModal(true)}
            className="flex items-center gap-2 hover:bg-[#21262d] px-3 py-1.5 rounded-lg transition-colors"
          >
            <FolderOpen className="w-4 h-4 text-[#8b949e]" />
            <span className="text-sm text-white font-medium max-w-[200px] truncate">
              {activeProjectName || 'Select Project'}
            </span>
            <ChevronDown className="w-3 h-3 text-[#8b949e]" />
          </button>

          {/* Save Status */}
          {activeProjectId && (
            <div className="flex items-center gap-1.5 text-xs text-[#8b949e]">
              {saveStatus === 'saving' && (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Saving...</span>
                </>
              )}
              {saveStatus === 'saved' && <span className="text-green-400">Saved</span>}
              {saveStatus === 'error' && <span className="text-red-400">Error saving</span>}
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Git Branch */}
          <button className="flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-white px-2 py-1 rounded transition-colors">
            <GitBranch className="w-3.5 h-3.5" />
            <span className="hidden md:inline">main</span>
          </button>

          {/* AI Settings */}
          <button
            onClick={() => setShowAISettings(true)}
            className="icon-btn"
            title="AI Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User */}
          {userEmail && <span className="text-xs text-[#8b949e] hidden lg:block px-2">{userEmail}</span>}

          {/* Logout */}
          <button
            onClick={() => startSignOut(() => signOut())}
            disabled={isSigningOut}
            className="icon-btn"
            title="Logout"
          >
            {isSigningOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          </button>

          {/* Run Button */}
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-2 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ml-2"
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span className="hidden sm:inline">Run</span>
          </button>

          {/* Publish Button */}
          <button className="flex items-center gap-2 bg-[#58a6ff] hover:bg-[#79b8ff] text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Publish</span>
          </button>
        </div>
      </header>

      {/* Main Content Area - Replit Style: AI Chat Left, Preview Right */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - AI Chat */}
        <div className="w-[50%] flex flex-col bg-[#0d1117] border-r border-[#21262d]">
          {/* AI Status Header */}
          <div className="px-4 py-3 border-b border-[#21262d] bg-[#0b0f14] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{activeProjectName || 'FinalCode'}</p>
              <p className="text-xs text-[#8b949e] truncate" title={agentStatus}>
                {agentStatus}
              </p>
            </div>
            <button
              onClick={() => setShowAISettings(true)}
              className="p-2 hover:bg-[#21262d] rounded-lg transition-colors"
              title="AI Settings"
            >
              <Settings className="w-4 h-4 text-[#8b949e]" />
            </button>
          </div>

          {/* AI Chat Area */}
          <div className="flex-1 overflow-hidden">
            <AIChat
              onCodeGenerated={handleAICodeGenerated}
              onReplaceAllFiles={handleReplaceAllFiles}
              currentFiles={files}
              onStatusChange={setAgentStatus}
              projectId={activeProjectId}
              terminalOutput={terminalOutput}
              onRunApp={handleRun}
            />
          </div>

          {/* Bottom Input Hint */}
          <div className="px-4 py-2 border-t border-[#21262d] bg-[#0b0f14]">
            <p className="text-xs text-[#6e7681] text-center">
              Describe what you want to build and AI will generate the code
            </p>
          </div>
        </div>

        {/* Right Panel - Tabbed (Preview, Console, Git) */}
        <div className="flex-1 flex flex-col bg-[#161b22]">
          {/* Tab Bar - Replit Style */}
          <div className="h-10 bg-[#0d1117] border-b border-[#21262d] flex items-center px-2">
            <div
              onClick={() => setRightPanelTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors cursor-pointer ${
                rightPanelTab === 'preview'
                  ? 'bg-[#21262d] text-white'
                  : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
              <span className="ml-1 p-0.5 hover:bg-[#30363d] rounded opacity-60 hover:opacity-100">
                <X className="w-3 h-3" />
              </span>
            </div>
            <div
              onClick={() => setRightPanelTab('console')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors cursor-pointer ${
                rightPanelTab === 'console'
                  ? 'bg-[#21262d] text-white'
                  : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]'
              }`}
            >
              <TerminalIcon className="w-3.5 h-3.5" />
              Console
              <span className="ml-1 p-0.5 hover:bg-[#30363d] rounded opacity-60 hover:opacity-100">
                <X className="w-3 h-3" />
              </span>
            </div>
            <div
              onClick={() => setRightPanelTab('git')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors cursor-pointer ${
                rightPanelTab === 'git'
                  ? 'bg-[#21262d] text-white'
                  : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              Git
              <span className="ml-1 p-0.5 hover:bg-[#30363d] rounded opacity-60 hover:opacity-100">
                <X className="w-3 h-3" />
              </span>
            </div>
            <div
              onClick={() => setRightPanelTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors cursor-pointer ${
                rightPanelTab === 'history'
                  ? 'bg-[#21262d] text-white'
                  : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              History
              <span className="ml-1 p-0.5 hover:bg-[#30363d] rounded opacity-60 hover:opacity-100">
                <X className="w-3 h-3" />
              </span>
            </div>
            <div className="flex items-center justify-center w-7 h-7 text-[#8b949e] hover:text-white hover:bg-[#161b22] rounded transition-colors ml-1 cursor-pointer">
              <Plus className="w-4 h-4" />
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
                className="p-1.5 hover:bg-[#21262d] rounded transition-colors"
                title="Toggle Files"
              >
                <Files className="w-4 h-4 text-[#8b949e]" />
              </button>
            </div>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-hidden">
            {/* Preview Tab */}
            {rightPanelTab === 'preview' && (
              <div className="h-full bg-white">
                <Preview files={files} serverUrl={serverUrl} />
              </div>
            )}

            {/* Console Tab */}
            {rightPanelTab === 'console' && (
              <div className="h-full bg-[#0d1117] flex flex-col">
                <div className="h-9 bg-[#161b22] border-b border-[#21262d] flex items-center px-3 flex-shrink-0">
                  <button
                    onClick={() => setBottomPanelTab('console')}
                    className={`panel-tab ${bottomPanelTab === 'console' ? 'active' : ''}`}
                  >
                    <Code2 className="w-3.5 h-3.5 inline mr-1.5" />
                    Output
                  </button>
                  <button
                    onClick={() => setBottomPanelTab('terminal')}
                    className={`panel-tab ${bottomPanelTab === 'terminal' ? 'active' : ''}`}
                  >
                    <TerminalIcon className="w-3.5 h-3.5 inline mr-1.5" />
                    Shell
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={() => setTerminalOutput(['> FinalCode Terminal Ready', ''])}
                    className="icon-btn p-1"
                    title="Clear Console"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <Terminal output={terminalOutput} />
                </div>
              </div>
            )}

            {/* Git Tab - Replit Style */}
            {rightPanelTab === 'git' && (
              <div className="h-full bg-[#0d1117] overflow-y-auto">
                {/* Branch Selector */}
                <div className="px-4 py-3 border-b border-[#21262d]">
                  <button className="flex items-center gap-2 text-sm text-[#c9d1d9] hover:text-white">
                    <GitBranch className="w-4 h-4 text-[#8b949e]" />
                    <span>{githubBranch || 'main'}</span>
                    <ChevronDown className="w-3 h-3 text-[#8b949e]" />
                  </button>
                </div>

                {/* Remote Updates Section */}
                <div className="px-4 py-4 border-b border-[#21262d]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white">Remote Updates</h3>
                    {githubRepo && (
                      <a
                        href={`https://github.com/${githubRepo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-[#58a6ff] hover:underline"
                      >
                        {githubRepo}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[#58a6ff]">origin/{githubBranch || 'main'}</span>
                      <span className="text-[#8b949e]">- upstream</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#8b949e]">
                        last fetched {formatLastFetched()}
                      </span>
                      <button
                        onClick={handleGithubFetch}
                        disabled={gitLoading === 'fetch' || !githubRepo || !githubToken}
                        className="flex items-center gap-1 text-xs text-[#58a6ff] hover:text-[#79b8ff] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {gitLoading === 'fetch' ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                        Fetch
                      </button>
                    </div>
                  </div>

                  {commitsToPush > 0 && (
                    <p className="text-xs text-[#8b949e] mb-3">
                      {commitsToPush} commit{commitsToPush > 1 ? 's' : ''} to push
                    </p>
                  )}

                  {/* Sync with Remote Button */}
                  <button
                    onClick={async () => {
                      await handleGithubFetch();
                      await handleGithubPull();
                    }}
                    disabled={gitLoading !== null || !githubRepo || !githubToken}
                    className="w-full py-2 px-4 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-lg text-sm text-white flex items-center justify-center gap-2 mb-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowDownUp className="w-4 h-4" />
                    Sync with Remote
                  </button>

                  {/* Pull and Push Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleGithubPull}
                      disabled={gitLoading === 'pull' || !githubRepo || !githubToken}
                      className="flex-1 py-2 px-3 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-lg text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {gitLoading === 'pull' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      Pull
                    </button>
                    <button
                      onClick={handleGithubPush}
                      disabled={gitLoading === 'push' || !githubRepo || !githubToken}
                      className="flex-1 py-2 px-3 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-lg text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {gitLoading === 'push' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Push
                    </button>
                  </div>
                </div>

                {/* Commit Section */}
                <div className="px-4 py-4 border-b border-[#21262d]">
                  <h3 className="text-sm font-semibold text-white mb-3">Commit</h3>
                  <p className="text-sm text-[#8b949e]">
                    There are no changes to commit.
                  </p>
                </div>

                {/* Git Settings Section */}
                <div className="px-4 py-4">
                  <h3 className="text-sm font-semibold text-white mb-3">Git Settings</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-[#8b949e] mb-1">Repository (owner/name)</label>
                      <input
                        type="text"
                        value={githubRepo}
                        onChange={(e) => setGithubRepo(e.target.value)}
                        placeholder="e.g., username/repo"
                        className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-white placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#8b949e] mb-1">Branch</label>
                      <input
                        type="text"
                        value={githubBranch}
                        onChange={(e) => setGithubBranch(e.target.value)}
                        placeholder="main"
                        className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-white placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#8b949e] mb-1">Personal Access Token</label>
                      <input
                        type="password"
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        placeholder="ghp_..."
                        className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-white placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff]"
                      />
                      <p className="text-xs text-[#6e7681] mt-1">
                        Token needs <span className="text-[#58a6ff]">repo</span> scope (classic) or <span className="text-[#58a6ff]">Contents: Read &amp; Write</span> (fine-grained)
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs text-[#8b949e] mb-1">Commit Message</label>
                      <input
                        type="text"
                        value={gitCommitMessage}
                        onChange={(e) => setGitCommitMessage(e.target.value)}
                        placeholder="Update via FinalCode AI"
                        className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-white placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff]"
                      />
                    </div>
                  </div>

                  {gitStatus && (
                    <div className="mt-3 p-2 bg-[#161b22] rounded-lg">
                      <p className="text-xs text-[#8b949e]">{gitStatus}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* History Tab */}
            {rightPanelTab === 'history' && (
              <div className="h-full bg-[#0d1117]">
                <ChatHistoryPanel
                  projectId={activeProjectId}
                  onRollback={handleReplaceAllFiles}
                  currentFiles={files}
                />
              </div>
            )}
          </div>
        </div>

        {/* Files Sidebar (slides in from right when toggled) */}
        {leftSidebarOpen && (
          <div className="w-60 bg-[#161b22] border-l border-[#30363d] flex flex-col flex-shrink-0">
            <div className="h-10 px-3 flex items-center justify-between border-b border-[#21262d]">
              <span className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Files</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const name = prompt('Enter filename (e.g., app.js):');
                    if (name) handleCreateFile(name);
                  }}
                  className="p-1 hover:bg-[#21262d] rounded transition-colors"
                  title="New File"
                >
                  <Plus className="w-4 h-4 text-[#8b949e]" />
                </button>
                <button
                  onClick={() => setLeftSidebarOpen(false)}
                  className="p-1 hover:bg-[#21262d] rounded transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4 text-[#8b949e]" />
                </button>
              </div>
            </div>
            <FileTree
              files={files}
              activeFile={activeFile}
              onSelectFile={handleSelectFile}
              onDeleteFile={handleDeleteFile}
            />
          </div>
        )}
      </div>
    </div>
  );
}
