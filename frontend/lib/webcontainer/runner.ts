import { WebContainer } from '@webcontainer/api';

export type RunResult = {
  exitCode: number | null;
  error?: string;
};

export type ServerProcess = {
  kill: () => void;
  url: string | null;
  error?: string;
};

export type ServerStatus = 'idle' | 'starting' | 'installing' | 'running' | 'error' | 'ready';

let webcontainerInstance: WebContainer | null = null;
let currentServerProcess: any = null;
let bootAttempts = 0;
const MAX_BOOT_RETRIES = 3;

export async function getWebContainer(): Promise<WebContainer> {
  if (webcontainerInstance) return webcontainerInstance;
  
  while (bootAttempts < MAX_BOOT_RETRIES) {
    try {
      bootAttempts++;
      webcontainerInstance = await WebContainer.boot();
      return webcontainerInstance;
    } catch (error: any) {
      console.error(`WebContainer boot attempt ${bootAttempts} failed:`, error);
      if (bootAttempts >= MAX_BOOT_RETRIES) {
        throw new Error(`Failed to boot WebContainer after ${MAX_BOOT_RETRIES} attempts: ${error.message}`);
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, bootAttempts - 1)));
    }
  }
  
  throw new Error('Failed to boot WebContainer');
}

export function isWebContainerSupported(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for SharedArrayBuffer support (required for WebContainers)
  if (typeof SharedArrayBuffer === 'undefined') {
    return false;
  }
  
  // Check for cross-origin isolation
  if (!crossOriginIsolated) {
    return false;
  }
  
  return true;
}

export function getWebContainerError(): string | null {
  if (typeof window === 'undefined') return 'Server-side rendering';
  
  if (typeof SharedArrayBuffer === 'undefined') {
    return 'SharedArrayBuffer is not available. This browser may not support WebContainers.';
  }
  
  if (!crossOriginIsolated) {
    return 'Cross-origin isolation is required. The page needs COOP/COEP headers.';
  }
  
  return null;
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
  onStatusChange?: (status: ServerStatus) => void;
  maxRetries?: number;
}): Promise<RunResult> {
  const maxRetries = params.maxRetries ?? 2;
  let lastError: string | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      params.onStatusChange?.('installing');
      const wc = await getWebContainer();

      if (attempt > 0) {
        params.onOutput(`> Retry ${attempt}/${maxRetries}: npm install`);
      } else {
        params.onOutput('> npm install');
      }
      
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
      
      if (exitCode === 0) {
        return { exitCode };
      }
      
      lastError = `npm install exited with code ${exitCode}`;
      params.onOutput(`> Error: ${lastError}`);
      
      if (attempt < maxRetries) {
        const delay = 1000 * Math.pow(2, attempt);
        params.onOutput(`> Waiting ${delay / 1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error: any) {
      lastError = error.message;
      params.onOutput(`> Error: ${lastError}`);
      
      if (attempt < maxRetries) {
        const delay = 1000 * Math.pow(2, attempt);
        params.onOutput(`> Waiting ${delay / 1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  params.onStatusChange?.('error');
  return { exitCode: 1, error: lastError || 'Installation failed after retries' };
}

export async function startServer(params: {
  command: string[];
  onOutput: (line: string) => void;
  onServerReady?: (url: string) => void;
  onStatusChange?: (status: ServerStatus) => void;
  onError?: (error: string) => void;
  timeout?: number;
}): Promise<ServerProcess> {
  const timeout = params.timeout ?? 30000; // 30 second default timeout
  let serverUrl: string | null = null;
  let serverError: string | undefined;
  let isReady = false;
  
  try {
    params.onStatusChange?.('starting');
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

    params.onStatusChange?.('running');

    // Set up output streaming with error detection
    proc.output.pipeTo(
      new WritableStream({
        write(data) {
          const text = String(data);
          for (const line of text.split(/\r?\n/)) {
            if (line.length) {
              params.onOutput(line);
              
              // Detect common errors
              if (line.toLowerCase().includes('error') || 
                  line.toLowerCase().includes('eaddrinuse') ||
                  line.toLowerCase().includes('cannot find module')) {
                serverError = line;
                params.onError?.(line);
              }
            }
          }
        },
      })
    );

    // Listen for server-ready event
    wc.on('server-ready', (port, url) => {
      serverUrl = url;
      isReady = true;
      params.onStatusChange?.('ready');
      params.onOutput(`> Server ready on port ${port}`);
      params.onServerReady?.(url);
    });

    // Set up timeout for server startup
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => {
        if (!isReady) {
          reject(new Error(`Server did not start within ${timeout / 1000} seconds`));
        }
      }, timeout);
    });

    // Wait for either server ready or timeout (non-blocking for caller)
    timeoutPromise.catch((error) => {
      if (!isReady) {
        serverError = error.message;
        params.onOutput(`> ${error.message}`);
        params.onStatusChange?.('error');
        params.onError?.(error.message);
      }
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
      get error() {
        return serverError;
      },
    };
  } catch (error: any) {
    serverError = error.message;
    params.onOutput(`> Error starting server: ${error.message}`);
    params.onStatusChange?.('error');
    params.onError?.(error.message);
    
    return {
      kill: () => {},
      url: null,
      error: serverError,
    };
  }
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
