'use client';

import { FileCode, FileJson, FileText, File, Trash2, FolderClosed } from 'lucide-react';

interface FileTreeProps {
  files: Record<string, string>;
  activeFile: string;
  onSelectFile: (filename: string) => void;
  onDeleteFile: (filename: string) => void;
}

// Get icon and color based on file extension
function getFileInfo(filename: string): { icon: typeof FileCode; color: string } {
  const ext = filename.split('.').pop()?.toLowerCase();

  const fileTypes: Record<string, { icon: typeof FileCode; color: string }> = {
    js: { icon: FileCode, color: 'text-yellow-400' },
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
  };

  return fileTypes[ext || ''] || { icon: File, color: 'text-[#8b949e]' };
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
    <div className="flex-1 overflow-y-auto py-1">
      {fileList.map(filename => {
        const { icon: Icon, color } = getFileInfo(filename);
        const isActive = activeFile === filename;

        return (
          <div
            key={filename}
            onClick={() => onSelectFile(filename)}
            className={`
              group flex items-center justify-between px-3 py-1.5 mx-1 rounded-md cursor-pointer
              transition-all duration-150
              ${isActive
                ? 'bg-[#21262d] text-white'
                : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]'
              }
            `}
            data-testid={`filetree-item-${filename}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
              <span className="text-sm truncate">{filename}</span>
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
                data-testid={`filetree-delete-${filename}`}
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            )}
          </div>
        );
      })}

      {fileList.length === 0 && (
        <div className="px-3 py-8 text-center text-[#6e7681] text-sm">
          <FolderClosed className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No files yet</p>
          <p className="text-xs mt-1">Click + to create one</p>
        </div>
      )}
    </div>
  );
}
