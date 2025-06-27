/**
 * @module test/helpers
 * 
 * Comprehensive test utilities for the Terroir Core Design System.
 * 
 * Provides a centralized collection of test helpers, utilities, and patterns
 * used throughout the test suite. These helpers ensure consistent testing
 * approaches and reduce boilerplate in test files.
 * 
 * @example Import all test helpers
 * ```typescript
 * import { waitForCondition, measurePerformance, createMockEvent } from '@test/helpers';
 * ```
 * 
 * @example Import specific helper modules
 * ```typescript
 * import { createAbortController, raceWithTimeout } from '@test/helpers/async-test-utils';
 * import { measureExecutionTime } from '@test/helpers/timing-helpers';
 * ```
 * 
 * Available utilities:
 * - Async test utilities: Timeouts, delays, abort handling
 * - Timing helpers: Performance measurement, execution tracking
 * - Event helpers: Mock events, event simulation
 * - Error handling: Error assertion, validation utilities
 */

// Async test utilities
export * from './async-test-utils.js';

// Timing and performance helpers
export * from './timing-helpers.js';

// Event handling helpers
export * from './event-helpers.js';