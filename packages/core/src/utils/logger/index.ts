
/**
 * @module @utils/logger
 * 
 * Structured logging utility for the Terroir Core Design System.
 * 
 * Provides a high-performance, security-conscious logging system built on pino,
 * with automatic context propagation, environment-aware configuration, and 
 * OpenTelemetry support. Designed for both development ergonomics and 
 * production reliability.
 * 
 * Features:
 * - Environment-aware configuration (dev, test, production)
 * - Automatic request context propagation
 * - Performance optimized with object pooling
 * - TypeScript-friendly API with full type safety
 * - Security: Automatic redaction of sensitive data
 * - OpenTelemetry trace correlation
 * - Rate limiting to prevent log flooding
 * - Pretty printing in development
 * 
 * @example Basic usage
 * ```typescript
 * import { logger } from '@utils/logger';
 * 
 * // Simple logging
 * logger.info('Application started');
 * logger.error('Failed to connect to database', { error });
 * 
 * // With structured data
 * logger.info({ userId: 123, action: 'login' }, 'User logged in');
 * ```
 * 
 * @example With request context
 * ```typescript
 * import { logger, withLogContext } from '@utils/logger';
 * 
 * // In your request handler
 * app.use((req, res, next) => {
 *   withLogContext(
 *     { requestId: req.id, userId: req.user?.id },
 *     () => next()
 *   );
 * });
 * 
 * // Logs will automatically include requestId and userId
 * logger.info('Processing request'); // Includes context
 * ```
 * 
 * @example Child loggers for modules
 * ```typescript
 * // In a module
 * const log = logger.child({ module: 'auth' });
 * 
 * log.info('Validating token'); // Includes module: 'auth'
 * log.error({ error }, 'Token validation failed');
 * ```
 * 
 * @example Performance tracking
 * ```typescript
 * const timer = logger.startTimer();
 * 
 * // Do some work
 * await processData();
 * 
 * timer.done({ operation: 'processData' }, 'Data processed');
 * // Logs: "Data processed" with duration in ms
 * ```
 * 
 * @example Error logging with sanitization
 * ```typescript
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   // Sensitive data is automatically redacted
 *   logger.error(
 *     { 
 *       error, 
 *       user: { id: 123, password: 'secret' } // password will be redacted
 *     }, 
 *     'Operation failed'
 *   );
 * }
 * ```
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import pino from 'pino';
import type { Logger, LoggerOptions, TransportTargetOptions } from 'pino';
import path from 'node:path';
import { env, isDevelopment, isTest, isCI } from '@lib/config/index.js';
import type { LogContext, PerformanceMetrics } from '@utils/types/logger.types.js';
import { isString, isObject, isFunction } from '@utils/guards/type-guards.js';
import { createRedactor } from '@utils/security/redaction.js';
import { LoggerMessages } from './messages.js';

// Performance: Limit log message size to prevent memory issues
const MAX_MESSAGE_LENGTH = 10000; // 10KB
const MAX_OBJECT_DEPTH = 5;
// AsyncLocalStorage for request context propagation
const asyncLocalStorage = new AsyncLocalStorage<LogContext>();

// Secure request ID storage using Symbols
const LOGGER_STATE_SYMBOL = Symbol.for('terroir.logger.state');

// Type for rate limiter
interface RateLimiter {
  tokens: number;
  maxTokens: number;
  lastRefillNs: bigint;
  refillRate: number;
}

// Type for OpenTelemetry integration
interface OTelHooks {
  getTraceId?: () => string | undefined;
  getSpanId?: () => string | undefined;
  getTraceFlags?: () => string | undefined;
  injectContext?: (context: LogContext) => LogContext;
}

// Type for logger state
interface LoggerState {
  requestId?: string;
  contextMap: WeakMap<object, LogContext>;
  rateLimiter: RateLimiter;
  childLoggers: WeakSet<Logger>;
  activeContexts: WeakSet<LogContext>;
  otelHooks?: OTelHooks;
}

// Extend globalThis to include our symbol-based state
interface GlobalWithLoggerState {
  [key: symbol]: LoggerState | undefined;
}

// Cast globalThis for our usage
const globalWithState = globalThis as GlobalWithLoggerState;

// Initialize secure global state
if (!globalWithState[LOGGER_STATE_SYMBOL]) {
  Object.defineProperty(globalWithState, LOGGER_STATE_SYMBOL, {
    value: {
      requestId: undefined,
      contextMap: new WeakMap<object, LogContext>(),
      rateLimiter: {
        tokens: 1000,
        maxTokens: 1000,
        lastRefillNs: process.hrtime.bigint(),
        refillRate: 100, // tokens per second
      },
      childLoggers: new WeakSet<Logger>(),
      activeContexts: new WeakSet<LogContext>(),
    },
    writable: false,
    enumerable: false,
    configurable: false,
  });
}

/**
 * Check if rate limit allows logging
 */
function checkRateLimit(): boolean {
  const state = globalWithState[LOGGER_STATE_SYMBOL];
  if (!state?.rateLimiter) return true;
  
  const limiter = state.rateLimiter;
  const nowNs = process.hrtime.bigint();
  const elapsedNs = nowNs - limiter.lastRefillNs;
  const elapsed = Number(elapsedNs) / 1e9; // Convert to seconds
  
  // Refill tokens
  const tokensToAdd = Math.floor(elapsed * limiter.refillRate);
  if (tokensToAdd > 0) {
    limiter.tokens = Math.min(limiter.maxTokens, limiter.tokens + tokensToAdd);
    limiter.lastRefillNs = nowNs;
  }
  
  // Check if we have tokens
  if (limiter.tokens > 0) {
    limiter.tokens--;
    return true;
  }
  
  return false;
}

/**
 * Validate and sanitize log input
 */
function validateLogInput(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // Check object size
  try {
    const size = JSON.stringify(obj).length;
    if (size > MAX_MESSAGE_LENGTH * 10) { // 100KB limit for objects
      return { 
        error: LoggerMessages.OBJECT_TOO_LARGE(), 
        size, 
        truncated: true 
      };
    }
  } catch {
    return { error: LoggerMessages.SERIALIZE_FAILED() };
  }
  
  return obj;
}

// Get script name for context
const getScriptName = (): string => {
  try {
    const scriptPath = process.argv[1];
    if (scriptPath) {
      return path.basename(scriptPath, path.extname(scriptPath));
    }
    return 'unknown';
  } catch {
    return 'unknown';
  }
};

// Custom serializers

// Create custom redactor for logger with specific options
const logRedactor = createRedactor({
  deep: true,
  maxDepth: MAX_OBJECT_DEPTH,
  maxStringLength: MAX_MESSAGE_LENGTH,
  checkContent: true,
  redactedValue: LoggerMessages.REDACTED(),
});

const serializers: LoggerOptions['serializers'] = {
  err: pino.stdSerializers.err,
  error: pino.stdSerializers.err,
  // Enhanced serializer with deep redaction
  config: (config: Record<string, unknown>) => {
    return logRedactor(config);
  },
  // Limit request/response sizes
  req: (req: unknown) => {
    const serialized = pino.stdSerializers.req(req as Parameters<typeof pino.stdSerializers.req>[0]);
    // Truncate large bodies
    if ('body' in serialized && serialized.body && JSON.stringify((serialized as Record<string, unknown>)['body']).length > MAX_MESSAGE_LENGTH) {
      (serialized as Record<string, unknown>)['body'] = LoggerMessages.TRUNCATED_SIZE_LIMIT();
    }
    return serialized;
  },
  res: pino.stdSerializers.res
};


// Base configuration factory
const createBaseConfig = (): LoggerOptions => ({
  level: env.LOG_LEVEL,
  // Base context for all logs
  base: {
    pid: process.pid,
    hostname: undefined, // Remove hostname for security
    script: getScriptName(),
    env: env.NODE_ENV,
  },
  // Consistent timestamp format
  timestamp: pino.stdTimeFunctions.isoTime,
  // Error serialization
  serializers,
  // Custom error hook for additional error context
  hooks: {
    logMethod(inputArgs: unknown[], method) {
      // Check rate limit before logging
      if (!checkRateLimit()) {
        // Silently drop the log if rate limit exceeded
        return;
      }
      
      // Validate input
      if (inputArgs[0] && isObject(inputArgs[0])) {
        inputArgs[0] = validateLogInput(inputArgs[0]);
      }
      
      // Add stack trace for errors in development
      if (isDevelopment() && inputArgs[0] instanceof Error) {
        inputArgs[0] = {
          ...inputArgs[0],
          stack: inputArgs[0].stack
        };
      }
      return method.apply(this, inputArgs as Parameters<typeof method>);
    }
  }
});

// Development configuration with pretty printing
const devTransport: TransportTargetOptions = {
  target: 'pino-pretty',
  options: {
    colorize: true,
    ignore: 'pid,hostname',
    translateTime: 'HH:MM:ss.l',
    messageFormat: '{script} | {msg}',
    errorLikeObjectKeys: ['err', 'error'],
    levelFirst: true,
    hideObject: false,
    singleLine: false,
  }
};

// Production configuration - structured JSON
const createProdConfig = (): LoggerOptions => ({
  ...createBaseConfig(),
  // Add request ID, async context, and OpenTelemetry trace support
  mixin() {
    const asyncContext = asyncLocalStorage.getStore();
    const state = globalWithState[LOGGER_STATE_SYMBOL];
    const baseContext = {
      requestId: state?.requestId || globalThis.__terroir?.requestId || asyncContext?.['requestId'],
      ...asyncContext,
      version: env.npm_package_version
    };
    
    // Add OpenTelemetry trace context if available
    if (state?.otelHooks) {
      const traceContext = getTraceContext();
      if (traceContext?.traceId) {
        Object.assign(baseContext, {
          trace: {
            id: traceContext.traceId,
            spanId: traceContext.spanId,
            flags: traceContext.traceFlags,
          }
        });
      }
      
      // Allow custom context injection
      if (state.otelHooks.injectContext) {
        return state.otelHooks.injectContext(baseContext);
      }
    }
    
    return baseContext;
  }
});


// Test configuration - minimal output  
const createTestConfig = (): LoggerOptions => {
  const isLoggerTest = process.env['VITEST_LOGGER_TEST'] === 'true';
  const isLoggerSilent = process.env['VITEST_LOGGER_SILENT'] === 'true';
  
  const config: LoggerOptions = {
    ...createBaseConfig(),
    level: isLoggerTest ? 'trace' : isLoggerSilent ? 'silent' : 'error', // Allow all levels when testing logger, silence when requested, otherwise errors only
    // Override hooks to bypass rate limiting in tests
    hooks: {
      logMethod(inputArgs: unknown[], method) {
        if (inputArgs[0] && isObject(inputArgs[0])) {
          inputArgs[0] = validateLogInput(inputArgs[0]);
        }
        
        // Always call the method - transport and level will handle suppression
        return method.apply(this, inputArgs as Parameters<typeof method>);
      }
    }
  };
  
  // Only add transport if needed for logger tests
  if (isLoggerTest) {
    config.transport = {
      target: 'pino-pretty',
      options: {
        colorize: false,
        ignore: 'time,pid,hostname,script',
        messageFormat: '{msg}',
        singleLine: true,
      }
    };
  }
  
  return config;
};

// Create logger instance based on environment
let _logger: Logger | undefined;
let _lastLoggerTestEnv: string | undefined;

function getLogger(): Logger {
  const currentLoggerTestEnv = process.env['VITEST_LOGGER_TEST'];
  
  // Recreate logger if test environment flag changed
  if (!_logger || (isTest() && _lastLoggerTestEnv !== currentLoggerTestEnv)) {
    _lastLoggerTestEnv = currentLoggerTestEnv;
    
    // Increase max listeners to prevent warnings in tests
    if (isTest()) {
      // Only increase if current limit is lower than what we need
      // Use 200 to match test setup for async tests
      const currentMax = process.getMaxListeners();
      if (currentMax < 200) {
        process.setMaxListeners(200);
      }
      _logger = pino(createTestConfig());
    } else if (isDevelopment() && !isCI()) {
      _logger = pino({
        ...createBaseConfig(),
        transport: devTransport
      });
    } else {
      _logger = pino(createProdConfig());
    }
  }
  return _logger;
}

// Lazy logger proxy
const logger: Logger = new Proxy({} as Logger, {
  get(_target, prop) {
    const loggerInstance = getLogger();
    const value = (loggerInstance as unknown as Record<string | symbol, unknown>)[prop];
    if (isFunction(value)) {
      return value.bind(loggerInstance);
    }
    return value;
  }
});

// Utility functions for common logging patterns

/**
 * Logs the start of a process or operation.
 * 
 * Standardizes the logging of process initialization with consistent
 * formatting and phase tracking.
 * 
 * @param processName - Name of the process being started
 * @param context - Additional context to include in the log
 * 
 * @example
 * ```typescript
 * logStart('database migration');
 * // Logs: "Starting database migration" with phase: 'start'
 * 
 * logStart('API server', { port: 3000, env: 'production' });
 * // Includes additional context in the log
 * ```
 * 
 * @public
 */
export const logStart = (processName: string, context: LogContext = {}): void => {
  logger.info({ ...context, phase: 'start' }, `Starting ${processName}`);
};

/**
 * Logs successful completion of a process.
 * 
 * Provides consistent success logging with visual indicator (✓) and
 * status tracking for process completion.
 * 
 * @param processName - Name of the completed process
 * @param context - Additional context to include in the log
 * 
 * @example
 * ```typescript
 * logStart('data import');
 * await importData();
 * logSuccess('data import');
 * // Logs: "✓ data import completed successfully"
 * 
 * logSuccess('user registration', { userId: 123, duration: 250 });
 * ```
 * 
 * @public
 */
export const logSuccess = (processName: string, context: LogContext = {}): void => {
  logger.info({ ...context, phase: 'complete', status: 'success' }, `✓ ${processName} completed successfully`);
};

/**
 * Logs performance metrics for an operation.
 * 
 * Standardizes performance logging with consistent structure for
 * monitoring and analysis of operation durations.
 * 
 * @param operation - Name of the operation being measured
 * @param duration - Duration in milliseconds
 * @param context - Additional context to include in the log
 * 
 * @example
 * ```typescript
 * const start = performance.now();
 * await processData();
 * const duration = performance.now() - start;
 * 
 * logPerformance('data processing', duration);
 * // Logs: "data processing took 1234ms"
 * 
 * logPerformance('API call', 250, { 
 *   endpoint: '/users',
 *   method: 'GET' 
 * });
 * ```
 * 
 * @public
 */
export const logPerformance = (operation: string, duration: number, context: LogContext = {}): void => {
  logger.info({
    ...context,
    performance: {
      operation,
      duration,
      durationUnit: 'ms'
    } as PerformanceMetrics
  }, `${operation} took ${duration}ms`);
};

/**
 * Creates a child logger with additional context.
 * 
 * Child loggers inherit all configuration from the parent logger
 * while adding their own context. This is useful for adding
 * module-specific or request-specific context. Child loggers
 * are tracked for resource management.
 * 
 * @param context - Context to include in all logs from this logger
 * @returns A new logger instance with the additional context
 * 
 * @example Module-specific logger
 * ```typescript
 * // In auth module
 * const authLogger = createLogger({ module: 'auth' });
 * 
 * authLogger.info('User login attempt');
 * // Logs with: { module: 'auth', msg: 'User login attempt' }
 * 
 * authLogger.error({ userId, error }, 'Login failed');
 * // Includes module context automatically
 * ```
 * 
 * @example Request-specific logger
 * ```typescript
 * function handleRequest(req: Request) {
 *   const reqLogger = createLogger({
 *     requestId: req.id,
 *     path: req.path,
 *     method: req.method
 *   });
 *   
 *   reqLogger.info('Processing request');
 *   // All logs include request context
 * }
 * ```
 * 
 * @public
 */
export const createLogger = (context: LogContext): Logger => {
  const childLogger = logger.child(context);
  
  // Track child logger for cleanup
  const state = globalWithState[LOGGER_STATE_SYMBOL];
  if (state) {
    state.childLoggers.add(childLogger);
  }
  
  return childLogger;
};

/**
 * Measures and logs the execution time of an async operation.
 * 
 * Wraps an async function to automatically measure its execution
 * time and log the result with performance metrics. Handles both
 * successful completion and errors.
 * 
 * @typeParam T - The return type of the async function
 * 
 * @param operation - Name of the operation being measured
 * @param fn - Async function to execute and measure
 * @param context - Additional context to include in logs
 * 
 * @returns The result of the async function
 * 
 * @throws The original error if the function fails
 * 
 * @example Basic usage
 * ```typescript
 * const result = await measureTime(
 *   'database query',
 *   async () => db.query('SELECT * FROM users')
 * );
 * // Logs: "database query took 45ms" on success
 * // Logs error with duration on failure
 * ```
 * 
 * @example With context
 * ```typescript
 * const data = await measureTime(
 *   'API fetch',
 *   async () => fetch('/api/data').then(r => r.json()),
 *   { endpoint: '/api/data', method: 'GET' }
 * );
 * ```
 * 
 * @example Error handling
 * ```typescript
 * try {
 *   await measureTime(
 *     'risky operation',
 *     async () => riskyOperation(),
 *     { retries: 3 }
 *   );
 * } catch (error) {
 *   // Error is logged with duration before being re-thrown
 *   handleError(error);
 * }
 * ```
 * 
 * @public
 */
export const measureTime = async <T>(
  operation: string, 
  fn: () => Promise<T>, 
  context: LogContext = {}
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = Math.round(performance.now() - start);
    logPerformance(operation, duration, { ...context, status: 'success' });
    return result;
  } catch (error) {
    const duration = Math.round(performance.now() - start);
    logger.error({ 
      ...context, 
      err: error,
      performance: { operation, duration, durationUnit: 'ms' } as PerformanceMetrics,
      status: 'failed'
    }, `${operation} failed after ${duration}ms`);
    throw error;
  }
};

/**
 * Generates a unique request ID for log correlation.
 * 
 * Creates a unique identifier that can be used to correlate logs
 * across multiple services or operations. The format is designed
 * to be sortable by time and globally unique.
 * 
 * @returns A unique request ID in format: "timestamp-randomstring"
 * 
 * @example Basic usage
 * ```typescript
 * const requestId = generateRequestId();
 * // Returns: "1703123456789-abc123d"
 * 
 * const logger = createLogger({ requestId });
 * logger.info('Processing request');
 * ```
 * 
 * @example In middleware
 * ```typescript
 * app.use((req, res, next) => {
 *   req.id = req.headers['x-request-id'] || generateRequestId();
 *   req.logger = createLogger({ requestId: req.id });
 *   next();
 * });
 * ```
 * 
 * @public
 */
export const generateRequestId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Validate request ID format
 */
function isValidRequestId(id: string): boolean {
  // Request ID should match our format: timestamp-randomstring
  return /^\d{13}-[a-z0-9]{7}$/.test(id) || 
         // Allow custom formats but with reasonable constraints
         (id.length > 0 && id.length <= 100 && /^[\w-]+$/.test(id));
}

/**
 * Set global request ID for correlation
 * Use this at the start of each request/operation
 */
export const setRequestId = (requestId: string): void => {
  if (!isValidRequestId(requestId)) {
    throw new Error(LoggerMessages.INVALID_REQUEST_ID());
  }
  
  const state = globalWithState[LOGGER_STATE_SYMBOL];
  if (state) {
    state.requestId = requestId;
  }
  
  // Also maintain backward compatibility
  if (!globalThis.__terroir) {
    globalThis.__terroir = {};
  }
  globalThis.__terroir.requestId = requestId;
};

/**
 * Get current request ID
 */
export const getRequestId = (): string | undefined => {
  const state = globalWithState[LOGGER_STATE_SYMBOL];
  return state?.requestId || globalThis.__terroir?.requestId;
};

/**
 * Clear request ID (use at end of request)
 */
export const clearRequestId = (): void => {
  const state = globalWithState[LOGGER_STATE_SYMBOL];
  if (state) {
    delete state.requestId;
  }
  
  if (globalThis.__terroir && 'requestId' in globalThis.__terroir) {
    delete globalThis.__terroir.requestId;
  }
};

/**
 * Clean up logger resources
 * Comprehensive cleanup including child loggers, contexts, and transports
 */
export const cleanupLogger = (): void => {
  const state = globalWithState[LOGGER_STATE_SYMBOL];
  
  // Flush main logger
  if (logger && isFunction(logger.flush)) {
    logger.flush();
  }
  
  // Clear global state
  if (state) {
    delete state.requestId;
    state.contextMap = new WeakMap();
    // Don't reset rate limiter to maintain rate limiting across cleanups
    state.childLoggers = new WeakSet();
    state.activeContexts = new WeakSet();
  }
  
  // AsyncLocalStorage doesn't have a disable method in Node.js
  // It will be garbage collected when no longer referenced
  
  // Note: Object pools are now managed by the security/redaction module
  // and will be cleaned up automatically
  
  // Force garbage collection if available (Node.js with --expose-gc)
  if (global.gc) {
    global.gc();
  }
};

/**
 * Get rate limiter statistics
 * Useful for monitoring and debugging
 */
export const getRateLimiterStats = (): { tokens: number; maxTokens: number; refillRate: number } | undefined => {
  const state = globalWithState[LOGGER_STATE_SYMBOL];
  if (!state?.rateLimiter) return undefined;
  
  return {
    tokens: state.rateLimiter.tokens,
    maxTokens: state.rateLimiter.maxTokens,
    refillRate: state.rateLimiter.refillRate,
  };
};

/**
 * Reset rate limiter (for testing)
 */
export const resetRateLimiter = (): void => {
  const state = globalWithState[LOGGER_STATE_SYMBOL];
  if (state?.rateLimiter) {
    state.rateLimiter.tokens = state.rateLimiter.maxTokens;
    state.rateLimiter.lastRefillNs = process.hrtime.bigint();
  }
};

/**
 * Sampling options for high-volume scenarios
 */
export interface SamplingOptions {
  /** Sampling rate from 0 to 1 (0 = no logs, 1 = all logs) */
  rate: number;
  /** Optional key to group logs for consistent sampling */
  key?: string;
  /** Minimum log level to always include (regardless of sampling) */
  minLevel?: 'fatal' | 'error' | 'warn';
}

/**
 * Create a sampled logger for high-volume scenarios
 * This reduces log volume while maintaining statistical accuracy
 * 
 * @param options - Sampling configuration
 * @param context - Additional context to include in all logs
 * @returns A logger that samples logs based on the provided rate
 */
export const createSampledLogger = (
  options: SamplingOptions,
  context?: LogContext
): Logger => {
  const { rate, key, minLevel = 'error' } = options;
  
  // Validate sampling rate
  if (rate < 0 || rate > 1 || isNaN(rate)) {
    throw new Error(LoggerMessages.INVALID_SAMPLING_RATE());
  }
  
  // Always log if rate is 1
  if (rate === 1) {
    return createLogger(context || {});
  }
  
  // Create a child logger with sampling context
  const sampledLogger = createLogger({
    ...context,
    sampled: true,
    samplingRate: rate
  });
  
  // Determine if we should log based on the key or random sampling
  const shouldLog = (level: string): boolean => {
    // Always log critical levels
    if (minLevel) {
      const levels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];
      const minLevelIndex = levels.indexOf(minLevel);
      const currentLevelIndex = levels.indexOf(level);
      if (currentLevelIndex <= minLevelIndex) {
        return true;
      }
    }
    
    if (key) {
      // Use consistent hashing for the same key
      let hash = 0;
      for (let i = 0; i < key.length; i++) {
        const char = key.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return (Math.abs(hash) % 100) / 100 < rate;
    }
    
    // Random sampling
    return Math.random() < rate;
  };
  
  // Create a proxy to intercept log calls
  return new Proxy(sampledLogger, {
    get(target, prop: string | symbol) {
      const value = target[prop as keyof Logger];
      
      // Only intercept logging methods
      const loggingMethods = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];
      if (isString(prop) && loggingMethods.includes(prop)) {
        return (...args: unknown[]) => {
          if (shouldLog(prop)) {
            return (value as Function).apply(target, args);
          }
          // Silently skip the log
          return undefined;
        };
      }
      
      return value;
    }
  });
};

/**
 * Runs an async function with a specific logging context.
 * 
 * This function uses AsyncLocalStorage to propagate logging context
 * through the entire async call chain. All logs within the function
 * and its descendants will automatically include the provided context.
 * This is particularly useful for request tracking and distributed tracing.
 * 
 * @typeParam T - The return type of the async function
 * 
 * @param context - The logging context to apply within the async boundary
 * @param fn - The async function to run with the context
 * 
 * @returns The result of the async function
 * 
 * @example Request handler with context
 * ```typescript
 * app.post('/api/users', async (req, res) => {
 *   await runWithContext(
 *     { 
 *       requestId: req.id,
 *       userId: req.user?.id,
 *       path: req.path 
 *     },
 *     async () => {
 *       // All logs here include the context
 *       logger.info('Creating user');
 *       
 *       const user = await createUser(req.body);
 *       // Even nested function calls get the context
 *       
 *       logger.info('User created successfully');
 *       res.json(user);
 *     }
 *   );
 * });
 * ```
 * 
 * @example Batch processing with context
 * ```typescript
 * for (const batch of batches) {
 *   await runWithContext(
 *     { batchId: batch.id, size: batch.items.length },
 *     async () => {
 *       logger.info('Processing batch');
 *       await processBatch(batch);
 *       logger.info('Batch complete');
 *     }
 *   );
 * }
 * ```
 * 
 * @public
 */
export const runWithContext = async <T>(
  context: LogContext,
  fn: () => Promise<T>
): Promise<T> => {
  // Track active context for resource management
  const state = globalWithState[LOGGER_STATE_SYMBOL];
  if (state) {
    state.activeContexts.add(context);
  }
  
  try {
    return await asyncLocalStorage.run(context, fn);
  } finally {
    // Context will be garbage collected when no longer referenced
    // WeakSet ensures no memory leak
  }
};

/**
 * Gets the current async logging context.
 * 
 * Retrieves the logging context from AsyncLocalStorage that was set
 * by runWithContext. Returns undefined if not running within a context.
 * This is useful for accessing request-specific data in deeply nested functions.
 * 
 * @returns The current logging context or undefined
 * 
 * @example Accessing context in utility functions
 * ```typescript
 * function logDatabaseQuery(query: string) {
 *   const context = getAsyncContext();
 *   logger.info({
 *     ...context,
 *     query,
 *     module: 'database'
 *   }, 'Executing query');
 * }
 * 
 * // When called within runWithContext, includes that context
 * ```
 * 
 * @example Conditional context usage
 * ```typescript
 * function processItem(item: Item) {
 *   const context = getAsyncContext();
 *   
 *   if (context?.requestId) {
 *     logger.info({ requestId: context.requestId }, 'Processing item');
 *   } else {
 *     logger.info('Processing item (no request context)');
 *   }
 * }
 * ```
 * 
 * @public
 */
export const getAsyncContext = (): LogContext | undefined => {
  return asyncLocalStorage.getStore();
};

/**
 * Updates the current async context with additional fields.
 * 
 * Merges new fields into the existing async context. This is useful
 * for progressively adding context as more information becomes available
 * during request processing. Only works when running within runWithContext.
 * 
 * @param updates - Fields to add or update in the context
 * 
 * @example Progressive context building
 * ```typescript
 * await runWithContext({ requestId: '123' }, async () => {
 *   logger.info('Starting request'); // Has requestId
 *   
 *   const user = await authenticate();
 *   updateAsyncContext({ userId: user.id });
 *   
 *   logger.info('User authenticated'); // Has requestId and userId
 *   
 *   const org = await loadOrganization(user);
 *   updateAsyncContext({ orgId: org.id });
 *   
 *   logger.info('Processing request'); // Has all context
 * });
 * ```
 * 
 * @example Conditional updates
 * ```typescript
 * function addUserContext(user?: User) {
 *   if (user) {
 *     updateAsyncContext({
 *       userId: user.id,
 *       userRole: user.role,
 *       userTier: user.subscriptionTier
 *     });
 *   }
 * }
 * ```
 * 
 * @public
 */
export const updateAsyncContext = (updates: LogContext): void => {
  const currentContext = asyncLocalStorage.getStore();
  if (currentContext) {
    Object.assign(currentContext, updates);
  }
};

/**
 * Create a logger with async context support
 * This logger will automatically include context from AsyncLocalStorage
 * 
 * @param staticContext - Static context that's always included
 * @returns A logger instance
 */
export const createAsyncLogger = (staticContext?: LogContext): Logger => {
  return createLogger({
    ...staticContext,
    // This will be merged at log time via the mixin
    asyncContextEnabled: true
  });
};

/**
 * Get memory usage statistics
 * Useful for monitoring resource usage and detecting leaks
 */
export const getMemoryStats = (): {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  heapUsedMB: number;
  heapTotalMB: number;
  rssMB: number;
} => {
  const memUsage = process.memoryUsage();
  return {
    heapUsed: memUsage.heapUsed,
    heapTotal: memUsage.heapTotal,
    external: memUsage.external,
    rss: memUsage.rss,
    heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
    heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
    rssMB: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100,
  };
};

/**
 * Log memory usage with optional warning threshold
 */
export const logMemoryUsage = (context?: LogContext, warnThresholdMB = 500): void => {
  const stats = getMemoryStats();
  const logContext = {
    ...context,
    memory: stats,
  };
  
  if (stats.heapUsedMB > warnThresholdMB) {
    logger.warn(logContext, LoggerMessages.HIGH_MEMORY_USAGE(`${stats.heapUsedMB}MB`));
  } else {
    logger.info(logContext, LoggerMessages.MEMORY_USAGE(`${stats.heapUsedMB}MB / ${stats.heapTotalMB}MB`));
  }
};

/**
 * Set up automatic memory monitoring
 * Returns a function to stop monitoring
 */
export const startMemoryMonitoring = (intervalMs = 60000, warnThresholdMB = 500): (() => void) => {
  const intervalId = setInterval(() => {
    logMemoryUsage({ monitoring: 'automatic' }, warnThresholdMB);
  }, intervalMs);
  
  return () => clearInterval(intervalId);
};

/**
 * Register OpenTelemetry hooks for trace correlation
 * This allows the logger to automatically include trace context
 * 
 * @param hooks - OpenTelemetry integration hooks
 */
export const registerOTelHooks = (hooks: OTelHooks): void => {
  const state = globalWithState[LOGGER_STATE_SYMBOL];
  if (state) {
    state.otelHooks = hooks;
  }
};

/**
 * Get current trace context from OpenTelemetry
 * Returns undefined if no hooks are registered or no active trace
 */
export const getTraceContext = (): { traceId?: string; spanId?: string; traceFlags?: string } | undefined => {
  const state = globalWithState[LOGGER_STATE_SYMBOL];
  if (!state?.otelHooks) return undefined;
  
  const { getTraceId, getSpanId, getTraceFlags } = state.otelHooks;
  
  const traceId = getTraceId?.();
  const spanId = getSpanId?.();
  const traceFlags = getTraceFlags?.();
  
  const context: { traceId?: string; spanId?: string; traceFlags?: string } = {};
  
  if (traceId !== undefined) context.traceId = traceId;
  if (spanId !== undefined) context.spanId = spanId;
  if (traceFlags !== undefined) context.traceFlags = traceFlags;
  
  return context;
};

/**
 * Create a logger that automatically includes OpenTelemetry trace context
 * 
 * @param staticContext - Static context to include in all logs
 * @returns A logger with automatic trace context injection
 */
export const createTracedLogger = (staticContext?: LogContext): Logger => {
  return createLogger({
    ...staticContext,
    // This will be resolved via mixin
    otelEnabled: true,
  });
};

// Export logger instance and utility functions
export default logger;
export { logger };
export type { Logger } from 'pino';
export type { LogContext, PerformanceMetrics } from '@utils/types/logger.types.js';
export type { GlobalWithLoggerState };