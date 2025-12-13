import { WebContainer } from '@webcontainer/api';

export type RunResult = {
  exitCode: number | null;
};

let webcontainerInstance: WebContainer | null = null;

export async function getWebContainer(): Promise<WebContainer> {
  if (webcontainerInstance) return webcontainerInstance;
  webcontainerInstance = await WebContainer.boot();
  return webcontainerInstance;
}

export async function writeFilesToWebContainer(files: Record<string, string>) {
  const wc = await getWebContainer();

  // Ensure root with package.json for node execution
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
    // WebContainer FS expects directories as nested objects
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
