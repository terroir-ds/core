/**
 * @module utils/shared/comparison
 * 
 * Shared comparison utilities for deep equality and value comparison.
 * Provides efficient algorithms for comparing complex data structures.
 */

import { 
  getObjectType, 
  isObjectLike, 
  hasOwnProp,
} from './index.js';

/**
 * Options for deep equality comparison
 */
export interface DeepEqualOptions {
  /**
   * Whether to perform strict equality (===) for primitives
   * @default true
   */
  strict?: boolean;
  
  /**
   * Whether to compare function references
   * @default true
   */
  compareFunctions?: boolean;
  
  /**
   * Custom comparator for specific types
   */
  customComparator?: (a: unknown, b: unknown) => boolean | undefined;
}

/**
 * Performs deep equality comparison between two values.
 * Handles circular references, special objects (Date, RegExp, etc.), and all primitive types.
 * 
 * @param a - First value to compare
 * @param b - Second value to compare
 * @param options - Comparison options
 * @returns True if values are deeply equal
 * 
 * @example
 * ```typescript
 * deepEquals({ a: 1, b: [2, 3] }, { a: 1, b: [2, 3] }); // true
 * deepEquals(new Date('2023-01-01'), new Date('2023-01-01')); // true
 * deepEquals(/abc/gi, /abc/gi); // true
 * ```
 */
export function deepEquals(
  a: unknown,
  b: unknown,
  options: DeepEqualOptions = {}
): boolean {
  const {
    strict = true,
    compareFunctions = true,
    customComparator,
  } = options;
  
  // Use custom comparator if provided
  if (customComparator) {
    const result = customComparator(a, b);
    if (result !== undefined) {
      return result;
    }
  }
  
  // Handle circular references
  const seen = new WeakMap<object, WeakMap<object, boolean>>();
  
  function equals(x: unknown, y: unknown): boolean {
    // Same reference
    if (x === y) {
      return true;
    }
    
    // Nullish values
    if (x === null || y === null || x === undefined || y === undefined) {
      return strict ? x === y : x == y;
    }
    
    // Different types
    const typeX = typeof x;
    const typeY = typeof y;
    if (typeX !== typeY) {
      return false;
    }
    
    // Primitives
    if (typeX !== 'object' && typeX !== 'function') {
      return strict ? x === y : x == y;
    }
    
    // Functions
    if (typeX === 'function') {
      return compareFunctions ? x === y : true;
    }
    
    // Check circular references
    if (isObjectLike(x) && isObjectLike(y)) {
      let seenX = seen.get(x as object);
      if (seenX && seenX.has(y as object)) {
        return seenX.get(y as object)!;
      }
      if (!seenX) {
        seenX = new WeakMap();
        seen.set(x as object, seenX);
      }
      seenX.set(y as object, true); // Assume equal to handle circular refs
    }
    
    // Get object types
    const objTypeX = getObjectType(x);
    const objTypeY = getObjectType(y);
    
    if (objTypeX !== objTypeY) {
      return false;
    }
    
    // Handle special object types
    switch (objTypeX) {
      case '[object Date]':
        return (x as Date).getTime() === (y as Date).getTime();
        
      case '[object RegExp]':
        return (x as RegExp).toString() === (y as RegExp).toString();
        
      case '[object Array]': {
        const arrX = x as unknown[];
        const arrY = y as unknown[];
        
        if (arrX.length !== arrY.length) {
          return false;
        }
        
        for (let i = 0; i < arrX.length; i++) {
          if (!equals(arrX[i], arrY[i])) {
            return false;
          }
        }
        return true;
      }
      
      case '[object Set]': {
        const setX = x as Set<unknown>;
        const setY = y as Set<unknown>;
        
        if (setX.size !== setY.size) {
          return false;
        }
        
        for (const value of setX) {
          if (!setY.has(value)) {
            return false;
          }
        }
        return true;
      }
      
      case '[object Map]': {
        const mapX = x as Map<unknown, unknown>;
        const mapY = y as Map<unknown, unknown>;
        
        if (mapX.size !== mapY.size) {
          return false;
        }
        
        for (const [key, value] of mapX) {
          if (!mapY.has(key) || !equals(value, mapY.get(key))) {
            return false;
          }
        }
        return true;
      }
      
      case '[object ArrayBuffer]': {
        const bufX = x as ArrayBuffer;
        const bufY = y as ArrayBuffer;
        
        if (bufX.byteLength !== bufY.byteLength) {
          return false;
        }
        
        const viewX = new Uint8Array(bufX);
        const viewY = new Uint8Array(bufY);
        
        for (let i = 0; i < viewX.length; i++) {
          if (viewX[i] !== viewY[i]) {
            return false;
          }
        }
        return true;
      }
      
      case '[object DataView]':
      case '[object Int8Array]':
      case '[object Uint8Array]':
      case '[object Uint8ClampedArray]':
      case '[object Int16Array]':
      case '[object Uint16Array]':
      case '[object Int32Array]':
      case '[object Uint32Array]':
      case '[object Float32Array]':
      case '[object Float64Array]': {
        const viewX = x as ArrayLike<number>;
        const viewY = y as ArrayLike<number>;
        
        if (viewX.length !== viewY.length) {
          return false;
        }
        
        for (let i = 0; i < viewX.length; i++) {
          if (viewX[i] !== viewY[i]) {
            return false;
          }
        }
        return true;
      }
      
      case '[object Object]': {
        // Plain objects - compare properties
        const keysX = Object.keys(x as object);
        const keysY = Object.keys(y as object);
        
        if (keysX.length !== keysY.length) {
          return false;
        }
        
        for (const key of keysX) {
          if (!hasOwnProp(y, key)) {
            return false;
          }
          
          if (!equals((x as any)[key], (y as any)[key])) {
            return false;
          }
        }
        
        // Also check symbols
        const symbolsX = Object.getOwnPropertySymbols(x as object);
        const symbolsY = Object.getOwnPropertySymbols(y as object);
        
        if (symbolsX.length !== symbolsY.length) {
          return false;
        }
        
        for (const sym of symbolsX) {
          if (!hasOwnProp(y, sym)) {
            return false;
          }
          
          if (!equals((x as any)[sym], (y as any)[sym])) {
            return false;
          }
        }
        
        return true;
      }
      
      default:
        // Unknown object types - fallback to reference equality
        return x === y;
    }
  }
  
  return equals(a, b);
}

/**
 * Shallow equality comparison for objects.
 * Only checks first level properties.
 * 
 * @param a - First object
 * @param b - Second object
 * @returns True if objects are shallowly equal
 */
export function shallowEquals(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }
  
  if (!isObjectLike(a) || !isObjectLike(b)) {
    return false;
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) {
    return false;
  }
  
  for (const key of keysA) {
    if (!hasOwnProp(b, key) || (a as any)[key] !== (b as any)[key]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Compare two values for ordering.
 * Returns -1 if a < b, 0 if a === b, 1 if a > b.
 * 
 * @param a - First value
 * @param b - Second value
 * @returns Comparison result (-1, 0, or 1)
 */
export function compare(a: unknown, b: unknown): -1 | 0 | 1 {
  if (a === b) {
    return 0;
  }
  
  // Handle nullish values
  if (a === null || a === undefined) {
    return -1;
  }
  if (b === null || b === undefined) {
    return 1;
  }
  
  // Numbers
  if (typeof a === 'number' && typeof b === 'number') {
    return a < b ? -1 : 1;
  }
  
  // Strings
  if (typeof a === 'string' && typeof b === 'string') {
    return a < b ? -1 : 1;
  }
  
  // Dates
  const typeA = getObjectType(a);
  const typeB = getObjectType(b);
  
  if (typeA === '[object Date]' && typeB === '[object Date]') {
    const timeA = (a as Date).getTime();
    const timeB = (b as Date).getTime();
    return timeA < timeB ? -1 : timeA > timeB ? 1 : 0;
  }
  
  // Default: convert to string and compare
  const strA = String(a);
  const strB = String(b);
  return strA < strB ? -1 : strA > strB ? 1 : 0;
}