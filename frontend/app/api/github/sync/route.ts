import { Buffer } from 'node:buffer';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

type SyncAction = 'pull' | 'push';

type GithubSyncRequest = {
  action: SyncAction;
  repo: string;
  branch?: string;
  token: string;
  files?: Record<string, string>;
  message?: string;
};

type GithubTreeItem = {
  path: string;
  type: 'blob' | 'tree';
};

const githubHeaders = (token: string) => ({
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'X-GitHub-Api-Version': '2022-11-28',
});

async function fetchJson(url: string, token: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...githubHeaders(token),
      ...(init?.headers || {}),
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || `GitHub request failed (${res.status})`);
  }
  return data;
}

function parseRepo(repo: string) {
  const [owner, name] = repo.split('/');
  if (!owner || !name) {
    throw new Error('Repository must be in the format "owner/name"');
  }
  return { owner, name };
}

async function pullRepository({ repo, branch, token }: { repo: string; branch: string; token: string }) {
  const { owner, name } = parseRepo(repo);

  const branchData = await fetchJson(`https://api.github.com/repos/${owner}/${name}/branches/${branch}`, token);
  const treeSha = branchData?.commit?.commit?.tree?.sha;
  if (!treeSha) {
    throw new Error('Unable to resolve repository tree SHA');
  }

  const treeResponse = await fetchJson(
    `https://api.github.com/repos/${owner}/${name}/git/trees/${treeSha}?recursive=1`,
    token
  );

  const tree: GithubTreeItem[] = treeResponse?.tree || [];
  const files: Record<string, string> = {};

  for (const item of tree) {
    if (item.type !== 'blob') continue;

    const contentData = await fetchJson(
      `https://api.github.com/repos/${owner}/${name}/contents/${encodeURIComponent(item.path)}?ref=${branch}`,
      token
    );

    const encoding = contentData?.encoding === 'base64' ? 'base64' : null;
    if (!encoding || !contentData?.content) continue;

    const buffer = Buffer.from(contentData.content, 'base64');
    files[item.path] = buffer.toString('utf-8');
  }

  return files;
}

async function pushRepository({
  repo,
  branch,
  token,
  files,
  message,
}: {
  repo: string;
  branch: string;
  token: string;
  files: Record<string, string>;
  message: string;
}) {
  const { owner, name } = parseRepo(repo);
  let updated = 0;

  for (const [path, content] of Object.entries(files)) {
    const encoded = Buffer.from(content).toString('base64');

    // Retrieve SHA if file exists to avoid conflicts
    let sha: string | undefined;
    const metaRes = await fetch(
      `https://api.github.com/repos/${owner}/${name}/contents/${encodeURIComponent(path)}?ref=${branch}`,
      {
        headers: githubHeaders(token),
      }
    );

    if (metaRes.ok) {
      const fileMeta = await metaRes.json();
      sha = fileMeta?.sha;
    } else if (metaRes.status !== 404) {
      const details = await metaRes.json().catch(() => ({}));
      throw new Error(details?.message || `Failed to inspect ${path} (${metaRes.status})`);
    }

    await fetchJson(`https://api.github.com/repos/${owner}/${name}/contents/${encodeURIComponent(path)}`, token, {
      method: 'PUT',
      body: JSON.stringify({
        message,
        content: encoded,
        branch,
        sha,
      }),
    });

    updated += 1;
  }

  return updated;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GithubSyncRequest;
    const { action, repo, branch = 'main', token, files = {}, message = 'Update via FinalCode AI' } = body;

    if (!action || !repo || !token) {
      return NextResponse.json({ error: 'action, repo, and token are required.' }, { status: 400 });
    }

    if (action === 'pull') {
      const pulled = await pullRepository({ repo, branch, token });
      return NextResponse.json({ files: pulled });
    }

    if (action === 'push') {
      if (!files || Object.keys(files).length === 0) {
        return NextResponse.json({ error: 'No files provided to push.' }, { status: 400 });
      }
      const updated = await pushRepository({ repo, branch, token, files, message });
      return NextResponse.json({ updated });
    }

    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
  } catch (error: any) {
    console.error('GitHub sync error:', error);
    return NextResponse.json({ error: error?.message || 'Unknown GitHub sync error' }, { status: 500 });
  }
}
