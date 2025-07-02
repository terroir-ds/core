/**
 * @module @utils/security/hashing
 * 
 * Hashing and data anonymization utilities.
 * 
 * Provides fast hashing using established libraries for consistent data handling,
 * deterministic ID generation, and data anonymization. For cryptographic hashing,
 * use Node.js crypto module instead.
 * 
 * @example
 * ```typescript
 * import { hashObject, hashString, deterministicId } from '@utils/security/hashing';
 * 
 * // Hash objects consistently
 * const hash = await hashObject({ user: 'john', age: 30 });
 * 
 * // Fast string hashing
 * const strHash = await hashString('hello world');
 * 
 * // Generate deterministic IDs
 * const id = await deterministicId('user', email, timestamp);
 * ```
 */

import objectHash from 'object-hash';

// Type-only import for xxhash-wasm
type XXHash = {
  h32(input: string, seed?: number): number;
  h64(input: string, seed?: bigint): bigint;
};

// =============================================================================
// TYPES
// =============================================================================

/**
 * Options for object hashing.
 */
export interface ObjectHashOptions {
  /** Hash algorithm. Default: 'sha1' */
  algorithm?: 'sha1' | 'md5' | 'sha256' | 'sha512' | 'passthrough';
  /** Exclude values from hash. Default: false */
  excludeValues?: boolean;
  /** Encoding. Default: 'hex' */
  encoding?: 'hex' | 'binary' | 'base64';
  /** Ignore unknown object types. Default: true */
  ignoreUnknown?: boolean;
  /** Replace objects of unserializable types. Default: true */
  replacer?: (value: unknown) => unknown;
  /** Sort object keys. Default: true */
  unorderedObjects?: boolean;
  /** Sort arrays. Default: false */
  unorderedArrays?: boolean;
  /** Sort sets. Default: true */
  unorderedSets?: boolean;
  /** Exclude keys */
  excludeKeys?: (key: string) => boolean;
}

/**
 * Options for string hashing.
 */
export interface StringHashOptions {
  /** Output format. Default: 'number' */
  format?: 'number' | 'hex' | 'base64';
  /** Seed for xxhash. Default: 0 */
  seed?: number;
  /** Use 64-bit hash. Default: false */
  use64bit?: boolean;
}

/**
 * Options for data anonymization.
 */
export interface AnonymizeOptions {
  /** Preserve data types in output. Default: true */
  preserveTypes?: boolean;
  /** Preserve string lengths. Default: false */
  preserveLength?: boolean;
  /** Deterministic seed for consistent results. Default: random */
  deterministicSeed?: string;
  /** Fields to skip anonymization */
  skipFields?: string[];
  /** Maximum depth to traverse. Default: 10 */
  maxDepth?: number;
}

// =============================================================================
// XXHASH INSTANCE
// =============================================================================

let xxhashInstance: XXHash | null = null;
let xxhashPromise: Promise<XXHash> | null = null;

/**
 * Gets or initializes the xxhash instance.
 */
async function getXXHash(): Promise<XXHash> {
  if (xxhashInstance) {
    return xxhashInstance;
  }
  
  if (!xxhashPromise) {
    xxhashPromise = import('xxhash-wasm').then(async ({ default: xxhashFactory }) => {
      xxhashInstance = await xxhashFactory();
      return xxhashInstance;
    });
  }
  
  return xxhashPromise;
}

// =============================================================================
// OBJECT HASHING
// =============================================================================

/**
 * Hashes objects consistently using object-hash library.
 * 
 * @param obj - Object to hash
 * @param options - Hashing options
 * @returns Hash string
 * 
 * @example
 * ```typescript
 * const user = { name: 'John', age: 30, hobbies: ['reading', 'coding'] };
 * const hash = await hashObject(user);
 * // Same object structure will always produce same hash
 * 
 * // Exclude values for structure-only hash
 * const structureHash = await hashObject(user, { excludeValues: true });
 * ```
 */
export async function hashObject(
  obj: unknown,
  options: ObjectHashOptions = {}
): Promise<string> {
  const {
    algorithm = 'sha1',
    excludeValues = false,
    encoding = 'hex',
    ignoreUnknown = true,
    replacer,
    unorderedObjects = true,
    unorderedArrays = false,
    unorderedSets = true,
    excludeKeys,
  } = options;
  
  return objectHash(obj, {
    algorithm,
    excludeValues,
    encoding,
    ignoreUnknown,
    replacer,
    unorderedObjects,
    unorderedArrays,
    unorderedSets,
    excludeKeys,
  });
}

// =============================================================================
// STRING HASHING
// =============================================================================

/**
 * Fast string hashing using xxhash.
 * 
 * @param str - String to hash
 * @param options - Hashing options
 * @returns Hash value
 * 
 * @example
 * ```typescript
 * // Get numeric hash
 * const hash = await hashString('hello world');
 * 
 * // Get hex string
 * const hexHash = await hashString('hello world', { format: 'hex' });
 * 
 * // Use 64-bit hash
 * const hash64 = await hashString('hello world', { use64bit: true });
 * ```
 */
export async function hashString(
  str: string,
  options: StringHashOptions = {}
): Promise<string | number> {
  const {
    format = 'number',
    seed = 0,
    use64bit = false,
  } = options;
  
  const xxhash = await getXXHash();
  
  if (use64bit) {
    const result = xxhash.h64(str, BigInt(seed));
    
    switch (format) {
      case 'hex':
        return result.toString(16);
      case 'base64': {
        // Convert bigint to buffer then base64
        const buffer = Buffer.alloc(8);
        buffer.writeBigUInt64BE(result);
        return buffer.toString('base64');
      }
      case 'number':
      default:
        // For 64-bit, return as string since JS can't accurately represent all 64-bit integers
        return result.toString();
    }
  } else {
    const result = xxhash.h32(str, seed);
    
    switch (format) {
      case 'hex':
        return result.toString(16);
      case 'base64':
        return Buffer.from(result.toString(16), 'hex').toString('base64');
      case 'number':
      default:
        return result;
    }
  }
}

// =============================================================================
// CONSISTENT HASHING
// =============================================================================

/**
 * Creates a consistent hash for sharding/distribution.
 * 
 * @param value - Value to hash
 * @param buckets - Number of buckets
 * @param seed - Optional seed
 * @returns Bucket index (0 to buckets-1)
 * 
 * @example
 * ```typescript
 * // Shard data across servers
 * const serverIndex = await consistentHash(userId, numServers);
 * 
 * // Consistent sampling
 * const shouldSample = await consistentHash(requestId, 100) < sampleRate;
 * ```
 */
export async function consistentHash(
  value: string,
  buckets: number,
  seed = 0
): Promise<number> {
  const hash = await hashString(value, { seed, format: 'number' }) as number;
  return Math.abs(hash) % buckets;
}

// =============================================================================
// ID GENERATION
// =============================================================================

/**
 * Generates a deterministic ID from parts.
 * 
 * @param parts - Parts to combine into ID
 * @returns Deterministic ID string
 * 
 * @example
 * ```typescript
 * // Generate cache keys
 * const cacheKey = await deterministicId('user', userId, 'profile');
 * 
 * // Create consistent identifiers
 * const eventId = await deterministicId('event', timestamp, userId, action);
 * ```
 */
export async function deterministicId(...parts: (string | number | boolean | null | undefined)[]): Promise<string> {
  // Create object structure for consistent hashing
  const obj = { parts: parts.filter(p => p != null) };
  
  // Use SHA1 for good distribution and reasonable length
  const hash = await hashObject(obj, {
    algorithm: 'sha1',
    encoding: 'hex',
  });
  
  // Take first 16 chars for a reasonable ID length
  return hash.substring(0, 16);
}

// =============================================================================
// MASKING
// =============================================================================

/**
 * Creates a masked version of a value.
 * 
 * @param value - String to mask
 * @param mask - Mask pattern or function
 * @returns Masked string
 * 
 * @example
 * ```typescript
 * // Simple mask
 * createMaskedValue('password123', '*');
 * // '***********'
 * 
 * // Pattern mask
 * createMaskedValue('1234567890', 'XXX-XXX-XXXX');
 * // '123-456-7890'
 * 
 * // Function mask
 * createMaskedValue('secret', (char, i) => i < 2 ? char : '*');
 * // 'se****'
 * ```
 */
export function createMaskedValue(
  value: string,
  mask: string | ((char: string, index: number) => string)
): string {
  if (!value || typeof value !== 'string') {
    return '';
  }
  
  // Function mask
  if (typeof mask === 'function') {
    return value.split('').map((char, i) => mask(char, i)).join('');
  }
  
  // Pattern mask (e.g., 'XXX-XXX-XXXX')
  if (mask.includes('X')) {
    let result = '';
    let valueIndex = 0;
    
    for (const maskChar of mask) {
      if (maskChar === 'X' && valueIndex < value.length) {
        result += value[valueIndex++];
      } else {
        result += maskChar;
      }
    }
    
    return result;
  }
  
  // Simple character mask
  return mask.repeat(value.length);
}

// =============================================================================
// ANONYMIZATION
// =============================================================================

/**
 * Anonymizes data while preserving structure.
 * 
 * Replaces sensitive data with anonymous values while maintaining
 * data types and optionally lengths. Useful for test data generation
 * and privacy compliance.
 * 
 * @param data - Data to anonymize
 * @param options - Anonymization options
 * @returns Anonymized copy of data
 * 
 * @example
 * ```typescript
 * const user = {
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   age: 30,
 *   active: true
 * };
 * 
 * const anonymous = anonymize(user, {
 *   preserveTypes: true,
 *   deterministicSeed: 'test'
 * });
 * // {
 * //   name: 'Xxxx Xxx',
 * //   email: 'xxxx@xxxxxxx.xxx',
 * //   age: 99,
 * //   active: true
 * // }
 * ```
 */
export async function anonymize<T>(
  data: T,
  options: AnonymizeOptions = {}
): Promise<T> {
  const {
    preserveTypes = true,
    preserveLength = false,
    deterministicSeed,
    skipFields = [],
    maxDepth = 10,
  } = options;
  
  // Create a deterministic random generator if seed provided
  const getRandom = deterministicSeed
    ? await createSeededRandom(deterministicSeed)
    : Math.random;
  
  function anonymizeValue(value: unknown, key: string, depth: number): unknown {
    if (depth > maxDepth) {
      return '[MAX DEPTH]';
    }
    
    // Skip specified fields
    if (skipFields.includes(key)) {
      return value;
    }
    
    // Handle null/undefined
    if (value === null || value === undefined) {
      return value;
    }
    
    // Handle strings
    if (typeof value === 'string') {
      if (!preserveTypes) {
        return '[ANONYMIZED]';
      }
      
      // Check for common patterns
      if (value.includes('@')) {
        // Email-like string
        const parts = value.split('@');
        const userLen = preserveLength ? parts[0]?.length || 0 : Math.floor(getRandom() * 10) + 3;
        const domainParts = parts[1]?.split('.') || ['example', 'com'];
        const domainLen = preserveLength ? domainParts[0]?.length || 0 : Math.floor(getRandom() * 8) + 3;
        
        return `${'x'.repeat(userLen)}@${'x'.repeat(domainLen)}.${domainParts[domainParts.length - 1]}`;
      }
      
      // Regular string
      const length = preserveLength ? value.length : Math.floor(getRandom() * 20) + 5;
      return 'X'.repeat(Math.min(length, 100));
    }
    
    // Handle numbers
    if (typeof value === 'number') {
      if (!preserveTypes) {
        return 0;
      }
      
      // Preserve integer vs float
      if (Number.isInteger(value)) {
        return Math.floor(getRandom() * 100);
      } else {
        return parseFloat((getRandom() * 100).toFixed(2));
      }
    }
    
    // Handle booleans
    if (typeof value === 'boolean') {
      return preserveTypes ? getRandom() > 0.5 : false;
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      const length = preserveLength ? value.length : Math.floor(getRandom() * 5) + 1;
      const result: unknown[] = [];
      
      for (let i = 0; i < length; i++) {
        const sourceValue = value[i] || value[0]; // Use first element as template
        result.push(anonymizeValue(sourceValue, `${key}[${i}]`, depth + 1));
      }
      
      return result;
    }
    
    // Handle objects
    if (typeof value === 'object') {
      const result: Record<string, unknown> = {};
      
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        result[k] = anonymizeValue(v, `${key}.${k}`, depth + 1);
      }
      
      return result;
    }
    
    // Other types pass through
    return value;
  }
  
  return anonymizeValue(data, '', 0) as T;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Creates a seeded random number generator.
 * 
 * @param seed - Seed string
 * @returns Random number generator function
 */
async function createSeededRandom(seed: string): Promise<() => number> {
  let hash = await hashString(seed, { format: 'number' }) as number;
  
  return (): number => {
    // Simple linear congruential generator
    hash = ((hash * 1664525 + 1013904223) >>> 0);
    return (hash >>> 0) / 0xFFFFFFFF;
  };
}