/**
 * Environment configuration with type-safe validation
 * 
 * Uses @t3-oss/env-core for build-time and runtime validation
 * All environment variables must be defined here for type safety
 */

import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

/**
 * Centralized environment configuration
 * Validates and provides type-safe access to all env vars
 */
export const env = createEnv({
  /**
   * Server-side environment variables
   * These are validated at build time and runtime
   */
  server: {
    // Node environment
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    
    // Logging configuration
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
      .default('info'),
    
    // CI/CD detection
    CI: z
      .string()
      .transform(v => v === 'true')
      .default('false'),
    
    // Package version (auto-injected by npm)
    npm_package_version: z.string().optional(),
    
    // Design system configuration
    DESIGN_SYSTEM_VERSION: z.string().default('0.1.0'),
    
    // Asset optimization
    OPTIMIZE_IMAGES: z
      .string()
      .transform(v => v === 'true')
      .default('true'),
    
    GENERATE_WEBP: z
      .string()
      .transform(v => v === 'true')
      .default('true'),
    
    // Testing configuration
    STRICT_CONTRAST: z
      .string()
      .transform(v => v === 'true')
      .default('true'),
    
    VISUAL_REGRESSION_THRESHOLD: z
      .string()
      .transform(v => parseFloat(v))
      .default('0.1'),
    
    // Optional: OpenTelemetry configuration
    OTEL_SERVICE_NAME: z.string().optional(),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
    OTEL_EXPORTER_OTLP_HEADERS: z.string().optional(),
    
    // Optional: Log shipping configuration
    LOG_SHIP_ENDPOINT: z.string().url().optional(),
    LOG_SHIP_API_KEY: z.string().optional(),
  },
  
  /**
   * Runtime environment variables (process.env)
   * These are validated at runtime only
   */
  runtimeEnv: {
    NODE_ENV: process.env['NODE_ENV'],
    LOG_LEVEL: process.env['LOG_LEVEL'],
    CI: process.env['CI'],
    npm_package_version: process.env['npm_package_version'],
    DESIGN_SYSTEM_VERSION: process.env['DESIGN_SYSTEM_VERSION'],
    OPTIMIZE_IMAGES: process.env['OPTIMIZE_IMAGES'],
    GENERATE_WEBP: process.env['GENERATE_WEBP'],
    STRICT_CONTRAST: process.env['STRICT_CONTRAST'],
    VISUAL_REGRESSION_THRESHOLD: process.env['VISUAL_REGRESSION_THRESHOLD'],
    OTEL_SERVICE_NAME: process.env['OTEL_SERVICE_NAME'],
    OTEL_EXPORTER_OTLP_ENDPOINT: process.env['OTEL_EXPORTER_OTLP_ENDPOINT'],
    OTEL_EXPORTER_OTLP_HEADERS: process.env['OTEL_EXPORTER_OTLP_HEADERS'],
    LOG_SHIP_ENDPOINT: process.env['LOG_SHIP_ENDPOINT'],
    LOG_SHIP_API_KEY: process.env['LOG_SHIP_API_KEY'],
  },
  
  /**
   * Skip validation in certain environments
   * Useful for Docker builds or CI environments
   */
  skipValidation: !!process.env['SKIP_ENV_VALIDATION'],
  
  /**
   * Called when validation fails
   * In production, we log and exit gracefully
   * In development, we throw for immediate feedback
   */
  onValidationError: (issues) => {
    console.error('❌ Invalid environment variables:', issues);
    if (process.env['NODE_ENV'] === 'production') {
      // In production, exit gracefully
      process.exit(1);
    }
    throw new Error('Invalid environment variables');
  },
  
  /**
   * Called when trying to access a server-side env var on the client
   * This helps prevent accidental exposure of secrets
   */
  onInvalidAccess: (variable: string) => {
    throw new Error(
      `❌ Attempted to access server-side environment variable '${variable}' on the client`
    );
  },
});

/**
 * Helper to check if we're in development mode
 */
export const isDevelopment = () => env.NODE_ENV === 'development';

/**
 * Helper to check if we're in production mode
 */
export const isProduction = () => env.NODE_ENV === 'production';

/**
 * Helper to check if we're in test mode
 */
export const isTest = () => env.NODE_ENV === 'test';

/**
 * Helper to check if we're in CI environment
 */
export const isCI = () => env.CI === true;

/**
 * Export type for use in other modules
 */
export type Env = typeof env;