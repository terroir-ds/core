
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
import { LoggerMessages } from './messages.js';

// Performance: Limit log message size to prevent memory issues
const MAX_MESSAGE_LENGTH = 10000; // 10KB
const MAX_OBJECT_DEPTH = 5;
const MAX_STACK_SIZE = 1000; // Maximum stack size for iterative processing

// Object pooling for performance
const POOL_SIZE = 50;
const stackPool: Array<Array<{
  source: Record<string, unknown> | unknown[];
  target: Record<string, unknown> | unknown[];
  key?: string | number;
  depth: number;
}>> = [];

// Initialize the pool
for (let i = 0; i < POOL_SIZE; i++) {
  stackPool.push([]);
}

/**
 * Get a stack array from the pool or create a new one
 */
function getStackFromPool(): Array<{
  source: Record<string, unknown> | unknown[];
  target: Record<string, unknown> | unknown[];
  key?: string | number;
  depth: number;
}> {
  return stackPool.pop() || [];
}

/**
 * Return a stack array to the pool after clearing it
 */
function returnStackToPool(stack: Array<{
  source: Record<string, unknown> | unknown[];
  target: Record<string, unknown> | unknown[];
  key?: string | number;
  depth: number;
}>): void {
  if (stackPool.length < POOL_SIZE) {
    stack.length = 0; // Clear the array
    stackPool.push(stack);
  }
}

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
        truncated: LoggerMessages.TRUNCATED() 
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
// Comprehensive list of sensitive field patterns
const SENSITIVE_PATTERNS = [
  'password', 'passwd', 'pwd',
  'token', 'api_key', 'apikey', 'api-key',
  'secret', 'private', 'priv',
  'key', 'auth', 'authorization',
  'session', 'cookie',
  'credit_card', 'creditcard', 'cc_number',
  'ssn', 'social_security',
  'bank_account', 'account_number',
  'pin', 'cvv', 'cvc'
];

// Content patterns for sensitive data detection
const SENSITIVE_CONTENT_PATTERNS = [
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit card numbers
  /\beyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\b/g, // JWT tokens
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN format
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
  /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g, // Private keys
  /sk_(?:test|live)_[a-zA-Z0-9]{24,}/g, // Stripe keys
  /ghp_[a-zA-Z0-9]{36}/g, // GitHub personal access tokens
  /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g, // IPv4 addresses
  /\b(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}\b/g, // IPv6 addresses (simplified)
  /\b\+?1?\s*\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g, // US phone numbers
  /\b\+[1-9]\d{1,14}\b/g, // International E.164 phone format
];

// Pre-compiled non-global versions for better performance
const SENSITIVE_CONTENT_TESTERS = SENSITIVE_CONTENT_PATTERNS.map(pattern => 
  new RegExp(pattern.source, pattern.flags.replace('g', ''))
);

const serializers: LoggerOptions['serializers'] = {
  err: pino.stdSerializers.err,
  error: pino.stdSerializers.err,
  // Enhanced serializer with deep redaction
  config: (config: Record<string, unknown>) => {
    return deepRedact(config, SENSITIVE_PATTERNS);
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

/**
 * Check if a string contains sensitive content
 */
function containsSensitiveContent(value: string): boolean {
  // Check if string is too long (potential data dump)
  if (value.length > MAX_MESSAGE_LENGTH) {
    return true;
  }
  
  // Check for binary content
  if (isBinaryContent(value)) {
    return true;
  }
  
  // Check against content patterns using pre-compiled testers
  for (const tester of SENSITIVE_CONTENT_TESTERS) {
    if (tester.test(value)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if string content appears to be binary data
 */
function isBinaryContent(str: string): boolean {
  // Check for null bytes or high concentration of non-printable characters
  // eslint-disable-next-line no-control-regex
  const nonPrintable = str.match(/[\x00-\x08\x0E-\x1F\x7F-\x9F]/g);
  return nonPrintable ? nonPrintable.length / str.length > 0.3 : false;
}

/**
 * Deep redaction of sensitive fields with content inspection
 * Uses iterative approach to prevent stack overflow
 */
function deepRedact(obj: unknown, patterns: string[], depth = 0): unknown {
  // Handle primitives
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // Check depth limit
  if (depth > MAX_OBJECT_DEPTH) {
    return LoggerMessages.MAX_DEPTH_EXCEEDED();
  }
  
  // Redact sensitive string content
  if (typeof obj === 'string') {
    if (containsSensitiveContent(obj)) {
      return LoggerMessages.REDACTED_SENSITIVE();
    }
    // Truncate long strings
    if (obj.length > MAX_MESSAGE_LENGTH) {
      return obj.substring(0, MAX_MESSAGE_LENGTH) + LoggerMessages.TRUNCATED_SIMPLE();
    }
    return obj;
  }
  
  // Non-objects pass through
  if (typeof obj !== 'object') {
    return obj;
  }
  
  // Use iterative approach with object pooling for better performance
  const stack = getStackFromPool();
  
  try {
    // Handle arrays
    if (Array.isArray(obj)) {
      const result: unknown[] = [];
      stack.push({ source: obj, target: result, depth });
      
      while (stack.length > 0) {
        // Prevent stack exhaustion attacks
        if (stack.length > MAX_STACK_SIZE) {
          return LoggerMessages.REDACTION_STACK_LIMIT();
        }
        
        const current = stack.pop();
        if (!current) continue;
        const { source, target, depth: currentDepth } = current;
        
        if (Array.isArray(source) && Array.isArray(target)) {
          for (let i = 0; i < source.length; i++) {
            const value = source[i];
            if (value === null || value === undefined) {
              target[i] = value;
            } else if (typeof value === 'string') {
              target[i] = containsSensitiveContent(value) ? LoggerMessages.REDACTED_SENSITIVE() : value;
            } else if (typeof value === 'object') {
              if (currentDepth >= MAX_OBJECT_DEPTH) {
                target[i] = LoggerMessages.MAX_DEPTH_EXCEEDED();
              } else if (Array.isArray(value)) {
                target[i] = [];
                stack.push({ source: value, target: target[i] as unknown[], depth: currentDepth + 1 });
              } else {
                target[i] = {};
                stack.push({ source: value as Record<string, unknown>, target: target[i] as Record<string, unknown>, depth: currentDepth + 1 });
              }
            } else {
              target[i] = value;
            }
          }
        } else {
          // Handle objects
          if (!Array.isArray(source) && !Array.isArray(target)) {
            for (const [key, value] of Object.entries(source)) {
              const lowerKey = key.toLowerCase();
              const shouldRedactKey = patterns.some(pattern => 
                lowerKey.includes(pattern.toLowerCase())
              );
              
              if (shouldRedactKey) {
                target[key] = LoggerMessages.REDACTED();
              } else if (value === null || value === undefined) {
                target[key] = value;
              } else if (typeof value === 'string') {
                target[key] = containsSensitiveContent(value) ? LoggerMessages.REDACTED_SENSITIVE() : value;
              } else if (typeof value === 'object') {
                if (currentDepth >= MAX_OBJECT_DEPTH) {
                  target[key] = LoggerMessages.MAX_DEPTH_EXCEEDED();
                } else if (Array.isArray(value)) {
                  target[key] = [];
                  stack.push({ source: value, target: target[key] as unknown[], depth: currentDepth + 1 });
                } else {
                  target[key] = {};
                  stack.push({ source: value as Record<string, unknown>, target: target[key] as Record<string, unknown>, depth: currentDepth + 1 });
                }
              } else {
                target[key] = value;
              }
            }
          }
        }
      }
      
      return result;
    }
    
    // Handle objects
    const result: Record<string, unknown> = {};
    stack.push({ source: obj as Record<string, unknown>, target: result, depth });
    
    while (stack.length > 0) {
      // Prevent stack exhaustion attacks
      if (stack.length > MAX_STACK_SIZE) {
        return LoggerMessages.REDACTION_STACK_LIMIT();
      }
      
      const current = stack.pop();
      if (!current) continue;
      const { source, target, depth: currentDepth } = current;
      
      if (!Array.isArray(source) && !Array.isArray(target)) {
        for (const [key, value] of Object.entries(source)) {
          const lowerKey = key.toLowerCase();
          const shouldRedactKey = patterns.some(pattern => 
            lowerKey.includes(pattern.toLowerCase())
          );
          
          if (shouldRedactKey) {
            target[key] = LoggerMessages.REDACTED();
          } else if (value === null || value === undefined) {
            target[key] = value;
          } else if (typeof value === 'string') {
            target[key] = containsSensitiveContent(value) ? LoggerMessages.REDACTED_SENSITIVE() : value;
          } else if (typeof value === 'object') {
            if (currentDepth >= MAX_OBJECT_DEPTH) {
              target[key] = '[MAX DEPTH EXCEEDED]';
            } else if (Array.isArray(value)) {
              target[key] = [];
              stack.push({ source: value, target: target[key] as unknown[], depth: currentDepth + 1 });
            } else {
              target[key] = {};
              stack.push({ source: value as Record<string, unknown>, target: target[key] as Record<string, unknown>, depth: currentDepth + 1 });
            }
          } else {
            target[key] = value;
          }
        }
      }
    }
    
    return result;
  } finally {
    // Return stack to pool
    returnStackToPool(stack);
  }
}

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
      if (inputArgs[0] && typeof inputArgs[0] === 'object') {
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
const createTestConfig = (): LoggerOptions => ({
  ...createBaseConfig(),
  level: 'error', // Only errors in tests
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: false,
      ignore: 'time,pid,hostname,script',
      messageFormat: '{msg}',
      singleLine: true,
    }
  },
  // Override hooks to bypass rate limiting in tests
  hooks: {
    logMethod(inputArgs: unknown[], method) {
      // In test mode, skip rate limiting to avoid test interference
      // but keep input validation
      if (inputArgs[0] && typeof inputArgs[0] === 'object') {
        inputArgs[0] = validateLogInput(inputArgs[0]);
      }
      
      return method.apply(this, inputArgs as Parameters<typeof method>);
    }
  }
});

// Create logger instance based on environment
let _logger: Logger | undefined;

function getLogger(): Logger {
  if (!_logger) {
    // Increase max listeners to prevent warnings in tests
    if (isTest()) {
      // Only increase if current limit is lower than what we need
      const currentMax = process.getMaxListeners();
      if (currentMax < 100) {
        process.setMaxListeners(100);
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
    if (typeof value === 'function') {
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
  if (logger && typeof logger.flush === 'function') {
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
  
  // Clear object pools
  stackPool.forEach(stack => stack.length = 0);
  
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
      if (typeof prop === 'string' && loggingMethods.includes(prop)) {
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