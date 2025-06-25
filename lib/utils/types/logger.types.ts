/**
 * Shared type definitions for the logger module
 * 
 * @module @terroir/core/lib/utils/types/logger
 */

/**
 * Context object for structured logging
 * Allows arbitrary key-value pairs for log enrichment
 */
export interface LogContext {
  [key: string]: unknown;
}

/**
 * Performance metrics for operation tracking
 */
export interface PerformanceMetrics {
  operation: string;
  duration: number;
  durationUnit: 'ms';
}

/**
 * Log levels supported by the logger
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
 * Logger configuration options
 */
export interface LoggerConfig {
  level?: LogLevel;
  prettyPrint?: boolean;
  redactPaths?: string[];
  serializers?: Record<string, Serializer>;
}