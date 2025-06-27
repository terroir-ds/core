/**
 * @module @utils/types
 * 
 * Shared type definitions for the Terroir Core Design System utilities.
 * 
 * This module re-exports all utility type definitions, providing a single
 * import point for TypeScript types used throughout the design system.
 * Types are organized by domain (logger, error, async) to maintain clarity
 * while offering convenient access.
 * 
 * @example Import all types
 * ```typescript
 * import type { LogContext, ErrorContext, RetryOptions } from '@utils/types';
 * ```
 * 
 * @example Import specific type modules
 * ```typescript
 * import type { LogLevel, PerformanceMetrics } from '@utils/types/logger.types';
 * import type { ErrorSeverity, ErrorCategory } from '@utils/types/error.types';
 * ```
 */

export * from './logger.types.js';
export * from './error.types.js';