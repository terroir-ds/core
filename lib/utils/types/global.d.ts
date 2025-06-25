/**
 * Global type augmentations
 */

declare global {
  // Extend globalThis to include our custom properties
  var __requestId: string | undefined;
}

export {};