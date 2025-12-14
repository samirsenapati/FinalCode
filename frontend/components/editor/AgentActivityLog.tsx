'use client';

import { useState, useCallback } from 'react';
import {
  CheckCircle2,
  Lightbulb,
  FileEdit,
  FolderOpen,
  Brain,
  Eye,
  Loader2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Camera,
  GitBranch,
  Terminal,
  Sparkles,
} from 'lucide-react';

export type ActivityType = 
  | 'checked'
  | 'planned'
  | 'edited'
  | 'opened'
  | 'decided'
  | 'reviewed'
  | 'thinking'
  | 'screenshot'
  | 'error';

export interface ActivityStep {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  filePath?: string;
  fileContent?: string;
  timestamp: Date;
  duration?: string;
}

export interface TaskProgress {
  currentTask: number;
  totalTasks: number;
  taskName: string;
  tasks: { id: string; name: string; status: 'pending' | 'in_progress' | 'completed' }[];
}

interface AgentActivityLogProps {
  activities: ActivityStep[];
  taskProgress?: TaskProgress;
  isThinking?: boolean;
  maxVisibleItems?: number;
}

const ACTIVITY_ICONS: Record<ActivityType, { icon: React.ElementType; color: string }> = {
  checked: { icon: CheckCircle2, color: 'text-green-400' },
  planned: { icon: Lightbulb, color: 'text-yellow-400' },
  edited: { icon: FileEdit, color: 'text-blue-400' },
  opened: { icon: FolderOpen, color: 'text-purple-400' },
  decided: { icon: Brain, color: 'text-orange-400' },
  reviewed: { icon: Eye, color: 'text-cyan-400' },
  thinking: { icon: Sparkles, color: 'text-pink-400' },
  screenshot: { icon: Camera, color: 'text-emerald-400' },
  error: { icon: AlertCircle, color: 'text-red-400' },
};

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  checked: 'Checked',
  planned: 'Planned',
  edited: 'Edited',
  opened: 'Opened',
  decided: 'Decided',
  reviewed: 'Reviewed',
  thinking: 'Thinking',
  screenshot: 'Took a screenshot',
  error: 'Error',
};

function ActivityItem({ activity, isLast }: { activity: ActivityStep; isLast: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { icon: Icon, color } = ACTIVITY_ICONS[activity.type];
  const label = ACTIVITY_LABELS[activity.type];

  const hasExpandableContent = activity.fileContent && activity.fileContent.length > 0;
  const isLargeFile = activity.fileContent && activity.fileContent.split('\n').length > 10;

  return (
    <div className="relative">
      {/* Connection line */}
      {!isLast && (
        <div className="absolute left-[11px] top-6 bottom-0 w-px bg-[#30363d]" />
      )}
      
      <div className="flex gap-3 py-1.5">
        {/* Icon */}
        <div className={`w-6 h-6 flex items-center justify-center flex-shrink-0 ${color}`}>
          {activity.type === 'thinking' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Icon className="w-4 h-4" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8b949e]">{label}</span>
            {activity.duration && (
              <span className="text-xs text-[#6e7681]">({activity.duration})</span>
            )}
          </div>
          
          <p className="text-sm text-[#c9d1d9] mt-0.5">{activity.title}</p>
          
          {activity.filePath && (
            <code className="text-xs text-[#58a6ff] bg-[#161b22] px-1.5 py-0.5 rounded mt-1 inline-block font-mono">
              {activity.filePath}
            </code>
          )}

          {activity.description && !hasExpandableContent && (
            <p className="text-xs text-[#8b949e] mt-1">{activity.description}</p>
          )}

          {/* Expandable file content */}
          {hasExpandableContent && (
            <div className="mt-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-xs text-[#58a6ff] hover:text-[#79c0ff] transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                {isExpanded ? 'Hide changes' : isLargeFile ? 'Show changes (large file)' : 'Show changes'}
              </button>
              
              {isExpanded && (
                <pre className="mt-2 p-3 bg-[#0d1117] border border-[#30363d] rounded-lg overflow-x-auto text-xs text-[#c9d1d9] font-mono max-h-60 overflow-y-auto">
                  {activity.fileContent}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskProgressHeader({ progress }: { progress: TaskProgress }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const completedCount = progress.tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="border-b border-[#21262d] pb-3 mb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left hover:bg-[#161b22] -mx-2 px-2 py-1 rounded transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-[#8b949e]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[#8b949e]" />
          )}
          <span className="text-sm text-white font-medium">{progress.taskName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#8b949e]">
            {completedCount} / {progress.totalTasks}
          </span>
          <div className="w-16 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${(completedCount / progress.totalTasks) * 100}%` }}
            />
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="mt-2 ml-6 space-y-1">
          {progress.tasks.map((task, idx) => (
            <div key={task.id} className="flex items-center gap-2 text-xs">
              <span className={`w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-medium ${
                task.status === 'completed' 
                  ? 'bg-green-500/20 text-green-400' 
                  : task.status === 'in_progress'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-[#21262d] text-[#8b949e]'
              }`}>
                {idx + 1}
              </span>
              <span className={`${
                task.status === 'completed' 
                  ? 'text-[#8b949e] line-through' 
                  : task.status === 'in_progress'
                    ? 'text-white'
                    : 'text-[#8b949e]'
              }`}>
                {task.name}
              </span>
              {task.status === 'in_progress' && (
                <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AgentActivityLog({ 
  activities, 
  taskProgress,
  isThinking = false,
  maxVisibleItems = 5 
}: AgentActivityLogProps) {
  const [showAll, setShowAll] = useState(false);

  const visibleActivities = showAll ? activities : activities.slice(-maxVisibleItems);
  const hiddenCount = activities.length - maxVisibleItems;

  return (
    <div className="py-3 px-4 bg-[#0d1117] border border-[#21262d] rounded-xl">
      {/* Task Progress Header */}
      {taskProgress && <TaskProgressHeader progress={taskProgress} />}

      {/* Show more button */}
      {!showAll && hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="flex items-center gap-2 text-xs text-[#58a6ff] hover:text-[#79c0ff] mb-2 transition-colors"
        >
          <ChevronDown className="w-3 h-3" />
          Show {hiddenCount} more
        </button>
      )}

      {/* Activity list */}
      <div className="space-y-0">
        {visibleActivities.map((activity, idx) => (
          <ActivityItem 
            key={activity.id} 
            activity={activity} 
            isLast={idx === visibleActivities.length - 1 && !isThinking}
          />
        ))}

        {/* Thinking indicator */}
        {isThinking && (
          <ActivityItem
            activity={{
              id: 'thinking',
              type: 'thinking',
              title: 'Thinking...',
              timestamp: new Date(),
            }}
            isLast={true}
          />
        )}
      </div>

      {/* Collapse button */}
      {showAll && hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(false)}
          className="flex items-center gap-2 text-xs text-[#58a6ff] hover:text-[#79c0ff] mt-2 transition-colors"
        >
          <ChevronDown className="w-3 h-3 rotate-180" />
          Show less
        </button>
      )}
    </div>
  );
}

// Helper hook to manage activity log state
export function useAgentActivityLog() {
  const [activities, setActivities] = useState<ActivityStep[]>([]);
  const [taskProgress, setTaskProgress] = useState<TaskProgress | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const addActivity = useCallback((activity: Omit<ActivityStep, 'id' | 'timestamp'>) => {
    setActivities(prev => [...prev, {
      ...activity,
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    }]);
  }, []);

  const clearActivities = useCallback(() => {
    setActivities([]);
  }, []);

  const updateTaskProgress = useCallback((progress: TaskProgress) => {
    setTaskProgress(progress);
  }, []);

  const startThinking = useCallback(() => setIsThinking(true), []);
  const stopThinking = useCallback(() => setIsThinking(false), []);

  return {
    activities,
    taskProgress,
    isThinking,
    addActivity,
    clearActivities,
    updateTaskProgress,
    startThinking,
    stopThinking,
  };
}
