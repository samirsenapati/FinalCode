'use client';

import { useState, useCallback, useMemo } from 'react';
import { Search, X, FileCode, ChevronDown, ChevronRight } from 'lucide-react';

interface SearchResult {
  filePath: string;
  lineNumber: number;
  lineContent: string;
  matchStart: number;
  matchEnd: number;
}

interface CodeSearchProps {
  files: Record<string, string>;
  onSelectFile: (filePath: string) => void;
  onGoToLine?: (filePath: string, lineNumber: number) => void;
}

export default function CodeSearch({ files, onSelectFile, onGoToLine }: CodeSearchProps) {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const searchResults = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];

    const results: SearchResult[] = [];
    const searchQuery = query.toLowerCase();

    for (const [filePath, content] of Object.entries(files)) {
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lowerLine = line.toLowerCase();
        const matchIndex = lowerLine.indexOf(searchQuery);
        
        if (matchIndex !== -1) {
          results.push({
            filePath,
            lineNumber: i + 1,
            lineContent: line.trim(),
            matchStart: matchIndex,
            matchEnd: matchIndex + query.length,
          });
        }
      }
    }

    return results.slice(0, 50);
  }, [query, files]);

  const groupedResults = useMemo(() => {
    const grouped: Record<string, SearchResult[]> = {};
    for (const result of searchResults) {
      if (!grouped[result.filePath]) {
        grouped[result.filePath] = [];
      }
      grouped[result.filePath].push(result);
    }
    return grouped;
  }, [searchResults]);

  const handleResultClick = useCallback((result: SearchResult) => {
    if (onGoToLine) {
      onGoToLine(result.filePath, result.lineNumber);
    } else {
      onSelectFile(result.filePath);
    }
  }, [onSelectFile, onGoToLine]);

  const clearSearch = () => {
    setQuery('');
  };

  return (
    <div className="border-b border-[#21262d]">
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6e7681]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder="Search in files..."
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-md pl-8 pr-8 py-1.5 text-sm text-white placeholder-[#6e7681] focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-[#21262d] rounded"
            >
              <X className="w-3.5 h-3.5 text-[#6e7681]" />
            </button>
          )}
        </div>
      </div>

      {isExpanded && query.length >= 2 && (
        <div className="max-h-64 overflow-y-auto border-t border-[#21262d]">
          {searchResults.length === 0 ? (
            <div className="px-3 py-4 text-center text-[#6e7681] text-sm">
              No results found for "{query}"
            </div>
          ) : (
            <div className="py-1">
              <div className="px-3 py-1 text-xs text-[#8b949e]">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} in {Object.keys(groupedResults).length} file{Object.keys(groupedResults).length !== 1 ? 's' : ''}
              </div>
              {Object.entries(groupedResults).map(([filePath, results]) => (
                <FileResultGroup
                  key={filePath}
                  filePath={filePath}
                  results={results}
                  query={query}
                  onResultClick={handleResultClick}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {isExpanded && query.length >= 2 && searchResults.length > 0 && (
        <div className="px-3 py-1.5 border-t border-[#21262d]">
          <button
            onClick={() => setIsExpanded(false)}
            className="text-xs text-[#58a6ff] hover:text-[#79c0ff]"
          >
            Close results
          </button>
        </div>
      )}
    </div>
  );
}

function FileResultGroup({ 
  filePath, 
  results, 
  query,
  onResultClick 
}: { 
  filePath: string; 
  results: SearchResult[];
  query: string;
  onResultClick: (result: SearchResult) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const fileName = filePath.split('/').pop() || filePath;

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-1.5 px-3 py-1 hover:bg-[#161b22] text-left"
      >
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-[#6e7681]" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-[#6e7681]" />
        )}
        <FileCode className="w-4 h-4 text-[#8b949e]" />
        <span className="text-sm text-[#c9d1d9] truncate flex-1">{fileName}</span>
        <span className="text-xs text-[#6e7681] bg-[#21262d] px-1.5 py-0.5 rounded">
          {results.length}
        </span>
      </button>

      {isOpen && (
        <div className="ml-4">
          {results.slice(0, 5).map((result, idx) => (
            <button
              key={`${result.lineNumber}-${idx}`}
              onClick={() => onResultClick(result)}
              className="w-full flex items-start gap-2 px-3 py-1 hover:bg-[#161b22] text-left"
            >
              <span className="text-xs text-[#6e7681] w-6 text-right flex-shrink-0">
                {result.lineNumber}
              </span>
              <span className="text-xs text-[#8b949e] truncate font-mono">
                <HighlightedText text={result.lineContent} query={query} />
              </span>
            </button>
          ))}
          {results.length > 5 && (
            <div className="px-3 py-1 text-xs text-[#6e7681]">
              +{results.length - 5} more matches
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="bg-yellow-500/30 text-yellow-200">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
