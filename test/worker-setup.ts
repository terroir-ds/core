/**
 * Worker-specific setup for vitest.
 * This runs in each worker process/thread to ensure proper configuration.
 */

// Immediately increase max listeners for this worker
// This prevents MaxListenersExceededWarning in async-heavy tests
process.setMaxListeners(200);

// Export empty object to make this a valid module
export {};