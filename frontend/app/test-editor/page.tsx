'use client';

import EditorPage from '@/components/editor/EditorPage';

// Test page to access editor components without authentication
export default function TestEditorPage() {
  return (
    <div>
      <EditorPage userEmail="test@example.com" />
    </div>
  );
}