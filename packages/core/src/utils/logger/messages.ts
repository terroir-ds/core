/**
 * @fileoverview Centralized messages for the logger utility
 * @module @utils/logger/messages
 */

import { getMessage } from '@utils/errors/messages.js';

/**
 * Logger-specific message constants
 * Uses centralized error messages for consistency
 */
export const LoggerMessages = {
  // Truncation messages
  OBJECT_TOO_LARGE: () => getMessage('LOG_OBJECT_TOO_LARGE'),
  SERIALIZE_FAILED: () => getMessage('LOG_SERIALIZE_FAILED'),
  TRUNCATED: () => getMessage('LOG_TRUNCATED'),
  TRUNCATED_SIZE_LIMIT: () => getMessage('LOG_TRUNCATED_SIZE_LIMIT'),
  MAX_DEPTH_EXCEEDED: () => getMessage('LOG_MAX_DEPTH_EXCEEDED'),
  TRUNCATED_SIMPLE: () => getMessage('LOG_TRUNCATED_SIMPLE'),
  
  // Redaction messages
  REDACTED_SENSITIVE: () => getMessage('LOG_REDACTED_SENSITIVE'),
  REDACTION_STACK_LIMIT: () => getMessage('LOG_REDACTION_STACK_LIMIT'),
  REDACTED: () => getMessage('LOG_REDACTED'),
  
  // Memory messages
  HIGH_MEMORY_USAGE: (usage: string) => getMessage('LOG_HIGH_MEMORY_USAGE', usage),
  MEMORY_USAGE: (usage: string) => getMessage('LOG_MEMORY_USAGE', usage),
  
  // Validation messages
  INVALID_REQUEST_ID: () => getMessage('LOG_INVALID_REQUEST_ID'),
  INVALID_SAMPLING_RATE: () => getMessage('LOG_INVALID_SAMPLING_RATE'),
} as const;