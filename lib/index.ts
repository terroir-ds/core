/**
 * @module @terroir/core
 * 
 * Terroir Core Design System - Main entry point
 * 
 * A comprehensive, open-source design system built with:
 * - Material Design 3 color generation
 * - Enterprise-grade logging
 * - Accessibility-first approach
 * - TypeScript throughout
 */

// Color system utilities
export * from './colors/index.js';

// Logging utilities
export { 
  logger,
  createLogger,
  logStart,
  logSuccess,
  logPerformance,
  measureTime,
} from './utils/logger.js';

export type {
  Logger,
  LogContext,
  PerformanceMetrics,
} from './utils/logger.js';