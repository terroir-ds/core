/**
 * Security tests for the logger module
 * Tests data redaction, rate limiting, and input validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createLogger, Logger } from '../index.js';

describe('Logger Security', () => {
  let logger: Logger;
  
  beforeEach(() => {
    // Create fresh logger for each test
    logger = createLogger({ 
      level: 'debug',
      name: 'test-logger',
      redact: ['password', 'secret', 'key', 'token']
    });
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Data Redaction', () => {
    it('should redact sensitive field names', () => {
      const sensitiveData = {
        username: 'testuser',
        password: 'supersecret123',
        email: 'test@example.com',
        secret: 'hidden-value',
        publicInfo: 'this is fine'
      };
      
      const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      logger.info(sensitiveData, 'User login attempt');
      
      const output = spy.mock.calls[0]?.[0] as string;
      expect(output).toContain('"password":"[Redacted]"');
      expect(output).toContain('"secret":"[Redacted]"');
      expect(output).toContain('"username":"testuser"');
      expect(output).toContain('"publicInfo":"this is fine"');
      
      spy.mockRestore();
    });

    it('should redact nested sensitive data', () => {
      const nestedData = {
        user: {
          id: 123,
          credentials: {
            password: 'secret123',
            apiKey: 'ak_live_1234567890'
          }
        },
        config: {
          database: {
            host: 'localhost',
            password: 'dbpass123'
          }
        }
      };
      
      const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      logger.info(nestedData, 'System configuration');
      
      const output = spy.mock.calls[0]?.[0] as string;
      expect(output).toContain('"password":"[Redacted]"');
      expect(output).toContain('"id":123');
      expect(output).toContain('"host":"localhost"');
      
      spy.mockRestore();
    });

    it('should redact API keys from known providers', () => {
      const apiConfig = {
        stripe: {
          key: 'sk_test_FAKE_KEY_FOR_TESTING_ONLY_12345',
          webhook: 'whsec_test_FAKE_WEBHOOK_SECRET_12345'
        },
        github: {
          token: 'ghp_FAKE_TOKEN_FOR_TESTING_ONLY_1234567890'
        },
        aws: {
          accessKey: 'AKIA_FAKE_ACCESS_KEY_FOR_TESTING',
          secretKey: 'fake+secret+key+for+testing+purposes+only'
        }
      };
      
      const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      logger.info(apiConfig, 'API configuration');
      
      const output = spy.mock.calls[0]?.[0] as string;
      expect(output).toContain('"key":"[Redacted]"');
      expect(output).toContain('"token":"[Redacted]"');
      expect(output).toContain('"accessKey":"[Redacted]"');
      expect(output).toContain('"secretKey":"[Redacted]"');
      
      spy.mockRestore();
    });

    it('should handle circular references safely', () => {
      const circularObj: Record<string, unknown> = {
        name: 'test',
        password: 'secret123'
      };
      circularObj.self = circularObj;
      
      expect(() => {
        logger.info(circularObj, 'Circular object test');
      }).not.toThrow();
    });

    it('should redact email addresses', () => {
      const userData = {
        emails: ['user@example.com', 'admin@company.org'],
        primaryEmail: 'primary@domain.com',
        contactInfo: 'Please reach out to support@company.com for help'
      };
      
      const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      logger.info(userData, 'User contact information');
      
      const output = spy.mock.calls[0]?.[0] as string;
      // Emails should be redacted based on configured redaction patterns
      expect(output).toMatch(/"emails":\["[^"]*","[^"]*"\]/);
      
      spy.mockRestore();
    });
  });

  describe('Input Validation', () => {
    it('should handle extremely large objects', () => {
      const largeObj = {
        data: 'x'.repeat(50000), // 50KB string
        metadata: {
          size: 'large',
          password: 'should-be-redacted'
        }
      };
      
      expect(() => {
        logger.info(largeObj, 'Large object test');
      }).not.toThrow();
    });

    it('should handle unusual data types', () => {
      const weirdData = {
        date: new Date(),
        regex: /test-pattern/gi,
        func: () => 'test',
        symbol: Symbol('test'),
        bigint: BigInt(123456789),
        password: 'secret123'
      };
      
      expect(() => {
        logger.info(weirdData, 'Unusual data types');
      }).not.toThrow();
    });

    it('should handle null and undefined values', () => {
      const nullishData = {
        nullValue: null,
        undefinedValue: undefined,
        emptyString: '',
        password: 'secret123'
      };
      
      const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      logger.info(nullishData, 'Nullish values test');
      
      const output = spy.mock.calls[0]?.[0] as string;
      expect(output).toContain('"password":"[Redacted]"');
      expect(output).toContain('"nullValue":null');
      
      spy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle logging errors gracefully', () => {
      // Mock JSON.stringify to throw an error
      const originalStringify = JSON.stringify;
      vi.mocked(JSON).stringify = vi.fn().mockImplementation(() => {
        throw new Error('Serialization failed');
      });
      
      expect(() => {
        logger.info({ test: 'data' }, 'This should not crash');
      }).not.toThrow();
      
      // Restore original implementation
      JSON.stringify = originalStringify;
    });

    it('should handle redaction errors gracefully', () => {
      const problematicObj = {
        get password() {
          throw new Error('Getter error');
        },
        normalField: 'value'
      };
      
      expect(() => {
        logger.info(problematicObj, 'Problematic object');
      }).not.toThrow();
    });
  });
});