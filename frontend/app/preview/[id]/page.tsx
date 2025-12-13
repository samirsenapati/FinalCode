'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface PreviewData {
  files: Record<string, string>;
  expiresAt: string;
  createdAt: string;
}

export default function PreviewPage() {
  const params = useParams();
  const previewId = params.id as string;
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPreview() {
      try {
        const response = await fetch(`/api/preview?id=${previewId}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to load preview');
          setLoading(false);
          return;
        }

        setPreview(data.preview);
        setLoading(false);
      } catch (err: any) {
        setError('Failed to load preview');
        setLoading(false);
      }
    }

    if (previewId) {
      fetchPreview();
    }
  }, [previewId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-editor-bg flex items-center justify-center">
        <div className="text-editor-text text-xl">Loading preview...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-editor-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-2xl mb-4">⚠️ {error}</div>
          <p className="text-editor-text">
            This preview may have expired or been removed.
          </p>
        </div>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="min-h-screen bg-editor-bg flex items-center justify-center">
        <div className="text-editor-text">Preview not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-editor-bg">
      {/* Header */}
      <div className="bg-editor-sidebar border-b border-editor-border px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-editor-accent font-semibold text-lg">
              FinalCode Preview
            </span>
            <span className="text-editor-text/60 text-sm">
              Expires: {new Date(preview.expiresAt).toLocaleString()}
            </span>
          </div>
          <a
            href="/"
            className="text-editor-accent hover:text-editor-accent/80 text-sm"
          >
            Create your own →
          </a>
        </div>
      </div>

      {/* Preview Content */}
      <PreviewRenderer files={preview.files} />
    </div>
  );
}

function PreviewRenderer({ files }: { files: Record<string, string> }) {
  const [html, setHtml] = useState('');

  useEffect(() => {
    // Get the HTML content
    let htmlContent = files['index.html'] || '';

    // Inject CSS if present
    if (files['style.css']) {
      const cssContent = files['style.css'];
      if (!htmlContent.includes('style.css') && !htmlContent.includes('<style>')) {
        htmlContent = htmlContent.replace(
          '</head>',
          `<style>${cssContent}</style>\n</head>`
        );
      }
    }

    // Inject JS if present
    if (files['script.js']) {
      const jsContent = files['script.js'];
      if (!htmlContent.includes('script.js') && !htmlContent.includes('<script>')) {
        htmlContent = htmlContent.replace(
          '</body>',
          `<script>${jsContent}</script>\n</body>`
        );
      }
    }

    setHtml(htmlContent);
  }, [files]);

  useEffect(() => {
    // Render the HTML in the iframe
    const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
    if (iframe?.contentDocument) {
      iframe.contentDocument.open();
      iframe.contentDocument.write(html);
      iframe.contentDocument.close();
    }
  }, [html]);

  return (
    <div className="h-[calc(100vh-60px)]">
      <iframe
        id="preview-iframe"
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
        title="Preview"
      />
    </div>
  );
}
