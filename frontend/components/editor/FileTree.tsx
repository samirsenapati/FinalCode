'use client';

import { useState } from 'react';
import { FileCode, FileJson, FileText, File, Trash2, FolderClosed, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react';

interface FileTreeProps {
  files: Record<string, string>;
  activeFile: string;
  onSelectFile: (filename: string) => void;
  onDeleteFile: (filename: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: TreeNode[];
}

function getFileInfo(filename: string): { icon: typeof FileCode; color: string } {
  const ext = filename.split('.').pop()?.toLowerCase();

  const fileTypes: Record<string, { icon: typeof FileCode; color: string }> = {
    js: { icon: FileCode, color: 'text-yellow-400' },
    mjs: { icon: FileCode, color: 'text-yellow-400' },
    jsx: { icon: FileCode, color: 'text-cyan-400' },
    ts: { icon: FileCode, color: 'text-blue-500' },
    tsx: { icon: FileCode, color: 'text-cyan-500' },
    html: { icon: FileCode, color: 'text-orange-400' },
    htm: { icon: FileCode, color: 'text-orange-400' },
    css: { icon: FileCode, color: 'text-blue-400' },
    scss: { icon: FileCode, color: 'text-pink-400' },
    json: { icon: FileJson, color: 'text-yellow-300' },
    md: { icon: FileText, color: 'text-[#8b949e]' },
    txt: { icon: FileText, color: 'text-[#8b949e]' },
    py: { icon: FileCode, color: 'text-green-400' },
    rb: { icon: FileCode, color: 'text-red-400' },
    go: { icon: FileCode, color: 'text-cyan-400' },
    rs: { icon: FileCode, color: 'text-orange-500' },
    env: { icon: FileText, color: 'text-gray-400' },
    sql: { icon: FileCode, color: 'text-blue-300' },
    db: { icon: File, color: 'text-gray-500' },
  };

  return fileTypes[ext || ''] || { icon: File, color: 'text-[#8b949e]' };
}

function buildTree(files: Record<string, string>): TreeNode[] {
  const root: TreeNode[] = [];
  const paths = Object.keys(files).sort();

  for (const path of paths) {
    const parts = path.split('/');
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join('/');

      let existing = currentLevel.find(node => node.name === part);

      if (!existing) {
        existing = {
          name: part,
          path: currentPath,
          isFolder: !isFile,
          children: [],
        };
        currentLevel.push(existing);
      }

      if (!isFile) {
        currentLevel = existing.children;
      }
    }
  }

  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    return nodes.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    }).map(node => ({
      ...node,
      children: sortNodes(node.children),
    }));
  };

  return sortNodes(root);
}

interface TreeNodeProps {
  node: TreeNode;
  activeFile: string;
  onSelectFile: (filename: string) => void;
  onDeleteFile: (filename: string) => void;
  depth: number;
  fileCount: number;
}

function TreeNodeComponent({ node, activeFile, onSelectFile, onDeleteFile, depth, fileCount }: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (node.isFolder) {
    return (
      <div>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="group flex items-center justify-between px-2 py-1 mx-1 rounded-md cursor-pointer text-[#8b949e] hover:text-white hover:bg-[#161b22] transition-all duration-150"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {isOpen ? (
              <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            )}
            {isOpen ? (
              <FolderOpen className="w-4 h-4 flex-shrink-0 text-blue-400" />
            ) : (
              <FolderClosed className="w-4 h-4 flex-shrink-0 text-blue-400" />
            )}
            <span className="text-sm truncate font-medium">{node.name}</span>
          </div>
        </div>
        {isOpen && (
          <div>
            {node.children.map(child => (
              <TreeNodeComponent
                key={child.path}
                node={child}
                activeFile={activeFile}
                onSelectFile={onSelectFile}
                onDeleteFile={onDeleteFile}
                depth={depth + 1}
                fileCount={fileCount}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const { icon: Icon, color } = getFileInfo(node.name);
  const isActive = activeFile === node.path;

  return (
    <div
      onClick={() => onSelectFile(node.path)}
      className={`
        group flex items-center justify-between px-2 py-1 mx-1 rounded-md cursor-pointer
        transition-all duration-150
        ${isActive
          ? 'bg-[#21262d] text-white'
          : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]'
        }
      `}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
      data-testid={`filetree-item-${node.path}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
        <span className="text-sm truncate">{node.name}</span>
      </div>

      {fileCount > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete ${node.name}?`)) {
              onDeleteFile(node.path);
            }
          }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
          title="Delete file"
          data-testid={`filetree-delete-${node.path}`}
        >
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
        </button>
      )}
    </div>
  );
}

export default function FileTree({ files, activeFile, onSelectFile, onDeleteFile }: FileTreeProps) {
  const tree = buildTree(files);
  const fileCount = Object.keys(files).length;

  return (
    <div className="flex-1 overflow-y-auto py-1">
      {tree.map(node => (
        <TreeNodeComponent
          key={node.path}
          node={node}
          activeFile={activeFile}
          onSelectFile={onSelectFile}
          onDeleteFile={onDeleteFile}
          depth={0}
          fileCount={fileCount}
        />
      ))}

      {fileCount === 0 && (
        <div className="px-3 py-8 text-center text-[#6e7681] text-sm">
          <FolderClosed className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No files yet</p>
          <p className="text-xs mt-1">Click + to create one</p>
        </div>
      )}
    </div>
  );
}
