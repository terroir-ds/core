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

// AsyncLocalStorage for request context propagation
const asyncLocalStorage = new AsyncLocalStorage<LogContext>();

// Secure request ID storage using Symbols
const LOGGER_STATE_SYMBOL = Symbol.for('terroir.logger.state');

// Type for rate limiter
interface RateLimiter {
  tokens: number;
  maxTokens: number;
  lastRefill: number;
  refillRate: number;
}

// Type for logger state
interface LoggerState {
  requestId?: string;
  contextMap: WeakMap<object, LogContext>;
  rateLimiter: RateLimiter;
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
        lastRefill: Date.now(),
        refillRate: 100, // tokens per second
      },
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
  const now = Date.now();
  const elapsed = (now - limiter.lastRefill) / 1000; // seconds
  
  // Refill tokens
  const tokensToAdd = Math.floor(elapsed * limiter.refillRate);
  if (tokensToAdd > 0) {
    limiter.tokens = Math.min(limiter.maxTokens, limiter.tokens + tokensToAdd);
    limiter.lastRefill = now;
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
];

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
  
  // Check against content patterns
  for (const pattern of SENSITIVE_CONTENT_PATTERNS) {
    pattern.lastIndex = 0; // Reset regex state
    if (pattern.test(value)) {
      return true;
    }
  }
  
  return false;
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
  
  // Use iterative approach for better performance
  const stack: Array<{
    source: Record<string, unknown> | unknown[];
    target: Record<string, unknown> | unknown[];
    key?: string | number;
    depth: number;
  }> = [];
  
  // Handle arrays
  if (Array.isArray(obj)) {
    const result: unknown[] = [];
    stack.push({ source: obj, target: result, depth });
    
    while (stack.length > 0) {
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
  // Add request ID and async context support for tracing
  mixin() {
    const asyncContext = asyncLocalStorage.getStore();
    const state = globalWithState[LOGGER_STATE_SYMBOL];
    return {
      requestId: state?.requestId || globalThis.__terroir?.requestId || asyncContext?.['requestId'],
      ...asyncContext,
      version: env.npm_package_version
    };
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
 */
export const createLogger = (context: LogContext): Logger => {
  return logger.child(context);
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
 * Clean up logger resources (for testing)
 * This is primarily used to clean up transport workers
 */
export const cleanupLogger = (): void => {
  if (logger && typeof logger.flush === 'function') {
    logger.flush();
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
    state.rateLimiter.lastRefill = Date.now();
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
  return asyncLocalStorage.run(context, fn);
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

// Export logger instance and utility functions
export default logger;
export { logger };
export type { Logger } from 'pino';
export type { LogContext, PerformanceMetrics } from './types/logger.types.js';