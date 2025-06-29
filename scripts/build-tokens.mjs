#!/usr/bin/env node
/* eslint-env node */
/**
 * Build script for Style Dictionary tokens
 * 
 * This script:
 * 1. Validates token structure
 * 2. Builds tokens using Style Dictionary
 * 3. Generates additional formats if needed
 * 4. Reports any errors or warnings
 */

import StyleDictionary from 'style-dictionary';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';
import pino from 'pino';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Create logger for this script
const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname'
    }
  }
});

// Import config after setting up logger
const { default: config } = await import('../style-dictionary.config.mjs');

// Ensure output directories exist
const ensureDirectories = () => {
  const directories = [
    'dist/tokens/css',
    'dist/tokens/js',
    'dist/tokens/json',
    'dist/tokens/scss'
  ];
  
  directories.forEach(dir => {
    const fullPath = join(rootDir, dir);
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
      logger.info({ directory: fullPath }, 'Created output directory');
    }
  });
};

// Build tokens
const build = async () => {
  try {
    logger.info('Starting Style Dictionary build...');
    
    // Ensure output directories exist
    ensureDirectories();
    
    // Create Style Dictionary instance with config
    const sd = new StyleDictionary(config);
    
    // Build all platforms
    await sd.buildAllPlatforms();
    
    logger.info('✓ Style Dictionary build completed successfully');
    
    // Log generated files
    const platforms = Object.keys(config.platforms);
    platforms.forEach(platform => {
      const files = config.platforms[platform].files.map(f => f.destination);
      logger.info({ platform, files }, 'Generated files for platform');
    });
    
  } catch (error) {
    logger.error({ error }, 'Style Dictionary build failed');
     
    process.exit(1);
  }
};

// Run build
build().catch(error => {
  logger.error({ error }, 'Unhandled error in build script');
   
  process.exit(1);
});