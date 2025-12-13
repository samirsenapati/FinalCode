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

  // Style output lines based on content
  const styleLine = (line: string): { color: string; prefix?: string } => {
    if (line.startsWith('✓') || line.includes('success')) {
      return { color: 'text-[#3fb950]' };
    } else if (line.startsWith('✗') || line.toLowerCase().includes('error') || line.toLowerCase().includes('failed')) {
      return { color: 'text-[#f85149]' };
    } else if (line.startsWith('>')) {
      return { color: 'text-[#58a6ff]' };
    } else if (line.startsWith('🔗') || line.startsWith('http')) {
      return { color: 'text-[#a855f7]' };
    } else if (line.startsWith('⚠') || line.toLowerCase().includes('warning') || line.toLowerCase().includes('warn')) {
      return { color: 'text-[#d29922]' };
    }
    return { color: 'text-[#8b949e]' };
  };

  return (
    <div
      ref={terminalRef}
      className="flex-1 overflow-y-auto px-4 py-3 bg-[#0d1117] font-mono text-[13px] leading-relaxed"
    >
      {output.map((line, index) => {
        const { color } = styleLine(line);
        return (
          <div key={index} className={`${color} whitespace-pre-wrap break-all`}>
            {line || '\u00A0'}
          </div>
        );
      })}

      {/* Terminal prompt */}
      <div className="flex items-center gap-2 text-[#6e7681] mt-3">
        <span className="text-[#3fb950]">$</span>
        <span className="w-2 h-4 bg-[#58a6ff] animate-pulse" />
      </div>
    </div>
  );
}
