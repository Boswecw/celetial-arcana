declare const process: {
  env: Record<string, string | undefined>;
  cwd(): string;
  platform: string;
  PATH?: string;
};

declare type Buffer = {
  toString(encoding?: string): string;
};

declare module 'child_process' {
  interface SpawnOptions {
    cwd?: string;
    env?: Record<string, string | undefined>;
    stdio?: any;
    timeout?: number;
  }

  interface ChildProcessLike {
    stdout?: {
      on(event: 'data', listener: (chunk: Buffer) => void): void;
    } | null;
    stderr?: {
      on(event: 'data', listener: (chunk: Buffer) => void): void;
    } | null;
    on(event: 'error', listener: (error: Error) => void): void;
    on(event: 'close', listener: (code: number | null) => void): void;
  }

  export function spawn(
    command: string,
    args?: ReadonlyArray<string>,
    options?: SpawnOptions
  ): ChildProcessLike;

  export function execSync(command: string, options?: { stdio?: any; timeout?: number; env?: Record<string, string | undefined> }): Buffer;
}

declare module 'path' {
  export function join(...segments: string[]): string;
}
