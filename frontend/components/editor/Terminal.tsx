'use client';

import { useEffect, useRef } from 'react';

interface TerminalProps {
  output: string[];
}

export default function Terminal({ output }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  // Style output lines
  const styleLine = (line: string) => {
    if (line.startsWith('✓')) {
      return 'text-green-400';
    } else if (line.startsWith('✗') || line.toLowerCase().includes('error')) {
      return 'text-red-400';
    } else if (line.startsWith('>')) {
      return 'text-blue-400';
    } else if (line.startsWith('🔗')) {
      return 'text-purple-400';
    } else if (line.startsWith('⚠') || line.toLowerCase().includes('warning')) {
      return 'text-yellow-400';
    }
    return 'text-gray-300';
  };

  return (
    <div
      ref={terminalRef}
      className="flex-1 overflow-y-auto p-4 bg-editor-bg font-mono text-sm terminal-output"
    >
      {output.map((line, index) => (
        <div key={index} className={`${styleLine(line)} leading-relaxed`}>
          {line || '\u00A0'}
        </div>
      ))}
      <div className="flex items-center gap-2 text-gray-500 mt-2">
        <span className="text-green-400">❯</span>
        <span className="animate-pulse">_</span>
      </div>
    </div>
  );
}
