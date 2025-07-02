/**
 * @module @utils/security/__tests__/hashing.test.ts
 * 
 * Tests for hashing utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  hashObject,
  hashString,
  consistentHash,
  deterministicId,
  createMaskedValue,
  anonymize,
} from '@utils/security/hashing';

describe('Hashing Utilities', () => {
  describe('hashObject', () => {
    it('should create consistent hashes for objects', async () => {
      const obj = { name: 'John', age: 30 };
      
      const hash1 = await hashObject(obj);
      const hash2 = await hashObject(obj);
      
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('string');
      expect(hash1.length).toBeGreaterThan(0);
    });

    it('should create different hashes for different objects', async () => {
      const obj1 = { name: 'John', age: 30 };
      const obj2 = { name: 'Jane', age: 25 };
      
      const hash1 = await hashObject(obj1);
      const hash2 = await hashObject(obj2);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should ignore key order by default', async () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { b: 2, a: 1 };
      
      const hash1 = await hashObject(obj1);
      const hash2 = await hashObject(obj2);
      
      expect(hash1).toBe(hash2);
    });

    it('should support different algorithms', async () => {
      const obj = { test: 'data' };
      
      const sha1 = await hashObject(obj, { algorithm: 'sha1' });
      const sha256 = await hashObject(obj, { algorithm: 'sha256' });
      const md5 = await hashObject(obj, { algorithm: 'md5' });
      
      expect(sha1).not.toBe(sha256);
      expect(sha1).not.toBe(md5);
      expect(sha256).not.toBe(md5);
    });

    it('should exclude specified keys', async () => {
      const obj1 = { id: 1, name: 'John', timestamp: Date.now() };
      const obj2 = { id: 2, name: 'John', timestamp: Date.now() + 1000 };
      
      const hash1 = await hashObject(obj1, { excludeKeys: (key) => ['id', 'timestamp'].includes(key) });
      const hash2 = await hashObject(obj2, { excludeKeys: (key) => ['id', 'timestamp'].includes(key) });
      
      expect(hash1).toBe(hash2);
    });

    it('should handle nested objects', async () => {
      const obj = {
        user: {
          name: 'John',
          profile: {
            age: 30,
            city: 'NYC',
          },
        },
      };
      
      const hash = await hashObject(obj);
      expect(hash).toBeTruthy();
    });

    it('should handle arrays', async () => {
      const obj1 = { items: [1, 2, 3] };
      const obj2 = { items: [1, 2, 3] };
      const obj3 = { items: [3, 2, 1] };
      
      const hash1 = await hashObject(obj1);
      const hash2 = await hashObject(obj2);
      const hash3 = await hashObject(obj3);
      
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
    });

    it('should handle special values', async () => {
      const obj = {
        null: null,
        undefined: undefined,
        boolean: true,
        number: 123,
        date: new Date('2023-01-01'),
      };
      
      const hash = await hashObject(obj);
      expect(hash).toBeTruthy();
    });

    it('should be deterministic with encoding', async () => {
      const obj = { emoji: '😀', unicode: '你好' };
      
      const hash1 = await hashObject(obj, { encoding: 'hex' });
      const hash2 = await hashObject(obj, { encoding: 'hex' });
      
      expect(hash1).toBe(hash2);
      
      const base64 = await hashObject(obj, { encoding: 'base64' });
      expect(base64).not.toBe(hash1);
    });
  });

  describe('hashString', () => {
    it('should create consistent hashes for strings', async () => {
      const str = 'Hello, World!';
      
      const hash1 = await hashString(str);
      const hash2 = await hashString(str);
      
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('number'); // Default format is 'number'
    });

    it('should create different hashes for different strings', async () => {
      const hash1 = await hashString('Hello');
      const hash2 = await hashString('World');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should support different formats', async () => {
      const str = 'test';
      
      const hash32 = await hashString(str, { use64bit: false });
      const hash64 = await hashString(str, { use64bit: true });
      
      expect(hash32).not.toBe(hash64);
      expect(typeof hash32).toBe('number');
      expect(typeof hash64).toBe('string'); // 64-bit returns string
    });

    it('should use seed for reproducibility', async () => {
      const str = 'test';
      
      const hash1 = await hashString(str, { seed: 12345 });
      const hash2 = await hashString(str, { seed: 12345 });
      const hash3 = await hashString(str, { seed: 54321 });
      
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
    });

    it('should handle format options', async () => {
      const str = 'test';
      
      const hex = await hashString(str, { format: 'hex' });
      const base64 = await hashString(str, { format: 'base64' });
      const num = await hashString(str, { format: 'number' });
      
      expect(/^[0-9a-f]+$/.test(hex as string)).toBe(true);
      expect(/^[A-Za-z0-9+/=]+$/.test(base64 as string)).toBe(true);
      expect(typeof num).toBe('number');
    });

    it('should handle empty strings', async () => {
      const hash = await hashString('');
      expect(hash).toBeTruthy();
    });

    it('should handle unicode strings', async () => {
      const hash1 = await hashString('Hello 😀');
      const hash2 = await hashString('Hello 🎉');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should be performant for large strings', async () => {
      const largeStr = 'x'.repeat(1000000); // 1MB
      
      const start = performance.now();
      await hashString(largeStr);
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(50); // Should be very fast
    });
  });

  describe('consistentHash', () => {
    it('should distribute keys across buckets', async () => {
      const numBuckets = 3;
      
      const results = new Map<number, number>();
      for (let i = 0; i < numBuckets; i++) {
        results.set(i, 0);
      }
      
      // Hash many keys
      for (let i = 0; i < 1000; i++) {
        const bucket = await consistentHash(`key${i}`, numBuckets);
        results.set(bucket, (results.get(bucket) ?? 0) + 1);
      }
      
      // Check distribution (should be roughly even)
      for (const count of results.values()) {
        expect(count).toBeGreaterThan(200); // At least 20%
        expect(count).toBeLessThan(500); // At most 50%
      }
    });

    it('should be consistent for same key', async () => {
      const numBuckets = 4;
      
      const result1 = await consistentHash('mykey', numBuckets);
      const result2 = await consistentHash('mykey', numBuckets);
      
      expect(result1).toBe(result2);
    });

    it('should minimize redistribution when adding buckets', async () => {
      const numBuckets1 = 3;
      const numBuckets2 = 4;
      
      let moved = 0;
      const total = 1000;
      
      for (let i = 0; i < total; i++) {
        const key = `key${i}`;
        const bucket1 = await consistentHash(key, numBuckets1);
        const bucket2 = await consistentHash(key, numBuckets2);
        
        if (bucket1 !== bucket2) {
          moved++;
        }
      }
      
      // Should move approximately 1/4 of keys (1/n where n is new bucket count)
      const expectedMoveRatio = 1 / numBuckets2;
      const actualMoveRatio = moved / total;
      
      expect(actualMoveRatio).toBeGreaterThan(expectedMoveRatio * 0.7);
      expect(actualMoveRatio).toBeLessThan(expectedMoveRatio * 1.3);
    });

    it('should handle edge cases', async () => {
      expect(await consistentHash('key', 1)).toBe(0);
      expect(await consistentHash('key', 100)).toBeLessThan(100);
    });

    it('should use seed for different distributions', async () => {
      const numBuckets = 2;
      
      const result1 = await consistentHash('mykey', numBuckets, 123);
      const result2 = await consistentHash('mykey', numBuckets, 456);
      
      // Different seeds may produce different results
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });

  describe('deterministicId', () => {
    it('should generate consistent IDs for same input', async () => {
      const id1 = await deterministicId('user', 'john', 'action', 'login');
      const id2 = await deterministicId('user', 'john', 'action', 'login');
      
      expect(id1).toBe(id2);
    });

    it('should generate different IDs for different input', async () => {
      const id1 = await deterministicId('user', 'john', 'action');
      const id2 = await deterministicId('user', 'jane', 'action');
      
      expect(id1).not.toBe(id2);
    });

    it('should handle multiple parts', async () => {
      const id1 = await deterministicId('user', 123, true, null, undefined);
      const id2 = await deterministicId('user', 123, true);
      
      expect(id1).toBe(id2); // null and undefined are filtered out
      expect(id1).toMatch(/^[a-f0-9]{16}$/); // 16 char hex string
    });

    it('should handle various data types', async () => {
      const id1 = await deterministicId('string', 123, true, false);
      const id2 = await deterministicId('string', 123, true, false);
      
      expect(id1).toBe(id2);
      expect(id1).toMatch(/^[a-f0-9]{16}$/);
    });

    it('should be order sensitive', async () => {
      const id1 = await deterministicId('user', 'john', 'action');
      const id2 = await deterministicId('action', 'john', 'user');
      
      expect(id1).not.toBe(id2);
    });
  });

  describe('createMaskedValue', () => {
    it('should create masked values with simple mask', () => {
      const masked = createMaskedValue('secret-key-123', '*');
      
      expect(masked).toBe('**************');
    });

    it('should mask with pattern', () => {
      const masked = createMaskedValue('1234567890', 'XXX-XXX-XXXX');
      
      expect(masked).toBe('123-456-7890');
    });

    it('should mask with function', () => {
      const masked = createMaskedValue('secret', (char, i) => i < 2 ? char : '*');
      expect(masked).toBe('se****');
    });

    it('should handle empty values', () => {
      const masked = createMaskedValue('', '*');
      expect(masked).toBe('');
    });

    it('should handle special characters in mask', () => {
      const masked = createMaskedValue('test', '#');
      expect(masked).toBe('####');
    });
  });

  describe('anonymize', () => {
    it('should anonymize personal data', async () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      };
      
      const result = await anonymize(data, {
        skipFields: ['age'],
      });
      
      expect(result.name).not.toBe('John Doe');
      expect(result.name).toMatch(/^X+$/);
      expect(result.email).not.toBe('john@example.com');
      expect(result.email).toMatch(/^x+@x+\.com$/);
      expect(result.age).toBe(30); // age was skipped
    });

    it('should preserve data types', async () => {
      const data = {
        userId: 12345,
        score: 98.5,
        active: true,
      };
      
      const result = await anonymize(data, {
        preserveTypes: true,
      });
      
      expect(typeof result.userId).toBe('number');
      expect(typeof result.score).toBe('number');
      expect(typeof result.active).toBe('boolean');
      expect(result.userId).not.toBe(12345);
    });

    it('should use consistent mapping', async () => {
      const data1 = { email: 'john@example.com' };
      const data2 = { email: 'john@example.com' };
      
      const result1 = await anonymize(data1, {
        deterministicSeed: 'test-seed',
      });
      
      const result2 = await anonymize(data2, {
        deterministicSeed: 'test-seed',
      });
      
      expect(result1.email).toBe(result2.email);
    });

    it('should handle nested fields', async () => {
      const data = {
        user: {
          personal: {
            name: 'John',
            ssn: '123-45-6789',
          },
          account: {
            id: 'acc123',
          },
        },
      };
      
      const result = await anonymize(data, {
        skipFields: ['user.account.id'],
      });
      
      expect(result.user.personal.name).not.toBe('John');
      expect(result.user.personal.ssn).not.toBe('123-45-6789');
      expect(result.user.account.id).toBe('acc123');
    });

    it('should preserve length when requested', async () => {
      const data = { phone: '555-1234' };
      
      const result = await anonymize(data, {
        preserveLength: true,
        preserveTypes: true,
      });
      
      expect(result.phone).toHaveLength(8);
      expect(result.phone).not.toBe('555-1234');
    });

    it('should handle arrays', async () => {
      const data = {
        users: [
          { name: 'John', id: 1 },
          { name: 'Jane', id: 2 },
        ],
      };
      
      const result = await anonymize(data, {
        skipFields: ['users[0].id', 'users[1].id'],
      });
      
      expect(result.users).toBeDefined();
      if (result.users && Array.isArray(result.users) && result.users[0] && result.users[1]) {
        expect(result.users[0].name).not.toBe('John');
        expect(result.users[1].name).not.toBe('Jane');
        expect(result.users[0].id).toBe(1);
        expect(result.users[1].id).toBe(2);
      }
    });
  });
});