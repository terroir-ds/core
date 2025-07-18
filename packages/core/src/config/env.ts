/**
 * @module @lib/config/env
 * 
 * Environment configuration with type-safe validation for the Terroir Core Design System.
 * 
 * Uses @t3-oss/env-core to provide build-time and runtime validation of environment
 * variables with full TypeScript support. All environment variables must be defined
 * here to ensure type safety and prevent runtime errors.
 * 
 * @example Basic usage
 * ```typescript
 * import { env, isDevelopment } from '@lib/config/env';
 * 
 * // Type-safe access to env vars
 * console.log(`Running in ${env.NODE_ENV} mode`);
 * console.log(`Log level: ${env.LOG_LEVEL}`);
 * 
 * // Use helper functions
 * if (isDevelopment()) {
 *   console.log('Development mode features enabled');
 * }
 * ```
 * 
 * @example Conditional features
 * ```typescript
 * import { env } from '@lib/config/env';
 * 
 * // Enable features based on env
 * if (env.OPTIMIZE_IMAGES) {
 *   await optimizeImages();
 * }
 * 
 * if (env.OTEL_SERVICE_NAME) {
 *   setupOpenTelemetry({
 *     serviceName: env.OTEL_SERVICE_NAME,
 *     endpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT
 *   });
 * }
 * ```
 * 
 * @example Testing configuration
 * ```typescript
 * import { env, isTest } from '@lib/config/env';
 * 
 * const contrastThreshold = env.STRICT_CONTRAST ? 4.5 : 3.0;
 * const visualThreshold = env.VISUAL_REGRESSION_THRESHOLD;
 * 
 * if (isTest()) {
 *   // Use test-specific configuration
 * }
 * ```
 */

import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

/**
 * Centralized environment configuration with validation.
 * 
 * Provides type-safe access to all environment variables with
 * automatic validation at build and runtime. Missing required
 * variables will cause build/startup failures with clear error messages.
 * 
 * @public
 */
export const env = createEnv({
  /**
   * Tell env-core we're always in server environment
   * This prevents "client-side access" errors in tests
   */
  isServer: true,
  
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
 * Checks if the application is running in development mode.
 * 
 * @returns True if NODE_ENV is 'development'
 * 
 * @example
 * ```typescript
 * if (isDevelopment()) {
 *   // Enable development features
 *   enableHotReload();
 *   showDebugPanel();
 * }
 * ```
 * 
 * @public
 */
export const isDevelopment = () => env.NODE_ENV === 'development';

/**
 * Checks if the application is running in production mode.
 * 
 * @returns True if NODE_ENV is 'production'
 * 
 * @example
 * ```typescript
 * if (isProduction()) {
 *   // Enable production optimizations
 *   enableCaching();
 *   minifyAssets();
 * }
 * ```
 * 
 * @public
 */
export const isProduction = () => env.NODE_ENV === 'production';

/**
 * Checks if the application is running in test mode.
 * 
 * @returns True if NODE_ENV is 'test'
 * 
 * @example
 * ```typescript
 * if (isTest()) {
 *   // Use test database
 *   connectToTestDB();
 *   // Disable rate limiting
 *   disableRateLimits();
 * }
 * ```
 * 
 * @public
 */
export const isTest = () => env.NODE_ENV === 'test';

/**
 * Checks if the application is running in a CI environment.
 * 
 * @returns True if CI environment variable is set to 'true'
 * 
 * @example
 * ```typescript
 * if (isCI()) {
 *   // Use CI-specific configuration
 *   console.log('Running in CI environment');
 *   // Disable interactive prompts
 *   setNonInteractive(true);
 * }
 * ```
 * 
 * @public
 */
export const isCI = () => env.CI === true;

/**
 * Type definition for the environment configuration.
 * Use this type when passing env config to other modules.
 * 
 * @example
 * ```typescript
 * import type { Env } from '@lib/config/env';
 * 
 * function configureApp(env: Env) {
 *   // Type-safe env access
 *   logger.setLevel(env.LOG_LEVEL);
 * }
 * ```
 * 
 * @public
 */
export type Env = typeof env;