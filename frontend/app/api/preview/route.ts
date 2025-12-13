import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

interface CreatePreviewRequest {
  files: Record<string, string>;
  expiresInHours?: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase configuration is missing' }, { status: 500 });
    }

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreatePreviewRequest = await request.json();
    const { files, expiresInHours = 24 } = body;

    if (!files || Object.keys(files).length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate that we have at least an index.html
    if (!files['index.html']) {
      return NextResponse.json(
        { error: 'index.html is required for preview' },
        { status: 400 }
      );
    }

    // Generate unique preview ID
    const previewId = generatePreviewId();

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    // Create preview URL record
    const { data: preview, error: dbError } = await supabase
      .from('preview_urls')
      .insert({
        user_id: user.id,
        preview_id: previewId,
        preview_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/preview/${previewId}`,
        files,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create preview' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      previewUrl: preview.preview_url,
      previewId: preview.preview_id,
      expiresAt: preview.expires_at,
    });
  } catch (error: any) {
    console.error('Preview creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve a preview
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const previewId = searchParams.get('id');

    if (!previewId) {
      return NextResponse.json(
        { error: 'Preview ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get preview (public access for non-expired previews)
    const { data: preview, error } = await supabase
      .from('preview_urls')
      .select('*')
      .eq('preview_id', previewId)
      .single();

    if (error || !preview) {
      return NextResponse.json(
        { error: 'Preview not found' },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date(preview.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Preview has expired' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      preview: {
        id: preview.preview_id,
        files: preview.files,
        expiresAt: preview.expires_at,
        createdAt: preview.created_at,
      },
    });
  } catch (error: any) {
    console.error('Error fetching preview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a preview
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const previewId = searchParams.get('id');

    if (!previewId) {
      return NextResponse.json(
        { error: 'Preview ID is required' },
        { status: 400 }
      );
    }

    // Delete preview (user can only delete their own)
    const { error: deleteError } = await supabase
      .from('preview_urls')
      .delete()
      .eq('preview_id', previewId)
      .eq('user_id', user.id);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete preview' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting preview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generate a unique preview ID
 */
function generatePreviewId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${randomStr}`;
}
