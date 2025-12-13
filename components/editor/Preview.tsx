'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCw, ExternalLink, Smartphone, Monitor, Tablet } from 'lucide-react';

interface PreviewProps {
  files: Record<string, string>;
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

const VIEWPORT_SIZES: Record<ViewportSize, { width: string; icon: typeof Monitor }> = {
  desktop: { width: '100%', icon: Monitor },
  tablet: { width: '768px', icon: Tablet },
  mobile: { width: '375px', icon: Smartphone },
};

export default function Preview({ files }: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [key, setKey] = useState(0); // Force iframe refresh

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

    // Find the main/App component
    const mainFile = jsxFiles.find(([filename]) =>
      filename.toLowerCase().includes('app') || filename.toLowerCase().includes('main')
    ) || jsxFiles[0];

    if (!mainFile) {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>${cssFile}</style>
        </head>
        <body>
          <div id="root"></div>
          <p style="color: #666; text-align: center; padding: 20px;">
            Create an App.jsx or main.jsx file to see the React preview.
          </p>
        </body>
        </html>
      `;
    }

    const [filename, jsxContent] = mainFile;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>React Preview</title>
        <style>${cssFile}</style>
        <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        <script>
          window.onerror = function(msg, url, line, col, error) {
            console.error('Preview Error:', msg, 'at line', line);
            document.getElementById('root').innerHTML = '<div style="color: red; padding: 20px;">Error: ' + msg + '</div>';
            return false;
          };
        </script>
      </head>
      <body>
        <div id="root"></div>
        <script type="text/babel">
          ${jsxContent}

          // Auto-render if App component exists
          const rootElement = document.getElementById('root');
          if (typeof App !== 'undefined') {
            const root = ReactDOM.createRoot(rootElement);
            root.render(<App />);
          } else {
            rootElement.innerHTML = '<p style="color: #666; padding: 20px;">Define an App component to render</p>';
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

    // If no HTML file, create a basic one
    if (!htmlFile) {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>${cssFile}</style>
        </head>
        <body>
          <p style="color: #666; text-align: center; padding: 20px;">
            Create an index.html file to see the preview.
          </p>
          <script>${jsFile}</script>
        </body>
        </html>
      `;
    }

    // Inject CSS and JS into HTML
    let previewHTML = htmlFile;

    // Replace or inject CSS
    if (cssFile) {
      if (previewHTML.includes('<link rel="stylesheet"') || previewHTML.includes("href=\"style.css\"")) {
        // Remove external CSS link and inject inline
        previewHTML = previewHTML.replace(
          /<link[^>]*href=["']style\.css["'][^>]*>/gi,
          `<style>${cssFile}</style>`
        );
      } else if (previewHTML.includes('</head>')) {
        previewHTML = previewHTML.replace('</head>', `<style>${cssFile}</style></head>`);
      }
    }

    // Replace or inject JS
    if (jsFile) {
      if (previewHTML.includes('<script src="script.js"') || previewHTML.includes("src=\"script.js\"")) {
        // Remove external JS link and inject inline
        previewHTML = previewHTML.replace(
          /<script[^>]*src=["']script\.js["'][^>]*><\/script>/gi,
          `<script>${jsFile}</script>`
        );
      } else if (previewHTML.includes('</body>')) {
        previewHTML = previewHTML.replace('</body>', `<script>${jsFile}</script></body>`);
      }
    }

    // Add error handling wrapper
    previewHTML = previewHTML.replace(
      '</head>',
      `<script>
        window.onerror = function(msg, url, line, col, error) {
          console.error('Preview Error:', msg, 'at line', line);
          return false;
        };
      </script></head>`
    );

    return previewHTML;
  };

  // Generate preview HTML based on project type
  const generatePreviewHTML = () => {
    if (isReactProject()) {
      return generateReactPreviewHTML();
    }
    return generateStaticPreviewHTML();
  };

  // Update preview when files change
  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(generatePreviewHTML());
        doc.close();
      }
    }
  }, [files, key]);

  // Refresh preview
  const handleRefresh = () => {
    setKey(k => k + 1);
  };

  // Open in new tab
  const openInNewTab = () => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(generatePreviewHTML());
      newWindow.document.close();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Preview Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-100 border-b border-gray-200">
        {/* Viewport Toggles */}
        <div className="flex items-center gap-1">
          {(Object.keys(VIEWPORT_SIZES) as ViewportSize[]).map((size) => {
            const { icon: Icon } = VIEWPORT_SIZES[size];
            return (
              <button
                key={size}
                onClick={() => setViewport(size)}
                className={`p-1.5 rounded transition-colors ${
                  viewport === size
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-500 hover:bg-gray-200'
                }`}
                title={size.charAt(0).toUpperCase() + size.slice(1)}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            className="p-1.5 text-gray-500 hover:bg-gray-200 rounded transition-colors"
            title="Refresh Preview"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openInNewTab}
            className="p-1.5 text-gray-500 hover:bg-gray-200 rounded transition-colors"
            title="Open in New Tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview Frame Container */}
      <div className="flex-1 flex items-start justify-center bg-gray-200 p-4 overflow-auto">
        <div
          className="bg-white shadow-lg transition-all duration-300 h-full"
          style={{
            width: VIEWPORT_SIZES[viewport].width,
            maxWidth: '100%',
          }}
        >
          <iframe
            ref={iframeRef}
            key={key}
            title="Preview"
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
          />
        </div>
      </div>
    </div>
  );
}
