'use client';

import { useEffect, useRef, useState } from 'react';
import {
  RefreshCw,
  ExternalLink,
  Smartphone,
  Monitor,
  Tablet,
  ChevronLeft,
  ChevronRight,
  Globe,
  Lock,
} from 'lucide-react';

interface PreviewProps {
  files: Record<string, string>;
  serverUrl?: string | null;
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

const VIEWPORT_SIZES: Record<ViewportSize, { width: string; icon: typeof Monitor; label: string }> = {
  desktop: { width: '100%', icon: Monitor, label: 'Desktop' },
  tablet: { width: '768px', icon: Tablet, label: 'Tablet' },
  mobile: { width: '375px', icon: Smartphone, label: 'Mobile' },
};

export default function Preview({ files, serverUrl }: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [key, setKey] = useState(0);

  // Check if this is a fullstack project with server
  const isFullstackProject = () => {
    return Boolean(
      files['server.js'] ||
      files['package.json']?.includes('"express"') ||
      Object.keys(files).some(f => f.startsWith('routes/'))
    );
  };

  // Check if project uses React/JSX
  const isReactProject = () => {
    return Object.keys(files).some(
      (filename) =>
        (filename.endsWith('.jsx') || filename.endsWith('.tsx')) ||
        Object.values(files).some((content) =>
          content.includes('React') || content.includes('import React')
        )
    );
  };

  // Generate preview HTML for React projects
  const generateReactPreviewHTML = () => {
    const cssFile = files['style.css'] || '';
    const jsxFiles = Object.entries(files).filter(
      ([filename]) => filename.endsWith('.jsx') || filename.endsWith('.js') || filename.endsWith('.tsx')
    );

    const mainFile = jsxFiles.find(([filename]) =>
      filename.toLowerCase().includes('app') || filename.toLowerCase().includes('main')
    ) || jsxFiles[0];

    if (!mainFile) {
      return `
        <!DOCTYPE html>
        <html>
        <head><style>${cssFile}</style></head>
        <body style="display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5; font-family: system-ui;">
          <div style="text-align: center; color: #666;">
            <p>Create an App.jsx file to see the React preview.</p>
          </div>
        </body>
        </html>
      `;
    }

    const [, jsxContent] = mainFile;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview</title>
        <style>${cssFile}</style>
        <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        <script>
          window.onerror = function(msg, url, line) {
            document.getElementById('root').innerHTML = '<div style="color: #f85149; padding: 20px; font-family: monospace; background: #161b22; border-radius: 8px; margin: 20px;">Error: ' + msg + ' (line ' + line + ')</div>';
            return false;
          };
        </script>
      </head>
      <body>
        <div id="root"></div>
        <script type="text/babel">
          ${jsxContent}
          const rootElement = document.getElementById('root');
          if (typeof App !== 'undefined') {
            ReactDOM.createRoot(rootElement).render(<App />);
          }
        </script>
      </body>
      </html>
    `;
  };

  // Generate preview HTML for static sites
  const generateStaticPreviewHTML = () => {
    const htmlFile = files['index.html'] || '';
    const cssFile = files['style.css'] || '';
    const jsFile = files['script.js'] || '';

    if (!htmlFile) {
      return `
        <!DOCTYPE html>
        <html>
        <head><style>${cssFile}</style></head>
        <body style="display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5; font-family: system-ui;">
          <div style="text-align: center; color: #666;">
            <p>Create an index.html file to see the preview.</p>
          </div>
          <script>${jsFile}</script>
        </body>
        </html>
      `;
    }

    let previewHTML = htmlFile;

    // Inject CSS
    if (cssFile) {
      if (previewHTML.includes("href=\"style.css\"") || previewHTML.includes("href='style.css'")) {
        previewHTML = previewHTML.replace(
          /<link[^>]*href=["']style\.css["'][^>]*>/gi,
          `<style>${cssFile}</style>`
        );
      } else if (previewHTML.includes('</head>')) {
        previewHTML = previewHTML.replace('</head>', `<style>${cssFile}</style></head>`);
      }
    }

    // Inject JS
    if (jsFile) {
      if (previewHTML.includes("src=\"script.js\"") || previewHTML.includes("src='script.js'")) {
        previewHTML = previewHTML.replace(
          /<script[^>]*src=["']script\.js["'][^>]*><\/script>/gi,
          `<script>${jsFile}</script>`
        );
      } else if (previewHTML.includes('</body>')) {
        previewHTML = previewHTML.replace('</body>', `<script>${jsFile}</script></body>`);
      }
    }

    // Add error handling
    previewHTML = previewHTML.replace(
      '</head>',
      `<script>window.onerror = function(msg, url, line) { console.error('Error:', msg, 'at line', line); return false; };</script></head>`
    );

    return previewHTML;
  };

  const generatePreviewHTML = () => {
    if (isReactProject()) {
      return generateReactPreviewHTML();
    }
    return generateStaticPreviewHTML();
  };

  // Update preview when files change (for static/frontend-only projects)
  useEffect(() => {
    // If we have a server URL, use that instead of generating HTML
    if (serverUrl) return;
    
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(generatePreviewHTML());
        doc.close();
      }
    }
  }, [files, key, serverUrl]);

  const handleRefresh = () => {
    setKey(k => k + 1);
  };

  const openInNewTab = () => {
    if (serverUrl) {
      window.open(serverUrl, '_blank');
      return;
    }
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(generatePreviewHTML());
      newWindow.document.close();
    }
  };

  // Generate fullstack placeholder HTML
  const generateFullstackPlaceholder = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: system-ui, -apple-system, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            text-align: center;
            padding: 40px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 20px;
            max-width: 500px;
          }
          h1 {
            font-size: 24px;
            margin-bottom: 16px;
            background: linear-gradient(135deg, #60a5fa, #a78bfa);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          p { opacity: 0.8; margin-bottom: 12px; line-height: 1.6; }
          .icon { font-size: 48px; margin-bottom: 16px; }
          .hint {
            background: rgba(59, 130, 246, 0.2);
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            margin-top: 16px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">🚀</div>
          <h1>Fullstack Project Detected</h1>
          <p>This is a fullstack project with a backend server.</p>
          <p>Click the <strong>Run</strong> button to start the server and see the preview.</p>
          <div class="hint">
            💡 The server will install dependencies and start automatically.
          </div>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="h-full flex flex-col bg-[#0d1117]">
      {/* Browser-like URL Bar */}
      <div className="h-10 bg-[#161b22] border-b border-[#21262d] flex items-center gap-2 px-2">
        {/* Navigation Buttons */}
        <div className="flex items-center gap-0.5">
          <button className="p-1.5 text-[#6e7681] hover:text-[#8b949e] rounded transition-colors" disabled>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-[#6e7681] hover:text-[#8b949e] rounded transition-colors" disabled>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleRefresh}
            className="p-1.5 text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* URL Bar */}
        <div className="flex-1 flex items-center gap-2 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-1 mx-1">
          {serverUrl ? (
            <Globe className="w-3.5 h-3.5 text-[#58a6ff]" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-[#3fb950]" />
          )}
          <span className="text-sm text-[#8b949e] truncate">
            {serverUrl || (isFullstackProject() ? 'Click Run to start server' : 'localhost:3000')}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Viewport Toggles */}
          {(Object.keys(VIEWPORT_SIZES) as ViewportSize[]).map((size) => {
            const { icon: Icon } = VIEWPORT_SIZES[size];
            return (
              <button
                key={size}
                onClick={() => setViewport(size)}
                className={`p-1.5 rounded transition-colors ${
                  viewport === size
                    ? 'bg-[#21262d] text-[#58a6ff]'
                    : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
                }`}
                title={VIEWPORT_SIZES[size].label}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}

          <div className="w-px h-5 bg-[#30363d] mx-1" />

          <button
            onClick={openInNewTab}
            className="p-1.5 text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded transition-colors"
            title="Open in New Tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview Frame Container */}
      <div className="flex-1 flex items-start justify-center bg-[#161b22] p-4 overflow-auto">
        <div
          className="bg-white rounded-lg overflow-hidden shadow-2xl transition-all duration-300 h-full"
          style={{
            width: VIEWPORT_SIZES[viewport].width,
            maxWidth: '100%',
          }}
        >
          {serverUrl ? (
            <iframe
              key={key}
              src={serverUrl}
              title="Server Preview"
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
            />
          ) : isFullstackProject() ? (
            <iframe
              ref={iframeRef}
              key={key}
              srcDoc={generateFullstackPlaceholder()}
              title="Fullstack Preview"
              className="w-full h-full border-0"
            />
          ) : (
            <iframe
              ref={iframeRef}
              key={key}
              title="Preview"
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
            />
          )}
        </div>
      </div>
    </div>
  );
}
