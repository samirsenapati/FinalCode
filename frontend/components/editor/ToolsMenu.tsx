'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  GitBranch,
  History,
  Eye,
  FolderOpen,
  Search,
  Lock,
  Settings,
  Play,
  Database,
  Shield,
  Key,
  Plug,
  Upload,
  X,
} from 'lucide-react';

export type ToolId = 'preview' | 'console' | 'git' | 'history' | 'shell' | 'files';

interface Tool {
  id: ToolId;
  label: string;
  description: string;
  icon: React.ElementType;
  category: 'your-app' | 'jump' | 'suggested' | 'files';
}

const TOOLS: Tool[] = [
  { id: 'console', label: 'Console', description: 'View the terminal output after running your code', icon: Terminal, category: 'your-app' },
  { id: 'preview', label: 'Preview', description: 'Preview your App', icon: Eye, category: 'jump' },
  { id: 'git', label: 'Git', description: 'Version control for your App', icon: GitBranch, category: 'suggested' },
  { id: 'history', label: 'History', description: 'View checkpoints and rollback', icon: History, category: 'suggested' },
  { id: 'shell', label: 'Shell', description: 'Directly access your App through a command line interface', icon: Terminal, category: 'suggested' },
  { id: 'files', label: 'Files', description: 'Find a file', icon: FolderOpen, category: 'files' },
];

interface ToolsMenuProps {
  openTabs: ToolId[];
  onOpenTool: (toolId: ToolId) => void;
  onClose: () => void;
}

export default function ToolsMenu({ openTabs, onOpenTool, onClose }: ToolsMenuProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const filteredTools = TOOLS.filter(tool =>
    tool.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const yourAppTools = filteredTools.filter(t => t.category === 'your-app');
  const jumpTools = filteredTools.filter(t => t.category === 'jump' && openTabs.includes(t.id));
  const suggestedTools = filteredTools.filter(t => t.category === 'suggested');
  const filesTools = filteredTools.filter(t => t.category === 'files');

  const handleSelectTool = (toolId: ToolId) => {
    onOpenTool(toolId);
    onClose();
  };

  const renderToolItem = (tool: Tool) => {
    const Icon = tool.icon;
    const isOpen = openTabs.includes(tool.id);
    
    return (
      <button
        key={tool.id}
        onClick={() => handleSelectTool(tool.id)}
        className="w-full flex items-start gap-3 px-3 py-2 hover:bg-[#21262d] rounded-lg transition-colors text-left"
      >
        <div className="w-5 h-5 flex items-center justify-center text-[#8b949e] mt-0.5">
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white">{tool.label}</span>
            {isOpen && (
              <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">Open</span>
            )}
          </div>
          <p className="text-xs text-[#8b949e] truncate">{tool.description}</p>
        </div>
      </button>
    );
  };

  return (
    <div
      ref={menuRef}
      className="absolute top-full left-0 mt-1 w-80 max-h-[70vh] bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden z-50"
    >
      <div className="p-2 border-b border-[#21262d]">
        <div className="flex items-center gap-2 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-[#8b949e]" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for tools & files..."
            className="flex-1 bg-transparent text-sm text-white placeholder-[#6e7681] outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-[#8b949e] hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-y-auto max-h-[60vh] p-2 space-y-3">
        {yourAppTools.length > 0 && (
          <div>
            <p className="text-xs text-[#8b949e] font-medium px-3 py-1">Your App</p>
            {yourAppTools.map(renderToolItem)}
          </div>
        )}

        {jumpTools.length > 0 && (
          <div>
            <p className="text-xs text-[#8b949e] font-medium px-3 py-1">Jump to existing tab</p>
            {jumpTools.map(renderToolItem)}
          </div>
        )}

        {suggestedTools.length > 0 && (
          <div>
            <p className="text-xs text-[#8b949e] font-medium px-3 py-1">Suggested</p>
            {suggestedTools.map(renderToolItem)}
          </div>
        )}

        {filesTools.length > 0 && (
          <div>
            <p className="text-xs text-[#8b949e] font-medium px-3 py-1">Files</p>
            {filesTools.map(renderToolItem)}
          </div>
        )}

        {filteredTools.length === 0 && (
          <div className="text-center py-6 text-[#8b949e] text-sm">
            No tools found for "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
}
