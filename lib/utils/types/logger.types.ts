/**
 * @module @utils/types/logger
 * 
 * Type definitions for the structured logging system.
 * 
 * Provides TypeScript interfaces and types for the logger module, ensuring
 * type safety and consistency across logging operations. These types support
 * structured logging with context propagation, performance tracking, and
 * security-conscious data handling.
 * 
 * @example Basic logging with context
 * ```typescript
 * import type { LogContext } from '@utils/types/logger';
 * 
 * const context: LogContext = {
 *   userId: 123,
 *   requestId: 'abc-123',
 *   operation: 'updateUser'
 * };
 * 
 * logger.info(context, 'User update started');
 * ```
 * 
 * @example Performance tracking
 * ```typescript
 * import type { PerformanceMetrics } from '@utils/types/logger';
 * 
 * const metrics: PerformanceMetrics = {
 *   operation: 'databaseQuery',
 *   duration: 125,
 *   durationUnit: 'ms'
 * };
 * 
 * logger.info({ perf: metrics }, 'Query completed');
 * ```
 */

/**
 * Context object for structured logging.
 * 
 * Allows arbitrary key-value pairs for log enrichment. Common fields include
 * userId, requestId, sessionId, but any serializable data can be included.
 * The logger will automatically merge this context with async local storage
 * context for request tracing.
 * 
 * @example
 * ```typescript
 * const context: LogContext = {
 *   userId: 123,
 *   requestId: 'req-456',
 *   action: 'purchase',
 *   amount: 99.99,
 *   items: ['item-1', 'item-2']
 * };
 * ```
 * 
 * @public
 */
export interface LogContext {
  [key: string]: unknown;
}

/**
 * Performance metrics for operation tracking.
 * 
 * Standard structure for logging performance data. Used by the logger's
 * timer utilities to automatically track operation durations.
 * 
 * @example
 * ```typescript
 * const timer = logger.startTimer();
 * await expensiveOperation();
 * timer.done({ operation: 'dataProcessing' }, 'Processing complete');
 * // Logs with: { perf: { operation: 'dataProcessing', duration: 1234, durationUnit: 'ms' } }
 * ```
 * 
 * @public
 */
export interface PerformanceMetrics {
  operation: string;
  duration: number;
  durationUnit: 'ms';
}

/**
 * Log levels supported by the logger.
 * 
 * Ordered from most to least severe:
 * - `fatal`: Application crash or unrecoverable error
 * - `error`: Error condition but application continues
 * - `warn`: Warning condition, potential issues
 * - `info`: Informational messages, normal flow
 * - `debug`: Debug information for development
 * - `trace`: Very detailed trace information
 * 
 * @public
 */
export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

/**
 * Environment types
 */
export type Environment = 'development' | 'production' | 'test';

/**
 * Serializer function type
 */
export type Serializer<T = unknown> = (value: T) => unknown;

/**
 * Logger configuration options.
 * 
 * Controls logger behavior including output level, formatting,
 * and security features like path redaction.
 * 
 * @example
 * ```typescript
 * const config: LoggerConfig = {
 *   level: 'info',
 *   prettyPrint: true,
 *   redactPaths: ['password', 'apiKey', '*.secret'],
 *   serializers: {
 *     error: (err) => ({ message: err.message, code: err.code })
 *   }
 * };
 * ```
 * 
 * @public
 */
export interface LoggerConfig {
  level?: LogLevel;
  prettyPrint?: boolean;
  redactPaths?: string[];
  serializers?: Record<string, Serializer>;
}