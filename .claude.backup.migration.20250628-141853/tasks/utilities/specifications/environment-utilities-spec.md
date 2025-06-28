# Environment Utilities Specification

## Overview
Extract environment detection and runtime utilities from logger and config implementations for consistent environment handling across the Terroir Core Design System.

## Module Structure
```
lib/utils/environment/
├── index.ts              # Main exports
├── detection.ts         # Environment detection
├── runtime.ts           # Runtime information
├── features.ts          # Feature detection
├── process.ts           # Process utilities
├── platform.ts          # Platform-specific helpers
└── __tests__/
    ├── detection.test.ts
    ├── runtime.test.ts
    ├── features.test.ts
    ├── process.test.ts
    └── platform.test.ts
```

## Detailed Specifications

### 1. Environment Detection (`detection.ts`)

```typescript
export interface EnvironmentInfo {
  type: 'development' | 'production' | 'test' | 'staging' | 'ci';
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  isStaging: boolean;
  isCI: boolean;
  isDebug: boolean;
  isTTY: boolean;
  isDocker: boolean;
  isKubernetes: boolean;
  isServerless: boolean;
  isElectron: boolean;
  isWebWorker: boolean;
  isNode: boolean;
  isBrowser: boolean;
  isDeno: boolean;
  isBun: boolean;
}

/**
 * Detect current environment
 */
export function detectEnvironment(): EnvironmentInfo;

/**
 * Environment checks
 */
export const env: {
  isDevelopment: () => boolean;
  isProduction: () => boolean;
  isTest: () => boolean;
  isStaging: () => boolean;
  isCI: () => boolean;
  isDebug: () => boolean;
};

/**
 * CI environment detection
 */
export function detectCI(): {
  isCI: boolean;
  name?: string; // GitHub Actions, CircleCI, etc.
  isPR?: boolean;
  branch?: string;
  commit?: string;
  buildNumber?: string;
  buildUrl?: string;
};

/**
 * Container environment detection
 */
export function detectContainer(): {
  isContainer: boolean;
  type?: 'docker' | 'kubernetes' | 'podman';
  runtime?: string;
  orchestrator?: string;
};

/**
 * Cloud environment detection
 */
export function detectCloud(): {
  isCloud: boolean;
  provider?: 'aws' | 'gcp' | 'azure' | 'vercel' | 'netlify' | 'heroku';
  region?: string;
  instance?: string;
};

/**
 * Custom environment detection
 */
export function createEnvironmentDetector(
  checks: Record<string, () => boolean>
): () => Record<string, boolean>;

/**
 * Environment variable helpers
 */
export function getEnv(
  key: string,
  defaultValue?: string
): string | undefined;

export function requireEnv(key: string): string;

export function hasEnv(key: string): boolean;

export function getEnvBoolean(
  key: string,
  defaultValue?: boolean
): boolean;

export function getEnvNumber(
  key: string,
  defaultValue?: number
): number;

export function getEnvArray(
  key: string,
  separator?: string
): string[];
```

### 2. Runtime Information (`runtime.ts`)

```typescript
export interface RuntimeInfo {
  // Node.js info
  nodeVersion: string;
  nodeVersionMajor: number;
  nodeVersionMinor: number;
  nodeVersionPatch: number;
  v8Version: string;
  
  // Process info
  pid: number;
  ppid: number;
  title: string;
  execPath: string;
  argv: string[];
  cwd: string;
  uptime: number;
  
  // System info
  platform: NodeJS.Platform;
  arch: string;
  hostname: string;
  cpus: number;
  totalMemory: number;
  freeMemory: number;
  
  // User info
  username: string;
  homedir: string;
  tmpdir: string;
}

/**
 * Get runtime information
 */
export function getRuntimeInfo(): RuntimeInfo;

/**
 * Node.js version checks
 */
export function getNodeVersion(): {
  version: string;
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
};

export function isNodeVersion(requirement: string): boolean;

export function compareNodeVersion(
  version: string,
  operator: '<' | '<=' | '>' | '>=' | '='
): boolean;

/**
 * Process information
 */
export function getProcessInfo(): {
  name: string;
  script?: string;
  args: string[];
  flags: Record<string, string | boolean>;
  parent?: {
    pid: number;
    name?: string;
  };
};

/**
 * Memory information
 */
export function getMemoryInfo(): {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
  available: number;
  percentUsed: number;
};

/**
 * CPU information
 */
export function getCPUInfo(): {
  model: string;
  speed: number;
  cores: number;
  physicalCores: number;
  usage: number;
};

/**
 * Script detection
 */
export function getScriptInfo(): {
  path: string;
  name: string;
  dir: string;
  isESM: boolean;
  isCJS: boolean;
  isTS: boolean;
};
```

### 3. Feature Detection (`features.ts`)

```typescript
export interface FeatureSupport {
  // Node.js features
  asyncLocalStorage: boolean;
  workerThreads: boolean;
  diagnosticsChannel: boolean;
  perfHooks: boolean;
  crypto: boolean;
  fetch: boolean;
  webStreams: boolean;
  test: boolean; // Built-in test runner
  
  // Error features
  errorCause: boolean;
  aggregateError: boolean;
  
  // Promise features
  promiseAny: boolean;
  promiseAllSettled: boolean;
  
  // Global features
  abortController: boolean;
  abortSignalTimeout: boolean;
  abortSignalAny: boolean;
  
  // Module features
  esmSupport: boolean;
  topLevelAwait: boolean;
  jsonModules: boolean;
  
  // Intl features
  intlSegmenter: boolean;
  intlListFormat: boolean;
  intlRelativeTimeFormat: boolean;
}

/**
 * Detect feature support
 */
export function detectFeatures(): FeatureSupport;

/**
 * Check specific feature
 */
export function hasFeature(feature: keyof FeatureSupport): boolean;

/**
 * Feature detection with fallback
 */
export function withFeature<T>(
  feature: keyof FeatureSupport,
  supported: () => T,
  unsupported: () => T
): T;

/**
 * Polyfill detection
 */
export function needsPolyfill(feature: string): boolean;

/**
 * API availability
 */
export function hasAPI(api: string): boolean;

/**
 * Create feature flags
 */
export function createFeatureFlags(
  features: Partial<FeatureSupport>
): {
  isEnabled: (feature: keyof FeatureSupport) => boolean;
  require: (feature: keyof FeatureSupport) => void;
  list: () => Array<{ feature: string; enabled: boolean }>;
};

/**
 * Terminal capabilities
 */
export function getTerminalFeatures(): {
  colors: boolean;
  colorDepth: number;
  unicode: boolean;
  emojis: boolean;
  hyperlinks: boolean;
  columns: number;
  rows: number;
};
```

### 4. Process Utilities (`process.ts`)

```typescript
/**
 * Graceful shutdown handler
 */
export function onShutdown(
  handler: (signal: string) => void | Promise<void>,
  options?: {
    signals?: string[];
    timeout?: number;
    exitCode?: number;
  }
): () => void;

/**
 * Process lifecycle
 */
export class ProcessLifecycle {
  constructor(options?: {
    gracefulTimeout?: number;
    logger?: (message: string) => void;
  });
  
  onStartup(handler: () => void | Promise<void>): void;
  onShutdown(handler: () => void | Promise<void>): void;
  onError(handler: (error: Error) => void): void;
  
  start(): Promise<void>;
  shutdown(code?: number): Promise<void>;
}

/**
 * Child process utilities
 */
export function isChildProcess(): boolean;

export function getParentProcess(): {
  pid: number;
  name?: string;
} | null;

/**
 * Process communication
 */
export function sendToParent(
  message: unknown,
  options?: {
    timeout?: number;
  }
): Promise<void>;

export function onParentMessage(
  handler: (message: unknown) => void
): () => void;

/**
 * Process monitoring
 */
export function monitorProcess(options?: {
  memory?: boolean;
  cpu?: boolean;
  handles?: boolean;
  interval?: number;
}): {
  start: () => void;
  stop: () => void;
  getStats: () => ProcessStats;
  onThreshold: (
    type: 'memory' | 'cpu',
    threshold: number,
    handler: () => void
  ) => void;
};

interface ProcessStats {
  uptime: number;
  memory: MemoryInfo;
  cpu: CPUInfo;
  handles: {
    active: number;
    timers: number;
    streams: number;
  };
}
```

### 5. Platform Helpers (`platform.ts`)

```typescript
/**
 * OS detection
 */
export function getOS(): {
  type: 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'unknown';
  version: string;
  release: string;
  arch: string;
  endianness: 'BE' | 'LE';
};

/**
 * Platform-specific paths
 */
export function getPaths(): {
  home: string;
  temp: string;
  data: string; // App data directory
  config: string; // Config directory
  cache: string; // Cache directory
  logs: string; // Logs directory
  desktop: string;
  documents: string;
  downloads: string;
};

/**
 * Shell detection
 */
export function getShell(): {
  name: string;
  path: string;
  type: 'bash' | 'zsh' | 'fish' | 'powershell' | 'cmd' | 'unknown';
  version?: string;
};

/**
 * Package manager detection
 */
export function getPackageManager(): {
  name: 'npm' | 'yarn' | 'pnpm' | 'bun';
  version: string;
  lockFile: string;
};

/**
 * IDE detection
 */
export function getIDE(): {
  name?: 'vscode' | 'intellij' | 'vim' | 'emacs' | 'sublime';
  terminal?: boolean;
  debugger?: boolean;
} | null;

/**
 * Platform-specific behaviors
 */
export const platform: {
  isWindows: () => boolean;
  isMac: () => boolean;
  isLinux: () => boolean;
  
  // Path utilities
  normalizePath: (path: string) => string;
  joinPath: (...paths: string[]) => string;
  
  // Line endings
  EOL: string;
  normalizeEOL: (text: string) => string;
  
  // Execute commands
  openURL: (url: string) => Promise<void>;
  openFile: (path: string) => Promise<void>;
  
  // System commands
  which: (command: string) => Promise<string | null>;
  exec: (command: string, options?: ExecOptions) => Promise<ExecResult>;
};

interface ExecOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
  shell?: boolean;
}

interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}
```

## Integration Examples

### Environment-Aware Configuration
```typescript
import { detectEnvironment, getEnv, requireEnv } from '@utils/environment';

const env = detectEnvironment();

export const config = {
  apiUrl: env.isProduction 
    ? requireEnv('API_URL')
    : getEnv('API_URL', 'http://localhost:3000'),
  
  debug: env.isDebug || env.isDevelopment,
  
  features: {
    analytics: env.isProduction,
    devTools: env.isDevelopment,
    sourceMaps: !env.isProduction
  }
};
```

### Feature-Based Implementation
```typescript
import { hasFeature, withFeature } from '@utils/environment';

// Use native feature if available
export const combineSignals = withFeature(
  'abortSignalAny',
  () => (signals: AbortSignal[]) => AbortSignal.any(signals),
  () => (signals: AbortSignal[]) => {
    // Polyfill implementation
    const controller = new AbortController();
    // ...
    return controller.signal;
  }
);

// Conditional imports
if (hasFeature('workerThreads')) {
  const { Worker } = await import('worker_threads');
  // Use workers
}
```

### Process Lifecycle Management
```typescript
import { ProcessLifecycle, monitorProcess } from '@utils/environment';

const lifecycle = new ProcessLifecycle({
  gracefulTimeout: 30000,
  logger: console.log
});

lifecycle.onStartup(async () => {
  await database.connect();
  await cache.warm();
});

lifecycle.onShutdown(async () => {
  await server.close();
  await database.disconnect();
});

// Monitor resources
const monitor = monitorProcess({
  memory: true,
  cpu: true
});

monitor.onThreshold('memory', 500 * 1024 * 1024, () => {
  console.warn('High memory usage detected');
});

await lifecycle.start();
```

## Performance Considerations

1. **Caching**: Cache detection results that don't change
2. **Lazy Detection**: Defer expensive checks until needed
3. **Synchronous**: Keep detection functions sync when possible
4. **Minimal Dependencies**: Avoid heavy dependencies
5. **Cross-Platform**: Test on all target platforms

## Success Metrics

- ✅ Consistent environment handling
- ✅ Reliable feature detection
- ✅ Better cross-platform support
- ✅ Improved debugging info
- ✅ Cleaner conditional code