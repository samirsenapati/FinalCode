'use client';

import { useEffect, useRef, useCallback } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { python } from '@codemirror/lang-python';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  filename: string;
}

// Get language extension based on filename
function getLanguageExtension(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return javascript({ jsx: true, typescript: ext.includes('ts') });
    case 'html':
    case 'htm':
      return html();
    case 'css':
    case 'scss':
      return css();
    case 'json':
      return json();
    case 'py':
      return python();
    default:
      return javascript();
  }
}

export default function CodeEditor({ code, onChange, filename }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const handleChange = useCallback((value: string) => {
    onChange(value);
  }, [onChange]);

  useEffect(() => {
    if (!editorRef.current) return;

    // Clean up existing editor
    if (viewRef.current) {
      viewRef.current.destroy();
    }

    // Create new editor state
    const state = EditorState.create({
      doc: code,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        bracketMatching(),
        autocompletion(),
        syntaxHighlighting(defaultHighlightStyle),
        vscodeDark,
        getLanguageExtension(filename),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...completionKeymap,
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            handleChange(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '14px',
          },
          '.cm-scroller': {
            fontFamily: "'JetBrains Mono', monospace",
            overflow: 'auto',
          },
          '.cm-content': {
            caretColor: '#fff',
          },
          '.cm-cursor': {
            borderLeftColor: '#fff',
          },
          '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
            backgroundColor: 'rgba(0, 122, 204, 0.3)',
          },
        }),
      ],
    });

    // Create editor view
    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [filename]); // Recreate when filename changes

  // Update content when code prop changes (from external source like AI)
  useEffect(() => {
    if (viewRef.current) {
      const currentContent = viewRef.current.state.doc.toString();
      if (currentContent !== code) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: currentContent.length,
            insert: code,
          },
        });
      }
    }
  }, [code]);

  return (
    <div 
      ref={editorRef} 
      className="h-full w-full overflow-hidden bg-editor-bg"
    />
  );
}
