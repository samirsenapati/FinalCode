import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

interface DeployRequest {
  projectName: string;
  files: Record<string, string>;
}

interface CloudflareDeploymentResponse {
  success: boolean;
  result?: {
    url: string;
    id: string;
    deployment_trigger: {
      metadata: {
        commit_hash: string;
      };
    };
  };
  errors?: Array<{ message: string }>;
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

    const body: DeployRequest = await request.json();
    const { projectName, files } = body;

    if (!projectName || !files) {
      return NextResponse.json(
        { error: 'Missing required fields: projectName and files' },
        { status: 400 }
      );
    }

    // Validate project name (alphanumeric and hyphens only)
    const sanitizedProjectName = projectName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);

    // Generate unique subdomain
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const subdomain = `${sanitizedProjectName}-${randomId}`;

    // Create deployment record in database
    const { data: deployment, error: dbError } = await supabase
      .from('deployments')
      .insert({
        user_id: user.id,
        project_name: sanitizedProjectName,
        subdomain,
        deployment_url: `https://${subdomain}.finalcode.dev`,
        status: 'pending',
        files,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create deployment record' },
        { status: 500 }
      );
    }

    // Update status to building
    await supabase
      .from('deployments')
      .update({ status: 'building' })
      .eq('id', deployment.id);

    try {
      // Bundle files for deployment
      const bundledFiles = bundleStaticSite(files);

      // Update status to deploying
      await supabase
        .from('deployments')
        .update({ status: 'deploying' })
        .eq('id', deployment.id);

      // Deploy to Cloudflare Pages
      const deploymentUrl = await deployToCloudflarePages(
        subdomain,
        bundledFiles
      );

      // Update deployment record with success
      await supabase
        .from('deployments')
        .update({
          status: 'success',
          deployment_url: deploymentUrl,
        })
        .eq('id', deployment.id);

      return NextResponse.json({
        success: true,
        deploymentUrl,
        subdomain,
        deploymentId: deployment.id,
      });
    } catch (deployError: any) {
      // Update deployment record with failure
      await supabase
        .from('deployments')
        .update({
          status: 'failed',
          error_message: deployError.message,
        })
        .eq('id', deployment.id);

      return NextResponse.json(
        {
          error: 'Deployment failed',
          message: deployError.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Deployment error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Bundle static site files into a deployable format
 */
function bundleStaticSite(files: Record<string, string>): Record<string, string> {
  const bundled: Record<string, string> = {};

  // Ensure we have an index.html
  if (!files['index.html']) {
    throw new Error('index.html is required for deployment');
  }

  for (const [filename, content] of Object.entries(files)) {
    // Process HTML files - inject CSS and JS if not already linked
    if (filename.endsWith('.html')) {
      bundled[filename] = processHTML(content, files);
    } else if (filename.endsWith('.css') || filename.endsWith('.js')) {
      // Include CSS and JS files as separate files
      bundled[filename] = content;
    } else {
      // Include other files as-is
      bundled[filename] = content;
    }
  }

  // Add a _headers file for Cloudflare Pages configuration
  bundled['_headers'] = `/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin`;

  return bundled;
}

/**
 * Process HTML to ensure CSS and JS are properly linked
 */
function processHTML(html: string, files: Record<string, string>): string {
  let processedHTML = html;

  // Check if style.css exists and is not already linked
  if (files['style.css'] && !html.includes('style.css')) {
    // Add link to style.css in the head
    if (html.includes('</head>')) {
      processedHTML = processedHTML.replace(
        '</head>',
        '  <link rel="stylesheet" href="style.css">\n</head>'
      );
    }
  }

  // Check if script.js exists and is not already linked
  if (files['script.js'] && !html.includes('script.js')) {
    // Add script tag before closing body
    if (html.includes('</body>')) {
      processedHTML = processedHTML.replace(
        '</body>',
        '  <script src="script.js"></script>\n</body>'
      );
    }
  }

  return processedHTML;
}

/**
 * Deploy to Cloudflare Pages using Direct Upload API
 */
async function deployToCloudflarePages(
  subdomain: string,
  files: Record<string, string>
): Promise<string> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const projectName = process.env.CLOUDFLARE_PROJECT_NAME || 'finalcode';

  if (!accountId || !apiToken) {
    throw new Error(
      'Cloudflare credentials not configured. Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN environment variables.'
    );
  }

  try {
    // Step 1: Create a new deployment
    const deploymentResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/deployments`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          branch: subdomain,
        }),
      }
    );

    if (!deploymentResponse.ok) {
      const error = await deploymentResponse.json();
      console.error('Cloudflare API error:', error);
      throw new Error(
        `Cloudflare deployment failed: ${error.errors?.[0]?.message || 'Unknown error'}`
      );
    }

    const deploymentData: CloudflareDeploymentResponse =
      await deploymentResponse.json();

    if (!deploymentData.success || !deploymentData.result) {
      throw new Error('Failed to create Cloudflare deployment');
    }

    // Step 2: Upload files
    const formData = new FormData();

    for (const [filename, content] of Object.entries(files)) {
      const blob = new Blob([content], { type: 'text/plain' });
      formData.append('files', blob, filename);
    }

    const uploadResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/deployments/${deploymentData.result.id}/uploads`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
        body: formData,
      }
    );

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      throw new Error(
        `Failed to upload files: ${error.errors?.[0]?.message || 'Unknown error'}`
      );
    }

    // Return the deployment URL
    const deploymentUrl = deploymentData.result.url;
    return deploymentUrl;
  } catch (error: any) {
    console.error('Cloudflare deployment error:', error);
    throw new Error(`Deployment failed: ${error.message}`);
  }
}

// GET endpoint to check deployment status
export async function GET(request: NextRequest) {
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

    // Get deployment ID from query params
    const { searchParams } = new URL(request.url);
    const deploymentId = searchParams.get('id');

    if (!deploymentId) {
      // Return all deployments for the user
      const { data: deployments, error } = await supabase
        .from('deployments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch deployments' },
          { status: 500 }
        );
      }

      return NextResponse.json({ deployments });
    }

    // Get specific deployment
    const { data: deployment, error } = await supabase
      .from('deployments')
      .select('*')
      .eq('id', deploymentId)
      .eq('user_id', user.id)
      .single();

    if (error || !deployment) {
      return NextResponse.json(
        { error: 'Deployment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ deployment });
  } catch (error: any) {
    console.error('Error fetching deployment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
