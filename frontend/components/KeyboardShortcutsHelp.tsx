'use client';

import { useState } from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: ['Ctrl', 'S'], description: 'Save current file' },
  { keys: ['Ctrl', 'Shift', 'R'], description: 'Run/Refresh preview' },
  { keys: ['Ctrl', 'Shift', 'D'], description: 'Deploy project' },
  { keys: ['Ctrl', 'N'], description: 'Create new file' },
  { keys: ['Ctrl', 'F'], description: 'Search in files' },
  { keys: ['Ctrl', 'Shift', 'P'], description: 'Open command palette' },
  { keys: ['Ctrl', '`'], description: 'Toggle terminal' },
  { keys: ['Ctrl', 'I'], description: 'Toggle AI chat' },
  { keys: ['Ctrl', '/'], description: 'Show keyboard shortcuts' },
];

export default function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  // Listen for Ctrl+/ to open shortcuts help
  useState(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      // Also listen for Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  });

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-gray-800 hover:bg-gray-700 rounded-full shadow-lg border border-gray-700 transition-all z-40"
        title="Keyboard Shortcuts (Ctrl+/)"
      >
        <Keyboard className="w-5 h-5 text-white" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl max-w-2xl w-full p-8 relative border border-gray-700 shadow-2xl">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Command className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Keyboard Shortcuts</h2>
        </div>

        <div className="space-y-3">
          {SHORTCUTS.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-3 px-4 bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <span className="text-gray-300">{shortcut.description}</span>
              <div className="flex gap-2">
                {shortcut.keys.map((key, keyIndex) => (
                  <kbd
                    key={keyIndex}
                    className="px-3 py-1.5 bg-gray-700 text-white rounded-md text-sm font-mono border border-gray-600 shadow-sm"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-700">
          <p className="text-sm text-gray-400 text-center">
            Press <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Ctrl</kbd> +{' '}
            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">/</kbd> or{' '}
            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}
