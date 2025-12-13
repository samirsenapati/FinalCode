'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import {
  ChevronDown,
  Code2,
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
} from 'lucide-react';
import { signOut } from '@/app/actions/auth';
import AIChat from '@/components/editor/AIChat';
import AISettingsModal from '@/components/editor/AISettingsModal';
import CodeEditor from '@/components/editor/CodeEditor';
import FileTree from '@/components/editor/FileTree';
import Preview from '@/components/editor/Preview';
import ProjectModal from '@/components/editor/ProjectModal';
import Terminal from '@/components/editor/Terminal';
import { useDebouncedCallback } from '@/lib/hooks/useDebouncedCallback';
import { useCrossOriginIsolation } from '@/lib/hooks/useCrossOriginIsolation';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import { buildNodeRunShim, getDefaultRunEntry } from '@/lib/webcontainer/runnerUtils';
import { runNodeScript, writeFilesToWebContainer } from '@/lib/webcontainer/runner';
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

  const { isIsolated } = useCrossOriginIsolation();

  // Open files (tabs)
  const [openFiles, setOpenFiles] = useState<string[]>(['index.html']);
  const [agentStatus, setAgentStatus] = useState('Idle — ready for your next request');

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

      setTerminalOutput((prev) => [...prev, '> Running in WebContainers...', '']);

      const entry = getDefaultRunEntry(files);
      if (!entry) {
        setTerminalOutput((prev) => [
          ...prev,
          '> No runnable JS entry found for Node.',
          '> Create run.js, script.js, or index.js.',
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
    } catch (e: any) {
      setTerminalOutput((prev) => [...prev, `> Run failed: ${e?.message || e}`, '']);
    } finally {
      setIsRunning(false);
    }
  }, [files, isIsolated]);

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
          {userEmail && (
            <span className="text-xs text-[#8b949e] hidden lg:block px-2">{userEmail}</span>
          )}

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

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Icon Sidebar */}
        <div className="w-12 bg-[#0d1117] border-r border-[#21262d] flex flex-col items-center py-2 flex-shrink-0">
          <button
            onClick={() => {
              setSidebarTab('files');
              setLeftSidebarOpen(true);
            }}
            className={`sidebar-icon ${sidebarTab === 'files' && leftSidebarOpen ? 'active' : ''}`}
            title="Files"
          >
            <Files className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setSidebarTab('search');
              setLeftSidebarOpen(true);
            }}
            className={`sidebar-icon ${sidebarTab === 'search' && leftSidebarOpen ? 'active' : ''}`}
            title="Search"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setSidebarTab('git');
              setLeftSidebarOpen(true);
            }}
            className={`sidebar-icon ${sidebarTab === 'git' && leftSidebarOpen ? 'active' : ''}`}
            title="Version Control"
          >
            <GitBranch className="w-5 h-5" />
          </button>

        <div className="flex-1" />

        <button
          onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
          className="sidebar-icon"
          title={leftSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
        >
          <PanelLeftClose className={`w-5 h-5 transition-transform ${!leftSidebarOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Left Secondary Sidebar (File Tree) */}
      {leftSidebarOpen && (
        <div className="w-60 bg-[#161b22] border-r border-[#30363d] flex flex-col flex-shrink-0 animate-slide-right">
          {sidebarTab === 'files' && (
            <>
              <div className="h-10 px-3 flex items-center justify-between border-b border-[#21262d]">
                <span className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Files</span>
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
              </div>
              <FileTree
                files={files}
                activeFile={activeFile}
                onSelectFile={handleSelectFile}
                onDeleteFile={handleDeleteFile}
              />
            </>
          )}
          {sidebarTab === 'search' && (
            <div className="p-3">
              <input
                type="text"
                placeholder="Search files..."
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#6e7681] focus:outline-none focus:border-[#58a6ff]"
              />
              <p className="text-xs text-[#6e7681] mt-3 text-center">Search functionality coming soon</p>
            </div>
          )}
          {sidebarTab === 'git' && (
            <div className="p-3">
              <p className="text-xs text-[#6e7681] text-center">Version control coming soon</p>
            </div>
          )}
        </div>
      )}

      {/* Main workspace aligned to left editor/AI and right preview/output */}
      <div className="flex-1 flex overflow-hidden gap-3 p-3">
        <div className="flex-[0.55] flex flex-col bg-[#0d1117] border border-[#30363d] rounded-xl overflow-hidden">
          <div className="h-9 bg-[#161b22] border-b border-[#21262d] flex items-center overflow-x-auto flex-shrink-0">
            {openFiles.map((filename) => (
              <div
                key={filename}
                onClick={() => setActiveFile(filename)}
                className={`group flex items-center gap-2 px-3 h-full border-r border-[#21262d] cursor-pointer transition-colors min-w-0 ${
                  activeFile === filename
                    ? 'bg-[#0d1117] text-white'
                    : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
                }`}
              >
                <FileCode className={`w-3.5 h-3.5 flex-shrink-0 ${getFileIcon(filename)}`} />
                <span className="text-xs truncate">{filename}</span>
                {openFiles.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseTab(filename);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:bg-[#30363d] rounded p-0.5 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-hidden bg-[#0d1117]">
            <CodeEditor code={files[activeFile] ?? ''} onChange={handleCodeChange} filename={activeFile} />
          </div>

          <div className="h-72 border-t border-[#30363d] bg-[#0d1117] flex flex-col">
            <div className="px-4 py-3 border-b border-[#21262d] bg-[#0b0f14] flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#1f2937] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-[#58a6ff]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#8b949e] uppercase tracking-wider">AI Agent</p>
                <p className="text-sm text-white truncate" title={agentStatus}>
                  {agentStatus}
                </p>
              </div>
              <button
                onClick={() => setShowAISettings(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] rounded-lg text-sm text-white transition-colors"
              >
                <Settings className="w-4 h-4" />
                Model Settings
              </button>
            </div>

            <div className="h-12 px-4 flex items-center border-b border-[#21262d]">
              <div>
                <p className="text-xs text-[#8b949e] uppercase tracking-wider">AI Assistant</p>
                <p className="text-sm text-white">Model selection & prompts</p>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <AIChat
                onCodeGenerated={handleAICodeGenerated}
                onReplaceAllFiles={handleReplaceAllFiles}
                currentFiles={files}
                onStatusChange={setAgentStatus}
              />
            </div>
          </div>
        </div>

        <div className="flex-[0.45] flex flex-col gap-3 overflow-hidden">
          <div className="flex-1 bg-white border border-[#30363d] rounded-xl overflow-hidden flex flex-col">
            <div className="h-12 px-4 flex items-center justify-between border-b border-[#30363d] bg-[#0d1117]">
              <div className="flex items-center gap-2 text-white text-sm font-medium">
                <Eye className="w-4 h-4 text-[#58a6ff]" />
                Live Preview
              </div>
            </div>
            <div className="flex-1">
              <Preview files={files} />
            </div>
          </div>

          {bottomPanelOpen && (
            <div className="h-64 bg-[#0d1117] border border-[#30363d] rounded-xl flex flex-col overflow-hidden">
              <div className="h-10 bg-[#161b22] border-b border-[#21262d] flex items-center px-3 flex-shrink-0 rounded-t-xl">
                <button
                  onClick={() => setBottomPanelTab('console')}
                  className={`panel-tab ${bottomPanelTab === 'console' ? 'active' : ''}`}
                >
                  <Code2 className="w-3.5 h-3.5 inline mr-1.5" />
                  Console
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
                <button
                  onClick={() => setBottomPanelOpen(false)}
                  className="icon-btn p-1"
                  title="Hide Output"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 overflow-hidden">
                <Terminal output={terminalOutput} />
              </div>
            </div>
          )}
        </div>
      </div>

      {!bottomPanelOpen && (
        <button
          onClick={() => setBottomPanelOpen(true)}
          className="fixed bottom-4 right-6 z-10 flex items-center gap-2 px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] rounded-lg transition-colors text-sm text-[#8b949e] hover:text-white"
        >
          <TerminalIcon className="w-4 h-4" />
          Output
        </button>
      )}
    </div>

    </div>
  );
}
