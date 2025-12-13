'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import {
  Eye,
  FileCode,
  FolderOpen,
  FolderTree,
  Loader2,
  LogOut,
  Play,
  Plus,
  Settings,
  Sparkles,
  Terminal as TerminalIcon,
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
  background: #0b1220;
  color: white;
  min-height: 100vh;
  display: grid;
  place-items: center;
}

.container {
  width: min(720px, 92vw);
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 18px 40px rgba(0,0,0,0.35);
}

h1 { font-size: 28px; margin-bottom: 12px; }

p { opacity: 0.9; margin-bottom: 10px; line-height: 1.5; }

button {
  margin-top: 10px;
  border: 0;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
}

#output { margin-top: 12px; opacity: 0.95; }`,
  'script.js': `let clickCount = 0;

document.getElementById('demo-btn').addEventListener('click', () => {
  clickCount++;
  const output = document.getElementById('output');
  output.textContent = clickCount === 1 ? 'Nice! You clicked the button.' : 'Clicks: ' + clickCount;
});

console.log('FinalCode app loaded');`,
};

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

  // UI panels
  const [showFileTree, setShowFileTree] = useState(true);
  const [showAIChat, setShowAIChat] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showPreview, setShowPreview] = useState(true);

  // Modals
  const [showAISettings, setShowAISettings] = useState(false);

  // Terminal
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    '> FinalCode Terminal Ready',
    '> Create a project to enable autosave',
    '',
  ]);

  const [isRunning, setIsRunning] = useState(false);

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

    const nextActive = fileMap[activeFile] ? activeFile : Object.keys(fileMap)[0];
    setActiveFile(nextActive);

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
        setTerminalOutput((prev) => [...prev, `⚠ Projects not loaded: ${e?.message || e}`, '']);
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
        setTerminalOutput((prev) => [...prev, `✗ Failed to create project: ${e?.message || e}`, '']);
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
          setSaveStatus('idle');
          setSaveError(null);
        }
        await refreshProjects();
      } catch (e: any) {
        setTerminalOutput((prev) => [...prev, `✗ Failed to delete project: ${e?.message || e}`, '']);
      }
    },
    [activeProjectId, refreshProjects]
  );

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
      setActiveFile(filename);
    },
    [files]
  );

  const handleDeleteFile = useCallback(
    async (filename: string) => {
      if (Object.keys(files).length <= 1) return;

      setFiles((prev) => {
        const next = { ...prev };
        delete next[filename];
        return next;
      });

      if (activeFile === filename) {
        const nextActive = Object.keys(files).find((f) => f !== filename);
        if (nextActive) setActiveFile(nextActive);
      }
    },
    [activeFile, files]
  );

  const doSaveNow = useCallback(async () => {
    if (!activeProjectId) {
      setTerminalOutput((prev) => [...prev, '⚠ Create a project first to enable autosave.', '']);
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
      setTerminalOutput((prev) => [...prev, '> Running in WebContainers...', '']);

      const entry = getDefaultRunEntry(files);
      if (!entry) {
        setTerminalOutput((prev) => [
          ...prev,
          '⚠ No runnable JS entry found for Node.',
          'Create run.js (recommended) or script.js / index.js.',
          'Tip: HTML projects can be previewed in the Preview panel without Run.',
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

      setTerminalOutput((prev) => [...prev, `✓ Exit code: ${result.exitCode}`, '']);
    } catch (e: any) {
      setTerminalOutput((prev) => [...prev, `✗ Run failed: ${e?.message || e}`, '']);
    } finally {
      setIsRunning(false);
    }
  }, [files]);

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
      setActiveFile(targetFile);
      setTerminalOutput((prev) => [...prev, `> AI updated ${targetFile}`, '']);
    },
    [activeFile]
  );

  const handleReplaceAllFiles = useCallback((newFiles: Record<string, string>) => {
    setFiles(newFiles);
    setActiveFile(Object.keys(newFiles)[0]);
    setTerminalOutput((prev) => [...prev, '> AI generated new project files', '']);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-editor-bg" data-testid="editor-page">
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

      {/* Top Bar */}
      <header
        className="h-12 bg-editor-sidebar border-b border-editor-border flex items-center justify-between px-4"
        data-testid="topbar"
      >
        <div className="flex items-center gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2" data-testid="topbar-brand">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">FinalCode</span>
          </div>

          {/* Project + AI settings */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProjectsModal(true)}
              className="flex items-center gap-2 bg-editor-bg border border-editor-border hover:bg-white/5 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              data-testid="topbar-projects-button"
            >
              <FolderOpen className="w-4 h-4" />
              <span className="hidden md:inline">{activeProjectName || 'Projects'}</span>
            </button>
            <button
              onClick={() => setShowAISettings(true)}
              className="flex items-center gap-2 bg-editor-bg border border-editor-border hover:bg-white/5 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              data-testid="topbar-ai-settings-button"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden md:inline">AI Settings</span>
            </button>
          </div>

          {/* Toggle Buttons */}
          <div className="flex items-center gap-1 ml-2" data-testid="panel-toggles">
            <button
              onClick={() => setShowFileTree(!showFileTree)}
              className={`p-2 rounded hover:bg-white/10 transition-colors ${showFileTree ? 'text-blue-400' : 'text-gray-500'}`}
              title="Toggle File Tree"
              data-testid="toggle-filetree-button"
            >
              <FolderTree className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowTerminal(!showTerminal)}
              className={`p-2 rounded hover:bg-white/10 transition-colors ${showTerminal ? 'text-blue-400' : 'text-gray-500'}`}
              title="Toggle Terminal"
              data-testid="toggle-terminal-button"
            >
              <TerminalIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`p-2 rounded hover:bg-white/10 transition-colors ${showPreview ? 'text-blue-400' : 'text-gray-500'}`}
              title="Toggle Preview"
              data-testid="toggle-preview-button"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowAIChat(!showAIChat)}
              className={`p-2 rounded hover:bg-white/10 transition-colors ${showAIChat ? 'text-blue-400' : 'text-gray-500'}`}
              title="Toggle AI Chat"
              data-testid="toggle-ai-chat-button"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2" data-testid="topbar-actions">
          {userEmail && <span className="text-sm text-gray-300 hidden sm:inline">{userEmail}</span>}

          {activeProjectId && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 mr-2" data-testid="save-status-indicator">
              <span className="px-2 py-1 rounded bg-white/5 border border-editor-border">
                {saveStatus === 'saving'
                  ? 'Saving…'
                  : saveStatus === 'saved'
                    ? 'Saved'
                    : saveStatus === 'error'
                      ? 'Save error'
                      : 'Idle'}
              </span>
              {saveStatus === 'error' && saveError && (
                <span className="text-red-300 truncate max-w-[260px]" title={saveError} data-testid="save-status-error-text">
                  {saveError}
                </span>
              )}
            </div>
          )}

          <button
            onClick={() => startSignOut(() => signOut())}
            disabled={isSigningOut}
            className="flex items-center gap-2 bg-editor-bg border border-editor-border hover:bg-white/5 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            data-testid="topbar-logout-button"
          >
            {isSigningOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Logout
          </button>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            data-testid="topbar-run-button"
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Run
          </button>

          {/* Deploy + Share intentionally hidden in Scope B */}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden" data-testid="editor-layout">
        {/* File Tree */}
        {showFileTree && (
          <aside className="w-56 bg-editor-sidebar border-r border-editor-border flex flex-col" data-testid="filetree-panel">
            <div className="p-3 border-b border-editor-border flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Explorer</span>
              <button
                onClick={() => {
                  const name = prompt('Enter filename (e.g., app.js):');
                  if (name) handleCreateFile(name);
                }}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title="New File"
                data-testid="filetree-new-file-button"
              >
                <Plus className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <FileTree
              files={files}
              activeFile={activeFile}
              onSelectFile={setActiveFile}
              onDeleteFile={handleDeleteFile}
            />
          </aside>
        )}

        {/* Editor + Preview + Terminal */}
        <div className="flex-1 flex flex-col overflow-hidden" data-testid="editor-main">
          <div className="flex-1 flex overflow-hidden">
            {/* Code editor */}
            <div className={`flex-1 flex flex-col overflow-hidden ${showPreview ? 'border-r border-editor-border' : ''}`}>
              <div className="h-9 bg-editor-sidebar border-b border-editor-border flex items-center px-2 gap-1 overflow-x-auto" data-testid="editor-tabs">
                {Object.keys(files).map((filename) => (
                  <div
                    key={filename}
                    onClick={() => setActiveFile(filename)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-t text-sm cursor-pointer transition-colors ${
                      activeFile === filename
                        ? 'bg-editor-bg text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                    data-testid={`editor-tab-${filename}`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    {filename}
                  </div>
                ))}
              </div>

              <div className="flex-1 overflow-hidden" data-testid="code-editor-container">
                <CodeEditor code={files[activeFile] ?? ''} onChange={handleCodeChange} filename={activeFile} />
              </div>
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="w-1/2 flex flex-col overflow-hidden" data-testid="preview-panel">
                <div className="h-9 bg-editor-sidebar border-b border-editor-border flex items-center px-4">
                  <Eye className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-400">Preview</span>
                </div>
                <div className="flex-1 bg-white">
                  <Preview files={files} />
                </div>
              </div>
            )}
          </div>

          {showTerminal && (
            <div className="h-48 border-t border-editor-border flex flex-col" data-testid="terminal-panel">
              <div className="h-9 bg-editor-sidebar border-b border-editor-border flex items-center justify-between px-4">
                <div className="flex items-center">
                  <TerminalIcon className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-400">Terminal</span>
                </div>
                <span className="text-xs text-gray-500" data-testid="terminal-hint">Ctrl+S to save</span>
              </div>
              <Terminal output={terminalOutput} />
            </div>
          )}
        </div>

        {/* AI Chat */}
        {showAIChat && (
          <aside className="w-96 bg-editor-sidebar border-l border-editor-border flex flex-col" data-testid="ai-chat-panel">
            <div className="p-3 border-b border-editor-border flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="font-semibold text-white">AI Assistant</span>
            </div>
            <AIChat onCodeGenerated={handleAICodeGenerated} onReplaceAllFiles={handleReplaceAllFiles} currentFiles={files} />
          </aside>
        )}
      </div>
    </div>
  );
}
