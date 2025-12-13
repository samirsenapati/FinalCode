'use client';

import { useEffect } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

export const KEYBOARD_SHORTCUTS = {
  SAVE: { key: 's', ctrl: true, description: 'Save current file' },
  RUN: { key: 'r', ctrl: true, shift: true, description: 'Run/Refresh preview' },
  DEPLOY: { key: 'd', ctrl: true, shift: true, description: 'Deploy project' },
  NEW_FILE: { key: 'n', ctrl: true, description: 'Create new file' },
  SEARCH: { key: 'f', ctrl: true, description: 'Search in files' },
  COMMAND_PALETTE: { key: 'p', ctrl: true, shift: true, description: 'Open command palette' },
  TOGGLE_TERMINAL: { key: '`', ctrl: true, description: 'Toggle terminal' },
  TOGGLE_AI_CHAT: { key: 'i', ctrl: true, description: 'Toggle AI chat' },
};
