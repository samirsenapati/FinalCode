import { WebContainer } from '@webcontainer/api';

export type RunResult = {
  exitCode: number | null;
};

export type ServerProcess = {
  kill: () => void;
  url: string | null;
};

let webcontainerInstance: WebContainer | null = null;
let currentServerProcess: any = null;

export async function getWebContainer(): Promise<WebContainer> {
  if (webcontainerInstance) return webcontainerInstance;
  webcontainerInstance = await WebContainer.boot();
  return webcontainerInstance;
}

export async function writeFilesToWebContainer(files: Record<string, string>) {
  const wc = await getWebContainer();

  const hasPackage = Boolean(files['package.json']);
  const defaultPackageJson = {
    name: 'finalcode-project',
    type: 'module',
    dependencies: {},
  };

  const fsTree: any = {};

  const allFiles = { ...files };
  if (!hasPackage) {
    allFiles['package.json'] = JSON.stringify(defaultPackageJson, null, 2);
  }

  for (const [path, content] of Object.entries(allFiles)) {
    const parts = path.split('/').filter(Boolean);
    let cursor = fsTree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      if (isLast) {
        cursor[part] = { file: { contents: content } };
      } else {
        cursor[part] = cursor[part] || { directory: {} };
        cursor = cursor[part].directory;
      }
    }
  }

  await wc.mount(fsTree);
}

export async function runNodeScript(params: {
  entryPath: string;
  onOutput: (line: string) => void;
}): Promise<RunResult> {
  const wc = await getWebContainer();

  const proc = await wc.spawn('node', [params.entryPath]);

  proc.output.pipeTo(
    new WritableStream({
      write(data) {
        const text = String(data);
        for (const line of text.split(/\r?\n/)) {
          if (line.length) params.onOutput(line);
        }
      },
    })
  );

  const exitCode = await proc.exit;
  return { exitCode };
}

export async function installDependencies(params: {
  onOutput: (line: string) => void;
}): Promise<RunResult> {
  const wc = await getWebContainer();

  params.onOutput('> npm install');
  
  const proc = await wc.spawn('npm', ['install']);

  proc.output.pipeTo(
    new WritableStream({
      write(data) {
        const text = String(data);
        for (const line of text.split(/\r?\n/)) {
          if (line.length) params.onOutput(line);
        }
      },
    })
  );

  const exitCode = await proc.exit;
  return { exitCode };
}

export async function startServer(params: {
  command: string[];
  onOutput: (line: string) => void;
  onServerReady?: (url: string) => void;
}): Promise<ServerProcess> {
  const wc = await getWebContainer();

  if (currentServerProcess) {
    try {
      currentServerProcess.kill();
    } catch {
      // ignore
    }
  }

  const [cmd, ...args] = params.command;
  params.onOutput(`> ${params.command.join(' ')}`);

  const proc = await wc.spawn(cmd, args);
  currentServerProcess = proc;

  let serverUrl: string | null = null;

  proc.output.pipeTo(
    new WritableStream({
      write(data) {
        const text = String(data);
        for (const line of text.split(/\r?\n/)) {
          if (line.length) params.onOutput(line);
        }
      },
    })
  );

  wc.on('server-ready', (port, url) => {
    serverUrl = url;
    params.onOutput(`> Server ready on port ${port}`);
    params.onServerReady?.(url);
  });

  return {
    kill: () => {
      try {
        proc.kill();
        currentServerProcess = null;
      } catch {
        // ignore
      }
    },
    get url() {
      return serverUrl;
    },
  };
}

export function isFullstackProject(files: Record<string, string>): boolean {
  return Boolean(
    files['server.js'] ||
    files['app.js'] ||
    files['index.js'] ||
    (files['package.json'] && 
      (files['package.json'].includes('"express"') ||
       files['package.json'].includes('"fastify"') ||
       files['package.json'].includes('"koa"')))
  );
}

export function getServerEntryPoint(files: Record<string, string>): string | null {
  if (files['server.js']) return 'server.js';
  if (files['app.js'] && files['app.js'].includes('listen')) return 'app.js';
  if (files['index.js'] && files['index.js'].includes('listen')) return 'index.js';
  
  try {
    const pkg = JSON.parse(files['package.json'] || '{}');
    if (pkg.main) return pkg.main;
    if (pkg.scripts?.start) {
      const startCmd = pkg.scripts.start;
      const match = startCmd.match(/node\s+(\S+)/);
      if (match) return match[1];
    }
  } catch {
    // ignore
  }
  
  return null;
}
