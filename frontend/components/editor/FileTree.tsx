'use client';

import { FileCode, FileJson, FileType, Trash2, File } from 'lucide-react';

interface FileTreeProps {
  files: Record<string, string>;
  activeFile: string;
  onSelectFile: (filename: string) => void;
  onDeleteFile: (filename: string) => void;
}

// Get icon based on file extension
function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return <FileCode className="w-4 h-4 text-yellow-400" />;
    case 'html':
    case 'htm':
      return <FileCode className="w-4 h-4 text-orange-400" />;
    case 'css':
    case 'scss':
      return <FileCode className="w-4 h-4 text-blue-400" />;
    case 'json':
      return <FileJson className="w-4 h-4 text-yellow-300" />;
    case 'md':
      return <FileType className="w-4 h-4 text-gray-400" />;
    default:
      return <File className="w-4 h-4 text-gray-400" />;
  }
}

export default function FileTree({ files, activeFile, onSelectFile, onDeleteFile }: FileTreeProps) {
  const fileList = Object.keys(files).sort((a, b) => {
    // Sort by extension, then alphabetically
    const extA = a.split('.').pop() || '';
    const extB = b.split('.').pop() || '';
    if (extA !== extB) return extA.localeCompare(extB);
    return a.localeCompare(b);
  });

  return (
    <div className="flex-1 overflow-y-auto py-2">
      {fileList.map(filename => (
        <div
          key={filename}
          onClick={() => onSelectFile(filename)}
          className={`file-tree-item flex items-center justify-between px-3 py-1.5 cursor-pointer group ${
            activeFile === filename ? 'active bg-white/10' : ''
          }`}
          data-testid={`filetree-item-${filename}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {getFileIcon(filename)}
            <span className="text-sm truncate text-gray-300">{filename}</span>
          </div>
          
          {fileList.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete ${filename}?`)) {
                  onDeleteFile(filename);
                }
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
              title="Delete file"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
            </button>
          )}
        </div>
      ))}
      
      {fileList.length === 0 && (
        <div className="px-3 py-4 text-center text-gray-500 text-sm">
          No files yet. Click + to create one.
        </div>
      )}
    </div>
  );
}
