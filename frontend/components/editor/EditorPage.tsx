'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import {
  Copy,
  Eye,
  FileCode,
  FolderTree,
  Loader2,
  LogOut,
  Play,
  Plus,
  Rocket,
  Share2,
  Sparkles,
  Terminal as TerminalIcon,
  Zap,
} from 'lucide-react';
import { signOut } from '@/app/actions/auth';
import AIChat from '@/components/editor/AIChat';
import CodeEditor from '@/components/editor/CodeEditor';
import FileTree from '@/components/editor/FileTree';
import Preview from '@/components/editor/Preview';
import Terminal from '@/components/editor/Terminal';
import { createClient } from '@/lib/supabase/client';
import AISettingsModal from '@/components/editor/AISettingsModal';
import type { FileMap } from '@/lib/projects/types';
import { safeProjectName, getLastProjectId, setLastProjectId, clearLastProjectId } from '@/lib/projects/storage';
import {
  createProject,
  deleteProject,
  getProjectWithFiles,
  listProjects,
  upsertProjectFiles,
} from '@/lib/projects/supabaseProjects';
import { useDebouncedCallback } from '@/lib/hooks/useDebouncedCallback';
import { buildNodeRunShim, getDefaultRunEntry } from '@/lib/webcontainer/runnerUtils';
import { runNodeScript, writeFilesToWebContainer } from '@/lib/webcontainer/runner';

import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';


type EditorPageProps = {
  userEmail?: string;
};

// Default starter code
const DEFAULT_FILES: Record<string, string> = {
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
    <h1>🚀 Welcome to FinalCode!</h1>
    <p>Start building by chatting with AI on the right panel.</p>
    <p>Try saying: "Create a todo app with a modern design"</p>
    <button id="demo-btn">Click Me!</button>
    <p id="output"></p>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
  'style.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  background: white;
  padding: 3rem;
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  text-align: center;
  max-width: 500px;
}

h1 {
  color: #1a202c;
  margin-bottom: 1rem;
  font-size: 2rem;
}

p {
  color: #4a5568;
  margin-bottom: 1rem;
  line-height: 1.6;
}

button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 32px;
  font-size: 1rem;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  margin-top: 1rem;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
}

#output {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 10px;
  color: #667eea;
  font-weight: 600;
  min-height: 50px;
}`,
  'script.js': `// Welcome to FinalCode! 🎉
// This is your JavaScript file

let clickCount = 0;

document.getElementById('demo-btn').addEventListener('click', () => {
  clickCount++;
  const output = document.getElementById('output');

  if (clickCount === 1) {
    output.textContent = "Nice! You clicked the button! 🎉";
  } else {
    output.textContent = \`You've clicked \${clickCount} times! Keep going! 🚀\`;
  }
});

console.log('FinalCode app loaded! Ready to build something amazing.');`
};

export default function EditorPage({ userEmail }: EditorPageProps) {
  const [isSigningOut, startSignOut] = useTransition();

  const supabase = useMemo(() => createClient(), []);

  // Projects
  const [projects, setProjects] = useState<any[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProjectName, setActiveProjectName] = useState<string>('');
  const [showProjectsModal, setShowProjectsModal] = useState(false);

  // File system state
  const [files, setFiles] = useState<FileMap>(DEFAULT_FILES);
  const [activeFile, setActiveFile] = useState('index.html');

  // Autosave state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  // WebContainers
  const webcontainerReadyRef = useRef(false);

  // AI Settings
  const [showAISettings, setShowAISettings] = useState(false);


  // Panel visibility state
  const [showFileTree, setShowFileTree] = useState(true);
  const [showAIChat, setShowAIChat] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showPreview, setShowPreview] = useState(true);

  // Initial projects load (after openProject is defined)
  // implemented later in file

  // Terminal output
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    '> FinalCode Terminal Ready',
    '> Type your commands or click Run to execute code',
    ''
  ]);

  // Loading states
  const [isRunning, setIsRunning] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isSharingPreview, setIsSharingPreview] = useState(false);

  // Deployment state
  const [deploymentUrl, setDeploymentUrl] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Update file content
  const handleCodeChange = useCallback((newCode: string) => {
    setFiles(prev => ({
      ...prev,
      [activeFile]: newCode
    }));
  }, [activeFile]);

  // Create new file
  const handleCreateFile = useCallback((filename: string) => {
    if (!files[filename]) {
      let content = '';
      if (filename.endsWith('.html')) {
        content = '<!DOCTYPE html>\n<html>\n<head>\n  <title>New Page</title>\n</head>\n<body>\n  \n</body>\n</html>';
      } else if (filename.endsWith('.css')) {
        content = '/* New stylesheet */\n';
      } else if (filename.endsWith('.js')) {
        content = '// New JavaScript file\n';
      }
      setFiles(prev => ({ ...prev, [filename]: content }));
      setActiveFile(filename);
    }
  }, [files]);

  // Delete file
  const handleDeleteFile = useCallback((filename: string) => {
    if (Object.keys(files).length > 1) {
      const newFiles = { ...files };
      delete newFiles[filename];
      setFiles(newFiles);
      if (activeFile === filename) {
        setActiveFile(Object.keys(newFiles)[0]);
      }
    }
  }, [files, activeFile]);

  const handleDeleteFileAndPersist = useCallback(async (filename: string) => {
    handleDeleteFile(filename);
    // Persistence is handled by autosave via upsert; we don't delete db rows explicitly in MVP
  }, [handleDeleteFile]);


  const openProject = useCallback(async (projectId: string) => {
    try {
      setSaveStatus('idle');
      setSaveError(null);
      const { project, files: projectFiles } = await getProjectWithFiles(projectId);
      setActiveProjectId(project.id);
      setActiveProjectName(project.name);
      setFiles(Object.keys(projectFiles).length ? projectFiles : DEFAULT_FILES);
      setActiveFile(Object.keys(projectFiles).length ? Object.keys(projectFiles)[0] : 'index.html');
      setLastProjectId(project.id);
      setTerminalOutput((prev) => [...prev, `> Opened project: ${project.name}`, '']);
    } catch (e: any) {
      setTerminalOutput((prev) => [...prev, `✗ Failed to open project: ${e?.message || e}`, '']);
    }
  }, []);

  const refreshProjects = useCallback(async () => {
    try {
      const list = await listProjects();
      setProjects(list);
    } catch (e: any) {
      // ignore
    }
  }, []);

  // Initial projects load (after openProject is defined)
  useEffect(() => {
    (async () => {
      try {
        const list = await listProjects();
        setProjects(list);

        const last = getLastProjectId();
        if (last && list.some((p: any) => p.id === last)) {
          await openProject(last);
        }
      } catch (e: any) {
        setTerminalOutput((prev) => [...prev, `⚠ Projects not loaded: ${e?.message || e}`, '']);
      }
    })();
  }, [openProject]);

  const handleCreateProject = useCallback(async (name: string) => {
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
  }, [files, openProject, refreshProjects]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    try {
      await deleteProject(projectId);
      if (activeProjectId === projectId) {
        setActiveProjectId(null);
        setActiveProjectName('');
        clearLastProjectId();
        setFiles(DEFAULT_FILES);
        setActiveFile('index.html');
      }
      await refreshProjects();
    } catch (e: any) {
      setTerminalOutput((prev) => [...prev, `✗ Failed to delete project: ${e?.message || e}`, '']);
    }
  }, [activeProjectId, refreshProjects]);

  const doSaveNow = useCallback(async () => {
    if (!activeProjectId) return;
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

  // Auto-save when files change
  useEffect(() => {
    if (!activeProjectId) return;
    debouncedSave();
  }, [files, activeProjectId, debouncedSave]);

  // Save on Ctrl+S / Cmd+S
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

  // Run code
  const handleRun = useCallback(() => {
    setIsRunning(true);
    setTerminalOutput(prev => [...prev, '> Running code...']);

    // Simulate running
    setTimeout(() => {
      setTerminalOutput(prev => [
        ...prev,
        '✓ Code compiled successfully',
        '✓ Preview updated',
        ''
      ]);
      setIsRunning(false);
    }, 500);
  }, []);

  // Deploy code to Cloudflare Pages
  const handleDeploy = useCallback(async () => {
    try {
      setIsDeploying(true);
      setTerminalOutput(prev => [...prev, '> Deploying to Cloudflare Pages...']);

      // Get project name from user
      const projectName = prompt('Enter a name for your project:', 'my-app') || 'my-app';

      setTerminalOutput(prev => [...prev, '> Building project...']);

      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName,
          files,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Deployment failed');
      }

      setDeploymentUrl(data.deploymentUrl);
      setTerminalOutput(prev => [
        ...prev,
        '✓ Build completed',
        '✓ Deploying assets to Cloudflare...',
        `✓ Deployed successfully!`,
        `🔗 ${data.deploymentUrl}`,
        `📦 Subdomain: ${data.subdomain}.finalcode.dev`,
        ''
      ]);
    } catch (error: any) {
      console.error('Deployment error:', error);
      setTerminalOutput(prev => [
        ...prev,
        `✗ Deployment failed: ${error.message}`,
        ''
      ]);
    } finally {
      setIsDeploying(false);
    }
  }, [files]);

  // Share preview (create temporary preview URL)
  const handleSharePreview = useCallback(async () => {
    try {
      setIsSharingPreview(true);
      setTerminalOutput(prev => [...prev, '> Creating shareable preview...']);

      const response = await fetch('/api/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files,
          expiresInHours: 24,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create preview');
      }

      setPreviewUrl(data.previewUrl);

      // Copy to clipboard
      await navigator.clipboard.writeText(data.previewUrl);

      setTerminalOutput(prev => [
        ...prev,
        '✓ Preview created successfully!',
        `🔗 ${data.previewUrl}`,
        '📋 URL copied to clipboard',
        `⏰ Expires: ${new Date(data.expiresAt).toLocaleString()}`,
        ''
      ]);
    } catch (error: any) {
      console.error('Preview creation error:', error);
      setTerminalOutput(prev => [
        ...prev,
        `✗ Failed to create preview: ${error.message}`,
        ''
      ]);
    } finally {
      setIsSharingPreview(false);
    }
  }, [files]);

  // Copy deployment URL to clipboard
  const handleCopyDeploymentUrl = useCallback(async () => {
    if (deploymentUrl) {
      await navigator.clipboard.writeText(deploymentUrl);
      setTerminalOutput(prev => [...prev, '📋 Deployment URL copied to clipboard', '']);
    }
  }, [deploymentUrl]);

  // Copy preview URL to clipboard
  const handleCopyPreviewUrl = useCallback(async () => {
    if (previewUrl) {
      await navigator.clipboard.writeText(previewUrl);
      setTerminalOutput(prev => [...prev, '📋 Preview URL copied to clipboard', '']);
    }
  }, [previewUrl]);

  // Handle AI code generation
  const handleAICodeGenerated = useCallback((generatedCode: string, language: string) => {
    // Determine which file to update based on language
    let targetFile = activeFile;
    if (language === 'html' || generatedCode.includes('<!DOCTYPE') || generatedCode.includes('<html')) {
      targetFile = 'index.html';
    } else if (language === 'css' || generatedCode.includes('{') && generatedCode.includes(':') && !generatedCode.includes('function')) {
      targetFile = 'style.css';
    } else if (language === 'javascript' || language === 'js') {
      targetFile = 'script.js';
    }

    setFiles(prev => ({
      ...prev,
      [targetFile]: generatedCode
    }));
    setActiveFile(targetFile);
    setTerminalOutput(prev => [...prev, `> AI updated ${targetFile}`, '']);
  }, [activeFile]);

  // Replace all files (for complete app generation)
  const handleReplaceAllFiles = useCallback((newFiles: Record<string, string>) => {
    setFiles(newFiles);
    setActiveFile(Object.keys(newFiles)[0]);
    setTerminalOutput(prev => [...prev, '> AI generated new project files', '']);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-editor-bg">
      {/* Top Bar */}
      <header className="h-12 bg-editor-sidebar border-b border-editor-border flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">FinalCode</span>
          </div>

          {/* Toggle Buttons */}
          <div className="flex items-center gap-1 ml-4">
            <button
              onClick={() => setShowFileTree(!showFileTree)}
              className={`p-2 rounded hover:bg-white/10 transition-colors ${showFileTree ? 'text-blue-400' : 'text-gray-500'}`}
              title="Toggle File Tree"
            >
              <FolderTree className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowTerminal(!showTerminal)}
              className={`p-2 rounded hover:bg-white/10 transition-colors ${showTerminal ? 'text-blue-400' : 'text-gray-500'}`}
              title="Toggle Terminal"
            >
              <TerminalIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`p-2 rounded hover:bg-white/10 transition-colors ${showPreview ? 'text-blue-400' : 'text-gray-500'}`}
              title="Toggle Preview"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowAIChat(!showAIChat)}
              className={`p-2 rounded hover:bg-white/10 transition-colors ${showAIChat ? 'text-blue-400' : 'text-gray-500'}`}
              title="Toggle AI Chat"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {userEmail && (
            <span className="text-sm text-gray-300 hidden sm:inline">{userEmail}</span>
          )}
          <button
            onClick={() => startSignOut(() => signOut())}
            disabled={isSigningOut}
            className="flex items-center gap-2 bg-editor-bg border border-editor-border hover:bg-white/5 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            {isSigningOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Logout
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run
          </button>
          <button
            onClick={handleSharePreview}
            disabled={isSharingPreview}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            title="Create a temporary shareable preview link (expires in 24 hours)"
          >
            {isSharingPreview ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            Share
          </button>
          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            title="Deploy to Cloudflare Pages"
          >
            {isDeploying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Rocket className="w-4 h-4" />
            )}
            Deploy
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tree Sidebar */}
        {showFileTree && (
          <aside className="w-56 bg-editor-sidebar border-r border-editor-border flex flex-col">
            <div className="p-3 border-b border-editor-border flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Explorer</span>
              <button
                onClick={() => {
                  const name = prompt('Enter filename (e.g., app.js):');
                  if (name) handleCreateFile(name);
                }}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title="New File"
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

        {/* Editor & Preview Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex overflow-hidden">
            {/* Code Editor */}
            <div className={`flex-1 flex flex-col overflow-hidden ${showPreview ? 'border-r border-editor-border' : ''}`}>
              {/* Tab Bar */}
              <div className="h-9 bg-editor-sidebar border-b border-editor-border flex items-center px-2 gap-1 overflow-x-auto">
                {Object.keys(files).map(filename => (
                  <div
                    key={filename}
                    onClick={() => setActiveFile(filename)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-t text-sm cursor-pointer transition-colors ${
                      activeFile === filename
                        ? 'bg-editor-bg text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    {filename}
                  </div>
                ))}
              </div>

              {/* Editor */}
              <div className="flex-1 overflow-hidden">
                <CodeEditor
                  code={files[activeFile]}
                  onChange={handleCodeChange}
                  filename={activeFile}
                />
              </div>
            </div>

            {/* Preview Panel */}
            {showPreview && (
              <div className="w-1/2 flex flex-col overflow-hidden">
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

          {/* Terminal */}
          {showTerminal && (
            <div className="h-48 border-t border-editor-border flex flex-col">
              <div className="h-9 bg-editor-sidebar border-b border-editor-border flex items-center justify-between px-4">
                <div className="flex items-center">
                  <TerminalIcon className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-400">Terminal</span>
                </div>
                <div className="flex items-center gap-2">
                  {deploymentUrl && (
                    <button
                      onClick={handleCopyDeploymentUrl}
                      className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                      title="Copy deployment URL"
                    >
                      <Copy className="w-3 h-3" />
                      Copy Deploy URL
                    </button>
                  )}
                  {previewUrl && (
                    <button
                      onClick={handleCopyPreviewUrl}
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      title="Copy preview URL"
                    >
                      <Copy className="w-3 h-3" />
                      Copy Preview URL
                    </button>
                  )}
                </div>
              </div>
              <Terminal output={terminalOutput} />
            </div>
          )}
        </div>

        {/* AI Chat Sidebar */}
        {showAIChat && (
          <aside className="w-96 bg-editor-sidebar border-l border-editor-border flex flex-col">
            <div className="p-3 border-b border-editor-border flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="font-semibold text-white">AI Assistant</span>
            </div>
            <AIChat
              onCodeGenerated={handleAICodeGenerated}
              onReplaceAllFiles={handleReplaceAllFiles}
              currentFiles={files}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
