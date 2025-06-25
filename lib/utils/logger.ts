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

import pino from 'pino';
import type { Logger, LoggerOptions, TransportTargetOptions } from 'pino';
import path from 'node:path';
import { env, isDevelopment, isTest, isCI } from '@lib/config/index.js';
import type { LogContext, PerformanceMetrics } from './types/logger.types.js';

// Performance: Limit log message size to prevent memory issues
const MAX_MESSAGE_LENGTH = 10000; // 10KB
const MAX_OBJECT_DEPTH = 5;

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
 * Deep redaction of sensitive fields
 */
function deepRedact(obj: unknown, patterns: string[], depth = 0): unknown {
  if (depth > MAX_OBJECT_DEPTH) {
    return '[MAX DEPTH EXCEEDED]';
  }
  
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepRedact(item, patterns, depth + 1));
  }
  
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const shouldRedact = patterns.some(pattern => 
      lowerKey.includes(pattern.toLowerCase())
    );
    
    if (shouldRedact) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = deepRedact(value, patterns, depth + 1);
    } else {
      result[key] = value;
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
  // Add request ID support for tracing
  mixin() {
    return {
      requestId: globalThis.__requestId,
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
  }
};

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
 * Set global request ID for correlation
 * Use this at the start of each request/operation
 */
export const setRequestId = (requestId: string): void => {
  globalThis.__requestId = requestId;
};

/**
 * Get current request ID
 */
export const getRequestId = (): string | undefined => {
  return globalThis.__requestId;
};

/**
 * Clear request ID (use at end of request)
 */
export const clearRequestId = (): void => {
  globalThis.__requestId = undefined;
};

// Export logger instance and utility functions
export default logger;
export { logger };
export type { Logger } from 'pino';
export type { LogContext, PerformanceMetrics } from './types/logger.types.js';