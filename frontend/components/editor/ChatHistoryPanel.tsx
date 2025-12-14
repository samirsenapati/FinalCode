'use client';

import { useState, useEffect, useCallback } from 'react';
import { History, RotateCcw, Clock, FileCode, ChevronDown, ChevronUp, Trash2, Loader2 } from 'lucide-react';
import type { ProjectCheckpoint } from '@/lib/projects/types';

interface ChatHistoryPanelProps {
  projectId: string | null;
  onRollback: (files: Record<string, string>) => void;
  currentFiles: Record<string, string>;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
}

export default function ChatHistoryPanel({ projectId, onRollback, currentFiles }: ChatHistoryPanelProps) {
  const [checkpoints, setCheckpoints] = useState<ProjectCheckpoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rollingBack, setRollingBack] = useState<string | null>(null);

  const loadCheckpoints = useCallback(async () => {
    if (!projectId) {
      setCheckpoints([]);
      return;
    }

    setLoading(true);
    try {
      const { getCheckpoints } = await import('@/lib/projects/supabaseProjects');
      const data = await getCheckpoints(projectId);
      setCheckpoints(data);
    } catch (error) {
      console.error('Failed to load checkpoints:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadCheckpoints();
  }, [loadCheckpoints]);

  const handleRollback = async (checkpoint: ProjectCheckpoint) => {
    if (rollingBack) return;
    
    setRollingBack(checkpoint.id);
    try {
      onRollback(checkpoint.files);
    } catch (error) {
      console.error('Rollback failed:', error);
    } finally {
      setRollingBack(null);
    }
  };

  const handleDelete = async (checkpointId: string) => {
    try {
      const { deleteCheckpoint } = await import('@/lib/projects/supabaseProjects');
      await deleteCheckpoint(checkpointId);
      setCheckpoints(prev => prev.filter(cp => cp.id !== checkpointId));
    } catch (error) {
      console.error('Failed to delete checkpoint:', error);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (!projectId) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Open a project to view checkpoints</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
        <p className="text-sm">Loading checkpoints...</p>
      </div>
    );
  }

  if (checkpoints.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No checkpoints yet</p>
        <p className="text-xs mt-1 text-gray-600">
          Checkpoints are created when AI generates code
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-[#21262d] flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
          <History className="w-4 h-4 text-purple-400" />
          Checkpoints
        </div>
        <button
          onClick={loadCheckpoints}
          className="p-1 hover:bg-[#21262d] rounded transition-colors"
          title="Refresh"
        >
          <RotateCcw className="w-3.5 h-3.5 text-gray-500 hover:text-gray-300" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {checkpoints.map((checkpoint, index) => {
          const isExpanded = expandedId === checkpoint.id;
          const fileCount = Object.keys(checkpoint.files).length;
          const isRollingBack = rollingBack === checkpoint.id;
          const isLatest = index === 0;

          return (
            <div
              key={checkpoint.id}
              className="border-b border-[#21262d] last:border-b-0"
            >
              <div
                className="p-3 hover:bg-[#161b22] cursor-pointer transition-colors"
                onClick={() => toggleExpanded(checkpoint.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {isLatest && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-500/20 text-green-400 rounded">
                          Latest
                        </span>
                      )}
                      <span className="text-sm font-medium text-gray-200 truncate">
                        {checkpoint.name || 'Checkpoint'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(new Date(checkpoint.created_at))}
                      <span className="text-gray-600">•</span>
                      <FileCode className="w-3 h-3" />
                      {fileCount} file{fileCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                </div>

                {checkpoint.description && (
                  <p className="mt-1 text-xs text-gray-500 truncate">
                    {checkpoint.description}
                  </p>
                )}
              </div>

              {isExpanded && (
                <div className="px-3 pb-3 space-y-2">
                  <div className="bg-[#0d1117] rounded-lg p-2 max-h-32 overflow-y-auto">
                    <p className="text-xs text-gray-400 mb-1 font-medium">Files:</p>
                    <div className="space-y-0.5">
                      {Object.keys(checkpoint.files).map(path => (
                        <div key={path} className="text-xs text-gray-500 flex items-center gap-1">
                          <FileCode className="w-3 h-3" />
                          {path}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRollback(checkpoint);
                      }}
                      disabled={isRollingBack}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-medium rounded transition-colors"
                    >
                      {isRollingBack ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Restoring...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          Rollback here
                        </>
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this checkpoint?')) {
                          handleDelete(checkpoint.id);
                        }
                      }}
                      className="p-1.5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded transition-colors"
                      title="Delete checkpoint"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
