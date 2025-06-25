/**
 * Structured logging utility for Terroir Core Design System
 * 
 * Features:
 * - Environment-aware configuration
 * - Consistent log formatting
 * - Performance optimized with pino
 * - TypeScript-friendly API
 * - Security: No sensitive data logging
 * - Follows OpenTelemetry conventions
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import pino from 'pino';
import type { Logger, LoggerOptions, TransportTargetOptions } from 'pino';
import path from 'node:path';
import { env, isDevelopment, isTest, isCI } from '@lib/config/index.js';
import type { LogContext, PerformanceMetrics } from './types/logger.types.js';

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
        error: 'Log object too large', 
        size, 
        truncated: true 
      };
    }
  } catch {
    return { error: 'Failed to serialize log object' };
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
      (serialized as Record<string, unknown>)['body'] = '[TRUNCATED - EXCEEDS SIZE LIMIT]';
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
    return '[MAX DEPTH EXCEEDED]';
  }
  
  // Redact sensitive string content
  if (typeof obj === 'string') {
    if (containsSensitiveContent(obj)) {
      return '[REDACTED - SENSITIVE CONTENT]';
    }
    // Truncate long strings
    if (obj.length > MAX_MESSAGE_LENGTH) {
      return obj.substring(0, MAX_MESSAGE_LENGTH) + '[TRUNCATED]';
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
          return '[REDACTION STACK LIMIT EXCEEDED]';
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
              target[i] = containsSensitiveContent(value) ? '[REDACTED - SENSITIVE CONTENT]' : value;
            } else if (typeof value === 'object') {
              if (currentDepth >= MAX_OBJECT_DEPTH) {
                target[i] = '[MAX DEPTH EXCEEDED]';
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
                target[key] = '[REDACTED]';
              } else if (value === null || value === undefined) {
                target[key] = value;
              } else if (typeof value === 'string') {
                target[key] = containsSensitiveContent(value) ? '[REDACTED - SENSITIVE CONTENT]' : value;
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
      }
      
      return result;
    }
    
    // Handle objects
    const result: Record<string, unknown> = {};
    stack.push({ source: obj as Record<string, unknown>, target: result, depth });
    
    while (stack.length > 0) {
      // Prevent stack exhaustion attacks
      if (stack.length > MAX_STACK_SIZE) {
        return '[REDACTION STACK LIMIT EXCEEDED]';
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
            target[key] = '[REDACTED]';
          } else if (value === null || value === undefined) {
            target[key] = value;
          } else if (typeof value === 'string') {
            target[key] = containsSensitiveContent(value) ? '[REDACTED - SENSITIVE CONTENT]' : value;
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

// Base configuration
const baseConfig: LoggerOptions = {
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
};

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
const prodConfig: LoggerOptions = {
  ...baseConfig,
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
  },
  // Redact sensitive paths
  redact: {
    paths: ['*.password', '*.token', '*.secret', '*.key', '*.auth', '*.email'],
    remove: true
  }
};

// Test configuration - minimal output
const testConfig: LoggerOptions = {
  ...baseConfig,
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
};

// Increase max listeners to prevent warnings in tests
// This is safe as we're only creating a limited number of loggers
// pino-pretty transport adds an exit listener for each instance
if (isTest()) {
  process.setMaxListeners(50);
}

// Create logger instance based on environment
let logger: Logger;

if (isTest()) {
  logger = pino(testConfig);
} else if (isDevelopment() && !isCI()) {
  logger = pino({
    ...baseConfig,
    transport: devTransport
  });
} else {
  logger = pino(prodConfig);
}

// Utility functions for common logging patterns

/**
 * Log the start of a process or script
 */
export const logStart = (processName: string, context: LogContext = {}): void => {
  logger.info({ ...context, phase: 'start' }, `Starting ${processName}`);
};

/**
 * Log successful completion
 */
export const logSuccess = (processName: string, context: LogContext = {}): void => {
  logger.info({ ...context, phase: 'complete', status: 'success' }, `✓ ${processName} completed successfully`);
};

/**
 * Log performance metrics
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
 * Create a child logger with additional context
 * Tracks child loggers for resource management
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
 * Measure and log execution time
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
 * Generate a unique request ID for correlation
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
    throw new Error('Invalid request ID format');
  }
  
  const state = globalWithState[LOGGER_STATE_SYMBOL];
  if (state) {
    state.requestId = requestId;
  }
  
  // Also maintain backward compatibility
  globalThis.__terroir = globalThis.__terroir || {};
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
  
  if (globalThis.__terroir) {
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
    throw new Error('Sampling rate must be between 0 and 1');
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
 * Run a function with a specific logging context
 * This context will be automatically included in all logs within the async boundary
 * 
 * @param context - The logging context to apply
 * @param fn - The async function to run with the context
 * @returns The result of the function
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
 * Get the current async context
 * Returns undefined if not running within a context
 */
export const getAsyncContext = (): LogContext | undefined => {
  return asyncLocalStorage.getStore();
};

/**
 * Update the current async context with additional fields
 * This merges the new fields with the existing context
 * 
 * @param updates - Fields to add or update in the context
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
    logger.warn(logContext, `High memory usage detected: ${stats.heapUsedMB}MB`);
  } else {
    logger.info(logContext, `Memory usage: ${stats.heapUsedMB}MB / ${stats.heapTotalMB}MB`);
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
export type { LogContext, PerformanceMetrics } from './types/logger.types.js';
export type { GlobalWithLoggerState };