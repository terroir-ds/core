/**
 * Global type augmentations
 */

declare global {
  // Namespaced global state to prevent collisions
  var __terroir: {
    requestId?: string;
    // Reserved for future global state
  };
}

export {};