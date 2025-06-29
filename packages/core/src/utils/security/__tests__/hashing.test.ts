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
} from '../hashing.js';

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
      
      const hash1 = await hashObject(obj1, { excludeKeys: ['id', 'timestamp'] });
      const hash2 = await hashObject(obj2, { excludeKeys: ['id', 'timestamp'] });
      
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
      expect(typeof hash1).toBe('string');
    });

    it('should create different hashes for different strings', async () => {
      const hash1 = await hashString('Hello');
      const hash2 = await hashString('World');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should support different algorithms', async () => {
      const str = 'test';
      
      const xxhash32 = await hashString(str, { algorithm: 'xxhash32' });
      const xxhash64 = await hashString(str, { algorithm: 'xxhash64' });
      
      expect(xxhash32).not.toBe(xxhash64);
      expect(xxhash32.length).toBeLessThan(xxhash64.length);
    });

    it('should use seed for reproducibility', async () => {
      const str = 'test';
      
      const hash1 = await hashString(str, { seed: 12345 });
      const hash2 = await hashString(str, { seed: 12345 });
      const hash3 = await hashString(str, { seed: 54321 });
      
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
    });

    it('should handle encoding options', async () => {
      const str = 'test';
      
      const hex = await hashString(str, { encoding: 'hex' });
      const base64 = await hashString(str, { encoding: 'base64' });
      const buffer = await hashString(str, { encoding: 'buffer' });
      
      expect(/^[0-9a-f]+$/.test(hex)).toBe(true);
      expect(/^[A-Za-z0-9+/=]+$/.test(base64)).toBe(true);
      expect(buffer).toBeInstanceOf(Uint8Array);
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
    it('should distribute keys across buckets', () => {
      const buckets = ['server1', 'server2', 'server3'];
      
      const results = new Map<string, number>();
      for (const bucket of buckets) {
        results.set(bucket, 0);
      }
      
      // Hash many keys
      for (let i = 0; i < 1000; i++) {
        const bucket = consistentHash(`key${i}`, buckets);
        results.set(bucket, results.get(bucket)! + 1);
      }
      
      // Check distribution (should be roughly even)
      for (const count of results.values()) {
        expect(count).toBeGreaterThan(200); // At least 20%
        expect(count).toBeLessThan(500); // At most 50%
      }
    });

    it('should be consistent for same key', () => {
      const buckets = ['a', 'b', 'c', 'd'];
      
      const result1 = consistentHash('mykey', buckets);
      const result2 = consistentHash('mykey', buckets);
      
      expect(result1).toBe(result2);
    });

    it('should minimize redistribution when adding buckets', () => {
      const buckets1 = ['a', 'b', 'c'];
      const buckets2 = ['a', 'b', 'c', 'd'];
      
      let moved = 0;
      const total = 1000;
      
      for (let i = 0; i < total; i++) {
        const key = `key${i}`;
        const bucket1 = consistentHash(key, buckets1);
        const bucket2 = consistentHash(key, buckets2);
        
        if (bucket1 !== bucket2) {
          moved++;
        }
      }
      
      // Should move approximately 1/4 of keys (1/n where n is new bucket count)
      const expectedMoveRatio = 1 / buckets2.length;
      const actualMoveRatio = moved / total;
      
      expect(actualMoveRatio).toBeGreaterThan(expectedMoveRatio * 0.7);
      expect(actualMoveRatio).toBeLessThan(expectedMoveRatio * 1.3);
    });

    it('should handle empty buckets', () => {
      expect(() => consistentHash('key', [])).toThrow();
    });

    it('should support custom replicas', () => {
      const buckets = ['a', 'b'];
      const options = { replicas: 100 };
      
      // With more replicas, distribution should be more even
      const results = new Map<string, number>();
      for (const bucket of buckets) {
        results.set(bucket, 0);
      }
      
      for (let i = 0; i < 1000; i++) {
        const bucket = consistentHash(`key${i}`, buckets, options);
        results.set(bucket, results.get(bucket)! + 1);
      }
      
      const counts = Array.from(results.values());
      const diff = Math.abs(counts[0] - counts[1]);
      expect(diff).toBeLessThan(100); // Should be well balanced
    });
  });

  describe('deterministicId', () => {
    it('should generate consistent IDs for same input', async () => {
      const data = { user: 'john', action: 'login' };
      
      const id1 = await deterministicId(data);
      const id2 = await deterministicId(data);
      
      expect(id1).toBe(id2);
    });

    it('should generate different IDs for different input', async () => {
      const id1 = await deterministicId({ user: 'john' });
      const id2 = await deterministicId({ user: 'jane' });
      
      expect(id1).not.toBe(id2);
    });

    it('should support custom length', async () => {
      const data = { test: 'data' };
      
      const id8 = await deterministicId(data, { length: 8 });
      const id16 = await deterministicId(data, { length: 16 });
      const id32 = await deterministicId(data, { length: 32 });
      
      expect(id8.length).toBe(8);
      expect(id16.length).toBe(16);
      expect(id32.length).toBe(32);
    });

    it('should support custom prefix', async () => {
      const data = { test: 'data' };
      
      const id = await deterministicId(data, { prefix: 'user_' });
      
      expect(id).toMatch(/^user_[a-z0-9]+$/);
    });

    it('should handle complex objects', async () => {
      const data = {
        nested: {
          array: [1, 2, 3],
          date: new Date('2023-01-01'),
        },
      };
      
      const id = await deterministicId(data);
      expect(id).toMatch(/^[a-z0-9]+$/);
    });
  });

  describe('createMaskedValue', () => {
    it('should create consistent masked values', () => {
      const masked1 = createMaskedValue('secret-key-123');
      const masked2 = createMaskedValue('secret-key-123');
      
      expect(masked1).toBe(masked2);
      expect(masked1).toMatch(/^[A-Z0-9]+$/);
    });

    it('should create different masks for different values', () => {
      const masked1 = createMaskedValue('key1');
      const masked2 = createMaskedValue('key2');
      
      expect(masked1).not.toBe(masked2);
    });

    it('should support custom length', () => {
      const masked = createMaskedValue('test', { length: 12 });
      expect(masked.length).toBe(12);
    });

    it('should support custom format', () => {
      const masked = createMaskedValue('test', {
        format: 'XXXX-XXXX-XXXX',
      });
      
      expect(masked).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    });

    it('should use custom character set', () => {
      const masked = createMaskedValue('test', {
        characters: '0123456789',
        length: 6,
      });
      
      expect(masked).toMatch(/^[0-9]{6}$/);
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
        fields: ['name', 'email'],
      });
      
      expect(result.name).not.toBe('John Doe');
      expect(result.name).toMatch(/^USER_[A-Z0-9]+$/);
      expect(result.email).not.toBe('john@example.com');
      expect(result.age).toBe(30);
    });

    it('should preserve data types', async () => {
      const data = {
        userId: 12345,
        score: 98.5,
        active: true,
      };
      
      const result = await anonymize(data, {
        fields: ['userId', 'score', 'active'],
        preserveType: true,
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
        fields: ['email'],
        consistent: true,
      });
      
      const result2 = await anonymize(data2, {
        fields: ['email'],
        consistent: true,
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
        fields: ['user.personal.name', 'user.personal.ssn'],
      });
      
      expect(result.user.personal.name).not.toBe('John');
      expect(result.user.personal.ssn).not.toBe('123-45-6789');
      expect(result.user.account.id).toBe('acc123');
    });

    it('should support custom anonymizer', async () => {
      const data = { phone: '555-1234' };
      
      const result = await anonymize(data, {
        fields: ['phone'],
        customAnonymizer: (value, field) => {
          if (field === 'phone') {
            return 'XXX-XXXX';
          }
          return value;
        },
      });
      
      expect(result.phone).toBe('XXX-XXXX');
    });

    it('should handle arrays', async () => {
      const data = {
        users: [
          { name: 'John', id: 1 },
          { name: 'Jane', id: 2 },
        ],
      };
      
      const result = await anonymize(data, {
        fields: ['users[*].name'],
      });
      
      expect(result.users[0].name).not.toBe('John');
      expect(result.users[1].name).not.toBe('Jane');
      expect(result.users[0].id).toBe(1);
      expect(result.users[1].id).toBe(2);
    });
  });
});